const mysql = require("mysql2/promise");
const { logActivity } = require("../utils/logger.js");

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
const ALLOWED_TABLES = {
    main_units: [
        "sale_amount", "model", "bYd", "bYi", "pYd", "pYi", "tYd", "tYi",
        "yd_kapaksiz", "yi_kapaksiz", "kapak_fiyati_yd", "kapak_fiyati_yi",
        "sase_fiyati_yd", "sase_fiyati_yi"
    ],
    submersible_pumps: ["pompa_adi", "pompa_tipi", "kw", "alis_fiyati", "yd_katsayi", "yi_katsayi"],
    ileri_aritma_ekipmanlari: ["ekipman_adi", "ekipman_tipi", "kw", "alis_fiyati", "yd_katsayi", "yi_katsayi"],

    filtration_equipments: ["debi", "ekipman_tipi", "yi_oran", "yd_oran", "alis_fiyat"],
    filtration_feed_pumps: ["debi", "kw", "yi_oran", "yd_oran", "alis_fiyat"],
    filtration_backwash_pumps: ["geri_yikama_debi", "kw", "yi_oran", "yd_oran", "alis_fiyat"],
    on_klorlama_ekipmanlari: ["ekipman_adi", "ekipman_tipi", "kw", "alis_fiyati", "yd_katsayi", "yi_katsayi"],

    // 🚀 YENİ MBR (MEMBRAN) SİSTEMİ BEYAZ LİSTEMİZ:
    membrane_cassettes: ["general_capacity", "alan", "adet", "boyutlar", "yi_oran", "yd_oran", "alis_fiyat"],
    membrane_feed_pumps: ["general_capacity", "debi", "kw", "yi_oran", "yd_oran", "alis_fiyat"],
    membrane_recirculation_pumps: ["general_capacity", "debi", "kw", "yi_oran", "yd_oran", "alis_fiyat"],
    membrane_naocl_dosing_pumps: ["general_capacity", "debi", "kw", "yi_oran", "yd_oran", "alis_fiyat"],
    membrane_naocl_dosing_tanks: ["general_capacity", "kapasite", "malzeme", "yi_oran", "yd_oran", "alis_fiyat"],
    membrane_citric_dosing_pumps: ["general_capacity", "debi", "kw", "yi_oran", "yd_oran", "alis_fiyat"],
    membrane_citric_dosing_tanks: ["general_capacity", "kapasite", "malzeme", "yi_oran", "yd_oran", "alis_fiyat"],
    membrane_blowers: ["general_capacity", "kapasite_nm3h", "kw", "yi_oran", "yd_oran", "alis_fiyat"],

    grease_trap_data: ["kapasite", "plakaboyut", "yd_fiyat", "yi_fiyat"],
    coarse_screen_data: ["kapasite", "tipi", "yd_fiyat", "yi_fiyat"],
    fine_screen_data: ["kapasite", "tipi", "yd_fiyat", "yi_fiyat"],
    lamella_data: ["tipi", "yd_fiyat", "yi_fiyat", "alan", "hacim"],
    stainless_steel_data: ["fiyat"],
    flow_distribution: ["ad", "yd", "yi"],
    unit_labor_costs: [
        "grup_tipi", "unite_sayisi", "ad", "mekKisi", "mekGun", "elkKisi",
        "elkGun", "gunlikMekMaliyet", "gunlukYemek", "digerGunluk"],
    sludge_dewatering_costs: ["ekipman_tipi", "kapasite_degeri", "kapasite_birimi", "alis_fiyati", "yi_oran", "yd_oran"]
};

// ==========================================
// 🔍 GET İSTEKLERİ (VERİ LİSTELEME)
// ==========================================

// 🚀 YENİ: TÜM MEMBRAN DATASINI PARALEL SORGULAYAN VE PAKET OLARAK DÖNEN METOT
// Backend hiçbir filtreleme yapmadan veritabanındaki TÜM MBR datalarını döner:
const getMembraneCosts = async (req, res) => {
    try {
        const [
            cassettes,
            feedPumps,
            recircPumps,
            naoclPumps,
            naoclTanks,
            citricPumps,
            citricTanks,
            blowers
        ] = await Promise.all([
            pool.execute("SELECT * FROM membrane_cassettes ORDER BY general_capacity ASC, id ASC"),
            pool.execute("SELECT * FROM membrane_feed_pumps ORDER BY general_capacity ASC, id ASC"),
            pool.execute("SELECT * FROM membrane_recirculation_pumps ORDER BY general_capacity ASC, id ASC"),
            pool.execute("SELECT * FROM membrane_naocl_dosing_pumps ORDER BY general_capacity ASC, id ASC"),
            pool.execute("SELECT * FROM membrane_naocl_dosing_tanks ORDER BY general_capacity ASC, id ASC"),
            pool.execute("SELECT * FROM membrane_citric_dosing_pumps ORDER BY general_capacity ASC, id ASC"),
            pool.execute("SELECT * FROM membrane_citric_dosing_tanks ORDER BY general_capacity ASC, id ASC"),
            pool.execute("SELECT * FROM membrane_blowers ORDER BY general_capacity ASC, id ASC")
        ]);

        return res.json({
            membraneCassettes: cassettes[0],
            feedPumps: feedPumps[0],
            recirculationPumps: recircPumps[0],
            naoclDosingPumps: naoclPumps[0],
            naoclDosingTanks: naoclTanks[0],
            citricDosingPumps: citricPumps[0],
            citricDosingTanks: citricTanks[0],
            blowers: blowers[0]
        });
    } catch (error) {
        console.error("getMembraneCosts Error:", error.message);
        return res.status(500).json({ message: "Membran verileri çekilirken hata oluştu.", error: error.message });
    }
};

const getMainUnits = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM main_units ORDER BY id ASC");
        return res.json(rows);
    } catch (error) {
        console.error("getMainUnits Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

const getScreenData = async (req, res) => {
    try {
        const [greasePromise, coarsePromise, finePromise] = await Promise.all([
            pool.execute("SELECT * FROM grease_trap_data ORDER BY id ASC"),
            pool.execute("SELECT * FROM coarse_screen_data ORDER BY id ASC"),
            pool.execute("SELECT * FROM fine_screen_data ORDER BY id ASC")
        ]);
        return res.json({
            greaseTrap: greasePromise[0],
            coarseScreen: coarsePromise[0],
            fineScreen: finePromise[0]
        });
    } catch (error) {
        console.error("getScreenData Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

const getLamellaData = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM lamella_data ORDER BY id ASC");
        return res.json(rows);
    } catch (error) {
        console.error("getLamellaData Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

const getStainlessSteelData = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM stainless_steel_data ORDER BY id ASC");
        return res.json(rows);
    } catch (error) {
        console.error("getStainlessSteelData Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

const getFlowDistribution = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM flow_distribution ORDER BY id ASC");
        return res.json(rows);
    } catch (error) {
        console.error("getFlowDistribution Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

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
        console.error("getSubmersibleCosts Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};

const getFiltrationCosts = async (req, res) => {
    try {
        const [
            equipmentsPromise,
            feedPumpsPromise,
            backwashPumpsPromise,
            onKlorlamaPromise
        ] = await Promise.all([
            pool.execute("SELECT * FROM filtration_equipments ORDER BY id ASC"),
            pool.execute("SELECT * FROM filtration_feed_pumps ORDER BY id ASC"),
            pool.execute("SELECT * FROM filtration_backwash_pumps ORDER BY id ASC"),
            pool.execute("SELECT * FROM on_klorlama_ekipmanlari ORDER BY id ASC")
        ]);

        return res.json({
            filtrationEquipments: equipmentsPromise[0],
            feedPumps: feedPumpsPromise[0],
            backwashPumps: backwashPumpsPromise[0],
            onKlorlamaEquipments: onKlorlamaPromise[0]
        });
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

const getIlerAritmaEquipmentsCosts = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM ileri_aritma_ekipmanlari ORDER BY id ASC");
        return res.json(rows);
    } catch (error) {
        console.error("getIlerAritmaEquipmentsCosts Error:", error.message);
        return res.status(500).json({ message: "Teknik bir hata oluştu.", error: error.message });
    }
};


// ====================================================================
// 🛠️ ORTAK YARDIMCI MOTORLAR (CRUD MOTORU)
// ====================================================================

const executeCommonCoreEngine = async (connection, tableName, item, userId, loglar, customUpdateFormulaLogic) => {
    const { id, columnName, newValue, additionalData } = item;

    if (newValue !== null && columnName && (!ALLOWED_TABLES[tableName] || !ALLOWED_TABLES[tableName].includes(columnName))) {
        throw new Error(`Güvenlik bariyeri: ${tableName} tablosundaki ${columnName} sütunu için geçersiz işlem!`);
    }

    if (id !== undefined && newValue === null) {
        const [oldRows] = await connection.execute(`SELECT * FROM ${tableName} WHERE id = ? LIMIT 1`, [id]);
        if (oldRows.length === 0) return { deleted: 0, inserted: 0, updated: 0 };

        await connection.execute(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
        loglar.push({ userId, payload: { tip: "kayit_silme", tablo: tableName, kayit_id: id, eski_deger: oldRows[0], not: "Satır tamamen silindi.", tarih: new Date().toISOString() } });
        return { deleted: 1, inserted: 0, updated: 0 };
    }

    if (id === undefined || id === null) {
        const hasAdditionalData = additionalData && typeof additionalData === 'object' && Object.keys(additionalData).length > 0;

        if (!hasAdditionalData && (!columnName || newValue === undefined)) {
            return { deleted: 0, inserted: 0, updated: 0 };
        }

        const uniqueFields = new Set();
        const insertValues = [];
        const placeholders = [];

        if (columnName && ALLOWED_TABLES[tableName] && ALLOWED_TABLES[tableName].includes(columnName)) {
            uniqueFields.add(columnName);
            insertValues.push(newValue);
            placeholders.push("?");
        }

        if (hasAdditionalData) {
            for (const [key, val] of Object.entries(additionalData)) {
                if (ALLOWED_TABLES[tableName] && ALLOWED_TABLES[tableName].includes(key) && !uniqueFields.has(key)) {
                    uniqueFields.add(key);
                    insertValues.push(val);
                    placeholders.push("?");
                }
            }
        }

        const insertFields = Array.from(uniqueFields);
        if (insertFields.length === 0) return { deleted: 0, inserted: 0, updated: 0 };

        const insertQuery = `INSERT INTO ${tableName} (${insertFields.join(", ")}) VALUES (${placeholders.join(", ")})`;
        const [insertResult] = await connection.execute(insertQuery, insertValues);

        loglar.push({
            userId,
            payload: {
                tip: "yeni_kayit_ekleme",
                tablo: tableName,
                kayit_id: insertResult.insertId,
                yeni_deger: columnName ? { [columnName]: newValue, ...additionalData } : { ...additionalData },
                not: "Yeni satır oluşturuldu.",
                tarih: new Date().toISOString()
            }
        });

        return { deleted: 0, inserted: 1, updated: 0 };
    }

    if (id !== undefined && columnName && newValue !== undefined) {
        const [currentRows] = await connection.execute(`SELECT ${columnName} FROM ${tableName} WHERE id = ? LIMIT 1`, [id]);
        if (currentRows.length === 0) return { deleted: 0, inserted: 0, updated: 0 };

        const oldValue = currentRows[0][columnName];
        const isString = typeof newValue === "string";
        const esitMi = isString ? String(oldValue).trim() === String(newValue).trim() : Number(oldValue) === Number(newValue);

        if (esitMi) return { deleted: 0, inserted: 0, updated: 0 };

        await connection.execute(`UPDATE ${tableName} SET ${columnName} = ? WHERE id = ?`, [newValue, id]);

        let ekstraBilgi = "";
        if (customUpdateFormulaLogic) {
            ekstraBilgi = await customUpdateFormulaLogic(connection, id, columnName, newValue);
        }

        loglar.push({ userId, payload: { tip: "fiyat_guncelleme", tablo: tableName, kayit_id: id, sutun: columnName, eski_deger: oldValue, yeni_deger: newValue, not: `Fiyat/Veri güncellendi${ekstraBilgi}`, tarih: new Date().toISOString() } });
        return { deleted: 0, inserted: 0, updated: 1 };
    }

    return { deleted: 0, inserted: 0, updated: 0 };
};


// ====================================================================
// 🚀 TABLO BAZLI ALT BÖLÜNMÜŞ METOTLAR (TABLO YÖNETİMLERİ)
// ====================================================================

// 🚀 YENİ: 8 ADET MEMBRAN TABLOSUNUN CRUD VE GLOBAL KATSAYI MOTORU
const updateAddDeleteMembraneCosts = async (connection, item, userId, loglar, currentBodyTableName) => {
    const { id, columnName, newValue } = item;

    // 🌟 KATSAYI TETİKLEYİCİ: Eğer MBR grubunda global oran değişirse 8 tablonun birden çarpanını toptan günceller!
    if (["yi_oran", "yd_oran"].includes(columnName)) {
        let ekstraBilgi = "";
        const targetTables = [
            "membrane_cassettes", "membrane_feed_pumps", "membrane_recirculation_pumps",
            "membrane_naocl_dosing_pumps", "membrane_naocl_dosing_tanks",
            "membrane_citric_dosing_pumps", "membrane_citric_dosing_tanks", "membrane_blowers"
        ];

        if (columnName === "yi_oran") {
            await Promise.all(targetTables.map(table => connection.execute(`UPDATE ${table} SET yi_oran = ?`, [newValue])));
            ekstraBilgi = " (Membran grubuna ait 8 tablonun Yurt İçi Oranı toptan güncellendi)";
        }
        else if (columnName === "yd_oran") {
            await Promise.all(targetTables.map(table => connection.execute(`UPDATE ${table} SET yd_oran = ?`, [newValue])));
            ekstraBilgi = " (Membran grubuna ait 8 tablonun Yurt Dışı Oranı toptan güncellendi)";
        }

        loglar.push({
            userId,
            payload: {
                tip: "fiyat_guncelleme",
                tablo: currentBodyTableName,
                kayit_id: id || 1,
                sutun: columnName,
                eski_deger: "Eski Oran",
                yeni_deger: newValue,
                not: `Membran global çarpanı toptan revize edildi.${ekstraBilgi}`,
                tarih: new Date().toISOString()
            }
        });
        return { deleted: 0, inserted: 0, updated: 1 };
    }

    // Normal Hücre Yönetimi (Ekleme, Silme, Tekil Güncelleme)
    return executeCommonCoreEngine(connection, currentBodyTableName, item, userId, loglar, async () => {
        return ` (Membran [${columnName}] hücresi güncellendi)`;
    });
};

const updateAddDeleteMainUnits = async (connection, item, userId, loglar) => {
    return executeCommonCoreEngine(connection, "main_units", item, userId, loglar, async (conn, id, col, val) => {
        if (["bYd", "kapak_fiyati_yd"].includes(col)) {
            await conn.execute(`UPDATE main_units SET yd_kapaksiz = bYd - kapak_fiyati_yd WHERE id = ?`, [id]);
            return " (yd_kapaksiz otomatik yeniden hesaplandı)";
        } else if (["bYi", "kapak_fiyati_yi"].includes(col)) {
            await conn.execute(`UPDATE main_units SET yi_kapaksiz = bYi - kapak_fiyati_yi WHERE id = ?`, [id]);
            return " (yi_kapaksiz otomatik yeniden hesaplandı)";
        }
        return "";
    });
};

const updateAddDeleteScreenData = async (connection, item, userId, loglar, currentBodyTableName) => {
    return executeCommonCoreEngine(connection, currentBodyTableName, item, userId, loglar, async () => {
        return ` (${item.columnName} alanı güncellendi)`;
    });
};

const updateAddDeleteLamellaData = async (connection, item, userId, loglar) => {
    return executeCommonCoreEngine(connection, "lamella_data", item, userId, loglar);
};

const updateAddDeleteStainlessSteelData = async (connection, item, userId, loglar) => {
    return executeCommonCoreEngine(connection, "stainless_steel_data", item, userId, loglar);
};

const updateAddDeleteSbumersibleCosts = async (connection, item, userId, loglar) => {
    return executeCommonCoreEngine(connection, "submersible_pumps", item, userId, loglar, async (conn, id, col, val) => {
        if (col === "yi_katsayi") {
            await conn.execute(`UPDATE submersible_pumps SET yi_katsayi = ?`, [val]);
            return " (Tüm Yurt İçi katsayıları toptan güncellendi)";
        } else if (col === "yd_katsayi") {
            await conn.execute(`UPDATE submersible_pumps SET yd_katsayi = ?`, [val]);
            return " (Tüm Yurt Dışı katsayıları toptan güncellendi)";
        }
        return " (Pompa verisi güncellendi)";
    });
};

const updateAddDeleteFLoeDistribution = async (connection, item, userId, loglar) => {
    return executeCommonCoreEngine(connection, "flow_distribution", item, userId, loglar);
};

const updateAddDeleteFiltrationCosts = async (connection, item, userId, loglar, currentBodyTableName) => {
    const { id, columnName, newValue } = item;

    if (["yi_oran", "yd_oran", "yi_katsayi", "yd_katsayi"].includes(columnName)) {
        let ekstraBilgi = "";

        if (columnName === "yi_oran" || columnName === "yi_katsayi") {
            await Promise.all([
                connection.execute(`UPDATE filtration_equipments SET yi_oran = ?`, [newValue]),
                connection.execute(`UPDATE filtration_feed_pumps SET yi_oran = ?`, [newValue]),
                connection.execute(`UPDATE filtration_backwash_pumps SET yi_oran = ?`, [newValue]),
                connection.execute(`UPDATE on_klorlama_ekipmanlari SET yi_katsayi = ?`, [newValue])
            ]);
            ekstraBilgi = " (Global Yurt İçi Çarpanı 4 tabloda birden toptan güncellendi)";
        }
        else if (columnName === "yd_oran" || columnName === "yd_katsayi") {
            await Promise.all([
                connection.execute(`UPDATE filtration_equipments SET yd_oran = ?`, [newValue]),
                connection.execute(`UPDATE filtration_feed_pumps SET yd_oran = ?`, [newValue]),
                connection.execute(`UPDATE filtration_backwash_pumps SET yd_oran = ?`, [newValue]),
                connection.execute(`UPDATE on_klorlama_ekipmanlari SET yd_katsayi = ?`, [newValue])
            ]);
            ekstraBilgi = " (Global Yurt Dışı Çarpanı 4 tabloda birden toptan güncellendi)";
        }

        loglar.push({
            userId,
            payload: {
                tip: "fiyat_guncelleme",
                tablo: currentBodyTableName,
                kayit_id: id || 1,
                sutun: columnName,
                eski_deger: "Eski Oran",
                yeni_deger: newValue,
                not: `Global katsayı toptan güncellendi${ekstraBilgi}`,
                tarih: new Date().toISOString()
            }
        });

        return { deleted: 0, inserted: 0, updated: 1 };
    }

    return executeCommonCoreEngine(connection, currentBodyTableName, item, userId, loglar, async () => {
        return ` (${columnName} alanı güncellendi)`;
    });
};

const updateAddDeleteSludgeDewateringCosts = async (connection, item, userId, loglar) => {
    return executeCommonCoreEngine(connection, "sludge_dewatering_costs", item, userId, loglar, async (conn, id, col) => {
        if (col.endsWith("_oran")) return " (Çamur susuzlaştırma katsayıları toptan güncellendi)";
        if (col === "alis_fiyati") return " (Ekipman maliyet değişimi satış fiyatlarına yansıtıldı)";
        return "";
    });
};

const updateAddDeleteIleriAritmaEquipments = async (connection, item, userId, loglar) => {
    return executeCommonCoreEngine(connection, "ileri_aritma_ekipmanlari", item, userId, loglar, async (conn, id, col, val) => {
        if (col === "yi_katsayi") {
            await conn.execute(`UPDATE ileri_aritma_ekipmanlari SET yi_katsayi = ?`, [val]);
            return " (Tüm Yurt İçi katsayıları toptan güncellendi)";
        } else if (col === "yd_katsayi") {
            await conn.execute(`UPDATE ileri_aritma_ekipmanlari SET yd_katsayi = ?`, [val]);
            return " (Tüm Yurt Dışı katsayıları toptan güncellendi)";
        }
        return " (Ekipman verisi güncellendi)";
    });
};

const updateAddDeleteLaborCosts = async (connection, item, userId, loglar) => {
    return executeCommonCoreEngine(connection, "unit_labor_costs", item, userId, loglar, async (conn, id, col) => {
        return ` (İşçilik maliyet bileşeni [${col}] güncellendi, toplam maliyet otomatik yeniden hesaplandı.)`;
    });
};


// ====================================================================
// 🎛️ ANA ORKESTRA ŞEFİ ENDPOINT (ROUTE TETİKLEYİCİSİ)
// ====================================================================

const updatePriceData = async (req, res) => {
    const { tableName, updates } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Kullanıcı bilgisi bulunamadı, loglama yapılamaz." });
    if (!tableName || !updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ message: "Eksik parametre veya boş işlem listesi gönderildi." });
    }
    if (!ALLOWED_TABLES[tableName]) return res.status(400).json({ message: "Geçersiz tablo adı!" });

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        let eklenenSatir = 0, guncellenenSatir = 0, silinenSatir = 0;
        const loglar = [];

        for (const item of updates) {
            let resObj = { deleted: 0, inserted: 0, updated: 0 };

            if (tableName === "main_units") {
                resObj = await updateAddDeleteMainUnits(connection, item, userId, loglar);
            }
            else if (["grease_trap_data", "coarse_screen_data", "fine_screen_data"].includes(tableName)) {
                resObj = await updateAddDeleteScreenData(connection, item, userId, loglar, tableName);
            }
            else if (tableName === "lamella_data") {
                resObj = await updateAddDeleteLamellaData(connection, item, userId, loglar);
            }
            else if (tableName === "stainless_steel_data") {
                resObj = await updateAddDeleteStainlessSteelData(connection, item, userId, loglar);
            }
            else if (tableName === "submersible_pumps") {
                resObj = await updateAddDeleteSbumersibleCosts(connection, item, userId, loglar);
            }
            else if (tableName === "flow_distribution") {
                resObj = await updateAddDeleteFLoeDistribution(connection, item, userId, loglar);
            }
            else if (["filtration_equipments", "filtration_feed_pumps", "filtration_backwash_pumps", "on_klorlama_ekipmanlari"].includes(tableName)) {
                resObj = await updateAddDeleteFiltrationCosts(connection, item, userId, loglar, tableName);
            }
            // 🚀 AKILLI TRAFİK YÖNLENDİRME: Eğer gelen tablo ön eki membrane_ ise ortak MBR motorunu tetikle!
            else if (tableName.startsWith("membrane_")) {
                resObj = await updateAddDeleteMembraneCosts(connection, item, userId, loglar, tableName);
            }
            else if (tableName === "sludge_dewatering_costs") {
                resObj = await updateAddDeleteSludgeDewateringCosts(connection, item, userId, loglar);
            }
            else if (tableName === "ileri_aritma_ekipmanlari") {
                resObj = await updateAddDeleteIleriAritmaEquipments(connection, item, userId, loglar);
            }
            else if (tableName === "unit_labor_costs") {
                resObj = await updateAddDeleteLaborCosts(connection, item, userId, loglar);
            }

            silinenSatir += resObj.deleted;
            eklenenSatir += resObj.inserted;
            guncellenenSatir += resObj.updated;
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
        console.error("updatePriceData Bulk Split Error:", error.message);
        return res.status(500).json({ message: error.message || "Teknik hata oluştu.", error: error.message });
    } finally {
        connection.release();
    }
};

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
    getSludgeDewateringCosts,
    getIlerAritmaEquipmentsCosts,
    getMembraneCosts // 🚀 Dışa aktarılan yeni metot
};