import React from "react";

function StatsCards({ stats, loading }) {
  const isDanger = (stats?.takip_gerektiren_eski || 0) > 0;

  return (
    <>
      {/* Yanıp Sönme Effect CSS */}
      <style>{`
        @keyframes pulseRed {
          0% {
            box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
            border-color: #dc3545;
          }
          50% {
            box-shadow: 0 0 12px 3px rgba(220, 53, 69, 0.9);
            border-color: #ff4d4d;
          }
          100% {
            box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
            border-color: #dc3545;
          }
        }
        .card-pulse-red {
          animation: pulseRed 1.4s infinite ease-in-out;
          background-color: #2c0b0e !important;
        }
      `}</style>

      <div className="row g-2 mb-3">
        {/* Toplam Teklif */}
        <div className="col-md-2 col-6">
          <div className="p-2 rounded border" style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}>
            <div className="text-white-50" style={{ fontSize: "10px" }}>Toplam Teklif</div>
            <div className="fs-5 fw-bold text-white">
              {loading ? "..." : (stats?.toplam || 0)}
            </div>
          </div>
        </div>

        {/* Beklemede */}
        <div className="col-md-2 col-6">
          <div className="p-2 rounded border" style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}>
            <div className="text-warning" style={{ fontSize: "10px" }}>
              <i className="bi bi-clock me-1"></i>Beklemede
            </div>
            <div className="fs-5 fw-bold text-warning">
              {loading ? "..." : (stats?.beklemede || 0)}
            </div>
          </div>
        </div>

        {/* Gönderildi */}
        <div className="col-md-2 col-6">
          <div className="p-2 rounded border" style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}>
            <div className="text-info" style={{ fontSize: "10px" }}>
              <i className="bi bi-send me-1"></i>Gönderildi
            </div>
            <div className="fs-5 fw-bold text-info">
              {loading ? "..." : (stats?.gonderildi || 0)}
            </div>
          </div>
        </div>

        {/* 🚨 KRİTİK: 30 Günden Eski Gönderilenler (Acil Takip) */}
        <div className="col-md-2 col-6">
          <div
            className={`p-2 rounded border ${isDanger ? "card-pulse-red text-white" : ""}`}
            style={{ backgroundColor: "#0f172a", borderColor: "#1e293b", transition: "all 0.3s" }}
          >
            <div className={isDanger ? "text-danger fw-bold" : "text-white-50"} style={{ fontSize: "10px" }}>
              <i className="bi bi-exclamation-triangle-fill me-1 text-danger"></i>
              Takip Gerektiren (&gt;30 Gün)
            </div>
            <div className={`fs-5 fw-bold ${isDanger ? "text-danger" : "text-white"}`}>
              {loading ? "..." : (stats?.takip_gerektiren_eski || 0)}
            </div>
          </div>
        </div>

        {/* Onaylandı */}
        <div className="col-md-2 col-6">
          <div className="p-2 rounded border" style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}>
            <div className="text-success" style={{ fontSize: "10px" }}>
              <i className="bi bi-check-circle me-1"></i>Onaylandı
            </div>
            <div className="fs-5 fw-bold text-success">
              {loading ? "..." : (stats?.onaylandi || 0)}
            </div>
          </div>
        </div>

        {/* Olumsuz */}
        <div className="col-md-2 col-6">
          <div className="p-2 rounded border" style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}>
            <div className="text-secondary" style={{ fontSize: "10px" }}>
              <i className="bi bi-x-circle me-1"></i>Olumsuz / İptal
            </div>
            <div className="fs-5 fw-bold text-secondary">
              {loading ? "..." : (stats?.olumsuz || 0)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default StatsCards;