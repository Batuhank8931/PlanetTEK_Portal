import React, { useState, useEffect, useRef } from "react"; // 1. useRef eklendi
import { useTeklifStore } from "../../utils/teklifStore";
import API from "../../utils/utilRequest";

function SelectCustomer() {
    const customerInfo = useTeklifStore((state) => state.formData.customerInfo) || {};
    const updateSection = useTeklifStore((state) => state.updateSection);

    // 🔒 2. Aynı anda birden fazla API isteği atılmasını önlemek için kilit bayrağı
    const isFetchingOfferNumber = useRef(false);

    // Hem ticari_unvan hem ticariUnvan durumunu kontrol ederek ilk değeri veriyoruz
    const [searchTerm, setSearchTerm] = useState(customerInfo.ticari_unvan || customerInfo.ticariUnvan || "");
    const [searchResults, setSearchResults] = useState([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [isLoadingRate, setIsLoadingRate] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        const title = customerInfo.ticari_unvan || customerInfo.ticariUnvan || "";
        if (title) {
            setSearchTerm(title);
        }
    }, [customerInfo.ticari_unvan, customerInfo.ticariUnvan]);

    useEffect(() => {
        const fetchInitialCustomer = async () => {
            const title = customerInfo.ticari_unvan || customerInfo.ticariUnvan;
            if (title && !selectedCustomer) {
                try {
                    const res = await API.customerForOffer(title.trim());
                    const data = res.data || res || [];
                    const found = data.find(
                        (c) => c.id === customerInfo.customer_id || c.ticari_unvan === title
                    ) || data[0];

                    if (found) {
                        setSelectedCustomer(found);
                    }
                } catch (err) {
                    console.error("Müşteri detayları yüklenemedi:", err);
                }
            }
        };

        fetchInitialCustomer();
    }, [customerInfo.customer_id, customerInfo.ticari_unvan, customerInfo.ticariUnvan]);

    // 🚀 Teklif numarası servisten dinamik olarak çekiliyor
    useEffect(() => {
        const fetchOfferNumber = async () => {
            // Anlık store verisini kontrol et
            const activeTeklifNo = useTeklifStore.getState().formData.customerInfo?.teklifNo;

            // Zaten numara var veya istek şu an yoldaysa ikinci isteği engelle
            if (activeTeklifNo || isFetchingOfferNumber.current) {
                return;
            }

            // Kilit koyuluyor
            isFetchingOfferNumber.current = true;

            try {
                const res = await API.setOfferNumber();
                const fetchedNumber = res.data?.teklif_no || res.teklif_no;

                if (fetchedNumber) {
                    const currentCustomerInfo = useTeklifStore.getState().formData.customerInfo || {};
                    updateSection("customerInfo", {
                        ...currentCustomerInfo,
                        teklifNo: fetchedNumber,
                        revizyonNo: currentCustomerInfo.revizyonNo || "R0",
                        unitSystem: currentCustomerInfo.unitSystem || "Metric",
                        currency: currentCustomerInfo.currency || "EUR",
                        exchangeRate: currentCustomerInfo.exchangeRate || "1.0000"
                    });
                }
            } catch (err) {
                console.error("Teklif numarası alınırken hata oluştu:", err);
                // Sadece hata durumunda kilidi aç ki kullanıcı tekrar deneyebilsin
                isFetchingOfferNumber.current = false;
            }
        };

        fetchOfferNumber();
    }, []);

    useEffect(() => {
        if (isSelecting) return;

        if (selectedCustomer && searchTerm === selectedCustomer.ticari_unvan) {
            setSearchResults([]);
            return;
        }

        if (searchTerm.trim() === "") {
            setSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await API.customerForOffer(searchTerm.trim());
                const data = res.data || res || [];
                setSearchResults(data);
            } catch (err) {
                console.error("Müşteri arama hatası:", err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, isSelecting, selectedCustomer]);

    const fetchLiveRate = async (targetCurrency) => {
        if (targetCurrency === "EUR") return "1.0000";
        setIsLoadingRate(true);
        try {
            const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=EUR&symbols=${targetCurrency}`);
            const data = await res.json();
            if (data && data.rates && data.rates[targetCurrency]) {
                return data.rates[targetCurrency].toFixed(4);
            }
            throw new Error("Parite alınamadı");
        } catch (error) {
            console.error("Canlı döviz kuru çekilemedi, fallback uygulanıyor:", error);
            if (targetCurrency === "USD") return "1.1400";
            if (targetCurrency === "TRY") return "35.5000";
            return "1.0000";
        } finally {
            setIsLoadingRate(false);
        }
    };

    const handleSelectCustomer = (customer) => {
        setIsSelecting(true);
        setSelectedCustomer(customer);
        setSearchTerm(customer.ticari_unvan);
        setSearchResults([]);

        const siraliIndirimler = customer.indirimler
            ? [...customer.indirimler].sort((a, b) => new Date(b.indirimTarihi) - new Date(a.indirimTarihi))
            : [];

        const enGuncelIndirim = siraliIndirimler[0] || {};
        const varsayilanKisi = (customer.ilgiliKisiler && customer.ilgiliKisiler[0]) || {};

        updateSection("customerInfo", {
            ...customerInfo,
            customer_id: customer.id,
            ticari_unvan: customer.ticari_unvan,
            teklifDili: customer.teklifDili || "Yerli",
            planetTekIndirim: enGuncelIndirim.planetTekIndirim ?? "",
            ekipmanIndirim: enGuncelIndirim.ekipmanIndirim ?? "",
            ilgiliKisi: varsayilanKisi.ad || "",
            ilgiliKisi_email: varsayilanKisi.email || "",
            revizyonNo: customerInfo.revizyonNo || "R0"
        });

        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        setTimeout(() => {
            setIsSelecting(false);
        }, 150);
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        if (!isSelecting) setSearchTerm(value);

        if (value === "") {
            setSelectedCustomer(null);
            updateSection("customerInfo", {
                ...customerInfo,
                customer_id: null,
                ticari_unvan: "",
                planetTekIndirim: "",
                ekipmanIndirim: "",
                ilgiliKisi: "",
                ilgiliKisi_email: "",
                currency: "EUR",
                exchangeRate: "1.0000"
            });
        } else {
            updateSection("customerInfo", {
                ...customerInfo,
                customer_id: null,
                ticari_unvan: value
            });
        }
    };

    const handleIlgiliKisiSelect = (e) => {
        const secilenAd = e.target.value;
        const kisiObj = selectedCustomer?.ilgiliKisiler?.find((k) => k.ad === secilenAd);

        updateSection("customerInfo", {
            ...customerInfo,
            ilgiliKisi: secilenAd,
            ilgiliKisi_email: kisiObj ? kisiObj.email : customerInfo.ilgiliKisi_email || ""
        });
    };

    const handleChange = (e) => {
        updateSection("customerInfo", {
            ...customerInfo,
            [e.target.name]: e.target.value
        });
    };

    const handleCurrencyChange = async (e) => {
        const selectedCurrency = e.target.value;
        updateSection("customerInfo", {
            ...customerInfo,
            currency: selectedCurrency
        });

        const liveRate = await fetchLiveRate(selectedCurrency);
        updateSection("customerInfo", {
            ...useTeklifStore.getState().formData.customerInfo,
            currency: selectedCurrency,
            exchangeRate: liveRate
        });
    };

    const siraliIndirimler = selectedCustomer?.indirimler
        ? [...selectedCustomer.indirimler].sort((a, b) => new Date(b.indirimTarihi) - new Date(a.indirimTarihi))
        : [];

    return (
        <div className="card border-0 text-white h-100 p-4" style={{ backgroundColor: "#1a1c1d", borderRadius: "6px" }}>

            {/* Başlık Çizgisi */}
            <div className="d-flex align-items-center mb-3">
                <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.8px", color: "#00874e" }}>
                    Müşteri Genel Bilgileri
                </span>
                <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
            </div>

            <div className="d-flex flex-column gap-3">

                {/* SATIR 1: Müşteri Arama, Teklif No, Dili */}
                <div className="row g-3">
                    <div className="col-12 col-md-6 position-relative">
                        <label className="form-label mb-1 small fw-medium text-white-50" style={{ fontSize: "11px" }}>
                            Ticari Ünvan / Şirket Adı *
                            {isSearching && <span className="ms-2 spinner-border spinner-border-sm text-success" role="status" style={{ width: "10px", height: "10px" }}></span>}
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchInputChange}
                            className="form-control form-control-sm text-white fw-bold border-0 py-2"
                            style={{ backgroundColor: "#1e293b", borderRadius: "6px", fontSize: "12px", height: "36px" }}
                            placeholder="Müşteri adı ara..."
                        />

                        {searchResults.length > 0 && (
                            <ul className="list-group position-absolute w-100 mt-1 shadow-lg border" style={{ zIndex: 1050, maxHeight: "180px", overflowY: "auto", backgroundColor: "#0f172a", borderColor: "#334155" }}>
                                {searchResults.map((customer) => (
                                    <li
                                        key={customer.id}
                                        className="list-group-item list-group-item-action small py-2 text-white-50 d-flex justify-content-between align-items-center"
                                        style={{ cursor: "pointer", backgroundColor: "#0f172a", borderBottom: "1px solid #334155", fontSize: "12px" }}
                                        onClick={() => handleSelectCustomer(customer)}
                                    >
                                        <span>{customer.ticari_unvan}</span>
                                        <span className="badge bg-secondary" style={{ fontSize: "10px" }}>{customer.teklifDili || "Yerli"}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="col-6 col-md-2">
                        <label className="form-label mb-1 small fw-medium text-white-50" style={{ fontSize: "11px" }}>
                            Teklif No *
                        </label>
                        <input
                            type="text"
                            name="teklifNo"
                            value={customerInfo.teklifNo ?? ""}
                            readOnly
                            className="form-control form-control-sm text-white fw-bold border-0 py-2"
                            style={{
                                backgroundColor: "#0f172a",
                                borderRadius: "6px",
                                fontSize: "12px",
                                height: "36px",
                                opacity: 0.8,
                                cursor: "not-allowed"
                            }}
                            placeholder="0001"
                        />
                    </div>
                    <div className="col-6 col-md-2">
                        <label className="form-label mb-1 small fw-medium text-white-50" style={{ fontSize: "11px" }}>
                            Revizyon No
                        </label>
                        <input
                            type="text"
                            name="revizyonNo"
                            value={customerInfo.revizyonNo ?? ""}
                            readOnly
                            className="form-control form-control-sm text-white fw-bold border-0 py-2"
                            style={{
                                backgroundColor: "#0f172a",
                                borderRadius: "6px",
                                fontSize: "12px",
                                height: "36px",
                                opacity: 0.8,
                                cursor: "not-allowed"
                            }}
                            placeholder="R0"
                        />
                    </div>

                    <div className="col-6 col-md-2">
                        <label className="form-label mb-1 small fw-medium text-white-50" style={{ fontSize: "11px" }}>
                            Teklif Dili
                        </label>
                        <select name="teklifDili" value={customerInfo.teklifDili || "Yerli"} onChange={handleChange} className="form-select form-select-sm text-white fw-bold border-0 py-2" style={{ backgroundColor: "#1e293b", borderRadius: "6px", fontSize: "12px", height: "36px" }}>
                            <option value="Yerli" style={{ backgroundColor: "#0f172a" }}>Yerli</option>
                            <option value="Yabancı" style={{ backgroundColor: "#0f172a" }}>Yabancı</option>
                        </select>
                    </div>
                </div>

                {/* SATIR 2: Teknik & Finansal Seçenekler */}
                <div className="row g-3">
                    <div className="col-12 col-md-4">
                        <label className="form-label mb-1 small fw-medium text-white-50" style={{ fontSize: "11px" }}>
                            Birim Sistemi
                        </label>
                        <select name="unitSystem" value={customerInfo.unitSystem || "Metric"} onChange={handleChange} className="form-select form-select-sm text-white fw-bold border-0 py-2" style={{ backgroundColor: "#1e293b", borderRadius: "6px", fontSize: "12px", color: "#38bdf8", height: "36px" }}>
                            <option value="Metric" style={{ backgroundColor: "#0f172a" }}>Metrik (L/gün, m³)</option>
                            <option value="US" style={{ backgroundColor: "#0f172a" }}>Amerikan (GPD, ft³)</option>
                        </select>
                    </div>

                    <div className="col-6 col-md-4">
                        <label className="form-label mb-1 small fw-medium text-white-50" style={{ fontSize: "11px" }}>
                            Para Birimi
                        </label>
                        <select name="currency" value={customerInfo.currency || "EUR"} onChange={handleCurrencyChange} className="form-select form-select-sm text-white fw-bold border-0 py-2" style={{ backgroundColor: "#1e293b", borderRadius: "6px", fontSize: "12px", color: "#fbbf24", height: "36px" }}>
                            <option value="EUR" style={{ backgroundColor: "#0f172a" }}>Euro (€)</option>
                            <option value="USD" style={{ backgroundColor: "#0f172a" }}>Dolar ($)</option>
                            <option value="TRY" style={{ backgroundColor: "#0f172a" }}>Türk Lirası (₺)</option>
                        </select>
                    </div>

                    <div className="col-6 col-md-4">
                        <label className="form-label mb-1 small fw-medium text-white-50" style={{ fontSize: "11px" }}>
                            {isLoadingRate ? "Güncelleniyor..." : `${customerInfo.currency || "EUR"} / EUR Kuru`}
                        </label>
                        <input
                            type="number"
                            name="exchangeRate"
                            value={customerInfo.exchangeRate ?? "1.0000"}
                            onChange={handleChange}
                            disabled={customerInfo.currency === "EUR" || isLoadingRate}
                            step="0.0001"
                            min="0"
                            className="form-control form-control-sm text-white fw-bold border-0 py-2"
                            style={{
                                backgroundColor: customerInfo.currency === "EUR" ? "#0f172a" : "#1e293b",
                                borderRadius: "6px",
                                fontSize: "12px",
                                height: "36px",
                                opacity: customerInfo.currency === "EUR" ? 0.6 : 1,
                                border: isLoadingRate ? "1px solid #fbbf24" : "none"
                            }}
                            placeholder="1.0000"
                        />
                    </div>
                </div>

                {/* SATIR 3: İlgili Kişi ve İndirim Oranları Inputları */}
                <div className="row g-3">
                    <div className="col-12 col-md-3">
                        <label className="form-label mb-1 small fw-medium text-white-50" style={{ fontSize: "11px" }}>
                            İlgili Kişi *
                        </label>
                        <select
                            name="ilgiliKisi"
                            value={customerInfo?.ilgiliKisi || ""}
                            onChange={handleIlgiliKisiSelect}
                            className="form-select form-select-sm text-white fw-bold border-0 py-2"
                            style={{ backgroundColor: "#1e293b", borderRadius: "6px", fontSize: "12px", height: "36px" }}
                        >
                            <option value="" style={{ backgroundColor: "#0f172a" }}>Seçiniz...</option>

                            {customerInfo?.ilgiliKisi && !selectedCustomer?.ilgiliKisiler?.some(k => k.ad === customerInfo.ilgiliKisi) && (
                                <option value={customerInfo.ilgiliKisi} style={{ backgroundColor: "#0f172a" }}>
                                    {customerInfo.ilgiliKisi}
                                </option>
                            )}

                            {selectedCustomer?.ilgiliKisiler?.map((kisi, index) => (
                                <option key={index} value={kisi.ad} style={{ backgroundColor: "#0f172a" }}>
                                    {kisi.ad}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-12 col-md-3">
                        <label className="form-label mb-1 small fw-medium text-white-50" style={{ fontSize: "11px" }}>
                            İlgili Kişi E-posta
                        </label>
                        <input
                            type="email"
                            name="ilgiliKisi_email"
                            value={customerInfo?.ilgiliKisi_email || ""}
                            onChange={handleChange}
                            className="form-control form-control-sm text-white border-0 py-2"
                            style={{ backgroundColor: "#1e293b", borderRadius: "6px", fontSize: "12px", height: "36px" }}
                            placeholder="ornek@sirket.com"
                        />
                    </div>

                    <div className="col-6 col-md-3">
                        <label className="form-label mb-1 small fw-medium text-white-50" style={{ fontSize: "11px" }}>
                            PlanetTEK İndirimi (%)
                        </label>
                        <input
                            type="number"
                            name="planetTekIndirim"
                            value={customerInfo?.planetTekIndirim ?? ""}
                            onChange={handleChange}
                            className="form-control form-control-sm border-0 text-white fw-bold py-2"
                            style={{ backgroundColor: "#1e293b", fontSize: "12px", height: "36px", borderRadius: "6px" }}
                            placeholder="0"
                        />
                    </div>

                    <div className="col-6 col-md-3">
                        <label className="form-label mb-1 small fw-medium text-white-50" style={{ fontSize: "11px" }}>
                            Ekipman İndirimi (%)
                        </label>
                        <input
                            type="number"
                            name="ekipmanIndirim"
                            value={customerInfo?.ekipmanIndirim ?? ""}
                            onChange={handleChange}
                            className="form-control form-control-sm border-0 text-white fw-bold py-2"
                            style={{ backgroundColor: "#1e293b", fontSize: "12px", height: "36px", borderRadius: "6px" }}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="border-bottom my-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>

                {/* TABLO ŞEKLİNDE İNDİRİM GEÇMİŞİ */}
                <div className="d-flex flex-column gap-2">
                    <div className="fw-medium text-white-50" style={{ fontSize: "11px" }}>
                        <i className="bi bi-clock-history me-1 text-success"></i> İndirim Geçmişi
                    </div>

                    {(!siraliIndirimler || siraliIndirimler.length === 0) ? (
                        <div className="text-muted fst-italic p-2 rounded" style={{ backgroundColor: "#0f172a", fontSize: "11px" }}>
                            Kayıtlı indirim geçmişi bulunmamaktadır.
                        </div>
                    ) : (
                        <div className="table-responsive rounded border" style={{ borderColor: "#334155" }}>
                            <table className="table table-dark table-sm mb-0 text-center align-middle" style={{ backgroundColor: "#0f172a", fontSize: "12px" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8" }}>
                                        <th className="py-2 font-monospace fw-normal" style={{ fontSize: "11px" }}>Tarih</th>
                                        <th className="py-2 font-monospace fw-normal" style={{ fontSize: "11px" }}>PlanetTEK İndirimi</th>
                                        <th className="py-2 font-monospace fw-normal" style={{ fontSize: "11px" }}>Ekipman İndirimi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {siraliIndirimler.map((indirim, idx) => (
                                        <tr key={idx} style={{ borderBottom: idx === siraliIndirimler.length - 1 ? "none" : "1px solid #1e293b", backgroundColor: idx === 0 ? "rgba(16, 185, 129, 0.05)" : "transparent" }}>
                                            <td className="py-2">
                                                <span className={idx === 0 ? "text-success fw-bold" : "text-white-50"}>
                                                    {indirim.indirimTarihi || "-"} {idx === 0 && <span className="badge bg-success bg-opacity-25 text-success ms-1" style={{ fontSize: "9px" }}>Güncel</span>}
                                                </span>
                                            </td>
                                            <td className="py-2 text-info fw-bold">
                                                {indirim.planetTekIndirim !== null && indirim.planetTekIndirim !== undefined ? `%${indirim.planetTekIndirim}` : "-"}
                                            </td>
                                            <td className="py-2 text-info fw-bold">
                                                {indirim.ekipmanIndirim !== null && indirim.ekipmanIndirim !== undefined ? `%${indirim.ekipmanIndirim}` : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default SelectCustomer;