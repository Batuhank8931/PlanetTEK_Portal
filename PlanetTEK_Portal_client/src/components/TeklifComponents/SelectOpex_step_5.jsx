import React from "react";

function SelectOpex({ data, updateData }) {
  const handleChange = (e) => {
    updateData({ ...data, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "12px", letterSpacing: "0.5px", color: "#e0f2f1" }}>
          Adım 5: OPEX (Yıllık İşletme Giderleri tahmini)
        </span>
        <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.2)" }}></div>
      </div>

      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label mb-1 fw-medium text-white-50">Yıllık Bakım Periyodu (€)</label>
          <input type="number" name="yillikBakim" value={data.yillikBakim} onChange={handleChange} className="form-control form-control-sm border-0 bg-white text-dark" />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label mb-1 fw-medium text-white-50">Tahmini Enerji / Tüketim (€)</label>
          <input type="number" name="enerjiTuketimi" value={data.enerjiTuketimi} onChange={handleChange} className="form-control form-control-sm border-0 bg-white text-dark" />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label mb-1 fw-medium text-white-50">Operasyonel Personel (€)</label>
          <input type="number" name="personelMaliyeti" value={data.personelMaliyeti} onChange={handleChange} className="form-control form-control-sm border-0 bg-white text-dark" />
        </div>
      </div>
    </div>
  );
}

export default SelectOpex;