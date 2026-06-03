import React from "react";
import { useTeklifStore } from "../../../utils/teklifStore"; // Store yolunu kontrol edin

function SludgeDewateringDetail() {
  // Store'dan tüm formData yapısını çekiyoruz
  const formData = useTeklifStore((state) => state.formData);

  // Tarayıcı konsolunda (F12) objeyi detaylı inceleyebilmek için logluyoruz
  console.log("--- TEMA / MERKEZİ STORE JSON AĞACI ---", formData);

  return (
    <div className="p-3 rounded" style={{ backgroundColor: "#0f172a", color: "#fff" }}>
      {/* BAŞLIK */}
      <div className="d-flex align-items-center mb-3">
        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#f59e0b" }}>
          <i className="bi bi-braces me-1.5"></i> 5. Çamur Alanı & Canlı JSON Monitörü
        </span>
        <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.08)" }}></div>
      </div>

      <p className="text-white-50" style={{ fontSize: "11.5px" }}>
        Şu ana kadar adımlardan topladığımız ve utils içindeki koda ihtiyaç duymadan tuttuğumuz anlık <strong>Zustand Cache (JSON)</strong> çıktısı aşağıdadır:
      </p>

      {/* CANLI EKRAZÜSTÜ JSON ÖNİZLEME */}
      <pre 
        className="p-3 rounded text-info font-monospace" 
        style={{ 
          backgroundColor: "#070d19", 
          fontSize: "11px", 
          maxHeight: "350px", 
          overflowY: "auto",
          border: "1px solid rgba(255,255,255,0.05)",
          whiteSpace: "pre-wrap"
        }}
      >
        {JSON.stringify(formData, null, 2)}
      </pre>

      <div className="text-muted mt-2 text-end" style={{ fontSize: "10px" }}>
        ℹ️ <i>Aynı zamanda tarayıcı konsoluna (F12) giderek objeyi interaktif inceleyebilirsiniz.</i>
      </div>
    </div>
  );
}

export default SludgeDewateringDetail;