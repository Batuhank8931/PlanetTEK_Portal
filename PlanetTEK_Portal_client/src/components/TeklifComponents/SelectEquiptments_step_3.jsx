import React from "react";
import { useTeklifStore } from "../../utils/teklifStore";

import OnAritmaDetail from "./EqipmentsColumns/OnAritmaDetail";
import FeedPumpDetail from "./EqipmentsColumns/FeedPumpDetail";
import IleriAritmaDetail from "./EqipmentsColumns/IleriAritmaDetail";
import FiltrasyonDetail from "./EqipmentsColumns/FiltrasyonDetail";
import SludgeDewateringDetail from "./EqipmentsColumns/SludgeDewateringDetail";

function SelectEquiptments() {
  const CALC_HOURS = 24;

  // 1. ZUSTAND STORE BAĞLANTISI
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const debi = parseFloat(formData.planetDiskDetails?.debi) || 0;
  const hourlyFlow = debi ? debi / CALC_HOURS : 0;
  
  const equipmentsCache = formData.equipments || {};

  // 2. MODÜLLERİN INITIAL STATE YÖNETİMİ
  // Yeni yapıda visited ve isActiveTab doğrudan modül nesnesinin içinde tutuluyor.
  const modules = equipmentsCache.modulesState || {
    onAritma: { id: "onAritma", label: "1. Ön Arıtma Sistemi", checked: true, visited: false, isActiveTab: true },
    feedPump: { id: "feedPump", label: "2. Terfi Pompası", checked: true, visited: false, isActiveTab: false },
    ileriAritma: { id: "ileriAritma", label: "3. İleri Arıtma Ünitesi", checked: false, visited: false, isActiveTab: false },
    filtrasyon: { id: "filtrasyon", label: "4. Filtrasyon Sistemi", checked: false, visited: false, isActiveTab: false },
    sludgeDewatering: { id: "sludgeDewatering", label: "5. Çamur Susuzlaştırma", checked: false, visited: false, isActiveTab: false },
  };

  // Aktif sekmeyi bulmak için objeyi tarıyoruz (Dinamik Selector)
  const activeModule = Object.values(modules).find((m) => m.isActiveTab && m.checked);
  const activeTabId = activeModule ? activeModule.id : "";

  // Merkezi Store Senkronizasyon Helper Fonksiyonu (Sadece tek bir obje gönderiyoruz)
  const syncEquipmentsStore = (nextModules) => {
    updateSection("equipments", {
      modulesState: nextModules,
    });
  };

  // Bir taba tıklandığında: Diğer tüm sekmelerin isActiveTab'ini false yap, tıklananı true ve visited: true yap
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

  // Checkbox değişim yönetimi
  const handleCheckboxChange = (moduleId) => {
    const isTargetChecked = !modules[moduleId].checked;

    // Hedef modülün checked durumunu güncelle
    let updatedModules = {
      ...modules,
      [moduleId]: { 
        ...modules[moduleId], 
        checked: isTargetChecked,
        // Eğer açılıyorsa otomatik visited sayılabilir, kapanıyorsa false'a çekilebilir
        visited: isTargetChecked ? modules[moduleId].visited : false 
      },
    };

    // EĞER aktif olan sekmeyi kapatırsak, başka bir görünür/checked sekmeyi aktif yapmamız gerekir
    if (activeTabId === moduleId && !isTargetChecked) {
      // Önce kapanan sekmenin aktifliğini alalım
      updatedModules[moduleId].isActiveTab = false;

      // Tikli olan ilk uygun modülü bulalım
      const firstAvailable = Object.values(updatedModules).find((m) => m.checked);
      if (firstAvailable) {
        updatedModules[firstAvailable.id] = {
          ...updatedModules[firstAvailable.id],
          isActiveTab: true,
          visited: true, // Aktif hale geldiği için ziyaret edilmiş sayıyoruz
        };
      }
    } 
    // EĞER hiç aktif sekme yoksa ve yeni bir sekme açılıyorsa, onu direkt aktif sekme yapalım
    else if (!activeTabId && isTargetChecked) {
      updatedModules[moduleId].isActiveTab = true;
      updatedModules[moduleId].visited = true;
    }

    syncEquipmentsStore(updatedModules);
  };

  // Tiklenmiş ama henüz ziyaret edilmemiş bir modül var mı kontrolü (Doğrudan objeden okunuyor)
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
      {/* BAŞLIK & HİDROLİK YÜK PANELİ */}
      <div className="d-flex align-items-center justify-content-between border-bottom pb-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <span className="fw-bold text-uppercase" style={{ fontSize: "12px", letterSpacing: "0.8px", color: "#10b981" }}>
          <i className="bi bi-cpu-fill me-2"></i>3. Ekipman Seçim Modülleri
        </span>
        <div className="p-1 px-3 rounded text-white-50 d-flex gap-3 align-items-center" style={{ backgroundColor: "#1e293b", fontSize: "11px", border: "1px dashed #334155" }}>
          <span><i className="bi bi-info-circle me-1.5 text-info"></i>Mevcut Hidrolik Yük:</span>
          <span className="text-white fw-bold">
            {debi} m³/gün <span className="text-white-50 fw-normal">({hourlyFlow.toFixed(2)} m³/h)</span>
          </span>
        </div>
      </div>

      {/* ZORUNLULUK KONTROL UYARI BANNERI */}
      {hasUnvisitedActiveModule && (
        <div className="alert alert-warning d-flex align-items-center gap-2 m-0 p-2" style={{ fontSize: "11px", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", color: "#f59e0b" }}>
          <i className="bi bi-exclamation-circle-fill"></i>
          <span><strong>Zorunlu Seçim:</strong> Projeye dahil ettiğiniz tüm ekipmanların detay ayarlarına tıklayarak seçimleri kontrol etmeniz gerekmektedir.</span>
        </div>
      )}

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
                <div
                  key={mod.id}
                  className="d-flex align-items-center justify-content-between p-2 rounded transition-all"
                  style={{
                    backgroundColor: isSelected ? "#0f172a" : "rgba(255,255,255,0.02)",
                    border: isSelected ? "1px solid #334155" : "1px solid rgba(255,255,255,0.05)",
                    borderLeft: isSelected ? "3px solid #10b981" : "1px solid rgba(255,255,255,0.05)",
                    cursor: mod.checked ? "pointer" : "default",
                    opacity: mod.checked ? 1 : 0.6
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
                </div>
              );
            })}
          </div>
        </div>

        {/* SAĞ KOLON: DİNAMİK ÖZELLİK DETAY ALANI */}
        <div className="col-md-8 col-12 d-flex flex-column justify-content-center">
          {Object.values(modules).some(m => m.checked) ? (
            <div className="p-3 rounded" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", height: "100%" }}>

              {/* 1. Ön Arıtma Detayı */}
              {modules.onAritma.checked && (
                <div className={modules.onAritma.isActiveTab ? "" : "d-none"}>
                  <OnAritmaDetail />
                </div>
              )}

              {/* 2. Terfi Pompası Detayı */}
              {modules.feedPump.checked && (
                <div className={modules.feedPump.isActiveTab ? "" : "d-none"}>
                  <FeedPumpDetail />
                </div>
              )}

              {/* 3. İleri Arıtma Detayı */}
              {modules.ileriAritma.checked && (
                <div className={modules.ileriAritma.isActiveTab ? "" : "d-none"}>
                  <IleriAritmaDetail />
                </div>
              )}

              {/* 4. Filtrasyon Detayı */}
              {modules.filtrasyon.checked && (
                <div className={modules.filtrasyon.isActiveTab ? "" : "d-none"}>
                  <FiltrasyonDetail />
                </div>
              )}

              {/* 5. Çamur Susuzlaştırma Detayı */}
              {modules.sludgeDewatering.checked && (
                <div className={modules.sludgeDewatering.isActiveTab ? "" : "d-none"}>
                  <SludgeDewateringDetail />
                </div>
              )}

              {!activeTabId && (
                <div className="text-center text-muted p-4" style={{ fontSize: "11px" }}>
                  Lütfen detayını düzenlemek istediğiniz aktif modüle tıklayın.
                </div>
              )}

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