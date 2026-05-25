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
    planetDiskDetails: {},
    equipments: {},
    capexDetails: {},
    opexDetails: {},
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
        return <SelectEquiptments data={formData.planetDiskDetails} updateData={(data) => updateFormData("planetDiskDetails", data)} />;
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
        backgroundColor: "#1a2d3a",
        // Mobilde navbar arkasında kalmasın diye 70px (veya navbar yüksekliğin kadar) boşluk, masaüstünde 0
        paddingTop: window.innerWidth < 768 ? "75px" : "20px"
      }}
    >
      {/* ÜST BAŞLIK */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: "#dee2e6" }}>
        <div>
          <h5 className="mb-1 fw-semibold tracking-tight" style={{ color: "#1a1c1d" }}>
            <i className="bi bi-file-earmark-plus me-2" style={{ color: "#00874e" }}></i > <span style={{ color: "#ffffff" }}>Yeni Teklif Oluştur</span>
          </h5>
          <p className="mb-0" style={{ fontSize: "12px", color: '#6b8aaa' }}>Adım adım teklif parametrelerini belirleyin</p>
        </div>
      </div>

      {/* PROGRESS STEP BAR & AKSİYON BUTONLARI */}
      <div className="card shadow-sm border-0 p-3 mb-4" style={{ backgroundColor: "transparent" }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">

          {/* GERİ BUTONU */}
          <button
            type="button"
            className="btn btn-sm text-white px-3 py-2 fw-semibold d-flex align-items-center"
            onClick={prevStep}
            disabled={currentStep === 1}
            style={{
              borderRadius: "6px",
              backgroundColor: currentStep === 1 ? "transparent" : "#334155",
              border: "1px solid #475569",
              opacity: currentStep === 1 ? 0.4 : 1,
              color: "#e2e8f0",
              fontSize: "13px"
            }}
          >
            <i className="bi bi-arrow-left me-1.5"></i> Geri
          </button>

          {/* ADIMLAR (PROGRESS STEPS) */}
          <div className="d-flex justify-content-around align-items-center flex-grow-1 flex-wrap gap-2 px-md-4">
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              let textColor = "#94a3b8";
              if (isActive) textColor = "#ffffff";
              if (isCompleted) textColor = "#e2e8f0";

              return (
                <div
                  key={step.id}
                  className="d-flex align-items-center"
                  style={{ transition: "all 0.3s" }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-2 text-white shadow-sm"
                    style={{
                      width: "28px", // Yükseklikten kazanmak için hafif küçültüldü
                      height: "28px",
                      backgroundColor: isActive || isCompleted ? "#00874e" : "#475569",
                      fontSize: "12px",
                      fontWeight: isActive ? "600" : "400"
                    }}
                  >
                    {isCompleted ? <i className="bi bi-check-lg"></i> : step.id}
                  </div>
                  <div>
                    <span
                      className={`d-none d-md-inline ${isActive ? "fw-semibold" : "fw-medium"}`}
                      style={{
                        fontSize: "12px",
                        color: textColor,
                        transition: "color 0.3s"
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* İLERİ / BİTİR BUTONU */}
          {currentStep < steps.length ? (
            <button
              type="button"
              className="btn btn-sm text-white px-3 py-2 fw-bold d-flex align-items-center"
              onClick={nextStep}
              style={{ backgroundColor: "#00874e", borderRadius: "6px", border: "none", fontSize: "13px" }}
            >
              İleri <i className="bi bi-arrow-right ms-1.5"></i>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-sm text-dark px-3 py-2 fw-bold border-0 shadow-sm d-flex align-items-center"
              onClick={handleSubmit}
              style={{ backgroundColor: "#eab308", borderRadius: "6px", fontSize: "13px" }}
            >
              <i className="bi bi-check-all me-1.5" style={{ fontSize: "15px" }}></i> Kaydet
            </button>
          )}

        </div>
      </div>

      {/* MERKEZİ DUMMY BİLEŞEN KARTI */}
      <div className="card shadow-sm border-0 mb-4 text-white" style={{ borderRadius: "8px", backgroundColor: "#1a1c1dab" }}>
        {renderStepComponent()}
      </div>

    </div>
  );
}

export default TeklifPage;