import React, { useState } from "react";

function CalculationPage() {
  return (
    <div className="container-fluid py-4">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-bottom">
          <h5 className="mb-0 text-primary fw-bold">
            <i className="bi bi-calculator me-2"></i>Maliyet Hesaplama Modülü
          </h5>
        </div>
        <div className="card-body p-4">
          <p className="text-muted mb-4">Dönüşüm projesine ait teknik metrikleri girerek anlık maliyet projeksiyonu oluşturun.</p>
          
          <div className="row g-3 align-items-end mb-4">
            <div className="col-md-4">
              <label className="form-label fw-semibold text-secondary">Raf / İstasyon Sayısı</label>
              <input type="number" className="form-control py-2" defaultValue="0" />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold text-secondary">Birim Çarpan Katsayısı</label>
              <input type="number" className="form-control py-2" defaultValue="1.5" step="0.1" />
            </div>
            <div className="col-md-4">
              <button className="btn btn-primary w-100 py-2 fw-semibold">
                Hesaplamayı Çalıştır
              </button>
            </div>
          </div>

          <div className="p-4 border border-success-subtle bg-success-subtle bg-opacity-10 rounded">
            <h6 className="fw-bold text-success-emphasis mb-2">Tahmini Toplam Tutar:</h6>
            <span className="fs-3 text-success fw-bold">0.00 ₺</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalculationPage;