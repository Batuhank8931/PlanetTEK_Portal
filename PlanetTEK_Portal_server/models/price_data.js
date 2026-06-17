const mysql = require("mysql2/promise");
const { logActivity } = require("../utils/logger.js"); // logger'ı dahil et

// DB Pool Yapılandırması
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
});

// Güvenlik İçin İzin Verilen Tablo ve Sütun Beyaz Listesi (Whitelist)
// Bu kontrol CWE-89 (SQL Injection) riskini dinamik sorgularda tamamen engeller.
// 🔐 1. ADIM: Güvenlik Bariyerini Yeni Kolonlara Göre Revize Ediyoruz
const ALLOWED_TABLES = {
    main_units: [
        "bYd", "bYi", "pYd", "pYi", "tYd", "tYi",
        "yd_kapaksiz", "yi_kapaksiz",
        "kapak_fiyati_yd", "kapak_fiyati_yi",
        "sase_fiyati_yd", "sase_fiyati_yi"
    ],
    submersible_pumps: ["pompa_adi", "alis_fiyati", "yd_katsayi", "yi_katsayi", "yi_satis", "yd_satis"],

    // 🚀 Yeni Düzenli Filtrasyon Sistemleri İzin Listesi (sp_esli_alis UÇTU, geri_yikama_alis GELDİ)
    filtration_systems: [
        "debi",
        "yi_oran",
        "yd_oran",
        "sp_alis",
        "kf_alis",
        "akf_alis",
        "besleme_pompa_alis",
        "geri_yikama_alis", // 👈 İsmini sadeleştirdiğimiz yeni kolon
        "besleme_kw",
        "geri_yikama_debi",
        "geri_yikama_kw"
    ],

    screen_data: ["plakaYd", "plakaYi", "mKabaYd", "mKabaYi", "mInceYd", "mInceYi", "oKabaYd", "oKabaYi", "oInceYd", "oInceYi"],
    lamella_data: ["fiyat"],
    stainless_steel_data: ["fiyat"],
    flow_distribution: ["yd", "yi"],
    unit_labor_costs: ["mekKisi", "mekGun", "elkKisi", "elkGun", "gunlikMekMaliyet", "gunlukYemek", "digerGunluk", "toplamMaliyet"]
};

// ==========================================
// 🔍 GET İSTEKLERİ (VERİ LİSTELEME)
// ==========================================

// 1. Main Units Getir
const getMainUnits = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM main_units ORDER BY id ASC");
        return res.json(rows);
    } catch (error) {
        console.error("getMainUnits Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

// 2. Screen Data Getir
const getScreenData = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM screen_data ORDER BY id ASC");
        return res.json(rows);
    } catch (error) {
        console.error("getScreenData Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

// 3. Lamella Data Getir
const getLamellaData = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM lamella_data ORDER BY id ASC");
        return res.json(rows);
    } catch (error) {
        console.error("getLamellaData Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

// 4. Stainless Steel Data Getir
const getStainlessSteelData = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM stainless_steel_data ORDER BY id ASC");
        return res.json(rows);
    } catch (error) {
        console.error("getStainlessSteelData Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

// 5. Flow Distribution Getir
const getFlowDistribution = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM flow_distribution ORDER BY id ASC");
        return res.json(rows);
    } catch (error) {
        console.error("getFlowDistribution Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

// 6. Unit Labor Costs Getir
const getUnitLaborCosts = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM unit_labor_costs ORDER BY id ASC");
        return res.json(rows);
    } catch (error) {
        console.error("getUnitLaborCosts Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

const getSubmersibleCosts = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM submersible_pumps ORDER BY id ASC");
        return res.json(rows);
    } catch (error) {
        console.error("getFiltrationCosts Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

const getFiltrationCosts = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM filtration_systems ORDER BY id ASC");
        return res.json(rows);
    } catch (error) {
        console.error("getFiltrationCosts Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

// ==========================================
// 🔄 DİNAMİK POST İSTEĞİ (FİYAT / PARAMETRE GÜNCELLEME)
// ==========================================

/**
 * req.body Örneği:
 * {
 * "tableName": "main_units",
 * "id": "MU-01",
 * "columnName": "bYd",
 * "newValue": 12500.50
 * }
 */

const updatePriceData = async (req, res) => {
    // Artık req.body içinden tekil alanlar yerine bir "updates" array'i bekliyoruz
    const { tableName, updates } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Kullanıcı bilgisi bulunamadı, loglama yapılamaz." });
    }

    if (!tableName || !updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ message: "Eksik parametre veya boş güncelleme listesi gönderildi." });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        let guncellenenSatirSayisi = 0;
        const loglar = []; // Tüm logları toplayıp topluca yazacağız

        // Array içindeki her bir değişikliği sırayla döngüye alıyoruz
        for (const item of updates) {
            const { id, columnName, newValue } = item;

            if (id === undefined || !columnName || newValue === undefined) {
                continue; // Eksik veri varsa bu satırı atla
            }

            // Güvenlik Bariyeri Kontrolü
            if (!ALLOWED_TABLES[tableName] || !ALLOWED_TABLES[tableName].includes(columnName)) {
                await connection.rollback();
                return res.status(400).json({ message: `Güvenlik bariyeri: ${columnName} sütunu için geçersiz işlem!` });
            }

            // 🔍 1. ADIM: Güncellemeden ÖNCE mevcut değeri çek
            const [currentRows] = await connection.execute(
                `SELECT ${columnName} FROM ${tableName} WHERE id = ? LIMIT 1`,
                [id]
            );

            if (currentRows.length === 0) continue; // Kayıt yoksa atla

            const oldValue = currentRows[0][columnName];

            // Değer değişmediyse bu satırı güncellemeye gerek yok, pas geç
            if (Number(oldValue) === Number(newValue)) {
                continue;
            }

            // 🔄 2. ADIM: İstenen ana hücreyi güncelle
            const query = `UPDATE ${tableName} SET ${columnName} = ? WHERE id = ?`;
            await connection.execute(query, [newValue, id]);
            guncellenenSatirSayisi++;

            // 🧮 3. ADIM: AKILLI OTOMATİK FORMÜL TETİKLEYİCİLERİ
            let ekstraBilgi = "";

            // --- SENARYO 1: MAIN UNITS TABLOSU ---
            if (tableName === "main_units") {
                if (["bYd", "kapak_fiyati_yd"].includes(columnName)) {
                    await connection.execute(
                        `UPDATE main_units SET yd_kapaksiz = bYd - kapak_fiyati_yd WHERE id = ?`,
                        [id]
                    );
                    ekstraBilgi = " (yd_kapaksiz otomatik yeniden hesaplandı)";
                }
                else if (["bYi", "kapak_fiyati_yi"].includes(columnName)) {
                    await connection.execute(
                        `UPDATE main_units SET yi_kapaksiz = bYi - kapak_fiyati_yi WHERE id = ?`,
                        [id]
                    );
                    ekstraBilgi = " (yi_kapaksiz otomatik yeniden hesaplandı)";
                }
            }
            // --- SENARYO 2: FILTRATION SYSTEMS TABLOSU ---
            else if (tableName === "filtration_systems") {
                if (columnName === "yi_oran") ekstraBilgi = " (Yurt İçi Satış Fiyatları otomatik güncellendi)";
                else if (columnName === "yd_oran") ekstraBilgi = " (Yurt Dışı Satış Fiyatları otomatik güncellendi)";
                else if (columnName.endsWith("_alis")) ekstraBilgi = " (Bağlı satış fiyatları otomatik tetiklendi)";
            }
            // --- 🚀 SENARYO 3: SUBMERSIBLE PUMPS TABLOSU (YENİ) ---
            // --- 🚀 SENARYO 3: SUBMERSIBLE PUMPS TABLOSU (SADECE TETİKLEYİCİLER GÜNCELLENİYOR) ---
            else if (tableName === "submersible_pumps") {
                // 1. Durum: Küresel Yurt İçi Katsayısı değiştiyse TÜM tablonun katsayısını güncelle.
                // (Satış fiyatını MySQL şeması otomatik hesaplayacağı için sorgudan çıkardık!)
                if (columnName === "yi_katsayi") {
                    await connection.execute(
                        `UPDATE submersible_pumps SET yi_katsayi = ?`,
                        [newValue]
                    );
                    ekstraBilgi = " (Tüm Yurt İçi katsayıları güncellendi, satış fiyatları MySQL tarafından otomatik hesaplandı)";
                }
                // 2. Durum: Küresel Yurt Dışı Katsayısı değiştiyse TÜM tablonun katsayısını güncelle.
                else if (columnName === "yd_katsayi") {
                    await connection.execute(
                        `UPDATE submersible_pumps SET yd_katsayi = ?`,
                        [newValue]
                    );
                    ekstraBilgi = " (Tüm Yurt Dışı katsayıları güncellendi, satış fiyatları MySQL tarafından otomatik hesaplandı)";
                }
                // 3. Durum: Sadece tek bir pompanın alis_fiyati değiştiyse, sadece o satırın alis_fiyatini güncelle.
                // (MySQL yine kendi içindeki formülle satış fiyatlarını anında düzeltecek)
                else if (columnName === "alis_fiyati") {
                    // Ana hücreyi güncelleme sorgusu (2. ADIM) zaten bunu yapıyor, 
                    // burada ekstra bir UPDATE sorgusuna gerek yok! Sadece log için bilgi geçiyoruz.
                    ekstraBilgi = " (Pompa alış fiyatı güncellendi, satış fiyatları MySQL formülüyle otomatik yansıdı)";
                }
            }

            // Log payload'ını array'e pushla (Döngü bittikten sonra topluca loglama yapacağız)
            loglar.push({
                userId,
                payload: {
                    tip: "fiyat_guncelleme",
                    tablo: tableName,
                    kayit_id: id,
                    sutun: columnName,
                    eski_deger: oldValue,
                    yeni_deger: newValue,
                    not: `Fiyat güncellendi${ekstraBilgi}`,
                    tarih: new Date().toISOString()
                }
            });
        }

        // 📝 4. ADIM: Değişen satır varsa logları topluca yaz
        if (loglar.length > 0) {
            for (const log of loglar) {
                await logActivity(log.userId, log.payload);
            }
        }

        // Her şey yolundaysa mühürle
        await connection.commit();

        return res.json({
            success: true,
            message: `${guncellenenSatirSayisi} adet fiyat kaydı başarıyla güncellendi ve loglandı.`
        });

    } catch (error) {
        await connection.rollback();
        console.error("updatePriceDataBulk Error:", error.message);
        return res.status(500).json({ message: "Teknik hata oluştu.", error: error.message });
    } finally {
        connection.release();
    }
};

// Fonksiyonları dışa aktarma (Router dosyasında çağırmak üzere)
module.exports = {
    getMainUnits,
    getScreenData,
    getLamellaData,
    getStainlessSteelData,
    getSubmersibleCosts,
    getFlowDistribution,
    getUnitLaborCosts,
    updatePriceData,
    getFiltrationCosts
};