import React from "react";

function GiderimDetail({ isOpen, onClose, kademeData, genelVeri }) {

    if (!isOpen || !kademeData) return null;

    // Nitrifikasyon kontrolü (Daha önce eklediğimiz isNitrifikasyon flag'i)
    const isNitrifikasyon = !!kademeData.isNitrifikasyon || kademeData.kademeNo === "Nitrifikasyon";

    // Ortak Parametreler
    const Q = Number(genelVeri?.debi) || 0;
    const alan = Number(kademeData.alan) || 0;
    const emperik = Number(kademeData.emperik) || 1; // 0'a bölme hatasını engellemek için default 1

    // 1. DURUM: NİTRİFİKASYON HESAPLARI
    const girisAmonyum = Number(genelVeri?.tasarim?.aritmaParametreleri?.girisAmonyum) || 0;
    const cikisAmonyum = Number(genelVeri?.tasarim?.aritmaParametreleri?.cikisAmonyum) || 0;
    const amonyumYuk = ((girisAmonyum - cikisAmonyum) * Q) / 1000;

    // 2. DURUM: BOİ HESAPLARI
    const girisBoi = Number(kademeData.girisBoi) || 0;
    const cikisBoi = Number(kademeData.cikisBoi) || 0;
    const hidrolikYuk = (girisBoi * Q) / 1000;

    const giderimVerimi = genelVeri?.tasarim?.aritmaParametreleri?.giderimVerimi
        ? parseFloat(String(genelVeri?.tasarim?.aritmaParametreleri?.giderimVerimi).replace(',', '.'))
        : girisBoi > 0 ? (((girisBoi - cikisBoi) / girisBoi) * 100) : 0;

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
                backgroundColor: "rgba(15, 23, 42, 0.75)",
                zIndex: 1060,
                backdropFilter: "blur(4px)"
            }}
        >
            <div
                className="card text-white border-0"
                style={{
                    backgroundColor: "#1e293b",
                    border: isNitrifikasyon ? "1px solid #3b82f6" : "1px solid #334155",
                    borderRadius: "12px",
                    width: "92%",
                    maxWidth: "440px",
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.4)"
                }}
            >
                {/* Modal Başlık Kısmı */}
                <div className="card-header border-0 d-flex justify-content-between align-items-center pt-3 px-3 pb-0 bg-transparent">
                    <span 
                        className="fw-bold text-uppercase" 
                        style={{ fontSize: "11px", letterSpacing: "0.5px", color: isNitrifikasyon ? "#60a5fa" : "#38bdf8" }}
                    >
                        {isNitrifikasyon ? "Nitrifikasyon" : `${kademeData.kademeNo}. Kademe`} Giderim Detayı
                    </span>
                    <button
                        type="button"
                        className="btn-close btn-close-white p-0 m-0"
                        style={{ fontSize: "10px", boxShadow: "none" }}
                        onClick={onClose}
                    ></button>
                </div>

                <hr className="my-2 opacity-10" />

                {/* Modal İçerik Kısmı */}
                <div className="card-body p-3 pt-1" style={{ fontSize: "12px" }}>

                    {/* 1. Girdi Değerleri Özeti */}
                    <div className="p-2 mb-2 rounded bg-dark bg-opacity-20 border border-secondary border-opacity-10" style={{ fontSize: "11px" }}>
                        <div className="d-flex justify-content-between mb-1">
                            <span className="text-white-50">Tasarım Debisi (Q):</span>
                            <span className="fw-bold text-info">{Q.toLocaleString('tr-TR')} m³/gün</span>
                        </div>

                        {isNitrifikasyon ? (
                            <>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-white-50">Giriş Amonyumu:</span>
                                    <span className="fw-bold text-danger">{girisAmonyum} mg/L</span>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-white-50">Hedef Çıkış Amonyumu:</span>
                                    <span className="fw-bold text-warning">{cikisAmonyum} mg/L</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-white-50">Giriş BOİ:</span>
                                    <span className="fw-bold text-danger">{girisBoi} mg/L</span>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-white-50">Hedef Çıkış BOİ:</span>
                                    <span className="fw-bold text-warning">{cikisBoi} mg/L</span>
                                </div>
                            </>
                        )}

                        <div className="d-flex justify-content-between">
                            <span className="text-white-50">Emperik Katsayı (As):</span>
                            <span className="fw-bold text-success">{emperik} g/m²·gün</span>
                        </div>
                    </div>

                    {/* 2. Formüller ve İşlemler */}
                    <div 
                        className="p-2 rounded bg-dark bg-opacity-40 border-start border-3" 
                        style={{ fontSize: "11px", borderColor: isNitrifikasyon ? "#3b82f6" : "#38bdf8" }}
                    >
                        {isNitrifikasyon ? (
                            // --- NİTRİFİKASYON BÖLÜMÜ ---
                            <>
                                {/* Adım 1 */}
                                <div className="mb-3">
                                    <div className="fw-bold text-white-50 mb-1">1. Giderilecek Amonyum Yükü Hesabı:</div>
                                    <div className="font-monospace text-warning text-opacity-75 mb-1" style={{ fontSize: "10px" }}>
                                        Yük = [(Giriş Amonyum - Çıkış Amonyum) × Q] / 1000
                                    </div>
                                    <div className="text-white">
                                        [({girisAmonyum} - {cikisAmonyum}) × {Q}] / 1000 = <strong className="text-info">{isNaN(amonyumYuk) ? "0.00" : amonyumYuk.toFixed(2)} kg/gün</strong>
                                    </div>
                                </div>

                                {/* Adım 2 */}
                                <div>
                                    <div className="fw-bold text-white-50 mb-1">2. Gerekli Nitrifikasyon Yüzey Alanı Hesabı:</div>
                                    <div className="font-monospace text-warning text-opacity-75 mb-1" style={{ fontSize: "10px" }}>
                                        Alan = (Amonyum Yükü × 1000) / As
                                    </div>
                                    <div className="text-white-50 budget-calc-step" style={{ wordBreak: "break-all", fontSize: "10px" }}>
                                        ( {isNaN(amonyumYuk) ? "0" : amonyumYuk.toFixed(2)} × 1000 ) / {emperik}
                                    </div>
                                </div>
                            </>
                        ) : (
                            // --- STANDART BOİ BÖLÜMÜ ---
                            <>
                                {/* Adım 1 */}
                                <div className="mb-3">
                                    <div className="fw-bold text-white-50 mb-1">1. Giriş Kirlilik Yükü Hesabı:</div>
                                    <div className="font-monospace text-warning text-opacity-75 mb-1" style={{ fontSize: "10px" }}>
                                        Yük = (Giriş BOİ × Q) / 1000
                                    </div>
                                    <div className="text-white">
                                        ({girisBoi} × {Q}) / 1000 = <strong className="text-info">{isNaN(hidrolikYuk) ? "0.00" : hidrolikYuk.toFixed(2)} kg/gün</strong>
                                    </div>
                                </div>

                                {/* Adım 2 */}
                                <div>
                                    <div className="fw-bold text-white-50 mb-1">2. Gerekli Yüzey Alanı Hesabı:</div>
                                    {kademeData.kademeNo === 1 || kademeData.kademeNo === "1. Kademe" ? (
                                        <>
                                            <div className="font-monospace text-warning text-opacity-75 mb-1" style={{ fontSize: "10px" }}>
                                                Alan = [Yük × (Verim / 100) × 1000] / As
                                            </div>
                                            <div className="text-white-50 budget-calc-step" style={{ wordBreak: "break-all", fontSize: "10px" }}>
                                                Verim: %{isNaN(giderimVerimi) ? "0.0" : giderimVerimi.toFixed(1)} <br />
                                                [ {isNaN(hidrolikYuk) ? "0" : hidrolikYuk.toFixed(2)} × ({isNaN(giderimVerimi) ? "0" : giderimVerimi.toFixed(1)} / 100) × 1000 ] / {emperik}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="font-monospace text-warning text-opacity-75 mb-1" style={{ fontSize: "10px" }}>
                                                Alan = [(Giriş Yükü - Çıkış Yükü) × 1000] / As
                                            </div>
                                            <div className="text-white-50 budget-calc-step" style={{ wordBreak: "break-all", fontSize: "10px" }}>
                                                [ (({girisBoi} × {Q}/1000) - ({cikisBoi} × {Q}/1000)) × 1000 ] / {emperik}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* 3. Sonuç Skor Tabelası */}
                    <div className="mt-3 p-2 text-center rounded" style={{ backgroundColor: "#0f172a", border: "1px solid #2d3748" }}>
                        <span className="text-white-50 d-block" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>HESAPLANAN TOPLAM YÜZEY ALANI</span>
                        <span className="text-success fw-bold" style={{ fontSize: "18px" }}>
                            {isNaN(alan) ? "0.00" : alan.toFixed(2)} m²
                        </span>
                    </div>
                </div>

                {/* Modal Kapatma Butonu */}
                <div className="card-footer border-0 d-flex justify-content-end p-2 bg-transparent">
                    <button
                        type="button"
                        className="btn btn-sm px-3 text-white border-0"
                        style={{ backgroundColor: "#475569", fontSize: "11px", borderRadius: "6px" }}
                        onClick={onClose}
                    >
                        Kapat
                    </button>
                </div>

            </div>
        </div>
    );
}

export default GiderimDetail;