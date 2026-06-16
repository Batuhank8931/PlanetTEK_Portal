import React, { useState } from "react";
import ExcelGrid from "./ExcelGrid";

function Izgara() {
  const [izgaraData, setIzgaraData] = useState([
    { id: 1, kapasite: "-", plakaYd: 126, plakaYi: 107, mKabaYd: 912, mKabaYi: 866, mInceYd: 958, mInceYi: 910, oKabaYd: 15224, oKabaYi: 14463, oInceYd: 15833, oInceYi: 15042 },
    { id: 2, kapasite: "100 m³/gün", plakaYd: 126, plakaYi: 107, mKabaYd: 912, mKabaYi: 866, mInceYd: 958, mInceYi: 910, oKabaYd: 16916, oKabaYi: 16070, oInceYd: 17593, oInceYi: 16713 },
    { id: 3, kapasite: "200 m³/gün", plakaYd: 186, plakaYi: 158, mKabaYd: 912, mKabaYi: 866, mInceYd: 958, mInceYi: 910, oKabaYd: 18796, oKabaYi: 17856, oInceYd: 19547, oInceYi: 18570 },
    { id: 4, kapasite: "300 m³/gün (A)", plakaYd: 186, plakaYi: 158, mKabaYd: 1635, mKabaYi: 1553, mInceYd: 1717, mInceYi: 1631, oKabaYd: 20884, oKabaYi: 19840, oInceYd: 21719, oInceYi: 20633 },
    { id: 5, kapasite: "300 m³/gün (B)", plakaYd: 186, plakaYi: 158, mKabaYd: 1635, mKabaYi: 1553, mInceYd: 1717, mInceYi: 1631, oKabaYd: 20884, oKabaYi: 19840, oInceYd: 21719, oInceYi: 20633 },
    { id: 6, kapasite: "400 m³/gün (A)", plakaYd: 272, plakaYi: 231, mKabaYd: 1635, mKabaYi: 1553, mInceYd: 1717, mInceYi: 1631, oKabaYd: 20884, oKabaYi: 19840, oInceYd: 21719, oInceYi: 20633 },
    { id: 7, kapasite: "400 m³/gün (B)", plakaYd: 272, plakaYi: 231, mKabaYd: 1635, mKabaYi: 1553, mInceYd: 1717, mInceYi: 1631, oKabaYd: 20884, oKabaYi: 19840, oInceYd: 21719, oInceYi: 20633 },
    { id: 8, kapasite: "500 m³/gün", plakaYd: 372, plakaYi: 316, mKabaYd: 2204, mKabaYi: 2094, mInceYd: 2314, mInceYi: 2198, oKabaYd: 26412, oKabaYi: 25091, oInceYd: 27468, oInceYi: 26095 },
    { id: 9, kapasite: "600 m³/gün (A)", plakaYd: 372, plakaYi: 316, mKabaYd: 2204, mKabaYi: 2094, mInceYd: 2314, mInceYi: 2198, oKabaYd: 26412, oKabaYi: 25091, oInceYd: 27468, oInceYi: 26095 },
    { id: 10, kapasite: "600 m³/gün (B)", plakaYd: 480, plakaYi: 408, mKabaYd: 2204, mKabaYi: 2094, mInceYd: 2314, mInceYi: 2198, oKabaYd: 26412, oKabaYi: 25091, oInceYd: 27468, oInceYi: 26095 },
    { id: 11, kapasite: "700 m³/gün", plakaYd: 480, pyKa: 408, mKabaYd: 2204, mKabaYi: 2094, mInceYd: 2314, mInceYi: 2198, oKabaYd: 26412, oKabaYi: 25091, oInceYd: 27468, oInceYi: 26095 },
    { id: 12, kapasite: "800 m³/gün", plakaYd: 560, plakaYi: 476, mKabaYd: 4150, mKabaYi: 3943, mInceYd: 4358, mInceYi: 4140, oKabaYd: 33410, oKabaYi: 31740, oInceYd: 34746, oInceYi: 33009 },
    { id: 13, kapasite: "900 m³/gün", plakaYd: 560, plakaYi: 476, mKabaYd: 4150, mKabaYi: 3943, mInceYd: 4358, mInceYi: 4140, oKabaYd: 33410, oKabaYi: 31740, oInceYd: 34746, oInceYi: 33009 },
    { id: 14, kapasite: "Özel Kapasite", plakaYd: 176, plakaYi: 129, mKabaYd: 4150, mKabaYi: 3943, mInceYd: 4358, mInceYi: 4140, oKabaYd: 33410, oKabaYi: 31740, oInceYd: 34746, oInceYi: 33009 },
    { id: 15, kapasite: "Alternatif Kademe", plakaYd: 372, plakaYi: 316, mKabaYd: 2204, mKabaYi: 2094, mInceYd: 2314, mInceYi: 2198, oKabaYd: 26412, oKabaYi: 25091, oInceYd: 27468, oInceYi: 26095 }
  ]);

  // Başlıklar ve veri anahtarları (fields) eşleşmesi
  const headers = [
    "Kapasite", 
    "Yağ Tutucu YD", "Yağ Tutucu YI", 
    "M. Kaba YD", "M. Kaba YI", 
    "M. İnce YD", "M. İnce YI", 
    "Oto Kaba YD", "Oto Kaba YI", 
    "Oto İnce YD", "Oto İnce YI"
  ];

  const fields = [
    "plakaYd", "plakaYi", 
    "mKabaYd", "mKabaYi", 
    "mInceYd", "mInceYi", 
    "oKabaYd", "oKabaYi", 
    "oInceYd", "oInceYi"
  ];

  const handleSave = () => {
    alert("Kapasite & Izgara matrisi başarıyla güncellendi.");
    console.log("Kaydedilen Izgara Verisi:", izgaraData);
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
        data={izgaraData} 
        fields={fields} 
        onDataChange={setIzgaraData} 
      />
    </div>
  );
}

export default Izgara;