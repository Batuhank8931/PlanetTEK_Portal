import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";
import AlertModal from "../modals/AlertModal";
import LoadingEkrani from "../modals/LoadingEkrani";
import { motion, AnimatePresence } from "framer-motion";

import KapakTablosu from "../TableComponents/KapakTablosu";
import ParametreTablosu from "../TableComponents/ParametreTablosu";
import CapexTablosu from "../TableComponents/CapexTablosu";
import OpexTablosu from "../TableComponents/OpexTablosu";
import EnerjiIsletmeTablosu from "../TableComponents/EnerjiIsletmeTablosu";
import SarfMalzemeTablosu from "../TableComponents/SarfMalzemeTablosu";
import EnerjiKarsilastirmaTablosu from "../TableComponents/EnerjiKarsilastirmaTablosu";
import KarbonAyakiziTablosu from "../TableComponents/KarbonAyakiziTablosu";
import OnYillikMaliyetTablosu from "../TableComponents/OnYillikMaliyetTablosu";
import AmortismanTablosu from "../TableComponents/AmortismanTablosu";
import BilgiSayfasiTablosu from "../TableComponents/BilgiSayfasiTablosu";
import OzetTablosu from "../TableComponents/OzetTablosu";
import EkipmanTablosu from "../TableComponents/EkipmanTablosu";

function SelectTables() {
  const [activeTab, setActiveTab] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingTableName, setGeneratingTableName] = useState("");

  const formData = useTeklifStore((state) => state.formData);
  const resetTable = useTeklifStore((state) => state.resetTables);

  const [alertConfig, setAlertConfig] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
    showCancel: false,
    action: null
  });

  const tablesList = [
    { id: 1, name: "Kapak Tablosu", component: <KapakTablosu /> },
    { id: 2, name: "Parametre Tablosu", component: <ParametreTablosu /> },
    { id: 3, name: "CAPEX", component: <CapexTablosu /> },
    { id: 4, name: "Enerji İşletme Giderleri", component: <EnerjiIsletmeTablosu /> },
    { id: 5, name: "Sarf Malzeme", component: <SarfMalzemeTablosu /> },
    { id: 6, name: "OPEX", component: <OpexTablosu /> },
    { id: 7, name: "Enerji Karşılaştırma", component: <EnerjiKarsilastirmaTablosu /> },
    { id: 8, name: "Karbon Ayakizi", component: <KarbonAyakiziTablosu /> },
    { id: 9, name: "10 Yıllık Maliyet", component: <OnYillikMaliyetTablosu /> },
    { id: 10, name: "Amortisman", component: <AmortismanTablosu /> },
    { id: 11, name: "Bilgi Sayfası", component: <BilgiSayfasiTablosu /> },
    { id: 12, name: "Özet Tablosu", component: <OzetTablosu /> },
    { id: 13, name: "Ekipman Tablosu", component: <EkipmanTablosu /> },
  ];

  const handleAutoGenerateAll = async () => {
    setIsGenerating(true);
    resetTable();

    for (let i = 0; i < tablesList.length; i++) {
      const currentTable = tablesList[i];
      setGeneratingTableName(currentTable.name);
      setActiveTab(currentTable.id);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    setIsGenerating(false);
    setGeneratingTableName("");
    setActiveTab(1);

    setAlertConfig({
      show: true,
      title: "İşlem Tamamlandı",
      message: "Tüm tablolar başarıyla baştan hesaplandı ve oluşturuldu!",
      type: "success",
      showCancel: false,
      action: null
    });
  };

  const currentTable = tablesList.find((t) => t.id === activeTab);

  // Animasyon varyasyonları
  const tabContentVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: "easeIn" } },
  };

  return (
    <div
      className="container-fluid py-4 d-flex flex-column text-start align-items-stretch"
      style={{ minHeight: "100vh", backgroundColor: "#0b0c0c", overflow: "visible", position: "relative" }}
    >
      <LoadingEkrani
        isGenerating={isGenerating}
        generatingModuleName={generatingTableName}
        debi={formData.planetDiskDetails?.debi}
        version="TBL-V10"
      />

      {/* ÜST SABİT BAŞLIK SATIRI */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center flex-grow-1">
          <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.8px", color: "#4ade80" }}>
            Teklif Tabloları
          </span>
          <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)", borderWidth: "1px" }}></div>
        </div>

        <button
          type="button"
          onClick={handleAutoGenerateAll}
          disabled={isGenerating}
          className="btn btn-sm ms-3 px-3 fw-bold text-white border-0"
          style={{
            backgroundColor: "#2563eb",
            fontSize: "11px",
            borderRadius: "6px",
            whiteSpace: "nowrap",
            transition: "0.2s"
          }}
        >
          🔄 Tüm Tabloları Baştan Oluştur
        </button>
      </div>

      <div className="row g-3 flex-grow-1 align-items-start align-content-start">
        {/* SOL YAN MENÜ */}
        <div className="col-12 col-md-3 col-xl-2">
          <div
            className="card border-0 text-white sticky-md-top"
            style={{
              backgroundColor: "#111314",
              borderRadius: "12px",
              top: "24px",
              border: "1px solid rgba(255, 255, 255, 0.05)"
            }}
          >
            <div className="card-body p-2">
              <div className="d-flex flex-row flex-md-column gap-1 overflow-x-auto pb-2 pb-md-0 snap-inline custom-scrollbar" style={{ whiteSpace: "nowrap" }}>
                {tablesList.map((table) => {
                  const isActive = activeTab === table.id;
                  return (
                    <button
                      key={table.id}
                      type="button"
                      disabled={isGenerating}
                      className="border-0 text-start py-2 px-3 rounded-2 text-white flex-shrink-0 flex-md-shrink-1"
                      style={{
                        backgroundColor: isActive ? "rgba(74, 222, 128, 0.08)" : "transparent",
                        color: isActive ? "#4ade80" : "#94a3b8",
                        fontSize: "11px",
                        fontWeight: isActive ? "600" : "500",
                        transition: "all 0.2s ease-in-out",
                        width: "auto",
                        minWidth: "120px",
                        display: "block",
                        borderLeft: isActive ? "3px solid #4ade80" : "3px solid transparent",
                        paddingLeft: isActive ? "9px" : "12px",
                        opacity: isGenerating ? 0.4 : 1,
                        cursor: isGenerating ? "not-allowed" : "pointer"
                      }}
                      onClick={() => setActiveTab(table.id)}
                      title={table.name}
                      onMouseEnter={(e) => {
                        if (!isActive && !isGenerating) {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
                          e.currentTarget.style.color = "#f8fafc";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive && !isGenerating) {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#94a3b8";
                        }
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                          {table.name}
                        </span>
                        {isActive && (
                          <span className="ms-2 d-none d-md-inline" style={{ color: "#4ade80", fontSize: "9px" }}>●</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ PANEL (AKICI GEÇİŞLİ) */}
        <div className="col-12 col-md-9 col-xl-10">
          <div className="card border-0 text-white" style={{ backgroundColor: "#141617", borderRadius: "12px" }}>
            <div className="card-body py-4 d-flex flex-column gap-3">
              <div className="d-flex align-items-center w-100 mb-2">
                <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.8px", color: "#4ade80", whiteSpace: "nowrap" }}>
                  {currentTable ? currentTable.name.toUpperCase() : "TABLO SEÇİMİ"}
                </span>
                <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)", borderWidth: "1px" }}></div>
              </div>

              {/* Animasyon esnasında taşmaları engellemek ve sarsıntısız geçiş için overflow: hidden eklendi */}
              <div className="rounded-3" style={{ backgroundColor: "#0d0e0f", border: "1px solid rgba(255,255,255,0.03)", height: "auto", overflow: "hidden" }}>
                <AnimatePresence mode="wait">
                  {currentTable ? (
                    <motion.div
                      key={currentTable.id} // Key değiştiğinde AnimatePresence tetiklenir
                      variants={tabContentVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      style={{ width: "100%" }}
                    >
                      {currentTable.component}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty-state"
                      variants={tabContentVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="p-3"
                    >
                      <span className="text-white-50" style={{ fontSize: "12px" }}>Lütfen listeden bir tablo seçin.</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertModal
        show={alertConfig.show}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showCancel={alertConfig.showCancel}
        onConfirm={alertConfig.action}
        onClose={() => setAlertConfig(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}

export default SelectTables;