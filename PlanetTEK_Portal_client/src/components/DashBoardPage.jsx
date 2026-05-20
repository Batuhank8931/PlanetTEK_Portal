import React from "react";

function DashBoardPage() {
  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Ana Sayfa</h2>
          <p className="text-muted small mb-0">Sistem genel özetleri ve performans göstergeleri</p>
        </div>
        <span className="badge bg-primary px-3 py-2 fs-6 shadow-sm">Yönetici Paneli</span>
      </div>
      
      <div className="row g-3">
        <div className="col-md-4">
          <div className="card shadow-sm h-100 border-start border-primary border-4">
            <div className="card-body">
              <h5 className="card-title text-muted text-uppercase small fw-bold">Aktif Teklifler</h5>
              <p className="card-text display-6 fw-bold text-dark">12</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm h-100 border-start border-success border-4">
            <div className="card-body">
              <h5 className="card-title text-muted text-uppercase small fw-bold">Kayıtlı Müşteriler</h5>
              <p className="card-text display-6 fw-bold text-dark">48</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm h-100 border-start border-warning border-4">
            <div className="card-body">
              <h5 className="card-title text-muted text-uppercase small fw-bold">Hesaplama Geçmişi</h5>
              <p className="card-text display-6 fw-bold text-dark">320</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4 shadow-sm border-0">
        <div className="card-body p-4">
          <h5 className="card-title mb-3 fw-bold">Dijital Dönüşüm Yönetimi</h5>
          <p className="text-muted mb-0">
            Teklif süreçlerini, müşteri portföyünü ve dinamik maliyet hesaplamalarını sol menüyü kullanarak yönetebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DashBoardPage;