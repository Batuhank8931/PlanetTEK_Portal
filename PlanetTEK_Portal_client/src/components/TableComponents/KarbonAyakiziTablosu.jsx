import React, { useState } from "react";

function KarbonAyakiziTablosu() {
  const [selectedSystem, setSelectedSystem] = useState("aktif_camur");

  const [data, setData] = useState({
    co2Factor: 0.43, 
    planet: { dailyKwh: 64.6 }, 
    aktif_camur: { dailyKwh: 345.5 }, 
    mbbr: { dailyKwh: 285.0 }, 
  });

  const [history, setHistory] = useState([]);

  const saveToHistory = (currentState) => {
    setHistory([...history, JSON.stringify(currentState)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setData(JSON.parse(history[history.length - 1]));
    setHistory(history.slice(0, -1));
  };

  const handleParamChange = (system, field, value) => {
    saveToHistory(data);
    if (system === "general") {
      setData({ ...data, [field]: parseFloat(value) || 0 });
    } else {
      setData({
        ...data,
        [system]: {
          ...data[system],
          [field]: parseFloat(value) || 0,
        },
      });
    }
  };

  const planetYearlyKwh = data.planet.dailyKwh * 365;
  const planetCo2 = (planetYearlyKwh * data.co2Factor) / 1000; 

  const altSystemData = selectedSystem === "aktif_camur" ? data.aktif_camur : data.mbbr;
  const altSystemName = selectedSystem === "aktif_camur" ? "Klasik Aktif Çamur Sistemi" : "MBBR Sistemi";
  const altYearlyKwh = altSystemData.dailyKwh * 365;
  const altCo2 = (altYearlyKwh * data.co2Factor) / 1000; 

  const savedCo2 = altCo2 - planetCo2;
  const equivalentTrees = (savedCo2 * 1000) / 22; 

  return (
    <div className="d-flex flex-column gap-3 w-100 text-white">
      
      <style>{`
        .comp-row { border-bottom: 1px solid #334155; }
        .comp-row:last-child { border-bottom: none; }
        .comp-input { font-size: 13px; box-shadow: none; width: 80px; border-bottom: 1px dashed #475569 !important; }
        .comp-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.08) !important; border-bottom: 1px solid #60a5fa !important; }
        .header-main-title { font-size: 11px; font-weight: 800; letter-spacing: 0.6px; background-color: #090d16; color: #94a3b8; }
        .bg-planet-column { background-color: rgba(217, 119, 6, 0.08); }
        .bg-alt-column { background-color: rgba(22, 163, 74, 0.05); }
        .system-toggle-btn { font-size: 11px; font-weight: 600; letter-spacing: 0.5px; transition: all 0.2s ease; }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center gap-2 bg-dark p-1 rounded-3 border" style={{ borderColor: "#334155" }}>
          <button
            onClick={() => setSelectedSystem("aktif_camur")}
            className={`btn btn-sm px-4 system-toggle-btn ${selectedSystem === "aktif_camur" ? "btn-success" : "btn-transparent text-white-50"}`}
            style={{ borderRadius: "6px" }}
          >
            Aktif Çamur ile Kıyasla
          </button>
          <button
            onClick={() => setSelectedSystem("mbbr")}
            className={`btn btn-sm px-4 system-toggle-btn ${selectedSystem === "mbbr" ? "btn-info text-dark" : "btn-transparent text-white-50"}`}
            style={{ borderRadius: "6px" }}
          >
            MBBR ile Kıyasla
          </button>
        </div>

        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1"
          style={{ backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a", fontSize: "11px", borderRadius: "6px", opacity: history.length === 0 ? 0.4 : 1 }}
        >
          ↶ 
        </button>
      </div>

      <div className="w-100" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div className="d-flex flex-column rounded-3 overflow-hidden" style={{ border: "1px solid #334155", backgroundColor: "#151f32", minWidth: "850px" }}>
          
          <div className="d-flex text-center border-bottom align-items-stretch" style={{ borderColor: "#334155" }}>
            <div className="p-2 header-main-title text-start ps-3 d-flex align-items-center" style={{ width: "34%" }}>KARBON AYAK İZİ PARAMETRELERİ</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-main-title text-warning d-flex align-items-center justify-content-center" style={{ width: "33%", backgroundColor: "rgba(217, 119, 6, 0.15)" }}>PlanetDISK® Ünitesi</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-main-title d-flex align-items-center justify-content-center" style={{ width: "33%", backgroundColor: selectedSystem === "aktif_camur" ? "rgba(22, 163, 74, 0.1)" : "rgba(6, 182, 212, 0.1)", color: selectedSystem === "aktif_camur" ? "#4ade80" : "#22d3ee" }}>
              {altSystemName}
            </div>
          </div>

          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2.5 ps-3 fw-medium text-white-50" style={{ width: "34%", fontSize: "12px" }}>Günlük Enerji Tüketimi (kWh/gün)</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "33%" }}>
              <input type="number" step="0.1" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.planet.dailyKwh} onChange={(e) => handleParamChange("planet", "dailyKwh", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>kWh</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-alt-column" style={{ width: "33%" }}>
              <input type="number" step="0.1" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={altSystemData.dailyKwh} onChange={(e) => handleParamChange(selectedSystem, "dailyKwh", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>kWh</span>
            </div>
          </div>

          <div className="d-flex align-items-stretch comp-row font-monospace text-white" style={{ fontSize: "12.5px" }}>
            <div className="p-2.5 ps-3 fw-medium text-white-50 font-sans-serif" style={{ width: "34%" }}>Yıllık Toplam Enerji Tüketimi</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2.5 text-center bg-planet-column fw-bold" style={{ width: "33%" }}>{planetYearlyKwh.toLocaleString()} kWh/yıl</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2.5 text-center bg-alt-column fw-bold" style={{ width: "33%" }}>{altYearlyKwh.toLocaleString()} kWh/yıl</div>
          </div>

          <div className="d-flex align-items-stretch comp-row" style={{ backgroundColor: "#1e293b" }}>
            <div className="p-2.5 ps-3 fw-medium text-white-50" style={{ width: "34%", fontSize: "12px" }}>
              Şebeke Emisyon Faktörü<br/>
              <span style={{ fontSize: "10px", color: "#64748b" }}>(Elektrik Üretimi Karbon Yoğunluğu)</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1" style={{ width: "66%" }}>
              <input type="number" step="0.01" className="form-control form-control-sm bg-transparent border-0 text-center text-warning fw-bold p-0 comp-input" style={{ width: "60px" }} value={data.co2Factor} onChange={(e) => handleParamChange("general", "co2Factor", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>kg CO₂ / kWh</span>
            </div>
          </div>

          <div className="d-flex align-items-stretch" style={{ backgroundColor: "#0b1524", borderTop: "2px dashed #475569" }}>
            <div className="p-3 ps-3 fw-bold text-white-50 text-uppercase d-flex align-items-center" style={{ width: "34%", fontSize: "11.5px" }}>Yıllık Karbon Ayak İzi (Salınım)</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-3 text-center bg-planet-column fw-bold text-success" style={{ width: "33%", fontSize: "15px" }}>
              {planetCo2.toFixed(1)} <span style={{ fontSize: "11px" }} className="text-white-50">ton CO₂/yıl</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-3 text-center bg-alt-column fw-bold text-danger" style={{ width: "33%", fontSize: "15px" }}>
              {altCo2.toFixed(1)} <span style={{ fontSize: "11px" }} className="text-white-50">ton CO₂/yıl</span>
            </div>
          </div>

        </div>
      </div>

      <div className="d-flex flex-column rounded-3 overflow-hidden border p-3 gap-3 mt-1" style={{ borderColor: "#475569", backgroundColor: "#090d16" }}>
        
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="d-flex flex-column">
            <span className="text-white" style={{ fontSize: "13px", fontWeight: "600" }}>{altSystemName}'ne Kıyasla Önlenen Karbon Salınımı:</span>
            <span className="text-white-50" style={{ fontSize: "11px" }}>Doğaya salınması engellenen sera gazı miktarı.</span>
          </div>
          <span className="fw-extrabold text-success font-monospace" style={{ fontSize: "22px" }}>
            {savedCo2 > 0 ? `+${savedCo2.toFixed(1)}` : savedCo2.toFixed(1)} ton CO₂
          </span>
        </div>

        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex flex-column">
            <span className="text-white" style={{ fontSize: "13px", fontWeight: "600" }}>Doğal Denge Karşılığı (Ağaç Eşdeğeri):</span>
            <span className="text-white-50" style={{ fontSize: "11px" }}>Bu tasarruf, her yıl kaç yetişkin ağacın yaptığı karbon temizliğine eşdeğerdir?</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: "24px" }}>🌳</span>
            <span className="fw-extrabold text-info font-monospace" style={{ fontSize: "22px" }}>
              ~ {Math.round(equivalentTrees).toLocaleString()} Ağaç
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}

export default KarbonAyakiziTablosu;