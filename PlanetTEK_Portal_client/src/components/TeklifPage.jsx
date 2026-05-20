import React, { useState } from "react";
import SelectCustomer from "./TeklifComponents/SelectCustomer_step_1";
import SelectPlanetDisk from "./TeklifComponents/SelectPlanetDisk_step_2";
import SelectEquiptments from "./TeklifComponents/SelectEquiptments_step_3";
import SelectCapex from "./TeklifComponents/SelectCapex_step_4";
import SelectOpex from "./TeklifComponents/SelectOpex_step_5";
import SelectFinal from "./TeklifComponents/SelectFinal";

function TeklifPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    customerInfo: { ticariUnvan: "", mensei: "Yerli", ulke: "", vergiDairesi: "", vergiNo: "", adres: "" },
    planetDiskDetails: { },
    equipments: { jenerator: false, kablo: false, pano: false, testCihazi: false },
    capexDetails: { insaatMaliyeti: 0, lojistikMaliyeti: 0, gumrukMaliyeti: 0 },
    opexDetails: { yillikBakim: 0, enerjiTuketimi: 0, personelMaliyeti: 0 },
    notlar: ""
  });

  // Adım adları ve ikonları (Gelecekte buraya ekleme/çıkarma yapabilirsin)
  const steps = [
    { id: 1, label: "Müşteri Seçimi", icon: "bi-building" },
    { id: 2, label: "Planet Disk", icon: "bi-disc" },
    { id: 3, label: "Ekipmanlar", icon: "bi-tools" },
    { id: 4, label: "CAPEX", icon: "bi-cash-coin" },
    { id: 5, label: "OPEX", icon: "bi-sliders" },
    { id: 6, label: "Özet & Onay", icon: "bi-check2-circle" }
  ];

  const updateFormData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: data
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    alert("Teklif başarıyla oluşturuldu! Veriler konsolda.");
    console.log("Oluşturulan Teklif Verisi: ", formData);
  };

  // Aktif adımı render eden fonksiyon
  const renderStepComponent = () => {
    switch (currentStep) {
      case 1:
        return <SelectCustomer data={formData.customerInfo} updateData={(data) => updateFormData("customerInfo", data)} />;
      case 2:
        return <SelectPlanetDisk data={formData.planetDiskDetails} updateData={(data) => updateFormData("planetDiskDetails", data)} />;
      case 3:
        return <SelectEquiptments data={formData.equipments} updateData={(data) => updateFormData("equipments", data)} />;
      case 4:
        return <SelectCapex data={formData.capexDetails} updateData={(data) => updateFormData("capexDetails", data)} />;
      case 5:
        return <SelectOpex data={formData.opexDetails} updateData={(data) => updateFormData("opexDetails", data)} />;
      case 6:
        return <SelectFinal formData={formData} onSubmit={handleSubmit} />;
      default:
        return <div>Hatalı Adım</div>;
    }
  };

  return (
    <div
      className="container-fluid pb-4 min-vh-100"
      style={{
        fontSize: "14px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#f4f6f8",
        // Mobilde navbar arkasında kalmasın diye 70px (veya navbar yüksekliğin kadar) boşluk, masaüstünde 0
        paddingTop: window.innerWidth < 768 ? "75px" : "20px"
      }}
    >
      {/* ÜST BAŞLIK */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: "#dee2e6" }}>
        <div>
          <h5 className="mb-1 fw-semibold tracking-tight" style={{ color: "#1a1c1d" }}>
            <i className="bi bi-file-earmark-plus me-2" style={{ color: "#00874e" }}></i>Yeni Teklif Oluştur
          </h5>
          <p className="text-muted mb-0" style={{ fontSize: "12px" }}>Adım adım teklif parametrelerini belirleyin</p>
        </div>
      </div>

      {/* PROGRESS STEP BAR */}
      <div className="card shadow-sm border-0 p-3 mb-4" style={{ borderRadius: "8px" }}>
        <div className="d-flex justify-content-between position-relative align-items-center flex-wrap gap-2">
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div
                key={step.id}
                className="d-flex align-items-center"
                style={{ opacity: isActive || isCompleted ? 1 : 0.5, transition: "all 0.3s" }}
              >
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center me-2 text-white shadow-sm`}
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: isActive || isCompleted ? "#00874e" : "#6c757d",
                    fontSize: "13px"
                  }}
                >
                  {isCompleted ? <i className="bi bi-check-lg"></i> : step.id}
                </div>
                <div>
                  <span className={`fw-medium d-none d-md-inline ${isActive ? "text-dark" : "text-muted"}`} style={{ fontSize: "12px" }}>
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MERKEZİ DUMMY BİLEŞEN KARTI */}
      <div className="card shadow-sm border-0 mb-4 p-4 text-white" style={{ borderRadius: "8px", backgroundColor: "#1a1c1dab" }}>
        {renderStepComponent()}
      </div>

      {/* AKSİYON BUTONLARI */}
      <div className="d-flex justify-content-between align-items-center mt-3 bg-white p-3 rounded shadow-sm border">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary px-4 py-2 fw-semibold"
          onClick={prevStep}
          disabled={currentStep === 1}
          style={{ borderRadius: "6px" }}
        >
          <i className="bi bi-arrow-left me-1"></i> Geri
        </button>

        {currentStep < steps.length ? (
          <button
            type="button"
            className="btn btn-sm text-white px-4 py-2 fw-bold"
            onClick={nextStep}
            style={{ backgroundColor: "#00874e", borderRadius: "6px" }}
          >
            İleri <i className="bi bi-arrow-right ms-1"></i>
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-sm bg-warning text-dark px-4 py-2 fw-bold border-0 shadow-sm"
            onClick={handleSubmit}
            style={{ borderRadius: "6px" }}
          >
            <i className="bi bi-check-all me-1"></i> Teklifi Bitir ve Kaydet
          </button>
        )}
      </div>
    </div>
  );
}

export default TeklifPage;