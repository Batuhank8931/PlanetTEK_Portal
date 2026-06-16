const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

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

const loginHandler = async (req, res) => {
  const { username, password } = req.body;

  // CERT: Girdi Doğrulama
  if (!username || !password) {
    return res.status(400).json({ message: "Kullanıcı adı veya şifre eksik." });
  }

  try {
    // CWE-89: Prepared Statement ile kullanıcı kontrolü
    const [rows] = await pool.execute(
      "SELECT id, isim, eposta, sifre_hash, rol, durum FROM users WHERE isim = ? LIMIT 1",
      [username.trim()]
    );

    // OWASP & CWE-204: Kullanıcı yoksa jenerik mesaj
    if (rows.length === 0) {
      return res.status(401).json({ message: "Kullanıcı adı veya şifre hatalı." });
    }

    const user = rows[0];

    // Kullanıcı Durum Kontrolü
    if (user.durum !== "Aktif") {
      return res.status(403).json({ message: "Hesabınız aktif değil veya askıya alınmış." });
    }

    // CWE-257: Güvenli Şifre Karşılaştırma
    const match = await bcrypt.compare(password, user.sifre_hash);
    if (!match) {
      return res.status(401).json({ message: "Kullanıcı adı veya şifre hatalı." });
    }

    // 🌟 1. Access Token (1 Saat Geçerli)
    const accessToken = jwt.sign(
      { id: user.id, role: user.rol },
      SECRET_KEY,
      { expiresIn: "1h", algorithm: "HS256" } 
    );

    // 🌟 2. Refresh Token (7 Gün Geçerli)
    const refreshToken = jwt.sign(
      { id: user.id },
      SECRET_KEY,
      { expiresIn: "7d", algorithm: "HS256" }
    );

    // 💾 DB GÜNCELLEME: Veritabanındaki 'token' kolonuna Refresh Token'ı gömüyoruz
    await pool.execute(
      "UPDATE users SET token = ?, sonGiris = NOW() WHERE id = ?", 
      [refreshToken, user.id]
    );

    // 🍪 DEVELOPMENT UYUMLU COOKIE AYARLARI
    // secure: false -> HTTP protokolünde (local IP'lerde) çerezin yazılmasını sağlar.
    // sameSite: "lax" -> Tarayıcının yerel ağdaki isteklerde çerezi kabul etmesini sağlar.
    
    res.cookie("accessToken", accessToken, {
      httpOnly: true, 
      secure: false, // 🔓 Kilit kaldırıldı! Local http isteklerinde çalışır.
      sameSite: "lax", // 🔓 Local IP transferine izin verildi.
      maxAge: 60 * 60 * 1000, // 1 saat
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // 🔓 Kilit kaldırıldı!
      sameSite: "lax", // 🔓
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
    });

    return res.json({
      message: "Giriş başarılı.",
      user: { id: user.id, name: user.isim, role: user.rol },
    });

  } catch (error) {
    console.error("Authentication Error:", error.message);
    return res.status(500).json({ message: "Giriş işlemi sırasında teknik bir hata oluştu." });
  }
};

module.exports = loginHandler;