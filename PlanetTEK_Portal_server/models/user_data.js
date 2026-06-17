const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const { logActivity } = require("../utils/logger.js");

// DB Pool Yapılandırması
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
});

// ==========================================
// 🔍 1. KULLANICI LİSTELEME / GETİRME
// ==========================================
const getUser = async (req, res) => {
    const { id } = req.query; // Eğer api/user?id=5 gelirse tek kullanıcı, gelmezse tüm liste

    try {
        if (id) {
            // OWASP: Hassas verileri (sifre_hash, token) asla dışarıya dönmüyoruz!
            const [rows] = await pool.execute(
                "SELECT id, isim, eposta, rol, durum, departman, sonGiris, created_at FROM users WHERE id = ? LIMIT 1",
                [id]
            );
            if (rows.length === 0) {
                return res.status(404).json({ message: "Kullanıcı bulunamadı." });
            }
            return res.json(rows[0]);
        } else {
            // Tüm aktif ve pasif kullanıcıların listesi
            const [rows] = await pool.execute(
                "SELECT id, isim, eposta, rol, durum, departman, sonGiris, created_at FROM users ORDER BY id DESC"
            );
            return res.json(rows);
        }
    } catch (error) {
        console.error("getUser Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

// ==========================================
// ➕ 2. YENİ KULLANICI EKLEME
// ==========================================
const addUser = async (req, res) => {
    // ... mevcut kodlar (validation, password hashing vs.) ...
    try {
        const [result] = await pool.execute(
            "INSERT INTO users (isim, eposta, sifre_hash, rol, departman, durum) VALUES (?, ?, ?, ?, ?, 'Aktif')",
            [username.trim(), email.trim(), hashedPassword, role, department]
        );

        // LOG AT
        await logActivity(req.user.id, {
            tip: "kullanici_ekleme",
            eklenen_kullanici_id: result.insertId,
            eklenen_eposta: email.trim(),
            rol: role
        });

        return res.status(201).json({ message: "Kullanıcı başarıyla oluşturuldu." });
    } catch (error) { /* ... */ }
};

// ==========================================
// 🔄 3. KULLANICI GÜNCELLEME
// ==========================================
const putUser = async (req, res) => {
    const { id } = req.params; // Güncellenecek kullanıcının ID'si
    const { username, email, role, status, department, password } = req.body;
    const adminId = req.user?.id; // İşlemi yapan admin/kullanıcının ID'si

    try {
        // 🔍 1. ADIM: Kullanıcının veritabanındaki mevcut (eski) bilgilerini çek
        const [userCheck] = await pool.execute(
            "SELECT isim, eposta, rol, durum, departman FROM users WHERE id = ? LIMIT 1",
            [id]
        );

        if (userCheck.length === 0) {
            return res.status(404).json({ message: "Güncellenecek kullanıcı bulunamadı." });
        }

        const oldData = userCheck[0];

        // 🔄 2. ADIM: SQL Sorgusunu hazırla ve çalıştır
        let query = "UPDATE users SET isim = ?, eposta = ?, rol = ?, durum = ?, departman = ?";
        let params = [username.trim(), email.trim(), role, status, department || null];
        let isPasswordChanged = false;

        // Eğer şifre de değiştirilmek isteniyorsa sürece dahil et
        if (password && password.trim() !== "") {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            query += ", sifre_hash = ?";
            params.push(hashedPassword);
            isPasswordChanged = true;
        }

        query += " WHERE id = ?";
        params.push(id);

        await pool.execute(query, params);

        // 📝 3. ADIM: Değişiklik Analizi Yap ve JSON olarak Logla
        const dinamikDegisiklikler = {};

        if (oldData.isim !== username.trim()) dinamikDegisiklikler.isim = { eski: oldData.isim, yeni: username.trim() };
        if (oldData.eposta !== email.trim()) dinamikDegisiklikler.eposta = { eski: oldData.eposta, yeni: email.trim() };
        if (oldData.rol !== role) dinamikDegisiklikler.rol = { eski: oldData.rol, yeni: role };
        if (oldData.durum !== status) dinamikDegisiklikler.durum = { eski: oldData.durum, yeni: status };
        if (oldData.departman !== (department || null)) dinamikDegisiklikler.departman = { eski: oldData.departman, yeni: department || null };
        if (isPasswordChanged) dinamikDegisiklikler.sifre = { mesaj: "Kullanıcı şifresi admin tarafından güncellendi." };

        // Eğer hiçbir alan değişmediyse boşuna log tablosunu şişirme
        if (Object.keys(dinamikDegisiklikler).length > 0) {
            const logPayload = {
                tip: "kullanici_guncelleme",
                hedef_kullanici_id: id,
                degisiklikler: dinamikDegisiklikler,
                tarih: new Date().toISOString()
            };

            // Log tablosuna asenkron olarak yaz
            await logActivity(adminId, logPayload);
        }

        return res.json({ message: "Kullanıcı bilgileri başarıyla güncellendi ve loglandı." });

    } catch (error) {
        console.error("putUser Error:", error.message);
        return res.status(500).json({ message: "Güncelleme esnasında teknik hata oluştu.", error: error.message });
    }
};

// ==========================================
// ❌ 4. KULLANICI SİLME
// ==========================================
const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Silmeden önce ismini/epostasını logda saklamak için çekebilirsin
        const [user] = await pool.execute("SELECT eposta FROM users WHERE id = ?", [id]);

        const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Bulunamadı" });

        // LOG AT
        await logActivity(req.user.id, {
            tip: "kullanici_silme",
            silinen_kullanici_id: id,
            silinen_eposta: user[0]?.eposta || "Bilinmiyor"
        });

        return res.json({ message: "Kullanıcı silindi." });
    } catch (error) { /* ... */ }
};

// Dışa aktarma uyuşmazlıkları düzeltildi babo
module.exports = { getUser, addUser, putUser, deleteUser };