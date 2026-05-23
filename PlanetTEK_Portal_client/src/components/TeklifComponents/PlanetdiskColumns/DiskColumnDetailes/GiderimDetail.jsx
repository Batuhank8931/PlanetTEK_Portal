import React from "react";

function GiderimDetail({ isOpen, onClose, kademeData, genelVeri }) {
    if (!isOpen || !kademeData) return null;

    // Gelen verileri güvenli bir şekilde sayıya dönüştürüyoruz
    const Q = Number(genelVeri?.debi) || 0;
    const girisBoi = Number(kademeData.girisBoi) || 0;
    const cikisBoi = Number(kademeData.cikisBoi) || 0;
    const emperik = Number(kademeData.emperik) || 1; // 0'a bölme hatasını engellemek için default 1
    const alan = Number(kademeData.alan) || 0;

    // İlk kademe mi yoksa sonraki kademeler mi olduğunu anlamak ve formülü ona göre göstermek için:
    // Eğer giriş ve çıkış boi arasında bir verim hesabı gerekiyorsa (ilk kademe veya tek kademeli sistem)
    // Giderim verimi ana veriden veya matematiksel oranla hesaplanabilir:
    const giderimVerimi = genelVeri?.giderimVerimi
        ? parseFloat(String(genelVeri.giderimVerimi).replace(',', '.'))
        : (((girisBoi - cikisBoi) / girisBoi) * 100);

    // Toplam Hidrolik Yük Hesabı: (BOİ * Debi) / 1000
    const hidrolikYuk = (girisBoi * Q) / 1000;

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                zIndex: 1060,
                backdropFilter: "blur(2px)"
            }}
        >
            <div
                className="card text-white border-0"
                style={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    width: "92%",
                    maxWidth: "420px",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)"
                }}
            >
                {/* Modal Başlık Kısmı */}
                <div className="card-header border-0 d-flex justify-content-between align-items-center pt-3 px-3 pb-0 bg-transparent">
                    <span className="fw-bold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#38bdf8" }}>
                        {kademeData.kademeNo}. Kademe Alan Hesabı
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
                            <span className="text-white-50">Debi (Q)</span>
                            <span className="fw-bold text-info">{Q} m³/gün</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                            <span className="text-white-50">Giriş BOİ:</span>
                            <span className="fw-bold text-danger">{girisBoi} mg/L</span>
                        </div>
                        {cikisBoi > 0 && (
                            <div className="d-flex justify-content-between mb-1">
                                <span className="text-white-50">Çıkış BOİ:</span>
                                <span className="fw-bold text-warning">{cikisBoi} mg/L</span>
                            </div>
                        )}
                        <div className="d-flex justify-content-between">
                            <span className="text-white-50">Emperik Katsayı:</span>
                            <span className="fw-bold text-success">{emperik} g/m²·gün</span>
                        </div>
                    </div>

                    {/* 2. Formüller ve İşlemler */}
                    <div className="p-2 rounded bg-dark bg-opacity-40 border-start border-info border-3" style={{ fontSize: "11px" }}>
                        {/* Adım 1 */}
                        <div className="mb-2">
                            <div className="fw-bold text-white-50 mb-1">1. Hidrolik Yük Hesabı:</div>
                            <div className="font-monospace text-warning text-opacity-75" style={{ fontSize: "10px" }}>Yük = (BOİ × Q) / 1000</div>
                            <div className="text-white">({girisBoi} × {Q}) / 1000 = <strong className="text-info">{hidrolikYuk.toFixed(3)} kg/gün</strong></div>
                        </div>

                        {/* Adım 2 */}
                        <div>
                            <div className="fw-bold text-white-50 mb-1">2. Yüzey Alanı Hesabı:</div>
                            {kademeData.kademeNo === 1 || !genelVeri?.kademeler?.length ? (
                                <>
                                    <div className="font-monospace text-warning text-opacity-75" style={{ fontSize: "10px" }}>Alan = [Yük × (1 - Verim/100) × 1000] / Emperik</div>
                                    <div className="text-white" style={{ wordBreak: "break-all" }}>
                                        [ {hidrolikYuk.toFixed(2)} × (1 - {giderimVerimi.toFixed(1)}/100) × 1000 ] / {emperik}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="font-monospace text-warning text-opacity-75" style={{ fontSize: "10px" }}>Alan = (Yük × 1000) / Emperik</div>
                                    <div className="text-white">({hidrolikYuk.toFixed(2)} × 1000) / {emperik}</div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 3. Sonuç Skor Tabelası */}
                    <div className="mt-2 p-2 text-center rounded" style={{ backgroundColor: "#0f172a", border: "1px solid #2d3748" }}>
                        <span className="text-white-50 d-block" style={{ fontSize: "10px" }}>HESAPLANAN ALAN</span>
                        <span className="text-success fw-bold" style={{ fontSize: "16px" }}>{alan.toFixed(2)} m²</span>
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