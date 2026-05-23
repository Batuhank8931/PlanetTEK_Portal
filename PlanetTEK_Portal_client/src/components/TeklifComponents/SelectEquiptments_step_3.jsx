import React, { useEffect, useState } from "react";

// Izgara Tipi Seçenekleri
const IZGARA_OPTIONS = ["Manuel Izgara", "Mekanik Izgara"];

// Excel tablosundaki tüm pompa verileri, kapasiteleri ve debiye göre MSS değerleri
const PUMP_DATABASE = [
  {
    id: 0,
    name: "City Pumps Security 10T",
    maxFlow: 1.5,
    mssData: { 0: 15, 1.5: 14.5, 3: 14, 4.5: 13.2, 6: 12, 9: 11, 12: 9, 15: 6, 18: 3.5, 21: 1.5 }
  },
  {
    id: 1,
    name: "City Pumps Ranger 10 35",
    maxFlow: 3,
    mssData: { 0: 10, 1.5: 9.7, 3: 9.5, 4.5: 8.7, 6: 8.5, 9: 7, 12: 5.8, 15: 4, 18: 2 }
  },
  {
    id: 2,
    name: "City Pumps Ranger 15 35",
    maxFlow: 12,
    mssData: { 0: 15, 1.5: 14.5, 3: 14, 4.5: 13.5, 6: 13, 9: 11.5, 12: 10.5, 15: 6, 18: 7.5, 21: 6, 24: 4, 27: 2 }
  },
  {
    id: 3,
    name: "City Pumps Titan 15 50",
    maxFlow: 21,
    mssData: { 4.5: 11.5, 6: 10.5, 9: 10, 12: 9.5, 15: 8.8, 18: 8.2, 21: 7.2, 24: 6.5, 27: 6, 30: 5, 36: 2 }
  },
  {
    id: 4,
    name: "City Pumps Titan 20 50",
    maxFlow: 27,
    mssData: { 4.5: 13, 6: 12, 9: 11.5, 12: 11, 15: 10.8, 18: 10, 21: 9, 24: 8, 27: 6.5, 30: 5.8, 36: 4.5, 39: 3, 42: 2 }
  },
  {
    id: 5,
    name: "City Pumps Titan 30 50",
    maxFlow: 36,
    mssData: { 4.5: 16, 6: 15, 9: 14.5, 12: 14, 15: 13.5, 18: 13, 21: 12.3, 24: 11.5, 27: 10.8, 30: 9.5, 36: 8, 39: 6.8, 42: 5.9, 48: 3, 51: 2 }
  },
  {
    id: 6,
    name: "City Pumps Patrol 20 50",
    maxFlow: 54,
    mssData: { 4.5: 18, 6: 16, 9: 15, 12: 14, 15: 13, 18: 12.5, 21: 11, 24: 10.5, 27: 9, 30: 8, 36: 7, 39: 6, 42: 5, 48: 3, 51: 2, 54: 1 }
  },
  {
    id: 7,
    name: "City Pumps Patrol 30 50",
    maxFlow: 72,
    mssData: { 4.5: 24, 6: 22, 9: 21, 12: 20, 15: 19, 18: 18, 21: 17, 24: 16, 27: 15, 30: 14, 36: 12, 39: 11, 42: 10, 48: 8, 51: 7, 54: 6, 60: 4, 66: 2 }
  }
];

function SelectEquiptments({ data, updateData }) {
  const CALC_HOURS = 12;
  const hourlyFlow = data.debi ? data.debi / CALC_HOURS : 0;

  // Manuel müdahale offset state'leri
  const [izgaraOffset, setIzgaraOffset] = useState(0);
  const [pumpOffset, setPumpOffset] = useState(0);

  // 1. İdeal Izgara İndeksini Hesaplama (Otomatik Seçim)
  const getIdealIzgaraIndex = (debi) => {
    if (!debi) return 0; // Izgara Yok
    return debi < 50 ? 1 : 2; // <50 Manuel Izgara (1), >=50 Mekanik Izgara (2)
  };

  // 2. Yağ Tutucu Boyutu Belirleme
  const getYagTutucuBoyut = (debi) => {
    if (!debi) return "Seçilmedi";
    if (debi <= 10) return "1000 x 1000 mm";
    if (debi <= 25) return "1500 x 1000 mm";
    if (debi <= 50) return "1500 x 1500 mm";
    if (debi <= 100) return "1500 x 2000 mm";
    if (debi <= 150) return "2000 x 2000 mm";
    if (debi <= 250) return "2500 x 2000 mm";
    return "2500 x 2500 mm";
  };

  // 3. İdeal Pompa İndeksini Bulma
  const getIdealPumpIndex = (qSaat) => {
    if (qSaat === 0) return -1;
    return PUMP_DATABASE.findIndex(pump => qSaat <= pump.maxFlow);
  };

  const getMssValue = (pump, qSaat) => {
    if (!pump || !pump.mssData) return 0;
    const steps = Object.keys(pump.mssData).map(Number);
    if (steps.length === 0) return 0;

    const closestStep = steps.reduce((prev, curr) =>
      Math.abs(curr - qSaat) < Math.abs(prev - qSaat) ? curr : prev
    );

    return pump.mssData[closestStep] || 0;
  };

  // --- Izgara Nihai Karar Mekanizması ---
  const idealIzgaraIndex = getIdealIzgaraIndex(data.debi);
  let finalIzgaraIndex = idealIzgaraIndex + izgaraOffset;
  // Sınır Korumaları (Array dışına çıkmasın)
  if (finalIzgaraIndex < 0) finalIzgaraIndex = 0;
  if (finalIzgaraIndex >= IZGARA_OPTIONS.length) finalIzgaraIndex = IZGARA_OPTIONS.length - 1;
  const selectedIzgara = IZGARA_OPTIONS[finalIzgaraIndex];

  // --- Pompa Nihai Karar Mekanizması ---
  const idealPumpIndex = getIdealPumpIndex(hourlyFlow);
  let finalPumpIndex = idealPumpIndex;
  if (idealPumpIndex !== -1) {
    finalPumpIndex = idealPumpIndex + pumpOffset;
    if (finalPumpIndex < 0) finalPumpIndex = 0;
    if (finalPumpIndex >= PUMP_DATABASE.length) finalPumpIndex = PUMP_DATABASE.length - 1;
  }
  const selectedPump = finalPumpIndex !== -1 ? PUMP_DATABASE[finalPumpIndex] : null;
  const currentMss = selectedPump ? getMssValue(selectedPump, hourlyFlow) : 0;

  // Ana debi her değiştiğinde manuel kaydırmaları sıfırla (Oto moda geçsin)
  useEffect(() => {
    setIzgaraOffset(0);
    setPumpOffset(0);
  }, [data.debi]);

  // State güncellendikçe Parent Component'e haber ver
  useEffect(() => {
    if (data.debi) {
      updateData({
        ...data,
        izgaraTipi: selectedIzgara,
        yagTutucuBoyut: getYagTutucuBoyut(data.debi),
        secilenPompa: selectedPump ? `${selectedPump.name} (${selectedPump.maxFlow} m³/h @ ${currentMss} MSS)` : "Kapasite Aşımı"
      });
    }
  }, [data.debi, finalIzgaraIndex, finalPumpIndex, currentMss]);

  return (
    <div className="card-body p-4 d-flex flex-column gap-3" style={{ backgroundColor: "#1a1c1d", borderRadius: "5px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>

      {/* ================= ADIM 3.1: OTOMATİK HESAPLANAN ALANLAR ================= */}
      <div className="d-flex align-items-center">
        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
          3. Otomatik Ekipman Seçimleri
        </span>
        <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
      </div>

      {/* ANLIK DURUM PANELİ */}
      <div className="p-2 px-3 rounded text-white-50 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", fontSize: "11px", border: "1px dashed #334155" }}>
        <span><i className="bi bi-info-circle me-1.5 text-info"></i>Mevcut Hidrolik Yük:</span>
        <span className="text-white fw-bold">{data.debi || 0} m³/gün <span className="text-white-50 fw-normal">({hourlyFlow.toFixed(2)} m³/h)</span></span>
      </div>

      {/* 3 PARALEL PARAMETRE */}
      <div className="row g-2">

        {/* 1. Ön Arıtma Izgarası (Yeni İnline Butonlu Tasarım) */}
        <div className="col-3">
          <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>1. Ön Arıtma Izgarası</label>
          <div
            className="d-flex align-items-center justify-content-between p-1 px-2"
            style={{ backgroundColor: "#1e293b", borderBottom: izgaraOffset !== 0 ? "2px solid #f59e0b" : "2px solid #10b981", borderRadius: "4px", height: "36px" }}
          >
            <div className="fw-bold text-white text-truncate pe-1" style={{ fontSize: "11px" }} title={selectedIzgara}>
              {selectedIzgara}
            </div>

            <div className="d-flex gap-1 flex-shrink-0">
              <button
                type="button"
                className="btn btn-dark p-0 d-flex align-items-center justify-content-center"
                style={{ width: "20px", height: "20px", backgroundColor: "#0f172a", border: "1px solid #334155" }}
                disabled={finalIzgaraIndex <= 0}
                onClick={() => setIzgaraOffset(prev => prev - 1)}
                title="Bir Alt Seçenek"
              >
                <i className="bi bi-chevron-down text-white" style={{ fontSize: "9px" }}></i>
              </button>

              <button
                type="button"
                className="btn btn-dark p-0 d-flex align-items-center justify-content-center"
                style={{ width: "20px", height: "20px", backgroundColor: "#0f172a", border: "1px solid #334155" }}
                disabled={finalIzgaraIndex >= IZGARA_OPTIONS.length - 1}
                onClick={() => setIzgaraOffset(prev => prev + 1)}
                title="Bir Üst Seçenek"
              >
                <i className="bi bi-chevron-up text-white" style={{ fontSize: "9px" }}></i>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Yağ Tutucu Boyutu */}
        <div className="col-3">
          <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>2. Yağ Tutucu</label>
          <div
            className="p-2 text-white text-center fw-bold text-truncate"
            style={{ backgroundColor: "#1e293b", fontSize: "11px", borderBottom: "2px solid #10b981", borderRadius: "4px", height: "36px", lineHeight: "20px" }}
            title={data.yagTutucuBoyut}
          >
            {data.yagTutucuBoyut || "---"}
          </div>
        </div>

        {/* 3. Terfi Pompası */}
        <div className="col-6">
          <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>3. Terfi Pompası (Kapasite & Basınç)</label>
          <div
            className="d-flex align-items-center justify-content-between p-1 px-2"
            style={{ backgroundColor: "#1e293b", borderBottom: pumpOffset !== 0 ? "2px solid #f59e0b" : "2px solid #ef4444", borderRadius: "4px", height: "36px" }}
          >
            <div
              className="fw-bold text-warning text-truncate pe-2"
              style={{ fontSize: "11px" }}
              title={selectedPump ? `${selectedPump.name} (${selectedPump.maxFlow} m³/h @ ${currentMss} MSS)` : ""}
            >
              {selectedPump ? (
                <>
                  {selectedPump.name} <span className="text-info ms-1">({selectedPump.maxFlow} m³/h @ {currentMss} MSS)</span>
                </>
              ) : "---"}
            </div>

            {selectedPump && (
              <div className="d-flex gap-1 flex-shrink-0">
                <button
                  type="button"
                  className="btn btn-dark p-0 d-flex align-items-center justify-content-center"
                  style={{ width: "20px", height: "20px", backgroundColor: "#0f172a", border: "1px solid #334155" }}
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
                  style={{ width: "20px", height: "20px", backgroundColor: "#0f172a", border: "1px solid #334155" }}
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
    </div>
  );
}

export default SelectEquiptments;