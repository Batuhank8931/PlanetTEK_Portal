import React, { useState, useEffect } from "react";

// Izgara Tipi Seçenekleri
const IZGARA_OPTIONS = ["Manuel Izgara", "Otomatik Mekanik Izgara"];

function OnAritmaDetail({ data, updateData }) {
  const CALC_HOURS = 24;

  // Hesaplamalar ve kontroller için temiz ayrım
  const günlükDebi = data.debi || 0;
  const hourlyFlow = günlükDebi / CALC_HOURS;

  // 1. Manuel müdahale offset state'i
  const [izgaraOffset, setIzgaraOffset] = useState(0);

  // 2. İdeal Izgara İndeksini Hesaplama (Otomatik Seçim)
  const getIdealIzgaraIndex = (currentDebi) => {
    if (!currentDebi) return 0;
    return currentDebi < 50 ? 0 : 1; // <50 Manuel Izgara (0. indeks), >=50 Mekanik Izgara (1. indeks)
  };

  // 3. Yağ Tutucu Boyutu Belirleme
  const getYagTutucuBoyut = (currentDebi) => {
    if (!currentDebi) return "Seçilmedi";
    if (currentDebi <= 10) return "1000 x 1000 mm";
    if (currentDebi <= 25) return "1500 x 1000 mm";
    if (currentDebi <= 50) return "1500 x 1500 mm";
    if (currentDebi <= 100) return "1500 x 2000 mm";
    if (currentDebi <= 150) return "2000 x 2000 mm";
    if (currentDebi <= 250) return "2500 x 2000 mm";
    return "2500 x 2500 mm";
  };

  // --- Izgara Nihai Karar Mekanizması ---
  const idealIzgaraIndex = getIdealIzgaraIndex(günlükDebi);
  let finalIzgaraIndex = idealIzgaraIndex + izgaraOffset;

  // Sınır kontrolleri (Dizi dışına çıkmasın)
  if (finalIzgaraIndex < 0) finalIzgaraIndex = 0;
  if (finalIzgaraIndex >= IZGARA_OPTIONS.length) finalIzgaraIndex = IZGARA_OPTIONS.length - 1;

  const selectedIzgara = IZGARA_OPTIONS[finalIzgaraIndex];
  const calculatedYagTutucu = getYagTutucuBoyut(günlükDebi);

  // Ana debi her değiştiğinde manuel kaydırmayı sıfırla
  useEffect(() => {
    setIzgaraOffset(0);
  }, [günlükDebi]);

  // updateData ile parent state'ini doğrudan besleyen tetikleyici
  // --- DÜZELTİLMİŞ SEKTÖR ---
  useEffect(() => {
    if (updateData) {
      // Sadece üst bileşendeki veri bizim hesapladığımızdan farklıysa güncelleme yap!
      if (
        data.izgaraTipi !== selectedIzgara ||
        data.yagTutucuBoyut !== calculatedYagTutucu
      ) {
        updateData({
          ...data,
          izgaraTipi: selectedIzgara,
          yagTutucuBoyut: calculatedYagTutucu
        });
      }
    }
    // data.izgaraTipi ve data.yagTutucuBoyut bağımlılıklarını eklemek 
    // güncel durumu doğru kıyaslamak için şarttır.
  }, [selectedIzgara, calculatedYagTutucu, data.izgaraTipi, data.yagTutucuBoyut, updateData]);


  return (
    <div className="d-flex flex-column gap-3">
      {/* Alt Başlık Bilgisi */}
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
            <div className="fw-bold text-white text-truncate pe-1" style={{ fontSize: "11px" }} title={selectedIzgara}>
              {selectedIzgara}
            </div>

            {/* Manuel Değiştirme Butonları */}
            <div className="d-flex gap-1 flex-shrink-0">
              <button
                type="button"
                className="btn btn-dark p-0 d-flex align-items-center justify-content-center"
                style={{ width: "20px", height: "20px", backgroundColor: "#1e293b", border: "1px solid #334155" }}
                disabled={finalIzgaraIndex <= 0}
                onClick={() => setIzgaraOffset(prev => prev - 1)}
                title="Bir Alt Seçenek"
              >
                <i className="bi bi-chevron-down text-white" style={{ fontSize: "9px" }}></i>
              </button>

              <button
                type="button"
                className="btn btn-dark p-0 d-flex align-items-center justify-content-center"
                style={{ width: "20px", height: "20px", backgroundColor: "#1e293b", border: "1px solid #334155" }}
                disabled={finalIzgaraIndex >= IZGARA_OPTIONS.length - 1}
                onClick={() => setIzgaraOffset(prev => prev + 1)}
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
            title={calculatedYagTutucu}
          >
            {calculatedYagTutucu}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnAritmaDetail;