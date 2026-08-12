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

/**
 * Teklif numarasını sıfır dolgusunu (padding) koruyarak 1 artırır.
 * Örneğin: "0345" -> "0346"
 */
const incrementOfferNumber = (numStr) => {
    if (!numStr) return "0001";
    
    const length = numStr.length;
    const num = parseInt(numStr, 10);
    
    if (isNaN(num)) return "0001";
    
    return String(num + 1).padStart(length, "0");
};

const setOfferNumber = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        // 1. offers tablosundaki en son oluşturulan veriyi al
        const [offersRows] = await connection.query(
            "SELECT teklif_no, created_at FROM offers ORDER BY id DESC LIMIT 1"
        );

        // 2. teklif_numarasi tablosundaki en son güncellenen veriyi al
        const [tnRows] = await connection.query(
            "SELECT numara, updated_at FROM teklif_numarasi ORDER BY updated_at DESC LIMIT 1"
        );

        let baseNumber = null;
        const offerData = offersRows[0];
        const tnData = tnRows[0];

        // 3. En güncel (yeni) olan tarihi seçme mantığı
        if (offerData && tnData) {
            const offerDate = new Date(offerData.created_at);
            const tnDate = new Date(tnData.updated_at);

            if (offerDate > tnDate) {
                baseNumber = offerData.teklif_no;
            } else {
                baseNumber = tnData.numara;
            }
        } else if (offerData) {
            baseNumber = offerData.teklif_no;
        } else if (tnData) {
            baseNumber = tnData.numara;
        } else {
            baseNumber = "0000";
        }

        // 4. İlk aday numarayı üret
        let candidateNumber = incrementOfferNumber(baseNumber);

        // 5. reserved_teklif_numarasi tablosunda var mı kontrol et, varsa +1 artırarak devam et
        let isReserved = true;

        while (isReserved) {
            const [reservedRows] = await connection.query(
                "SELECT numara FROM reserved_teklif_numarasi WHERE numara = ?",
                [candidateNumber]
            );

            if (reservedRows.length === 0) {
                await connection.query(
                    "INSERT INTO reserved_teklif_numarasi (numara) VALUES (?)",
                    [candidateNumber]
                );
                isReserved = false;
            } else {
                candidateNumber = incrementOfferNumber(candidateNumber);
            }
        }

        return res.json({ teklif_no: candidateNumber });

    } catch (error) {
        console.error("setOfferNumber Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

const unSetOfferNumber = async (req, res) => {
    let connection;
    try {
        const { numara } = req.body || {};

        if (!numara) {
            return res.status(400).json({ message: "Silinecek numara parametresi eksik." });
        }

        const cleanNumber = String(typeof numara === "object" ? (numara.teklifNo || numara.numara || "") : numara).trim();

        if (!cleanNumber) {
            return res.status(400).json({ message: "Geçersiz numara formatı." });
        }

        connection = await pool.getConnection();

        const [result] = await connection.query(
            "DELETE FROM reserved_teklif_numarasi WHERE numara = ?",
            [cleanNumber]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: "Silinecek numara rezerve tablosunda bulunamadı.", 
                numara: cleanNumber 
            });
        }

        return res.json({ message: "Numara rezerve tablosundan silindi.", numara: cleanNumber });

    } catch (error) {
        console.error("unSetOfferNumber Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { setOfferNumber, unSetOfferNumber };