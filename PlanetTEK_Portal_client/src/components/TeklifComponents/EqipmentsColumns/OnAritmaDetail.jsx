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
  
  // onAritma artık doğrudan equipments objesinin altında (modulesState yanında)
  const storeOnAritma = equipmentsCache.onAritma || {};

  // Store'daki mevcut değerler (Yoksa default değerler)
  const izgaraOffset = storeOnAritma.izgaraOffset || 0;
  const currentIzgaraTipi = storeOnAritma.izgaraTipi || IZGARA_OPTIONS[0];
  const currentYagTutucuBoyut = storeOnAritma.yagTutucuBoyut || "Seçilmedi";

  // 2. YARDIMCI HESAPLAMA FONKSİYONLARI
  const getIdealIzgaraIndex = (debi) => {
    if (!debi) return 0;
    return debi < 50 ? 0 : 1; // <50 Manuel, >=50 Mekanik
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
  // Bu effect sadece bileşen yüklendiğinde ve `günlükDebi` değiştiğinde çalışır.
  useEffect(() => {
    const idealIndex = getIdealIzgaraIndex(günlükDebi);
    
    // Offset'i de hesaba katarak default indeksi buluyoruz
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
        ...equipmentsCache, // Mevcut diğer tüm alanları (modulesState, ileriAritma vs.) koru
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

  // 4. MANUEL BUTON TIKLAMA REAKSİYONU
  const handleOffsetChange = (direction) => {
    const nextOffset = izgaraOffset + direction;
    const idealIndex = getIdealIzgaraIndex(günlükDebi);
    
    let targetIndex = idealIndex + nextOffset;
    if (targetIndex < 0 || targetIndex >= IZGARA_OPTIONS.length) return; // Sınır dışı ise engelle

    updateSection("equipments", {
      ...equipmentsCache, // Mevcut verileri koru
      onAritma: {
        ...storeOnAritma,
        izgaraOffset: nextOffset,
        izgaraTipi: IZGARA_OPTIONS[targetIndex],
        yagTutucuBoyut: currentYagTutucuBoyut // Mevcut yağ tutucuyu koru
      }
    });
  };

  // UI butonlarının disable durumları için anlık index kontrolü
  const idealIndex = getIdealIzgaraIndex(günlükDebi);
  const finalIzgaraIndex = idealIndex + izgaraOffset;

  return (
    <div className="d-flex flex-column gap-3">
      <div className="text-white-50 border-bottom pb-1 mb-1" style={{ fontSize: "11px", fontWeight: "600" }}>
        ÖN ARITMA PARAMETRELERİ
      </div>

      <div className="row g-2">
        {/* 1. Ön Arıtma Izgarası Seçimi */}
        <div className="col-6">
          <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>
            1. Ön Arıtma Izgarası
          </label>
          <div
            className="d-flex align-items-center justify-content-between p-1 px-2"
            style={{
              backgroundColor: "#0f172a",
              borderBottom: izgaraOffset !== 0 ? "2px solid #f59e0b" : "2px solid #10b981",
              borderRadius: "4px",
              height: "36px"
            }}
          >
            <div className="fw-bold text-white text-truncate pe-1" style={{ fontSize: "11px" }} title={currentIzgaraTipi}>
              {currentIzgaraTipi}
            </div>

            {/* Manuel Değiştirme Butonları */}
            <div className="d-flex gap-1 flex-shrink-0">
              <button
                type="button"
                className="btn btn-dark p-0 d-flex align-items-center justify-content-center"
                style={{ width: "20px", height: "20px", backgroundColor: "#1e293b", border: "1px solid #334155" }}
                disabled={finalIzgaraIndex <= 0}
                onClick={() => handleOffsetChange(-1)}
                title="Bir Alt Seçenek"
              >
                <i className="bi bi-chevron-down text-white" style={{ fontSize: "9px" }}></i>
              </button>

              <button
                type="button"
                className="btn btn-dark p-0 d-flex align-items-center justify-content-center"
                style={{ width: "20px", height: "20px", backgroundColor: "#1e293b", border: "1px solid #334155" }}
                disabled={finalIzgaraIndex >= IZGARA_OPTIONS.length - 1}
                onClick={() => handleOffsetChange(1)}
                title="Bir Üst Seçenek"
              >
                <i className="bi bi-chevron-up text-white" style={{ fontSize: "9px" }}></i>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Yağ Tutucu Boyutu Gösterimi */}
        <div className="col-6">
          <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>
            2. Yağ Tutucu Boyutu
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