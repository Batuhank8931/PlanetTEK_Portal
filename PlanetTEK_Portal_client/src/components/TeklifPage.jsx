import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTeklifStore } from "../utils/teklifStore";
import AlertModal from "./modals/AlertModal";
import API from "../utils/utilRequest";

import SelectCustomer from "./TeklifComponents/SelectCustomer_step_1";
import SelectPlanetDisk from "./TeklifComponents/SelectPlanetDisk_step_2";
import SelectEquiptments from "./TeklifComponents/SelectEquiptments_step_3";
import SelectTables from "./TeklifComponents/SelectTables_step_4";
import SelectFinal from "./TeklifComponents/SelectFinal";
import SelectionsModal from "./TeklifComponents/SelectionsModal";

function TeklifPage() {
  const formData = useTeklifStore((state) => state.formData);
  const currentStep = useTeklifStore((state) => state.currentStep);
  const setCurrentStepStore = useTeklifStore((state) => state.setCurrentStepStore);
  const resetForm = useTeklifStore((state) => state.resetForm);

  const [showModal, setShowModal] = useState(false);
  const [direction, setDirection] = useState(1);

  // 🌟 Form sıfırlandığında alt bileşenleri yeniden mount etmek için key state'i
  const [resetKey, setResetKey] = useState(0);

  const [alertConfig, setAlertConfig] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
    showCancel: false,
    action: null
  });

  const steps = [
    { id: 1, label: "Müşteri Seçimi", icon: "bi-building" },
    { id: 2, label: "Planet Disk", icon: "bi-disc" },
    { id: 3, label: "Ekipmanlar", icon: "bi-tools" },
    { id: 4, label: "Tablolar", icon: "bi-cash-coin" },
    { id: 5, label: "Özet & Onay", icon: "bi-check2-circle" }
  ];

  const handleStepClick = (targetStepId) => {
    if (targetStepId === currentStep) return;
    const nextDirection = targetStepId > currentStep ? 1 : -1;
    setDirection(nextDirection);
    setCurrentStepStore(targetStepId);
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setDirection(1);
      setCurrentStepStore(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStepStore(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    setAlertConfig({
      show: true,
      title: "İşlem Tamamlandı",
      message: "Teklif başarıyla oluşturuldu!",
      type: "success",
      showCancel: false,
      action: null
    });
  };

  const handleResetForm = () => {
    console.log(formData.customerInfo.teklifNo)

    setAlertConfig({
      show: true,
      title: "Formu Sıfırla",
      message: "Formdaki tüm verileri sıfırlamak istediğinize emin misiniz?",
      type: "warning",
      showCancel: true,
      action: async () => {
        const currentTeklifNo = formData?.customerInfo?.teklifNo;

        // 🔒 Form sıfırlanmadan önce rezerve edilen teklif numarasını tablodan siliyoruz
        if (currentTeklifNo) {
          try {
            await API.unSetOfferNumber(currentTeklifNo);
          } catch (err) {
            console.error("Teklif numarası rezerve iptali başarısız oldu:", err);
          }
        }

        resetForm();
        setResetKey((prev) => prev + 1); // 🌟 Sıfırlama yapılınca key değiştirilip component refresh edilir
        setAlertConfig((prev) => ({ ...prev, show: false }));
      }
    });
  };



  const isFormDataNotEmpty = formData && Object.keys(formData).length > 0;

  // 🌟 Her bileşene resetKey ile tanımlama yapıyoruz
  const renderStepComponent = () => {
    switch (currentStep) {
      case 1: return <SelectCustomer key={resetKey} />;
      case 2: return <SelectPlanetDisk key={resetKey} />;
      case 3: return <SelectEquiptments key={resetKey} />;
      case 4: return <SelectTables key={resetKey} />;
      case 5: return <SelectFinal key={resetKey} onSubmit={handleSubmit} />;
      default: return <div>Hatalı Adım</div>;
    }
  };

  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? 30 : -30, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction > 0 ? -30 : 30, opacity: 0 })
  };

  return (
    <div
      className="container-fluid pb-4 min-vh-100"
      style={{
        fontSize: "14px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#1a2d3a",
        paddingTop: typeof window !== "undefined" && window.innerWidth < 768 ? "75px" : "20px"
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: "#334155" }}>
        <div>
          <h5 className="mb-1 fw-semibold tracking-tight" style={{ color: "#94a3b8" }}>
            <i className="bi bi-file-earmark-plus me-2" style={{ color: "#22c55e" }}></i> Yeni Teklif Oluştur
          </h5>
        </div>
      </div>

      <div className="p-3 mb-4 rounded-3" style={{ backgroundColor: "#0f172a", borderColor: "#334155" }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">

          <button
            type="button"
            className="btn btn-sm text-white px-3 py-2 fw-semibold d-flex align-items-center"
            onClick={prevStep}
            disabled={currentStep === 1}
            style={{
              borderRadius: "6px",
              backgroundColor: currentStep === 1 ? "transparent" : "#1e293b",
              border: "1px solid #334155",
              opacity: currentStep === 1 ? 0.3 : 1,
              color: "#e2e8f0",
              fontSize: "13px",
              transition: "all 0.2s"
            }}
          >
            <i className="bi bi-arrow-left me-1.5"></i> Geri
          </button>

          <div className="d-flex justify-content-around align-items-center flex-grow-1 flex-wrap gap-2 px-md-4">
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              let textColor = "#64748b";
              if (isActive) textColor = "#ffffff";
              if (isCompleted) textColor = "#94a3b8";

              return (
                <div
                  key={step.id}
                  className="d-flex align-items-center"
                  onClick={() => handleStepClick(step.id)}
                  style={{ cursor: "pointer" }}
                >
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      backgroundColor: isActive || isCompleted ? "#22c55e" : "#334155"
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="rounded-circle d-flex align-items-center justify-content-center me-2 text-white shadow-sm position-relative"
                    style={{
                      width: "28px",
                      height: "28px",
                      fontSize: "12px",
                      fontWeight: isActive ? "600" : "400",
                      zIndex: 2
                    }}
                  >
                    {isCompleted ? <i className="bi bi-check-lg"></i> : step.id}

                    {isActive && (
                      <motion.div
                        layoutId="activeStepGlow"
                        className="position-absolute rounded-circle w-100 h-100"
                        style={{ border: "2px solid #22c55e", scale: 1.2, opacity: 0.5, zIndex: -1 }}
                      />
                    )}
                  </motion.div>
                  <div>
                    <span
                      className={`d-none d-md-inline ${isActive ? "fw-semibold" : "fw-medium"}`}
                      style={{ fontSize: "12px", color: textColor, transition: "color 0.3s" }}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="d-flex align-items-center gap-2">
            {currentStep < steps.length && (
              <button
                type="button"
                className="btn btn-sm text-white px-3 py-2 fw-bold d-flex align-items-center"
                onClick={nextStep}
                style={{ backgroundColor: "#22c55e", borderRadius: "6px", border: "none", fontSize: "13px" }}
              >
                İleri <i className="bi bi-arrow-right ms-1.5"></i>
              </button>
            )}

            <button
              type="button"
              className="btn btn-sm text-white py-2 px-2.5 d-flex align-items-center justify-content-center border-0 shadow-sm"
              onClick={() => setShowModal(true)}
              title="Anlık JSON Çıktısı"
              style={{ backgroundColor: "#334155", borderRadius: "6px", fontSize: "14px" }}
            >
              <i className="bi bi-file-earmark-code"></i>
            </button>

            {isFormDataNotEmpty && (
              <button
                type="button"
                className="btn btn-sm text-white py-2 px-3 d-flex align-items-center border-0 shadow-sm fw-semibold"
                onClick={handleResetForm}
                title="Formu Temizle"
                style={{
                  backgroundColor: "#ef4444",
                  borderRadius: "6px",
                  fontSize: "13px",
                  transition: "background-color 0.2s"
                }}
              >
                <i className="bi bi-trash3 me-1.5"></i> Formu Sıfırla
              </button>
            )}
          </div>

        </div>
      </div>

      <div className="overflow-hidden position-relative" style={{ borderRadius: "8px" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="card shadow-sm border-0 text-white"
            style={{ borderRadius: "8px", backgroundColor: "#1a1c1dab" }}
          >
            {renderStepComponent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <SelectionsModal show={showModal} onClose={() => setShowModal(false)} />

      <AlertModal
        show={alertConfig.show}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showCancel={alertConfig.showCancel}
        onConfirm={alertConfig.action}
        onClose={() => setAlertConfig((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}

export default TeklifPage;