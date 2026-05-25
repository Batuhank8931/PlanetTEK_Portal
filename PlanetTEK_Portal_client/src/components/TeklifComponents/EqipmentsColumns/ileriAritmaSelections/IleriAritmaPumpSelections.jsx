import React, { useState, useEffect, useMemo } from "react";
// React standartları gereği bileşen adını büyük harfle (PascalCase) kullanmak en doğrusudur
import GeriDevirPompasiModal from "./modals/GeriDevirPompasiModal";

const PUMP_DATABASE = [
    {
        id: 0,
        name: "City Pumps Security 10T",
        mssData: { 0: 15, 1.5: 14.5, 3: 14, 4.5: 13.2, 6: 12, 9: 11, 12: 9, 15: 6, 18: 3.5, 21: 1.5 }
    },
    {
        id: 1,
        name: "City Pumps Ranger 10 35",
        mssData: { 0: 10, 1.5: 9.7, 3: 9.5, 4.5: 8.7, 6: 8.5, 9: 7, 12: 5.8, 15: 4, 18: 2 }
    },
    {
        id: 2,
        name: "City Pumps Ranger 15 35",
        mssData: { 0: 15, 1.5: 14.5, 3: 14, 4.5: 13.5, 6: 13, 9: 11.5, 12: 10.5, 15: 6, 18: 7.5, 21: 6, 24: 4, 27: 2 }
    },
    {
        id: 3,
        name: "City Pumps Titan 15 50",
        mssData: { 4.5: 11.5, 6: 10.5, 9: 10, 12: 9.5, 15: 8.8, 18: 8.2, 21: 7.2, 24: 6.5, 27: 6, 30: 5, 36: 2 }
    },
    {
        id: 4,
        name: "City Pumps Titan 20 50",
        mssData: { 4.5: 13, 6: 12, 9: 11.5, 12: 11, 15: 10.8, 18: 10, 21: 9, 24: 8, 27: 6.5, 30: 5.8, 36: 4.5, 39: 3, 42: 2 }
    },
    {
        id: 5,
        name: "City Pumps Titan 30 50",
        mssData: { 4.5: 16, 6: 15, 9: 14.5, 12: 14, 15: 13.5, 18: 13, 21: 12.3, 24: 11.5, 27: 10.8, 30: 9.5, 36: 8, 39: 6.8, 42: 5.9, 48: 3, 51: 2 }
    },
    {
        id: 6,
        name: "City Pumps Patrol 20 50",
        mssData: { 4.5: 18, 6: 16, 9: 15, 12: 14, 15: 13, 18: 12.5, 21: 11, 24: 10.5, 27: 9, 30: 8, 36: 7, 39: 6, 42: 5, 48: 3, 51: 2, 54: 1 }
    },
    {
        id: 7,
        name: "City Pumps Patrol 30 50",
        mssData: { 4.5: 24, 6: 22, 9: 21, 12: 20, 15: 19, 18: 18, 21: 17, 24: 16, 27: 15, 30: 14, 36: 12, 39: 11, 42: 10, 48: 8, 51: 7, 54: 6, 60: 4, 66: 2 }
    }
];

// Backend'den çekilecek dinamik JSON veri yapısı örneği
const CRITERIA_DATABASE = [
    { id: 1, label: "≥ 120,00", multiplier: 6.0, minAzot: 120, maxAzot: Infinity },
    { id: 2, label: "100,00 - 119,99", multiplier: 5.5, minAzot: 100, maxAzot: 119.99 },
    { id: 3, label: "80,00 - 99,99", multiplier: 5.0, minAzot: 80, maxAzot: 99.99 },
    { id: 4, label: "40,00 - 79,99", multiplier: 4.0, minAzot: 40, maxAzot: 79.99 },
    { id: 5, label: "< 40,00", multiplier: 3.0, minAzot: 0, maxAzot: 39.99 }
];

function IleriAritmaPumpSelections({ data = {}, updateData }) {

    const CALC_HOURS = 24;
    const ActuralHourlyFlow = data.debi ? data.debi / CALC_HOURS : 0;
    
    // Parent data yapısından derin okuma yapıyoruz
    const girisToplamAzot = data?.ileriAritma?.IleriAritmaInputSelections?.girisToplamAzot ?? 0;
    const currentPumpSelections = data?.ileriAritma?.IleriAritmaPumpSelections || {};

    // Modal gösterim state'i yerinde kalıyor
    const [showInfoModal, setShowInfoModal] = useState(false);

    // --- HOURLY FLOW HESAPLAMA MANTIĞI (CRITERIA_DATABASE ENTEGRASYONU) ---
    const { hourlyFlow: calculatedHourlyFlow, currentMultiplier } = useMemo(() => {
        if (ActuralHourlyFlow === 0) return { hourlyFlow: 0, currentMultiplier: 0 };

        // CRITERIA_DATABASE içinden azot değerine uyan doğru kriteri buluyoruz
        const matchedCriteria = CRITERIA_DATABASE.find(
            (c) => girisToplamAzot >= c.minAzot && girisToplamAzot <= c.maxAzot
        );

        // Eğer eşleşen bulunamazsa (güvenlik önlemi) varsayılan olarak en düşük çarpanı verelim
        const multiplier = matchedCriteria ? matchedCriteria.multiplier : 3.0;

        return {
            hourlyFlow: ActuralHourlyFlow * multiplier,
            currentMultiplier: multiplier
        };
    }, [ActuralHourlyFlow, girisToplamAzot]);

    // Orijinal/Hesaplanan temel string değerleri referans için tutuyoruz
    const defaultHourlyFlowStr = useMemo(() => {
        return calculatedHourlyFlow > 0 ? calculatedHourlyFlow.toFixed(2) : "0";
    }, [calculatedHourlyFlow]);

    const defaultMinMssStr = "5.9";

    // Kullanıcının değiştirebileceği input stateleri
    const [manualHourlyFlow, setManualHourlyFlow] = useState("");
    const [manualMinMss, setManualMinMss] = useState(defaultMinMssStr);
    const [pumpOffset, setPumpOffset] = useState(0);

    // Arka plandaki hesaplama değiştikçe inputları güncelle / senkronize et
    useEffect(() => {
        setManualHourlyFlow(defaultHourlyFlowStr);
        setPumpOffset(0);
    }, [defaultHourlyFlowStr]);

    // Seçim algoritmasında kullanılacak aktif sayısal değerler
    const activeHourlyFlow = useMemo(() => {
        const val = parseFloat(manualHourlyFlow);
        return isNaN(val) ? 0 : val;
    }, [manualHourlyFlow]);

    const activeMinMss = useMemo(() => {
        const val = parseFloat(manualMinMss);
        return isNaN(val) ? 5.9 : val;
    }, [manualMinMss]);

    // Kullanıcı alanları el ile manipüle etti mi kontrolü
    const isInputsChanged = useMemo(() => {
        return manualHourlyFlow !== defaultHourlyFlowStr || manualMinMss !== defaultMinMssStr;
    }, [manualHourlyFlow, manualMinMss, defaultHourlyFlowStr]);

    // Değerleri orijinal hesaplamaya geri döndüren fonksiyon
    const handleResetInputs = () => {
        setManualHourlyFlow(defaultHourlyFlowStr);
        setManualMinMss(defaultMinMssStr);
    };

    // Doğrusal İnterpolasyon ile Hassas MSS Hesaplama Fonksiyonu
    const getMssValue = (pump, qSaat) => {
        if (!pump || !pump.mssData) return null;

        const steps = Object.keys(pump.mssData).map(Number).sort((a, b) => a - b);
        if (steps.length === 0) return null;

        const minStep = steps[0];
        const maxStep = steps[steps.length - 1];

        if (qSaat < minStep || qSaat > maxStep) return null;
        if (pump.mssData[qSaat] !== undefined) return pump.mssData[qSaat];

        for (let i = 0; i < steps.length - 1; i++) {
            const currentStep = steps[i];
            const nextStep = steps[i + 1];

            if (qSaat >= currentStep && qSaat <= nextStep) {
                const mssCurrent = pump.mssData[currentStep];
                const mssNext = pump.mssData[nextStep];

                const ratio = (qSaat - currentStep) / (nextStep - currentStep);
                const interpolatedMss = mssCurrent + ratio * (mssNext - mssCurrent);

                return Number(interpolatedMss.toFixed(2));
            }
        }
        return null;
    };

    // --- SEÇİM MANTIĞI ---
    const idealPumpIndex = useMemo(() => {
        if (activeHourlyFlow === 0) return -1;

        let bestPumpIndex = -1;
        let minValidMss = Infinity;

        PUMP_DATABASE.forEach((pump, index) => {
            const mss = getMssValue(pump, activeHourlyFlow);

            if (mss !== null && mss >= activeMinMss) {
                if (mss < minValidMss) {
                    minValidMss = mss;
                    bestPumpIndex = index;
                }
            }
        });

        return bestPumpIndex;
    }, [activeHourlyFlow, activeMinMss]);

    // Manuel Değiştirme (Offset) Mekanizması ve Seçilen Pompa Bilgileri
    const { selectedPump, currentMss, finalPumpIndex } = useMemo(() => {
        let finalIndex = idealPumpIndex;

        if (idealPumpIndex !== -1) {
            finalIndex = idealPumpIndex + pumpOffset;
            if (finalIndex < 0) finalIndex = 0;
            if (finalIndex >= PUMP_DATABASE.length) finalIndex = PUMP_DATABASE.length - 1;
        }

        const pump = finalIndex !== -1 ? PUMP_DATABASE[finalIndex] : null;
        const mss = pump ? getMssValue(pump, activeHourlyFlow) : 0;

        return { selectedPump: pump, currentMss: mss, finalPumpIndex: finalIndex };
    }, [idealPumpIndex, pumpOffset, activeHourlyFlow]);

    // Ana debi her değiştiğinde manuel kaydırmayı sıfırla
    useEffect(() => {
        setPumpOffset(0);
    }, [data.debi]);

    // updateData ile parent state'ini yeni hiyerarşide besleyen trigger
    useEffect(() => {
        if (updateData) {
            let pumpString = "---";
            if (activeHourlyFlow > 0) {
                pumpString = selectedPump
                    ? `${selectedPump.name} (${activeHourlyFlow.toFixed(2)} m³/h @ ${currentMss} MSS)`
                    : "Kapasite Aşımı";
            }

            // Sonsuz döngüyü engellemek için sadece derin objeyi karşılaştırıyoruz
            if (currentPumpSelections.geridevirPompasi !== pumpString) {
                updateData({
                    ...data, // Ana objeyi koru
                    ileriAritma: {
                        ...data?.ileriAritma, // Diğer ileri arıtma modüllerini koru
                        IleriAritmaPumpSelections: {
                            geridevirPompasi: pumpString
                            // İleride buraya ek seçim parametreleri de rahatlıkla eklenebilir
                        }
                    }
                });
            }
        }
    }, [selectedPump, currentMss, activeHourlyFlow, updateData, data, currentPumpSelections]);

    return (
        <div className="card-body d-flex flex-column gap-3" style={{ position: "relative", color: "#fff" }}>

            {/* Alt Başlık Bilgisi ve Info Butonu */}
            <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center flex-grow-1">
                    <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
                        2. Geri Devir Pompası
                    </span>
                    <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
                </div>

                {/* Küçük Info Butonu */}
                <button
                    type="button"
                    className="btn btn-link p-0 ms-2 text-info d-flex align-items-center"
                    style={{ textDecoration: "none", boxShadow: "none" }}
                    onClick={() => setShowInfoModal(true)}
                    title="Hesaplama Tablosunu Göster"
                >
                    <i className="bi bi-info-circle" style={{ fontSize: "14px" }}></i>
                </button>
            </div>

            {/* INPUT ALANLARI */}
            <div className="row g-2 mb-1">
                <div className="col-6">
                    <label className="form-label mb-1 text-white-50" style={{ fontSize: "11px" }}>Geri Devir Debisi (m³/h)</label>
                    <input
                        type="number"
                        step="0.1"
                        className="form-control form-control-sm text-white fw-bold border-0 text-center"
                        style={{ backgroundColor: "rgba(0, 135, 78, 0.2)", borderRadius: "6px", fontSize: "12px", height: "25px" }}
                        value={manualHourlyFlow}
                        onChange={(e) => setManualHourlyFlow(e.target.value)}
                    />
                </div>
                <div className="col-6">
                    <label className="form-label mb-1 text-white-50" style={{ fontSize: "11px" }}>Minimum MSS (m)</label>
                    <input
                        type="number"
                        step="0.1"
                        className="form-control form-control-sm text-white fw-bold border-0 text-center"
                        style={{ backgroundColor: "rgba(0, 135, 78, 0.2)", borderRadius: "6px", fontSize: "12px", height: "25px" }}
                        value={manualMinMss}
                        onChange={(e) => setManualMinMss(e.target.value)}
                    />
                </div>
            </div>

            <div className="col-12">
                <div
                    className="d-flex align-items-center justify-content-between p-1 px-2"
                    style={{
                        backgroundColor: "#0f172a",
                        borderBottom: pumpOffset !== 0 ? "2px solid #f59e0b" : "2px solid #10b981",
                        borderRadius: "4px",
                        height: "36px"
                    }}
                >
                    <div
                        className="fw-bold text-warning text-truncate pe-2"
                        style={{ fontSize: "11px" }}
                        title={selectedPump ? `${selectedPump.name} (${activeHourlyFlow.toFixed(2)} m³/h @ ${currentMss} MSS)` : ""}
                    >
                        {selectedPump ? (
                            <>
                                {selectedPump.name} <span className="text-info ms-1">({activeHourlyFlow.toFixed(2)} m³/h @ {currentMss} MSS)</span>
                            </>
                        ) : (
                            <span className="text-muted">{activeHourlyFlow === 0 ? "---" : "Kapasite Aşımı"}</span>
                        )}
                    </div>

                    {selectedPump && (
                        <div className="d-flex gap-1 flex-shrink-0">
                            <button
                                type="button"
                                className="btn btn-dark p-0 d-flex align-items-center justify-content-center"
                                style={{ width: "20px", height: "20px", backgroundColor: "#1e293b", border: "1px solid #334155" }}
                                disabled={finalPumpIndex <= 0}
                                onClick={() => setPumpOffset(prev => prev - 1)}
                                title="Bir Küçük Pompayı Seç"
                            >
                                <i className="bi bi-chevron-down text-white" style={{ fontSize: "9px" }}></i>
                            </button>

                            {pumpOffset !== 0 && (
                                <button
                                    type="button"
                                    className="btn btn-warning p-0 d-flex align-items-center justify-content-center"
                                    style={{ width: "20px", height: "20px" }}
                                    onClick={() => setPumpOffset(0)}
                                    title="Otomatik Seçime Geri Dön"
                                >
                                    <i className="bi bi-arrow-counterclockwise text-dark" style={{ fontSize: "9px", fontWeight: "bold" }}></i>
                                </button>
                            )}

                            <button
                                type="button"
                                className="btn btn-dark p-0 d-flex align-items-center justify-content-center"
                                style={{ width: "20px", height: "20px", backgroundColor: "#1e293b", border: "1px solid #334155" }}
                                disabled={finalPumpIndex >= PUMP_DATABASE.length - 1}
                                onClick={() => setPumpOffset(prev => prev + 1)}
                                title="Bir Büyük Pompayı Seç"
                            >
                                <i className="bi bi-chevron-up text-white" style={{ fontSize: "9px" }}></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Debi veya MSS el ile değiştirildiğinde beliren Refresh Linki */}
            <div className="d-flex justify-content-end" style={{ height: "18px" }}>
                {isInputsChanged && (
                    <span
                        onClick={handleResetInputs}
                        className="text-warning d-flex align-items-center gap-1"
                        style={{ cursor: "pointer", fontSize: "10px", fontWeight: "500" }}
                        title="Orijinal hesaplanan değerlere geri dön"
                    >
                        <i className="bi bi-arrow-counterclockwise"></i> Orijinal Değerlere Dön
                    </span>
                )}
            </div>

            {/* --- DIŞARIDAN ÇEKİLEN BİLGİLENDİRME MODALINDA ARTIK DİNAMİK MULTIPLIER GİDİYOR --- */}
            {showInfoModal && (
                <GeriDevirPompasiModal
                    onClose={() => setShowInfoModal(false)}
                    girisToplamAzot={girisToplamAzot}
                    currentMultiplier={currentMultiplier}
                    ActuralHourlyFlow={ActuralHourlyFlow}
                    hourlyFlow={calculatedHourlyFlow}
                />
            )}
        </div>
    );
}

export default IleriAritmaPumpSelections;