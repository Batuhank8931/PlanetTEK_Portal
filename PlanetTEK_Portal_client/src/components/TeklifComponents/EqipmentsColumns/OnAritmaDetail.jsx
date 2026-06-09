import React, { useEffect } from "react";
import { useTeklifStore } from "../../../utils/teklifStore";

// Izgara Tipi Seçenekleri
const IZGARA_OPTIONS = ["Manuel Izgara", "Otomatik Mekanik Izgara"];

function OnAritmaDetail() {
  // 1. ZUSTAND STORE BAĞLANTISI
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  // Bir önceki adımdan gelen debi
  const günlükDebi = parseFloat(formData.planetDiskDetails?.debi) || 0;

  // Store hiyerarşisini doğrudan equipments altından okuyoruz
  const equipmentsCache = formData.equipments || {};
  
  // onAritma artık doğrudan equipments objesinin altında
  const storeOnAritma = equipmentsCache.onAritma || {};

  // Store'daki mevcut değerler (Yoksa default değerler)
  const izgaraOffset = storeOnAritma.izgaraOffset || 0;
  const currentIzgaraTipi = storeOnAritma.izgaraTipi || IZGARA_OPTIONS[0];
  const currentYagTutucuBoyut = storeOnAritma.yagTutucuBoyut || "Seçilmedi";

  // 2. YARDIMCI HESAPLAMA FONKSİYONLARI
  const getIdealIzgaraIndex = (debi) => {
    if (!debi) return 0;
    return debi < 50 ? 0 : 1; // <50 Manuel (0), >=50 Mekanik (1)
  };

  const getYagTutucuBoyut = (debi) => {
    if (!debi) return "Seçilmedi";
    if (debi <= 10) return "1000 x 1000 mm";
    if (debi <= 25) return "1500 x 1000 mm";
    if (debi <= 50) return "1500 x 1500 mm";
    if (debi <= 100) return "1500 x 2000 mm";
    if (debi <= 150) return "2000 x 2000 mm";
    if (debi <= 250) return "2500 x 2000 mm";
    return "2500 x 2500 mm";
  };

  // 3. EFFECT: İLK RENDER VE DEBİ DEĞİŞİMİNDE DEFAULT DATA ATAMA
  useEffect(() => {
    const idealIndex = getIdealIzgaraIndex(günlükDebi);
    
    // Offset'i de hesaba katarak store'da kayıtlı olan veya default indeksi buluyoruz
    let finalIndex = idealIndex + izgaraOffset;
    if (finalIndex < 0) finalIndex = 0;
    if (finalIndex >= IZGARA_OPTIONS.length) finalIndex = IZGARA_OPTIONS.length - 1;

    const defaultIzgara = IZGARA_OPTIONS[finalIndex];
    const defaultYagTutucu = getYagTutucuBoyut(günlükDebi);

    // Eğer store'daki veriler hedef verilerle uyuşmuyorsa store'u güncelle
    if (
      !storeOnAritma.izgaraTipi || 
      storeOnAritma.izgaraTipi !== defaultIzgara || 
      storeOnAritma.yagTutucuBoyut !== defaultYagTutucu
    ) {
      updateSection("equipments", {
        ...equipmentsCache,
        onAritma: {
          ...storeOnAritma,
          izgaraOffset: izgaraOffset,
          izgaraTipi: defaultIzgara,
          yagTutucuBoyut: defaultYagTutucu
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [günlükDebi]); 

  // 4. DROPDOWN SEÇİM REAKSİYONU (YENİ EKLEDİĞİMİZ KISIM)
  const handleDropdownChange = (newTipi) => {
    const idealIndex = getIdealIzgaraIndex(günlükDebi);
    const selectedIndex = IZGARA_OPTIONS.indexOf(newTipi);

    if (selectedIndex === -1) return;

    // Seçilen elemanın ideal indekse göre farkını hesaplayıp offset olarak kaydediyoruz
    const newOffset = selectedIndex - idealIndex;

    updateSection("equipments", {
      ...equipmentsCache,
      onAritma: {
        ...storeOnAritma,
        izgaraOffset: newOffset,
        izgaraTipi: newTipi,
        yagTutucuBoyut: currentYagTutucuBoyut
      }
    });
  };

  return (
    <div className="d-flex flex-column gap-3">
      <div className="text-white-50 border-bottom pb-1 mb-1" style={{ fontSize: "11px", fontWeight: "600" }}>
        ÖN ARITMA PARAMETRELERİ
      </div>

      <div className="row g-2">
        {/* 1. Ön Arıtma Izgarası Seçimi */}
        <div className="col-6">
          <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>
            Ön Arıtma Izgarası
          </label>
          
          <select
            className="form-select form-select-sm text-white fw-bold text-center"
            style={{ 
              backgroundColor: "rgba(245, 158, 11, 0.15)", 
              // Eğer sistemin önerdiğinden farklıysa (offset !== 0) turuncu border, ideal ise yeşil border
              border: izgaraOffset !== 0 ? "1px solid #f59e0b" : "1px solid #10b981", 
              borderRadius: "6px", 
              fontSize: "12px", 
              height: "36px" // Diğer kutuyla simetrik olsun diye 36px yaptım
            }}
            value={currentIzgaraTipi}
            onChange={(e) => handleDropdownChange(e.target.value)}
          >
            {IZGARA_OPTIONS.map((option, idx) => (
              <option key={idx} value={option} style={{ backgroundColor: "#1e293b" }}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Yağ Tutucu Boyutu Gösterimi */}
        <div className="col-6">
          <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>
            Yağ Tutucu Plakaları x 3
          </label>
          <div
            className="p-2 text-white text-center fw-bold text-truncate"
            style={{
              backgroundColor: "#0f172a",
              fontSize: "11px",
              borderBottom: "2px solid #10b981",
              borderRadius: "4px",
              height: "36px",
              lineHeight: "20px"
            }}
            title={currentYagTutucuBoyut}
          >
            {currentYagTutucuBoyut}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnAritmaDetail;