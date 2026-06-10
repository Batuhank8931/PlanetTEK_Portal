import React from "react";

function SistemSemasi({
    tumSiralar,
    minimumBeklemeSuresi,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleMilDiskChange, // Sıra bazında mil disk adedi değiştiğinde tetiklenecek fonksiyon
    maxDiskAdedi,
    minDiskAdedi
}) {
    return (
        <div className="p-1 my-2 rounded bg-dark" style={{ border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "row", alignItems: "stretch", justifyContent: "space-around", gap: "8px", overflowX: "auto", width: "100%" }}>
            
            {/* CSS ANIMATION INJECT: Kırmızı yanıp sönme efekti için custom keyframe */}
            <style>{`
                @keyframes red-input-glow {
                    0% { border-color: #ef4444; box-shadow: 0 0 4px rgba(239, 68, 68, 0.4); background-color: rgba(239, 68, 68, 0.15); }
                    50% { border-color: #7f1d1d; box-shadow: 0 0 0px transparent; background-color: #334155; }
                    100% { border-color: #ef4444; box-shadow: 0 0 4px rgba(239, 68, 68, 0.4); background-color: rgba(239, 68, 68, 0.15); }
                }
            `}</style>

            {tumSiralar.map((sira, idx) => {
                // YENİ: Disk adedinin sınırların dışında olma durumunu hesaplıyoruz
                const diskAdedi = Number(sira.milBasinaDisk || 0);
                const isDiskInvalid = !sira.isLamella && (diskAdedi < minDiskAdedi || diskAdedi > maxDiskAdedi);

                return (
                    <React.Fragment key={idx}>
                        <div
                            className="d-flex flex-column align-items-center gap-1 p-1 rounded"
                            onDragOver={!sira.isLamella ? handleDragOver : undefined}
                            onDrop={!sira.isLamella ? (e) => handleDrop(e, sira.isLamella, sira.siraTipi) : undefined}
                            style={{
                                flex: "1 1 0px",
                                maxWidth: "140px",
                                border: sira.isLamella ? "1px solid rgba(20, 184, 166, 0.3)" : "1px dashed rgba(255,255,255,0.05)",
                                backgroundColor: sira.isLamella ? "rgba(15, 118, 110, 0.1)" : "transparent"
                            }}
                        >
                            {/* SIRA BAŞLIĞI */}
                            <div className="text-white-50 text-center w-100" style={{ fontSize: "11px" }}>
                                {sira.isLamella ? "Çökeltim Ünitesi" : `${sira.genelSiraNo}. Sıra`}
                            </div>

                            {/* SIRANIN EN ÜSTÜNDEKİ DEĞİŞTİRİLEBİLİR INPUT */}
                            {!sira.isLamella ? (
                                <div className="d-flex align-items-center gap-1 my-0" style={{ width: "60%" }}>
                                    <span className="text-white-50" style={{ fontSize: "9px", whiteSpace: "nowrap" }}>Disk:</span>
                                    <input
                                        type="number"
                                        value={sira.milBasinaDisk || ""}
                                        onChange={(e) => handleMilDiskChange && handleMilDiskChange(sira.siraTipi, e.target.value)}
                                        title={`Geçerli aralık: ${minDiskAdedi} - ${maxDiskAdedi}`}
                                        className="form-control form-control-sm text-center fw-bold text-white p-0"
                                        style={{
                                            fontSize: "11px",
                                            height: "22px",
                                            borderRadius: "4px",
                                            // DEĞİŞİKLİK: Eğer geçersizse animasyonu devreye sokuyoruz ve border rengini eziyoruz
                                            backgroundColor: isDiskInvalid ? "rgba(239, 68, 68, 0.15)" : "#334155",
                                            border: isDiskInvalid ? "1px solid #ef4444" : "1px solid #475569",
                                            animation: isDiskInvalid ? "red-input-glow 1.5s infinite ease-in-out" : "none"
                                        }}
                                    />
                                </div>
                            ) : (
                                // Lamella ise üst kısımda boşluk bozulmasın diye mini bir spacer
                                <div style={{ height: "26px" }} />
                            )}

                            {/* ADET VE HRT BİLGİSİ */}
                            <div className="fw-bold text-center w-100 mt-1" style={{ fontSize: "11px", color: sira.textColor, minHeight: "44px" }}>
                                {sira.isLamella ? `${sira.adet} x ${sira.model}` : `${sira.adet} Adet`}
                                {!sira.isLamella && (
                                    <div
                                        style={{
                                            marginTop: "2px",
                                            animation: sira.beklemeSuresi < minimumBeklemeSuresi ? "placeholder-glow 1.2s infinite ease-in-out" : "none"
                                        }}
                                        className={`mt-1 ${sira.beklemeSuresi < minimumBeklemeSuresi ? "text-danger fw-bold fs-7" : "text-secondary small"}`}
                                    >
                                        t: {sira.beklemeSuresi} sa
                                    </div>
                                )}
                            </div>

                            {/* SÜRÜKLENEBİLİR GÖRSEL ÖGELERİN LİSTESİ */}
                            <div className="d-flex flex-column gap-3 align-items-center justify-content-start w-100 p-1 rounded" style={{ minHeight: "60px", backgroundColor: "rgba(255,255,255,0.02)" }}>
                                {Array.from({ length: sira.adet }).map((_, i) => (
                                    sira.isLamella ? (
                                        // --- LAMELLA GÖRSELİ ---
                                        <div key={`lamella-visual-${i}`} className="d-flex flex-column align-items-center justify-content-center" style={{ width: "100%", maxWidth: "45px", marginTop: "2.5px" }}>
                                            <div className="d-flex flex-column align-items-center justify-content-center" style={{ width: "45px", marginTop: "2.5px", filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.5))" }}>
                                                <div style={{ width: "40px", height: "14px", background: "linear-gradient(90deg, #0d9488 0%, #14b8a6 25%, #0f766e 75%, #115e59 100%)", borderTopLeftRadius: "2px", borderTopRightRadius: "2px", position: "relative", boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2)", overflow: "hidden", borderBottom: "0.5px solid rgba(0,0,0,0.2)" }}>
                                                    <div style={{ position: "absolute", inset: "2px 4px", backgroundImage: "repeating-linear-gradient(120deg, transparent, transparent 1px, rgba(255,255,255,0.3) 1px, rgba(255,255,255,0.3) 2.5px)", opacity: 0.8 }} />
                                                </div>
                                                <div style={{ width: "0", height: "0", borderLeft: "20px solid transparent", borderRight: "20px solid transparent", borderTop: "11px solid #0f766e", position: "relative" }} />
                                            </div>
                                            <span style={{ fontSize: "9px", color: "#2dd4bf", fontWeight: "bold", marginTop: "4px" }}>Lamella-{i + 1}</span>
                                        </div>
                                    ) : (
                                        // --- ÜNİTE (RBC) GÖRSELİ ---
                                        <div
                                            key={i}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, sira.siraTipi)}
                                            className="d-flex flex-column align-items-center justify-content-center"
                                            style={{ width: "100%", maxWidth: "45px", cursor: "grab", userSelect: "none" }}
                                        >
                                            <div style={{ width: "42.5px", filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.5))" }}>
                                                <div style={{ height: "13px", background: "linear-gradient(90deg, #ff7324 0%, #ea580c 30%, #c2410c 85%, #9a3412 100%)", borderTopLeftRadius: "21px 13px", borderTopRightRadius: "21px 13px" }} />
                                                <div style={{ height: "1px", backgroundColor: "#334155", width: "100%" }} />
                                                <div style={{ height: "30px", background: "linear-gradient(90deg, #22c55e 0%, #16a34a 25%, #15803d 75%, #166534 100%)", borderBottomLeftRadius: "3px", borderBottomRightRadius: "3px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                                    <span style={{ fontSize: "10px", fontWeight: "800", color: "#fff" }}>{sira.milBasinaDisk}</span>
                                                    <span style={{ fontSize: "8px", opacity: 0.8 }}>DİSK</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                        {idx < tumSiralar.length - 1 && (
                            <div className="d-flex align-items-center justify-content-center text-white-50" style={{ fontSize: "14px", paddingTop: "55px", userSelect: "none", flexShrink: 0 }}>➔</div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

export default React.memo(SistemSemasi);