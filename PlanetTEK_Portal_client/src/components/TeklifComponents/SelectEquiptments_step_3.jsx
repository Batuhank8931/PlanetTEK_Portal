import React, { useState, useEffect } from "react";
import OnAritmaDetail from "./EqipmentsColumns/OnAritmaDetail";
import FeedPumpDetail from "./EqipmentsColumns/FeedPumpDetail";
import IleriAritmaDetail from "./EqipmentsColumns/IleriAritmaDetail";
import FiltrasyonDetail from "./EqipmentsColumns/FiltrasyonDetail";
import SludgeDewateringDetail from "./EqipmentsColumns/SludgeDewateringDetail";

function SelectEquiptments({ data, updateData }) {
  const CALC_HOURS = 24;
  const hourlyFlow = data.debi ? data.debi / CALC_HOURS : 0;

  // Modüllerin state'i
  const [modules, setModules] = useState({
    onAritma: { id: "onAritma", label: "1. Ön Arıtma Sistemi", checked: true },
    feedPump: { id: "feedPump", label: "2. Terfi Pompası", checked: true },
    ileriAritma: { id: "ileriAritma", label: "3. İleri Arıtma Ünitesi", checked: false },
    filtrasyon: { id: "filtrasyon", label: "4. Filtrasyon Sistemi", checked: false },
    sludgeDewatering: { id: "sludgeDewatering", label: "5. Çamur Susuzlaştırma", checked: false },
  });

  const [activeTab, setActiveTab] = useState("onAritma");
  
  // Kullanıcının sekmeyi en az bir kez ziyaret edip etmediğini tutan state (Trendyol tarzı zorunluluk kontrolü için)
  const [visitedTabs, setVisitedTabs] = useState({ onAritma: true });

  // Bir tab aktif olduğunda onu ziyaret edilmiş olarak işaretle
  const handleTabClick = (moduleId) => {
    setActiveTab(moduleId);
    setVisitedTabs((prev) => ({ ...prev, [moduleId]: true }));
  };

  // Checkbox değişim yönetimi
  const handleCheckboxChange = (moduleId) => {
    setModules((prev) => {
      const updated = {
        ...prev,
        [moduleId]: { ...prev[moduleId], checked: !prev[moduleId].checked },
      };

      // Eğer modül aktif edildiyse ama şu an aktif tab boşsa veya kapatılan tab ise oraya odaklan
      if (updated[moduleId].checked) {
        // İlk defa tikleniyorsa ziyaret listesine otomatik ekleme (isteğe bağlı, tıklamayı zorunlu kılmak için false da kalabilir)
        // Biz burada tıklamayı zorunlu kılmak için ziyaret edilmiş saymıyoruz.
      }

      // Eğer kullanıcı açık olan sekmeyi kapatırsa, aktif sekmeyi ilk bulduğu görünür sekmeye kaydırır
      if (activeTab === moduleId && !updated[moduleId].checked) {
        const firstAvailable = Object.values(updated).find((m) => m.checked);
        const nextTab = firstAvailable ? firstAvailable.id : "";
        setActiveTab(nextTab);
        if (nextTab) {
          setVisitedTabs((prevV) => ({ ...prevV, [nextTab]: true }));
        }
      }
      
      // Parent state'i güncelle
      if (updateData) {
        updateData({
          ...data,
          activeModules: Object.keys(updated).filter((k) => updated[k].checked)
        });
      }

      return updated;
    });
  };

  // Tiklenmiş ama henüz ziyaret edilmemiş (tıklanıp içi açılmamış) bir modül var mı kontrolü
  const hasUnvisitedActiveModule = Object.values(modules).some(
    (mod) => mod.checked && !visitedTabs[mod.id]
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
          <i className="bi bi-cpu-fill me-2"></i>3. Otomatik Ekipman Seçim Modülleri
        </span>
        <div className="p-1 px-3 rounded text-white-50 d-flex gap-3 align-items-center" style={{ backgroundColor: "#1e293b", fontSize: "11px", border: "1px dashed #334155" }}>
          <span><i className="bi bi-info-circle me-1.5 text-info"></i>Mevcut Hidrolik Yük:</span>
          <span className="text-white fw-bold">
            {data.debi || 0} m³/gün <span className="text-white-50 fw-normal">({hourlyFlow.toFixed(2)} m³/h)</span>
          </span>
        </div>
      </div>

      {/* TRENDYOL YEMEK TARZI UYARI BANNERI */}
      {hasUnvisitedActiveModule && (
        <div className="alert alert-warning d-flex align-items-center gap-2 m-0 p-2" style={{ fontSize: "11px", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", color: "#f59e0b" }}>
          <i className="bi bi-exclamation-circle-fill"></i>
          <span><strong>Zorunlu Seçim:</strong> Projeye dahil ettiğiniz tüm ekipmanların detay ayarlarına tıklayarak seçimleri kontrol etmeniz gerekmektedir.</span>
        </div>
      )}

      {/* ANA DÜZEN: SOL SEÇİM PANELİ | SAĞ DETAY PANELİ */}
      <div className="row g-3" style={{ minHeight: "250px" }}>

        {/* SOL KOLON: MODÜL SEÇİM VE KONTROL */}
        <div className="col-md-4 col-12 border-end" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="d-flex flex-column gap-2 pe-2">
            <span className="text-white-50 mb-1 d-block" style={{ fontSize: "10px", fontWeight: "600", textTransform: "uppercase" }}>
              Projeye Dahil Edilecek Ekipmanlar
            </span>

            {Object.values(modules).map((mod) => {
              const isSelected = activeTab === mod.id;
              const isVisited = visitedTabs[mod.id];
              const needAttention = mod.checked && !isVisited; // Tikli ama bakılmamışsa uyarı ver

              let textColor = "#ef4444"; // Tiksizse kırmızı
              if (mod.checked) {
                textColor = needAttention ? "#f59e0b" : "#10b981"; // Tikli ama bakılmadıysa turuncu, bakıldıysa yeşil
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
                        accentColor: "#10b981",
                        backgroundColor: mod.checked ? "#10b981" : "transparent",
                        borderColor: mod.checked ? "#10b981" : "#ef4444"
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

                  {/* Durum İkonları */}
                  {mod.checked && (
                    <div className="d-flex align-items-center gap-1">
                      {needAttention ? (
                        <i className="bi bi-exclamation-circle text-warning animate-pulse" style={{ fontSize: "11px" }} title="Lütfen bu adımı kontrol edin"></i>
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

        {/* SAĞ KOLON: ARKA PLANDA ÇALIŞAN DİNAMİK ÖZELLİK DETAY ALANI */}
        <div className="col-md-8 col-12 d-flex flex-column justify-content-center">
          {Object.values(modules).some(m => m.checked) ? (
            <div className="p-3 rounded" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", height: "100%" }}>

              {/* 
                Kritik Değişiklik: Burada '&&' ile render etmek yerine, 
                modül checked ise DOM'a basıyoruz (böylece içindeki useEffect default datayı state'e yazıyor).
                Ancak d-none bootstrap sınıfı ile sadece activeTab olmayanları gizliyoruz.
              */}

              {/* 1. Ön Arıtma Detayı */}
              {modules.onAritma.checked && (
                <div className={activeTab === "onAritma" ? "" : "d-none"}>
                  <OnAritmaDetail data={data} updateData={updateData} />
                </div>
              )}

              {/* 2. Terfi Pompası Detayı */}
              {modules.feedPump.checked && (
                <div className={activeTab === "feedPump" ? "" : "d-none"}>
                  <FeedPumpDetail data={data} updateData={updateData} />
                </div>
              )}

              {/* 3. İleri Arıtma Detayı */}
              {modules.ileriAritma.checked && (
                <div className={activeTab === "ileriAritma" ? "" : "d-none"}>
                  <IleriAritmaDetail data={data} updateData={updateData} />
                </div>
              )}

              {/* 4. Filtrasyon Detayı */}
              {modules.filtrasyon.checked && (
                <div className={activeTab === "filtrasyon" ? "" : "d-none"}>
                  <FiltrasyonDetail data={data} updateData={updateData} />
                </div>
              )}

              {/* 5. Çamur Susuzlaştırma Detayı */}
              {modules.sludgeDewatering.checked && (
                <div className={activeTab === "sludgeDewatering" ? "" : "d-none"}>
                  <SludgeDewateringDetail data={data} updateData={updateData} />
                </div>
              )}

              {/* Eğer aktif sekme seçili modüllerden biri değilse (hepsi gizliyse arka planda) koruyucu mesaj */}
              {!activeTab && (
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