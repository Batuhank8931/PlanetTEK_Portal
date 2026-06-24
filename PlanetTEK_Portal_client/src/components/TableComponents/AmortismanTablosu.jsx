import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";

function AmortismanTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  // Store'dan gerekli parametrelerin güvenli bir şekilde okunması
  const storeDebi = parseFloat(formData?.planetDiskDetails?.tasarim?.aritmaParametreleri?.debi) || 0;
  const planetCapex = parseFloat(formData?.tables?.capextablosu?.totalNetPrice) || 0;
  const annualOpexGideri = parseFloat(formData?.tables?.sarfmalzemettablosu?.grandTotal) || 0;

  // Store'da önceden kaydedilmiş veri var mı kontrolü
  const storeAmortisman = formData?.tables?.amortisman;

  // İlk açılışta veya yenilemede atanacak başlangıç değerleri
  const getInitialData = () => {
    if (storeAmortisman && Object.keys(storeAmortisman).length > 0 && storeAmortisman.dailyUsage !== undefined) {
      return {
        dailyUsage: storeAmortisman.dailyUsage,
        activeMonths: storeAmortisman.activeMonths,
        waterPrice: storeAmortisman.waterPrice,
        plantCost: storeAmortisman.plantCost,
        annualOpex: annualOpexGideri
      };
    }
    return {
      dailyUsage: storeDebi > 0 ? storeDebi : 70,
      activeMonths: 7,
      waterPrice: 1.59,
      plantCost: planetCapex > 0 ? planetCapex : 327457,
      annualOpex: annualOpexGideri
    };
  };

  const [data, setData] = useState(getInitialData);
  const [history, setHistory] = useState([]);

  // Bağımlılıklar ilk yüklendiğinde store boşsa tetiklensin
  useEffect(() => {
    if (!storeAmortisman || Object.keys(storeAmortisman).length === 0) {
      const initial = getInitialData();
      setData(initial);
      syncWithStore(initial);
    }
  }, [storeDebi, planetCapex, annualOpexGideri]);

  // Hesaplamaları dinamik yapan ve hem yerel state'i hem store'u güncelleyen yardımcı fonksiyon
  const syncWithStore = (updatedData) => {
    const monthlyUsage = updatedData.dailyUsage * 30;
    const yearlyUsage = monthlyUsage * updatedData.activeMonths;
    const yearlyWaterCost = yearlyUsage * updatedData.waterPrice;
    const netAnnualSaving = yearlyWaterCost - updatedData.annualOpex;

    const roiYears = netAnnualSaving > 0 ? updatedData.plantCost / netAnnualSaving : 0;
    const roiMonths = roiYears * 12;
    const exactYearRound = Math.ceil(roiYears); // Hep yukarı yuvarlar

    updateSection("tables", {
      ...formData?.tables,
      amortisman: {
        ...updatedData,
        monthlyUsage,
        yearlyUsage,
        yearlyWaterCost,
        netAnnualSaving,
        roiYears,
        roiMonths,
        exactYearRound
      }
    });
  };

  const saveToHistory = (currentState) => {
    setHistory([...history, JSON.stringify(currentState)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousData = JSON.parse(history[history.length - 1]);
    setData(previousData);
    syncWithStore(previousData);
    setHistory(history.slice(0, -1));
  };

  // REFRESH BUTONU - Parametreleri fabrika ayarlarına döndürür ve store'a yazar
  const handleRefresh = () => {
    setHistory([]);
    const freshData = {
      dailyUsage: storeDebi > 0 ? storeDebi : 70,
      activeMonths: 7,
      waterPrice: 1.59,
      plantCost: planetCapex > 0 ? planetCapex : 327457,
      annualOpex: annualOpexGideri
    };
    setData(freshData);
    syncWithStore(freshData);
  };

  const handleChange = (field, value) => {
    saveToHistory(data);
    const updated = { ...data, [field]: parseFloat(value) || 0 };
    setData(updated);
    syncWithStore(updated);
  };

  // Render içi anlık hesaplamalar
  const monthlyUsage = data.dailyUsage * 30;
  const yearlyUsage = monthlyUsage * data.activeMonths;
  const yearlyWaterCost = yearlyUsage * data.waterPrice;
  const netAnnualSaving = yearlyWaterCost - data.annualOpex;
  const roiYears = netAnnualSaving > 0 ? data.plantCost / netAnnualSaving : 0;
  const roiMonths = roiYears * 12;
  const exactYearRound = Math.ceil(roiYears); // Hep yukarı yuvarlar

  return (
    <div className="d-flex flex-column w-100 text-white">
      <style>{`
        .amort-row-layout {
          display: flex;
          align-items: stretch;
          width: 100%;
        }
        .amort-divider-bottom {
          border-bottom: 1px solid #334155;
        }
        .amort-cell-main {
          border-right: 1px solid #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0.6rem 0.5rem;
          font-size: 12px; /* Tüm font boyutları eşitlendi */
        }
        .amort-cell-main:last-child {
          border-right: none;
        }
        .amort-input-field {
          font-size: 12px;
          box-shadow: none;
          width: 90%;
          text-align: center;
          border-bottom: 1px dashed #475569 !important;
          color: white;
          font-weight: bold;
        }
        .amort-input-field:focus {
          outline: none;
          background-color: rgba(255, 255, 255, 0.08) !important;
          border-bottom: 1px solid #60a5fa !important;
        }
        .bg-title-dark { background-color: #090d16; color: #94a3b8; font-weight: 600; }
        .bg-unit-gray { background-color: #1e293b; color: #cbd5e1; font-weight: 600; }
        .bg-value-blue { background-color: #151f32; }
      `}</style>

      <div className="w-100" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div className="d-flex flex-column rounded-3 overflow-hidden border" style={{ borderColor: "#475569", minWidth: "950px" }}>

          {/* ÜST PANEL */}
          <div className="d-flex justify-content-between align-items-center p-3 amort-divider-bottom" style={{ backgroundColor: "#151f32" }}>
            <div className="fw-semibold text-white" style={{ fontSize: "13px" }}>
              Yatırımın Geri Dönüş Süresi (Amortisman) Tablosu
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                onClick={handleRefresh}
                className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
                style={{ backgroundColor: "#d97706", fontSize: "11px", borderRadius: "6px" }}
                title="Tabloyu İlk Ayarlarına Döndür"
              >
                🔄 Yenile
              </button>

              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
                style={{
                  backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a",
                  fontSize: "11px",
                  borderRadius: "6px",
                  opacity: history.length === 0 ? 0.4 : 1,
                  cursor: history.length === 0 ? "not-allowed" : "pointer"
                }}
              >
                ↶
              </button>
            </div>
          </div>

          {/* BÖLÜM 1: SULAMA AMAÇLI ŞEBEKE SUYUNUN ANALİZİ */}
          <div className="d-flex align-items-stretch amort-divider-bottom">
            {/* Büyük Yan Başlık (%30 Genişlik) */}
            <div className="amort-cell-main bg-title-dark text-uppercase" style={{ flex: "0 0 30%" }}>
              Sulama Amaçlı Şebeke Suyu Kullanılırsa
            </div>

            {/* Sağdaki Blok (%70 Genişlik) */}
            <div className="d-flex flex-column" style={{ flex: "0 0 70%" }}>
              {/* 1. Satır: Başlıklar (Her biri tam %20) */}
              <div className="amort-row-layout amort-divider-bottom bg-title-dark" style={{ minHeight: "42px" }}>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>Günlük su kullanımı</div>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>Aylık su kullanımı</div>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>Yılda <input type="number" className="bg-transparent border-0 text-center text-info fw-bold mx-1 p-0" style={{ width: "20px", outline: "none", fontSize: "12px" }} value={data.activeMonths} onChange={(e) => handleChange("activeMonths", e.target.value)} /> ay su kullanımı</div>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>Şebeke suyu birim fiyatı</div>
                <div className="amort-cell-main text-warning" style={{ flex: "0 0 20%" }}>Toplam yıllık su bedeli</div>
              </div>
              {/* 2. Satır: Birimler (Her biri tam %20 - Sütunlar tam kenetlendi) */}
              <div className="amort-row-layout amort-divider-bottom bg-unit-gray" style={{ height: "32px" }}>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>m³/gün</div>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>m³/ay</div>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>m³/yıl</div>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>€</div>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>€/yıl</div>
              </div>
              {/* 3. Satır: Değerler (Her biri tam %20) */}
              <div className="amort-row-layout bg-value-blue" style={{ minHeight: "48px" }}>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>
                  <input type="number" className="form-control form-control-sm bg-transparent border-0 amort-input-field" value={data.dailyUsage} onChange={(e) => handleChange("dailyUsage", e.target.value)} />
                </div>
                <div className="amort-cell-main text-white fw-bold" style={{ flex: "0 0 20%" }}>{monthlyUsage.toLocaleString()}</div>
                <div className="amort-cell-main text-white fw-bold" style={{ flex: "0 0 20%" }}>{yearlyUsage.toLocaleString()}</div>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>
                  <input type="number" step="0.01" className="form-control form-control-sm bg-transparent border-0 amort-input-field" value={data.waterPrice} onChange={(e) => handleChange("waterPrice", e.target.value)} />
                </div>
                <div className="amort-cell-main text-warning fw-bold" style={{ flex: "0 0 20%" }}>{Math.round(yearlyWaterCost).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* BÖLÜM 2: SULAMA AMAÇLI ARITMA TESİSİ ANALİZİ */}
          <div className="d-flex align-items-stretch">
            {/* Sol Büyük Yan Başlık (%30 Genişlik - Üst tarafla milimetrik hizalı) */}
            <div className="amort-cell-main bg-title-dark text-uppercase" style={{ flex: "0 0 30%" }}>
              Sulama Amaçlı Evsel Atıksu Arıtma Tesisinden Çıkan Su Kullanılırsa
            </div>

            {/* Sağdaki Blok (%70 Genişlik) */}
            <div className="d-flex flex-column" style={{ flex: "0 0 70%" }}>
              {/* Satır 1: Başlıklar */}
              <div className="amort-row-layout amort-divider-bottom" style={{ minHeight: "42px" }}>
                <div className="amort-cell-main bg-title-dark" style={{ flex: "0 0 30%" }}>Atıksu Arıtma Tesisinin Yaklaşık Maliyeti</div>
                <div className="amort-cell-main fw-bold" style={{ flex: "0 0 70%", backgroundColor: "#cbd5e1", color: "#0f172a" }}>
                  ATIKSU ARITMA TESİSİNİN AMORTİ ETME SÜRESİ
                </div>
              </div>

              {/* Satır 2: Birimler */}
              <div className="amort-row-layout amort-divider-bottom bg-unit-gray" style={{ height: "32px" }}>
                <div className="amort-cell-main" style={{ flex: "0 0 30%" }}>€</div>
                <div className="amort-cell-main" style={{ flex: "0 0 35%" }}>Yıl</div>
                <div className="amort-cell-main" style={{ flex: "0 0 35%" }}>Ay</div>
              </div>

              {/* Satır 3: Değerler */}
              <div className="amort-row-layout bg-value-blue" style={{ minHeight: "48px" }}>
                <div className="amort-cell-main" style={{ flex: "0 0 30%" }}>
                  <input type="number" className="form-control form-control-sm bg-transparent border-0 amort-input-field text-info" value={data.plantCost} onChange={(e) => handleChange("plantCost", e.target.value)} />
                </div>
                <div className="amort-cell-main text-white fw-bold" style={{ flex: "0 0 35%" }}>
                  {roiYears > 0 ? roiYears.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0"}
                </div>
                <div className="amort-cell-main text-white fw-bold" style={{ flex: "0 0 35%" }}>
                  {roiMonths > 0 ? Math.round(roiMonths).toLocaleString() : "0"}
                </div>
              </div>
            </div>
          </div>

          {/* BÖLÜM 3: ÖZET VE OPERASYONEL NOTLAR PANELİ */}
          <div className="d-flex flex-column value-bg">
            <div className="p-3 text-center border-top" style={{ borderColor: "#334155", backgroundColor: "#111827" }}>
              <span className="text-white-50" style={{ fontSize: "12px" }}>Mevcut şebeke maliyetleri ve işletme giderleri analiz edildiğinde;</span>
              <div className="mt-1 d-flex align-items-center justify-content-center gap-1 flex-wrap" style={{ fontSize: "13px" }}>
                <span className="text-white">Sistem kendisini ancak tam</span>
                <span className="fw-bold px-2 py-0.5 rounded border border-danger text-danger bg-danger-subtle mx-1">
                  {exactYearRound >= 0 ? exactYearRound : 0}
                </span>
                <span className="text-white fw-bold">YILDA</span>
                <span className="text-white">geri döndürebilmektedir.</span>
              </div>
            </div>
            <div className="p-2 text-center border-top" style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}>
              <i className="fw-semibold" style={{ fontSize: "11px", color: "#94a3b8" }}>
                ⚠️ Not: Bu süreye her yıl güncellenen amortisman tablosundaki işletme giderleri ({data.annualOpex.toLocaleString()} €/yıl) dahil edilerek hesaplama yapılmıştır.
              </i>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AmortismanTablosu;