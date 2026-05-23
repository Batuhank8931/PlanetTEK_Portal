import React, { useState, useMemo, useEffect } from "react";
import GiderimDetail from "./GiderimDetail";

function YerlesimDetail({ data, finalMetrekare, updatedata }) {
    const diskcapi = data.secilenDiskTipi === "MX" ? 2.05 : 1.35;
    const hacim = data.secilenDiskTipi === "MX" ? 4.5 : 2.00;
    const tekDiskAlani = 2 * (Math.PI * Math.pow(diskcapi, 2) / 4);

    const [secilenUniteler, setSecilenUniteler] = useState({});
    const [yerlesimDuzenleri, setYerlesimDuzenleri] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedKademeData, setSelectedKademeData] = useState(null);

    // Kademelerin temel hesapları (Disk Kademeleri)
    const kademeHesaplari = useMemo(() => {
        if (!finalMetrekare || finalMetrekare.length === 0) return [];

        return finalMetrekare.map((kademeObj, index) => {
            const alanSayi = Number(kademeObj.alan) || 0;
            const toplamGerekliDisk = Math.ceil(alanSayi / tekDiskAlani);

            const minUniteSayisi = Math.ceil(toplamGerekliDisk / (data.maxDiskAdedi || 135));
            const maxUniteSayisi = Math.ceil(toplamGerekliDisk / (data.minDiskAdedi || 100));

            const alternatifUniteler = [];
            for (let i = minUniteSayisi; i <= maxUniteSayisi; i++) {
                alternatifUniteler.push(i);
            }

            const mevcutSecim = secilenUniteler[index] || alternatifUniteler[0] || minUniteSayisi;
            const milBasinaDisk = Math.ceil(toplamGerekliDisk / mevcutSecim);

            const ozelDuzen = yerlesimDuzenleri[index];
            const sira1Paralel = ozelDuzen ? ozelDuzen.sira1 : Math.ceil(mevcutSecim / 2);
            const sira2Paralel = ozelDuzen ? ozelDuzen.sira2 : mevcutSecim - sira1Paralel;

            return {
                index: index + 1,
                realIndex: index,
                gerekliAlan: alanSayi,
                rawKademeVerisi: kademeObj,
                toplamGerekliDisk,
                alternatifUniteler,
                mevcutSecim,
                milBasinaDisk,
                sira1Paralel,
                sira2Paralel
            };
        });
    }, [finalMetrekare, tekDiskAlani, data.minDiskAdedi, data.maxDiskAdedi, secilenUniteler, yerlesimDuzenleri]);

    const handleUniteChange = (kademeIndex, adet) => {
        const yeniAdet = parseInt(adet, 10);
        setSecilenUniteler(prev => ({ ...prev, [kademeIndex]: yeniAdet }));

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

    // Tüm sıraları düz liste yapma mantığı
    const tumSiralar = useMemo(() => {
        const siralar = [];
        let genelSiraNo = 1;

        kademeHesaplari.forEach((kademe) => {
            const HRT_Sira1 = data.debi ? (((hacim * kademe.sira1Paralel) / data.debi) * 24).toFixed(2) : 0;

            siralar.push({
                isLamella: false,
                genelSiraNo: genelSiraNo++,
                kademeNo: kademe.index,
                kademeRealIndex: kademe.realIndex,
                siraTipi: 1,
                adet: kademe.sira1Paralel,
                milBasinaDisk: kademe.milBasinaDisk,
                beklemeSuresi: HRT_Sira1,
                color: "#15803d", // Gerçek makinedeki yeşil tonuna yaklaştırıldı
                borderColor: "#16a34a",
                textColor: "#4ade80"
            });

            const HRT_Sira2 = data.debi ? (((hacim * kademe.sira2Paralel) / data.debi) * 24).toFixed(2) : 0;
            siralar.push({
                isLamella: false,
                genelSiraNo: genelSiraNo++,
                kademeNo: kademe.index,
                kademeRealIndex: kademe.realIndex,
                siraTipi: 2,
                adet: kademe.sira2Paralel,
                milBasinaDisk: kademe.milBasinaDisk,
                beklemeSuresi: HRT_Sira2,
                color: "#15803d",
                borderColor: "#16a34a",
                textColor: "#4ade80"
            });
        });

        if (data && data.lamellaAdet && Number(data.lamellaAdet) > 0) {
            siralar.push({
                isLamella: true,
                genelSiraNo: genelSiraNo++,
                kademeNo: "Çökeltim",
                adet: Number(data.lamellaAdet),
                model: data.secilenLamellaModeli || "Bilinmiyor",
                alan: data.gerekliLamellaAlani || 0,
                hacim: data.gerekliLamellaHacmi || 0,
                color: "#0f766e",
                borderColor: "#14b8a6",
                textColor: "#2dd4bf"
            });
        }

        return siralar;
    }, [kademeHesaplari, hacim, data]);

    // --- HTML5 DRAG AND DROP FONKSİYONLARI ---
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

        // Farklı kademeler arasında taşımayı engelle
        if (kaynakKademeIndex !== hedefKademeIndex) return;
        // Aynı sıranın içine bırakıldıysa işlem yapma
        if (kaynakSiraTipi === hedefSiraTipi) return;

        const ilgiliKademe = kademeHesaplari.find(k => k.realIndex === hedefKademeIndex);
        if (!ilgiliKademe) return;

        let yeniSira1 = ilgiliKademe.sira1Paralel;
        let yeniSira2 = ilgiliKademe.sira2Paralel;

        // 1. Sıradan 2. Sıraya taşıma
        if (kaynakSiraTipi === 1 && hedefSiraTipi === 2) {
            if (yeniSira1 > 0) {
                yeniSira1 -= 1;
                yeniSira2 += 1;
            }
        }
        // 2. Sıradan 1. Sıraya taşıma (Hatalı kısım burasıydı, düzeltildi)
        else if (kaynakSiraTipi === 2 && hedefSiraTipi === 1) {
            if (yeniSira2 > 0) {
                yeniSira2 -= 1;
                yeniSira1 += 1;
            }
        }

        setYerlesimDuzenleri(prev => ({
            ...prev,
            [hedefKademeIndex]: {
                sira1: yeniSira1,
                sira2: yeniSira2
            }
        }));
    };

    return (
        <div className="p-1 rounded" style={{ backgroundColor: "#1e293b", display: "flex", flexDirection: "column" }}>

            {/* 1. ÜST KISIM DROPDOWNLAR VE LAMELLA BİLGİ KARTI */}
            <div className="row g-1">
                {kademeHesaplari.map((kademe) => (
                    <div key={`dropdown-${kademe.index}`} className="col-12 col-md-4">
                        <div className="p-1 rounded bg-dark bg-opacity-50" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                                <span className="fw-bold text-white" style={{ fontSize: "11px" }}>
                                    {kademe.index}. Kademe (Biyolojik)
                                </span>
                                <span className="text-white-50" style={{ fontSize: "11px" }}>
                                    <strong>{kademe.gerekliAlan.toFixed(2)} m²</strong> / {kademe.toplamGerekliDisk} Disk
                                </span>
                                <button
                                    onClick={() => openDetailModal(kademe.rawKademeVerisi, kademe.index)}
                                    className="btn btn-sm p-0 px-1"
                                    style={{ backgroundColor: "#334155", color: "#94a3b8", fontSize: "10px", border: "1px solid #475569" }}
                                    title="Kademe Hesaplama Detayı"
                                >
                                    ℹ️
                                </button>
                            </div>

                            <div className="row g-1 align-items-end">
                                <div className="col-6">
                                    <select
                                        value={kademe.mevcutSecim}
                                        onChange={(e) => handleUniteChange(kademe.realIndex, e.target.value)}
                                        className="form-select form-select-sm bg-dark text-white border-0"
                                        style={{ fontSize: "12px" }}
                                    >
                                        {kademe.alternatifUniteler.map(adet => (
                                            <option key={adet} value={adet}>{adet} Ünite</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-6">
                                    {/* İSTEDİĞİNİZ REVİZE ALAN (Burası güncellendi) */}
                                    <div className="bg-dark p-2 rounded text-center" style={{ height: "31px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <span className="text-white-50" style={{ fontSize: "11px" }}>
                                            <strong style={{ color: "#00a86b" }}>{kademe.milBasinaDisk} Disk</strong>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

            </div>

            {/* 2. SÜRÜKLENEBİLİR VE BIRAKILABİLİR ALT SIRALAR */}
            <div
                className="p-1 my-2 rounded bg-dark"
                style={{
                    border: "1px solid rgba(255,255,255,0.05)",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "stretch",
                    justifyContent: "space-around",
                    gap: "8px",
                    overflowX: "auto",
                    width: "100%"
                }}
            >
                {tumSiralar.map((sira, idx) => (
                    <React.Fragment key={idx}>
                        <div
                            className="d-flex flex-column align-items-center gap-1 p-1 rounded"
                            onDragOver={!sira.isLamella ? handleDragOver : undefined}
                            onDrop={!sira.isLamella ? (e) => handleDrop(e, sira.isLamella, sira.kademeRealIndex, sira.siraTipi) : undefined}
                            style={{
                                flex: "1 1 0px",
                                maxWidth: "140px",
                                transition: "background-color 0.2s",
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

                            {/* İçerideki Makine/Kapsül Elemanlarının Listelendiği Alan */}
                            <div
                                className="d-flex flex-column gap-3 align-items-center justify-content-start w-100 p-1 rounded"
                                style={{ minHeight: "60px", backgroundColor: "rgba(255,255,255,0.02)" }}
                            >
                                {Array.from({ length: sira.adet }).map((_, i) => (
                                    sira.isLamella ? (
                                        /* LAMELLA İÇİN YEŞİL ÜÇGENİMSİ TASARIM (GÖRSEL %50 KÜÇÜK - FONT ORİJİNAL) */
                                        <div
                                            key={`lamella-visual-${i}`}
                                            className="d-flex flex-column align-items-center justify-content-center"
                                            style={{ width: "100%", maxWidth: "45px", marginTop: "2.5px" }}
                                            title={`Model: ${sira.model} Lamella Çökeltici`}
                                        >
                                            {/* LAMELLA İÇİN ENDÜSTRİYEL HAVUZ VE KONİK ÇÖKELTİCİ TASARIMI */}
                                            <div
                                                className="d-flex flex-column align-items-center justify-content-center"
                                                style={{
                                                    width: "45px",
                                                    marginTop: "2.5px",
                                                    filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.5))"
                                                }}
                                                title={`Model: ${sira.model} Lamella Çökeltici`}
                                            >
                                                {/* Üst Havuz Gövdesi ve İçindeki Plakalar */}
                                                <div style={{
                                                    width: "40px",
                                                    height: "14px",
                                                    background: "linear-gradient(90deg, #0d9488 0%, #14b8a6 25%, #0f766e 75%, #115e59 100%)",
                                                    borderTopLeftRadius: "2px",
                                                    borderTopRightRadius: "2px",
                                                    position: "relative",
                                                    boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2)",
                                                    overflow: "hidden",
                                                    borderBottom: "0.5px solid rgba(0,0,0,0.2)"
                                                }}>
                                                    {/* İçerideki Gerçekçi Lamella Plakaları */}
                                                    <div style={{
                                                        position: "absolute",
                                                        inset: "2px 4px",
                                                        backgroundImage: "repeating-linear-gradient(120deg, transparent, transparent 1px, rgba(255,255,255,0.3) 1px, rgba(255,255,255,0.3) 2.5px)",
                                                        opacity: 0.8
                                                    }} />

                                                    {/* Su Seviyesi Çizgisi */}
                                                    <div style={{
                                                        position: "absolute",
                                                        top: 0, left: 0, right: 0,
                                                        height: "1px",
                                                        backgroundColor: "#2dd4bf",
                                                        opacity: 0.6
                                                    }} />
                                                </div>

                                                {/* Alt Kısım: Çamur Toplama Konisi */}
                                                <div style={{
                                                    width: "0",
                                                    height: "0",
                                                    borderLeft: "20px solid transparent",
                                                    borderRight: "20px solid transparent",
                                                    borderTop: "11px solid #0f766e",
                                                    position: "relative"
                                                }}>
                                                    {/* Koninin dip toplama noktası */}
                                                    <div style={{
                                                        position: "absolute",
                                                        top: 0,
                                                        left: "-2px",
                                                        width: "4px",
                                                        height: "2px",
                                                        backgroundColor: "#115e59",
                                                        borderBottomLeftRadius: "0.5px",
                                                        borderBottomRightRadius: "0.5px"
                                                    }} />
                                                </div>

                                            </div>
                                            {/* Dış etiket orijinal boyutuna getirildi */}
                                            <span style={{ fontSize: "9px", color: "#2dd4bf", fontWeight: "bold", marginTop: "4px", whiteSpace: "nowrap" }}>
                                                Lamella-{i + 1}
                                            </span>
                                        </div>
                                    ) : (
                                        /* RBC REAKTÖR MAKİNESİ TASARIMI (GÖRSEL %50 KÜÇÜK - FONT ORİJİNAL) */
                                        <div
                                            key={i}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, sira.kademeRealIndex, sira.siraTipi)}
                                            className="d-flex flex-column align-items-center justify-content-center"
                                            style={{ width: "100%", maxWidth: "45px", cursor: "grab", userSelect: "none" }}
                                            title={`${sira.milBasinaDisk} Disk - Sürükleyip sırasını değiştirebilirsiniz.`}
                                        >
                                            {/* Kombine Kapsül Tasarımı - Endüstriyel SCADA Tarzı */}
                                            <div
                                                style={{
                                                    width: "42.5px",
                                                    filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.5))",
                                                    position: "relative"
                                                }}
                                            >
                                                {/* Üst Kısım: Turuncu, Bombeli ve Hacimli Kapak */}
                                                <div style={{
                                                    height: "13px",
                                                    background: "linear-gradient(90deg, #ff7324 0%, #ea580c 30%, #c2410c 85%, #9a3412 100%)",
                                                    borderTopLeftRadius: "21px 13px",
                                                    borderTopRightRadius: "21px 13px",
                                                    boxShadow: "inset 0 1px 1.5px rgba(255,255,255,0.3)",
                                                    position: "relative"
                                                }}>
                                                    {/* Makine Yan Menhol Kapağı Detayı */}
                                                    <div style={{
                                                        position: "absolute",
                                                        right: "7.5px",
                                                        top: "4px",
                                                        width: "5px",
                                                        height: "5px",
                                                        borderRadius: "50%",
                                                        background: "radial-gradient(circle, #4b5563 0%, #1f2937 80%)",
                                                        border: "0.5px solid rgba(255,255,255,0.15)",
                                                        boxShadow: "0 0.5px 1px rgba(0,0,0,0.4)"
                                                    }} />
                                                </div>

                                                {/* Orta Ayrım: Siyah Çelik Şase Çizgisi */}
                                                <div style={{ height: "1px", backgroundColor: "#334155", width: "100%" }} />

                                                {/* Alt Kısım: Derinlikli Yeşil Gövde */}
                                                <div
                                                    className="d-flex flex-column align-items-center justify-content-center text-white"
                                                    style={{
                                                        height: "22px", // İçerideki orijinal fontların sığması için dikeyde hafif pay bırakıldı
                                                        background: "linear-gradient(90deg, #22c55e 0%, #16a34a 25%, #15803d 75%, #166534 100%)",
                                                        borderBottomLeftRadius: "3px",
                                                        borderBottomRightRadius: "3px",
                                                        boxShadow: "inset 0 -1.5px 2.5px rgba(0,0,0,0.3)",
                                                        fontFamily: "monospace",
                                                        lineHeight: "1.1",
                                                        padding: "2px 0"
                                                    }}
                                                >
                                                    {/* Sayı ve DİSK yazısı orijinal font boyutlarına döndü */}
                                                    <span style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "0.5px", textShadow: "1px 1px 2px rgba(0,0,0,0.6)" }}>
                                                        {sira.milBasinaDisk}
                                                    </span>
                                                    <span style={{ fontSize: "8px", opacity: 0.8, fontWeight: "normal", textShadow: "1px 1px 1px rgba(0,0,0,0.5)" }}>
                                                        DİSK
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Dış etiket orijinal boyutuna getirildi */}
                                            <span style={{ fontSize: "9px", color: "#a3e635", fontWeight: "500", marginTop: "4px", whiteSpace: "nowrap" }}>
                                                RBC-{i + 1}
                                            </span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                        {idx < tumSiralar.length - 1 && (
                            <div
                                className="d-flex align-items-center justify-content-center text-white-50"
                                style={{ fontSize: "14px", paddingTop: "55px", userSelect: "none", flexShrink: 0 }}
                            >
                                ➔
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* 3. MODAL BİLEŞENİ */}
            {isModalOpen && (
                <GiderimDetail
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    kademeData={selectedKademeData}
                    genelVeri={data}
                />
            )}

        </div>
    );
}

export default YerlesimDetail;