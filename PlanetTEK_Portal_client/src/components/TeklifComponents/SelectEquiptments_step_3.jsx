import React from "react";
import { useTeklifStore } from "../../utils/teklifStore";
import { motion, AnimatePresence } from "framer-motion"; // Animasyon için kullanılıyor

import OnAritmaDetail from "./EqipmentsColumns/OnAritmaDetail";
import FeedPumpDetail from "./EqipmentsColumns/FeedPumpDetail";
import IleriAritmaDetail from "./EqipmentsColumns/IleriAritmaDetail";
import FiltrasyonDetail from "./EqipmentsColumns/FiltrasyonDetail";
import SludgeDewateringDetail from "./EqipmentsColumns/SludgeDewateringDetail";

// Detay component haritası (Kodu temizlemek ve key yönetimi için)
const DETAIL_COMPONENTS = {
  onAritma: <OnAritmaDetail />,
  feedPump: <FeedPumpDetail />,
  ileriAritma: <IleriAritmaDetail />,
  filtrasyon: <FiltrasyonDetail />,
  sludgeDewatering: <SludgeDewateringDetail />,
};

// Framer Motion Varyasyonları (Yumuşak Geçiş Ayarları)
const tabContentVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: "easeIn" } }
};

function SelectEquiptments() {
  const CALC_HOURS = 24;

  // 1. ZUSTAND STORE BAĞLANTISI
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const debi = parseFloat(formData.planetDiskDetails?.debi) || 0;
  const hourlyFlow = debi ? debi / CALC_HOURS : 0;

  const equipmentsCache = formData.equipments || {};

  // 2. MODÜLLERİN INITIAL STATE YÖNETİMİ
  const modules = equipmentsCache.modulesState || {
    onAritma: { id: "onAritma", label: "1. Ön Arıtma Sistemi", checked: true, visited: false, isActiveTab: true },
    feedPump: { id: "feedPump", label: "2. Terfi Pompası", checked: true, visited: false, isActiveTab: false },
    ileriAritma: { id: "ileriAritma", label: "3. İleri Arıtma Ünitesi", checked: false, visited: false, isActiveTab: false },
    filtrasyon: { id: "filtrasyon", label: "4. Filtrasyon Sistemi", checked: false, visited: false, isActiveTab: false },
    sludgeDewatering: { id: "sludgeDewatering", label: "5. Çamur Susuzlaştırma", checked: false, visited: false, isActiveTab: false },
  };

  const activeModule = Object.values(modules).find((m) => m.isActiveTab && m.checked);
  const activeTabId = activeModule ? activeModule.id : "";

  const syncEquipmentsStore = (nextModules) => {
    updateSection("equipments", {
      modulesState: nextModules,
    });
  };

  const handleTabClick = (moduleId) => {
    const nextModules = Object.keys(modules).reduce((acc, key) => {
      acc[key] = {
        ...modules[key],
        isActiveTab: key === moduleId,
        visited: key === moduleId ? true : modules[key].visited,
      };
      return acc;
    }, {});

    syncEquipmentsStore(nextModules);
  };

  const handleCheckboxChange = (moduleId) => {
    const isTargetChecked = !modules[moduleId].checked;

    let updatedModules = {
      ...modules,
      [moduleId]: {
        ...modules[moduleId],
        checked: isTargetChecked,
        visited: isTargetChecked ? modules[moduleId].visited : false
      },
    };

    if (activeTabId === moduleId && !isTargetChecked) {
      updatedModules[moduleId].isActiveTab = false;
      const firstAvailable = Object.values(updatedModules).find((m) => m.checked);
      if (firstAvailable) {
        updatedModules[firstAvailable.id] = {
          ...updatedModules[firstAvailable.id],
          isActiveTab: true,
          visited: true,
        };
      }
    } else if (!activeTabId && isTargetChecked) {
      updatedModules[moduleId].isActiveTab = true;
      updatedModules[moduleId].visited = true;
    }

    syncEquipmentsStore(updatedModules);
  };

  const hasUnvisitedActiveModule = Object.values(modules).some(
    (mod) => mod.checked && !mod.visited
  );

  return (
    <div
      className="card-body p-4 d-flex flex-column gap-3"
      style={{
        backgroundColor: "#1a1c1d",
        borderRadius: "6px",
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
      }}
    >
      {/* Adım Başlığı */}
      <div className="d-flex align-items-center">
        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
          Ekipman Seçim Modülleri
        </span>
        <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
      </div>
      
      <div className="p-1 px-3 rounded text-white-50 d-flex gap-3 align-items-center" style={{ backgroundColor: "#1e293b", fontSize: "11px", border: "1px dashed #334155" }}>
        <span><i className="bi bi-info-circle me-1.5 text-info"></i>Mevcut Hidrolik Yük:</span>
        <span className="text-white fw-bold">
          {debi} m³/gün <span className="text-white-50 fw-normal">({hourlyFlow.toFixed(2)} m³/h)</span>
        </span>
      </div>

      {/* ZORUNLULUK KONTROL UYARI BANNERI */}
      <AnimatePresence>
        {hasUnvisitedActiveModule && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="alert alert-warning d-flex align-items-center gap-2 m-0 p-2 overflow-hidden" 
            style={{ fontSize: "11px", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", color: "#f59e0b" }}
          >
            <i className="bi bi-exclamation-circle-fill"></i>
            <span><strong>Zorunlu Seçim:</strong> Projeye dahil ettiğiniz tüm ekipmanların detay ayarlarına tıklayarak seçimleri kontrol etmeniz gerekmektedir.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ANA DÜZEN */}
      <div className="row g-3" style={{ minHeight: "250px" }}>
        
        {/* SOL KOLON: MODÜL SEÇİM VE KONTROL */}
        <div className="col-md-4 col-12 border-end" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="d-flex flex-column gap-2 pe-2">
            <span className="text-white-50 mb-1 d-block" style={{ fontSize: "10px", fontWeight: "600", textTransform: "uppercase" }}>
              Projeye Dahil Edilecek Ekipmanlar
            </span>

            {Object.values(modules).map((mod) => {
              const isSelected = mod.isActiveTab;
              const needAttention = mod.checked && !mod.visited;

              let textColor = "#ef4444";
              if (mod.checked) {
                textColor = needAttention ? "#f59e0b" : "#10b981";
              }

              return (
                <motion.div
                  layout // Opaklık ve yer değişimlerinde pürüzsüz geçiş sağlar
                  key={mod.id}
                  className="d-flex align-items-center justify-content-between p-2 rounded"
                  style={{
                    backgroundColor: isSelected ? "#0f172a" : "rgba(255,255,255,0.02)",
                    border: isSelected ? "1px solid #334155" : "1px solid rgba(255,255,255,0.05)",
                    borderLeft: isSelected ? "3px solid #10b981" : "1px solid rgba(255,255,255,0.05)",
                    cursor: mod.checked ? "pointer" : "default",
                    opacity: mod.checked ? 1 : 0.6,
                    transition: "background-color 0.2s, border 0.2s" // Framer Layout ile çakışmayan CSS geçişleri
                  }}
                  onClick={() => mod.checked && handleTabClick(mod.id)}
                >
                  <div className="d-flex align-items-center gap-2 text-truncate" style={{ pointerEvents: "none" }}>
                    <input
                      type="checkbox"
                      className="form-check-input m-0 cursor-pointer"
                      checked={mod.checked}
                      style={{
                        pointerEvents: "auto",
                        width: "15px",
                        height: "15px",
                        cursor: "pointer",
                        accentColor: "#10b981"
                      }}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleCheckboxChange(mod.id);
                      }}
                    />
                    <span
                      className="fw-bold text-truncate"
                      style={{
                        fontSize: "11px",
                        color: textColor,
                        transition: "color 0.2s ease"
                      }}
                    >
                      {mod.label}
                    </span>
                  </div>

                  {mod.checked && (
                    <div className="d-flex align-items-center gap-1">
                      {needAttention ? (
                        <i className="bi bi-exclamation-circle text-warning" style={{ fontSize: "11px" }} title="Lütfen bu adımı kontrol edin"></i>
                      ) : (
                        <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "10px" }}></i>
                      )}
                      <i className="bi bi-chevron-right text-muted" style={{ fontSize: "10px" }}></i>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* SAĞ KOLON: DİNAMİK ÖZELLİK DETAY ALANI */}
        <div className="col-md-8 col-12 d-flex flex-column justify-content-center">
          {Object.values(modules).some(m => m.checked) ? (
            <div className="p-3 rounded" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", height: "100%", overflow: "hidden" }}>
              
              {/* AnimatePresence mod="wait" ile eski tab kaybolur, sonra yenisi gelir */}
              <AnimatePresence mode="wait">
                {activeTabId && modules[activeTabId]?.checked ? (
                  <motion.div
                    key={activeTabId} // Key değiştiği an Framer-Motion eskiyi silip yeniyi canlandırır
                    variants={tabContentVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{ height: "100%" }}
                  >
                    {DETAIL_COMPONENTS[activeTabId]}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="no-active"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-muted p-4" 
                    style={{ fontSize: "11px" }}
                  >
                    Lütfen detayını düzenlemek istediğiniz aktif modüle tıklayın.
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          ) : (
            <div className="text-center p-4 text-muted border rounded border-dashed" style={{ borderColor: "#334155", fontSize: "11px" }}>
              <i className="bi bi-exclamation-triangle d-block mb-2 text-warning" style={{ fontSize: "18px" }}></i>
              Lütfen sağ tarafta detayları görüntülemek için sol panelden en az bir modülü aktif hale getirin.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default SelectEquiptments;