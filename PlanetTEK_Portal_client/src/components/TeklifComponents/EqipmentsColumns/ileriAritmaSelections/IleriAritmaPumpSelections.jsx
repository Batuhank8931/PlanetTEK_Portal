import React, { useState, useEffect, useMemo } from "react";
import GeriDevirPompasiModal from "./modals/GeriDevirPompasiModal";
import { useTeklifStore } from "../../../../utils/teklifStore";
import API from "../../../../utils/utilRequest";

const CRITERIA_DATABASE = [
    { id: 1, label: "≥ 120,00", multiplier: 6.0, minAzot: 120, maxAzot: Infinity },
    { id: 2, label: "100,00 - 119,99", multiplier: 5.5, minAzot: 100, maxAzot: 119.99 },
    { id: 3, label: "80,00 - 99,99", multiplier: 5.0, minAzot: 80, maxAzot: 99.99 },
    { id: 4, label: "40,00 - 79,99", multiplier: 4.0, minAzot: 40, maxAzot: 79.99 },
    { id: 5, label: "< 40,00", multiplier: 3.0, minAzot: 0, maxAzot: 39.99 }
];

function IleriAritmaPumpSelections() {
    const CALC_HOURS = 24;

    // 🚀 1. ADIM: Dinamik veritabanı durumu için local state tanımı
    const [pumpDatabase, setPumpDatabase] = useState([]);

    const formData = useTeklifStore((state) => state.formData);
    const updateSection = useTeklifStore((state) => state.updateSection);

    // 🚀 2. ADIM: Sayfa açıldığında güncel eğrili pompa verilerini API'den çek
    useEffect(() => {
        const fetchPumps = async () => {
            try {
                const response = await API.getAllPumpsWithCurves();
                setPumpDatabase(response.data || []);
            } catch (error) {
                console.error("Geri devir pompası motoru için eğri dataları yüklenemedi:", error);
            }
        };
        fetchPumps();
    }, []);

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

    // 🚀 3. ADIM: "1.5" sayı ve "1.50" dize veri tipi uyuşmazlığını ortadan kaldıran akıllı MSS bulucu
    const getMssValue = (pump, qSaat) => {
        if (!pump || !pump.mssData) return null;

        const steps = Object.keys(pump.mssData).map(Number).sort((a, b) => a - b);
        if (steps.length === 0) return null;

        const minStep = steps[0];
        const maxStep = steps[steps.length - 1];

        if (qSaat < minStep || qSaat > maxStep) return null;

        const getSafeValue = (keyNum) => {
            if (pump.mssData[keyNum] !== undefined) return Number(pump.mssData[keyNum]);
            if (pump.mssData[keyNum.toFixed(2)] !== undefined) return Number(pump.mssData[keyNum.toFixed(2)]);
            return null;
        };

        const directMatch = getSafeValue(qSaat);
        if (directMatch !== null) return directMatch;

        for (let i = 0; i < steps.length - 1; i++) {
            const currentStep = steps[i];
            const nextStep = steps[i + 1];

            if (qSaat >= currentStep && qSaat <= nextStep) {
                const mssCurrent = getSafeValue(currentStep);
                const mssNext = getSafeValue(nextStep);

                if (mssCurrent === null || mssNext === null) continue;

                const ratio = (qSaat - currentStep) / (nextStep - currentStep);
                const interpolatedMss = mssCurrent + ratio * (mssNext - mssCurrent);

                return Number(interpolatedMss.toFixed(2));
            }
        }
        return null;
    };

    // --- SEÇİM VE POMPA ADET MANTIĞI (PUMP_DATABASE -> pumpDatabase) ---
    const { idealPumpIndex, pompaAdeti, hesaplananDebi } = useMemo(() => {
        if (activeHourlyFlow === 0 || pumpDatabase.length === 0) {
            return { idealPumpIndex: -1, pompaAdeti: 1, hesaplananDebi: 0 };
        }

        let bestPumpIndex = -1;
        let minValidMss = Infinity;
        let adet = 1;
        let qHesap = activeHourlyFlow;

        while (bestPumpIndex === -1 && adet <= 20) {
            qHesap = activeHourlyFlow / adet;
            minValidMss = Infinity;

            pumpDatabase.forEach((pump, index) => {
                const mss = getMssValue(pump, qHesap);
                if (mss !== null && mss >= activeMinMss && mss < minValidMss) {
                    minValidMss = mss;
                    bestPumpIndex = index;
                }
            });

            if (bestPumpIndex !== -1) {
                break;
            }
            adet++;
        }

        return { idealPumpIndex: bestPumpIndex, pompaAdeti: bestPumpIndex !== -1 ? adet : 1, hesaplananDebi: qHesap };
    }, [activeHourlyFlow, activeMinMss, pumpDatabase]);

    const { selectedPump, currentMss } = useMemo(() => {
        let finalIndex = idealPumpIndex;

        if (idealPumpIndex !== -1 && pumpDatabase.length > 0) {
            finalIndex = idealPumpIndex + pumpOffset;
            if (finalIndex < 0) finalIndex = 0;
            if (finalIndex >= pumpDatabase.length) finalIndex = pumpDatabase.length - 1;
        }

        const pump = finalIndex !== -1 && pumpDatabase.length > 0 ? pumpDatabase[finalIndex] : null;
        const mss = pump ? getMssValue(pump, hesaplananDebi) : 0;

        return { selectedPump: pump, currentMss: mss, finalPumpIndex: finalIndex };
    }, [idealPumpIndex, pumpOffset, hesaplananDebi, pumpDatabase]);

    // Merkezi Store Senkronizasyon Helper'ı
    const updateIleriPumpStore = (nextHourly, nextMss, nextOffset, isManual = true) => {
        if (pumpDatabase.length === 0) return;

        let pumpString = "---";
        let pumpkW = 0;
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

                pumpDatabase.forEach((p, idx) => {
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
            if (simFinalIndex >= pumpDatabase.length) simFinalIndex = pumpDatabase.length - 1;
        }

        const targetPump = simFinalIndex !== -1 ? pumpDatabase[simFinalIndex] : null;
        const targetMss = targetPump ? getMssValue(targetPump, simQ) : 0;

        if (hourlyFlowNum > 0 && targetPump) {
            pumpString = `${targetPump.name}`;
            const rawKw = targetPump.kw !== undefined ? targetPump.kw : targetPump.pompa_kw;
            pumpkW = rawKw ? parseFloat(rawKw) : 0;
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
                    pumpkW: pumpkW, // Store'a güvenle yazılıyor
                    isManualUserControl: isManual,
                    calculatedDebi: debi,
                    calculatedAzot: girisToplamAzot
                }
            }
        });
    };

    // 🚀 4. ADIM: Bağımlılık dizisine (dependency array) pumpDatabase eklenerek senkronizasyon garantilendi
    useEffect(() => {
        if (defaultHourlyFlowStr === "0" || pumpDatabase.length === 0) return;

        if (!storePumpSelections.geridevirPompasi || isParamsChanged || !isInputsChanged) {
            updateIleriPumpStore(defaultHourlyFlowStr, defaultMinMssStr, 0, false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debi, girisToplamAzot, defaultHourlyFlowStr, isParamsChanged, pumpDatabase]);

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
        const selectedIdx = pumpDatabase.findIndex(p => p.id === parseInt(targetPumpId));
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
                    <label className="form-label mb-1 text-white-50" style={{ fontSize: "11px" }}>Geri Devir Debisi (m³/h)
                        <span className="text-white-50 text-none ms-1" style={{ fontSize: "10px", transform: "none" }}>
                            ({ActuralHourlyFlow.toFixed(2)} m³/h x {currentMultiplier.toFixed(1)})
                        </span>
                    </label>
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
                        disabled={activeHourlyFlow === 0 || idealPumpIndex === -1 || pumpDatabase.length === 0}
                        onChange={(e) => handleDropdownPumpChange(e.target.value)}
                    >
                        {pumpDatabase.length === 0 || (idealPumpIndex === -1 && activeHourlyFlow > 0) ? (
                            <option value="">Kapasite Aşımı</option>
                        ) : activeHourlyFlow === 0 ? (
                            <option value="">---</option>
                        ) : (
                            pumpDatabase.map((pump) => (
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