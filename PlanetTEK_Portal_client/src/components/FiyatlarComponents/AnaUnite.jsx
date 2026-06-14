import React, { useState } from "react";
import ExcelGrid from "./ExcelGrid";

function AnaUnite() {

  const [anaUniteler, setAnaUniteler] = useState([
    { id: "mini", name: "MINI", bYd: 25510, bYi: 25510, pYd: 5813, pYi: 4650, tYd: 3323, tYi: 3157 },
    { id: "1mx1", name: "1 MX 1", bYd: 32036, bYi: 29625, pYd: 6121, pYi: 4897, tYd: 3817, tYi: 3626 },
    { id: "2mx1", name: "2 MX 1", bYd: 32036, bYi: 29625, pYd: 7040, pYi: 5632, tYd: 5321, tYi: 5055 },
    { id: "3mx1", name: "3 MX 1", bYd: 32036, bYi: 29625, pYd: 8363, pYi: 6690, tYd: 6754, tYi: 6417 },
    { id: "4mx1", name: "4 MX 1", bYd: 32036, bYi: 29625, pYd: 9700, pYi: 7760, tYd: 9462, tYi: 8989 },
    { id: "5mx1", name: "5 MX 1", bYd: 32036, bYi: 29625, pYd: 11037, pYi: 8829, tYd: 13142, tYi: 12485 },
    { id: "6mx1", name: "6 MX 1", bYd: 32036, bYi: 29625, pYd: 12374, pYi: 9899, tYd: 17074, tYi: 16220 },
    { id: "7mx1", name: "7 MX 1", bYd: 32036, bYi: 29625, pYd: 14159, pYi: 11327, tYd: 18799, tYi: 17859 },
    { id: "8mx1", name: "8 MX 1", bYd: 32036, bYi: 29625, pYd: 16283, pYi: 13027, tYd: 20671, tYi: 19637 },
    { id: "9mx1", name: "9 MX 1", bYd: 32036, bYi: 29625, pYd: 17912, pYi: 14329, tYd: 22731, tYi: 21594 },
    { id: "10mx1", name: "10 MX 1", bYd: 32036, bYi: 29625, pYd: 20600, pYi: 16480, tYd: 24666, tYi: 23433 },
    { id: "11mx1", name: "11 MX 1", bYd: 32036, bYi: 29625, pYd: 22662, pYi: 18130, tYd: 26579, tYi: 25250 },
    { id: "12mx1", name: "12 MX 1", bYd: 32036, bYi: 29625, pYd: 26059, pYi: 20847, tYd: 28198, tYi: 26788 },
    { id: "13mx1", name: "13 MX 1 VE ÜSTÜ", bYd: 32036, bYi: 29625, pYd: 39492, pYi: 31594, tYd: 34570, tYi: 32841 },
    { id: "opsiyon9", name: "9 (Özel Kademe)", bYd: 32036, bYi: 29625, pYd: 16283, pYi: 13027, tYd: 20671, tYi: 19637 }
  ]);

  const headers = ["Ünite Adı", "PlanetDISK YD (€)", "PlanetDISK YI (€)", "Kontrol Pano YD (€)", "Kontrol Pano YI (€)", "Tüm Tesisat YD (€)", "Tüm Tesisat YI (€)"];
  const fields = ["bYd", "bYi", "pYd", "pYi", "tYd", "tYi"];

  const handleSave = () => {
    alert("Ana Üniteler veritabanına kaydedildi.");
    console.log(anaUniteler);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="text-white fw-bold">Excel Modu: Hücreleri sürükleyerek seçebilir, Excel'den kopyalayıp yapıştırabilirsiniz (Ctrl+C / Ctrl+V).</span>
        <button className="btn btn-success btn-sm px-4" onClick={handleSave}>
          <i className="bi bi-file-earmark-excel me-2"></i>Değişiklikleri Kaydet
        </button>
      </div>
      <ExcelGrid headers={headers} data={anaUniteler} fields={fields} onDataChange={setAnaUniteler} />
    </div>
  );
}

export default AnaUnite;