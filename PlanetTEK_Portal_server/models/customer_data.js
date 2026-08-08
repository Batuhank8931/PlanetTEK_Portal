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

// ==========================================
// 🛠️ YARDIMCI FONKSİYON: Teklif Özetini Oluşturma
// ==========================================
const calculateOfferSummary = (customerOffers = []) => {
    if (!customerOffers || customerOffers.length === 0) {
        return {
            teklifAdedi: 0,
            teklifDetay: "Teklif Bulunmuyor"
        };
    }

    const statusCounts = {};

    customerOffers.forEach((offer) => {
        let status = null;

        // 1. JSON verisinden durum bilgisini çek
        if (offer.full_form_data) {
            try {
                const formData = typeof offer.full_form_data === "string"
                    ? JSON.parse(offer.full_form_data)
                    : offer.full_form_data;
                status = formData.durum || formData.status;
            } catch (e) {
                status = null;
            }
        }

        // 2. Varsayılan durum
        status = status || "Aktif";

        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const teklifAdedi = customerOffers.length;

    // Örn: "2 Aktif, 1 Onaylandı, 1 Reddedildi"
    const teklifDetay = Object.entries(statusCounts)
        .map(([statusName, count]) => `${count} ${statusName}`)
        .join(", ");

    return { teklifAdedi, teklifDetay };
};


// ==========================================
// 🔍 1. TÜM MÜŞTERİLERİ LİSTELEME
// GET / POST api/getCustomers
// ==========================================
const getCustomers = async (req, res) => {
    try {
        // 1. Müşteri ana bilgilerini ve Satış Temsilcisi adını çek
        const [customers] = await pool.execute(
            `SELECT 
                c.id,
                c.ticari_unvan,
                c.mensei,
                c.ulke,
                c.adres,
                c.vergiDairesi,
                c.vergiNo,
                c.user_id,
                u.isim AS yetkiliSatisci,
                c.created_at,
                c.updated_at
             FROM customers c
             LEFT JOIN users u ON c.user_id = u.id
             ORDER BY c.id DESC`
        );

        if (customers.length === 0) {
            return res.json([]);
        }

        const customerIds = customers.map((c) => c.id);

        // 2. Tüm Müşterilerin Yetkililerini (Kontaklarını) çek
        const [allContacts] = await pool.query(
            `SELECT customer_id, isim, mail, telefon 
             FROM customer_contacts 
             WHERE customer_id IN (?)`,
            [customerIds]
        );

        // 3. Tüm Müşterilerin Tekliflerini çek
        const [allOffers] = await pool.query(
            `SELECT customer_id, full_form_data 
             FROM offers 
             WHERE customer_id IN (?)`,
            [customerIds]
        );

        // 4. Verileri müşteri bazlı gruplayarak birleştir
        const result = customers.map((customer) => {
            // İlgili müşterinin yetkilileri
            const yetkililer = allContacts
                .filter((contact) => contact.customer_id === customer.id)
                .map(({ isim, mail, telefon }) => ({ isim, mail, telefon }));

            // İlgili müşterinin teklifleri ve özeti
            const customerOffers = allOffers.filter((offer) => offer.customer_id === customer.id);
            const { teklifAdedi, teklifDetay } = calculateOfferSummary(customerOffers);

            return {
                id: customer.id,
                ticari_unvan: customer.ticari_unvan,
                mensei: customer.mensei,
                ulke: customer.ulke,
                adres: customer.adres,
                vergiDairesi: customer.vergiDairesi,
                vergiNo: customer.vergiNo,
                yetkililer: yetkililer,
                teklifAdedi: teklifAdedi,
                teklifDetay: teklifDetay,
                yetkiliSatisci: customer.yetkiliSatisci || "Atanmadı"
            };
        });

        return res.json(result);

    } catch (error) {
        console.error("getCustomers Error:", error.message);
        return res.status(500).json({ message: "Müşteriler getirilirken hata oluştu.", error: error.message });
    }
};


// ==========================================
// 🎯 2. TEK MÜŞTERİ DETAYI (Modal/Edit için)
// GET api/getCustomer/:id
// ==========================================
const getCustomerById = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Müşteri ana bilgisi
        const [customerRows] = await pool.execute(
            `SELECT 
                c.id,
                c.ticari_unvan,
                c.mensei,
                c.ulke,
                c.adres,
                c.vergiDairesi,
                c.vergiNo,
                c.user_id,
                u.isim AS yetkiliSatisci
             FROM customers c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.id = ? LIMIT 1`,
            [id]
        );

        if (customerRows.length === 0) {
            return res.status(404).json({ message: "Müşteri bulunamadı." });
        }

        const customer = customerRows[0];

        // 2. Müşteri Yetkilileri
        const [contacts] = await pool.execute(
            `SELECT isim, mail, telefon FROM customer_contacts WHERE customer_id = ?`,
            [id]
        );

        // 3. Müşteri Teklifleri
        const [offers] = await pool.execute(
            `SELECT full_form_data FROM offers WHERE customer_id = ?`,
            [id]
        );

        const { teklifAdedi, teklifDetay } = calculateOfferSummary(offers);

        // İstenen tam JSON formatı
        const responseData = {
            id: customer.id,
            ticari_unvan: customer.ticari_unvan,
            mensei: customer.mensei,
            ulke: customer.ulke,
            adres: customer.adres,
            vergiDairesi: customer.vergiDairesi,
            vergiNo: customer.vergiNo,
            yetkililer: contacts || [],
            teklifAdedi: teklifAdedi,
            teklifDetay: teklifDetay,
            yetkiliSatisci: customer.yetkiliSatisci || "Atanmadı"
        };

        return res.json(responseData);

    } catch (error) {
        console.error("getCustomerById Error:", error.message);
        return res.status(500).json({ message: "Müşteri detayı alınırken hata oluştu.", error: error.message });
    }
};
// ==========================================
// ➕ 2. YENİ MÜŞTERİ VE YETKİLİ EKLEME
// ==========================================
const addCustomer = async (req, res) => {
    const {
        ticari_unvan,
        mensei,
        ulke,
        adres,
        vergiDairesi,
        vergiNo,
        user_id,
        contacts // Dizi olarak beklenir: [{ isim: "Ahmet", mail: "a@b.com", telefon: "05..." }]
    } = req.body;

    if (!ticari_unvan || !ticari_unvan.trim()) {
        return res.status(400).json({ message: "Ticari ünvan alanı zorunludur." });
    }

    // İlişkili tablo eklemeleri için Transaction başlatıyoruz
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Müşteri kaydı
        const [customerResult] = await connection.execute(
            `INSERT INTO customers 
            (ticari_unvan, mensei, ulke, adres, vergiDairesi, vergiNo, user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                ticari_unvan.trim(),
                mensei || "Yerli",
                ulke ? ulke.trim() : "Türkiye",
                adres ? adres.trim() : null,
                vergiDairesi ? vergiDairesi.trim() : null,
                vergiNo ? vergiNo.trim() : null,
                user_id || (req.user ? req.user.id : null)
            ]
        );

        const newCustomerId = customerResult.insertId;

        // 2. İrtibat Kişileri (Contacts) varsa ekle
        if (Array.isArray(contacts) && contacts.length > 0) {
            for (const contact of contacts) {
                if (contact.isim && contact.isim.trim()) {
                    await connection.execute(
                        `INSERT INTO customer_contacts (customer_id, isim, mail, telefon) VALUES (?, ?, ?, ?)`,
                        [
                            newCustomerId,
                            contact.isim.trim(),
                            contact.mail ? contact.mail.trim() : null,
                            contact.telefon ? contact.telefon.trim() : null
                        ]
                    );
                }
            }
        }

        await connection.commit();

        // LOG AT
        if (req.user && req.user.id) {
            await logActivity(req.user.id, {
                tip: "musteri_ekleme",
                eklenen_musteri_id: newCustomerId,
                ticari_unvan: ticari_unvan.trim()
            });
        }

        return res.status(201).json({
            message: "Müşteri ve yetkili bilgileri başarıyla oluşturuldu.",
            customerId: newCustomerId
        });

    } catch (error) {
        await connection.rollback();
        console.error("addCustomer Error:", error.message);
        return res.status(500).json({ message: "Müşteri eklenirken teknik hata oluştu.", error: error.message });
    } finally {
        connection.release();
    }
};

// ==========================================
// 🔄 3. MÜŞTERİ VE YETKİLİ GÜNCELLEME
// ==========================================
const putCustomer = async (req, res) => {
    const { id } = req.params;
    const {
        ticari_unvan,
        mensei,
        ulke,
        adres,
        vergiDairesi,
        vergiNo,
        user_id,
        contacts
    } = req.body;

    const adminId = req.user?.id;

    if (!ticari_unvan || !ticari_unvan.trim()) {
        return res.status(400).json({ message: "Ticari ünvan boş bırakılamaz." });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 🔍 1. Mevcut veriyi kontrol et (Log kıyası için)
        const [customerCheck] = await connection.execute(
            "SELECT * FROM customers WHERE id = ? LIMIT 1",
            [id]
        );

        if (customerCheck.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Güncellenecek müşteri bulunamadı." });
        }

        const oldData = customerCheck[0];

        // 🔄 2. Müşteri ana bilgilerini güncelle
        await connection.execute(
            `UPDATE customers SET 
                ticari_unvan = ?, 
                mensei = ?, 
                ulke = ?, 
                adres = ?, 
                vergiDairesi = ?, 
                vergiNo = ?, 
                user_id = ? 
             WHERE id = ?`,
            [
                ticari_unvan.trim(),
                mensei || "Yerli",
                ulke ? ulke.trim() : "Türkiye",
                adres ? adres.trim() : null,
                vergiDairesi ? vergiDairesi.trim() : null,
                vergiNo ? vergiNo.trim() : null,
                user_id || null,
                id
            ]
        );

        // 🔄 3. İrtibat kişilerinde ezme / yeniden yazma stratejisi
        if (Array.isArray(contacts)) {
            // Eski kontakları temizle (CASCADE tanımlı olsa da transaction içinde yönetmek güvenlidir)
            await connection.execute("DELETE FROM customer_contacts WHERE customer_id = ?", [id]);

            // Yenileri ekle
            for (const contact of contacts) {
                if (contact.isim && contact.isim.trim()) {
                    await connection.execute(
                        `INSERT INTO customer_contacts (customer_id, isim, mail, telefon) VALUES (?, ?, ?, ?)`,
                        [
                            id,
                            contact.isim.trim(),
                            contact.mail ? contact.mail.trim() : null,
                            contact.telefon ? contact.telefon.trim() : null
                        ]
                    );
                }
            }
        }

        await connection.commit();

        // 📝 Değişiklik Analizi
        const dinamikDegisiklikler = {};
        if (oldData.ticari_unvan !== ticari_unvan.trim()) dinamikDegisiklikler.ticari_unvan = { eski: oldData.ticari_unvan, yeni: ticari_unvan.trim() };
        if (oldData.mensei !== mensei) dinamikDegisiklikler.mensei = { eski: oldData.mensei, yeni: mensei };
        if (oldData.ulke !== ulke) dinamikDegisiklikler.ulke = { eski: oldData.ulke, yeni: ulke };
        if (oldData.vergiNo !== vergiNo) dinamikDegisiklikler.vergiNo = { eski: oldData.vergiNo, yeni: vergiNo };
        if (Array.isArray(contacts)) dinamikDegisiklikler.kontaklar = { mesaj: "Müşteri yetkili listesi güncellendi." };

        if (Object.keys(dinamikDegisiklikler).length > 0) {
            await logActivity(adminId, {
                tip: "musteri_guncelleme",
                hedef_musteri_id: id,
                degisiklikler: dinamikDegisiklikler,
                tarih: new Date().toISOString()
            });
        }

        return res.json({ message: "Müşteri ve yetkili bilgileri başarıyla güncellendi." });

    } catch (error) {
        await connection.rollback();
        console.error("putCustomer Error:", error.message);
        return res.status(500).json({ message: "Güncelleme esnasında teknik hata oluştu.", error: error.message });
    } finally {
        connection.release();
    }
};

// ==========================================
// ❌ 4. MÜŞTERİ SİLME
// ==========================================
const deleteCustomer = async (req, res) => {
    const { id } = req.params;

    try {
        // Silmeden önce ismi logda saklamak için çek
        const [customer] = await pool.execute("SELECT ticari_unvan FROM customers WHERE id = ?", [id]);

        if (customer.length === 0) {
            return res.status(404).json({ message: "Müşteri bulunamadı." });
        }

        // DB tablosunda FOREIGN KEY constraint 'ON DELETE CASCADE' olduğu için
        // customers silindiğinde ilişkili customer_contacts otomatik silinir.
        const [result] = await pool.execute("DELETE FROM customers WHERE id = ?", [id]);

        // LOG AT
        if (req.user && req.user.id) {
            await logActivity(req.user.id, {
                tip: "musteri_silme",
                silinen_musteri_id: id,
                silinen_ticari_unvan: customer[0]?.ticari_unvan || "Bilinmiyor"
            });
        }

        return res.json({ message: "Müşteri ve bağlı tüm yetkili kayıtları silindi." });
    } catch (error) {
        console.error("deleteCustomer Error:", error.message);
        return res.status(500).json({ message: "Silme işlemi sırasında teknik hata oluştu.", error: error.message });
    }
};



module.exports = {
    getCustomers,
    addCustomer,
    putCustomer,
    deleteCustomer,
    getCustomerById
};