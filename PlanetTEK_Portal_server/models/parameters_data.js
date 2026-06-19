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

const ALLOWED_COLUMNS = ["parametre_key", "parametre_adi", "deger"];

const getParamteters = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM process_parameters ORDER BY id ASC");
        return res.json(rows);
    } catch (error) {
        console.error("getParamteters Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

const updateParametersData = async (req, res) => {
    const { updates } = req.body;
    const userId = req.user?.id || 1;

    // Gelen istek kontrolü
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ message: "Değişiklik listesi boş veya geçersiz. 'updates' bir dizi olmalıdır." });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    let eklenenSatir = 0;
    let guncellenenSatir = 0;
    let silinenSatir = 0;
    const loglar = [];

    try {
        for (const change of updates) {
            const { id, type, columnName, newValue, oldValue, rowName } = change;

            // ❌ DURUM 1: SİLME
            if (newValue === null || newValue === undefined || type === "DELETE") {
                if (id && String(id).startsWith("new_")) continue;

                const [delResult] = await connection.execute(
                    "DELETE FROM process_parameters WHERE id = ? OR parametre_key = ?",
                    [id || null, rowName || null]
                );

                if (delResult.affectedRows > 0) {
                    silinenSatir++;
                    loglar.push({
                        userId,
                        payload: { tip: "parametre_silme", tablo: "process_parameters", kayit_id: id, sutun: "all", eski_deger: oldValue, yeni_deger: null, not: `Parametre silindi: ${rowName || id}`, tarih: new Date().toISOString() }
                    });
                }
                continue;
            }

            // Sayısal değer senkronizasyonu (Virgülü noktaya çevirme fonksiyonu)
            const parseToNumber = (val) => {
                if (val === undefined || val === null) return 0;
                // "130,00" -> "130.00" dönüşümü yapar
                const formatted = String(val).replace(",", "."); 
                return isNaN(Number(formatted)) ? 0 : Number(formatted);
            };

            // ➕ DURUM 2: INSERT
            if (!id || String(id).startsWith("new_") || type === "INSERT") {
                const parametreKey = (type === "INSERT" ? rowName : change.additionalData?.parametre_key) || `NEW_PARAM_${Date.now()}`;
                const parametreAdi = change.additionalData?.parametre_adi || rowName || "Yeni Tanımlanan Parametre";
                const baslangicDegeri = parseToNumber(newValue);

                const [insResult] = await connection.execute(
                    "INSERT INTO process_parameters (parametre_key, parametre_adi, deger) VALUES (?, ?, ?)",
                    [parametreKey, parametreAdi, baslangicDegeri]
                );

                if (insResult.insertId) {
                    eklenenSatir++;
                    loglar.push({
                        userId,
                        payload: { tip: "parametre_ekleme", tablo: "process_parameters", kayit_id: insResult.insertId, sutun: "deger", eski_deger: 0, yeni_deger: baslangicDegeri, not: `Yeni parametre eklendi: ${parametreKey}`, tarih: new Date().toISOString() }
                    });
                }
                continue;
            }

            // 🔄 DURUM 3: UPDATE
            // Gelen sütun adını küçük harfe çevirerek whitelist kontrolü yapıyoruz (DEGER -> deger)
            const lowerColumnName = String(columnName).toLowerCase();
            const targetColumn = ALLOWED_COLUMNS.includes(lowerColumnName) ? lowerColumnName : "deger";

            let parsedValue = newValue;
            if (targetColumn === "deger") {
                parsedValue = parseToNumber(newValue);
            } else {
                parsedValue = String(newValue).trim();
            }

            const updateQuery = `UPDATE process_parameters SET ${targetColumn} = ? WHERE id = ?`;
            const [upResult] = await connection.execute(updateQuery, [parsedValue, id]);

            if (upResult.affectedRows > 0) {
                guncellenenSatir++;
                loglar.push({
                    userId,
                    payload: { tip: "parametre_guncelleme", tablo: "process_parameters", kayit_id: id, sutun: targetColumn, eski_deger: oldValue, yeni_deger: parsedValue, not: `Parametre hücresi güncellendi (${rowName})`, tarih: new Date().toISOString() }
                });
            }
        }

        if (loglar.length > 0) {
            for (const log of loglar) {
                await logActivity(log.userId, log.payload);
            }
        }

        await connection.commit();
        return res.json({
            success: true,
            message: `İşlemler başarıyla tamamlandı. (${eklenenSatir} Eklendi, ${guncellenenSatir} Güncellendi, ${silinenSatir} Silindi)`
        });

    } catch (error) {
        await connection.rollback();
        console.error("updateParametersData Error:", error.message);
        return res.status(500).json({ message: "Teknik hata oluştu.", error: error.message });
    } finally {
        connection.release();
    }
};

module.exports = { getParamteters, updateParametersData };