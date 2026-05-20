import React, { useState } from "react";
import DiskDetail from "./DiskColumnDetailes/DiskDetail";
import EmperikDetail from "./DiskColumnDetailes/EmperikDetail";
import KademeDetail from "./DiskColumnDetailes/KademeDetail";

function DiskColumn({ data, updateData }) {
  // Modal görünürlük ve seçili kademe takibi için state'ler
  const [isEmperikOpen, setIsEmperikOpen] = useState(false);
  const [selectedKademeId, setSelectedSelectedKademeId] = useState(null);

  const handleLocalChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = value;
    if (type === "number") {
      parsedValue = value === "" ? "" : Number(value);
    }
    updateData({ ...data, [name]: parsedValue });
  };

  // Grafik butonuna basınca modalı açan tetikleyici fonksiyon
  const openEmperikModal = (id) => {
    setSelectedSelectedKademeId(id);
    setIsEmperikOpen(true);
  };

  return (
    <div className="card border-0 text-white h-100" style={{ backgroundColor: "#1a1c1d", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
      <div className="card-body p-4">

        {/* Başlık Bölümü */}
        <div className="d-flex align-items-center mb-3">
          <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
            2. PlanetDISK Seçimi
          </span>
          <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
        </div>

        {/* Seçim Alanları */}
        <div className="p-2 rounded mb-3" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          <div className="row g-2">
            <div className="col-4">
              <label className="text-white-50 mb-1 d-block text-truncate" style={{ fontSize: "11px" }}>Model / Tipi</label>
              <select
                name="secilenDiskTipi"
                value={data.secilenDiskTipi || ""}
                onChange={handleLocalChange}
                className="form-select form-select-sm bg-dark text-white border-0"
                style={{ fontSize: "12px" }}
              >
                <option value="">Seçiniz...</option>
                <option value="MX">MX</option>
                <option value="MINI">MINI</option>
              </select>
            </div>

            <div className="col-4">
              <label className="text-white-50 mb-1 d-block text-truncate" style={{ fontSize: "11px" }}>Max Disk Adedi</label>
              <input
                type="number"
                name="maxDiskAdedi"
                value={data.maxDiskAdedi !== undefined ? data.maxDiskAdedi : 135}
                onChange={handleLocalChange}
                className="form-control form-control-sm bg-dark text-white border-0 text-center fw-bold"
                style={{ fontSize: "12px" }}
              />
            </div>

            <div className="col-4">
              <label className="text-white-50 mb-1 d-block text-truncate" style={{ fontSize: "11px" }}>Min Disk Adedi</label>
              <input
                type="number"
                name="minDiskAdedi"
                value={data.minDiskAdedi !== undefined ? data.minDiskAdedi : 100}
                onChange={handleLocalChange}
                className="form-control form-control-sm bg-dark text-white border-0 text-center fw-bold"
                style={{ fontSize: "12px" }}
              />
            </div>
          </div>
        </div>

        {/* Yeni Taşınan Arıtma Kademesi Seçimi Paneli */}
        <KademeDetail
          data={data}
          updateData={updateData}
          openEmperikModal={openEmperikModal}
        />

        <DiskDetail data={data} />
      </div>

      {/* Emperik Katsayı Hesaplama Modalı */}
      {isEmperikOpen && (
        <EmperikDetail
          isOpen={isEmperikOpen}
          onClose={() => setIsEmperikOpen(false)}
          activeKademeId={selectedKademeId}
          data={data}
          updateData={updateData}
        />
      )}
    </div>
  );
}

export default DiskColumn;