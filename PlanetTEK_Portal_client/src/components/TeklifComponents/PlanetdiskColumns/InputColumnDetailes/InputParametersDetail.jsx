import React, { useEffect, useState } from "react";
import hesaplaDiskKatsayisiDetayli from "../../../../utils/hesaplaDiskKatsayisiDetayli";
import { useTeklifStore } from "../../../../utils/teklifStore";
import API from "../../../../utils/utilRequest";

function InputParameters() {
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const formData = useTeklifStore((state) => state.formData);
    const updateSection = useTeklifStore((state) => state.updateSection);

    const [diskSinirlariMatrisi, setDiskSinirlariMatrisi] = useState({});
    const [nitrifikasyonKatsayilari, setNitrifikasyonKatsayilari] = useState([]);
    const [maksimumEmperik, setMaksimumEmperik] = useState(0);

    const hesaplaNitrifikasyonEmperik = (sicaklik, katsayilarListesi) => {
        const s = Number(sicaklik);
        const liste = katsayilarListesi || nitrifikasyonKatsayilari;
        const uygunKural = liste.find(
            (kural) => s >= kural.min && s <= kural.max
        );
        return uygunKural ? uygunKural.katsayi : 1.0;
    };

    const getDiskSinirlari = (uniteType, wastewaterType, matris) => {
        const aktifMatris = matris || diskSinirlariMatrisi;
        if (!aktifMatris || Object.keys(aktifMatris).length === 0) {
            return { minDisk: 0, maxDisk: 0 };
        }
        const uniteSinirlari = aktifMatris[uniteType] || aktifMatris["MX"];
        if (!uniteSinirlari) return { minDisk: 0, maxDisk: 0 };
        return uniteSinirlari[wastewaterType] || uniteSinirlari["evsel"];
    };

    useEffect(() => {
        const fetchParameters = async () => {
            try {
                const response = await API.getParamteters();
                const data = response.data || [];

                const paramMap = {};
                data.forEach(item => {
                    paramMap[item.parametre_key] = parseFloat(item.deger);
                });

                const matris = {
                    MX: {
                        evsel: { minDisk: paramMap["MX_evsel_min"], maxDisk: paramMap["MX_evsel_max"] },
                        endustriyel: { minDisk: paramMap["MX_endustriyel_min"], maxDisk: paramMap["MX_endustriyel_max"] }
                    },
                    MINI: {
                        evsel: { minDisk: paramMap["MINI_evsel_min"], maxDisk: paramMap["MINI_evsel_max"] },
                        endustriyel: { minDisk: paramMap["MINI_endustriyel_min"], maxDisk: paramMap["MINI_endustriyel_max"] }
                    }
                };
                setDiskSinirlariMatrisi(matris);

                const renkler = { nit_1: "text-success", nit_2: "text-info", nit_3: "text-warning", nit_4: "text-danger" };
                const ikonlar = { nit_1: "☀️ ", nit_2: "⛅ ", nit_3: "🌤️ ", nit_4: "❄️ " };
                const etiketEkleri = { nit_1: "Sıcaklık > 23 °C", nit_2: "Sıcaklık 17 - 23 °C", nit_3: "Sıcaklık 13 - 16 °C", nit_4: "Sıcaklık < 13 °C" };

                const yeniNitrifikasyon = data
                    .filter(item => item.parametre_key.startsWith("nit_"))
                    .map(item => {
                        const key = item.parametre_key;
                        const tanim = item.parametre_adi.trim();
                        let min = -Infinity;
                        let max = Infinity;

                        if (tanim.startsWith(">")) {
                            min = parseFloat(tanim.replace(">", "").trim());
                        } else if (tanim.startsWith("<")) {
                            max = parseFloat(tanim.replace("<", "").trim());
                        } else if (tanim.includes("-")) {
                            const parcalar = tanim.split("-");
                            min = parseFloat(parcalar[0].trim());
                            max = parseFloat(parcalar[1].trim());
                        }

                        return {
                            min: min,
                            max: max,
                            katsayi: parseFloat(item.deger),
                            etiket: `${ikonlar[key] || ""}${etiketEkleri[key] || tanim}`,
                            renk: renkler[key] || "text-primary"
                        };
                    });

                yeniNitrifikasyon.sort((a, b) => b.min - a.min);
                setNitrifikasyonKatsayilari(yeniNitrifikasyon);

                const maxEmp = parseFloat(paramMap["boiEmperik"]) || 0;
                setMaksimumEmperik(maxEmp);

                const storePlanetDisk = useTeklifStore.getState().formData.planetDiskDetails || {};
                if (!storePlanetDisk.tasarim || !storePlanetDisk.tasarim.aritmaParametreleri) {
                    const storeAritmaParametreleri = storePlanetDisk.tasarim?.aritmaParametreleri || {};
                    const currentAtiksutype = storeAritmaParametreleri.atiksutype || "evsel";
                    const currentRBCUnite = storeAritmaParametreleri.RBCUnite || "MX";
                    const varsayilanSinirlar = getDiskSinirlari(currentRBCUnite, currentAtiksutype, matris);

                    const defaultParamData = {
                        hesapYontemi: storeAritmaParametreleri.hesapYontemi !== undefined ? storeAritmaParametreleri.hesapYontemi : "hidrolik",
                        atiksutype: currentAtiksutype,
                        RBCUnite: currentRBCUnite,
                        girisBoi: storeAritmaParametreleri.girisBoi !== undefined ? storeAritmaParametreleri.girisBoi : 350,
                        debi: storeAritmaParametreleri.debi !== undefined ? storeAritmaParametreleri.debi : 70,
                        cikisBoi: storeAritmaParametreleri.cikisBoi !== undefined ? storeAritmaParametreleri.cikisBoi : 40,
                        sicaklik: storeAritmaParametreleri.sicaklik !== undefined ? storeAritmaParametreleri.sicaklik : 19,
                        giderimVerimi: storeAritmaParametreleri.giderimVerimi !== undefined ? storeAritmaParametreleri.giderimVerimi : 33,
                        emperik: storeAritmaParametreleri.emperik !== undefined ? storeAritmaParametreleri.emperik : maxEmp,
                        nitrifikasyon: storeAritmaParametreleri.nitrifikasyon || "nitrifikasyonYok",
                        girisAmonyum: storeAritmaParametreleri.girisAmonyum !== undefined ? storeAritmaParametreleri.girisAmonyum : 48,
                        cikisAmonyum: storeAritmaParametreleri.cikisAmonyum !== undefined ? storeAritmaParametreleri.cikisAmonyum : 8,
                        nitrifikasyonEmperik: storeAritmaParametreleri.nitrifikasyonEmperik !== undefined
                            ? storeAritmaParametreleri.nitrifikasyonEmperik
                            : hesaplaNitrifikasyonEmperik(storeAritmaParametreleri.sicaklik ?? 19, yeniNitrifikasyon),
                        isEmperikManual: storeAritmaParametreleri.isEmperikManual !== undefined ? storeAritmaParametreleri.isEmperikManual : false,
                        kaynaklar: storeAritmaParametreleri.kaynaklar || [
                            { id: Date.now(), ad: "1. KAYNAK", kisiSayisi: 3000, organikYuk: 60, hidrolikYuk: 200 }
                        ],
                        minDisk: varsayilanSinirlar.minDisk,
                        maxDisk: varsayilanSinirlar.maxDisk
                    };

                    updateSection("planetDiskDetails", {
                        debi: storePlanetDisk.debi !== undefined ? storePlanetDisk.debi : 70,
                        tasarim: {
                            ...storePlanetDisk.tasarim,
                            aritmaParametreleri: defaultParamData
                        }
                    });
                }

                setLoading(false);
            } catch (error) {
                console.error("Parametre verileri yüklenirken hata oldu:", error);
                setLoading(false);
            }
        };

        fetchParameters();
    }, []);

    const storePlanetDisk = formData.planetDiskDetails || {};
    const storeAritmaParametreleri = storePlanetDisk.tasarim?.aritmaParametreleri || {};
    const rootDebi = storePlanetDisk.debi !== undefined ? storePlanetDisk.debi : 70;

    // Dinamik otomatik hesaplama yapan useEffect
    useEffect(() => {
        if (loading || !storeAritmaParametreleri.sicaklik) return;

        const currentSicaklik = Number(storeAritmaParametreleri.sicaklik ?? 19);
        const currentCikisBoi = Number(storeAritmaParametreleri.cikisBoi ?? 40);

        // 1. NORMAL EMPERİK HESAPLAMA & GÜNCELLEME
        const yeniEmperikRaw = hesaplaDiskKatsayisiDetayli(currentSicaklik, currentCikisBoi, Number(maksimumEmperik));
        const yeniEmperik = parseFloat(yeniEmperikRaw) || 0;

        if (yeniEmperik !== storeAritmaParametreleri.emperik) {

            // updateSection yerine doğrudan ana store'u atomic olarak manipüle ediyoruz
            useTeklifStore.setState((state) => {
                const diskDetails = state.formData.planetDiskDetails || {};
                const tasarim = diskDetails.tasarim || {};
                const params = tasarim.aritmaParametreleri || {};

                return {
                    formData: {
                        ...state.formData,
                        planetDiskDetails: {
                            ...diskDetails,
                            tasarim: {
                                ...tasarim,
                                aritmaParametreleri: {
                                    ...params,
                                    emperik: yeniEmperik
                                }
                            }
                        }
                    }
                };
            });
        }

        // 2. NİTRİFİKASYON EMPERİĞİ HESAPLAMA & GÜNCELLEME
        const yeniNitrifikasyonEmperik = hesaplaNitrifikasyonEmperik(currentSicaklik);

        if (!storeAritmaParametreleri.isEmperikManual && yeniNitrifikasyonEmperik !== storeAritmaParametreleri.nitrifikasyonEmperik) {
            useTeklifStore.setState((state) => {
                const diskDetails = state.formData.planetDiskDetails || {};
                const tasarim = diskDetails.tasarim || {};
                const params = tasarim.aritmaParametreleri || {};

                return {
                    formData: {
                        ...state.formData,
                        planetDiskDetails: {
                            ...diskDetails,
                            tasarim: {
                                ...tasarim,
                                aritmaParametreleri: {
                                    ...params,
                                    nitrifikasyonEmperik: yeniNitrifikasyonEmperik
                                }
                            }
                        }
                    }
                };
            });
        }

    }, [
        storeAritmaParametreleri.sicaklik,
        storeAritmaParametreleri.cikisBoi,
        maksimumEmperik,
        loading,
        storeAritmaParametreleri.emperik,
        storeAritmaParametreleri.nitrifikasyonEmperik,
        storeAritmaParametreleri.isEmperikManual
    ]);

    const currentParamData = storeAritmaParametreleri;
    const kaynaklarListesi = currentParamData.kaynaklar || [];
    const toplamLitreGun = kaynaklarListesi.reduce((acc, k) => acc + (Number(k.kisiSayisi || 0) * Number(k.hidrolikYuk || 0)), 0);
    const toplamM3Gun = toplamLitreGun / 1000;
    const toplamOrganikYukGram = kaynaklarListesi.reduce((acc, k) => acc + (Number(k.kisiSayisi || 0) * Number(k.organikYuk || 0)), 0);
    const hesaplananGirisBoi = toplamM3Gun > 0 ? Math.round((toplamOrganikYukGram / toplamM3Gun)) : 0;

    const recalculateNihaiDegerler = (kaynaklarListesi) => {
        const tLitre = kaynaklarListesi.reduce((acc, k) => acc + (Number(k.kisiSayisi || 0) * Number(k.hidrolikYuk || 0)), 0);
        const nihaiDebi = tLitre / 1000;
        const tGram = kaynaklarListesi.reduce((acc, k) => acc + (Number(k.kisiSayisi || 0) * Number(k.organikYuk || 0)), 0);
        const nihaiGirisBoi = nihaiDebi > 0 ? Math.round((tGram / nihaiDebi)) : 0;
        return { nihaiDebi, nihaiGirisBoi };
    };

    // handleChange (GÜNCELLENDİ)
    const handleChange = (e) => {
        const rawValue = e.target.value;
        const val = rawValue === "" ? 0 : (!isNaN(Number(rawValue)) ? Number(rawValue) : rawValue);
        const name = e.target.name;

        let updatedParamData = { ...currentParamData, [name]: val };

        // Normal BOİ ampirik katsayısı el ile değiştirilirse bayrağı kaldır/işaretle
        if (name === "emperik" || name === "nitrifikasyonEmperik") {
            updatedParamData.isEmperikManual = true;
        }

        if (name === "RBCUnite") {
            const yeniSinirlar = getDiskSinirlari(val, currentParamData.atiksutype);
            updatedParamData.minDisk = yeniSinirlar.minDisk;
            updatedParamData.maxDisk = yeniSinirlar.maxDisk;
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
        updateSection("planetDiskDetails", {
            tasarim: {
                ...storePlanetDisk.tasarim,
                aritmaParametreleri: {
                    ...currentParamData,
                    nitrifikasyon: isChecked ? "nitrifikasyonVar" : "nitrifikasyonYok",
                    isEmperikManual: isChecked ? currentParamData.isEmperikManual : false,
                    nitrifikasyonEmperik: currentParamData.nitrifikasyonEmperik !== undefined
                        ? currentParamData.nitrifikasyonEmperik
                        : hesaplaNitrifikasyonEmperik(currentParamData.sicaklik ?? 19)
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
                {currentParamData.hesapYontemi === "hidrolik" ? (
                    <div className="row g-2 p-1">
                        <div className="col-6">
                            <label className="text-white-50 mb-1" style={{ fontSize: "11px" }}>Giriş BOİ (mg/l)</label>
                            <input
                                type="number"
                                name="girisBoi"
                                // Hem 0 hem undefined/null durumunu boş string'e düşürürüz
                                value={(currentParamData.girisBoi === 0 || currentParamData.girisBoi === undefined) ? "" : currentParamData.girisBoi}
                                onChange={handleChange}
                                className="form-control form-control-sm text-white fw-bold border-0 text-center"
                                style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", borderRadius: "6px" }}
                            />
                        </div>
                        <div className="col-6">
                            <label className="text-white-50 mb-1" style={{ fontSize: "11px" }}>Debi (m³/gün)</label>
                            <input
                                type="number"
                                name="debi"
                                value={(currentParamData.debi === 0 || currentParamData.debi === undefined) ? "" : currentParamData.debi}
                                onChange={handleChange}
                                className="form-control form-control-sm text-white fw-bold border-0 text-center"
                                style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", borderRadius: "6px" }}
                            />
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
                        <div className="mt-2 p-2 rounded row g-0 border border-dashed" style={{ backgroundColor: "rgba(16, 185, 129, 0.05)", borderColor: "rgba(16, 185, 129, 0.2)" }}>
                            <div className="col-6 border-end border-secondary border-opacity-25 d-flex flex-column align-items-center justify-content-center">
                                <span className="text-white-50" style={{ fontSize: "9px" }}>TOPLAM HİDROLİK YÜK</span>
                                <span className="text-white fw-bold mt-0.5" style={{ fontSize: "12px" }}>
                                    {toplamM3Gun.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} <small className="text-white-50 fw-normal" style={{ fontSize: "9px" }}>m³/gün</small>
                                </span>
                            </div>
                            <div className="col-6 d-flex flex-column align-items-center justify-content-center">
                                <span className="text-white-50" style={{ fontSize: "9px" }}>TOPLAM BOİ</span>
                                <span className="text-emerald fw-bold mt-0.5" style={{ fontSize: "12px", color: "#10b981" }}>
                                    {hesaplananGirisBoi} <small className="text-white-50 fw-normal" style={{ fontSize: "9px" }}>mg/l</small>
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="row g-1 pt-2" style={{ borderTop: "1px dashed #334155" }}>
                <div className="col-4">
                    <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>Hedef BOİ</label>
                    <input
                        type="number"
                        name="cikisBoi"
                        value={(currentParamData.cikisBoi === 0 || currentParamData.cikisBoi === undefined) ? "" : currentParamData.cikisBoi}
                        onChange={handleChange}
                        className="form-control form-control-sm border-0 text-white text-center fw-bold"
                        style={{ backgroundColor: "#1e293b", fontSize: "12px", borderBottom: "2px solid #38bdf8", borderRadius: "4px 4px 0 0" }}
                    />
                </div>
                <div className="col-4">
                    <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>Sıcaklık</label>
                    <input
                        type="number"
                        name="sicaklik"
                        value={(currentParamData.sicaklik === 0 || currentParamData.sicaklik === undefined) ? "" : currentParamData.sicaklik}
                        onChange={handleChange}
                        className="form-control form-control-sm border-0 text-white text-center fw-bold"
                        style={{ backgroundColor: "#1e293b", fontSize: "12px", borderBottom: "2px solid #38bdf8", borderRadius: "4px 4px 0 0" }}
                    />
                </div>
                <div className="col-4">
                    <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>Ön Arıtma Verim, (%)</label>
                    <input
                        type="number"
                        name="giderimVerimi"
                        value={(currentParamData.giderimVerimi === 0 || currentParamData.giderimVerimi === undefined) ? "" : currentParamData.giderimVerimi}
                        onChange={handleChange}
                        className="form-control form-control-sm border-0 text-white text-center fw-bold"
                        style={{ backgroundColor: "#1e293b", fontSize: "12px", borderBottom: "2px solid #38bdf8", borderRadius: "4px 4px 0 0" }}
                    />
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
                            <input
                                type="number"
                                name="girisAmonyum"
                                value={(currentParamData.girisAmonyum === 0 || currentParamData.girisAmonyum === undefined) ? "" : currentParamData.girisAmonyum}
                                onChange={handleChange}
                                className="form-control form-control-sm bg-dark text-white text-center fw-semibold border-0 py-1"
                                style={{ fontSize: "11px", borderRadius: "4px" }}
                            />
                        </div>
                        <div className="col-4">
                            <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "9px" }}>Çıkış Amonyum (mg/l)</label>
                            <input
                                type="number"
                                name="cikisAmonyum"
                                value={(currentParamData.cikisAmonyum === 0 || currentParamData.cikisAmonyum === undefined) ? "" : currentParamData.cikisAmonyum}
                                onChange={handleChange}
                                className="form-control form-control-sm bg-dark text-white text-center fw-semibold border-0 py-1"
                                style={{ fontSize: "11px", borderRadius: "4px" }}
                            />
                        </div>
                        <div className="col-4">
                            <label className="text-white-50 d-flex align-items-center justify-content-center gap-1 mb-1" style={{ fontSize: "9px" }}>
                                Nit. Emperiği ...
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                name="nitrifikasyonEmperik"
                                // Buraya ekstra koruma ekliyoruz
                                value={(currentParamData.nitrifikasyonEmperik === 0 || currentParamData.nitrifikasyonEmperik === undefined) ? "" : currentParamData.nitrifikasyonEmperik}
                                onChange={handleChange}
                                className="form-control form-control-sm text-center fw-bold border-0 py-1 text-warning"
                                style={{ backgroundColor: "rgba(255, 193, 7, 0.15)", fontSize: "11px", borderRadius: "4px" }}
                            />
                        </div>
                    </div>
                )}
            </div>

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
                            {nitrifikasyonKatsayilari.map((kural, idx) => (
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