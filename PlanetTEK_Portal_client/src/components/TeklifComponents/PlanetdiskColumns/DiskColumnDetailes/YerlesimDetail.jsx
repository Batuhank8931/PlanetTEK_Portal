import React, { useState, useMemo } from "react";

function YerlesimDetail({ data, finalMetrekare }) {
    // Disk çapı ve ünite hacmi belirleme
    const diskcapi = data.secilenDiskTipi === "MX" ? 2.05 : 1.35;
    const hacim = data.secilenDiskTipi === "MX" ? 4.5 : 2.00; // m³ cinsinden ünite hacmi

    // Tek bir diskin çift yüzey alanı hesabı: 2 * (pi * r^2)
    const tekDiskAlani = 2 * (Math.PI * Math.pow(diskcapi, 2) / 4);

    // Her kademe için kullanıcının seçtiği ünite adetlerini tutan state
    const [secilenUniteler, setSecilenUniteler] = useState({});

    // Kademelerin hesaplamalarını useMemo ile yapıyoruz
    const kademeHesaplari = useMemo(() => {
        if (!finalMetrekare || finalMetrekare.length === 0) return [];

        return finalMetrekare.map((gerekliAlan, index) => {
            const toplamGerekliDisk = Math.ceil(gerekliAlan / tekDiskAlani);

            const minUniteSayisi = Math.ceil(toplamGerekliDisk / (data.maxDiskAdedi || 135));
            const maxUniteSayisi = Math.ceil(toplamGerekliDisk / (data.minDiskAdedi || 100));

            const alternatifUniteler = [];
            for (let i = minUniteSayisi; i <= maxUniteSayisi; i++) {
                alternatifUniteler.push(i);
            }

            const mevcutSecim = secilenUniteler[index] || alternatifUniteler[0] || minUniteSayisi;
            const milBasinaDisk = Math.ceil(toplamGerekliDisk / mevcutSecim);

            const sira1Paralel = Math.ceil(mevcutSecim / 2);
            const sira2Paralel = mevcutSecim - sira1Paralel;

            return {
                index: index + 1,
                realIndex: index,
                gerekliAlan,
                toplamGerekliDisk,
                alternatifUniteler,
                mevcutSecim,
                milBasinaDisk,
                sira1Paralel,
                sira2Paralel
            };
        });
    }, [finalMetrekare, tekDiskAlani, data.minDiskAdedi, data.maxDiskAdedi, secilenUniteler]);

    const handleUniteChange = (kademeIndex, adet) => {
        setSecilenUniteler(prev => ({
            ...prev,
            [kademeIndex]: parseInt(adet, 10)
        }));
    };

    // Tüm kademelerin sıralarını tek bir düz listede topluyoruz
    const tumSiralar = useMemo(() => {
        const siralar = [];
        let genelSiraNo = 1;

        kademeHesaplari.forEach((kademe) => {
            // 1. Sıra her halükarda var
            // Bekleme süresi hesabı: (Hacim * Paralel Adet) / Toplam Debi
            const HRT_Sira1 = data.debi ? (((hacim * kademe.sira1Paralel) / data.debi) * 24).toFixed(2) : 0;
            

            siralar.push({
                genelSiraNo: genelSiraNo++,
                kademeNo: kademe.index,
                siraTipi: 1,
                adet: kademe.sira1Paralel,
                milBasinaDisk: kademe.milBasinaDisk,
                beklemeSuresi: HRT_Sira1, // Yeni eklenen alan
                color: "#005c35",
                borderColor: "#00874e",
                textColor: "#00874e"
            });

            // 2. Sıra eğer varsa listeye ekleniyor
            if (kademe.sira2Paralel > 0) {
                const HRT_Sira2  = data.debi ? (((hacim * kademe.sira1Paralel) / data.debi) * 24).toFixed(2) : 0;

                siralar.push({
                    genelSiraNo: genelSiraNo++,
                    kademeNo: kademe.index,
                    siraTipi: 2,
                    adet: kademe.sira2Paralel,
                    milBasinaDisk: kademe.milBasinaDisk,
                    beklemeSuresi: HRT_Sira2, // Yeni eklenen alan
                    color: "#1e40af",
                    borderColor: "#3b82f6",
                    textColor: "#3b82f6"
                });
            }
        });

        return siralar;
    }, [kademeHesaplari, hacim, data.debi]);

    return (
        <div className="p-1 rounded" style={{ backgroundColor: "#1e293b", display: "flex", flexDirection: "column" }}>

            {/* 1. ÜST KISIM: BÜTÜN DROPDOWNLAR YAN YANA */}
            <div className="row g-1">
                {kademeHesaplari.map((kademe) => (
                    <div key={`dropdown-${kademe.index}`} className="col-12 col-md-6">
                        <div className="p-1 rounded bg-dark bg-opacity-50" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                                <span className="fw-bold text-white" style={{ fontSize: "8px" }}>
                                    {kademe.index}. Kademe
                                </span>
                                <span className="text-white-50" style={{ fontSize: "10px" }}>
                                    <strong>{kademe.gerekliAlan.toFixed(2)} m²</strong> / {kademe.toplamGerekliDisk} Disk
                                </span>
                            </div>

                            <div className="row g-1 align-items-end">
                                <div className="col-6">
                                    <label className="text-white-50 mb-1 d-block text-truncate" style={{ fontSize: "11px" }}>
                                        Ünite Adedi
                                    </label>
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

            {/* 2. ALT KISIM: BÜTÜN SIRALAR KESİNTİSİZ SOLDAN SAĞA YAN YANA */}
            <div
                className="p-1 my-2 rounded bg-dark"
                style={{
                    border: "1px solid rgba(255,255,255,0.05)",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "stretch",
                    gap: "8px",
                    overflowX: "auto"
                }}
            >
                {tumSiralar.map((sira, idx) => (
                    <React.Fragment key={idx}>
                        <div
                            className="d-flex flex-column align-items-center gap-1"
                            style={{ width: "70px" }} // Bekleme süresi yazısı sığsın diye genişliği 65px'den 70px'e çıkardık
                        >
                            {/* Üst Başlık */}
                            <div className="text-white-50 text-center w-100" style={{ fontSize: "11px" }}>
                                {sira.genelSiraNo}. Sıra
                            </div>

                            {/* Bilgi Kısmı + Bekleme Süresi */}
                            <div className="fw-bold text-center w-100" style={{ fontSize: "11px", color: sira.textColor, minHeight: "44px" }}>
                                {sira.adet} P
                                <div style={{ opacity: 0.6, fontWeight: "normal", fontSize: "10px" }}>
                                    ({sira.kademeNo}. Kademe)
                                </div>
                                {/* Bekleme Süresi Gösterimi */}
                                <div style={{ color: "#e2e8f0", fontSize: "9px", marginTop: "2px", fontWeight: "normal" }}>
                                    t: {sira.beklemeSuresi} sa
                                </div>
                            </div>

                            {/* RBC Kutuları */}
                            <div className="d-flex flex-column gap-1 align-items-center justify-content-start w-100">
                                {Array.from({ length: sira.adet }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="rounded text-center fw-bold text-white d-flex align-items-center justify-content-center"
                                        style={{
                                            backgroundColor: sira.color,
                                            fontSize: "9px",
                                            width: "60px",
                                            height: "20px",
                                            border: `1px solid ${sira.borderColor}`
                                        }}
                                        title={`${sira.milBasinaDisk} Disk - Bekleme: ${sira.beklemeSuresi} saat`} // Title güncellendi
                                    >
                                        RBC-{sira.milBasinaDisk}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sıralar Arasına Ok Ekleme */}
                        {idx < tumSiralar.length - 1 && (
                            <div
                                className="d-flex align-items-center justify-content-center text-white-50"
                                style={{
                                    fontSize: "14px",
                                    paddingTop: "55px", // Bilgi kısmının yüksekliği arttığı için ok hizasını biraz aşağı çektik
                                    userSelect: "none"
                                }}
                            >
                                ➔
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

        </div>
    );
}

export default YerlesimDetail;