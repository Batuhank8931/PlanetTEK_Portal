import React, { useEffect, useMemo } from "react";
import { useTeklifStore } from "../../../utils/teklifStore";

const IZGARA_OPTIONS = ["Otomatik Mekanik Izgara", "Manuel Izgara"];

const YAG_TUTUCU_OPTIONS = [
  "1000 x 1000 mm",
  "1500 x 1000 mm",
  "1500 x 1500 mm",
  "1500 x 2000 mm",
  "2000 x 2000 mm",
  "2500 x 2000 mm",
  "2500 x 2500 mm"
];

const YAG_TUTUCU_KAPASITE_MAP = {
  100: "1000 x 1000 mm",
  300: "1500 x 1000 mm",
  400: "1500 x 1500 mm",
  500: "1500 x 2000 mm",
  600: "1500 x 2000 mm",
  700: "2000 x 2000 mm",
  900: "2500 x 2000 mm",
  99999: "2500 x 2500 mm"
};

function OnAritmaDetail() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const günlükDebi = parseFloat(formData.planetDiskDetails?.debi) || 0;
  const equipmentsCache = formData.equipments || {};
  const storeOnAritma = equipmentsCache.onAritma || {};

  // --- ANA DEBİ DEĞİŞİM KONTROLÜ (Pompa Sayfasındakiyle Aynı Mantık) ---
  const lastCalculatedMainDebi = storeOnAritma.calculatedMainDebi !== undefined ? storeOnAritma.calculatedMainDebi : null;
  const isMainDebiChanged = lastCalculatedMainDebi !== null && lastCalculatedMainDebi !== günlükDebi;

  // Eğer ana debi değiştiyse offsetleri sıfır kabul et, değişmediyse store'dan oku
  const izgaraOffset = !isMainDebiChanged ? (storeOnAritma.izgaraOffset || 0) : 0;
  const yagTutucuOffset = !isMainDebiChanged ? (storeOnAritma.yagTutucuOffset || 0) : 0;
  const isInputsChanged = !isMainDebiChanged ? (storeOnAritma.isManualUserControl || false) : false;

  // İdeal indeks hesaplayıcılar (useMemo ile optimize edildi)
  const idealIzgaraIndex = useMemo(() => {
    if (!günlükDebi) return 0;
    return günlükDebi < 50 ? 0 : 1;
  }, [günlükDebi]);

  const idealYagTutucuIndex = useMemo(() => {
    if (!günlükDebi) return 0;
    const kapasiteler = Object.keys(YAG_TUTUCU_KAPASITE_MAP).map(Number).sort((a, b) => a - b);
    const uygunKapasite = kapasiteler.find((k) => günlükDebi <= k) || 99999;
    const boyutMetni = YAG_TUTUCU_KAPASITE_MAP[uygunKapasite];
    return YAG_TUTUCU_OPTIONS.indexOf(boyutMetni);
  }, [günlükDebi]);

  // Offset değerlerine göre nihai seçilen opsiyonlar
  const { currentIzgaraTipi, currentYagTutucuBoyut } = useMemo(() => {
    let finalIzgaraIdx = idealIzgaraIndex + izgaraOffset;
    if (finalIzgaraIdx < 0) finalIzgaraIdx = 0;
    if (finalIzgaraIdx >= IZGARA_OPTIONS.length) finalIzgaraIdx = IZGARA_OPTIONS.length - 1;

    let finalYagIdx = idealYagTutucuIndex + yagTutucuOffset;
    if (finalYagIdx < 0) finalYagIdx = 0;
    if (finalYagIdx >= YAG_TUTUCU_OPTIONS.length) finalYagIdx = YAG_TUTUCU_OPTIONS.length - 1;

    return {
      currentIzgaraTipi: IZGARA_OPTIONS[finalIzgaraIdx],
      currentYagTutucuBoyut: YAG_TUTUCU_OPTIONS[finalYagIdx]
    };
  }, [idealIzgaraIndex, idealYagTutucuIndex, izgaraOffset, yagTutucuOffset]);

  // Merkezi Store Güncelleme Fonksiyonu
  const updateOnAritmaStore = (nextIzgaraOffset, nextYagOffset, isManual = true) => {
    let finalIzgaraIdx = idealIzgaraIndex + nextIzgaraOffset;
    if (finalIzgaraIdx < 0) finalIzgaraIdx = 0;
    if (finalIzgaraIdx >= IZGARA_OPTIONS.length) finalIzgaraIdx = IZGARA_OPTIONS.length - 1;

    let finalYagIdx = idealYagTutucuIndex + nextYagOffset;
    if (finalYagIdx < 0) finalYagIdx = 0;
    if (finalYagIdx >= YAG_TUTUCU_OPTIONS.length) finalYagIdx = YAG_TUTUCU_OPTIONS.length - 1;

    updateSection("equipments", {
      ...equipmentsCache,
      onAritma: {
        ...storeOnAritma,
        izgaraOffset: nextIzgaraOffset,
        yagTutucuOffset: nextYagOffset,
        izgaraTipi: IZGARA_OPTIONS[finalIzgaraIdx],
        yagTutucuBoyut: YAG_TUTUCU_OPTIONS[finalYagIdx],
        isManualUserControl: isManual,
        calculatedMainDebi: günlükDebi
      }
    });
  };

  // Ana debi değiştiğinde veya ilk kurulumda tetiklenen useEffect
  useEffect(() => {
    if (günlükDebi === 0) return;

    if (!storeOnAritma.izgaraTipi || isMainDebiChanged || !isInputsChanged) {
      // Debi değiştiğinde offsetleri sıfırlayarak otomatik hesaplama moduna alıyoruz
      updateOnAritmaStore(0, 0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [günlükDebi, isMainDebiChanged]);

  const handleIzgaraChange = (newTipi) => {
    const selectedIndex = IZGARA_OPTIONS.indexOf(newTipi);
    if (selectedIndex === -1) return;
    const nextOffset = selectedIndex - idealIzgaraIndex;
    updateOnAritmaStore(nextOffset, yagTutucuOffset, true);
  };

  const handleYagTutucuChange = (newBoyut) => {
    const selectedIndex = YAG_TUTUCU_OPTIONS.indexOf(newBoyut);
    if (selectedIndex === -1) return;
    const nextOffset = selectedIndex - idealYagTutucuIndex;
    updateOnAritmaStore(izgaraOffset, nextOffset, true);
  };

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
              YAG_TUTUCU_OPTIONS.map((option, idx) => (
                <option key={idx} value={option} style={{ backgroundColor: "#1e293b" }}>
                  {option}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Eğer herhangi biri manuel değiştirildiyse geri dönme butonu (Pompa sayfasındaki gibi opsiyonel konfor) */}
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