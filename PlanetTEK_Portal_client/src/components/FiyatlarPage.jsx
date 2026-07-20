import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Animasyon için eklendi
import AnaUnite from "./FiyatlarComponents/AnaUnite";
import Izgara from "./FiyatlarComponents/Izgara";
import Lamella from "./FiyatlarComponents/Lamella";
import DebiDagitim from "./FiyatlarComponents/DebiDagitim";
import IscilikMaliyetleri from "./FiyatlarComponents/IscilikMaliyetleri";
import Filtration from "./FiyatlarComponents/Filtration";
import DalgicPompa from "./FiyatlarComponents/DalgicPompa";
import CamurSusuzlastirma from "./FiyatlarComponents/CamurSusuzlastirma";
import IleriAritmaEquipments from "./FiyatlarComponents/IlerAritmaEquipments";
import Membran from "./FiyatlarComponents/Membrane";


function FiyatlarPage() {
  const [activeTab, setActiveTab] = useState("anaUniteler");

  // Sekme verilerini bir array haline getirerek kodu daha temiz hale getirdik
  const tabs = [
    { id: "anaUniteler", label: "Ana Ünite" },
    { id: "izgaralar", label: "Izgara & Yağ Tutucu" },
    { id: "lamellalar", label: "Lamella" },
    { id: "debiDagitim", label: "Debi Dağıtım" },
    { id: "iscilik", label: "İşçilik Maliyetleri" },
    { id: "dalgicpompa", label: "Pompalar" },
    { id: "filtration", label: "Filtrasyon" },
    { id: "camursusuzlastirma", label: "Çamur Susuzlaştırma" },
    { id: "ileriaritmaequipments", label: "İleri Aritma Ekipmanları" },
    { id: "Membran", label: "Membran Sistemi" },
  ];

  return (
    <div
      className="container-fluid pb-5 min-vh-100"
      style={{
        fontSize: "14px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#1a2d3a",
        paddingTop: typeof window !== "undefined" && window.innerWidth < 768 ? "75px" : "20px"
      }}
    >
      {/* BAŞLIK ALANI */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-3 border-bottom gap-3" style={{ borderColor: "#334155" }}>
        <div>
          <h5 className="mb-1 fw-semibold tracking-tight" style={{ color: "#94a3b8" }}>
            <i className="bi bi-currency-exchange me-2" style={{ color: "#4ade80" }}></i>Fiyat Yönetim Paneli
          </h5>
        </div>
      </div>

      {/* MODERN DİNAMİK GRUP SEKMELERİ */}
      <div
        className="d-grid p-1 mb-4 rounded-3 w-100"
        style={{
          backgroundColor: "#0f172a",
          border: "1px solid #334155",
          gap: "4px",
          gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`
        }}
      >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className="btn btn-sm position-relative border-0 px-1 py-2 fw-medium transition-all text-truncate"
            style={{
              color: isActive ? "#0f172a" : "#94a3b8",
              zIndex: 1,
              borderRadius: "6px",
              backgroundColor: "transparent",
              fontSize: "0.82rem"
            }}
            title={tab.label} // Uzun isimler taşarsa üstüne gelince tam adı gözüksün diye
            onClick={() => setActiveTab(tab.id)}
          >
            {/* Aktif sekme arkasındaki kayan arka plan animasyonu */}
            {isActive && (
              <motion.div
                layoutId="activeTabBackground"
                className="position-absolute top-0 start-0 w-100 h-100"
                style={{
                  backgroundColor: "#22d3ee",
                  borderRadius: "6px",
                  zIndex: -1,
                }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            {tab.label}
          </button>
        );
      })}
    </div>

      {/* SEKMEYE GÖRE İÇERİK GEÇİŞ ANİMASYONU */ }
  <div className="tab-content overflow-hidden">
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab} // Key değiştiğinde Framer Motion animasyonu tetikler
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {activeTab === "anaUniteler" && <AnaUnite />}
        {activeTab === "izgaralar" && <Izgara />}
        {activeTab === "lamellalar" && <Lamella />}
        {activeTab === "debiDagitim" && <DebiDagitim />}
        {activeTab === "iscilik" && <IscilikMaliyetleri />}
        {activeTab === "dalgicpompa" && <DalgicPompa />}
        {activeTab === "filtration" && <Filtration />}
        {activeTab === "camursusuzlastirma" && <CamurSusuzlastirma />}
        {activeTab === "ileriaritmaequipments" && <IleriAritmaEquipments />}
        {activeTab === "Membran" && <Membran />}
      </motion.div>
    </AnimatePresence>
  </div>
    </div >
  );
}

export default FiyatlarPage;