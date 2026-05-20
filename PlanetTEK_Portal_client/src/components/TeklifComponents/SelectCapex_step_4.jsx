import React from "react";

function SelectCapex({ data, updateData }) {
  const handleChange = (e) => {
    updateData({ ...data, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "12px", letterSpacing: "0.5px", color: "#e0f2f1" }}>
          Adım 4: CAPEX (İlk Yatırım Maliyetleri)
        </span>
        <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.2)" }}></div>
      </div>

      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label mb-1 fw-medium text-white-50">İnşaat Giderleri (€)</label>
          <input type="number" name="insaatMaliyeti" value={data.insaatMaliyeti} onChange={handleChange} className="form-control form-control-sm border-0 bg-white text-dark" />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label mb-1 fw-medium text-white-50">Lojistik / Nakliye (€)</label>
          <input type="number" name="lojistikMaliyeti" value={data.lojistikMaliyeti} onChange={handleChange} className="form-control form-control-sm border-0 bg-white text-dark" />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label mb-1 fw-medium text-white-50">Gümrük & Devreye Alma (€)</label>
          <input type="number" name="gumrukMaliyeti" value={data.gumrukMaliyeti} onChange={handleChange} className="form-control form-control-sm border-0 bg-white text-dark" />
        </div>
      </div>
    </div>
  );
}

export default SelectCapex;