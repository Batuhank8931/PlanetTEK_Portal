import React from "react";

function KademeKartlari({ kademeKartlariVerisi, openDetailModal }) {
  return (
    <div className="row g-1 mb-2">
      {kademeKartlariVerisi.map((kademe) => (
        <div key={`info-card-${kademe.index}`} className="col">
          <div
            className="p-2 rounded bg-dark bg-opacity-40"
            style={{
              border: kademe.isNitrifikasyon
                ? "1px solid rgba(59, 130, 246, 0.3)"
                : "1px solid rgba(255,255,255,0.05)"
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex flex-column">
                <span
                  className="fw-bold"
                  style={{
                    fontSize: "10px",
                    color: kademe.isNitrifikasyon ? "#60a5fa" : "rgba(255,255,255,0.5)"
                  }}
                >
                  {kademe.görünenAd}
                </span>
                <span className="text-white fw-bold" style={{ fontSize: "12px", marginTop: "1px" }}>
                  {kademe.gerekliAlan.toFixed(2)} m²{" "}
                  <span className="text-white-50 fw-normal" style={{ fontSize: "10px" }}>
                    / {kademe.toplamGerekliDisk} Disk
                  </span>
                </span>
              </div>
              <button
                onClick={() => openDetailModal(kademe.rawKademeVerisi, kademe.görünenAd)}
                className="btn btn-sm p-0 px-2"
                style={{
                  backgroundColor: "#334155",
                  color: "#94a3b8",
                  fontSize: "11px",
                  border: "1px solid #475569",
                  height: "24px",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                ℹ️
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default React.memo(KademeKartlari);