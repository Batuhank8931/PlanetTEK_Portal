import React from "react";

function FiyatlarPage() {
  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1"><i className="bi bi-tags me-2 text-primary"></i>Fiyatlar</h2>
          <p className="text-muted small mb-0">Sistem genelindeki standart lisans ve donanım birim fiyatlandırmaları</p>
        </div>
        <button className="btn btn-primary px-4 py-2 shadow-sm fw-semibold">Değişiklikleri Kaydet</button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <div className="row g-4">
            <div className="col-md-6">
              <label className="form-label fw-semibold text-secondary">Yazılım Lisans Bedeli (Yıllık)</label>
              <div className="input-group">
                <input type="text" className="form-control py-2" defaultValue="25.000" />
                <span className="input-group-text bg-light fw-bold">₺</span>
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold text-secondary">Entegrasyon Donanım Birim Maliyeti</label>
              <div className="input-group">
                <input type="text" className="form-control py-2" defaultValue="4.500" />
                <span className="input-group-text bg-light fw-bold">₺</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FiyatlarPage;