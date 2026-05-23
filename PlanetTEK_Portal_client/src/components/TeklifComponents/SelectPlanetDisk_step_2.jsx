import React from "react";
import InputColumn from "./PlanetdiskColumns/InputColumn";
import DiskDetail from "./PlanetdiskColumns/DiskDetail";

function SelectPlanetDisk({ data, updateData }) {
  // Kişi sayısı yöntemi seçildiğinde bilgi amaçlı toplam kişi sayısını da alalım
  const getToplamKisi = () => {
    if (data.hesapYontemi === "kisi" && data.kaynaklar) {
      return data.kaynaklar.reduce((acc, k) => acc + (Number(k.kisiSayisi) || 0), 0);
    }
    return 0;
  };

  return (
    <div className="container-fluid p-0" style={{ minHeight: "100vh" }}>

      {/* ÜST SATIR: 3'LÜ MODÜLER KOLON YAPISI */}
      <div className="row g-3 mb-4">
        <div className="col-xl-6 col-lg-6">
          <InputColumn data={data} updateData={updateData} />
        </div>
        <div className="col-xl-6 col-lg-6">
          <DiskDetail data={data} updateData={updateData} />
        </div>
      </div>

    </div>
  );
}

export default SelectPlanetDisk;