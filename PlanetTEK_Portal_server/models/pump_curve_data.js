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

// models/pump_curve_data.js veya price_data.js içine ekleyebilirsin

const getAllPumpCurves = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id,
                p.pompa_adi AS name,
                -- Eğri noktalarını "flow_rate: head_mss" key-value objesine dönüştürüyoruz
                JSON_OBJECTAGG(c.flow_rate, c.head_mss) AS mssData
            FROM submersible_pumps p
            INNER JOIN pump_curve_points c ON p.id = c.pump_id
            WHERE p.pompa_tipi = 'submersible' -- 🚀 KOŞUL BURAYA EKLENDİ
            GROUP BY p.id, p.pompa_adi
            ORDER BY p.id ASC
        `;

        const [rows] = await pool.execute(query);

        // MySQL JSON_OBJECTAGG kullanınca string veya raw obje dönebilir, garantiye almak için parse kontrolü yapıyoruz
        const formattedResult = rows.map(row => ({
            id: row.id,
            name: row.name,
            mssData: typeof row.mssData === 'string' ? JSON.parse(row.mssData) : row.mssData
        }));

        return res.json(formattedResult);
    } catch (error) {
        console.error("getAllPumpCurves Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

const getCentrifugePumps = async (req, res) => {
    try {
        // Eğri noktalarına gerek olmadığı için JOIN yapmadan doğrudan düz listeyi çekiyoruz
        const query = `
            SELECT 
                id,
                pompa_adi AS name,
                pompa_tipi,
                kw,
                alis_fiyati,
                yd_katsayi,
                yd_satis,
                yi_katsayi,
                yi_satis
            FROM submersible_pumps
            WHERE pompa_tipi = 'centrifuge'
            ORDER BY pompa_adi ASC
        `;

        const [rows] = await pool.execute(query);

        return res.json(rows);
    } catch (error) {
        console.error("getCentrifugePumps Error:", error.message);
        return res.status(500).json({
            message: "Santrifüj pompalar yüklenirken teknik bir hata oluştu.",
            error: error.message
        });
    }
};

// export kısmına getAllPumpCurves fonksiyonunu eklemeyi unutma!

module.exports = { getPumpCurve, updatePumpCurve, getAllPumpCurves, getCentrifugePumps };