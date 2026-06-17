// backend/utils/logger.js
const mysql = require("mysql2/promise");

// Ana havuzu kullanabilmek için pool'u buradan veya ortak DB dosyasından çekebilirsin
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

/**
 * Sistem içi yapılan kritik aksiyonları activity_logs tablosuna kaydeder.
 * @param {number} userId - İşlemi yapan kullanıcının ID'si
 * @param {Object} actionDetails - JSON olarak kaydedilecek detay objesi
 */
const logActivity = async (userId, actionDetails) => {
    try {
        await pool.execute(
            "INSERT INTO activity_logs (user_id, aksiyon) VALUES (?, ?)",
            [userId, JSON.stringify(actionDetails)]
        );
    } catch (error) {
        // Loglama hatası ana akışı bozmasın diye sadece konsola basıyoruz
        console.error("🚨 [LogActivity Error]:", error.message);
    }
};

module.exports = { logActivity };