// modals/AlertModal.jsx
import React from "react";

function AlertModal({ show, title, message, type = "success", onClose, onConfirm, showCancel = false }) {
  if (!show) return null;

  const getIconAndColor = () => {
    switch (type) {
      case "error": return { icon: "❌", color: "#f87171", btnBg: "#991b1b" };
      case "warning": return { icon: "⚠️", color: "#fbbf24", btnBg: "#92400e" };
      case "info": return { icon: "ℹ️", color: "#38bdf8", btnBg: "#075985" };
      case "success":
      default: return { icon: "✅", color: "#4ade80", btnBg: "#166534" };
    }
  };

  const config = getIconAndColor();

  return (
    <div 
      className="d-flex align-items-center justify-content-center"
      style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.7)", zIndex: 1055,
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.15s ease-out"
      }}
    >
      <div 
        className="card text-white text-center p-4 border-0"
        style={{
          backgroundColor: "#141617", borderRadius: "16px", width: "90%", maxWidth: "420px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)", border: "1px solid rgba(255, 255, 255, 0.05)"
        }}
      >
        <div className="mb-3" style={{ fontSize: "42px" }}>{config.icon}</div>
        <h5 className="fw-bold mb-2" style={{ color: config.color }}>{title}</h5>
        <p className="text-white-50 mb-4" style={{ fontSize: "13px", lineHeight: "1.5" }}>{message}</p>

        {/* REAKSİYON BUTONLARI */}
        <div className="d-flex gap-2">
          {/* Eğer onay modundaysak İptal butonu gözükecek */}
          {showCancel && (
            <button
              type="button"
              className="btn flex-grow-1 fw-semibold text-white border-0 py-2"
              style={{ backgroundColor: "#334155", fontSize: "13px", borderRadius: "8px" }}
              onClick={onClose}
            >
              Vazgeç
            </button>
          )}
          
          <button
            type="button"
            className="btn flex-grow-1 fw-semibold text-white border-0 py-2"
            style={{ backgroundColor: config.btnBg, fontSize: "13px", borderRadius: "8px" }}
            onClick={showCancel && onConfirm ? onConfirm : onClose}
          >
            {showCancel ? "Evet" : "Tamam"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertModal;