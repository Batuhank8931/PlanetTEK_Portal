import React from "react";

function LamellaColumn({ data, updateData }) {
  const handleLocalChange = (e) => {
    updateData({ ...data, [e.target.name]: e.target.value });
  };

  return (
    <div className="card border-0 text-white h-100" style={{ backgroundColor: "#1a1c1d", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
      <div className="card-body p-4">
        
        {/* Başlık */}
        <div className="d-flex align-items-center mb-3">
          <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
            3. Lamella Çöktürme
          </span>
          <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
        </div>

        {/* Örnek Seçim Alanları */}
        <div className="p-3 rounded mb-3" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          <div className="mb-3">
            <label className="text-white-50 mb-1" style={{ fontSize: "11px" }}>Lamella Plaka Modeli</label>
            <select 
              name="secilenLamellaModeli" 
              value={data.secilenLamellaModeli || ""} 
              onChange={handleLocalChange} 
              className="form-select form-select-sm bg-dark text-white border-0"
              style={{ fontSize: "12px" }}
            >
              <option value="">Seçiniz...</option>
              <option value="LP-60">Lamella PP LP-60 (60° Eğim)</option>
              <option value="LP-55">Lamella PVC LP-55 (55° Eğim)</option>
            </select>
          </div>

          <div className="row g-2">
            <div className="col-6">
              <label className="text-white-50 mb-1" style={{ fontSize: "11px" }}>Yüzey Alanı (m²)</label>
              <input
                type="number"
                name="lamellaAlan"
                value={data.lamellaAlan || ""}
                onChange={handleLocalChange}
                placeholder="Örn: 24"
                className="form-control form-control-sm bg-dark text-white border-0 text-center fw-bold"
                style={{ fontSize: "12px" }}
              />
            </div>
            <div className="col-6">
              <label className="text-white-50 mb-1" style={{ fontSize: "11px" }}>Yüzey Yükü (m³/m²h)</label>
              <input
                type="number"
                name="lamellaYuk"
                value={data.lamellaYuk || ""}
                onChange={handleLocalChange}
                placeholder="Örn: 1.2"
                className="form-control form-control-sm bg-dark text-white border-0 text-center text-muted"
                style={{ fontSize: "12px" }}
              />
            </div>
          </div>
        </div>

        {/* Bilgi Kutusu */}
        <div className="p-2.5 rounded text-white-50" style={{ backgroundColor: "rgba(56, 189, 248, 0.05)", border: "1px dashed rgba(56, 189, 248, 0.2)", fontSize: "11px" }}>
          <i className="bi bi-info-circle-fill text-info me-1"></i> Hidrolik yüke bağlı olarak çöktürme tankı hacmi ve plaka sayısı buradaki formülle eşleşecek.
        </div>

      </div>
    </div>
  );
}

export default LamellaColumn;