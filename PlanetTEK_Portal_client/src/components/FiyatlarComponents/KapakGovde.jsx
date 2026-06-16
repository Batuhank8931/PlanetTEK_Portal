import React, { useState } from "react";
import ExcelGrid from "./ExcelGrid";

function KapakGovde() {
  const [paslanmazData, setPaslanmazData] = useState([
    { id: "ss304_mil", ad: "SS304 MİL", fiyat: 3690 },
    { id: "ss304_ayna", ad: "SS304 AYNA / ROTOR", fiyat: 0 },
    { id: "ss304_sase", ad: "SS304 ŞASE", fiyat: 0 }
  ]);

  const [kapakGovdeData, setKapakGovdeData] = useState([
    { id: "yi_kapak", grup: "Yurt İçi (Yİ)", ad: "KAPAK", fiyat: 1390 },
    { id: "yi_sase", grup: "Yurt İçi (Yİ)", ad: "GÖVDE-ŞASE", fiyat: 5393 },
    { id: "yi_mini", grup: "Yurt İçi (Yİ)", ad: "MİNİ KAPAK", fiyat: 688 },
    { id: "yd_kapak", grup: "Yurt Dışı (YD)", ad: "KAPAK", fiyat: 1390 },
    { id: "yd_sase", grup: "Yurt Dışı (YD)", ad: "GÖVDE-ŞASE", fiyat: 5954 },
    { id: "yd_mini", grup: "Yurt Dışı (YD)", ad: "MİNİ KAPAK", fiyat: 757 }
  ]);

  // --- Birinci Grid için Sütun Konfigürasyonu ---
  const paslanmazHeaders = ["Malzeme / Bölüm", "Birim Fiyat (€)"];
  const paslanmazFields = ["fiyat"];

  // --- İkinci Grid için Dinamik İsim Dönüşümü ve Sütun Konfigürasyonu ---
  const kapakGovdeHeaders = ["Grup & Opsiyon Adı", "Birim Fiyat (€)"];
  const kapakGovdeFields = ["fiyat"];

  // ExcelGrid'in ilk sütunda 'ad' alanını göstermesi için map'liyoruz, 
  // önüne şık bir grup etiketi ekleyerek okunabilirliği koruyoruz.
  const mappedKapakGovdeData = kapakGovdeData.map(item => ({
    ...item,
    ad: `[${item.grup}] ${item.ad}`
  }));

  // ExcelGrid'den gelen güncellemeyi orijinal state yapısına geri yazan fonksiyon
  const handleKapakGovdeChange = (updatedMappedData) => {
    setKapakGovdeData(updatedMappedData.map(item => {
      // Baştaki grup etiketini kaldırıp orijinal temiz 'ad' alanını kurtaralım
      const originalAd = item.ad.replace(/^\[.*?\]\s*/, "");
      return {
        ...item,
        ad: originalAd
      };
    }));
  };

  const handleSave = () => {
    alert("Paslanmaz & Kapak-Gövde opsiyonları başarıyla güncellendi.");
    console.log("Kaydedilen Veriler:", { paslanmazData, kapakGovdeData });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-success btn-sm px-4" onClick={handleSave}>
          <i className="bi bi-save me-2"></i>Kaydet
        </button>
      </div>

      <div className="row g-4">
        {/* SOL TABLO: PASLANMAZ DEĞİŞİMİ */}
        <div className="col-12 col-md-6">
          <div className="p-3 mb-2 rounded bg-dark fw-bold text-white border-bottom" style={{ borderColor: "#334155" }}>
            Paslanmaz Değişimi
          </div>
          <ExcelGrid
            headers={paslanmazHeaders}
            data={paslanmazData}
            fields={paslanmazFields}
            onDataChange={setPaslanmazData}
          />
        </div>

        {/* SAĞ TABLO: KAPAK & GÖVDE OPSİYONLARI */}
        <div className="col-12 col-md-6">
          <div className="p-3 mb-2 rounded bg-dark fw-bold text-white border-bottom" style={{ borderColor: "#334155" }}>
            Kapak &amp; Gövde Opsiyonları
          </div>
          <ExcelGrid
            headers={kapakGovdeHeaders}
            data={mappedKapakGovdeData}
            fields={kapakGovdeFields}
            onDataChange={handleKapakGovdeChange}
          />
        </div>
      </div>
    </div>
  );
}

export default KapakGovde;