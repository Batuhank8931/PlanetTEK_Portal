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
        "sale_amount",
        "model",       // 👈 is_mini yerine yeni string model alanımıza izin verdik!
        "bYd", "bYi", "pYd", "pYi", "tYd", "tYi",
        "yd_kapaksiz", "yi_kapaksiz",
        "kapak_fiyati_yd", "kapak_fiyati_yi",
        "sase_fiyati_yd", "sase_fiyati_yi"
    ],
    submersible_pumps: ["pompa_adi", "alis_fiyati", "yd_katsayi", "yi_katsayi", "yi_satis", "yd_satis"],

    // 🚀 Yeni Düzenli Filtrasyon Sistemleri İzin Listesi
    filtration_systems: [
        "debi",
        "yi_oran",
        "yd_oran",
        "sp_alis",
        "kf_alis",
        "akf_alis",
        "besleme_pompa_alis",
        "geri_yikama_alis",
        "besleme_kw",
        "geri_yikama_debi",
        "geri_yikama_kw"
    ],

    screen_data: ["kapasite", "plakaboyut", "plakaYd", "plakaYi", "mKabaYd", "mKabaYi", "mInceYd", "mInceYi", "oKabaYd", "oKabaYi", "oInceYd", "oInceYi"],
    lamella_data: ["tipi", "yd_fiyat", "yi_fiyat"],
    stainless_steel_data: ["fiyat"],
    flow_distribution: ["ad", "yd", "yi"],
    unit_labor_costs: ["mekKisi", "mekGun", "elkKisi", "elkGun", "gunlikMekMaliyet", "gunlukYemek", "digerGunluk", "toplamMaliyet"],
    sludge_dewatering_costs: [
        "ekipman_tipi",
        "kapasite_degeri",
        "kapasite_birimi",
        "alis_fiyati",
        "yi_oran",
        "yd_oran"
    ]
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

const getSludgeDewateringCosts = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM sludge_dewatering_costs ORDER BY id ASC");
        return res.json(rows);
    } catch (error) {
        console.error("getSludgeDewateringCosts Error:", error.message);
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
    // updates array'i artık insert, update ve delete işlemlerinin hepsini barındırabilir
    const { tableName, updates } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Kullanıcı bilgisi bulunamadı, loglama yapılamaz." });
    }

    if (!tableName || !updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ message: "Eksik parametre veya boş işlem listesi gönderildi." });
    }

    // Güvenlik: Tablo sistemde tanımlı mı?
    if (!ALLOWED_TABLES[tableName]) {
        return res.status(400).json({ message: "Geçersiz tablo adı!" });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        let eklenenSatir = 0;
        let guncellenenSatir = 0;
        let silinenSatir = 0;
        const loglar = [];

        for (const item of updates) {
            const { id, columnName, newValue, additionalData } = item;
            // NOT: INSERT işlemi için columnName dışında diğer kolonlar gerekebilir. 
            // dynamic bir obje olarak 'additionalData' (örn: { pompatipi: 'X', debi: 10 }) gönderebilirsiniz.

            // Güvenlik Bariyeri Kontrolü (Yalnızca kolon ismi varsa kontrol et)
            if (newValue !== null && columnName && (!ALLOWED_TABLES[tableName] || !ALLOWED_TABLES[tableName].includes(columnName))) {
                await connection.rollback();
                return res.status(400).json({ message: `Güvenlik bariyeri: ${columnName} sütunu için geçersiz işlem!` });
            }

            // ==========================================
            // ❌ SENARYO A: SİLME İŞLEMİ (DELETE)
            // ==========================================
            if (id !== undefined && newValue === null) {
                // Silinmeden önce eski kaydı log için çekelim
                const [oldRows] = await connection.execute(
                    `SELECT * FROM ${tableName} WHERE id = ? LIMIT 1`, [id]
                );
                if (oldRows.length === 0) continue;

                await connection.execute(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
                silinenSatir++;

                loglar.push({
                    userId,
                    payload: {
                        tip: "kayit_silme",
                        tablo: tableName,
                        kayit_id: id,
                        eski_deger: oldRows[0],
                        not: `Satır tamamen silindi.`,
                        tarih: new Date().toISOString()
                    }
                });
                continue; // Sonraki item'a geç
            }

            // ==========================================
            // ➕ SENARYO B: YENİ SATIR EKLEME (INSERT)
            // ==========================================
            if (id === undefined || id === null) {
                if (!columnName || newValue === undefined) continue;

                // Sütunların mükerrer (double) eklenmesini engellemek için Set kullanıyoruz
                const uniqueFields = new Set();
                const insertValues = [];
                const placeholders = [];

                // 1. Ana tetikleyici kolonu ve değerini ekle (Örn: pompa_adi veya alis_fiyati)
                if (ALLOWED_TABLES[tableName].includes(columnName)) {
                    uniqueFields.add(columnName);
                    insertValues.push(newValue);
                    placeholders.push("?");
                }

                // 2. Ekstra gelen dataları ekle (Eğer ana kolonla aynı isimde bir key varsa Set bunu pas geçer)
                if (additionalData && typeof additionalData === 'object') {
                    for (const [key, val] of Object.entries(additionalData)) {
                        if (ALLOWED_TABLES[tableName].includes(key) && !uniqueFields.has(key)) {
                            uniqueFields.add(key);
                            insertValues.push(val);
                            placeholders.push("?");
                        }
                    }
                }

                // Set'i tekrar array'e çeviriyoruz
                const insertFields = Array.from(uniqueFields);

                if (insertFields.length === 0) continue;

                const insertQuery = `INSERT INTO ${tableName} (${insertFields.join(", ")}) VALUES (${placeholders.join(", ")})`;
                const [insertResult] = await connection.execute(insertQuery, insertValues);
                eklenenSatir++;

                loglar.push({
                    userId,
                    payload: {
                        tip: "yeni_kayit_ekleme",
                        tablo: tableName,
                        kayit_id: insertResult.insertId,
                        yeni_deger: { [columnName]: newValue, ...additionalData },
                        not: `Yeni satır oluşturuldu.`,
                        tarih: new Date().toISOString()
                    }
                });
                continue; // Sonraki item'a geç
            }

            // ==========================================
            // 🔄 SENARYO C: MEVCUT GÜNCELLEME (UPDATE) - Sizin Orijinal Kodunuz
            // ==========================================
            if (id !== undefined && columnName && newValue !== undefined) {

                const [currentRows] = await connection.execute(
                    `SELECT ${columnName} FROM ${tableName} WHERE id = ? LIMIT 1`, [id]
                );
                if (currentRows.length === 0) continue;

                const oldValue = currentRows[0][columnName];
                if (Number(oldValue) === Number(newValue)) continue;

                const query = `UPDATE ${tableName} SET ${columnName} = ? WHERE id = ?`;
                await connection.execute(query, [newValue, id]);
                guncellenenSatir++;

                // Akıllı otomatik formül tetikleyicileriniz (Aynen korunuyor)
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
                    else if (tableName === "sludge_dewatering_costs") {
                        if (columnName.endsWith("_oran")) {
                            ekstraBilgi = " (Çamur susuzlaştırma katsayıları toptan güncellendi)";
                        } else if (columnName === "alis_fiyati") {
                            ekstraBilgi = " (Ekipman maliyet değişimi satış fiyatlarına yansıtıldı)";
                        }
                    }
                }

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
        }

        // 📝 Toplu Loglama Yapısı
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
    getFiltrationCosts,
    getSludgeDewateringCosts
};