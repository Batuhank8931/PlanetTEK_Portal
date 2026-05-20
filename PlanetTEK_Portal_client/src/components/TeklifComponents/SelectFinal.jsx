import React from "react";

function SelectFinal({ formData, onSubmit }) {
  // Basit bir CAPEX toplam hesaplaması
  const totalCapex = 
    (formData.capexDetails.insaatMaliyeti || 0) + 
    (formData.capexDetails.lojistikMaliyeti || 0) + 
    (formData.capexDetails.gumrukMaliyeti || 0);

  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "12px", letterSpacing: "0.5px", color: "#e0f2f1" }}>
          Son Adım: Bilgileri Kontrol Edin
        </span>
        <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.2)" }}></div>
      </div>

      <div className="row g-3 bg-white text-dark p-3 rounded shadow-sm" style={{ fontSize: "13px" }}>
        <div className="col-md-6 border-end">
          <hdfn className="fw-bold text-success d-block mb-2">Müşteri ve Konfigürasyon</hdfn>
          <p className="mb-1"><strong>Şirket:</strong> {formData.customerInfo.ticariUnvan || "Belirtilmedi"}</p>
          <p className="mb-1"><strong>Ülke:</strong> {formData.customerInfo.ulke || "Belirtilmedi"}</p>
          <p className="mb-1"><strong>Disk Modeli:</strong> {formData.planetDiskDetails.diskTipi}</p>
          <p className="mb-0"><strong>Kapasite:</strong> {formData.planetDiskDetails.kapasite} $m^3$/gün ({formData.planetDiskDetails.adet} Adet)</p>
        </div>

        <div className="col-md-6">
          <hdfn className="fw-bold text-success d-block mb-2">Finansal Özet</hdfn>
          <p className="mb-1"><strong>Toplam Öngörülen CAPEX:</strong> {totalCapex.toLocaleString()} €</p>
          <p className="mb-1">
            <strong>Ekstra Donanımlar:</strong>{" "}
            {Object.keys(formData.equipments)
              .filter((k) => formData.equipments[k])
              .join(", ") || "Seçilmedi"}
          </p>
          <p className="mb-0 text-muted" style={{ fontSize: "11px" }}>"Teklifi Bitir" butonuna basarak onaylayabilirsiniz.</p>
        </div>
      </div>
    </div>
  );
}

export default SelectFinal;