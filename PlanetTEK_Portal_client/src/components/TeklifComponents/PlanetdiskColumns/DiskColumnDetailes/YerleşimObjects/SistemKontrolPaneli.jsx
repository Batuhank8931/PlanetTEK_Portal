import React from "react";

function SistemKontrolPaneli({
  sistemHesabi,
  hrtInputStr,
  handleUniteChange,
  handleSiraChange,
  handleBeklemeSuresiChange
}) {
  return (
    <div className="row g-1 justify-content-center mb-1">
      <div className="col-12">
        <div className="p-2 rounded bg-dark bg-opacity-70" style={{ border: "1px solid rgba(96, 165, 250, 0.15)" }}>
          <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <span className="fw-bold text-white" style={{ fontSize: "12px" }}>
              Genel Sistem Yerleşimi (Toplam)
            </span>
            <span className="badge" style={{ backgroundColor: "#1e293b", color: "#94a3b8", fontSize: "11px", border: "1px solid #334155" }}>
              Toplam: {sistemHesabi.toplamAlan.toFixed(2)} m² — {sistemHesabi.toplamGerekliDisk} Disk
            </span>
          </div>

          <div className="row g-1 align-items-end">
            <div className="col-4">
              <div className="text-white-50 mb-1" style={{ fontSize: "10px", paddingLeft: "2px" }}>Unite:</div>
              <select
                value={sistemHesabi.mevcutUniteSecimi}
                onChange={(e) => handleUniteChange(e.target.value)}
                className="form-select form-select-sm text-white"
                style={{ fontSize: "12px", fontWeight: "bold", paddingLeft: "6px", height: "30px", backgroundColor: "#334155", border: "1px solid #475569" }}
              >
                {sistemHesabi.alternatifUniteler.map(adet => (
                  <option key={adet} value={adet} className="bg-dark">{adet}</option>
                ))}
              </select>
            </div>

            <div className="col-4">
              <div className="text-white-50 mb-1" style={{ fontSize: "10px", paddingLeft: "2px" }}>Sıra:</div>
              <select
                value={sistemHesabi.siraSayisi}
                onChange={(e) => handleSiraChange(e.target.value)}
                className="form-select form-select-sm text-white"
                style={{ fontSize: "12px", fontWeight: "bold", color: "#60a5fa", paddingLeft: "6px", height: "30px", backgroundColor: "#334155", border: "1px solid #475569" }}
              >
                <option value={1} className="bg-dark">1</option>
                <option value={2} className="bg-dark">2</option>
                <option value={3} className="bg-dark">3</option>
              </select>
            </div>

            <div className="col-4">
              <div className="text-white-50 mb-1 text-center" style={{ fontSize: "10px" }}>Min HRT (sa):</div>
              <input
                type="text"
                inputMode="decimal"
                value={hrtInputStr}
                onChange={(e) => handleBeklemeSuresiChange(e.target.value)}
                className="form-control form-control-sm text-center fw-bold"
                style={{ fontSize: "12px", color: "#f59e0b", height: "30px", backgroundColor: "#334155", border: "1px solid #475569" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(SistemKontrolPaneli);