import React from "react";

// Backend'den çekilecek dinamik JSON veri yapısı örneği
const CRITERIA_DATABASE = [
    { id: 1, label: "≥ 120,00", multiplier: 6.0, minAzot: 120, maxAzot: Infinity },
    { id: 2, label: "100,00 - 119,99", multiplier: 5.5, minAzot: 100, maxAzot: 119.99 },
    { id: 3, label: "80,00 - 99,99", multiplier: 5.0, minAzot: 80, maxAzot: 99.99 },
    { id: 4, label: "40,00 - 79,99", multiplier: 4.0, minAzot: 40, maxAzot: 79.99 },
    { id: 5, label: "< 40,00", multiplier: 3.0, minAzot: 0, maxAzot: 39.99 }
];

function GeriDevirPompasiModal({ 
    onClose, 
    girisToplamAzot, 
    currentMultiplier, 
    ActuralHourlyFlow, 
    hourlyFlow 
}) {
    
    // Aktif satırları yumuşak bir yeşil tonuyla vurgulamak için inline stil
    const activeRowStyle = {
        backgroundColor: "rgba(16, 185, 129, 0.15)", 
        color: "#10b981",
        fontWeight: "600"
    };

    // Tablo hücrelerinin ortak stili
    const cellStyle = {
        backgroundColor: "transparent",
        color: "rgba(255, 255, 255, 0.75)",
        borderColor: "rgba(255, 255, 255, 0.08)",
        fontSize: "11.5px",
        padding: "8px"
    };

    const activeCellStyle = {
        ...cellStyle,
        backgroundColor: "transparent",
        color: "#10b981"
    };

    return (
        <div 
            className="modal fade show d-block" 
            tabIndex="-1" 
            style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)" }}
            onClick={onClose}
        >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-content text-white border-0" style={{ backgroundColor: "#0b1329", borderRadius: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)" }}>
                    
                    {/* Header */}
                    <div className="modal-header d-flex justify-content-between align-items-center p-3 pb-2 border-0 bg-transparent">
                        <h6 className="modal-title m-0 fw-bold d-flex align-items-center" style={{ color: "#10b981", fontSize: "14px", letterSpacing: "0.3px" }}>
                            <i className="bi bi-calculator me-2" style={{ fontSize: "16px" }}></i>
                            Geri Devir Katsayı Seçim Kriterleri
                        </h6>
                        <button 
                            type="button" 
                            className="btn-close btn-close-white opacity-50" 
                            onClick={onClose}
                            style={{ boxShadow: "none", width: "10px", height: "10px" }}
                        ></button>
                    </div>

                    {/* Body */}
                    <div className="modal-body p-3 pt-2" style={{ fontSize: "11.5px", lineHeight: "1.5" }}>
                        <p className="mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                            Geri devir saatlik debisi (<span className="text-warning">hourlyFlow</span>), anlık giriş azot konsantrasyonuna göre seçilen çarpan katsayısının, saatlik ham debi (<span style={{ color: "#38bdf8" }}>ActuralHourlyFlow</span>) ile çarpılmasıyla hesaplanır.
                        </p>

                        {/* Table */}
                        <div className="table-responsive border mb-3" style={{ borderColor: "rgba(255,255,255,0.08)", borderRadius: "6px", overflow: "hidden", backgroundColor: "#070d19" }}>
                            <table className="table table-sm table-bordered m-0 text-center bg-transparent" style={{ borderColor: "rgba(255,255,255,0.08)", color: "#fff" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#0f172a" }}>
                                        <th style={{ ...cellStyle, color: "rgba(255,255,255,0.6)", fontWeight: "600" }} className="border-0">Giriş Azot (mg/l)</th>
                                        <th style={{ ...cellStyle, color: "rgba(255,255,255,0.6)", fontWeight: "600" }} className="border-0">Geri Devir Katsayısı (Q)</th>
                                        <th style={{ ...cellStyle, color: "rgba(255,255,255,0.6)", fontWeight: "600" }} className="border-0">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-transparent">
                                    
                                    {/* JSON'dan Gelen Verilerin Map Edilmesi */}
                                    {CRITERIA_DATABASE.map((row) => {
                                        // Gelen azot değerinin bu satırın aralığına girip girmediğini kontrol ediyoruz
                                        const isRowActive = girisToplamAzot >= row.minAzot && girisToplamAzot <= row.maxAzot;
                                        
                                        return (
                                            <tr key={row.id} style={isRowActive ? activeRowStyle : {}}>
                                                <td style={isRowActive ? activeCellStyle : cellStyle}>
                                                    {row.label}
                                                </td>
                                                <td style={isRowActive ? activeCellStyle : cellStyle}>
                                                    {row.multiplier.toFixed(2).replace(".", ",")} Q
                                                </td>
                                                <td style={isRowActive ? activeCellStyle : cellStyle}>
                                                    {isRowActive ? "Aktif" : "-"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    
                                </tbody>
                            </table>
                        </div>

                        {/* Canlı Hesaplama Paneli */}
                        <div className="p-3 rounded" style={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div className="fw-bold mb-2 d-flex align-items-center" style={{ color: "#38bdf8", fontSize: "11px", letterSpacing: "0.5px" }}>
                                <i className="bi bi-cpu me-1.5" style={{ fontSize: "13px" }}></i> MEVCUT CANLI HESAPLAMA
                            </div>
                            
                            <div className="d-flex flex-column gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                                <div className="d-flex justify-content-between">
                                    <span>Girilen Azot Değeri:</span>
                                    <span className="fw-bold text-white">{girisToplamAzot} mg/l</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span>Belirlenen Çarpan:</span>
                                    <span className="fw-bold text-warning">{currentMultiplier ? `${Number(currentMultiplier).toFixed(2)} Q` : "0.00 Q"}</span>
                                </div>
                                <div className="d-flex justify-content-between pb-2 border-bottom" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                                    <span>Saatlik Ham Debi:</span>
                                    <span className="fw-bold text-white">{ActuralHourlyFlow.toFixed(2)} m³/h</span>
                                </div>
                                <div className="d-flex justify-content-between pt-1 fw-bold" style={{ color: "#10b981", fontSize: "12px" }}>
                                    <span>Hedef Geri Devir Debisi:</span>
                                    <span>{hourlyFlow.toFixed(2)} m³/h</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer border-0 p-2 d-flex justify-content-end bg-transparent">
                        <button 
                            type="button" 
                            className="btn btn-sm text-white px-3" 
                            onClick={onClose}
                            style={{ backgroundColor: "#1e293b", fontSize: "11px", borderRadius: "4px" }}
                        >
                            Kapat
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default GeriDevirPompasiModal;