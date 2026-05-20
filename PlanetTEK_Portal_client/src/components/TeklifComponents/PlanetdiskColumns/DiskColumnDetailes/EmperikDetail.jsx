import React from "react";

function EmperikDetail({ isOpen, onClose, activeKademeId, data, updateData }) {
  if (!isOpen) return null;

  // Üst bileşenden gelen verileri güvenli bir şekilde alalım
  const sicaklik = data?.sicaklik || "Belirtilmemiş";
  const cikisBoi = data?.cikisBoi || 0;

  console.log(data);

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
      style={{ 
        backgroundColor: "rgba(0, 0, 0, 0.6)", 
        zIndex: 1050,
        backdropFilter: "blur(2px)" 
      }}
    >
      <div 
        className="card text-white border-0" 
        style={{ 
          backgroundColor: "#1e293b", 
          border: "1px solid #334155", 
          borderRadius: "12px",
          width: "90%",
          maxWidth: "400px",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)"
        }}
      >
        {/* Modal Başlık Kısmı */}
        <div className="card-header border-0 d-flex justify-content-between align-items-center pt-3 px-3 pb-0 bg-transparent">
          <span className="fw-bold text-uppercase" style={{ fontSize: "12px", letterSpacing: "0.5px", color: "#38bdf8" }}>
            📊 Emperik Katsayı Detayı
          </span>
          <button 
            type="button" 
            className="btn-close btn-close-white p-0 m-0" 
            style={{ fontSize: "12px", boxShadow: "none" }}
            onClick={onClose}
          ></button>
        </div>

        <hr className="my-2 opacity-10" />

        {/* Modal İçerik Kısmı */}
        <div className="card-body p-3" style={{ fontSize: "13px" }}>
          
          <div className="p-2 rounded bg-dark bg-opacity-20 border border-secondary border-opacity-10">
            <div className="d-flex justify-content-between mb-1">
              <span className="text-white-50">Sıcaklık:</span>
              <span className="fw-bold text-info">{sicaklik} °C</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-white-50">Çıkış BOİ:</span>
              <span className="fw-bold text-success">{cikisBoi} mg/L</span>
            </div>
          </div>

          <div className="text-muted text-center mt-3" style={{ fontSize: "11px" }}>
            Formül ve hesaplama adımları için hazır.
          </div>
        </div>

        {/* Modal Kapatma Butonu */}
        <div className="card-footer border-0 d-flex justify-content-end p-2 bg-transparent">
          <button 
            type="button" 
            className="btn btn-sm px-3 text-white border-0" 
            style={{ backgroundColor: "#475569", fontSize: "11px", borderRadius: "6px" }}
            onClick={onClose}
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
}

export default EmperikDetail;