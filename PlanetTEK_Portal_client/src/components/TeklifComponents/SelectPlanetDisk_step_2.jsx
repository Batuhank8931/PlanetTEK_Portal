import React from "react";
import InputColumn from "./PlanetdiskColumns/InputColumn";
import DiskDetail from "./PlanetdiskColumns/DiskDetail";

function SelectPlanetDisk() {
  // Kişi sayısı yöntemi seçildiğinde bilgi amaçlı toplam kişi sayısını da alalım

  return (
    <div className="container-fluid p-0" style={{ minHeight: "100vh" }}>

      {/* ÜST SATIR: 3'LÜ MODÜLER KOLON YAPISI */}
      <div className="row g-3 mb-4">
        <div className="col-xl-6 col-lg-6">
          <InputColumn/>
        </div>
        <div className="col-xl-6 col-lg-6">
          <DiskDetail/>
        </div>
      </div>

    </div>
  );
}

export default SelectPlanetDisk;