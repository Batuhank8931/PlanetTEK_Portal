import React, { useState } from "react";

import { useTeklifStore } from "../utils/teklifStore"; // Store yolunu kontrol edin

import SelectCustomer from "./TeklifComponents/SelectCustomer_step_1";
import SelectPlanetDisk from "./TeklifComponents/SelectPlanetDisk_step_2";
import SelectEquiptments from "./TeklifComponents/SelectEquiptments_step_3";
import SelectCapex from "./TeklifComponents/SelectCapex_step_4";
import SelectOpex from "./TeklifComponents/SelectOpex_step_5";
import SelectFinal from "./TeklifComponents/SelectFinal";
import SelectionsModal from "./TeklifComponents/SelectionsModal";

function TeklifPage() {
  // 1. Store'dan sadece formData'yı dinliyoruz
  const formData = useTeklifStore((state) => state.formData);

  // 2. Adım takibini tamamen bu ana komponentin lokal state'ine bırakıyoruz
  const [currentStep, setCurrentStep] = useState(1);
  
  // Modal görünürlük state'i
  const [showModal, setShowModal] = useState(false);

  // Sabit adım listesi
  const steps = [
    { id: 1, label: "Müşteri Seçimi", icon: "bi-building" },
    { id: 2, label: "Planet Disk", icon: "bi-disc" },
    { id: 3, label: "Ekipmanlar", icon: "bi-tools" },
    { id: 4, label: "CAPEX", icon: "bi-cash-coin" },
    { id: 5, label: "OPEX", icon: "bi-sliders" },
    { id: 6, label: "Özet & Onay", icon: "bi-check2-circle" }
  ];

  // Adım değiştirme fonksiyonları (Lokal state'i günceller)
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

  // Aktif adımı render eden fonksiyon (Proplar temiz, state lokalden geliyor)
  const renderStepComponent = () => {
    switch (currentStep) {
      case 1: return <SelectCustomer />;
      case 2: return <SelectPlanetDisk />;
      case 3: return <SelectEquiptments />;
      case 4: return <SelectCapex />;
      case 5: return <SelectOpex />;
      case 6: return <SelectFinal onSubmit={handleSubmit} />;
      default: return <div>Hatalı Adım</div>;
    }
  };

  return (
    <div
      className="container-fluid pb-4 min-vh-100"
      style={{
        fontSize: "14px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#1a2d3a",
        paddingTop: window.innerWidth < 768 ? "75px" : "20px"
      }}
    >
      {/* ÜST BAŞLIK */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: "#dee2e6" }}>
        <div>
          <h5 className="mb-1 fw-semibold tracking-tight" style={{ color: "#ffffff" }}>
            <i className="bi bi-file-earmark-plus me-2" style={{ color: "#00874e" }}></i> Yeni Teklif Oluştur
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
                      width: "28px",
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

          {/* SAĞ TARAF: AKSİYON + MODAL BUTON GRUBU */}
          <div className="d-flex align-items-center gap-2">
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

            {/* DÖKÜMAN LOGOLU KÜÇÜK MODAL BUTONU */}
            <button
              type="button"
              className="btn btn-sm text-white py-2 px-2.5 d-flex align-items-center justify-content-center border-0 shadow-sm"
              onClick={() => setShowModal(true)}
              title="Anlık JSON Çıktısı"
              style={{ 
                backgroundColor: "#475569", 
                borderRadius: "6px", 
                fontSize: "14px"
              }}
            >
              <i className="bi bi-file-earmark-code"></i>
            </button>
          </div>

        </div>
      </div>

      {/* MERKEZİ BİLEŞEN KARTI */}
      <div className="card shadow-sm border-0 mb-4 text-white" style={{ borderRadius: "8px", backgroundColor: "#1a1c1dab" }}>
        {renderStepComponent()}
      </div>

      {/* SELECTIONS MODAL */}
      <SelectionsModal show={showModal} onClose={() => setShowModal(false)} />

    </div>
  );
}

export default TeklifPage;