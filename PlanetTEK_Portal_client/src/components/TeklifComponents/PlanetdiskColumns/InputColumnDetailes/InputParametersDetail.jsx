import React, { useEffect, useState } from "react";
import hesaplaDiskKatsayisiDetayli from "../../../../utils/hesaplaDiskKatsayisiDetayli";

function InputParameters({ data = {}, updateData }) {
    const [showInfoModal, setShowInfoModal] = useState(false);

    // Yeni veri mimarisinden (data.tasarim.aritmaParametreleri) güvenli okuma yapıyoruz
    const currentParamData = data?.tasarim?.aritmaParametreleri || {};

    // Sıcaklığa göre nitrifikasyon emperik katsayısını hesaplayan yardımcı fonksiyon
    const hesaplaNitrifikasyonEmperik = (sicaklik) => {
        const s = Number(sicaklik);
        if (s > 23) return 1.7;
        if (s >= 17 && s <= 22) return 1.4;
        if (s >= 13 && s <= 16) return 1.0;
        if (s < 12) return 0.6;
        if (s >= 12 && s < 13) return 0.6;
        if (s > 22 && s <= 23) return 1.4;
        return 1.0;
    };

    useEffect(() => {
        const updatedFields = {};

        if (currentParamData.cikisBoi === undefined) updatedFields.cikisBoi = 40;
        if (currentParamData.sicaklik === undefined) updatedFields.sicaklik = 19;
        
        // 🚀 DÜZELTME: maxDiskAdedi, minDiskAdedi ve secilenDiskTipi kontrol satırları buradan kaldırıldı!
        
        if (currentParamData.giderimVerimi === undefined) updatedFields.giderimVerimi = 33;
        if (currentParamData.emperik === undefined) updatedFields.emperik = 22.00;
        if (!currentParamData.hesapYontemi) updatedFields.hesapYontemi = "hidrolik";
        if (!currentParamData.atiksutype) updatedFields.atiksutype = "evsel";
        if (currentParamData.girisBoi === undefined) updatedFields.girisBoi = 350;

        if (data.debi === undefined) updatedFields.debi = 70;
        if (currentParamData.girisBoi === undefined) updatedFields.girisBoi = 350;

        if (!currentParamData.nitrifikasyon) updatedFields.nitrifikasyon = "nitrifikasyonYok";
        if (currentParamData.girisAmonyum === undefined) updatedFields.girisAmonyum = 48;
        if (currentParamData.cikisAmonyum === undefined) updatedFields.cikisAmonyum = 8;
        if (currentParamData.nitrifikasyonEmperik === undefined) {
            updatedFields.nitrifikasyonEmperik = hesaplaNitrifikasyonEmperik(currentParamData.sicaklik ?? 19);
        }

        if (!currentParamData.kaynaklar || currentParamData.kaynaklar.length === 0) {
            updatedFields.kaynaklar = [
                { id: Date.now(), ad: "1. KAYNAK", kisiSayisi: 3000, organikYuk: 60, hidrolikYuk: 200 }
            ];
        }

        if (Object.keys(updatedFields).length > 0 && updateData) {
            updateData({
                ...data,
                debi: updatedFields.debi !== undefined ? updatedFields.debi : (data.debi ?? 70),
                tasarim: {
                    ...data?.tasarim,
                    aritmaParametreleri: {
                        ...currentParamData,
                        ...updatedFields
                    }
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

        const updatedParamData = {
            ...currentParamData,
            [name]: val
        };

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

        const nextData = {
            ...data,
            tasarim: {
                ...data?.tasarim,
                aritmaParametreleri: updatedParamData
            }
        };

        if (name === "debi") {
            nextData.debi = val;
        }

        updateData(nextData);
    };

    const handleTypeToggle = (e) => {
        const selectedType = e.target.checked ? "endustriyel" : "evsel";
        updateData({
            ...data,
            tasarim: {
                ...data?.tasarim,
                aritmaParametreleri: {
                    ...currentParamData,
                    atiksutype: selectedType
                }
            }
        });
    };

    const handleNitroToggle = (e) => {
        const isChecked = e.target.checked;
        const selectedType = isChecked ? "nitrifikasyonVar" : "nitrifikasyonYok";

        updateData({
            ...data,
            tasarim: {
                ...data?.tasarim,
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
            updateData({
                ...data,
                debi: 70,
                tasarim: {
                    ...data?.tasarim,
                    aritmaParametreleri: {
                        ...currentParamData,
                        hesapYontemi: yontem,
                        debi: 70,
                        girisBoi: 350
                    }
                }
            });
        } else {
            const { nihaiDebi, nihaiGirisBoi } = recalculateNihaiDegerler(currentParamData.kaynaklar || []);
            updateData({
                ...data,
                debi: nihaiDebi,
                tasarim: {
                    ...data?.tasarim,
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

        updateData({
            ...data,
            debi: nihaiDebi,
            tasarim: {
                ...data?.tasarim,
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

        updateData({
            ...data,
            debi: nihaiDebi,
            tasarim: {
                ...data?.tasarim,
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

        updateData({
            ...data,
            debi: nihaiDebi,
            tasarim: {
                ...data?.tasarim,
                aritmaParametreleri: {
                    ...currentParamData,
                    kaynaklar: yeniKaynaklar,
                    debi: nihaiDebi,
                    girisBoi: nihaiGirisBoi
                }
            }
        });
    };

    return (
        <div className="card-body p-4 d-flex flex-column gap-3" style={{ position: "relative" }}>
            {/* 1. BAŞLIK BÖLÜMÜ */}
            <div className="d-flex align-items-center">
                <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
                    1. Arıtma Parametreleri
                </span>
                <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
            </div>

            {/* 2. YÖNTEM SEÇİMİ */}
            <div>
                <div className="btn-group w-100" role="group" style={{ backgroundColor: "#1e293b", padding: "4px", borderRadius: "8px" }}>
                    <button
                        type="button"
                        className="btn btn-sm border-0 py-1.5 fw-medium"
                        style={{
                            borderRadius: "6px",
                            fontSize: "12px",
                            backgroundColor: currentParamData.hesapYontemi === "hidrolik" ? "#ef4444" : "transparent",
                            color: "#ffffff"
                        }}
                        onClick={() => handleYontemChange("hidrolik")}
                    >
                        <i className="bi bi-droplet-fill me-1.5"></i>Hidrolik Yük
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm border-0 py-1.5 fw-medium"
                        style={{
                            borderRadius: "6px",
                            fontSize: "12px",
                            backgroundColor: currentParamData.hesapYontemi === "kisi" ? "#10b981" : "transparent",
                            color: "#ffffff"
                        }}
                        onClick={() => handleYontemChange("kisi")}
                    >
                        <i className="bi bi-people-fill me-1.5"></i>Kişi Sayısı
                    </button>
                </div>
            </div>

            {/* 3. DİNAMİK PANEL ALANI */}
            <div className="rounded p-2.5" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
                {currentParamData.hesapYontemi === "hidrolik" ? (
                    <div className="row g-2 p-1">
                        <div className="col-6">
                            <label className="text-white-50 mb-1" style={{ fontSize: "11px" }}>Giriş BOİ (mg/l)</label>
                            <input
                                type="number"
                                name="girisBoi"
                                value={currentParamData.girisBoi === 0 ? "" : (currentParamData.girisBoi ?? "")}
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
                                value={currentParamData.debi === 0 ? "" : (currentParamData.debi ?? "")}
                                onChange={handleChange}
                                className="form-control form-control-sm text-white fw-bold border-0 text-center"
                                style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", borderRadius: "6px" }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="p-1">
                        <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                            <span className="text-white-50 fw-medium" style={{ fontSize: "11px" }}>
                                <i className="bi bi-layers-half me-1"></i> Atıksu Kaynakları
                            </span>
                            <button type="button" onClick={handleAddKaynak} className="btn btn-sm py-0.5 px-2 fw-semibold text-white border-0" style={{ backgroundColor: "#059669", fontSize: "10px", borderRadius: "4px" }}>
                                + Kaynak Ekle
                            </button>
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

            {/* 4. 3 PARALEL PARAMETRE */}
            <div className="row g-1 pt-2" style={{ borderTop: "1px dashed #334155" }}>
                <div className="col-4">
                    <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>Hedef BOİ</label>
                    <input type="number" name="cikisBoi" value={currentParamData.cikisBoi === 0 ? "" : (currentParamData.cikisBoi ?? 40)} onChange={handleChange} className="form-control form-control-sm border-0 text-white text-center fw-bold" style={{ backgroundColor: "#1e293b", fontSize: "12px", borderBottom: "2px solid #38bdf8", borderRadius: "4px 4px 0 0" }} />
                </div>
                <div className="col-4">
                    <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>Sıcaklık</label>
                    <input type="number" name="sicaklik" value={currentParamData.sicaklik === 0 ? "" : (currentParamData.sicaklik ?? 19)} onChange={handleChange} className="form-control form-control-sm border-0 text-white text-center fw-bold" style={{ backgroundColor: "#1e293b", fontSize: "12px", borderBottom: "2px solid #38bdf8", borderRadius: "4px 4px 0 0" }} />
                </div>
                <div className="col-4">
                    <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>Ön Arıtma Verim, (%)</label>
                    <input type="number" name="giderimVerimi" value={currentParamData.giderimVerimi === 0 ? "" : (currentParamData.giderimVerimi ?? 33)} onChange={handleChange} className="form-control form-control-sm border-0 text-white text-center fw-bold" style={{ backgroundColor: "#1e293b", fontSize: "12px", borderBottom: "2px solid #38bdf8", borderRadius: "4px 4px 0 0" }} />
                </div>
            </div>

            {/* 5. ATİKSU TİPİ SWITCH SEÇİMİ */}
            <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="fw-medium text-white-50" style={{ fontSize: "12px" }}>
                    {currentParamData.atiksutype === "endustriyel" ? (
                        <span className="text-warning"><i className="bi bi-building-gear me-1.5"></i>Endüstriyel Atıksu</span>
                    ) : (
                        <span className="text-info"><i className="bi bi-house-door-fill me-1.5"></i>Evsel Atıksu</span>
                    )}
                </span>
                <div className="form-check form-switch m-0 p-0 d-flex align-items-center">
                    <input
                        className="form-check-input cursor-pointer m-0"
                        type="checkbox"
                        role="switch"
                        id="atiksutypeSwitch"
                        style={{ width: "38px", height: "20px" }}
                        checked={currentParamData.atiksutype === "endustriyel"}
                        onChange={handleTypeToggle}
                    />
                </div>
            </div>

            {/* 6. NİTRİFİKASYON PANELİ */}
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
                        <input
                            className="form-check-input cursor-pointer m-0"
                            type="checkbox"
                            role="switch"
                            id="nitrifikasyonSwitch"
                            style={{ width: "38px", height: "20px" }}
                            checked={currentParamData.nitrifikasyon === "nitrifikasyonVar"}
                            onChange={handleNitroToggle}
                        />
                    </div>
                </div>

                {/* Nitrifikasyon Aktif Olduğunda Açılan Satır */}
                {currentParamData.nitrifikasyon === "nitrifikasyonVar" && (
                    <div className="row g-2 pt-1">
                        <div className="col-4">
                            <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "9px" }}>Giriş Amonyum (mg/l)</label>
                            <input
                                type="number"
                                name="girisAmonyum"
                                value={currentParamData.girisAmonyum === 0 ? "" : (currentParamData.girisAmonyum ?? 48)}
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
                                value={currentParamData.cikisAmonyum === 0 ? "" : (currentParamData.cikisAmonyum ?? 8)}
                                onChange={handleChange}
                                className="form-control form-control-sm bg-dark text-white text-center fw-semibold border-0 py-1"
                                style={{ fontSize: "11px", borderRadius: "4px" }}
                            />
                        </div>
                        <div className="col-4">
                            <label className="text-white-50 d-flex align-items-center justify-content-center gap-1 mb-1" style={{ fontSize: "9px" }}>
                                Nit. Emperiği
                                <i
                                    className="bi bi-info-circle-fill text-info cursor-pointer"
                                    style={{ fontSize: "10px" }}
                                    onClick={() => setShowInfoModal(true)}
                                ></i>
                            </label>
                            <div
                                className="form-control form-control-sm text-center fw-bold border-0 py-1 text-warning"
                                style={{ backgroundColor: "rgba(255, 193, 7, 0.15)", fontSize: "11px", borderRadius: "4px" }}
                            >
                                {currentParamData.nitrifikasyonEmperik ?? 1.4}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* KÜÇÜK BİLGİ MODALI (INFO MODAL) */}
            {showInfoModal && (
                <div style={{
                    position: "absolute",
                    top: "80%",
                    left: "5%",
                    right: "5%",
                    backgroundColor: "#1e293b",
                    border: "2px solid #334155",
                    borderRadius: "8px",
                    zIndex: 1050,
                    boxShadow: "0px 10px 25px rgba(0,0,0,0.5)"
                }} className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom border-secondary">
                        <span className="text-white fw-bold" style={{ fontSize: "12px" }}>
                            <i className="bi bi-info-circle me-1.5 text-info"></i>Nitrifikasyon Emperik Katsayıları
                        </span>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            style={{ transform: "scale(0.75)" }}
                            onClick={() => setShowInfoModal(false)}
                        ></button>
                    </div>
                    <div className="text-white-50" style={{ fontSize: "11px", lineHeight: "1.6" }}>
                        <p className="mb-2">Sıcaklık kademelerine göre uygulanan <b>gr/m²·gün</b> katsayı kriterleri:</p>
                        <ul className="list-unstyled d-flex flex-column gap-1 m-0 ps-1">
                            <li><span className="text-success fw-bold">☀️ Sıcaklık &gt; 23 °C :</span> <span className="text-white">1.7 gr/m².gün</span></li>
                            <li><span className="text-info fw-bold">⛅ Sıcaklık 17 - 22 °C :</span> <span className="text-white">1.4 gr/m².gün</span></li>
                            <li><span className="text-warning fw-bold">🌤️ Sıcaklık 13 - 16 °C :</span> <span className="text-white">1.0 gr/m².gün</span></li>
                            <li><span className="text-danger fw-bold">❄️ Sıcaklık &lt; 12 °C :</span> <span className="text-white">0.6 gr/m².gün</span></li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InputParameters;