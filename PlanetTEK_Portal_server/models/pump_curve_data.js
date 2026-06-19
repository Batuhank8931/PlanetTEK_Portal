const mysql = require("mysql2/promise");
const { logActivity } = require("../utils/logger.js");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
});

// Belirli bir pompaya ait eğri verilerini getirir (/api/pump-curve/:pump_id)
const getPumpCurve = async (req, res) => {
    try {
        const { pump_id } = req.params;

        if (!pump_id) {
            return res.status(400).json({ message: "Pompa ID belirtilmelidir." });
        }

        // Noktaları grafik çizimine uygun olması için flow_rate (debi) sırasına göre çekiyoruz
        const [rows] = await pool.execute(
            "SELECT * FROM pump_curve_points WHERE pump_id = ? ORDER BY flow_rate ASC",
            [pump_id]
        );
        
        return res.json(rows);
    } catch (error) {
        console.error("getPumpCurve Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

// Bir pompanın eğri verilerini günceller / yeniden oluşturur
const updatePumpCurve = async (req, res) => {
    const { pump_id } = req.params;
    const { points } = req.body; // Frontend'den beklenen: [{ flow_rate: 1.5, head_mss: 14.5 }, ...]

    if (!pump_id) {
        return res.status(400).json({ message: "Pompa ID belirtilmelidir." });
    }

    if (!Array.isArray(points)) {
        return res.status(400).json({ message: "Eğri noktaları (points) bir dizi (array) olmalıdır." });
    }

    // Transaction başlatıyoruz çünkü eski veriyi silip yenisini eklerken hata oluşursa geri alabilelim (Rollback)
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Adım: O pompaya ait mevcut tüm eski eğri noktalarını temizle
        await connection.execute("DELETE FROM pump_curve_points WHERE pump_id = ?", [pump_id]);

        // 2. Adım: Eğer gelen array boş değilse yeni noktaları toplu olarak (Bulk Insert) ekle
        if (points.length > 0) {
            const insertValues = points.map(point => [
                pump_id,
                parseFloat(point.flow_rate),
                parseFloat(point.head_mss)
            ]);

            const insertSql = "INSERT INTO pump_curve_points (pump_id, flow_rate, head_mss) VALUES ?";
            await connection.query(insertSql, [insertValues]);
        }

        // İşlemleri onayla
        await connection.commit();

        // Aktivite logu (logger.js yapına uygun olarak)
        if (typeof logActivity === "function") {
            await logActivity(req, `Pump curve updated for pump_id: ${pump_id}`);
        }

        return res.json({ message: "Pompa eğrisi başarıyla güncellendi." });
    } catch (error) {
        // Hata durumunda yapılan değişiklikleri geri al
        await connection.rollback();
        console.error("updatePumpCurve Error:", error.message);
        return res.status(500).json({ message: "Eğri güncellenirken teknik bir hata oluştu.", error: error.message });
    } finally {
        // Bağlantıyı havuza geri bırak
        connection.release();
    }
};

module.exports = { getPumpCurve, updatePumpCurve };