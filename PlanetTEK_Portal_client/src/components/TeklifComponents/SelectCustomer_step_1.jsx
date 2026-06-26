import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore"; // Store yolunu kontrol edin

// API sonradan bağlanacağı için simüle edilmiş birden fazla indirim geçmişi barındıran veri havuzu
const MOCK_CUSTOMERS_DB = [
    {
        id: 1,
        ticariUnvan: "Acme Endüstri A.Ş.",
        teklifDili: "Yerli",
        ilgiliKisiler: ["Ahmet Yılmaz (Satın Alma Müdürü)", "Mehmet Kaya (Operasyon)"],
        indirimler: [
            { planetTekIndirim: 15, ekipmanIndirim: 10, indirimTarihi: "2026-04-12" },
            { planetTekIndirim: 20, ekipmanIndirim: 12, indirimTarihi: "2026-05-15" } // En güncel bu
        ]
    },
    {
        id: 2,
        ticariUnvan: "Global Tech LLC",
        teklifDili: "Yabancı",
        ilgiliKisiler: ["John Doe (CTO)", "Jane Smith (Procurement)"],
        indirimler: [
            { planetTekIndirim: 25, ekipmanIndirim: 5, indirimTarihi: "2026-05-01" }
        ]
    },
    {
        id: 3,
        ticariUnvan: "Yıldız Holding",
        teklifDili: "Yerli",
        ilgiliKisiler: ["Selin Yıldız"],
        indirimler: [] // Hiç indirim tanımı yok
    }
];

function SelectCustomer() {
    // 1. Store'dan veriyi çekerken default boş obje atıyoruz ki undefined hatası patlamasın
    const customerInfo = useTeklifStore((state) => state.formData.customerInfo) || {};
    const updateSection = useTeklifStore((state) => state.updateSection);

    // 2. Lokal UI State'leri
    const [searchTerm, setSearchTerm] = useState(customerInfo.ticariUnvan || "");
    const [searchResults, setSearchResults] = useState([]);
    const [isSelecting, setIsSelecting] = useState(false);

    // Geçmiş indirim listesi için seçili objeyi lokalde eşleştiriyoruz
    const [selectedCustomer, setSelectedCustomer] = useState(
        MOCK_CUSTOMERS_DB.find(c => c.ticariUnvan === customerInfo.ticariUnvan) || null
    );

    // Arama mekanizmasını yöneten useEffect
    useEffect(() => {
        if (isSelecting) {
            setIsSelecting(false);
            return;
        }

        if (searchTerm.trim() === "") {
            setSearchResults([]);
            return;
        }

        const filtered = MOCK_CUSTOMERS_DB.filter(c =>
            c.ticariUnvan.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(filtered);
    }, [searchTerm]);

    const handleSelectCustomer = (customer) => {
        setIsSelecting(true);
        setSelectedCustomer(customer);
        setSearchTerm(customer.ticariUnvan);
        setSearchResults([]);

        // Eğer indirim varsa en güncel olanı bulalım
        const siraliIndirimler = customer.indirimler
            ? [...customer.indirimler].sort((a, b) => new Date(b.indirimTarihi) - new Date(a.indirimTarihi))
            : [];

        const enGuncelIndirim = siraliIndirimler[0] || {};

        // "customerInfo" key'ini ilk kez burada komple doldurarak store'a pushluyoruz
        // revizyonNo: "R0" arka planda formData'ya eklendi
        updateSection("customerInfo", {
            ...customerInfo,
            ticariUnvan: customer.ticariUnvan,
            teklifDili: customer.teklifDili || "Türkçe",
            planetTekIndirim: enGuncelIndirim.planetTekIndirim || "",
            ekipmanIndirim: enGuncelIndirim.ekipmanIndirim || "",
            ilgiliKisi: customer.ilgiliKisiler[0] || "",
            revizyonNo: "R0" 
        });
    };

    const handleChange = (e) => {
        // Obje içindeki tekil key güncellemelerini doğrudan "customerInfo" altına basıyoruz
        updateSection("customerInfo", { [e.target.name]: e.target.value });
    };

    // Teklif numarası için özel tamsayı ve 4 hane kontrolü
    const handleTeklifNoChange = (e) => {
        let val = e.target.value;
        
        if (val === "") {
            updateSection("customerInfo", { teklifNo: "" });
            return;
        }

        // Sadece sayıları al, tamsayıya çevir (fixedTo0 mantığı) ve ilk 4 hanesini kes
        let numericValue = parseInt(val, 10);
        if (isNaN(numericValue)) return;

        let fixedVal = Math.floor(numericValue).toString().slice(0, 4);
        
        updateSection("customerInfo", { teklifNo: parseInt(fixedVal, 10) });
    };

    // Seçilen müşterinin indirimlerini tarihe göre sıralayalım (En yeni -> En eski)
    const siraliIndirimler = selectedCustomer?.indirimler
        ? [...selectedCustomer.indirimler].sort((a, b) => new Date(b.indirimTarihi) - new Date(a.indirimTarihi))
        : [];

    return (
        <div className="card border-0 text-white h-100 p-4 gap-3" style={{ backgroundColor: "#1a1c1d", borderRadius: "5px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>

            {/* Adım Başlığı */}
            <div className="d-flex align-items-center">
                <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
                    Müşteri Genel Bilgileri
                </span>
                <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
            </div>

            {/* ANA SATIR: Müşteri Arama, Teklif Numarası ve Dil Seçimi */}
            <div className="row g-3 py-3">
                {/* Ticari Ünvan */}
                <div className="col-12 col-md-5 position-relative">
                    <label className="form-label mb-1 small fw-medium text-white-50" style={{ fontSize: "11px" }}>
                        Ticari Ünvan / Şirket Adı *
                    </label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (e.target.value === "") {
                                setSelectedCustomer(null);
                                // Arama silinirse store'daki bu key'in içini temizliyoruz (Teklif no ve revizyonNo korunur)
                                updateSection("customerInfo", {
                                    teklifNo: customerInfo.teklifNo || "",
                                    revizyonNo: customerInfo.revizyonNo || "R0",
                                    ticariUnvan: "",
                                    planetTekIndirim: "",
                                    ekipmanIndirim: "",
                                    ilgiliKisi: ""
                                });
                            }
                        }}
                        className="form-control form-control-sm text-white fw-bold border-0"
                        style={{ backgroundColor: "#1e293b", borderRadius: "6px", fontSize: "12px" }}
                        placeholder="Müşteri adı ara..."
                    />

                    {/* Arama Sonuçları Pop-up Listesi */}
                    {searchResults.length > 0 && (
                        <ul
                            className="list-group position-absolute w-100 mt-1 shadow-lg border"
                            style={{ zIndex: 1050, maxHeight: "180px", overflowY: "auto", backgroundColor: "#0f172a", borderColor: "#334155" }}
                        >
                            {searchResults.map((customer) => (
                                <li
                                    key={customer.id}
                                    className="list-group-item list-group-item-action small py-2 text-white-50"
                                    style={{ cursor: "pointer", backgroundColor: "#0f172a", borderBottom: "1px solid #334155", fontSize: "12px" }}
                                    onClick={() => handleSelectCustomer(customer)}
                                >
                                    {customer.ticariUnvan}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Teklif Numarası */}
                <div className="col-12 col-md-3">
                    <label className="form-label mb-1 small fw-medium text-white-50" style={{ fontSize: "11px" }}>
                        Teklif Numarası (4 Haneli) *
                    </label>
                    <input
                        type="number"
                        name="teklifNo"
                        value={customerInfo.teklifNo ?? ""}
                        onChange={handleTeklifNoChange}
                        onKeyDown={(e) => ["e", "E", "+", "-", ",", "."].includes(e.key) && e.preventDefault()}
                        className="form-control form-control-sm text-white fw-bold border-0"
                        style={{ backgroundColor: "#1e293b", borderRadius: "6px", fontSize: "12px" }}
                        placeholder="Örn: 1024"
                        min="1000"
                        max="9999"
                    />
                </div>

                {/* Teklif Dili Seçimi */}
                <div className="col-12 col-md-4">
                    <label className="form-label mb-1 small fw-medium text-white-50" style={{ fontSize: "11px" }}>
                        Teklif Dili
                    </label>
                    <select
                        name="teklifDili"
                        value={customerInfo.teklifDili || "Yerli"}
                        onChange={handleChange}
                        className="form-select form-select-sm text-white fw-bold border-0"
                        style={{ backgroundColor: "#1e293b", borderRadius: "6px", fontSize: "12px" }}
                    >
                        <option value="Yerli" style={{ backgroundColor: "#0f172a" }}>Yerli</option>
                        <option value="Yabancı" style={{ backgroundColor: "#0f172a" }}>Yabancı</option>
                    </select>
                </div>
            </div>

            {/* Müşteri Seçildikten Sonra Yan Yana Açılacak Dinamik Alanlar */}
            {selectedCustomer && (
                <div className="row g-2 align-items-end py-3">

                    {/* İlgili Kişi Seçimi */}
                    <div className="col-12 col-md-4">
                        <label className="form-label mb-1 small fw-medium text-white-50" style={{ fontSize: "11px" }}>
                            İlgili Kişi *
                        </label>
                        <select
                            name="ilgiliKisi"
                            value={customerInfo.ilgiliKisi || ""}
                            onChange={handleChange}
                            className="form-select form-select-sm text-white fw-bold border-0"
                            style={{ backgroundColor: "#1e293b", borderRadius: "6px", fontSize: "12px" }}
                        >
                            <option value="" style={{ backgroundColor: "#0f172a" }}>Seçiniz...</option>
                            {selectedCustomer.ilgiliKisiler.map((kisi, index) => (
                                <option key={index} value={kisi} style={{ backgroundColor: "#0f172a" }}>
                                    {kisi}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* PlanetTEK İndirim Oranı */}
                    <div className="col-6 col-md-2">
                        <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>
                            PlanetTEK (%)
                        </label>
                        <input
                            type="number"
                            name="planetTekIndirim"
                            value={customerInfo.planetTekIndirim || ""}
                            onChange={handleChange}
                            className="form-control form-control-sm border-0 text-white text-center fw-bold"
                            style={{ backgroundColor: "#1e293b", fontSize: "12px", borderBottom: "2px solid #38bdf8", borderRadius: "4px 4px 0 0" }}
                            placeholder="0"
                        />
                    </div>

                    {/* Ekipman İndirim Oranı */}
                    <div className="col-6 col-md-2">
                        <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>
                            Ekipman (%)
                        </label>
                        <input
                            type="number"
                            name="ekipmanIndirim"
                            value={customerInfo.ekipmanIndirim || ""}
                            onChange={handleChange}
                            className="form-control form-control-sm border-0 text-white text-center fw-bold"
                            style={{ backgroundColor: "#1e293b", fontSize: "12px", borderBottom: "2px solid #38bdf8", borderRadius: "4px 4px 0 0" }}
                            placeholder="0"
                        />
                    </div>

                    {/* Bilgi Gösterge Kartı / Tablo */}
                    <div className="col-12 col-md-4">
                        <div
                            className="p-2 rounded border"
                            style={{
                                backgroundColor: "#0f172a",
                                borderColor: "#334155",
                                fontSize: "11px",
                                lineHeight: "1.4",
                                minHeight: "62px"
                            }}
                        >
                            <div className="fw-medium text-white-50 mb-1" style={{ fontSize: "11px" }}>
                                <i className="bi bi-clock-history me-1"></i> Kayıtlı İndirim Geçmişi
                            </div>

                            {siraliIndirimler.length === 0 ? (
                                <div className="text-muted italic py-1" style={{ fontSize: "11px" }}>
                                    Kayıtlı indirim bulunamadı.
                                </div>
                            ) : (
                                <div className="d-flex gap-2 overflow-auto pt-1">
                                    {siraliIndirimler.map((indirim, idx) => (
                                        <div
                                            key={idx}
                                            className="pe-2 text-white flex-shrink-0"
                                            style={{
                                                borderRight: idx === siraliIndirimler.length - 1 ? "none" : "1px solid #334155"
                                            }}
                                        >
                                            <div className="fw-bold" style={{ fontSize: "9px", color: idx === 0 ? "#10b981" : "#64748b" }}>
                                                {indirim.indirimTarihi} {idx === 0 && "(Güncel)"}
                                            </div>
                                            <div style={{ fontSize: "11px" }}>Plt: <strong className="text-info">%{indirim.planetTekIndirim}</strong></div>
                                            <div style={{ fontSize: "11px" }}>Ekp: <strong className="text-info">%{indirim.ekipmanIndirim}</strong></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}

export default SelectCustomer;