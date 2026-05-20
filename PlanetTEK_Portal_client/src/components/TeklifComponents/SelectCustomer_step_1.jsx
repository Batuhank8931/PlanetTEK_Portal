import React, { useState, useEffect } from "react";

// API sonradan bağlanacağı için simüle edilmiş birden fazla indirim geçmişi barındıran veri havuzu
const MOCK_CUSTOMERS_DB = [
    {
        id: 1,
        ticariUnvan: "Acme Endüstri A.Ş.",
        teklifDili: "Türkçe",
        ilgiliKisiler: ["Ahmet Yılmaz (Satın Alma Müdürü)", "Mehmet Kaya (Operasyon)"],
        // İndirimler dizi olarak tutuluyor. Hiç olmayabilir, 1 veya birden fazla olabilir.
        indirimler: [
            { planetTekIndirim: 15, ekipmanIndirim: 10, indirimTarihi: "2026-04-12" },
            { planetTekIndirim: 20, ekipmanIndirim: 12, indirimTarihi: "2026-05-15" } // En güncel bu
        ]
    },
    {
        id: 2,
        ticariUnvan: "Global Tech LLC",
        teklifDili: "İngilizce",
        ilgiliKisiler: ["John Doe (CTO)", "Jane Smith (Procurement)"],
        indirimler: [
            { planetTekIndirim: 25, ekipmanIndirim: 5, indirimTarihi: "2026-05-01" }
        ]
    },
    {
        id: 3,
        ticariUnvan: "Yıldız Holding",
        teklifDili: "Türkçe",
        ilgiliKisiler: ["Selin Yıldız"],
        indirimler: [] // Hiç indirim tanımı yok
    }
];

function SelectCustomer({ data, updateData }) {
    const [searchTerm, setSearchTerm] = useState(data.ticariUnvan || "");
    const [searchResults, setSearchResults] = useState([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

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

        // Eğer indirim varsa en güncel olanı bulup inputlara otomatik dolduralım
        const siraliIndirimler = customer.indirimler 
            ? [...customer.indirimler].sort((a, b) => new Date(b.indirimTarihi) - new Date(a.indirimTarihi))
            : [];
        
        const enGuncelIndirim = siraliIndirimler[0] || {};

        updateData({
            ...data,
            ticariUnvan: customer.ticariUnvan,
            teklifDili: customer.teklifDili || "Türkçe",
            planetTekIndirim: enGuncelIndirim.planetTekIndirim || "",
            ekipmanIndirim: enGuncelIndirim.ekipmanIndirim || "",
            ilgiliKisi: customer.ilgiliKisiler[0] || ""
        });
    };

    const handleChange = (e) => {
        updateData({ ...data, [e.target.name]: e.target.value });
    };

    // Seçilen müşterinin indirimlerini tarihe göre sıralayalım (En yeni -> En eski)
    // Böylece map ile dönerken en güncel en solda (ilk sırada) render edilecek.
    const siraliIndirimler = selectedCustomer?.indirimler
        ? [...selectedCustomer.indirimler].sort((a, b) => new Date(b.indirimTarihi) - new Date(a.indirimTarihi))
        : [];

    return (
        <div className="container-fluid p-0">
            {/* Adım Başlığı */}
            <div className="d-flex align-items-center mb-3">
                <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#e0f2f1" }}>
                    Adım 1: Müşteri Genel Bilgileri
                </span>
                <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.15)" }}></div>
            </div>

            {/* ANA SATIR: Müşteri Arama ve Dil Seçimi */}
            <div className="row g-2 mb-2">
                <div className="col-12 col-md-8 position-relative">
                    <label className="form-label mb-1 small fw-medium text-white-50">Ticari Ünvan / Şirket Adı *</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (e.target.value === "") {
                                setSelectedCustomer(null);
                                updateData({ ...data, ticariUnvan: "" });
                            }
                        }}
                        className="form-control form-control-sm border-0 bg-white text-dark"
                        placeholder="Müşteri adı ara..."
                    />

                    {/* Arama Sonuçları Pop-up Listesi */}
                    {searchResults.length > 0 && (
                        <ul className="list-group position-absolute w-100 mt-1 shadow-lg" style={{ zIndex: 1050, maxHeight: "180px", overflowY: "auto" }}>
                            {searchResults.map((customer) => (
                                <li
                                    key={customer.id}
                                    className="list-group-item list-group-item-action list-group-item-light small py-2"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleSelectCustomer(customer)}
                                >
                                    {customer.ticariUnvan}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Teklif Dili Seçimi */}
                <div className="col-12 col-md-4">
                    <label className="form-label mb-1 small fw-medium text-white-50">Teklif Dili</label>
                    <select
                        name="teklifDili"
                        value={data.teklifDili || "Türkçe"}
                        onChange={handleChange}
                        className="form-select form-select-sm border-0 bg-white text-dark"
                    >
                        <option value="Türkçe">Türkçe</option>
                        <option value="İngilizce">İngilizce</option>
                        <option value="Almanca">Almanca</option>
                    </select>
                </div>
            </div>

            {/* Müşteri Seçildikten Sonra Yan Yana Açılacak Dinamik Alanlar */}
            {selectedCustomer && (
                <div className="row g-2 align-items-end mb-3">

                    {/* İlgili Kişi Seçimi */}
                    <div className="col-12 col-md-4">
                        <label className="form-label mb-1 small fw-medium text-white-50">İlgili Kişi *</label>
                        <select
                            name="ilgiliKisi"
                            value={data.ilgiliKisi || ""}
                            onChange={handleChange}
                            className="form-select form-select-sm border-0 bg-white text-dark"
                        >
                            <option value="">Seçiniz...</option>
                            {selectedCustomer.ilgiliKisiler.map((kisi, index) => (
                                <option key={index} value={kisi}>
                                    {kisi}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* PlanetTEK İndirim Oranı */}
                    <div className="col-6 col-md-2">
                        <label className="form-label mb-1 small fw-medium text-white-50">PlanetTEK (%)</label>
                        <input
                            type="number"
                            name="planetTekIndirim"
                            value={data.planetTekIndirim || ""}
                            onChange={handleChange}
                            className="form-control form-control-sm border-0 bg-white text-dark"
                            placeholder="0"
                        />
                    </div>

                    {/* Ekipman İndirim Oranı */}
                    <div className="col-6 col-md-2">
                        <label className="form-label mb-1 small fw-medium text-white-50">Ekipman (%)</label>
                        <input
                            type="number"
                            name="ekipmanIndirim"
                            value={data.ekipmanIndirim || ""}
                            onChange={handleChange}
                            className="form-control form-control-sm border-0 bg-white text-dark"
                            placeholder="0"
                        />
                    </div>

                    {/* Bilgi Gösterge Kartı / Tablo */}
                    <div className="col-12 col-md-4">
                        <div
                            className="p-2 rounded border"
                            style={{
                                backgroundColor: "rgba(255, 255, 255, 0.03)",
                                borderColor: "rgba(255,255,255,0.1)",
                                fontSize: "11px",
                                lineHeight: "1.4",
                                minHeight: "62px" // Boş kaldığında yükseklik çökmesin diye sabitledik
                            }}
                        >
                            <div className="text-white-50 fw-bold text-uppercase mb-1" style={{ letterSpacing: "0.3px" }}>
                                Kayıtlı İndirim Geçmişi
                            </div>

                            {siraliIndirimler.length === 0 ? (
                                // DURUM 1: Hiç indirim oranı yoksa
                                <div className="text-muted italic py-1">Kayıtlı indirim bulunamadı.</div>
                            ) : (
                                // DURUM 2: İndirim varsa (Yatay tablo/kolon düzeni)
                                <div className="d-flex gap-2 overflow-auto pt-1">
                                    {siraliIndirimler.map((indirim, idx) => (
                                        <div 
                                            key={idx} 
                                            className="pe-2 border-end text-white flex-shrink-0"
                                            style={{ 
                                                borderColor: "rgba(255,255,255,0.15) !important",
                                                lastChild: { border: "none" } // Son elemanın çizgisi olmasın
                                            }}
                                        >
                                            {/* İlk kolon en güncel olduğu için ayırt edici bir badge ekledik */}
                                            <div className="fw-bold" style={{ fontSize: "9px", color: idx === 0 ? "#5cffda" : "#a0aec0" }}>
                                                {indirim.indirimTarihi} {idx === 0 && "(Güncel)"}
                                            </div>
                                            <div>Plt: <strong className="text-info">%{indirim.planetTekIndirim}</strong></div>
                                            <div>Ekp: <strong className="text-info">%{indirim.ekipmanIndirim}</strong></div>
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