import React, { useEffect, useState, useMemo } from "react";
import { useTeklifStore } from "../../../../utils/teklifStore"; // Store yolunu kontrol et
import hesaplaDiskKatsayisiDetayli from "../../../../utils/hesaplaDiskKatsayisiDetayli";
import EmperikDetail from "./EmperikDetail";

function KademeDetail() {
    // 1. ZUSTAND STORE BAĞLANTISI
    const formData = useTeklifStore((state) => state.formData);
    const updateSection = useTeklifStore((state) => state.updateSection);

    // Tüm yapıyı merkezi planetDiskDetails düğümünden süzüyoruz
    const planetDiskDetails = formData.planetDiskDetails || {};
    const aritmaParametreleri = planetDiskDetails.tasarim?.aritmaParametreleri || {};
    const diskParametreleri = planetDiskDetails.tasarim?.diskParametreleri || {};
    const currentKademeData = planetDiskDetails.tasarim?.kademeParametreleri || {};

    // Girdileri store'un gerçek yerinden (aritmaParametreleri) güvenli bir şekilde çekiyoruz
    const girisBoi = Number(aritmaParametreleri.girisBoi) || 0;
    const sicaklik = Number(aritmaParametreleri.sicaklik) || 0;
    const cikisBoi = Number(aritmaParametreleri.cikisBoi) || 0;
    
    const emperik = Number(currentKademeData.emperik) || Number(aritmaParametreleri.emperik) || 0;
    const kademeler = currentKademeData.kademeler || [];

    // DiskParameters'tan dinamik sınırlar
    const secilenDiskTipi = diskParametreleri.secilenDiskTipi || "MX";
    const diskcapi = secilenDiskTipi === "MX" ? 2.05 : 1.35;
    const maxDiskAdedi = diskParametreleri.maxDiskAdedi || (secilenDiskTipi === "MX" ? 135 : 75);
    const minDiskAdedi = diskParametreleri.minDiskAdedi || (secilenDiskTipi === "MX" ? 100 : 50);

    const tekDiskAlani = useMemo(() => {
        return Math.PI * Math.pow(diskcapi / 2, 2) * 2;
    }, [diskcapi]);

    const finalMetrekare = currentKademeData.finalMetrekare || []; 
    const secilenUniteler = currentKademeData.secilenUniteler || {};
    const secilenSiralar = currentKademeData.secilenSiralar || {};
    const yerlesimDuzenleri = currentKademeData.yerlesimDuzenleri || {};

    const [showsKademe, setShowKademe] = useState(false);
    const [isEmperikOpen, setIsEmperikOpen] = useState(false);
    const [selectedKademeId, setSelectedSelectedKademeId] = useState(null);

    // Kademelerin Temel Hesap Blokları (Sadece görsel izleme amaçlı useMemo)
    const kademeHesaplari = useMemo(() => {
        if (!finalMetrekare || finalMetrekare.length === 0) return [];

        return finalMetrekare.map((kademeObj, index) => {
            const alanSayi = Number(kademeObj.alan) || 0;
            const toplamGerekliDisk = Math.ceil(alanSayi / tekDiskAlani);
            const minUniteSayisi = Math.ceil(toplamGerekliDisk / maxDiskAdedi);
            const maxUniteSayisi = Math.ceil(toplamGerekliDisk / minDiskAdedi);

            const alternatifUniteler = [];
            for (let i = minUniteSayisi; i <= maxUniteSayisi; i++) {
                alternatifUniteler.push(i);
            }

            const mevcutSecim = secilenUniteler[index] || alternatifUniteler[0] || minUniteSayisi;
            const milBasinaDisk = Math.ceil(toplamGerekliDisk / mevcutSecim);
            const siraSayisi = secilenSiralar[index] || 2;
            const ozelDuzen = yerlesimDuzenleri[index];
            let dagilim = [];

            if (ozelDuzen && ozelDuzen.length === siraSayisi) {
                dagilim = ozelDuzen;
            } else {
                let kalanUnite = mevcutSecim;
                for (let s = 0; s < siraSayisi; s++) {
                    const siraPayi = Math.ceil(kalanUnite / (siraSayisi - s));
                    dagilim.push(siraPayi);
                    kalanUnite -= siraPayi;
                }
            }

            return {
                index: index + 1,
                realIndex: index,
                gerekliAlan: alanSayi,
                rawKademeVerisi: kademeObj,
                toplamGerekliDisk,
                alternatifUniteler,
                mevcutSecim,
                milBasinaDisk,
                siraSayisi,
                dagilim
            };
        });
    }, [finalMetrekare, tekDiskAlani, minDiskAdedi, maxDiskAdedi, secilenUniteler, secilenSiralar, yerlesimDuzenleri]);

    useEffect(() => {
        setShowKademe(cikisBoi < 40);
    }, [cikisBoi]);

    const openEmperikModal = (id) => {
        setSelectedSelectedKademeId(id);
        setIsEmperikOpen(true);
    };

    // 2. STORE UYUMLU KADEME EKLEME
    const handleAddKademe = () => {
        if (cikisBoi >= 40) return;

        let yeniKademe = {
            id: Date.now(),
            ad: `Kademe ${kademeler.length + 1}`,
            boi: 30,
            emperik: hesaplaDiskKatsayisiDetayli(sicaklik, 30)
        };

        if (kademeler.length === 0) {
            yeniKademe.ad = "Kademe 1";
            yeniKademe.boi = 40;
            yeniKademe.emperik = hesaplaDiskKatsayisiDetayli(sicaklik, 40);
        }

        updateSection("planetDiskDetails", {
            tasarim: {
                ...planetDiskDetails.tasarim,
                kademeParametreleri: {
                    ...currentKademeData,
                    kademeler: [...kademeler, yeniKademe]
                }
            }
        });
    };

    // 3. STORE UYUMLU KADEME INPUT DEĞİŞİMİ
    const handleKademeChange = (id, field, value) => {
        const updatedKademeler = kademeler.map((k) => {
            if (k.id === id) {
                const updatedKademe = {
                    ...k,
                    [field]: field === "boi" ? (value === "" ? "" : Number(value)) : value,
                };

                if (field === "boi" && value !== "") {
                    updatedKademe.emperik = hesaplaDiskKatsayisiDetayli(sicaklik, Number(value));
                }
                return updatedKademe;
            }
            return k;
        });

        updateSection("planetDiskDetails", {
            tasarim: {
                ...planetDiskDetails.tasarim,
                kademeParametreleri: {
                    ...currentKademeData,
                    kademeler: updatedKademeler
                }
            }
        });
    };

    // 4. STORE UYUMLU KADEME SİLME
    const handleRemoveKademe = (id) => {
        updateSection("planetDiskDetails", {
            tasarim: {
                ...planetDiskDetails.tasarim,
                kademeParametreleri: {
                    ...currentKademeData,
                    kademeler: kademeler.filter((k) => k.id !== id)
                }
            }
        });
    };

    const canAddKademe = cikisBoi < 40;

    return (
        <div className="p-2 rounded mb-1 position-relative" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-white-50 fw-semibold" style={{ fontSize: "12px" }}>Arıtma Kademeleri & BOİ Yükü</span>
                {canAddKademe && (
                    <button
                        type="button"
                        className="btn btn-sm py-0 px-2 text-white border-0"
                        style={{ backgroundColor: "#00874e", fontSize: "11px", borderRadius: "6px" }}
                        onClick={handleAddKademe}
                    >
                        + Kademe Ekle
                    </button>
                )}
            </div>

            <div className="position-relative d-flex align-items-center justify-content-between my-1 px-1">
                <div className="position-absolute start-0 end-0" style={{ height: "2px", backgroundColor: "#475569", top: "35%", transform: "translateY(-50%)", zIndex: 1 }}></div>

                {/* GİRİŞ GÖRSEL BAR (Artık Adım 1'deki gerçek veriyi anlık gösteriyor) */}
                <div className="text-center d-flex flex-column align-items-center justify-content-between h-100" style={{ zIndex: 2, width: "75px" }}>
                    <div className="text-white-50" style={{ fontSize: "10px", height: "14px", lineHeight: "14px" }}>Giriş</div>
                    <div className="rounded-circle my-2 border border-secondary" style={{ width: "10px", height: "10px", backgroundColor: "#94a3b8" }}></div>
                    <div className="fw-bold text-nowrap d-flex align-items-center justify-content-center" style={{ fontSize: "11px", height: "16px", lineHeight: "1" }}>
                        <span style={{ color: "#94a3b8" }}>{girisBoi}</span>
                        <span className="fw-normal opacity-50 ms-1" style={{ fontSize: "9px" }}>mg/l</span>
                    </div>
                    <div className="mt-1" style={{ fontSize: "10px", height: "14px", visibility: "hidden" }}>-</div>
                </div>
                
                {/* DİNAMİK KADEMELER */}
                {showsKademe && kademeler.map((kademe) => (
                    <div key={kademe.id} className="text-center d-flex flex-column align-items-center justify-content-between h-100 px-1" style={{ zIndex: 2, flex: "1 1 0px", minWidth: "95px", maxWidth: "130px" }}>
                        <div className="w-100 position-relative" style={{ height: "14px" }}>
                            <input
                                type="text"
                                value={kademe.ad}
                                onChange={(e) => handleKademeChange(kademe.id, "ad", e.target.value)}
                                className="form-control form-control-sm text-center p-0 bg-transparent text-white-50 border-0 m-0 text-truncate"
                                style={{ fontSize: "10px", boxShadow: "none", height: "14px", lineHeight: "14px" }}
                            />
                        </div>

                        <div className="rounded-circle my-2 border border-warning position-relative" style={{ width: "10px", height: "10px", backgroundColor: "#1e293b" }}>
                            <button
                                type="button"
                                onClick={() => handleRemoveKademe(kademe.id)}
                                className="position-absolute border-0 bg-transparent text-danger p-0 fw-bold"
                                style={{ top: "-25px", left: "35px", transform: "translateX(-50%)", fontSize: "12px", outline: "none", boxShadow: "none" }}
                                title="Sil"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="d-flex align-items-center justify-content-center text-nowrap w-100" style={{ height: "16px", lineHeight: "1" }}>
                            <input
                                type="number"
                                value={kademe.boi}
                                onChange={(e) => handleKademeChange(kademe.id, "boi", e.target.value)}
                                className="form-control form-control-sm text-center p-0 bg-transparent text-warning border-0 fw-bold m-0 no-spinners"
                                style={{ fontSize: "11px", boxShadow: "none", height: "16px", width: "28px", minHeight: "auto", lineHeight: "1", padding: "0" }}
                                placeholder="0"
                            />
                            <span className="text-warning opacity-50 ms-1" style={{ fontSize: "9px" }}>mg/l</span>
                        </div>

                        <div className="d-flex align-items-center justify-content-center mt-1 text-nowrap" style={{ fontSize: "10px", height: "14px", lineHeight: "14px" }}>
                            <span style={{ color: "#38bdf8", fontWeight: "500" }}>{kademe.emperik}</span>
                            <span className="text-info opacity-50 ms-1" style={{ fontSize: "8px" }}>g/m²/g</span>
                            <button
                                type="button"
                                onClick={() => openEmperikModal(kademe.id)}
                                className="btn p-0 ms-1 border-0 bg-transparent opacity-75 hover-opacity-100"
                                style={{ fontSize: "10px", lineHeight: "1" }}
                                title="Emperik Katsayı Detayı Hesabı"
                            >
                                📊
                            </button>
                        </div>
                    </div>
                ))}

                {/* ÇIKIŞ GÖRSEL BAR (Adım 1'deki kurulan hedef çıkış değerini anlık çeker) */}
                <div className="text-center d-flex flex-column align-items-center justify-content-between h-100" style={{ zIndex: 2, width: "75px" }}>
                    <div className="text-white-50" style={{ fontSize: "10px", height: "14px", lineHeight: "14px" }}>Çıkış</div>
                    <div className="rounded-circle my-2 border border-success" style={{ width: "10px", height: "10px", backgroundColor: "#00874e" }}></div>
                    <div className="fw-bold text-success text-nowrap d-flex align-items-center justify-content-center" style={{ fontSize: "11px", height: "16px", lineHeight: "1" }}>
                        <span>{cikisBoi}</span>
                        <span className="fw-normal opacity-50 ms-1" style={{ fontSize: "9px" }}>mg/l</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-center mt-1 text-nowrap" style={{ fontSize: "10px", height: "14px", lineHeight: "14px" }}>
                        <span style={{ color: "#38bdf8", fontWeight: "500" }}>{emperik}</span>
                        <span className="text-info opacity-50 ms-1" style={{ fontSize: "8px" }}>g/m²/g</span>
                        <button
                            type="button"
                            onClick={() => openEmperikModal("cikis")}
                            className="btn p-0 ms-1 border-0 bg-transparent opacity-75 hover-opacity-100"
                            style={{ fontSize: "10px", lineHeight: "1" }}
                            title="Çıkış Emperik Katsayı Detayı"
                        >
                            📊
                        </button>
                    </div>
                </div>

                <style>{`
                    .no-spinners::-webkit-outer-spin-button,
                    .no-spinners::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    .no-spinners {
                        -moz-appearance: textfield;
                    }
                `}</style>
            </div>

            {cikisBoi >= 40 && (
                <div className="text-warning mt-0 text-center" style={{ fontSize: "11px" }}>
                    ℹ Çıkış BOİ ≥ 40 mg/l olduğundan kademe eklenemez.
                </div>
            )}

            {isEmperikOpen && (
                <EmperikDetail
                    isOpen={isEmperikOpen}
                    onClose={() => setIsEmperikOpen(false)}
                    activeKademeId={selectedKademeId}
                    data={planetDiskDetails} // Modal'a temizlenmiş alt düğümü gönderiyoruz
                />
            )}
        </div>
    );
}

export default KademeDetail;