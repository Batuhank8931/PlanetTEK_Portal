import React, { useState } from "react";

function EnerjiKarsilastirmaTablosu() {
  const [data, setData] = useState({
    planet: { qty: 8, power: 0.37, consumptionFactor: 90, price: 0.13, dailyHours: 24, yearlyDays: 365 },
    blower: { qty: 1, power: 16.0, consumptionFactor: 90, price: 0.13, dailyHours: 24, yearlyDays: 365 },
    pump: { qty: 1, power: 1.5, consumptionFactor: 90, price: 0.13, dailyHours: 4, yearlyDays: 365 },
    maintenanceSaving: 3952
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
    setData({
      ...data,
      [system]: {
        ...data[system],
        [field]: parseFloat(value) || 0
      }
    });
  };

  const getMetrics = (sys) => {
    const totalPower = sys.qty * sys.power;
    const actualPower = totalPower * (sys.consumptionFactor / 100);
    const yearlyCost = actualPower * sys.price * sys.dailyHours * sys.yearlyDays;
    return { totalPower, actualPower, yearlyCost };
  };

  const planetMetrics = getMetrics(data.planet);
  const blowerMetrics = getMetrics(data.blower);
  const pumpMetrics = getMetrics(data.pump);

  const totalActivatedSludgeCost = blowerMetrics.yearlyCost + pumpMetrics.yearlyCost;
  const yearlySaving = totalActivatedSludgeCost - planetMetrics.yearlyCost;
  const tenYearsSaving = yearlySaving * 10;
  const totalGainWithMaintenance = tenYearsSaving + data.maintenanceSaving;

  return (
    <div className="d-flex flex-column gap-3 w-100 text-white">

      <style>{`
        .comp-row { border-bottom: 1px solid #334155; }
        .comp-row:last-child { border-bottom: none; }
        .comp-input { font-size: 12px; box-shadow: none; width: 70px; border-bottom: 1px dashed #475569 !important; }
        .comp-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.08) !important; border-bottom: 1px solid #60a5fa !important; }
        .header-main-title { font-size: 11px; font-weight: 800; letter-spacing: 0.6px; background-color: #090d16; color: #94a3b8; }
        .bg-planet-column { background-color: rgba(217, 119, 6, 0.08); }
        .bg-activated-column { background-color: rgba(22, 163, 74, 0.05); }
      `}</style>

      <div className="d-flex justify-content-end align-items-center">
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
        <div className="d-flex flex-column rounded-3 overflow-hidden" style={{ border: "1px solid #334155", backgroundColor: "#151f32", minWidth: "950px" }}>

          <div className="d-flex text-center border-bottom align-items-stretch" style={{ borderColor: "#334155" }}>
            <div className="p-2 header-main-title text-start ps-3" style={{ width: "31%" }}>SİSTEM BİLEŞENLERİ</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-main-title text-warning" style={{ width: "23%", backgroundColor: "rgba(217, 119, 6, 0.15)" }}>PlanetDISK® Ünitesi</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-main-title text-success" style={{ width: "46%", backgroundColor: "rgba(22, 163, 74, 0.1)" }}>Klasik Aktif Çamur Sistemi (Sarı Alana Kıyasla)</div>
          </div>

          <div className="d-flex text-center border-bottom align-items-stretch fw-bold" style={{ borderColor: "#334155", backgroundColor: "#0f172a", fontSize: "11.5px" }}>
            <div className="p-2 text-start ps-3 text-white-50" style={{ width: "31%" }}>Teknik Parametreler</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-warning bg-planet-column" style={{ width: "23%" }}>Motor Redüktörü</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-success bg-activated-column" style={{ width: "23%" }}>Blower (Körük)</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-success bg-activated-column" style={{ width: "23%" }}>Çamur Besleme Pompası</div>
          </div>

          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2 ps-3 fw-medium text-white-50" style={{ width: "31%", fontSize: "12px" }}>Ünite / Ekipman Adedi</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.planet.qty} onChange={(e) => handleParamChange("planet", "qty", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>Adet</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.blower.qty} onChange={(e) => handleParamChange("blower", "qty", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>Adet</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.pump.qty} onChange={(e) => handleParamChange("pump", "qty", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>Adet</span>
            </div>
          </div>

          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2 ps-3 fw-medium text-white-50" style={{ width: "31%", fontSize: "12px" }}>Birim Motor Gücü (kW)</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "23%" }}>
              <input type="number" step="0.01" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.planet.power} onChange={(e) => handleParamChange("planet", "power", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>kW</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" step="0.1" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.blower.power} onChange={(e) => handleParamChange("blower", "power", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>kW</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" step="0.1" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.pump.power} onChange={(e) => handleParamChange("pump", "power", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>kW</span>
            </div>
          </div>

          <div className="d-flex align-items-stretch comp-row font-monospace text-white" style={{ fontSize: "12px" }}>
            <div className="p-2 ps-3 fw-medium text-white-50 font-sans-serif" style={{ width: "31%" }}>Toplam Kurulu Güç</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-planet-column fw-bold" style={{ width: "23%" }}>{planetMetrics.totalPower.toFixed(2)} kW</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-activated-column fw-bold" style={{ width: "23%" }}>{blowerMetrics.totalPower.toFixed(2)} kW</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-activated-column fw-bold" style={{ width: "23%" }}>{pumpMetrics.totalPower.toFixed(2)} kW</div>
          </div>

          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2 ps-3 fw-medium text-white-50" style={{ width: "31%", fontSize: "12px" }}>Anlık Güç Tüketim Oranı (%)</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.planet.consumptionFactor} onChange={(e) => handleParamChange("planet", "consumptionFactor", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>%</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.blower.consumptionFactor} onChange={(e) => handleParamChange("blower", "consumptionFactor", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>%</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.pump.consumptionFactor} onChange={(e) => handleParamChange("pump", "consumptionFactor", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>%</span>
            </div>
          </div>

          <div className="d-flex align-items-stretch comp-row font-monospace text-white" style={{ fontSize: "12px" }}>
            <div className="p-2 ps-3 fw-medium text-white-50 font-sans-serif" style={{ width: "31%" }}>Kullanılacak Gerçek Net Güç</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-planet-column fw-bold text-warning" style={{ width: "23%" }}>{planetMetrics.actualPower.toFixed(2)} kW</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-activated-column fw-bold text-success" style={{ width: "23%" }}>{blowerMetrics.actualPower.toFixed(2)} kW</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-activated-column fw-bold text-success" style={{ width: "23%" }}>{pumpMetrics.actualPower.toFixed(2)} kW</div>
          </div>

          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2 ps-3 fw-medium text-white-50" style={{ width: "31%", fontSize: "12px" }}>Elektrik Birim Fiyatı (€/kWh)</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "23%" }}>
              <input type="number" step="0.01" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.planet.price} onChange={(e) => handleParamChange("planet", "price", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>€</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" step="0.01" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.blower.price} onChange={(e) => handleParamChange("blower", "price", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>€</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" step="0.01" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.pump.price} onChange={(e) => handleParamChange("pump", "price", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>€</span>
            </div>
          </div>

          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2 ps-3 fw-medium text-white-50" style={{ width: "31%", fontSize: "12px" }}>Günlük Çalışma Süresi (saat)</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.planet.dailyHours} onChange={(e) => handleParamChange("planet", "dailyHours", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>saat</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.blower.dailyHours} onChange={(e) => handleParamChange("blower", "dailyHours", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>saat</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm text-center bg-transparent border-0 text-white fw-bold p-0 comp-input" value={data.pump.dailyHours} onChange={(e) => handleParamChange("pump", "dailyHours", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>saat</span>
            </div>
          </div>

          <div className="d-flex align-items-stretch" style={{ backgroundColor: "#0b1524", borderTop: "2px dashed #475569" }}>
            <div className="p-2.5 ps-3 fw-bold text-white-50 text-uppercase d-flex align-items-center" style={{ width: "31%", fontSize: "11px" }}>Yıllık Tüketim Maliyeti</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2.5 text-center bg-planet-column fw-bold text-warning" style={{ width: "23%", fontSize: "13px" }}>
              {Math.round(planetMetrics.yearlyCost).toLocaleString()} € <span style={{ fontSize: "10px" }} className="text-white-50">/ yıl</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2.5 text-center bg-activated-column fw-bold text-danger" style={{ width: "23%", fontSize: "13px" }}>
              {Math.round(blowerMetrics.yearlyCost).toLocaleString()} € <span style={{ fontSize: "10px" }} className="text-white-50">/ yıl</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2.5 text-center bg-activated-column fw-bold text-danger" style={{ width: "23%", fontSize: "13px" }}>
              {Math.round(pumpMetrics.yearlyCost).toLocaleString()} € <span style={{ fontSize: "10px" }} className="text-white-50">/ yıl</span>
            </div>
          </div>

        </div>
      </div>

      <div className="d-flex flex-column rounded-3 overflow-hidden border p-3 gap-2" style={{ borderColor: "#475569", backgroundColor: "#090d16" }}>

        <div className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <span className="text-white-50" style={{ fontSize: "12.5px" }}>Klasik Sistemlere Kıyasla **Yıllık Enerji Tasarrufu**:</span>
          <span className="fw-bold text-success font-monospace" style={{ fontSize: "14px" }}>
            {Math.round(yearlySaving).toLocaleString()} € / yıl
          </span>
        </div>

        <div className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <span className="text-white-50" style={{ fontSize: "12.5px" }}>Sistem Ömrü Boyunca **10 Yıllık Elektrik Kazancı**:</span>
          <span className="fw-bold text-success font-monospace" style={{ fontSize: "14px" }}>
            {Math.round(tenYearsSaving).toLocaleString()} € / 10 yıl
          </span>
        </div>

        <div className="d-flex flex-column align-items-center justify-content-center p-3 rounded-2 mt-1" style={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="text-white-50 mb-1 fw-medium" style={{ fontSize: "12px", letterSpacing: "0.5px" }}>
            Blower, Difüzör Yenileme ve Bakım Maliyetleri Dahil **Yaklaşık Toplam Tasarruf**
          </span>
          <span className="fw-extrabold text-success font-monospace" style={{ fontSize: "32px", letterSpacing: "1px" }}>
            ~ {Math.round(totalGainWithMaintenance).toLocaleString()} €
          </span>
        </div>

      </div>

    </div>
  );
}

export default EnerjiKarsilastirmaTablosu;