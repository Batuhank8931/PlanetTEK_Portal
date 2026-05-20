import React from "react";

function SelectEquiptments({ data, updateData }) {
  const handleCheckboxChange = (e) => {
    updateData({ ...data, [e.target.name]: e.target.checked });
  };

  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "12px", letterSpacing: "0.5px", color: "#e0f2f1" }}>
          Adım 3: Opsiyonel / Ekstra Ekipman Seçimi
        </span>
        <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.2)" }}></div>
      </div>

      <p className="text-white-50 mb-3" style={{ fontSize: "12px" }}>Teklife dahil edilmesini istediğiniz yan donanımları işaretleyin:</p>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="form-check form-switch p-3 rounded" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <input className="form-check-input ms-0 me-2" type="checkbox" name="jenerator" checked={data.jenerator} onChange={handleCheckboxChange} id="sw1" />
            <label className="form-check-label text-white fw-medium" htmlFor="sw1">Yedek Güç Jeneratörü</label>
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-check form-switch p-3 rounded" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <input className="form-check-input ms-0 me-2" type="checkbox" name="kablo" checked={data.kablo} onChange={handleCheckboxChange} id="sw2" />
            <label className="form-check-label text-white fw-medium" htmlFor="sw2">Güç ve Otomasyon Kabloları</label>
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-check form-switch p-3 rounded" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <input className="form-check-input ms-0 me-2" type="checkbox" name="pano" checked={data.pano} onChange={handleCheckboxChange} id="sw3" />
            <label className="form-check-label text-white fw-medium" htmlFor="sw3">PLC Ana Dağıtım Panosu</label>
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-check form-switch p-3 rounded" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <input className="form-check-input ms-0 me-2" type="checkbox" name="testCihazi" checked={data.testCihazi} onChange={handleCheckboxChange} id="sw4" />
            <label className="form-check-label text-white fw-medium" htmlFor="sw4">Laboratuvar & Test Kitleri</label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectEquiptments;