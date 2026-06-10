import React, { useState } from "react";

function OnYillikMaliyetTablosu() {
  // Sistem seçimi: 'aktif_camur' veya 'mbbr'
  const [selectedSystem, setSelectedSystem] = useState("aktif_camur");

  // Matris verileri ve Enflasyon
  const [data, setData] = useState({
    inflationRate: 5, // Yıllık ortalama enflasyon/fiyat artış öngörüsü (%)
    planet: {
      capex: 286401,     // İlk Yatırım Maliyeti (€)
      yearlyEnergy: 3034, // Yıllık Enerji Gideri (€)
      yearlyMaint: 285,   // Yıllık Bakım ve Sarf Gideri (€)
    },
    aktif_camur: {
      capex: 195000,
      yearlyEnergy: 16638,
      yearlyMaint: 3500,
    },
    mbbr: {
      capex: 230000,
      yearlyEnergy: 12500,
      yearlyMaint: 4200,
    }
  });

  const [history, setHistory] = useState([]);

  // --- AKSİYON YÖNETİMİ ---
  const saveToHistory = (currentState) => {
    setHistory([...history, JSON.stringify(currentState)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setData(JSON.parse(history[history.length - 1]));
    setHistory(history.slice(0, -1));
  };

  const handleGeneralChange = (field, value) => {
    saveToHistory(data);
    setData({ ...data, [field]: parseFloat(value) || 0 });
  };

  const handleParamChange = (system, field, value) => {
    saveToHistory(data);
    setData({
      ...data,
      [system]: {
        ...data[system],
        [field]: parseFloat(value) || 0,
      },
    });
  };

  // --- FİNANSAL HESAPLAMALAR (10 YILLIK KÜMÜLATİF) ---
  // Yıllık artış formülü: ( (1 + i)^10 - 1 ) / i
  const i = data.inflationRate / 100;
  const tenYearMultiplier = i === 0 ? 10 : (Math.pow(1 + i, 10) - 1) / i;

  const calculateTCO = (sysData) => {
    const totalEnergy10Y = sysData.yearlyEnergy * tenYearMultiplier;
    const totalMaint10Y = sysData.yearlyMaint * tenYearMultiplier;
    const tco = sysData.capex + totalEnergy10Y + totalMaint10Y;
    return { totalEnergy10Y, totalMaint10Y, tco };
  };

  const planetRes = calculateTCO(data.planet);
  const altSystemData = selectedSystem === "aktif_camur" ? data.aktif_camur : data.mbbr;
  const altSystemName = selectedSystem === "aktif_camur" ? "Klasik Aktif Çamur Sistemi" : "MBBR Sistemi";
  const altRes = calculateTCO(altSystemData);

  // Tasarruf Analizi
  const totalSavings10Y = altRes.tco - planetRes.tco;

  return (
    <div className="d-flex flex-column gap-3 w-100 text-white">
      
      <style>{`
        .comp-row {
          border-bottom: 1px solid #334155;
        }
        .comp-row:last-child {
          border-bottom: none;
        }
        .comp-input {
          font-size: 13px;
          box-shadow: none;
          width: 90px;
          border-bottom: 1px dashed #475569 !important;
        }
        .comp-input:focus {
          outline: none;
          background-color: rgba(255, 255, 255, 0.08) !important;
          border-bottom: 1px solid #60a5fa !important;
        }
        .header-main-title {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.6px;
          background-color: #090d16;
          color: #94a3b8;
        }
        .bg-planet-column { background-color: rgba(217, 119, 6, 0.08); }
        .bg-alt-column { background-color: rgba(22, 163, 74, 0.05); }
        .system-toggle-btn {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          transition: all 0.2s ease;
        }
      `}</style>

      {/* ÜST PANEL: SİSTEM SEÇİMİ, ENFLASYON VE GERİ AL */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex gap-3 align-items-center">
          {/* Toggle Butonları */}
          <div className="d-flex align-items-center gap-2 bg-dark p-1 rounded-3 border" style={{ borderColor: "#334155" }}>
            <button
              onClick={() => setSelectedSystem("aktif_camur")}
              className={`btn btn-sm px-3 system-toggle-btn ${selectedSystem === "aktif_camur" ? "btn-success" : "btn-transparent text-white-50"}`}
              style={{ borderRadius: "6px" }}
            >
              Aktif Çamur
            </button>
            <button
              onClick={() => setSelectedSystem("mbbr")}
              className={`btn btn-sm px-3 system-toggle-btn ${selectedSystem === "mbbr" ? "btn-info text-dark" : "btn-transparent text-white-50"}`}
              style={{ borderRadius: "6px" }}
            >
              MBBR
            </button>
          </div>

          {/* Enflasyon Parametresi */}
          <div className="d-flex align-items-center gap-2 px-3 py-1 rounded-3" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
            <span className="text-white-50" style={{ fontSize: "11px" }}>Yıllık Enflasyon Öngörüsü:</span>
            <input
              type="number"
              step="0.5"
              className="form-control form-control-sm text-end fw-bold text-warning p-0 bg-transparent border-0"
              style={{ fontSize: "12px", boxShadow: "none", width: "40px" }}
              value={data.inflationRate}
              onChange={(e) => handleGeneralChange("inflationRate", e.target.value)}
            />
            <span className="text-white-50" style={{ fontSize: "11px" }}>%</span>
          </div>
        </div>

        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1"
          style={{ backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a", fontSize: "11px", borderRadius: "6px", opacity: history.length === 0 ? 0.4 : 1 }}
        >
          ↶ Geri Al
        </button>
      </div>

      {/* ANA MATRİS TABLOSU */}
      <div className="d-flex flex-column rounded-3 overflow-hidden" style={{ border: "1px solid #334155", backgroundColor: "#151f32" }}>
        
        {/* SÜTUN GRUPLARI BAŞLIĞI */}
        <div className="d-flex text-center border-bottom align-items-stretch" style={{ borderColor: "#334155" }}>
          <div className="p-2 header-main-title text-start ps-3 d-flex align-items-center" style={{ width: "34%" }}>Maliyet Kalemleri</div>
          <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
          <div className="p-2 header-main-title text-warning d-flex align-items-center justify-content-center" style={{ width: "33%", backgroundColor: "rgba(217, 119, 6, 0.15)" }}>PlanetDISK® Ünitesi</div>
          <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
          <div className="p-2 header-main-title d-flex align-items-center justify-content-center" style={{ width: "33%", backgroundColor: selectedSystem === "aktif_camur" ? "rgba(22, 163, 74, 0.1)" : "rgba(6, 182, 212, 0.1)", color: selectedSystem === "aktif_camur" ? "#4ade80" : "#22d3ee" }}>
            {altSystemName}
          </div>
        </div>

        {/* SATIR 1: CAPEX */}
        <div className="d-flex align-items-stretch comp-row">
          <div className="p-2.5 ps-3 fw-medium text-white-50" style={{ width: "34%", fontSize: "12px" }}>İlk Yatırım Maliyeti (CAPEX)</div>
          <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
          <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "33%" }}>
            <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.planet.capex} onChange={(e) => handleParamChange("planet", "capex", e.target.value)} />
            <span className="text-white-50" style={{ fontSize: "11px" }}>€</span>
          </div>
          <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
          <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-alt-column" style={{ width: "33%" }}>
            <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={altSystemData.capex} onChange={(e) => handleParamChange(selectedSystem, "capex", e.target.value)} />
            <span className="text-white-50" style={{ fontSize: "11px" }}>€</span>
          </div>
        </div>

        {/* SATIR 2: YILLIK ENERJİ GİDERİ */}
        <div className="d-flex align-items-stretch comp-row">
          <div className="p-2.5 ps-3 fw-medium text-white-50" style={{ width: "34%", fontSize: "12px" }}>Yıllık Enerji Gideri</div>
          <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
          <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "33%" }}>
            <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.planet.yearlyEnergy} onChange={(e) => handleParamChange("planet", "yearlyEnergy", e.target.value)} />
            <span className="text-white-50" style={{ fontSize: "11px" }}>€/yıl</span>
          </div>
          <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
          <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-alt-column" style={{ width: "33%" }}>
            <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={altSystemData.yearlyEnergy} onChange={(e) => handleParamChange(selectedSystem, "yearlyEnergy", e.target.value)} />
            <span className="text-white-50" style={{ fontSize: "11px" }}>€/yıl</span>
          </div>
        </div>

        {/* SATIR 3: YILLIK BAKIM GİDERİ */}
        <div className="d-flex align-items-stretch comp-row border-bottom" style={{ borderBottomWidth: "2px", borderColor: "#475569" }}>
          <div className="p-2.5 ps-3 fw-medium text-white-50" style={{ width: "34%", fontSize: "12px" }}>Yıllık Bakım ve Sarf Gideri</div>
          <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
          <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "33%" }}>
            <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.planet.yearlyMaint} onChange={(e) => handleParamChange("planet", "yearlyMaint", e.target.value)} />
            <span className="text-white-50" style={{ fontSize: "11px" }}>€/yıl</span>
          </div>
          <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
          <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-alt-column" style={{ width: "33%" }}>
            <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={altSystemData.yearlyMaint} onChange={(e) => handleParamChange(selectedSystem, "yearlyMaint", e.target.value)} />
            <span className="text-white-50" style={{ fontSize: "11px" }}>€/yıl</span>
          </div>
        </div>

        {/* --- 10 YILLIK HESAPLAMALAR --- */}

        {/* SATIR 4: 10 YILLIK KÜMÜLATİF ENERJİ */}
        <div className="d-flex align-items-stretch comp-row" style={{ backgroundColor: "#0f172a" }}>
          <div className="p-2.5 ps-3 fw-medium text-white-50" style={{ width: "34%", fontSize: "11.5px" }}>10 Yıllık Kümülatif Enerji Gideri</div>
          <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
          <div className="p-2.5 text-center bg-planet-column fw-bold text-white-50" style={{ width: "33%", fontSize: "12.5px" }}>{Math.round(planetRes.totalEnergy10Y).toLocaleString()} €</div>
          <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
          <div className="p-2.5 text-center bg-alt-column fw-bold text-white-50" style={{ width: "33%", fontSize: "12.5px" }}>{Math.round(altRes.totalEnergy10Y).toLocaleString()} €</div>
        </div>

        {/* SATIR 5: 10 YILLIK KÜMÜLATİF BAKIM */}
        <div className="d-flex align-items-stretch comp-row" style={{ backgroundColor: "#0f172a" }}>
          <div className="p-2.5 ps-3 fw-medium text-white-50" style={{ width: "34%", fontSize: "11.5px" }}>10 Yıllık Kümülatif Bakım Gideri</div>
          <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
          <div className="p-2.5 text-center bg-planet-column fw-bold text-white-50" style={{ width: "33%", fontSize: "12.5px" }}>{Math.round(planetRes.totalMaint10Y).toLocaleString()} €</div>
          <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
          <div className="p-2.5 text-center bg-alt-column fw-bold text-white-50" style={{ width: "33%", fontSize: "12.5px" }}>{Math.round(altRes.totalMaint10Y).toLocaleString()} €</div>
        </div>

        {/* SATIR 6: TCO - TOPLAM SAHİP OLMA MALİYETİ */}
        <div className="d-flex align-items-stretch" style={{ backgroundColor: "#0b1524", borderTop: "2px dashed #475569" }}>
          <div className="p-3 ps-3 fw-bold text-white-50 text-uppercase d-flex align-items-center" style={{ width: "34%", fontSize: "11px", letterSpacing: "0.5px" }}>
            10 Yıllık Toplam Sahip Olma Maliyeti (TCO)
          </div>
          <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
          <div className="p-3 text-center bg-planet-column fw-bold text-warning" style={{ width: "33%", fontSize: "16px" }}>
            {Math.round(planetRes.tco).toLocaleString()} €
          </div>
          <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
          <div className="p-3 text-center bg-alt-column fw-bold text-danger" style={{ width: "33%", fontSize: "16px" }}>
            {Math.round(altRes.tco).toLocaleString()} €
          </div>
        </div>

      </div>

      {/* ALT PANEL: FİNANSAL KAZANÇ RAPORU */}
      <div className="d-flex flex-column rounded-3 overflow-hidden border p-4 gap-2 mt-1" style={{ borderColor: "#475569", backgroundColor: "#090d16" }}>
        
        <div className="d-flex flex-column align-items-center justify-content-center text-center">
          <span className="text-white-50 mb-2 fw-medium" style={{ fontSize: "13px", letterSpacing: "0.5px" }}>
            {altSystemName} yerine PlanetDISK® tercih edildiğinde 10 Yılın Sonunda Sağlanan <strong className="text-white">Net Tasarruf (Kar)</strong>:
          </span>
          <span className="fw-extrabold text-success font-monospace" style={{ fontSize: "36px", letterSpacing: "1px", textShadow: "0 0 10px rgba(74, 222, 128, 0.2)" }}>
            {totalSavings10Y > 0 ? `+ ${Math.round(totalSavings10Y).toLocaleString()}` : Math.round(totalSavings10Y).toLocaleString()} €
          </span>
          {data.inflationRate > 0 && (
            <span className="text-white-50 mt-2" style={{ fontSize: "11px" }}>
              * Hesaplamalara 10 yıllık işletme süresince yıllık <strong>%{data.inflationRate}</strong> enflasyon (fiyat artışı) dahil edilmiştir.
            </span>
          )}
        </div>

      </div>

    </div>
  );
}

export default OnYillikMaliyetTablosu;