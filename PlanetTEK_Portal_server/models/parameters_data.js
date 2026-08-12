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
        // 1. Proses parametrelerini çek
        const [rows] = await pool.execute("SELECT * FROM process_parameters ORDER BY id ASC");
        
        // 2. Teklif numarasını teklif_numarasi tablosundan en güncel kaydı alarak çek
        const [teklifRows] = await pool.execute("SELECT numara FROM teklif_numarasi ORDER BY created_at DESC LIMIT 1");
        const teklifNum = teklifRows.length > 0 ? teklifRows[0].numara : "";

        // Eğer veritabanı parametrelerinde teklif_numarasİ kaydı yoksa listeye dinamik olarak ekle
        const hasTeklifKey = rows.some(r => 
            ["teklif_numarasi", "teklif_numarasi"].includes(String(r.parametre_key).toLowerCase())
        );

        if (!hasTeklifKey) {
            rows.push({
                id: "teklif_numarasi_db_row",
                parametre_key: "teklif_numarasi",
                parametre_adi: "Teklif Numarasi",
                deger: teklifNum
            });
        } else {
            // Var olan teklif numarası parametresinin değerini teklif_numarasi tablosuyla eşitle
            rows.forEach(r => {
                if (["teklif_numarasi", "teklif_numarasi"].includes(String(r.parametre_key).toLowerCase())) {
                    r.deger = teklifNum;
                }
            });
        }

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
    const loglar = [];

    try {
        for (const change of updates) {
            const { id, type, columnName, newValue, oldValue, rowName } = change;

            // ❌ SİLME İŞLEMLERİ İPTAL EDİLDİ
            // Eğer gelen istek DELETE tipindeyse veya değer null ise işlem yapmadan pas geçiyoruz
            if (type === "DELETE" || (newValue === null && type !== "UPDATE")) {
                continue;
            }

            // 🎯 TEKLİF NUMARASI GÜNCELLEME İŞLEMİ (teklif_numarasi tablosuna yazar)
            const paramKeyCheck = String(rowName || change.additionalData?.parametre_key || "").toLowerCase();
            if (["teklif_numarasi", "teklif_numarasi"].includes(paramKeyCheck)) {
                const yeniTeklifNo = String(newValue || "").trim();

                // Mevcut teklif numarasını temizleyip yenisini ekliyoruz
                await connection.execute("DELETE FROM teklif_numarasi");
                if (yeniTeklifNo) {
                    await connection.execute("INSERT INTO teklif_numarasi (numara) VALUES (?)", [yeniTeklifNo]);
                }

                guncellenenSatir++;
                loglar.push({
                    userId,
                    payload: { 
                        tip: "teklif_numarasi_guncelleme", 
                        tablo: "teklif_numarasi", 
                        kayit_id: 1, 
                        sutun: "numara", 
                        eski_deger: oldValue, 
                        yeni_deger: yeniTeklifNo, 
                        not: `Teklif numarası güncellendi: ${yeniTeklifNo}`, 
                        tarih: new Date().toISOString() 
                    }
                });
                continue;
            }

            // Sayısal değer dönüştürme fonksiyonu
            const parseToNumber = (val) => {
                if (val === undefined || val === null) return 0;
                const formatted = String(val).replace(",", "."); 
                return isNaN(Number(formatted)) ? 0 : Number(formatted);
            };

            // ➕ DURUM 1: INSERT
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
                        payload: { 
                            tip: "parametre_ekleme", 
                            tablo: "process_parameters", 
                            kayit_id: insResult.insertId, 
                            sutun: "deger", 
                            eski_deger: 0, 
                            yeni_deger: baslangicDegeri, 
                            not: `Yeni parametre eklendi: ${parametreKey}`, 
                            tarih: new Date().toISOString() 
                        }
                    });
                }
                continue;
            }

            // 🔄 DURUM 2: UPDATE
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
                    payload: { 
                        tip: "parametre_guncelleme", 
                        tablo: "process_parameters", 
                        kayit_id: id, 
                        sutun: targetColumn, 
                        eski_deger: oldValue, 
                        yeni_deger: parsedValue, 
                        not: `Parametre hücresi güncellendi (${rowName})`, 
                        tarih: new Date().toISOString() 
                    }
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
            message: `İşlemler başarıyla tamamlandı. (${eklenenSatir} Eklendi, ${guncellenenSatir} Güncellendi)`
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