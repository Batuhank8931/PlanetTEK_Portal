import React, { useState } from "react";
import ExcelGrid from "./ExcelGrid";

function DebiDagitim() {
  const [debiDagitimData, setDebiDagitimData] = useState([
    { id: 3, ad: "3 Çıkış", yd: 4715, yi: 4244 },
    { id: 4, ad: "4 Çıkış", yd: 5187, yi: 4668 },
    { id: 5, ad: "5 Çıkış", yd: 5705, yi: 5135 },
    { id: 6, ad: "6 Çıkış", yd: 6276, yi: 5648 },
    { id: 7, ad: "7 Çıkış", yd: 6903, yi: 6213 },
    { id: 8, ad: "8 Çıkış", yd: 7594, yi: 6834 },
    { id: 9, ad: "9 Çıkış", yd: 8353, yi: 7518 },
    { id: 10, ad: "10 Çıkış", yd: 9188, yi: 8269 },
    { id: 11, ad: "11 Çıkış", yd: 10107, yi: 9096 },
    { id: 12, ad: "12 Çıkış", yd: 11118, yi: 10006 },
    { id: 13, ad: "13 Çıkış", yd: 12229, yi: 11007 },
    { id: 14, ad: "14 Çıkış", yd: 13452, yi: 12107 },
    { id: 15, ad: "15 Çıkış", yd: 14798, yi: 13318 },
    { id: 16, ad: "16 Çıkış", yd: 16277, yi: 14650 },
    { id: 17, ad: "2. Sırada Ekstra Çıkış", yd: 5187, yi: 4668 }
  ]);

  // ExcelGrid'in haritayı doğru çizebilmesi için sütun tanımları
  const headers = ["Çıkış Grubu Kademesi", "Yurt Dışı Fiyat (€)", "Yurt İçi Fiyat (€)"];
  const fields = ["yd", "yi"];

  const handleSave = () => {
    alert("Debi Dağıtım (Çıkışlar) matrisi başarıyla güncellendi.");
    console.log("Kaydedilen Debi Dağıtım Verisi:", debiDagitimData);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-success btn-sm px-4" onClick={handleSave}>
          <i className="bi bi-file-earmark-excel me-2"></i>Kaydet
        </button>
      </div>

      <ExcelGrid
        headers={headers}
        data={debiDagitimData}
        fields={fields}
        onDataChange={setDebiDagitimData}
      />
    </div>
  );
}

export default DebiDagitim;