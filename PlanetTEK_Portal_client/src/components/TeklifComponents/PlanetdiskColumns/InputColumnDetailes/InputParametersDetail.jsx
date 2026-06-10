import React, { useEffect, useState } from "react";
import hesaplaDiskKatsayisiDetayli from "../../../../utils/hesaplaDiskKatsayisiDetayli";
import { useTeklifStore } from "../../../../utils/teklifStore";

// 1. DİNAMİK DİSK SINIRLARI MATRİSİ
const DISK_SINIRLARI_MATRISI = {
    MX: {
        evsel: { minDisk: 100, maxDisk: 140 },
        endustriyel: { minDisk: 90, maxDisk: 100 }
    },
    MINI: {
        evsel: { minDisk: 50, maxDisk: 75 },
        endustriyel: { minDisk: 45, maxDisk: 65 }
    }
};

// 2. YENİ: DİNAMİK NİTRİFİKASYON MATRİSİ
const NITRIFIKASYON_KATSAYILARI = [
    { min: 23.01, max: Infinity, katsayi: 1.7, etiket: "☀️ Sıcaklık > 23 °C", renk: "text-success" },
    { min: 17,    max: 23,       katsayi: 1.4, etiket: "⛅ Sıcaklık 17 - 23 °C", renk: "text-info" }, // Eski kodundaki 22-23 arası bindirmeler temizlendi
    { min: 13,    max: 16.99,    katsayi: 1.0, etiket: "🌤️ Sıcaklık 13 - 16 °C", renk: "text-warning" },
    { min: -Infinity, max: 12.99,katsayi: 0.6, etiket: "❄️ Sıcaklık < 13 °C", renk: "text-danger" }
];

function InputParameters() {
    const [showInfoModal, setShowInfoModal] = useState(false);

    const formData = useTeklifStore((state) => state.formData);
    const updateSection = useTeklifStore((state) => state.updateSection);

    // Yenilenen Dinamik Fonksiyon
    const hesaplaNitrifikasyonEmperik = (sicaklik) => {
        const s = Number(sicaklik);
        const uygunKural = NITRIFIKASYON_KATSAYILARI.find(
            (kural) => s >= kural.min && s <= kural.max
        );
        return uygunKural ? uygunKural.katsayi : 1.0;
    };

    const getDiskSinirlari = (uniteType, wastewaterType) => {
        const uniteSınırları = DISK_SINIRLARI_MATRISI[uniteType] || DISK_SINIRLARI_MATRISI["MX"];
        return uniteSınırları[wastewaterType] || uniteSınırları["evsel"];
    };

    // DEFAULT DEĞERLERİ OLUŞTURMA
    const storePlanetDisk = formData.planetDiskDetails || {};
    const storeAritmaParametreleri = storePlanetDisk.tasarim?.aritmaParametreleri || {};

    const defaultKaynaklar = [
        { id: Date.now(), ad: "1. KAYNAK", kisiSayisi: 3000, organikYuk: 60, hidrolikYuk: 200 }
    ];

    const currentAtiksutype = storeAritmaParametreleri.atiksutype || "evsel";
    const currentRBCUnite = storeAritmaParametreleri.RBCUnite || "MX";
    const varsayilanSinirlar = getDiskSinirlari(currentRBCUnite, currentAtiksutype);

    const currentParamData = {
        hesapYontemi: storeAritmaParametreleri.hesapYontemi !== undefined ? storeAritmaParametreleri.hesapYontemi : "",
        atiksutype: currentAtiksutype,
        RBCUnite: currentRBCUnite,
        minDisk: storeAritmaParametreleri.minDisk !== undefined ? storeAritmaParametreleri.minDisk : varsayilanSinirlar.minDisk,
        maxDisk: storeAritmaParametreleri.maxDisk !== undefined ? storeAritmaParametreleri.maxDisk : varsayilanSinirlar.maxDisk,
        girisBoi: storeAritmaParametreleri.girisBoi !== undefined ? storeAritmaParametreleri.girisBoi : 350,
        debi: storeAritmaParametreleri.debi !== undefined ? storeAritmaParametreleri.debi : 70,
        cikisBoi: storeAritmaParametreleri.cikisBoi !== undefined ? storeAritmaParametreleri.cikisBoi : 40,
        sicaklik: storeAritmaParametreleri.sicaklik !== undefined ? storeAritmaParametreleri.sicaklik : 19,
        giderimVerimi: storeAritmaParametreleri.giderimVerimi !== undefined ? storeAritmaParametreleri.giderimVerimi : 33,
        emperik: storeAritmaParametreleri.emperik !== undefined ? storeAritmaParametreleri.emperik : 22.00,
        nitrifikasyon: storeAritmaParametreleri.nitrifikasyon || "nitrifikasyonYok",
        girisAmonyum: storeAritmaParametreleri.girisAmonyum !== undefined ? storeAritmaParametreleri.girisAmonyum : 48,
        cikisAmonyum: storeAritmaParametreleri.cikisAmonyum !== undefined ? storeAritmaParametreleri.cikisAmonyum : 8,
        nitrifikasyonEmperik: storeAritmaParametreleri.nitrifikasyonEmperik !== undefined
            ? storeAritmaParametreleri.nitrifikasyonEmperik
            : hesaplaNitrifikasyonEmperik(storeAritmaParametreleri.sicaklik ?? 19),
        kaynaklar: storeAritmaParametreleri.kaynaklar || defaultKaynaklar
    };

    const rootDebi = storePlanetDisk.debi !== undefined ? storePlanetDisk.debi : 70;

    useEffect(() => {
        if (!storePlanetDisk.tasarim || !storePlanetDisk.tasarim.aritmaParametreleri) {
            updateSection("planetDiskDetails", {
                debi: rootDebi,
                tasarim: {
                    ...storePlanetDisk.tasarim,
                    aritmaParametreleri: currentParamData
                }
            });
        }
    }, []);

    const recalculateNihaiDegerler = (kaynaklarListesi) => {
        const toplamLitreGun = kaynaklarListesi.reduce((acc, k) => acc + (Number(k.kisiSayisi || 0) * Number(k.hidrolikYuk || 0)), 0);
        const nihaiDebi = toplamLitreGun / 1000;
        const toplamGramBoiGun = kaynaklarListesi.reduce((acc, k) => acc + (Number(k.kisiSayisi || 0) * Number(k.organikYuk || 0)), 0);
        const nihaiGirisBoi = nihaiDebi > 0 ? Math.round((toplamGramBoiGun / nihaiDebi)) : 0;
        return { nihaiDebi, nihaiGirisBoi };
    };

    const handleChange = (e) => {
        const rawValue = e.target.value;
        const val = rawValue === "" ? 0 : (!isNaN(Number(rawValue)) ? Number(rawValue) : rawValue);
        const name = e.target.name;

        let updatedParamData = {
            ...currentParamData,
            [name]: val
        };

        if (name === "RBCUnite") {
            const yeniSinirlar = getDiskSinirlari(val, currentParamData.atiksutype);
            updatedParamData.minDisk = yeniSinirlar.minDisk;
            updatedParamData.maxDisk = yeniSinirlar.maxDisk;
        }

        if (name === "sicaklik" || name === "cikisBoi") {
            const yeniEmperik = hesaplaDiskKatsayisiDetayli(
                Number(updatedParamData.sicaklik ?? 19),
                Number(updatedParamData.cikisBoi ?? 40)
            );
            updatedParamData.emperik = parseFloat(yeniEmperik) || 0;
        }

        if (name === "sicaklik") {
            updatedParamData.nitrifikasyonEmperik = hesaplaNitrifikasyonEmperik(val);
        }

        updateSection("planetDiskDetails", {
            debi: name === "debi" ? val : rootDebi,
            tasarim: {
                ...storePlanetDisk.tasarim,
                aritmaParametreleri: updatedParamData
            }
        });
    };

    const handleTypeToggle = (e) => {
        const selectedType = e.target.checked ? "endustriyel" : "evsel";
        const yeniSinirlar = getDiskSinirlari(currentParamData.RBCUnite, selectedType);

        updateSection("planetDiskDetails", {
            tasarim: {
                ...storePlanetDisk.tasarim,
                aritmaParametreleri: {
                    ...currentParamData,
                    atiksutype: selectedType,
                    minDisk: yeniSinirlar.minDisk,
                    maxDisk: yeniSinirlar.maxDisk
                }
            }
        });
    };

    const handleNitroToggle = (e) => {
        const isChecked = e.target.checked;
        const selectedType = isChecked ? "nitrifikasyonVar" : "nitrifikasyonYok";

        updateSection("planetDiskDetails", {
            tasarim: {
                ...storePlanetDisk.tasarim,
                aritmaParametreleri: {
                    ...currentParamData,
                    nitrifikasyon: selectedType,
                    nitrifikasyonEmperik: hesaplaNitrifikasyonEmperik(currentParamData.sicaklik ?? 19)
                }
            }
        });
    };

    const handleYontemChange = (yontem) => {
        if (yontem === "hidrolik") {
            updateSection("planetDiskDetails", {
                debi: 70,
                tasarim: {
                    ...storePlanetDisk.tasarim,
                    aritmaParametreleri: {
                        ...currentParamData,
                        hesapYontemi: yontem,
                        debi: 70,
                        girisBoi: 350
                    }
                }
            });
        } else if (yontem === "kisi") {
            const { nihaiDebi, nihaiGirisBoi } = recalculateNihaiDegerler(currentParamData.kaynaklar || []);
            updateSection("planetDiskDetails", {
                debi: nihaiDebi,
                tasarim: {
                    ...storePlanetDisk.tasarim,
                    aritmaParametreleri: {
                        ...currentParamData,
                        hesapYontemi: yontem,
                        debi: nihaiDebi,
                        girisBoi: nihaiGirisBoi
                    }
                }
            });
        }
    };

    const handleAddKaynak = () => {
        const yeniKaynakNo = (currentParamData.kaynaklar?.length || 0) + 1;
        const yeniKaynak = { id: Date.now(), ad: `${yeniKaynakNo}. KAYNAK`, kisiSayisi: 0, organikYuk: 20, hidrolikYuk: 50 };
        const yeniKaynaklar = [...(currentParamData.kaynaklar || []), yeniKaynak];
        const { nihaiDebi, nihaiGirisBoi } = recalculateNihaiDegerler(yeniKaynaklar);

        updateSection("planetDiskDetails", {
            debi: nihaiDebi,
            tasarim: {
                ...storePlanetDisk.tasarim,
                aritmaParametreleri: {
                    ...currentParamData,
                    kaynaklar: yeniKaynaklar,
                    debi: nihaiDebi,
                    girisBoi: nihaiGirisBoi
                }
            }
        });
    };

    const handleRemoveKaynak = (id) => {
        if (currentParamData.kaynaklar.length <= 1) return;
        const filtrelenmis = currentParamData.kaynaklar.filter((k) => k.id !== id);
        const yeniKaynaklar = filtrelenmis.map((k, index) => ({ ...k, ad: `${index + 1}. KAYNAK` }));
        const { nihaiDebi, nihaiGirisBoi } = recalculateNihaiDegerler(yeniKaynaklar);

        updateSection("planetDiskDetails", {
            debi: nihaiDebi,
            tasarim: {
                ...storePlanetDisk.tasarim,
                aritmaParametreleri: {
                    ...currentParamData,
                    kaynaklar: yeniKaynaklar,
                    debi: nihaiDebi,
                    girisBoi: nihaiGirisBoi
                }
            }
        });
    };

    const handleKaynakChange = (id, field, value) => {
        const yeniKaynaklar = currentParamData.kaynaklar.map((k) => {
            if (k.id === id) {
                const val = value === "" ? 0 : Number(value) || 0;
                return { ...k, [field]: val };
            }
            return k;
        });
        const { nihaiDebi, nihaiGirisBoi } = recalculateNihaiDegerler(yeniKaynaklar);

        updateSection("planetDiskDetails", {
            debi: nihaiDebi,
            tasarim: {
                ...storePlanetDisk.tasarim,
                aritmaParametreleri: {
                    ...currentParamData,
                    kaynaklar: yeniKaynaklar,
                    debi: nihaiDebi,
                    girisBoi: nihaiGirisBoi
                }
            }
        });
    };

    const getButtonStyle = (yontemType, activeBg) => {
        const isActive = currentParamData.hesapYontemi === yontemType;
        return {
            borderRadius: "6px",
            fontSize: "12px",
            backgroundColor: isActive ? activeBg : "transparent",
            color: isActive ? "#ffffff" : "#94a3b8",
            border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent"
        };
    };

    return (
        <div className="card-body p-4 d-flex flex-column gap-3" style={{ position: "relative" }}>
            {/* ... (Üst taraftaki tüm HTML yapısı aynen korunuyor) ... */}
            <div className="d-flex align-items-center">
                <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
                    Arıtma Parametreleri
                </span>
                <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
            </div>

            <div>
                <div className="btn-group w-100" role="group" style={{ backgroundColor: "#1e293b", padding: "4px", borderRadius: "8px" }}>
                    <button type="button" className="btn btn-sm py-1.5 fw-medium" style={getButtonStyle("hidrolik", "#ef4444")} onClick={() => handleYontemChange("hidrolik")}>
                        <i className="bi bi-droplet-fill me-1.5"></i>Hidrolik Yük
                    </button>
                    <button type="button" className="btn btn-sm py-1.5 fw-medium" style={getButtonStyle("kisi", "#10b981")} onClick={() => handleYontemChange("kisi")}>
                        <i className="bi bi-people-fill me-1.5"></i>Kişi Sayısı
                    </button>
                </div>
            </div>

            <div className="rounded p-2.5" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
                {currentParamData.hesapYontemi === "" ? (
                    <div className="text-center py-4 text-white-50" style={{ fontSize: "12px" }}>
                        <i className="bi bi-exclamation-circle me-1.5 text-warning"></i>Lütfen yukarıdan bir hesaplama yöntemi seçiniz.
                    </div>
                ) : currentParamData.hesapYontemi === "hidrolik" ? (
                    <div className="row g-2 p-1">
                        <div className="col-6">
                            <label className="text-white-50 mb-1" style={{ fontSize: "11px" }}>Giriş BOİ (mg/l)</label>
                            <input type="number" name="girisBoi" value={currentParamData.girisBoi === 0 ? "" : currentParamData.girisBoi} onChange={handleChange} className="form-control form-control-sm text-white fw-bold border-0 text-center" style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", borderRadius: "6px" }} />
                        </div>
                        <div className="col-6">
                            <label className="text-white-50 mb-1" style={{ fontSize: "11px" }}>Debi (m³/gün)</label>
                            <input type="number" name="debi" value={currentParamData.debi === 0 ? "" : currentParamData.debi} onChange={handleChange} className="form-control form-control-sm text-white fw-bold border-0 text-center" style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", borderRadius: "6px" }} />
                        </div>
                    </div>
                ) : (
                    <div className="p-1">
                        <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                            <span className="text-white-50 fw-medium" style={{ fontSize: "11px" }}><i className="bi bi-layers-half me-1"></i> Atıksu Kaynakları</span>
                            <button type="button" onClick={handleAddKaynak} className="btn btn-sm py-0.5 px-2 fw-semibold text-white border-0" style={{ backgroundColor: "#059669", fontSize: "10px", borderRadius: "4px" }}>+ Kaynak Ekle</button>
                        </div>
                        <div style={{ maxHeight: "200px", overflowY: "auto", paddingRight: "2px" }}>
                            {currentParamData.kaynaklar?.map((kaynak) => (
                                <div key={kaynak.id} className="p-2 mb-2 rounded border" style={{ backgroundColor: "#0f172a", borderColor: "#334155" }}>
                                    <div className="d-flex justify-content-between align-items-center mb-1.5">
                                        <span className="fw-bold text-success" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>{kaynak.ad}</span>
                                        {currentParamData.kaynaklar.length > 1 && (
                                            <button type="button" className="btn-close btn-close-white" style={{ transform: "scale(0.65)", padding: "0" }} onClick={() => handleRemoveKaynak(kaynak.id)}></button>
                                        )}
                                    </div>
                                    <div className="row g-1">
                                        <div className="col-4">
                                            <label className="text-white-50 d-block text-center" style={{ fontSize: "9px" }}>Kişi</label>
                                            <input type="number" value={kaynak.kisiSayisi === 0 ? "" : kaynak.kisiSayisi} onChange={(e) => handleKaynakChange(kaynak.id, "kisiSayisi", e.target.value)} className="form-control form-control-sm bg-dark text-white border-0 text-center py-0.5 fw-semibold" style={{ fontSize: "11px" }} />
                                        </div>
                                        <div className="col-4">
                                            <label className="text-white-50 d-block text-center" style={{ fontSize: "9px" }}>Org (g/k/g)</label>
                                            <input type="number" value={kaynak.organikYuk === 0 ? "" : kaynak.organikYuk} onChange={(e) => handleKaynakChange(kaynak.id, "organikYuk", e.target.value)} className="form-control form-control-sm bg-dark text-white border-0 text-center py-0.5 fw-semibold" style={{ fontSize: "11px" }} />
                                        </div>
                                        <div className="col-4">
                                            <label className="text-white-50 d-block text-center" style={{ fontSize: "9px" }}>Hid (l/k/g)</label>
                                            <input type="number" value={kaynak.hidrolikYuk === 0 ? "" : kaynak.hidrolikYuk} onChange={(e) => handleKaynakChange(kaynak.id, "hidrolikYuk", e.target.value)} className="form-control form-control-sm bg-dark text-white border-0 text-center py-0.5 fw-semibold" style={{ fontSize: "11px" }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="row g-1 pt-2" style={{ borderTop: "1px dashed #334155" }}>
                <div className="col-4">
                    <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>Hedef BOİ</label>
                    <input type="number" name="cikisBoi" value={currentParamData.cikisBoi === 0 ? "" : currentParamData.cikisBoi} onChange={handleChange} className="form-control form-control-sm border-0 text-white text-center fw-bold" style={{ backgroundColor: "#1e293b", fontSize: "12px", borderBottom: "2px solid #38bdf8", borderRadius: "4px 4px 0 0" }} />
                </div>
                <div className="col-4">
                    <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>Sıcaklık</label>
                    <input type="number" name="sicaklik" value={currentParamData.sicaklik === 0 ? "" : currentParamData.sicaklik} onChange={handleChange} className="form-control form-control-sm border-0 text-white text-center fw-bold" style={{ backgroundColor: "#1e293b", fontSize: "12px", borderBottom: "2px solid #38bdf8", borderRadius: "4px 4px 0 0" }} />
                </div>
                <div className="col-4">
                    <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>Ön Arıtma Verim, (%)</label>
                    <input type="number" name="giderimVerimi" value={currentParamData.giderimVerimi === 0 ? "" : currentParamData.giderimVerimi} onChange={handleChange} className="form-control form-control-sm border-0 text-white text-center fw-bold" style={{ backgroundColor: "#1e293b", fontSize: "12px", borderBottom: "2px solid #38bdf8", borderRadius: "4px 4px 0 0" }} />
                </div>
            </div>

            <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="fw-medium text-white-50" style={{ fontSize: "12px" }}>
                    {currentParamData.atiksutype === "endustriyel" ? (
                        <span className="text-warning"><i className="bi bi-building-gear me-1.5"></i>Endüstriyel Atıksu</span>
                    ) : (
                        <span className="text-info"><i className="bi bi-house-door-fill me-1.5"></i>Evsel Atıksu</span>
                    )}
                </span>
                <div className="form-check form-switch m-0 p-0 d-flex align-items-center">
                    <input className="form-check-input cursor-pointer m-0" type="checkbox" role="switch" id="atiksutypeSwitch" style={{ width: "38px", height: "20px" }} checked={currentParamData.atiksutype === "endustriyel"} onChange={handleTypeToggle} />
                </div>
            </div>

            <div className="d-flex flex-column gap-2 p-2 rounded" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-medium text-white-50" style={{ fontSize: "12px" }}>
                        {currentParamData.nitrifikasyon === "nitrifikasyonVar" ? (
                            <span className="text-warning fw-bold"><i className="bi bi-activity me-1.5"></i>Nitrifikasyon Var</span>
                        ) : (
                            <span className="text-info"><i className="bi bi-slash-circle me-1.5"></i>Nitrifikasyon Yok</span>
                        )}
                    </span>
                    <div className="form-check form-switch m-0 pb-0 d-flex align-items-center">
                        <input className="form-check-input cursor-pointer m-0" type="checkbox" role="switch" id="nitrifikasyonSwitch" style={{ width: "38px", height: "20px" }} checked={currentParamData.nitrifikasyon === "nitrifikasyonVar"} onChange={handleNitroToggle} />
                    </div>
                </div>

                {currentParamData.nitrifikasyon === "nitrifikasyonVar" && (
                    <div className="row g-2 pt-1">
                        <div className="col-4">
                            <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "9px" }}>Giriş Amonyum (mg/l)</label>
                            <input type="number" name="girisAmonyum" value={currentParamData.girisAmonyum === 0 ? "" : currentParamData.girisAmonyum} onChange={handleChange} className="form-control form-control-sm bg-dark text-white text-center fw-semibold border-0 py-1" style={{ fontSize: "11px", borderRadius: "4px" }} />
                        </div>
                        <div className="col-4">
                            <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "9px" }}>Çıkış Amonyum (mg/l)</label>
                            <input type="number" name="cikisAmonyum" value={currentParamData.cikisAmonyum === 0 ? "" : currentParamData.cikisAmonyum} onChange={handleChange} className="form-control form-control-sm bg-dark text-white text-center fw-semibold border-0 py-1" style={{ fontSize: "11px", borderRadius: "4px" }} />
                        </div>
                        <div className="col-4">
                            <label className="text-white-50 d-flex align-items-center justify-content-center gap-1 mb-1" style={{ fontSize: "9px" }}>
                                Nit. Emperiği <i className="bi bi-info-circle-fill text-info cursor-pointer" style={{ fontSize: "10px" }} onClick={() => setShowInfoModal(true)}></i>
                            </label>
                            <input type="number" step="0.1" name="nitrifikasyonEmperik" value={currentParamData.nitrifikasyonEmperik === 0 ? "" : currentParamData.nitrifikasyonEmperik} onChange={handleChange} className="form-control form-control-sm text-center fw-bold border-0 py-1 text-warning" style={{ backgroundColor: "rgba(255, 193, 7, 0.15)", fontSize: "11px", borderRadius: "4px" }} />
                        </div>
                    </div>
                )}
            </div>

            {/* YENİLENEN DİNAMİK INFO MODAL */}
            {showInfoModal && (
                <div style={{
                    position: "absolute", top: "80%", left: "5%", right: "5%",
                    backgroundColor: "#1e293b", border: "2px solid #334155", borderRadius: "8px",
                    zIndex: 1050, boxShadow: "0px 10px 25px rgba(0,0,0,0.5)"
                }} className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom border-secondary">
                        <span className="text-white fw-bold" style={{ fontSize: "12px" }}>
                            <i className="bi bi-info-circle me-1.5 text-info"></i>Nitrifikasyon Emperik Katsayıları
                        </span>
                        <button type="button" className="btn-close btn-close-white" style={{ transform: "scale(0.75)" }} onClick={() => setShowInfoModal(false)}></button>
                    </div>
                    <div className="text-white-50" style={{ fontSize: "11px", lineHeight: "1.6" }}>
                        <p className="mb-2">Sıcaklık kademelerine göre uygulanan <b>gr/m²·gün</b> katsayı kriterleri:</p>
                        <ul className="list-unstyled d-flex flex-column gap-1 m-0 ps-1">
                            {/* Kuralları matristen dönerek dinamik olarak basıyoruz */}
                            {NITRIFIKASYON_KATSAYILARI.map((kural, idx) => (
                                <li key={idx}>
                                    <span className={`${kural.renk} fw-bold`}>{kural.etiket} :</span>{" "}
                                    <span className="text-white">{kural.katsayi} gr/m².gün</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InputParameters;