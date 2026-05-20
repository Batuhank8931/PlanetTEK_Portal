import React from "react";

function KullanicilarPage() {
  return (
    <div className="container-fluid py-4">
      <div className="card shadow-sm border-0 mx-auto" style={{ maxWidth: "800px" }}>
        <div className="card-header bg-white py-3 border-bottom">
          <h5 className="mb-0 text-primary fw-bold">
            <i className="bi bi-person-gear me-2"></i>Kullanıcılar ve Sistem Yetkileri
          </h5>
        </div>
        <div className="card-body p-4">
          <div className="mb-4">
            <h6 className="fw-bold mb-1">Mevcut Hesap Bilgileri</h6>
            <p className="text-muted small">Sisteme giriş yaptığınız aktif hesabın yetki ve detayları.</p>
          </div>
          
          <div className="list-group list-group-flush border-top border-bottom mb-4">
            <div className="list-group-item d-flex justify-content-between align-items-center py-3 px-0">
              <div>
                <span className="text-secondary small d-block">E-posta Adresi</span>
                <strong className="text-dark">admin@planettek.com</strong>
              </div>
              <button className="btn btn-sm btn-light border px-3">E-posta Güncelle</button>
            </div>
            
            <div className="list-group-item d-flex justify-content-between align-items-center py-3 px-0">
              <div>
                <span className="text-secondary small d-block">Erişim Rolü</span>
                <span className="badge bg-danger-subtle text-danger px-3 py-2 mt-1 fs-7 fw-semibold">
                  Sistem Yöneticisi (Admin)
                </span>
              </div>
              <i className="bi bi-shield-check text-success fs-4"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KullanicilarPage;

