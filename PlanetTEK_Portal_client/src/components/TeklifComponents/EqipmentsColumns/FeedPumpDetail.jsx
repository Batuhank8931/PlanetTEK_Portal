import React, { useMemo, useEffect } from "react";
import { useTeklifStore } from "../../../utils/teklifStore";

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

function FeedPumpDetail() {
  const CALC_HOURS = 24;

  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  // Arıtmadaki ilk sıra ünite adeti
  const ilkSiraAdet = parseInt(formData.planetDiskDetails?.tasarim?.yerlesimSiralanisi?.[0]?.adet) || 0;

  const debi = parseFloat(formData.planetDiskDetails?.debi) || 0;
  const defaultHourlyFlowStr = debi ? (debi / CALC_HOURS).toFixed(2) : "0";
  const defaultMinMssStr = "5.9";

  const equipmentsCache = formData.equipments || {};
  const storeFeedPump = equipmentsCache.feedPump || {};

  const lastCalculatedMainDebi = storeFeedPump.calculatedMainDebi !== undefined ? storeFeedPump.calculatedMainDebi : null;
  const isMainDebiChanged = lastCalculatedMainDebi !== null && lastCalculatedMainDebi !== debi;

  const manualHourlyFlow = (storeFeedPump.manualHourlyFlow !== undefined && !isMainDebiChanged)
    ? storeFeedPump.manualHourlyFlow
    : defaultHourlyFlowStr;

  const manualMinMss = (storeFeedPump.manualMinMss !== undefined && !isMainDebiChanged)
    ? storeFeedPump.manualMinMss
    : defaultMinMssStr;

  const pumpOffset = !isMainDebiChanged ? (storeFeedPump.pumpOffset || 0) : 0;
  const isInputsChanged = !isMainDebiChanged ? (storeFeedPump.isManualUserControl || false) : false;

  // Dağıtım yapısı seçili mi bilgisini store'dan güvenli alalım
  const hasDistributionStructure = !isMainDebiChanged ? (storeFeedPump.hasDistributionStructure || false) : false;

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

  const { idealPumpIndex, pompaAdeti, hesaplananDebi } = useMemo(() => {
    if (activeHourlyFlow === 0) return { idealPumpIndex: -1, pompaAdeti: 1, hesaplananDebi: 0 };

    let bestPumpIndex = -1;
    let minValidMss = Infinity;
    let adet = 1;
    let qHesap = activeHourlyFlow;

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

      if (bestPumpIndex === -1) {
        adet++;
      }
    }

    return { idealPumpIndex: bestPumpIndex, pompaAdeti: adet, hesaplananDebi: qHesap };
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

  // ŞART KONTROLÜ: Pompa 1 adet ve ilk sıra ünite sayısı 2'den büyükse checkbox aktif edilebilir olmalı.
  const isDistributionEligible = pompaAdeti === 1 && ilkSiraAdet > 2;

  // Yenilenmiş Store Güncelleme Fonksiyonu (hasDistribution parametresini de yönetir)
  const updateFeedPumpStore = (nextHourly, nextMss, nextOffset, isManual = true, hasDistribution = hasDistributionStructure) => {
    let pumpString = "---";
    const currentHourlyNum = parseFloat(nextHourly) || 0;
    const parsedNextMss = parseFloat(nextMss) || 5.9;

    let simBestIndex = -1;
    let simMinMss = Infinity;
    let simAdet = 1;
    let simQ = currentHourlyNum;

    if (currentHourlyNum > 0) {
      while (simBestIndex === -1 && simAdet <= 20) {
        simQ = currentHourlyNum / simAdet;
        simMinMss = Infinity;

        PUMP_DATABASE.forEach((p, idx) => {
          const m = getMssValue(p, simQ);
          if (m !== null && m >= parsedNextMss && m < simMinMss) {
            simMinMss = m;
            simBestIndex = idx;
          }
        });

        if (simBestIndex === -1) {
          simAdet++;
        }
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

    if (currentHourlyNum > 0 && targetPump) {
      pumpString = `${targetPump.name}`;
    } else if (currentHourlyNum > 0 && !targetPump) {
      pumpString = "Kapasite Aşımı";
    }

    // Eğer şart bozulduysa checkbox'ı otomatik kapat
    const finalDistributionState = (simAdet === 1 && ilkSiraAdet > 2) ? hasDistribution : false;

    updateSection("equipments", {
      ...equipmentsCache,
      feedPump: {
        ...storeFeedPump,
        manualHourlyFlow: nextHourly,
        manualMinMss: nextMss,
        pumpOffset: nextOffset,
        pompaAdeti: targetPump ? simAdet : 0,
        secilenPompaMetni: pumpString,
        isManualUserControl: isManual,
        calculatedMainDebi: debi,
        hasDistributionStructure: finalDistributionState,
        distributionGirisAdet: finalDistributionState ? simAdet : 0,
        distributionCikisAdet: finalDistributionState ? ilkSiraAdet : 0
      }
    });
  };

  useEffect(() => {
    if (defaultHourlyFlowStr === "0") return;

    if (!storeFeedPump.secilenPompaMetni || isMainDebiChanged || !isInputsChanged) {
      updateFeedPumpStore(defaultHourlyFlowStr, defaultMinMssStr, 0, false, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debi, defaultHourlyFlowStr, isMainDebiChanged, ilkSiraAdet]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "manualHourlyFlow") {
      updateFeedPumpStore(value, manualMinMss, pumpOffset, true);
    } else if (name === "manualMinMss") {
      updateFeedPumpStore(manualHourlyFlow, value, pumpOffset, true);
    }
  };

  const handleDropdownPumpChange = (targetPumpId) => {
    if (idealPumpIndex === -1) return;
    const selectedIdx = PUMP_DATABASE.findIndex(p => p.id === parseInt(targetPumpId));
    if (selectedIdx === -1) return;

    const nextOffset = selectedIdx - idealPumpIndex;
    updateFeedPumpStore(manualHourlyFlow, manualMinMss, nextOffset, true);
  };

  // Checkbox Değişim Fonksiyonu
  const handleDistributionCheckboxChange = (e) => {
    updateFeedPumpStore(manualHourlyFlow, manualMinMss, pumpOffset, true, e.target.checked);
  };

  return (
    <div className="d-flex flex-column gap-3">
      <div className="text-white-50 border-bottom pb-1 mb-1" style={{ fontSize: "11px", fontWeight: "600" }}>
        TERFİ POMPASI PARAMETRELERİ
      </div>

      <div className="col-12">
        <div className="row g-2 mb-1">
          <div className="col-6">
            <label className="form-label mb-1 text-white-50" style={{ fontSize: "11px" }}>Sistem Debisi (m³/h)</label>
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

        {/* POMPA DROPDOWN VE BİLGİ ALANI */}
        <div className="d-flex flex-column gap-1 mt-3">
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
                onClick={() => updateFeedPumpStore(manualHourlyFlow, manualMinMss, 0, true)}
                title="Otomatik Hesaplanan Pompaya Geri Dön"
              >
                <i className="bi bi-arrow-counterclockwise text-dark" style={{ fontSize: "14px", fontWeight: "bold" }}></i>
              </button>
            )}
          </div>
        </div>

        {/* --- DEBİ DAĞITIM YAPISI CHECKBOX ALANI --- */}
        {isDistributionEligible && (
          <div
            className="mt-3 p-2 rounded border border-secondary border-opacity-25 transition-all"
            style={{
              backgroundColor: hasDistributionStructure ? "rgba(16, 185, 129, 0.05)" : "rgba(255,255,255,0.02)",
              transition: "all 0.3s ease"
            }}
          >
            <div className="form-check form-switch d-flex align-items-center justify-content-between ps-0">
              <label
                className="form-check-label text-light fw-semibold cursor-pointer"
                htmlFor="distributionStructureCheck"
                style={{ fontSize: "12px", cursor: "pointer" }}
              >
                <i className="bi bi-diagram-3-fill me-2 text-info"></i>
                Debi Dağıtım Yapısı İlave Edilsin
              </label>
              <input
                className="form-check-input ms-0 cursor-pointer"
                type="checkbox"
                role="switch"
                id="distributionStructureCheck"
                style={{ width: "2.5em", height: "1.25em", cursor: "pointer" }}
                checked={hasDistributionStructure}
                onChange={handleDistributionCheckboxChange}
              />
            </div>

            {/* Seçildiğinde Altta Çıkan Akıllı Bilgilendirme Rozetleri */}
            {hasDistributionStructure && (
              <div className="d-flex gap-2 mt-2 pt-2 border-top border-secondary border-opacity-10 style-fade-in" style={{ fontSize: "10px" }}>
                <span className="text-white-50">Yapı Konfigürasyonu:</span>
                <span className="badge bg-secondary">Giriş: {pompaAdeti} (Pompa)</span>
                <span className="badge bg-success">Çıkış: {ilkSiraAdet} (Ünite)</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default FeedPumpDetail;