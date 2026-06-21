import React, { useEffect, useMemo, useState } from "react";
import { useTeklifStore } from "../../../utils/teklifStore";
import API from "../../../utils/utilRequest";

const IZGARA_OPTIONS = ["Otomatik Mekanik Izgara", "Manuel Izgara"];

function OnAritmaDetail() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const günlükDebi = parseFloat(formData.planetDiskDetails?.debi) || 0;
  const equipmentsCache = formData.equipments || {};
  const storeOnAritma = equipmentsCache.onAritma || {};

  // --- LOCAL STATELER ---
  const [yagTutucuOptions, setYagTutucuOptions] = useState([]);
  const [yagTutucuKapasiteOptions, setYagTutucuKapasiteOptions] = useState({}); // { 50: "Boyut A", 100: "Boyut B" }
  const [boyutKapasiteMap, setBoyutKapasiteMap] = useState({}); // { "Boyut A": 50, "Boyut B": 100 }
  const [isLoading, setIsLoading] = useState(true);

  // --- ANA DEBİ DEĞİŞİM KONTROLÜ ---
  const lastCalculatedMainDebi = storeOnAritma.calculatedMainDebi !== undefined ? storeOnAritma.calculatedMainDebi : null;
  const isMainDebiChanged = lastCalculatedMainDebi !== null && lastCalculatedMainDebi !== günlükDebi;

  const izgaraOffset = !isMainDebiChanged ? (storeOnAritma.izgaraOffset || 0) : 0;
  const yagTutucuOffset = !isMainDebiChanged ? (storeOnAritma.yagTutucuOffset || 0) : 0;
  const isInputsChanged = !isMainDebiChanged ? (storeOnAritma.isManualUserControl || false) : false;

  // İdeal indeks hesaplayıcılar (Izgara Tipi İçin)
  const idealIzgaraIndex = useMemo(() => {
    if (!günlükDebi) return 0;
    return günlükDebi < 50 ? 0 : 1; // Şartına göre ideal seçimi belirler
  }, [günlükDebi]);

  // 🔄 FETCH PARAMETERS: Gelen 3'lü Obje Yapısına Göre Revize Edildi
  const fetchParameters = async () => {
    try {
      setIsLoading(true);
      const response = await API.getScreenData();
      
      // 🌟 OYUNU DEĞİŞTİREN YER: Gelen datayı destrucuring ile yakalıyoruz
      const { greaseTrap = [] } = response.data || {};

      const uniqueBoyutlar = new Set();
      const kapasiteMap = {};
      const tersMap = {};

      // Yağ tutucu opsiyonlarını ve kapasite ilişkilerini sadece greaseTrap tablosundan üretiyoruz
      greaseTrap.forEach(item => {
        if (item.plakaboyut) {
          const temizBoyut = item.plakaboyut.trim();
          uniqueBoyutlar.add(temizBoyut);

          if (item.kapasite) {
            // "200 m³/gün" -> 200
            const kapasiteSayi = parseInt(item.kapasite.replace(/[^\d]/g, ''), 10);
            if (!isNaN(kapasiteSayi)) {
              kapasiteMap[kapasiteSayi] = temizBoyut;
              tersMap[temizBoyut] = kapasiteSayi;
            }
          }
        }
      });

      setYagTutucuOptions(Array.from(uniqueBoyutlar));
      setYagTutucuKapasiteOptions(kapasiteMap);
      setBoyutKapasiteMap(tersMap);

    } catch (error) {
      console.error("Parametre verileri yüklenirken hata oldu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParameters();
  }, []);

  // İdeal otomatik kapasiteyi ve boyutu bulur
  const { idealKapasite, idealYagTutucuIndex } = useMemo(() => {
    if (!günlükDebi || isLoading) return { idealKapasite: 0, idealYagTutucuIndex: 0 };
    
    const kapasiteler = Object.keys(yagTutucuKapasiteOptions).map(Number).sort((a, b) => a - b);
    const uygunKapasite = kapasiteler.find((k) => günlükDebi <= k) || (kapasiteler[kapasiteler.length - 1] || 0);
    const boyutMetni = yagTutucuKapasiteOptions[uygunKapasite];
    const index = yagTutucuOptions.indexOf(boyutMetni);
    
    return {
      idealKapasite: uygunKapasite,
      idealYagTutucuIndex: index !== -1 ? index : 0
    };
  }, [günlükDebi, yagTutucuKapasiteOptions, yagTutucuOptions, isLoading]);

  // Offset değerlerine göre nihai seçilen opsiyonlar
  const { currentIzgaraTipi, currentYagTutucuBoyut } = useMemo(() => {
    if (isLoading) return { currentIzgaraTipi: "", currentYagTutucuBoyut: "" };

    let finalIzgaraIdx = idealIzgaraIndex + izgaraOffset;
    if (finalIzgaraIdx < 0) finalIzgaraIdx = 0;
    if (finalIzgaraIdx >= IZGARA_OPTIONS.length) finalIzgaraIdx = IZGARA_OPTIONS.length - 1;

    let finalYagIdx = idealYagTutucuIndex + yagTutucuOffset;
    if (finalYagIdx < 0) finalYagIdx = 0;
    if (finalYagIdx >= yagTutucuOptions.length) finalYagIdx = yagTutucuOptions.length - 1;

    return {
      currentIzgaraTipi: IZGARA_OPTIONS[finalIzgaraIdx],
      currentYagTutucuBoyut: yagTutucuOptions[finalYagIdx]
    };
  }, [idealIzgaraIndex, idealYagTutucuIndex, izgaraOffset, yagTutucuOffset, yagTutucuOptions, isLoading]);

  // Merkezi Store Güncelleme Fonksiyonu
  const updateOnAritmaStore = (nextIzgaraOffset, nextYagOffset, isManual = true) => {
    if (isLoading) return;

    let finalIzgaraIdx = idealIzgaraIndex + nextIzgaraOffset;
    if (finalIzgaraIdx < 0) finalIzgaraIdx = 0;
    if (finalIzgaraIdx >= IZGARA_OPTIONS.length) finalIzgaraIdx = IZGARA_OPTIONS.length - 1;

    let finalYagIdx = idealYagTutucuIndex + nextYagOffset;
    if (finalYagIdx < 0) finalYagIdx = 0;
    if (finalYagIdx >= yagTutucuOptions.length) finalYagIdx = yagTutucuOptions.length - 1;

    const yeniKapasite = !isManual ? idealKapasite : (storeOnAritma.onAritmaKapasite || idealKapasite);

    updateSection("equipments", {
      ...equipmentsCache,
      onAritma: {
        ...storeOnAritma,
        izgaraOffset: nextIzgaraOffset,
        yagTutucuOffset: nextYagOffset,
        izgaraTipi: IZGARA_OPTIONS[finalIzgaraIdx],
        yagTutucuBoyut: yagTutucuOptions[finalYagIdx],
        onAritmaKapasite: yeniKapasite,
        isManualUserControl: isManual,
        calculatedMainDebi: günlükDebi
      }
    });
  };

  useEffect(() => {
    if (günlükDebi === 0 || isLoading) return;

    if (!storeOnAritma.izgaraTipi || isMainDebiChanged || !isInputsChanged) {
      updateOnAritmaStore(0, 0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [günlükDebi, isMainDebiChanged, isLoading, idealKapasite]);

  const handleIzgaraChange = (newTipi) => {
    const selectedIndex = IZGARA_OPTIONS.indexOf(newTipi);
    if (selectedIndex === -1) return;
    const nextOffset = selectedIndex - idealIzgaraIndex;
    updateOnAritmaStore(nextOffset, yagTutucuOffset, true);
  };

  const handleYagTutucuChange = (newBoyut) => {
    const selectedIndex = yagTutucuOptions.indexOf(newBoyut);
    if (selectedIndex === -1) return;
    const nextOffset = selectedIndex - idealYagTutucuIndex;
    updateOnAritmaStore(izgaraOffset, nextOffset, true);
  };

  const gosterilenKapasite = boyutKapasiteMap[currentYagTutucuBoyut] || 0;

  if (isLoading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-4 gap-2 text-white-50">
        <div className="spinner-border spinner-border-sm text-warning" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
        <div style={{ fontSize: "11px" }}>Ön Arıtma Parametreleri Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      <div className="text-white-50 border-bottom pb-1 mb-1" style={{ fontSize: "11px", fontWeight: "600" }}>
        ÖN ARITMA PARAMETRELERİ
      </div>

      <div className="row g-2">
        {/* Ön Arıtma Izgarası */}
        <div className="col-6">
          <div className="d-flex justify-content-between align-items-center mb-1 px-1">
            <label className="text-white-50 block" style={{ fontSize: "10px" }}>
              Ön Arıtma Izgarası
            </label>
          </div>
          <select
            className="form-select form-select-sm text-white fw-bold text-center"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.15)",
              border: izgaraOffset !== 0 ? "1px solid #f59e0b" : "1px solid #10b981",
              borderRadius: "6px",
              fontSize: "12px",
              height: "36px"
            }}
            value={currentIzgaraTipi}
            disabled={günlükDebi === 0}
            onChange={(e) => handleIzgaraChange(e.target.value)}
          >
            {günlükDebi === 0 ? (
              <option value="">---</option>
            ) : (
              IZGARA_OPTIONS.map((option, idx) => (
                <option key={idx} value={option} style={{ backgroundColor: "#1e293b" }}>
                  {option}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Yağ Tutucu Dropdown */}
        <div className="col-6">
          <div className="d-flex justify-content-between align-items-center mb-1 px-1">
            <label className="text-white-50 block" style={{ fontSize: "10px" }}>
              Yağ Tutucu Plakaları x 3
            </label>
            {yagTutucuOffset !== 0 && (
              <span className="badge bg-warning text-dark" style={{ fontSize: '8px', padding: '2px 4px' }}>Manuel</span>
            )}
          </div>
          <select
            className="form-select form-select-sm text-white fw-bold text-center"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.15)",
              border: yagTutucuOffset !== 0 ? "1px solid #f59e0b" : "1px solid #10b981",
              borderRadius: "6px",
              fontSize: "11px",
              height: "36px"
            }}
            value={currentYagTutucuBoyut}
            disabled={günlükDebi === 0}
            onChange={(e) => handleYagTutucuChange(e.target.value)}
          >
            {günlükDebi === 0 ? (
              <option value="">---</option>
            ) : (
              yagTutucuOptions.map((option, idx) => (
                <option key={idx} value={option} style={{ backgroundColor: "#1e293b" }}>
                  {option}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Kapasite Bilgilendirme Alanları */}
      {günlükDebi > 0 && (
        <div className="row g-2 px-1 mt-1 text-white-50" style={{ fontSize: "10px" }}>
          <div className="col-6">
            <span>Hesaplanan Sabit Kapasite: </span>
            <strong className="text-success">{storeOnAritma.onAritmaKapasite || 0} m³/gün</strong>
          </div>
          <div className="col-6 text-end">
            <span>Seçilen Plaka Kapasitesi: </span>
            <strong className={yagTutucuOffset !== 0 ? "text-warning" : "text-success"}>
              {gosterilenKapasite} m³/gün
            </strong>
          </div>
        </div>
      )}

      {/* Eğer herhangi biri manuel değiştirildiyse geri dönme butonu */}
      {(izgaraOffset !== 0 || yagTutucuOffset !== 0) && (
        <div className="d-flex justify-content-end mt-1">
          <button
            type="button"
            className="btn btn-link btn-sm text-warning p-0 text-decoration-none"
            style={{ fontSize: "11px" }}
            onClick={() => updateOnAritmaStore(0, 0, false)}
          >
            <i className="bi bi-arrow-counterclockwise me-1"></i> Otomatik Hesaplamaya Dön
          </button>
        </div>
      )}
    </div>
  );
}

export default OnAritmaDetail;