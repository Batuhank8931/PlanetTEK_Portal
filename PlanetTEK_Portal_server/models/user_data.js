const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

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
    const { username, email, password, role, department } = req.body;

    // CERT: Girdi Doğrulama
    if (!username || !email || !password) {
        return res.status(400).json({ message: "Kullanıcı adı, e-posta ve şifre zorunludur." });
    }

    try {
        // OWASP: E-posta adresi sistemde zaten var mı kontrolü (UNIQUE KEY çakışmasını engellemek için)
        const [existing] = await pool.execute("SELECT id FROM users WHERE eposta = ? LIMIT 1", [email.trim()]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "Bu e-posta adresi zaten sisteme kayıtlı." });
        }

        // CWE-257: Şifreyi veritabanına yazmadan önce bcrypt ile zırhlıyoruz
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // CWE-89: Prepared Statement ile SQL Injection engelleniyor
        const [result] = await pool.execute(
            "INSERT INTO users (isim, eposta, sifre_hash, rol, departman, durum) VALUES (?, ?, ?, ?, ?, 'Aktif')",
            [username.trim(), email.trim(), hashedPassword, role || 'Kullanıcı', department || null]
        );

        return res.status(201).json({
            message: "Kullanıcı başarıyla oluşturuldu.",
            userId: result.insertId
        });

    } catch (error) {
        console.error("addUser Error:", error.message);
        return res.status(500).json({ message: "Kullanıcı eklenirken hata oluştu.", error: error.message });
    }
};

// ==========================================
// 🔄 3. KULLANICI GÜNCELLEME
// ==========================================
const putUser = async (req, res) => {
    const { id } = req.params; // Güncellenecek kullanıcının ID'si URL'den geliyor (/user/:id)
    const { username, email, role, status, department, password } = req.body;

    try {
        // Kullanıcı var mı kontrolü
        const [userCheck] = await pool.execute("SELECT id FROM users WHERE id = ? LIMIT 1", [id]);
        if (userCheck.length === 0) {
            return res.status(404).json({ message: "Güncellenecek kullanıcı bulunamadı." });
        }

        let query = "UPDATE users SET isim = ?, eposta = ?, rol = ?, durum = ?, departman = ?";
        let params = [username.trim(), email.trim(), role, status, department || null];

        // 🚨 Eğer şifre de değiştirilmek isteniyorsa sürece dahil et
        if (password && password.trim() !== "") {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            query += ", sifre_hash = ?";
            params.push(hashedPassword);
        }

        query += " WHERE id = ?";
        params.push(id);

        await pool.execute(query, params);
        return res.json({ message: "Kullanıcı bilgileri başarıyla güncellendi." });

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
        // OWASP Veri Güvenliği: Eğer istersen kaydı tamamen silmek yerine durumu 'Pasif'e de çekebilirsin.
        // Biz burada veritabanından tamamen temizleme modelini uyguluyoruz:
        const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Silinecek kullanıcı bulunamadı." });
        }

        return res.json({ message: "Kullanıcı sistemden başarıyla temizlendi." });
    } catch (error) {
        console.error("deleteUser Error:", error.message);
        return res.status(500).json({ message: "Silme işlemi başarısız.", error: error.message });
    }
};

// Dışa aktarma uyuşmazlıkları düzeltildi babo
module.exports = { getUser, addUser, putUser, deleteUser };