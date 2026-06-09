import React, { useState, useMemo, useEffect } from "react";
import GiderimDetail from "./GiderimDetail";
import { useTeklifStore } from "../../../../utils/teklifStore";

function YerlesimDetail() {
    // 1. ZUSTAND STORE SEÇİCİLERİ
    const updateSection = useTeklifStore((state) => state.updateSection);
    const diskDetails = useTeklifStore((state) => state.formData?.planetDiskDetails || {});
    const finalMetrekare = useTeklifStore((state) => state.formData?.planetDiskDetails?.tasarim?.finalMetrekare || []);
    const kayitliYerlesimSiralanisi = useTeklifStore((state) => state.formData?.planetDiskDetails?.tasarim?.yerlesimSiralanisi);
    const kaydedilmisTasarim = useTeklifStore((state) => state.formData?.planetDiskDetails?.tasarim || {});

    const diskParametreleri = diskDetails.tasarim?.diskParametreleri || {};
    const lamellaData = diskDetails.tasarim?.lamella || {};
    const Q = Number(diskDetails.debi) || 0;

    const diskcapi = diskParametreleri.secilenDiskTipi === "MX" ? 2.05 : 1.35;
    const hacim = diskParametreleri.secilenDiskTipi === "MX" ? 4.5 : 2.00;
    const maxDiskAdedi = diskParametreleri.maxDiskAdedi || 135;
    const minDiskAdedi = diskParametreleri.minDiskAdedi || 100;

    const tekDiskAlani = 2 * (Math.PI * Math.pow(diskcapi, 2) / 4);

    // 2. LOCAL STATELER
    const [secilenUniteler, setSecilenUniteler] = useState(kaydedilmisTasarim.secilenUniteler || {});
    const [secilenSiralar, setSecilenSiralar] = useState(kaydedilmisTasarim.secilenSiralar || {});
    const [yerlesimDuzenleri, setYerlesimDuzenleri] = useState(kaydedilmisTasarim.yerlesimDuzenleri || {});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedKademeData, setSelectedKademeData] = useState(null);

    // CRITICAL FIX 1: Üst adımdan finalMetrekare değiştiğinde, local stateleri ezerek senkronize ediyoruz.
    // Böylece eski metrekareye ait kilitli kalan seçimler (Uniteler, Sıralar ve Drag-Drop düzenleri) temizleniyor.
    useEffect(() => {
        if (!finalMetrekare || finalMetrekare.length === 0) return;

        finalMetrekare.forEach((kademeObj, index) => {
            const alanSayi = Number(kademeObj.alan) || 0;
            const toplamGerekliDisk = Math.ceil(alanSayi / tekDiskAlani);
            const minUniteSayisi = Math.ceil(toplamGerekliDisk / maxDiskAdedi);

            setSecilenUniteler(minUniteSayisi);
            setSecilenSiralar({
                "0": 2,
                "1": 2
            });

        });

    }, [finalMetrekare, tekDiskAlani, maxDiskAdedi]); // Sadece finalMetrekare ve temel parametreler değiştiğinde tetiklenir


    // 3. KADEME HESAPLARI (Dinamik & Fallback Güvenlikli)
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

            const mevcutSecim = secilenUniteler[index] !== undefined
                ? Number(secilenUniteler[index])
                : minUniteSayisi;

            const siraSayisi = secilenSiralar[index] !== undefined
                ? Number(secilenSiralar[index])
                : 1;

            const milBasinaDisk = Math.ceil(toplamGerekliDisk / mevcutSecim);
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


    // 4. RUNTIME SIRALAMA HESAPLAMASI
    const tumSiralar = useMemo(() => {
        const siralar = [];
        let genelSiraNo = 1;

        kademeHesaplari.forEach((kademe) => {
            kademe.dagilim.forEach((siraAdet, sIdx) => {
                const HRT = Q > 0 ? (((hacim * siraAdet) / Q) * 24).toFixed(2) : 0;

                siralar.push({
                    isLamella: false,
                    genelSiraNo: genelSiraNo++,
                    kademeNo: kademe.index,
                    parentKademeIndex: kademe.realIndex,
                    siraTipi: sIdx,
                    adet: siraAdet,
                    milBasinaDisk: kademe.milBasinaDisk,
                    beklemeSuresi: HRT,
                    color: "#15803d",
                    borderColor: "#16a34a",
                    textColor: "#4ade80"
                });
            });
        });

        if (lamellaData && lamellaData.lamellaAdet && Number(lamellaData.lamellaAdet) > 0) {
            siralar.push({
                isLamella: true,
                genelSiraNo: genelSiraNo++,
                kademeNo: "Çökeltim",
                adet: Number(lamellaData.lamellaAdet),
                model: lamellaData.secilenLamellaModeli || "Bilinmiyor",
                alan: lamellaData.gerekliLamellaAlani || 0,
                hacim: lamellaData.gerekliLamellaHacmi || 0,
                color: "#0f766e",
                borderColor: "#14b8a6",
                textColor: "#2dd4bf"
            });
        }

        return siralar;
    }, [kademeHesaplari, hacim, Q, lamellaData]);


    // CRITICAL FIX 2: Store senkronizasyonunda `kaydedilmisTasarim` bağımlılığını kaldırıyoruz veya kontrolü safe hale getiriyoruz.
    // Local statelerdeki güncellemeleri de tek bir hamlede store'a yazıyoruz ki `finalMetrekare` değişince veriler kaybolmasın.
    useEffect(() => {
        if (!tumSiralar || tumSiralar.length === 0) return;

        // Derin kontrolü pure olarak `tumSiralar` ve store'daki kayıtlı dizi arasında yapıyoruz
        if (JSON.stringify(kayitliYerlesimSiralanisi) === JSON.stringify(tumSiralar)) return;

        updateSection("planetDiskDetails", {
            tasarim: {
                ...useTeklifStore.getState().formData?.planetDiskDetails?.tasarim, // En güncel store state'ini referans döngüsüne girmeden anlık çekiyoruz
                yerlesimSiralanisi: tumSiralar
            }
        });
    }, [tumSiralar, kayitliYerlesimSiralanisi, updateSection]); // `kaydedilmisTasarim` bağımlılığını sildik! Döngü kırıldı.


    // 7. EVENT HANDLERS
    const handleUniteChange = (kademeIndex, adet) => {
        const yeniAdet = parseInt(adet, 10);
        setSecilenUniteler(prev => ({ ...prev, [kademeIndex]: yeniAdet }));
        setYerlesimDuzenleri(prev => {
            const kopya = { ...prev };
            delete kopya[kademeIndex];
            return kopya;
        });
    };

    const handleSiraChange = (kademeIndex, siraAdedi) => {
        const yeniSira = parseInt(siraAdedi, 10);
        setSecilenSiralar(prev => ({ ...prev, [kademeIndex]: yeniSira }));
        setYerlesimDuzenleri(prev => {
            const kopya = { ...prev };
            delete kopya[kademeIndex];
            return kopya;
        });
    };

    const openDetailModal = (kademeVerisi, kademeSiraNo) => {
        setSelectedKademeData({ ...kademeVerisi, kademeNo: kademeSiraNo });
        setIsModalOpen(true);
    };

    // 8. HTML5 DRAG AND DROP HANDLERS
    const handleDragStart = (e, kaynakKademeIndex, kaynakSiraTipi) => {
        if (kaynakKademeIndex === undefined) return;
        e.dataTransfer.setData("kaynakKademeIndex", kaynakKademeIndex);
        e.dataTransfer.setData("kaynakSiraTipi", kaynakSiraTipi);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, hedefeBasildi, hedefKademeIndex, hedefSiraTipi) => {
        e.preventDefault();
        if (hedefKademeIndex === undefined) return;

        const kaynakKademeIndex = parseInt(e.dataTransfer.getData("kaynakKademeIndex"), 10);
        const kaynakSiraTipi = parseInt(e.dataTransfer.getData("kaynakSiraTipi"), 10);

        if (kaynakKademeIndex !== hedefKademeIndex) return;
        if (kaynakSiraTipi === hedefSiraTipi) return;

        const ilgiliKademe = kademeHesaplari.find(k => k.realIndex === hedefKademeIndex);
        if (!ilgiliKademe) return;

        const yeniDagilim = [...ilgiliKademe.dagilim];

        if (yeniDagilim[kaynakSiraTipi] > 0) {
            yeniDagilim[kaynakSiraTipi] -= 1;
            yeniDagilim[hedefSiraTipi] += 1;
        }

        setYerlesimDuzenleri(prev => ({ ...prev, [hedefKademeIndex]: yeniDagilim }));
    };

    return (
        <div className="p-1 rounded" style={{ backgroundColor: "#1e293b", display: "flex", flexDirection: "column" }}>
            {/* DROPDOWN ALANLARI */}
            <div className="row g-1">
                {kademeHesaplari.map((kademe) => (
                    <div key={`dropdown-${kademe.index}`} className="col-12 col-md-4">
                        <div className="p-1 rounded bg-dark bg-opacity-50" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                                <span className="fw-bold text-white" style={{ fontSize: "11px" }}>
                                    {kademe.index}. Kademe
                                </span>
                                <span className="text-white-50" style={{ fontSize: "11px" }}>
                                    <strong>{kademe.gerekliAlan.toFixed(2)} m²</strong> / {kademe.toplamGerekliDisk} Disk
                                </span>
                                <button
                                    onClick={() => openDetailModal(kademe.rawKademeVerisi, kademe.index)}
                                    className="btn btn-sm p-0 px-1"
                                    style={{ backgroundColor: "#334155", color: "#94a3b8", fontSize: "10px", border: "1px solid #475569" }}
                                >
                                    ℹ️
                                </button>
                            </div>

                            <div className="row g-1 align-items-end">
                                <div className="col-4">
                                    <div className="text-white-50 mb-1" style={{ fontSize: "9px", paddingLeft: "2px" }}>Ünite:</div>
                                    <select
                                        value={kademe.mevcutSecim}
                                        onChange={(e) => handleUniteChange(kademe.realIndex, e.target.value)}
                                        className="form-select form-select-sm bg-dark text-white border-0"
                                        style={{ fontSize: "11px", fontWeight: "bold", paddingLeft: "6px", height: "26px" }}
                                    >
                                        {kademe.alternatifUniteler.map(adet => (
                                            <option key={adet} value={adet}>{adet}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-4">
                                    <div className="text-white-50 mb-1" style={{ fontSize: "9px", paddingLeft: "2px" }}>Sıra:</div>
                                    <select
                                        value={kademe.siraSayisi}
                                        onChange={(e) => handleSiraChange(kademe.realIndex, e.target.value)}
                                        className="form-select form-select-sm bg-dark text-white border-0"
                                        style={{ fontSize: "11px", fontWeight: "bold", color: "#60a5fa", paddingLeft: "6px", height: "26px" }}
                                    >
                                        <option value={1}>1</option>
                                        <option value={2}>2</option>
                                        <option value={3}>3</option>
                                    </select>
                                </div>

                                <div className="col-4">
                                    <div className="text-white-50 mb-1 text-center" style={{ fontSize: "9px" }}>Disk:</div>
                                    <div className="bg-dark rounded text-center" style={{ height: "26px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <span style={{ fontSize: "11px", fontWeight: "bold", color: "#00a86b" }}>
                                            {kademe.milBasinaDisk}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* SÜRÜKLENEBİLİR SIRALAR ŞEMASI */}
            <div className="p-1 my-2 rounded bg-dark" style={{ border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "row", alignItems: "stretch", justifyContent: "space-around", gap: "8px", overflowX: "auto", width: "100%" }}>
                {tumSiralar.map((sira, idx) => (
                    <React.Fragment key={idx}>
                        <div
                            className="d-flex flex-column align-items-center gap-1 p-1 rounded"
                            onDragOver={!sira.isLamella ? handleDragOver : undefined}
                            onDrop={!sira.isLamella ? (e) => handleDrop(e, sira.isLamella, sira.parentKademeIndex, sira.siraTipi) : undefined}
                            style={{
                                flex: "1 1 0px",
                                maxWidth: "140px",
                                border: sira.isLamella ? "1px solid rgba(20, 184, 166, 0.3)" : "1px dashed rgba(255,255,255,0.05)",
                                backgroundColor: sira.isLamella ? "rgba(15, 118, 110, 0.1)" : "transparent"
                            }}
                        >
                            <div className="text-white-50 text-center w-100" style={{ fontSize: "11px" }}>
                                {sira.isLamella ? "Çökeltim Ünitesi" : `${sira.genelSiraNo}. Sıra`}
                            </div>

                            <div className="fw-bold text-center w-100" style={{ fontSize: "11px", color: sira.textColor, minHeight: "44px" }}>
                                {sira.isLamella ? `${sira.adet} x ${sira.model}` : `${sira.adet} P`}
                                <div style={{ opacity: 0.6, fontWeight: "normal", fontSize: "10px" }}>
                                    ({sira.kademeNo === "Çökeltim" ? sira.kademeNo : `${sira.kademeNo}. Kademe`})
                                </div>
                                {!sira.isLamella && (
                                    <div style={{ color: "#e2e8f0", fontSize: "9px", marginTop: "2px", fontWeight: "normal" }}>
                                        t: {sira.beklemeSuresi} sa
                                    </div>
                                )}
                            </div>

                            <div className="d-flex flex-column gap-3 align-items-center justify-content-start w-100 p-1 rounded" style={{ minHeight: "60px", backgroundColor: "rgba(255,255,255,0.02)" }}>
                                {Array.from({ length: sira.adet }).map((_, i) => (
                                    sira.isLamella ? (
                                        <div key={`lamella-visual-${i}`} className="d-flex flex-column align-items-center justify-content-center" style={{ width: "100%", maxWidth: "45px", marginTop: "2.5px" }}>
                                            <div className="d-flex flex-column align-items-center justify-content-center" style={{ width: "45px", marginTop: "2.5px", filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.5))" }}>
                                                <div style={{ width: "40px", height: "14px", background: "linear-gradient(90deg, #0d9488 0%, #14b8a6 25%, #0f766e 75%, #115e59 100%)", borderTopLeftRadius: "2px", borderTopRightRadius: "2px", position: "relative", boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2)", overflow: "hidden", borderBottom: "0.5px solid rgba(0,0,0,0.2)" }}>
                                                    <div style={{ position: "absolute", inset: "2px 4px", backgroundImage: "repeating-linear-gradient(120deg, transparent, transparent 1px, rgba(255,255,255,0.3) 1px, rgba(255,255,255,0.3) 2.5px)", opacity: 0.8 }} />
                                                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", backgroundColor: "#2dd4bf", opacity: 0.6 }} />
                                                </div>
                                                <div style={{ width: "0", height: "0", borderLeft: "20px solid transparent", borderRight: "20px solid transparent", borderTop: "11px solid #0f766e", position: "relative" }}>
                                                    <div style={{ position: "absolute", top: 0, left: "-2px", width: "4px", height: "2px", backgroundColor: "#115e59", borderBottomLeftRadius: "0.5px", borderBottomRightRadius: "0.5px" }} />
                                                </div>
                                            </div>
                                            <span style={{ fontSize: "9px", color: "#2dd4bf", fontWeight: "bold", marginTop: "4px", whiteSpace: "nowrap" }}>
                                                Lamella-{i + 1}
                                            </span>
                                        </div>
                                    ) : (
                                        <div
                                            key={i}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, sira.parentKademeIndex, sira.siraTipi)}
                                            className="d-flex flex-column align-items-center justify-content-center"
                                            style={{ width: "100%", maxWidth: "45px", cursor: "grab", userSelect: "none" }}
                                        >
                                            <div style={{ width: "42.5px", filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.5))", position: "relative" }}>
                                                <div style={{ height: "13px", background: "linear-gradient(90deg, #ff7324 0%, #ea580c 30%, #c2410c 85%, #9a3412 100%)", borderTopLeftRadius: "21px 13px", borderTopRightRadius: "21px 13px", boxShadow: "inset 0 1px 1.5px rgba(255,255,255,0.3)", position: "relative" }}>
                                                    <div style={{ position: "absolute", right: "7.5px", top: "4px", width: "5px", height: "5px", borderRadius: "50%", background: "radial-gradient(circle, #4b5563 0%, #1f2937 80%)", border: "0.5px solid rgba(255,255,255,0.15)", boxShadow: "0 0.5px 1px rgba(0,0,0,0.4)" }} />
                                                </div>
                                                <div style={{ height: "1px", backgroundColor: "#334155", width: "100%" }} />
                                                <div style={{ height: "22px", background: "linear-gradient(90deg, #22c55e 0%, #16a34a 25%, #15803d 75%, #166534 100%)", borderBottomLeftRadius: "3px", borderBottomRightRadius: "3px", boxShadow: "inset 0 -1.5px 2.5px rgba(0,0,0,0.3)", fontFamily: "monospace", lineHeight: "1.1", padding: "2px 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                                    <span style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "0.5px", textShadow: "1px 1px 2px rgba(0,0,0,0.6)" }}>
                                                        {sira.milBasinaDisk}
                                                    </span>
                                                    <span style={{ fontSize: "8px", opacity: 0.8, fontWeight: "normal", textShadow: "1px 1px 1px rgba(0,0,0,0.5)" }}>
                                                        DİSK
                                                    </span>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: "9px", color: "#a3e635", fontWeight: "500", marginTop: "4px", whiteSpace: "nowrap" }}>
                                                RBC-{i + 1}
                                            </span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                        {idx < tumSiralar.length - 1 && (
                            <div className="d-flex align-items-center justify-content-center text-white-50" style={{ fontSize: "14px", paddingTop: "55px", userSelect: "none", flexShrink: 0 }}>
                                ➔
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* MODAL GÖSTERİMİ */}
            {isModalOpen && (
                <GiderimDetail
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    kademeData={selectedKademeData}
                    genelVeri={diskDetails}
                />
            )}
        </div>
    );
}

export default YerlesimDetail;