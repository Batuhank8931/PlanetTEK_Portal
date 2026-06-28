import React, { useState, useRef, useEffect } from "react";

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
    // Hangi sıranın slider panelinin açık olduğunu takip eden state (null veya siraTipi)
    const [aktifSlider, setAktifSlider] = useState(null);
    const panelRef = useRef(null);

    // Panel dışına tıklandığında slider'ı kapatmak için event listener
    useEffect(() => {
        function handleClickOutside(event) {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setAktifSlider(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sınırların dışında kalan disk adetlerini otomatik olarak güncelle/düzelt
    useEffect(() => {
        if (!handleMilDiskChange) return;

        tumSiralar.forEach((sira) => {
            if (sira.isLamella) return; // Lamella ise geç

            const diskAdedi = Number(sira.milBasinaDisk || 0);

            // Sınır kontrolü
            if (diskAdedi < minDiskAdedi) {
                handleMilDiskChange(sira.siraTipi, minDiskAdedi);
            } else if (diskAdedi > maxDiskAdedi) {
                handleMilDiskChange(sira.siraTipi, maxDiskAdedi);
            }
        });
    }, [tumSiralar, minDiskAdedi, maxDiskAdedi, handleMilDiskChange]);

    return (
        <div className="p-2 my-2 rounded-3 bg-dark d-flex flex-row align-items-stretch justify-content-around gap-2"
            style={{ border: "1px solid rgba(255,255,255,0.04)", overflowX: "auto", width: "100%", position: "relative" }}>

            {/* CSS ANIMATION & SLIDER INJECT: Modern pulsasyon ve input gizleme stilleri */}
            <style>{`
                @keyframes red-input-glow {
                    0% { border-color: #ef4444; box-shadow: 0 0 4px rgba(239, 68, 68, 0.3); background-color: rgba(239, 68, 68, 0.1); }
                    50% { border-color: #991b1b; box-shadow: 0 0 0px transparent; background-color: #1e293b; }
                    100% { border-color: #ef4444; box-shadow: 0 0 4px rgba(239, 68, 68, 0.3); background-color: rgba(239, 68, 68, 0.1); }
                }
                /* Custom range slider tasarımı */
                .custom-range-slider {
                    -webkit-appearance: none;
                    width: 100%;
                    height: 6px;
                    background: #334155;
                    border-radius: 3px;
                    outline: none;
                }
                .custom-range-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #22c55e;
                    cursor: pointer;
                    transition: transform 0.1s;
                }
                .custom-range-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                }
            `}</style>

            {tumSiralar.map((sira, idx) => {
                const diskAdedi = Number(sira.milBasinaDisk || 0);
                const olasidiskAdedi = Number(sira.OrginalDiskAdedi || 0);
                const isCountDiskInvalid = !sira.isLamella && (olasidiskAdedi > diskAdedi);

                // Sınırlar dahilindeki mevcut disk değerini hesapla
                const gecerliDiskDegeri = diskAdedi < minDiskAdedi ? minDiskAdedi : (diskAdedi > maxDiskAdedi ? maxDiskAdedi : diskAdedi);

                return (
                    <React.Fragment key={idx}>
                        <div
                            className="d-flex flex-column align-items-center gap-2 p-2 rounded-3"
                            onDragOver={!sira.isLamella ? handleDragOver : undefined}
                            onDrop={!sira.isLamella ? (e) => handleDrop(e, sira.isLamella, sira.siraTipi) : undefined}
                            style={{
                                flex: "1 1 0px",
                                maxWidth: "135px",
                                border: sira.isLamella ? "1px solid rgba(20, 184, 166, 0.25)" : "1px dashed rgba(255,255,255,0.07)",
                                backgroundColor: sira.isLamella ? "rgba(13, 148, 136, 0.04)" : "rgba(255,255,255,0.01)",
                                position: "relative"
                            }}
                        >
                            {/* SIRA BAŞLIĞI */}
                            <div className="text-white fw-semibold text-center w-100" style={{ fontSize: "11px", letterSpacing: "0.3px", opacity: 0.8 }}>
                                {sira.isLamella ? "Çökeltim Ünitesi" : `${sira.genelSiraNo}. Sıra`}
                            </div>

                            {/* GEREKLİ DİSK BİLGİSİ */}
                            {!sira.isLamella ? (
                                <div className="text-center w-100 rounded-pill px-1"
                                    style={{
                                        fontSize: "10px",
                                        fontWeight: "500",
                                        color: isCountDiskInvalid ? "#f87171" : "rgba(255,255,255,0.4)",
                                        animation: isCountDiskInvalid ? "red-input-glow 2s infinite ease-in-out" : "none",
                                        border: isCountDiskInvalid ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
                                        backgroundColor: isCountDiskInvalid ? "transparent" : "rgba(255,255,255,0.03)"
                                    }}>
                                    Gerekli: {sira.OrginalDiskAdedi || "0"}
                                </div>
                            ) : (
                                <div style={{ height: "17px", visibility: "hidden" }} />
                            )}

                            {/* DİSK DEĞİŞTİRME PANELİ (YENİ SÜRGÜLÜ SİSTEM) */}
                            {!sira.isLamella ? (
                                <div className="d-flex align-items-center justify-content-between gap-1 w-100 px-2 position-relative">
                                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: "500" }}>Disk:</span>

                                    {/* Tıklanabilir Gösterge Butonu */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setAktifSlider(aktifSlider === sira.siraTipi ? null : sira.siraTipi);
                                        }}
                                        className="btn btn-sm text-center fw-bold text-white p-0 d-flex align-items-center justify-content-center"
                                        style={{
                                            fontSize: "11px",
                                            width: "52px",
                                            height: "18px",
                                            borderRadius: "4px",
                                            backgroundColor: aktifSlider === sira.siraTipi ? "#16a34a" : "#1e293b",
                                            border: "1px solid #334155",
                                            cursor: "pointer"
                                        }}
                                        title="Ayarlamak için tıklayın"
                                    >
                                        {gecerliDiskDegeri}
                                    </button>

                                    {/* Üzerine Tıklanınca Açılan Sürgü Çubuğu (Popover) */}
                                    {aktifSlider === sira.siraTipi && (
                                        <div
                                            ref={panelRef}
                                            className="position-absolute p-2 rounded shadow-lg d-flex flex-column align-items-center gap-1"
                                            style={{
                                                top: "24px",
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                zIndex: 999,
                                                backgroundColor: "#1e293b",
                                                border: "1px solid #475569",
                                                width: "140px",
                                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
                                            }}
                                            onClick={(e) => e.stopPropagation()} // Panel içi tıklamalarda kapanmasın
                                        >
                                            <div className="d-flex justify-content-between w-100 px-1" style={{ fontSize: "9px", color: "#94a3b8" }}>
                                                <span>Min: {minDiskAdedi}</span>
                                                <span>Max: {maxDiskAdedi}</span>
                                            </div>

                                            <input
                                                type="range"
                                                min={minDiskAdedi}
                                                max={maxDiskAdedi}
                                                value={gecerliDiskDegeri}
                                                onChange={(e) => handleMilDiskChange && handleMilDiskChange(sira.siraTipi, e.target.value)}
                                                className="custom-range-slider my-1"
                                            />

                                            <div className="fw-bold text-success" style={{ fontSize: "12px" }}>
                                                {gecerliDiskDegeri} Disk
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ height: "20px", visibility: "hidden" }} />
                            )}

                            {/* ADET VE HRT BİLGİSİ */}
                            <div className="fw-bold text-center w-100 mt-1" style={{ fontSize: "11px", color: sira.textColor, minHeight: "40px" }}>
                                {sira.isLamella ? (
                                    <div>
                                        <div style={{ color: "#2dd4bf" }}>{sira.adet} Adet</div>
                                        <div className="text-white-50" style={{ fontSize: "9px", fontWeight: "normal" }}>{sira.model}</div>
                                    </div>
                                ) : (
                                    <div className="text-white">{sira.adet} Adet</div>
                                )}

                                {!sira.isLamella && (
                                    <div
                                        style={{
                                            marginTop: "3px",
                                            fontSize: "10px",
                                            animation: sira.beklemeSuresi < minimumBeklemeSuresi ? "placeholder-glow 1.2s infinite ease-in-out" : "none"
                                        }}
                                        className={sira.beklemeSuresi < minimumBeklemeSuresi ? "text-danger fw-bold" : "text-muted"}
                                    >
                                        t: {sira.beklemeSuresi} sa
                                    </div>
                                )}
                            </div>

                            {/* SÜRÜKLENEBİLİR GÖRSEL ÖGELERİN LİSTESİ */}
                            <div className="d-flex flex-column gap-3 align-items-center justify-content-start w-100 p-1 rounded-2" style={{ minHeight: "60px", backgroundColor: "rgba(255,255,255,0.015)" }}>
                                {Array.from({ length: sira.adet }).map((_, i) => (
                                    sira.isLamella ? (
                                        <div key={`lamella-visual-${i}`} className="d-flex flex-column align-items-center justify-content-center" style={{ width: "100%", maxWidth: "45px", marginTop: "2.5px" }}>
                                            <div className="d-flex flex-column align-items-center justify-content-center" style={{ width: "45px", marginTop: "2.5px", filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.5))" }}>
                                                <div style={{ width: "40px", height: "14px", background: "linear-gradient(90deg, #0d9488 0%, #14b8a6 25%, #0f766e 75%, #115e59 100%)", borderTopLeftRadius: "2px", borderTopRightRadius: "2px", position: "relative", boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2)", overflow: "hidden", borderBottom: "0.5px solid rgba(0,0,0,0.2)" }}>
                                                    <div style={{ position: "absolute", inset: "2px 4px", backgroundImage: "repeating-linear-gradient(120deg, transparent, transparent 1px, rgba(255,255,255,0.3) 1px, rgba(255,255,255,0.3) 2.5px)", opacity: 0.8 }} />
                                                </div>
                                                <div style={{ width: "0", height: "0", borderLeft: "20px solid transparent", borderRight: "20px solid transparent", borderTop: "11px solid #0f766e", position: "relative" }} />
                                            </div>
                                            <span style={{ fontSize: "9px", color: "#2dd4bf", fontWeight: "bold", marginTop: "4px" }}>{sira.model}</span>
                                        </div>
                                    ) : (
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
                                                <div style={{ height: "30px", background: "linear-gradient(90deg, #22c55e 0%, #16a34a 25%, #15803d 75%, #166534 100%)", borderBottomLeftRadius: "3px", borderBottomRightRadius: "3px", display: "flex", flexDirection: "column", alignItems: "center", justifyCenter: "center" }}>
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
                            <div className="d-flex align-items-center justify-content-center text-white-50" style={{ fontSize: "14px", paddingTop: "65px", userSelect: "none", flexShrink: 0 }}>➔</div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

export default React.memo(SistemSemasi);