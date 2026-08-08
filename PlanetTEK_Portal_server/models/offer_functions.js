const mysql = require("mysql2/promise");
const { logActivity } = require("../utils/logger.js");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs").promises; // 📁 Dosya okuma/yazma işlemleri için

// DB Pool Yapılandırması
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
});

// 🔒 İşlem Çakışmasını Önleyen Kilit Değişkeni
let isProcessing = false;

// ==========================================
// 🛠️ HELPER: Klasör Adı Oluşturma Fonksiyonu
// ==========================================
function getOfferFolderName(offerNumber, customerId) {
    if (!offerNumber) return "Teklif_Klasoru";
    const cleanOfferNo = offerNumber.trim();
    if (customerId) {
        return `${customerId} - ${cleanOfferNo}`;
    }
    return cleanOfferNo;
}

// ==========================================
// 🛠️ HELPER: Python Scriptini venv ile Çalıştırma
// ==========================================
async function runPythonDocGen(payload) {
    const docTestDir = path.join(__dirname, "../doc_test");
    const jsonPath = path.join(docTestDir, "formData.json");

    // 📝 Python çalışmadan önce gelen payload verisini formData.json dosyasına yazıyoruz
    await fs.writeFile(jsonPath, JSON.stringify(payload, null, 2), "utf-8");

    return new Promise((resolve, reject) => {
        const scriptPath = path.join(docTestDir, "run_all.py");
        const isWindows = process.platform === "win32";

        const pythonExecutable = path.join(
            docTestDir,
            ".venv",
            isWindows ? "Scripts/python.exe" : "bin/python"
        );

        const pyProcess = spawn(pythonExecutable, ["-u", scriptPath], {
            cwd: docTestDir,
            env: {
                ...process.env,
                PYTHONIOENCODING: "utf-8",
                PYTHONUNBUFFERED: "1",
            },
        });

        let stderrData = "";

        pyProcess.stdout.on("data", (data) => {
            const lines = data.toString("utf-8").split("\n");
            lines.forEach((line) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return;

                if (trimmedLine.startsWith("PROGRESS_JSON:")) {
                    const jsonStr = trimmedLine.replace("PROGRESS_JSON:", "").trim();
                    try {
                        const progress = JSON.parse(jsonStr);
                        console.log(
                            `\n=== [AŞAMA ${progress.step || "-"}/${progress.totalSteps || "-"}] ${progress.message} ===`
                        );
                    } catch (e) {
                        console.log("[PYTHON]:", trimmedLine);
                    }
                } else {
                    console.log(`  [PYTHON DETAY]: ${trimmedLine}`);
                }
            });
        });

        pyProcess.stderr.on("data", (data) => {
            stderrData += data.toString("utf-8");
        });

        pyProcess.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(
                    new Error(
                        `Python scripti hata ile sonlandı (Exit Code: ${code}). Hata Detayı: ${stderrData}`
                    )
                );
            }
        });

        pyProcess.on("error", (err) => {
            reject(new Error(`Python başlatılamadı: ${err.message}`));
        });
    });
}

// ==========================================
// 🛠️ HELPER: offer_number Parçalama Fonksiyonu
// ==========================================
function parseOfferNumber(offerNumber) {
    if (!offerNumber) return {};

    const parts = offerNumber.trim().split(/\s+/);
    const prefix = parts[0] || null;
    const revCode = parts[1] || null;
    const unitCount = parseInt(parts[5], 10) || null;

    const totalDiskCount = parseInt(parts[parts.length - 1], 10) || null;
    const organikYuk = parseFloat(parts[parts.length - 2]) || null;
    const parsedDebi = parseFloat(parts[parts.length - 3]) || null;

    const modelTypeParts = parts.slice(6, parts.length - 3);
    const unitModelType = modelTypeParts.length > 0 ? modelTypeParts.join(" ") : null;

    return {
        prefix,
        revCode,
        unitCount,
        unitModelType,
        parsedDebi,
        organikYuk,
        totalDiskCount,
    };
}

// ==========================================
// ➕ 1. FORM DATAYI HER DEFA YENİ BİR KAYIT OLARAK EKLEYECEK
// ==========================================
const sendFormData = async (req, res) => {
    // ⛔ 1. ÇAKIŞMA KONTROLÜ
    if (isProcessing) {
        return res.status(200).json({
            message: "Şu an process çalışıyor birazdan tekrar deneyin",
            isBusy: true,
        });
    }

    const payload = req.body?.formData || req.body;

    if (!payload || Object.keys(payload).length === 0) {
        return res.status(400).json({ message: "Geçerli bir teklif verisi gelmedi." });
    }

    const userId = req.user?.id || null;

    if (!userId) {
        return res.status(401).json({ message: "Oturum açmış kullanıcı verisi bulunamadı." });
    }

    const customerInfo = payload.customerInfo || {};
    const offerNumberStr = customerInfo.offer_number || "";
    const customerId = customerInfo.customer_id || null; // 👈 customer_id okundu

    // 🔍 Teklif klasörünün önceden var olup olmadığını kontrol et
    if (offerNumberStr) {
        const finalOfferBaseDir = path.resolve(__dirname, "../doc_test/final_offer");
        const folderName = getOfferFolderName(offerNumberStr, customerId);
        const offerFolderPath = path.join(finalOfferBaseDir, folderName);

        try {
            await fs.access(offerFolderPath);
            return res.status(400).json({
                message: "Böyle bir teklif zaten mevcut.",
                exists: true,
                offer_number: offerNumberStr,
                customer_id: customerId
            });
        } catch {
            // Klasör yoksa işleme güvenle devam edebiliriz
        }
    }

    // 🔒 Kilidi aktif et
    isProcessing = true;

    try {
        // ----------------------------------------------------
        // 🐍 1. ADIM: Python Scriptini Çalıştır
        // ----------------------------------------------------
        console.log("Belge oluşturma süreci (Python) başlatılıyor...");
        await runPythonDocGen(payload);
        console.log("Python belgelendirme işlemi başarıyla tamamlandı.");

        // ----------------------------------------------------
        // 💾 2. ADIM: Python bittikten sonra DB'ye Veri Ekleme
        // ----------------------------------------------------
        const planetDiskDetails = payload.planetDiskDetails || {};
        const aritmaParametreleri = planetDiskDetails?.tasarim?.aritmaParametreleri || {};

        const parsedOffer = parseOfferNumber(offerNumberStr);

        const sqlQuery = `
      INSERT INTO offers (
        user_id,
        customer_id,
        teklif_no,
        revizyon_no,
        unit_system,
        currency,
        exchange_rate,
        ticari_unvan,
        teklif_dili,
        planettek_indirim,
        ekipman_indirim,
        ilgili_kisi,
        ilgili_kisi_email,
        offer_number,
        offer_code_prefix,
        offer_rev_code,
        unit_count,
        unit_model_type,
        parsed_debi,
        parsed_organik_yuk,
        parsed_total_disk_count,
        debi,
        hesap_yontemi,
        atiksutype,
        rbc_unite,
        giris_boi,
        cikis_boi,
        sicaklik,
        giderim_verimi,
        emperik,
        maksimum_emperik,
        nitrifikasyon,
        giris_amonyum,
        cikis_amonyum,
        nitrifikasyon_emperik,
        is_emperik_manual,
        full_form_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const queryParams = [
            userId,
            customerInfo.customer_id || null,
            customerInfo.teklifNo || null,
            customerInfo.revizyonNo || null,
            customerInfo.unitSystem || null,
            customerInfo.currency || null,
            parseFloat(customerInfo.exchangeRate) || 1.0,
            customerInfo.ticari_unvan || null,
            customerInfo.teklifDili || null,
            parseFloat(customerInfo.planetTekIndirim) || 0,
            parseFloat(customerInfo.ekipmanIndirim) || 0,
            customerInfo.ilgiliKisi || null,
            customerInfo.ilgiliKisi_email || null,
            offerNumberStr,
            parsedOffer.prefix,
            parsedOffer.revCode,
            parsedOffer.unitCount,
            parsedOffer.unitModelType,
            parsedOffer.parsedDebi,
            parsedOffer.organikYuk,
            parsedOffer.totalDiskCount,
            parseFloat(planetDiskDetails.debi) || null,
            aritmaParametreleri.hesapYontemi || null,
            aritmaParametreleri.atiksutype || null,
            aritmaParametreleri.RBCUnite || null,
            parseFloat(aritmaParametreleri.girisBoi) || null,
            parseFloat(aritmaParametreleri.cikisBoi) || null,
            parseFloat(aritmaParametreleri.sicaklik) || null,
            parseFloat(aritmaParametreleri.giderimVerimi) || null,
            parseFloat(aritmaParametreleri.emperik) || null,
            parseFloat(aritmaParametreleri.maksimumEmperik) || null,
            aritmaParametreleri.nitrifikasyon || null,
            parseFloat(aritmaParametreleri.girisAmonyum) || null,
            parseFloat(aritmaParametreleri.cikisAmonyum) || null,
            parseFloat(aritmaParametreleri.nitrifikasyonEmperik) || null,
            aritmaParametreleri.isEmperikManual ? 1 : 0,
            JSON.stringify(payload),
        ];

        const [result] = await pool.execute(sqlQuery, queryParams);

        if (typeof logActivity === "function") {
            const offerNumberLog = offerNumberStr || customerInfo.teklifNo || "Bilinmiyor";
            await logActivity(
                userId,
                "RECEIVE_OFFER_DATA",
                `Yeni teklif versiyonu kaydedildi (${customerInfo.revizyonNo || 'R0'}): ${offerNumberLog}`
            );
        }

        return res.status(200).json({
            message: "Doküman oluşturuldu ve teklif başarıyla kaydedildi.",
            isBusy: false,
            offerId: result.insertId,
            receivedOfferNo: offerNumberStr || customerInfo.teklifNo || null,
            revizyonNo: customerInfo.revizyonNo || "R0"
        });
    } catch (error) {
        console.error("sendFormData Error:", error.message);
        return res.status(500).json({
            message: "İşlem sırasında bir hata oluştu.",
            error: error.message,
        });
    } finally {
        isProcessing = false;
    }
};

// ==========================================
// 🔍 2. TEKLİFE AİT DOSYALARI (DOCX, PDF, XLSX) LİSTELEME API
// ==========================================
const getTeklifData = async (req, res) => {
    const offerNumber = req.body?.offer_number || req.body?.offerNumber;
    const customerId = req.body?.customer_id || req.body?.customerId || null; // 👈 customer_id eklendi

    if (!offerNumber) {
        return res.status(400).json({ message: "Teklif numarası (offer_number) body içerisinde gönderilmelidir." });
    }

    try {
        const docTestDir = path.resolve(__dirname, "../doc_test/final_offer");
        const folderName = getOfferFolderName(offerNumber, customerId);
        const offerDir = path.join(docTestDir, folderName);

        // Klasör kontrolü
        try {
            await fs.access(offerDir);
        } catch {
            return res.status(404).json({
                message: `Belirtilen teklife ait klasör bulunamadı: ${folderName}`,
                exists: false,
            });
        }

        const files = await fs.readdir(offerDir);

        const docxFiles = files.filter((f) => f.toLowerCase().endsWith(".docx"));
        const pdfFiles = files.filter((f) => f.toLowerCase().endsWith(".pdf"));
        const xlsxFiles = files.filter((f) => f.toLowerCase().endsWith(".xlsx"));

        return res.status(200).json({
            message: "Teklif dosyaları başarıyla listelendi.",
            exists: true,
            offer_number: offerNumber.trim(),
            customer_id: customerId,
            files: {
                docx: docxFiles,
                pdf: pdfFiles,
                xlsx: xlsxFiles,
            },
            allFiles: files,
        });
    } catch (error) {
        console.error("[getTeklifData Hata]:", error.message);
        return res.status(500).json({
            message: "Teklif dosyaları listelenirken sunucu hatası oluştu.",
            error: error.message,
        });
    }
};

// ==========================================
// 📄 3. TEKLİFE AİT DOKÜMANLARI İNDİRME / ALMA API
// ==========================================
const getDocData = async (req, res) => {
    const offerNumber = req.body?.offer_number || req.body?.offerNumber;
    const customerId = req.body?.customer_id || req.body?.customerId || null; // 👈 customer_id eklendi
    let fileType = req.body?.file_type || req.body?.fileType || "docx";

    console.log(`[getDocData] İstek Alındı - Offer: "${offerNumber}", CustomerId: "${customerId}", FileType: "${fileType}"`);

    if (!offerNumber) {
        return res.status(400).json({ message: "Teklif numarası (offer_number) body içinde belirtilmedi." });
    }

    fileType = fileType.toLowerCase().replace(".", "").trim();

    const supportedTypes = ["docx", "pdf", "xlsx"];
    if (!supportedTypes.includes(fileType)) {
        return res.status(400).json({
            message: `Geçersiz dosya tipi (${fileType}). Desteklenen tipler: docx, pdf, xlsx`,
        });
    }

    try {
        const docTestDir = path.resolve(__dirname, "../doc_test/final_offer");
        const folderName = getOfferFolderName(offerNumber, customerId);
        const offerDir = path.join(docTestDir, folderName);

        try {
            await fs.access(offerDir);
        } catch {
            console.error(`[getDocData HATA] Klasör bulunamadı: ${offerDir}`);
            return res.status(404).json({ message: `Belirtilen teklife ait klasör bulunamadı: ${folderName}` });
        }

        const files = await fs.readdir(offerDir);
        let targetFile = files.find((f) => f.toLowerCase().endsWith(`.${fileType}`));

        if (!targetFile) {
            console.error(`[getDocData HATA] Klasörde .${fileType} uzantılı dosya yok. Mevcut dosyalar:`, files);
            return res.status(404).json({
                message: `Teklife ait .${fileType} uzantılı dosya bulunamadı.`,
            });
        }

        const filePath = path.join(offerDir, targetFile);

        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        return res.download(filePath, targetFile, (err) => {
            if (err && !res.headersSent) {
                console.error("Dosya indirme aktarım hatası:", err.message);
                return res.status(500).json({ message: "Dosya aktarılırken hata oluştu." });
            }
        });
    } catch (error) {
        console.error("[getDocData Sunucu Hatası]:", error.message);
        return res.status(500).json({
            message: "Sunucu hatası oluştu.",
            error: error.message,
        });
    }
};

// ==========================================
// 📊 4. GELİŞMİŞ ÇOKLU FİLTRELEME VE PAGINATION İLE LİSTELEME API
// ==========================================
const getAllOffers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
        const offset = (page - 1) * limit;

        // Gelen tüm olası filtre parametreleri
        const {
            search,               // Genel arama (Hepsinde arar)
            offer_number,
            offer_status,         // 🆕 Teklif Durumu filtresi eklendi
            teklif_no,
            ticari_unvan,
            hazirlayan_kullanici, // u.isim
            user_id,
            currency,
            atiksutype,
            hesap_yontemi,
            unit_model_type,
            teklif_dili,
            min_debi,
            max_debi,
            min_boi,
            max_boi,
            startDate,
            endDate
        } = req.query;

        let whereClauses = [];
        let queryParams = [];

        // 🔍 1. Genel Arama (Herhangi bir alanda eşleşme)
        if (search && search.trim() !== "") {
            whereClauses.push(`(
                o.offer_number LIKE ? OR 
                o.teklif_no LIKE ? OR 
                o.ticari_unvan LIKE ? OR 
                o.ilgili_kisi LIKE ? OR 
                u.isim LIKE ? OR
                o.unit_model_type LIKE ? OR
                o.offer_status LIKE ?
            )`);
            const term = `%${search.trim()}%`;
            queryParams.push(term, term, term, term, term, term, term);
        }

        // 🏷️ 2. Kolon Bazlı Dinamik Süzdürme (Kombinlenebilir)
        if (offer_status && offer_status.trim() !== "") {
            whereClauses.push("o.offer_status = ?");
            queryParams.push(offer_status.trim());
        }

        if (offer_number && offer_number.trim() !== "") {
            whereClauses.push("o.offer_number LIKE ?");
            queryParams.push(`%${offer_number.trim()}%`);
        }

        if (teklif_no && teklif_no.trim() !== "") {
            whereClauses.push("o.teklif_no LIKE ?");
            queryParams.push(`%${teklif_no.trim()}%`);
        }

        if (ticari_unvan && ticari_unvan.trim() !== "") {
            whereClauses.push("o.ticari_unvan LIKE ?");
            queryParams.push(`%${ticari_unvan.trim()}%`);
        }

        if (hazirlayan_kullanici && hazirlayan_kullanici.trim() !== "") {
            whereClauses.push("u.isim LIKE ?");
            queryParams.push(`%${hazirlayan_kullanici.trim()}%`);
        }

        if (user_id && !isNaN(parseInt(user_id, 10))) {
            whereClauses.push("o.user_id = ?");
            queryParams.push(parseInt(user_id, 10));
        }

        if (currency && currency.trim() !== "") {
            whereClauses.push("o.currency = ?");
            queryParams.push(currency.trim());
        }

        if (atiksutype && atiksutype.trim() !== "") {
            whereClauses.push("o.atiksutype = ?");
            queryParams.push(atiksutype.trim());
        }

        if (hesap_yontemi && hesap_yontemi.trim() !== "") {
            whereClauses.push("o.hesap_yontemi = ?");
            queryParams.push(hesap_yontemi.trim());
        }

        if (unit_model_type && unit_model_type.trim() !== "") {
            whereClauses.push("o.unit_model_type LIKE ?");
            queryParams.push(`%${unit_model_type.trim()}%`);
        }

        if (teklif_dili && teklif_dili.trim() !== "") {
            whereClauses.push("o.teklif_dili = ?");
            queryParams.push(teklif_dili.trim());
        }

        // 💧 3. Sayısal Aralık Filtreleri (Debi & BOİ)
        if (min_debi !== undefined && !isNaN(parseFloat(min_debi))) {
            whereClauses.push("(o.debi >= ? OR o.parsed_debi >= ?)");
            const val = parseFloat(min_debi);
            queryParams.push(val, val);
        }

        if (max_debi !== undefined && !isNaN(parseFloat(max_debi))) {
            whereClauses.push("(o.debi <= ? OR o.parsed_debi <= ?)");
            const val = parseFloat(max_debi);
            queryParams.push(val, val);
        }

        if (min_boi !== undefined && !isNaN(parseFloat(min_boi))) {
            whereClauses.push("o.giris_boi >= ?");
            queryParams.push(parseFloat(min_boi));
        }

        if (max_boi !== undefined && !isNaN(parseFloat(max_boi))) {
            whereClauses.push("o.cikis_boi <= ?");
            queryParams.push(parseFloat(max_boi));
        }

        // 📅 4. Tarih Aralığı Filtreleri
        if (startDate && startDate.trim() !== "") {
            whereClauses.push("DATE(o.created_at) >= ?");
            queryParams.push(startDate.trim());
        }

        if (endDate && endDate.trim() !== "") {
            whereClauses.push("DATE(o.created_at) <= ?");
            queryParams.push(endDate.trim());
        }

        const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

        // 📊 Toplam Kayıt Sayısı (Pagination için)
        const countQuery = `
            SELECT COUNT(*) AS total 
            FROM offers o
            LEFT JOIN users u ON o.user_id = u.id
            ${whereSQL}
        `;
        const [[{ total }]] = await pool.execute(countQuery, queryParams);

        // 📄 Sayfalanmış Ana Sorgu
        const sqlQuery = `
            SELECT 
                o.*,
                u.isim AS hazirlayan_kullanici,
                u.eposta AS hazirlayan_eposta,
                u.departman AS hazirlayan_departman
            FROM offers o
            LEFT JOIN users u ON o.user_id = u.id
            ${whereSQL}
            ORDER BY o.id DESC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await pool.query(sqlQuery, [...queryParams, limit, offset]);

        const docTestDir = path.resolve(__dirname, "../doc_test/final_offer");

        const offersWithFiles = await Promise.all(
            rows.map(async (offer) => {
                let customerId = null;

                if (offer.full_form_data) {
                    try {
                        const parsedForm = typeof offer.full_form_data === "string"
                            ? JSON.parse(offer.full_form_data)
                            : offer.full_form_data;
                        customerId = parsedForm?.customerInfo?.customer_id || null;
                    } catch (e) {
                        console.error("full_form_data parse hatası:", e.message);
                    }
                }

                const folderName = getOfferFolderName(offer.offer_number, customerId);
                const offerDir = path.join(docTestDir, folderName);

                let files = { docx: [], pdf: [], xlsx: [] };
                let folderExists = false;

                try {
                    const dirFiles = await fs.readdir(offerDir);
                    folderExists = true;
                    files = {
                        docx: dirFiles.filter((f) => f.toLowerCase().endsWith(".docx")),
                        pdf: dirFiles.filter((f) => f.toLowerCase().endsWith(".pdf")),
                        xlsx: dirFiles.filter((f) => f.toLowerCase().endsWith(".xlsx")),
                    };
                } catch {
                    // Klasör yok
                }

                return {
                    ...offer,
                    customer_id: customerId,
                    folder_exists: folderExists,
                    files: files,
                };
            })
        );

        return res.status(200).json({
            message: "Teklifler başarıyla filtrelendi ve getirildi.",
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
            data: offersWithFiles,
        });
    } catch (error) {
        console.error("[getAllOffers Hata]:", error.message);
        return res.status(500).json({
            message: "Teklifler filtrelenirken sunucu hatası oluştu.",
            error: error.message,
        });
    }
};

module.exports = { sendFormData, getDocData, getTeklifData, getAllOffers };