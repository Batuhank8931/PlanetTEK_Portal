import React, { useState } from "react";
import ExcelGrid from "./ExcelGrid";

function Lamella() {
  const [lamellaData, setLamellaData] = useState([
    { id: "yi_ls8", tipi: "Yurt İçi - LS 8", fiyat: 5100 },
    { id: "yi_ls15", tipi: "Yurt İçi - LS 15", fiyat: 6570 },
    { id: "yi_ls30", tipi: "Yurt İçi - LS 30", fiyat: 8015 },
    { id: "yi_ls45", tipi: "Yurt İçi - LS 45", fiyat: 10415 },
    { id: "yd_ls8", tipi: "Yurt Dışı - LS 8", fiyat: 5610 },
    { id: "yd_ls15", tipi: "Yurt Dışı - LS 15", fiyat: 7227 },
    { id: "yd_ls30", tipi: "Yurt Dışı - LS 30", fiyat: 8817 },
    { id: "yd_ls45", tipi: "Yurt Dışı - LS 45", fiyat: 11457 }
  ]);

  // ExcelGrid kolon ve alan eşleştirmeleri
  const headers = ["Lamella Tipi Seçeneği", "Birim Fiyat (€)"];
  const fields = ["fiyat"];

  const handleSave = () => {
    alert("Lamella fiyatları başarıyla güncellendi.");
    console.log("Kaydedilen Lamella Verisi:", lamellaData);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-success btn-sm px-4" onClick={handleSave}>
          <i className="bi bi-file-earmark-excel me-2"></i>Kaydet
        </button>
      </div>

      <div className="row justify-content-start">
        {/* Yarım genişlikte (col-md-6) şık durması için sarmaladık */}
        <div className="col-12 col-md-6">
          <ExcelGrid 
            headers={headers} 
            data={lamellaData} 
            fields={fields} 
            onDataChange={setLamellaData} 
          />
        </div>
      </div>
    </div>
  );
}

export default Lamella;