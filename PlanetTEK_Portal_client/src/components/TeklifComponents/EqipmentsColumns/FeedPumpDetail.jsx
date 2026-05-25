import React, { useState, useEffect, useMemo } from "react";

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

function FeedPumpDetail({ data, updateData }) {

  const CALC_HOURS = 24;
  const hourlyFlow = data.debi ? data.debi / CALC_HOURS : 0;
  const defaultHourlyFlowStr = hourlyFlow > 0 ? hourlyFlow.toFixed(2) : "0";
  const defaultMinMssStr = "5.9";

  const [pumpOffset, setPumpOffset] = useState(0);
  const [manualHourlyFlow, setManualHourlyFlow] = useState("");
  const [manualMinMss, setManualMinMss] = useState(defaultMinMssStr);

  // Ana debi (data.debi) her değiştiğinde input değerlerini ve offset'i otomatik sıfırla/güncelle
  useEffect(() => {
    setManualHourlyFlow(defaultHourlyFlowStr);
    setPumpOffset(0);
  }, [data.debi, hourlyFlow]);

  // Input alanlarından gelen string değerleri güvenli bir şekilde sayıya dönüştürüyoruz
  const activeHourlyFlow = useMemo(() => {
    const val = parseFloat(manualHourlyFlow);
    return isNaN(val) ? 0 : val;
  }, [manualHourlyFlow]);

  const activeMinMss = useMemo(() => {
    const val = parseFloat(manualMinMss);
    return isNaN(val) ? 5.9 : val;
  }, [manualMinMss]);

  // Kullanıcı debi veya mss değerini el ile değiştirdi mi kontrolü
  const isInputsChanged = useMemo(() => {
    return manualHourlyFlow !== defaultHourlyFlowStr || manualMinMss !== defaultMinMssStr;
  }, [manualHourlyFlow, manualMinMss, defaultHourlyFlowStr]);

  // Girişleri eski haline döndüren fonksiyon
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

  // updateData ile parent state'ini doğrudan besleyen trigger
  // updateData ile parent state'ini doğrudan besleyen trigger
  useEffect(() => {
    if (!updateData) return;

    let pumpString = "---";
    if (activeHourlyFlow > 0) {
      pumpString = selectedPump
        ? `${selectedPump.name} (${activeHourlyFlow.toFixed(2)} m³/h @ ${currentMss} MSS)`
        : "Kapasite Aşımı";
    }

    // KRİTİK KONTROL: Eğer zaten mevcut veri ile yeni veri aynıysa state'i güncelleme!
    if (data?.secilenPompa !== pumpString) {
      updateData({
        ...data,
        secilenPompa: pumpString
      });
    }
  }, [selectedPump, currentMss, activeHourlyFlow, updateData, data]);
  // NOT: Bağımlılık dizisine 'data' nesnesini ekledik ki güncel halini kontrol edebilelim.

  return (
    <div className="d-flex flex-column gap-3">
      {/* Alt Başlık Bilgisi */}
      <div className="text-white-50 border-bottom pb-1 mb-1" style={{ fontSize: "11px", fontWeight: "600" }}>
        TERFİ POMPASI PARAMETRELERİ
      </div>

      <div className="col-12">
        <div className="row g-2 mb-1">
          <div className="col-6">
            <label className="form-label mb-1 text-white-50" style={{ fontSize: "11px" }}>Sistem Debisi (m³/h)</label>
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

        {/* Debi ve MSS Değişirse Çıkan Yenileme Alanı */}
        <div className="d-flex justify-content-end mb-2" style={{ height: "18px" }}>
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
    </div>
  );
}

export default FeedPumpDetail;