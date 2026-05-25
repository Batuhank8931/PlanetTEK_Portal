import React, { useMemo, useEffect } from "react";

function IleriAritmaDozajSelections({ data = {}, updateData }) {

    // İlgili alt kırılımdaki veriye hızlı erişim için kısayol ve mevcut state referansı
    const currentDozajSelections = data?.ileriAritma?.IleriAritmaDozajSelections || {};

    // Hesaplamaları optimize ve güvenli şekilde useMemo içinde yapıyoruz
    const hesaplananDegerler = useMemo(() => {
        const Q = parseFloat(data.debi) || 0; // m3/gün cinsinden debi
        const inputSelections = data?.ileriAritma?.IleriAritmaInputSelections || {};

        const girisP = parseFloat(inputSelections.girisToplamFosfor) || 0; // mg/L
        const cikisP = parseFloat(inputSelections.cikisToplamFosfor) || 0; // mg/L
        const katsayi = parseFloat(inputSelections.gerekliFeKatsayisi) || 2.7;
        
        const stokGunu = parseFloat(data.stokGunu) || 30; // Varsayılan stoklama süresi (gün)

        // Giderilecek Fosfor yükü kontrolü
        const giderilecekP = Math.max(0, girisP - cikisP);

        // 1. Gerekli Fe Miktarı (kg/gün) = (Q * ΔP * katsayi) / 1000
        const gerekliFe = (Q * giderilecekP * katsayi) / 1000;

        // 2. Gerekli FeCl3 Miktarı (kg/gün)
        const gerekliFeCl3 = gerekliFe * (60 / 26);

        // 3. %40'lık FeCl3 Çözelti Miktarı (Litre/gün)
        const cozeltiLitreGun = gerekliFeCl3 / 1.43 / (40 / 100);

        // 4. Pompa Saatlik Debisi (L/saat)
        const pompaSaatlikDebi = cozeltiLitreGun / 24;

        // 5. Pompa Adedi Hesabı (Standart pompa: 5 L/saat)
        const standartPompaKapasitesi = 5;
        const pompaAdedi = pompaSaatlikDebi > 0 ? Math.ceil(pompaSaatlikDebi / standartPompaKapasitesi) : 1;

        // 6. Gerekli Tank Hacmi (Litre)
        const tankHacmiLitre = cozeltiLitreGun * stokGunu;

        return {
            gerekliFe,
            gerekliFeCl3,
            cozeltiLitreGun,
            pompaSaatlikDebi,
            pompaAdedi,
            tankHacmiLitre,
        };
    }, [data]);

    // Hesaplanan değerleri yeni veri mimarisine göre üst bileşene gönderen tetikleyici
    useEffect(() => {
        if (updateData) {
            // Sonsuz render döngüsünü engellemek için sadece kritik bir değerin değişip değişmediğini kontrol ediyoruz
            if (currentDozajSelections.cozeltiLitreGun !== hesaplananDegerler.cozeltiLitreGun) {
                updateData({
                    ...data, // Ana yapıyı koru
                    ileriAritma: {
                        ...data?.ileriAritma, // Diğer arıtma modüllerini koru (Input ve Pump selections gibi)
                        IleriAritmaDozajSelections: {
                            ...hesaplananDegerler // Hesaplanan tüm çıktıları bu kırılıma yaz
                        }
                    }
                });
            }
        }
    }, [hesaplananDegerler, updateData, data, currentDozajSelections]);

    return (
        <div className="card-body d-flex flex-column gap-3" style={{ position: "relative", color: "#fff" }}>

            {/* BAŞLIK BÖLÜMÜ */}
            <div className="d-flex align-items-center flex-grow-1">
                <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
                    3. Dozaj Sistemi
                </span>
                <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
            </div>

            {/* SONUÇ KARTLARI PANELİ */}
            <div className="row g-2">

                {/* Sol Kolon: Kütlesel ve Hacimsel Gereksinimler */}
                <div className="col-md-6 d-flex flex-column gap-2">

                    <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
                        <span className="text-white-50" style={{ fontSize: "10px" }}>Gerekli Saf Fe Miktarı:</span>
                        <span className="fw-bold text-white" style={{ fontSize: "11px" }}>
                            {hesaplananDegerler.gerekliFe.toFixed(2)} <span className="text-white-50" style={{ fontSize: "9px" }}>kg/gün</span>
                        </span>
                    </div>

                    <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
                        <span className="text-white-50" style={{ fontSize: "10px" }}>Gerekli Saf FeCl₃ Miktarı:</span>
                        <span className="fw-bold text-white" style={{ fontSize: "11px" }}>
                            {hesaplananDegerler.gerekliFeCl3.toFixed(2)} <span className="text-white-50" style={{ fontSize: "9px" }}>kg/gün</span>
                        </span>
                    </div>

                    <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #00874e" }}>
                        <span className="text-white-50" style={{ fontSize: "10px" }}>%40 Çözelti İhtiyacı:</span>
                        <span className="fw-bold text-success" style={{ fontSize: "11px" }}>
                            {hesaplananDegerler.cozeltiLitreGun.toFixed(1)} <span style={{ fontSize: "9px" }}>L/gün</span>
                        </span>
                    </div>

                </div>

                {/* Sağ Kolon: Pompa ve Tank Boyutlandırma */}
                <div className="col-md-6 d-flex flex-column gap-2">

                    {/* Pompa Saatlik Debisi */}
                    <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
                        <span className="text-white-50" style={{ fontSize: "10px" }}>Pompa Saatlik Debisi:</span>
                        <span className="fw-bold text-white" style={{ fontSize: "11px" }}>
                            {hesaplananDegerler.pompaSaatlikDebi.toFixed(2)} <span className="text-white-50" style={{ fontSize: "9px" }}>L/saat</span>
                        </span>
                    </div>

                    {/* DİNAMİK POMPA ADEDİ KUTUSU (Kritik Ekipman Vurgusu) */}
                    <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #ef4444" }}>
                        <span className="text-white-50" style={{ fontSize: "10px" }}>Gerekli Pompa Adedi (5 L/h @ 5 Bar):</span>
                        <span className="fw-bold text-danger" style={{ fontSize: "11px" }}>
                            {hesaplananDegerler.pompaAdedi} <span style={{ fontSize: "9px" }}>Adet</span>
                        </span>
                    </div>

                    {/* Tank Hacmi Kutusu (Mavi/Cyan Vurgu) */}
                    <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #38bdf8" }}>
                        <span className="text-white-50" style={{ fontSize: "10px" }}>Gerekli Tank Hacmi ({data.stokGunu || 30} Gün):</span>
                        <span className="fw-bold text-info" style={{ fontSize: "11px" }}>
                            {hesaplananDegerler.tankHacmiLitre.toFixed(0)} <span style={{ fontSize: "9px" }}>Litre</span>
                        </span>
                    </div>

                </div>
            </div>

        </div>
    );
}

export default IleriAritmaDozajSelections;