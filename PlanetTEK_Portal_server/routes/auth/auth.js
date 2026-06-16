// routes/auth/auth.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
const verifyToken = require("../../middleware/auth.js"); // Harici zırhımız

// DB Pool Yapılandırması
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
});

const SECRET_KEY = process.env.JWT_SECRET;

// 🚀 SEYİS DOKUNUŞU: Geliştirme ortamına göre çerez ayarlarını otomatik belirle
// Lokal ortamda (development) secure: false ve sameSite: "lax" olur, tarayıcı engellemez.
// Canlı ortamda (production) secure: true ve sameSite: "none" (veya domain altındaysa "lax") olur, siber zırh kuşanır.
const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // 🔓 Lokalde false (HTTP çalışabilsin diye), canlıda true (HTTPS zorunlu)!
    sameSite: isProduction ? "none" : "lax",
    path: "/", // Çerezlerin tüm rotalarda geçerli kalması için mühürlüyoruz
};

// ==========================================
// 🚀 1. GİRİŞ ENDPOINT'İ (POST /auth/login)
// ==========================================
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Kullanıcı adı veya şifre eksik." });
    }

    try {
        const [rows] = await pool.execute(
            "SELECT id, isim, eposta, sifre_hash, rol, durum FROM users WHERE isim = ? LIMIT 1",
            [username.trim()]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: "Kullanıcı adı veya şifre hatalı." });
        }

        const user = rows[0];

        if (user.durum !== "Aktif") {
            return res.status(403).json({ message: "Hesabınız aktif değil veya askıya alınmış." });
        }

        const match = await bcrypt.compare(password, user.sifre_hash);
        if (!match) {
            return res.status(401).json({ message: "Kullanıcı adı veya şifre hatalı." });
        }

        // 🌟 1. Access Token (1 Saat)
        const accessToken = jwt.sign(
            { id: user.id, role: user.rol },
            SECRET_KEY,
            { expiresIn: "1h", algorithm: "HS256" }
        );

        // 🌟 2. Refresh Token (7 Gün)
        const refreshToken = jwt.sign(
            { id: user.id },
            SECRET_KEY,
            { expiresIn: "7d", algorithm: "HS256" }
        );

        await pool.execute(
            "UPDATE users SET token = ?, sonGiris = NOW() WHERE id = ?",
            [refreshToken, user.id]
        );

        // Dinamik cookie'leri basıyoruz
        res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: 60 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
            message: "Giriş başarılı.",
            user: { id: user.id, name: user.isim, role: user.rol },
        });

    } catch (error) {
        console.error("Login Error:", error.message);
        return res.status(500).json({ message: "Giriş işlemi sırasında teknik bir hata oluştu." });
    }
});

// ==========================================
// 🔄 2. YENİLEME ENDPOINT'İ (POST /auth/refresh)
// ==========================================
router.post("/refresh", async (req, res) => {
    const clientRefreshToken = req.signedCookies?.refreshToken || req.cookies?.refreshToken;

    if (!clientRefreshToken) {
        return res.status(401).json({ message: "Refresh token bulunamadı." });
    }

    try {
        const decoded = jwt.verify(clientRefreshToken, SECRET_KEY);

        const [rows] = await pool.execute(
            "SELECT id, isim, rol, token FROM users WHERE id = ? LIMIT 1",
            [decoded.id]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: "Kullanıcı bulunamadı." });
        }

        const user = rows[0];

        if (user.token !== clientRefreshToken) {
            return res.status(401).json({ message: "Geçersiz oturum zinciri." });
        }

        const newAccessToken = jwt.sign(
            { id: user.id, role: user.rol },
            SECRET_KEY,
            { expiresIn: "1h", algorithm: "HS256" }
        );

        // 🚀 DÜZELTME: Refresh anında basılan çerez de artık dinamik ayarlara uyar, lokalde patlamaz!
        res.cookie("accessToken", newAccessToken, {
            ...cookieOptions,
            maxAge: 60 * 60 * 1000,
        });

        return res.json({ message: "Oturum başarıyla yenilendi." });

    } catch (error) {
        console.error("Refresh Error:", error.message);
        return res.status(401).json({ message: "Oturum süreniz dolmuş." });
    }
});

// ==========================================
// 👤 3. PROFİL ENDPOINT'İ (GET /auth/profile)
// ==========================================
router.get("/profile", verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT id, isim, rol FROM users WHERE id = ? LIMIT 1",
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Kullanıcı bulunamadı." });
        }

        return res.json({
            user: {
                id: rows[0].id,
                name: rows[0].isim,
                role: rows[0].rol
            }
        });
    } catch (error) {
        console.error("Profile Error:", error.message);
        return res.status(500).json({ message: "Sunucu hatası." });
    }
});

// ==========================================
// 🚪 4. ÇIKIŞ ENDPOINT'İ (POST /auth/logout)
// ==========================================
router.post("/logout", async (req, res) => {
    const clientRefreshToken = req.signedCookies?.refreshToken || req.cookies?.refreshToken;

    try {
        if (clientRefreshToken) {
            // 🚀 DÜZELTME: Senkron blokta patlamaması için doğrulama try-catch içine alındı
            const decoded = jwt.verify(clientRefreshToken, SECRET_KEY);
            if (decoded && decoded.id) {
                await pool.execute("UPDATE users SET token = NULL WHERE id = ?", [decoded.id]);
            }
        }
    } catch (err) {
        console.error("Logout DB Clean Error:", err.message);
    } finally {
        // Çerezleri temizlerken de aynı dinamik opsiyonları vermeliyiz ki tarayıcı silmeyi kabul etsin
        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);

        return res.json({ message: "Oturum başarıyla kapatıldı." });
    }
});

module.exports = router;