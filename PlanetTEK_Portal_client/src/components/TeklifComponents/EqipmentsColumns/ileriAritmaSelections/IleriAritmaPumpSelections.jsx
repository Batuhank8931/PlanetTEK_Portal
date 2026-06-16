import React, { useState, useEffect, useMemo } from "react";
import GeriDevirPompasiModal from "./modals/GeriDevirPompasiModal";
import { useTeklifStore } from "../../../../utils/teklifStore";

const PUMP_DATABASE = [
    { id: 0, name: "City Pumps Security 10T", mssData: { 0: 15, 1.5: 14.5, 3: 14, 4.5: 13.2, 6: 12, 9: 11, 12: 9, 15: 6, 18: 3.5, 21: 1.5 } },
    { id: 1, name: "City Pumps Ranger 10 35", mssData: { 0: 10, 1.5: 9.7, 3: 9.5, 4.5: 8.7, 6: 8.5, 9: 7, 12: 5.8, 15: 4, 18: 2 } },
    { id: 2, name: "City Pumps Ranger 15 35", mssData: { 0: 15, 1.5: 14.5, 3: 14, 4.5: 13.5, 6: 13, 9: 11.5, 12: 10.5, 15: 6, 18: 7.5, 21: 6, 24: 4, 27: 2 } },
    { id: 3, name: "City Pumps Titan 15 50", mssData: { 4.5: 11.5, 6: 10.5, 9: 10, 12: 9.5, 15: 8.8, 18: 8.2, 21: 7.2, 24: 6.5, 27: 6, 30: 5, 36: 2 } },
    { id: 4, name: "City Pumps Titan 20 50", mssData: { 4.5: 13, 6: 12, 9: 11.5, 12: 11, 15: 10.8, 18: 10, 21: 9, 24: 8, 27: 6.5, 30: 5.8, 36: 4.5, 39: 3, 42: 2 } },
    { id: 5, name: "City Pumps Titan 30 50", mssData: { 4.5: 16, 6: 15, 9: 14.5, 12: 14, 15: 13.5, 18: 13, 21: 12.3, 24: 11.5, 27: 10.8, 30: 9.5, 36: 8, 39: 6.8, 42: 5.9, 48: 3, 51: 2 } },
    { id: 6, name: "City Pumps Patrol 20 50", mssData: { 4.5: 18, 6: 16, 9: 15, 12: 14, 15: 13, 18: 12.5, 21: 11, 24: 10.5, 27: 9, 30: 8, 36: 7, 39: 6, 42: 5, 48: 3, 51: 2, 54: 1 } },
    { id: 7, name: "City Pumps Patrol 30 50", mssData: { 4.5: 24, 6: 22, 9: 21, 12: 20, 15: 19, 18: 18, 21: 17, 24: 16, 27: 15, 30: 14, 36: 12, 39: 11, 42: 10, 48: 8, 51: 7, 54: 6, 60: 4, 66: 2 } }
];

const CRITERIA_DATABASE = [
    { id: 1, label: "≥ 120,00", multiplier: 6.0, minAzot: 120, maxAzot: Infinity },
    { id: 2, label: "100,00 - 119,99", multiplier: 5.5, minAzot: 100, maxAzot: 119.99 },
    { id: 3, label: "80,00 - 99,99", multiplier: 5.0, minAzot: 80, maxAzot: 99.99 },
    { id: 4, label: "40,00 - 79,99", multiplier: 4.0, minAzot: 40, maxAzot: 79.99 },
    { id: 5, label: "< 40,00", multiplier: 3.0, minAzot: 0, maxAzot: 39.99 }
];

function IleriAritmaPumpSelections() {
    const CALC_HOURS = 24;

    const formData = useTeklifStore((state) => state.formData);
    const updateSection = useTeklifStore((state) => state.updateSection);

    const debi = parseFloat(formData.planetDiskDetails?.debi) || 0;
    const ActuralHourlyFlow = debi ? debi / CALC_HOURS : 0;

    const equipmentsCache = formData.equipments || {};
    const storeIleriAritma = equipmentsCache.ileriAritma || {};

    const girisToplamAzot = storeIleriAritma.IleriAritmaInputSelections?.girisToplamAzot ?? 0;
    const storePumpSelections = storeIleriAritma.IleriAritmaPumpSelections || {};

    const [showInfoModal, setShowInfoModal] = useState(false);

    const { hourlyFlow: calculatedHourlyFlow, currentMultiplier } = useMemo(() => {
        if (ActuralHourlyFlow === 0) return { hourlyFlow: 0, currentMultiplier: 0 };

        const matchedCriteria = CRITERIA_DATABASE.find(
            (c) => girisToplamAzot >= c.minAzot && girisToplamAzot <= c.maxAzot
        );
        const multiplier = matchedCriteria ? matchedCriteria.multiplier : 3.0;

        return {
            hourlyFlow: ActuralHourlyFlow * multiplier,
            currentMultiplier: multiplier
        };
    }, [ActuralHourlyFlow, girisToplamAzot]);

    const defaultHourlyFlowStr = useMemo(() => {
        return calculatedHourlyFlow > 0 ? calculatedHourlyFlow.toFixed(2) : "0";
    }, [calculatedHourlyFlow]);

    const defaultMinMssStr = "5.9";

    const lastCalculatedDebi = storePumpSelections.calculatedDebi !== undefined ? storePumpSelections.calculatedDebi : null;
    const lastCalculatedAzot = storePumpSelections.calculatedAzot !== undefined ? storePumpSelections.calculatedAzot : null;

    const isParamsChanged = (lastCalculatedDebi !== null && lastCalculatedDebi !== debi) ||
        (lastCalculatedAzot !== null && lastCalculatedAzot !== girisToplamAzot);

    const manualHourlyFlow = (storePumpSelections.manualHourlyFlow !== undefined && !isParamsChanged)
        ? storePumpSelections.manualHourlyFlow
        : defaultHourlyFlowStr;

    const manualMinMss = (storePumpSelections.manualMinMss !== undefined && !isParamsChanged)
        ? storePumpSelections.manualMinMss
        : defaultMinMssStr;

    const pumpOffset = !isParamsChanged ? (storePumpSelections.pumpOffset || 0) : 0;
    const isInputsChanged = !isParamsChanged ? (storePumpSelections.isManualUserControl || false) : false;

    const activeHourlyFlow = useMemo(() => {
        const val = parseFloat(manualHourlyFlow);
        return isNaN(val) ? 0 : val;
    }, [manualHourlyFlow]);

    const activeMinMss = useMemo(() => {
        const val = parseFloat(manualMinMss);
        return isNaN(val) ? 5.9 : val;
    }, [manualMinMss]);

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

    // --- SEÇİM VE POMPA ADET MANTIĞI (DİNAMİK ARTAN ADET) ---
    const { idealPumpIndex, pompaAdeti, hesaplananDebi } = useMemo(() => {
        if (activeHourlyFlow === 0) return { idealPumpIndex: -1, pompaAdeti: 1, hesaplananDebi: 0 };

        let bestPumpIndex = -1;
        let minValidMss = Infinity;
        let adet = 1;
        let qHesap = activeHourlyFlow;

        // Uygun pompa bulunana kadar adet sayısını artıracak döngü (max 20 adet güvenlik sınırı)
        while (bestPumpIndex === -1 && adet <= 20) {
            qHesap = activeHourlyFlow / adet;
            minValidMss = Infinity;

            PUMP_DATABASE.forEach((pump, index) => {
                const mss = getMssValue(pump, qHesap);
                if (mss !== null && mss >= activeMinMss && mss < minValidMss) {
                    minValidMss = mss;
                    bestPumpIndex = index;
                }
            });

            if (bestPumpIndex !== -1) {
                break; // Uygun pompa kombinasyonu bulundu, döngüden çık.
            }
            adet++;
        }

        return { idealPumpIndex: bestPumpIndex, pompaAdeti: bestPumpIndex !== -1 ? adet : 1, hesaplananDebi: qHesap };
    }, [activeHourlyFlow, activeMinMss]);

    const { selectedPump, currentMss } = useMemo(() => {
        let finalIndex = idealPumpIndex;

        if (idealPumpIndex !== -1) {
            finalIndex = idealPumpIndex + pumpOffset;
            if (finalIndex < 0) finalIndex = 0;
            if (finalIndex >= PUMP_DATABASE.length) finalIndex = PUMP_DATABASE.length - 1;
        }

        const pump = finalIndex !== -1 ? PUMP_DATABASE[finalIndex] : null;
        const mss = pump ? getMssValue(pump, hesaplananDebi) : 0;

        return { selectedPump: pump, currentMss: mss, finalPumpIndex: finalIndex };
    }, [idealPumpIndex, pumpOffset, hesaplananDebi]);

    // Merkezi Store Senkronizasyon Helper'ı
    const updateIleriPumpStore = (nextHourly, nextMss, nextOffset, isManual = true) => {
        let pumpString = "---";
        const hourlyFlowNum = parseFloat(nextHourly) || 0;
        const parsedNextMss = parseFloat(nextMss) || 5.9;

        let simBestIndex = -1;
        let simMinMss = Infinity;
        let simAdet = 1;
        let simQ = hourlyFlowNum;

        if (hourlyFlowNum > 0) {
            while (simBestIndex === -1 && simAdet <= 20) {
                simQ = hourlyFlowNum / simAdet;
                simMinMss = Infinity;

                PUMP_DATABASE.forEach((p, idx) => {
                    const m = getMssValue(p, simQ);
                    if (m !== null && m >= parsedNextMss && m < simMinMss) {
                        simMinMss = m;
                        simBestIndex = idx;
                    }
                });

                if (simBestIndex !== -1) {
                    break;
                }
                simAdet++;
            }
        }

        let simFinalIndex = simBestIndex;
        if (simBestIndex !== -1) {
            simFinalIndex = simBestIndex + nextOffset;
            if (simFinalIndex < 0) simFinalIndex = 0;
            if (simFinalIndex >= PUMP_DATABASE.length) simFinalIndex = PUMP_DATABASE.length - 1;
        }

        const targetPump = simFinalIndex !== -1 ? PUMP_DATABASE[simFinalIndex] : null;
        const targetMss = targetPump ? getMssValue(targetPump, simQ) : 0;

        if (hourlyFlowNum > 0 && targetPump) {
            pumpString = `${targetPump.name}`;
        } else if (hourlyFlowNum > 0 && !targetPump) {
            pumpString = "Kapasite Aşımı";
        }

        updateSection("equipments", {
            ...equipmentsCache,
            ileriAritma: {
                ...storeIleriAritma,
                IleriAritmaPumpSelections: {
                    manualHourlyFlow: nextHourly,
                    manualMinMss: nextMss,
                    pumpOffset: nextOffset,
                    pompaAdeti: targetPump ? simAdet : 0,
                    hesaplananDebi: simQ,
                    geridevirPompasi: pumpString,
                    isManualUserControl: isManual,
                    calculatedDebi: debi,
                    calculatedAzot: girisToplamAzot
                }
            }
        });
    };

    useEffect(() => {
        if (defaultHourlyFlowStr === "0") return;

        if (!storePumpSelections.geridevirPompasi || isParamsChanged || !isInputsChanged) {
            updateIleriPumpStore(defaultHourlyFlowStr, defaultMinMssStr, 0, false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debi, girisToplamAzot, defaultHourlyFlowStr, isParamsChanged]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "manualHourlyFlow") {
            updateIleriPumpStore(value, manualMinMss, pumpOffset, true);
        } else if (name === "manualMinMss") {
            updateIleriPumpStore(manualHourlyFlow, value, pumpOffset, true);
        }
    };

    const handleDropdownPumpChange = (targetPumpId) => {
        if (idealPumpIndex === -1) return;
        const selectedIdx = PUMP_DATABASE.findIndex(p => p.id === parseInt(targetPumpId));
        if (selectedIdx === -1) return;

        const nextOffset = selectedIdx - idealPumpIndex;
        updateIleriPumpStore(manualHourlyFlow, manualMinMss, nextOffset, true);
    };

    const handleResetInputs = () => {
        updateIleriPumpStore(defaultHourlyFlowStr, defaultMinMssStr, 0, false);
    };

    return (
        <div className="card-body d-flex flex-column gap-3 pt-3" style={{ position: "relative", color: "#fff", padding: 0 }}>
            <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center flex-grow-1">
                    <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
                        2. Geri Devir Pompası
                    </span>
                    <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
                </div>

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

            <div className="row g-2 mb-1">
                <div className="col-6">
                    <label className="form-label mb-1 text-white-50" style={{ fontSize: "11px" }}>Geri Devir Debisi (m³/h)</label>
                    <input
                        type="number"
                        name="manualHourlyFlow"
                        step="0.1"
                        className="form-control form-control-sm text-white fw-bold border-0 text-center"
                        style={{ backgroundColor: "rgba(0, 135, 78, 0.2)", borderRadius: "6px", fontSize: "12px", height: "25px" }}
                        value={manualHourlyFlow}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="col-6">
                    <label className="form-label mb-1 text-white-50" style={{ fontSize: "11px" }}>Minimum MSS (m)</label>
                    <input
                        type="number"
                        name="manualMinMss"
                        step="0.1"
                        className="form-control form-control-sm text-white fw-bold border-0 text-center"
                        style={{ backgroundColor: "rgba(0, 135, 78, 0.2)", borderRadius: "6px", fontSize: "12px", height: "25px" }}
                        value={manualMinMss}
                        onChange={handleInputChange}
                    />
                </div>
            </div>

            <div className="d-flex flex-column gap-1 mt-2">
                {selectedPump && (
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-danger fw-bold" style={{ fontSize: "10px", padding: "4px 8px" }}>
                            {pompaAdeti} ADET
                        </span>
                        <span className="text-info fw-semibold" style={{ fontSize: "11px" }}>
                            ({hesaplananDebi.toFixed(2)} m³/h @ {currentMss} MSS {pompaAdeti > 1 && "pompa başına"})
                        </span>
                    </div>
                )}

                <div className="d-flex gap-1 align-items-center">
                    <select
                        className="form-select form-select-sm text-warning fw-bold flex-grow-1"
                        style={{
                            backgroundColor: "rgba(245, 158, 11, 0.12)",
                            border: pumpOffset !== 0 ? "1px solid #f59e0b" : "1px solid #10b981",
                            borderRadius: "6px",
                            fontSize: "12px",
                            height: "36px"
                        }}
                        value={selectedPump ? selectedPump.id : ""}
                        disabled={activeHourlyFlow === 0 || idealPumpIndex === -1}
                        onChange={(e) => handleDropdownPumpChange(e.target.value)}
                    >
                        {idealPumpIndex === -1 && activeHourlyFlow > 0 ? (
                            <option value="">Kapasite Aşımı</option>
                        ) : activeHourlyFlow === 0 ? (
                            <option value="">---</option>
                        ) : (
                            PUMP_DATABASE.map((pump) => (
                                <option key={pump.id} value={pump.id} style={{ backgroundColor: "#1e293b", color: "#fff" }}>
                                    {pump.name}
                                </option>
                            ))
                        )}
                    </select>

                    {pumpOffset !== 0 && (
                        <button
                            type="button"
                            className="btn btn-warning p-0 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: "36px", height: "36px", borderRadius: "6px" }}
                            onClick={() => updateIleriPumpStore(manualHourlyFlow, manualMinMss, 0, true)}
                            title="Otomatik Hesaplanan Pompaya Geri Dön"
                        >
                            <i className="bi bi-arrow-counterclockwise text-dark" style={{ fontSize: "14px", fontWeight: "bold" }}></i>
                        </button>
                    )}
                </div>
            </div>

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