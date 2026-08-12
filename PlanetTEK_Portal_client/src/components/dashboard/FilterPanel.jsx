import React from "react";

function FilterPanel({
  filters,
  handleFilterChange,
  handleResetFilters,
  showAdvancedFilters,
  setShowAdvancedFilters
}) {
  return (
    <div className="p-3 rounded mb-3" style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-bold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#00874e" }}>
          <i className="bi bi-funnel-fill me-1"></i> Gelişmiş Çoklu Süzme & Arama Panel
        </span>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-light py-0 px-2"
            style={{ fontSize: "10.5px" }}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <i className={`bi bi-${showAdvancedFilters ? "chevron-up" : "sliders"} me-1`}></i>
            {showAdvancedFilters ? "Detaylı Filtreleri Gizle" : "Tüm Kolon Filtrelerini Aç"}
          </button>
          <button
            className="btn btn-sm btn-outline-warning py-0 px-2"
            style={{ fontSize: "10.5px" }}
            onClick={handleResetFilters}
          >
            <i className="bi bi-arrow-counterclockwise me-1"></i> Sıfırla
          </button>
        </div>
      </div>

      {/* Hızlı Arama Satırı */}
      <div className="row g-2 mb-2">
        <div className="col-md-3 col-12">
          <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Genel Arama (Hepsinde)</label>
          <input
            type="text"
            className="form-control form-control-sm text-white border-0 custom-dark-input"
            style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "11px" }}
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            placeholder="Teklif No, Müşteri, Durum..."
          />
        </div>
        <div className="col-md-2 col-6">
          <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Teklif Durumu</label>
          <select
            className="form-select form-select-sm bg-dark text-white border-0"
            style={{ height: "28px", fontSize: "11px" }}
            value={filters.offer_status}
            onChange={(e) => handleFilterChange("offer_status", e.target.value)}
          >
            <option value="">Tüm Durumlar</option>
            <option value="beklemede">Beklemede</option>
            <option value="gönderildi">Gönderildi</option>
            <option value="onaylandı">Onaylandı</option>
            <option value="olumsuz">Olumsuz</option>
            <option value="revize edildi">Revize Edildi</option>
          </select>
        </div>
        <div className="col-md-2 col-6">
          <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Teklif No / Kodu</label>
          <input
            type="text"
            className="form-control form-control-sm text-white border-0 custom-dark-input"
            style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "11px" }}
            value={filters.offer_number}
            onChange={(e) => handleFilterChange("offer_number", e.target.value)}
            placeholder="Örn: PLN R0..."
          />
        </div>
        <div className="col-md-3 col-6">
          <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Ticari Ünvan</label>
          <input
            type="text"
            className="form-control form-control-sm text-white border-0 custom-dark-input"
            style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "11px" }}
            value={filters.ticari_unvan}
            onChange={(e) => handleFilterChange("ticari_unvan", e.target.value)}
            placeholder="Firma adı..."
          />
        </div>
        <div className="col-md-2 col-6">
          <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Hazırlayan Kullanıcı</label>
          <input
            type="text"
            className="form-control form-control-sm text-white border-0 custom-dark-input"
            style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "11px" }}
            value={filters.hazirlayan_kullanici}
            onChange={(e) => handleFilterChange("hazirlayan_kullanici", e.target.value)}
            placeholder="İsim soyisim..."
          />
        </div>
      </div>

      {/* Detaylı Filtre Seçenekleri Panel */}
      {showAdvancedFilters && (
        <div className="pt-2 mt-2 border-top border-secondary animate__animated animate__fadeIn">
          <div className="row g-2">
            <div className="col-md-3 col-6">
              <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Başlangıç Tarihi</label>
              <input
                type="date"
                className="form-control form-control-sm text-white border-0 text-center"
                style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "10.5px" }}
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div className="col-md-3 col-6">
              <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Bitiş Tarihi</label>
              <input
                type="date"
                className="form-control form-control-sm text-white border-0 text-center"
                style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "10.5px" }}
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>

            <div className="col-md-3 col-6">
              <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Min Debi (m³/g)</label>
              <input
                type="number"
                className="form-control form-control-sm text-white border-0 text-center custom-dark-input"
                style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "11px" }}
                value={filters.min_debi}
                onChange={(e) => handleFilterChange("min_debi", e.target.value)}
                placeholder="Min"
              />
            </div>
            <div className="col-md-3 col-6">
              <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Max Debi (m³/g)</label>
              <input
                type="number"
                className="form-control form-control-sm text-white border-0 text-center custom-dark-input"
                style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "11px" }}
                value={filters.max_debi}
                onChange={(e) => handleFilterChange("max_debi", e.target.value)}
                placeholder="Max"
              />
            </div>

            <div className="col-md-2 col-6">
              <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Atıksu Tipi</label>
              <select
                className="form-select form-select-sm bg-dark text-white border-0"
                style={{ height: "28px", fontSize: "11px" }}
                value={filters.atiksutype}
                onChange={(e) => handleFilterChange("atiksutype", e.target.value)}
              >
                <option value="">Tümü</option>
                <option value="Evsel">Evsel</option>
                <option value="Endüstriyel">Endüstriyel</option>
              </select>
            </div>

            <div className="col-md-2 col-6">
              <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Hesap Yöntemi</label>
              <select
                className="form-select form-select-sm bg-dark text-white border-0"
                style={{ height: "28px", fontSize: "11px" }}
                value={filters.hesap_yontemi}
                onChange={(e) => handleFilterChange("hesap_yontemi", e.target.value)}
              >
                <option value="">Tümü</option>
                <option value="Hidrolik">Hidrolik</option>
                <option value="Kişi">Kişi</option>
              </select>
            </div>

            <div className="col-md-2 col-6">
              <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Ünite Model Tipi</label>
              <select
                className="form-select form-select-sm bg-dark text-white border-0"
                style={{ height: "28px", fontSize: "11px" }}
                value={filters.unit_model_type}
                onChange={(e) => handleFilterChange("unit_model_type", e.target.value)}
              >
                <option value="">Tümü</option>
                <option value="MX 1">MX 1</option>
                <option value="MINI">MINI</option>
              </select>
            </div>
            <div className="col-md-2 col-6">
              <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Para Birimi</label>
              <select
                className="form-select form-select-sm bg-dark text-white border-0"
                style={{ height: "28px", fontSize: "11px" }}
                value={filters.currency}
                onChange={(e) => handleFilterChange("currency", e.target.value)}
              >
                <option value="">Tümü</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="TRY">TRY (₺)</option>
              </select>
            </div>

            <div className="col-md-2 col-6">
              <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Teklif Dili</label>
              <select
                className="form-select form-select-sm bg-dark text-white border-0"
                style={{ height: "28px", fontSize: "11px" }}
                value={filters.teklif_dili}
                onChange={(e) => handleFilterChange("teklif_dili", e.target.value)}
              >
                <option value="">Tüm Diller</option>
                <option value="Yerli">Yerli (TR)</option>
                <option value="Yabancı">Yabancı (EN)</option>
              </select>
            </div>

            <div className="col-md-1 col-3">
              <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Min BOİ</label>
              <input
                type="number"
                className="form-control form-control-sm text-white border-0 text-center custom-dark-input"
                style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "11px" }}
                value={filters.min_boi}
                onChange={(e) => handleFilterChange("min_boi", e.target.value)}
                placeholder="Giriş"
              />
            </div>
            <div className="col-md-1 col-3">
              <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Max BOİ</label>
              <input
                type="number"
                className="form-control form-control-sm text-white border-0 text-center custom-dark-input"
                style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "11px" }}
                value={filters.max_boi}
                onChange={(e) => handleFilterChange("max_boi", e.target.value)}
                placeholder="Çıkış"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterPanel;