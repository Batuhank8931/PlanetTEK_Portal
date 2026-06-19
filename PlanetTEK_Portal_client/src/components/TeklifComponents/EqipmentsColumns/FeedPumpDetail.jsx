import React, { useMemo, useEffect, useState } from "react";
import { useTeklifStore } from "../../../utils/teklifStore";
import API from "../../../utils/utilRequest";

function FeedPumpDetail() {
  const CALC_HOURS = 24;

  // 🚀 PUMP_DATABASE yerine local state kullanıyoruz, varsayılan olarak boş array
  const [pumpDatabase, setPumpDatabase] = useState([]);

  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  // 🚀 Bileşen yüklendiğinde veriyi bir kez çekip state'e atıyoruz
  useEffect(() => {
    const fetchPumps = async () => {
      try {
        const response = await API.getAllPumpsWithCurves();
        setPumpDatabase(response.data || []);
      } catch (error) {
        console.error("Pompa eğrileri API'den yüklenirken hata:", error);
      }
    };
    fetchPumps();
  }, []);

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

  const hasDistributionStructure = !isMainDebiChanged ? (storeFeedPump.hasDistributionStructure || false) : false;

  const activeHourlyFlow = useMemo(() => {
    const val = parseFloat(manualHourlyFlow);
    return isNaN(val) ? 0 : val;
  }, [manualHourlyFlow]);

  const activeMinMss = useMemo(() => {
    const val = parseFloat(manualMinMss);
    return isNaN(val) ? 5.9 : val;
  }, [manualMinMss]);

  // 🚀 KRİTİK DÜZELTME: Hem "1.5" sayı hem de "1.50" string key yapılarını güvenle okur
  const getMssValue = (pump, qSaat) => {
    if (!pump || !pump.mssData) return null;
    
    // Key'leri kesin olarak sayıya döküp sıralıyoruz
    const steps = Object.keys(pump.mssData).map(Number).sort((a, b) => a - b);
    if (steps.length === 0) return null;

    const minStep = steps[0];
    const maxStep = steps[steps.length - 1];

    if (qSaat < minStep || qSaat > maxStep) return null;
    
    // Obje içinden veriyi güvenli çekmek için bir yardımcı fonksiyon
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

  const { idealPumpIndex, pompaAdeti, hesaplananDebi } = useMemo(() => {
    // 🚀 Veritabanı henüz yüklenmediyse hesaplamayı güvenli beklet
    if (pumpDatabase.length === 0 || activeHourlyFlow === 0) {
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

      if (bestPumpIndex === -1) {
        adet++;
      }
    }

    return { idealPumpIndex: bestPumpIndex, pompaAdeti: adet, hesaplananDebi: qHesap };
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

  const isDistributionEligible = pompaAdeti === 1 && ilkSiraAdet > 2;

  const updateFeedPumpStore = (nextHourly, nextMss, nextOffset, isManual = true, hasDistribution = hasDistributionStructure) => {
    if (pumpDatabase.length === 0) return;

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

        pumpDatabase.forEach((p, idx) => {
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
      if (simFinalIndex >= pumpDatabase.length) simFinalIndex = pumpDatabase.length - 1;
    }

    const targetPump = simFinalIndex !== -1 ? pumpDatabase[simFinalIndex] : null;
    const targetMss = targetPump ? getMssValue(targetPump, simQ) : 0;

    if (currentHourlyNum > 0 && targetPump) {
      pumpString = `${targetPump.name}`;
    } else if (currentHourlyNum > 0 && !targetPump) {
      pumpString = "Kapasite Aşımı";
    }

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

  // Veritabanı yüklendiğinde tetiklenebilmesi için bağımlılığa pumpDatabase eklendi
  useEffect(() => {
    if (defaultHourlyFlowStr === "0" || pumpDatabase.length === 0) return;

    if (!storeFeedPump.secilenPompaMetni || isMainDebiChanged || !isInputsChanged) {
      updateFeedPumpStore(defaultHourlyFlowStr, defaultMinMssStr, 0, false, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debi, defaultHourlyFlowStr, isMainDebiChanged, ilkSiraAdet, pumpDatabase]);

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
    const selectedIdx = pumpDatabase.findIndex(p => p.id === parseInt(targetPumpId));
    if (selectedIdx === -1) return;

    const nextOffset = selectedIdx - idealPumpIndex;
    updateFeedPumpStore(manualHourlyFlow, manualMinMss, nextOffset, true);
  };

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