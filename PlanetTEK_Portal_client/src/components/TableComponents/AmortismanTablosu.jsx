import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";

function AmortismanTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const teklifDili = formData?.customerInfo?.teklifDili;
  const isForeign = teklifDili === "Yabancı";

  // 🌟 Canlı Döviz, Kur ve Birim Sistemi Bilgileri Store'dan Alınır
  const currency = formData?.customerInfo?.currency || "EUR";
  const unitSystem = formData?.customerInfo?.unitSystem || "Metric";
  const exchangeRate = parseFloat(formData?.customerInfo?.exchangeRate) || 1.0000;

  // Store verileri (Daima ham Euro ve Metric m³ tabanlı varsayılıyor)
  const storeDebi = parseFloat(formData?.planetDiskDetails?.tasarim?.aritmaParametreleri?.debi) || 0;
  const planetCapex = parseFloat(formData?.tables?.capextablosu?.totalNetPrice) || 0;
  const annualOpexGideri = parseFloat(formData?.tables?.sarfmalzemettablosu?.grandTotal) || 0;

  const storeAmortisman = formData?.tables?.amortisman;

  // 🌟 Lokasyon bazlı format seçimi
  const activeLocale = isForeign ? "en-US" : "tr-TR";

  // Sayı Formatlama Fonksiyonu (Düz Metin Hücreleri İçin)
  const formatNumber = (value, minFraction = 0, maxFraction = 2) => {
    if (isNaN(value)) return "0";
    return value.toLocaleString(activeLocale, {
      minimumFractionDigits: minFraction,
      maximumFractionDigits: maxFraction
    });
  };

  // Input Alanlarında Formatlı Gösterim İçin Yardımcı Fonksiyon
  const formatInputValue = (val, maxDigits = 2) => {
    if (val === undefined || val === null || val === "") return "";
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    
    return num.toLocaleString(activeLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDigits
    });
  };

  // Formatlanmış string girdiyi temiz JS float sayısına çevirme
  const parseInputValue = (val) => {
    if (!val) return 0;
    let cleanVal = val.toString();
    if (isForeign) {
      cleanVal = cleanVal.replace(/,/g, "");
    } else {
      cleanVal = cleanVal.replace(/\./g, "").replace(",", ".");
    }
    return parseFloat(cleanVal) || 0;
  };

  // 🌟 Dinamik Simge Yardımcı Fonksiyonları
  const getCurrencySymbol = () => {
    if (currency === "USD") return "$";
    if (currency === "TRY") return "₺";
    return "€";
  };

  const getFlowUnit = (type) => {
    if (unitSystem === "US") {
      if (type === "day") return "GPD";
      if (type === "month") return "Gallons/month";
      return "Gallons/year";
    }
    return isForeign ? `m³/${type}` : `m³/${type === "day" ? "gün" : type === "month" ? "ay" : "yıl"}`;
  };

  // İlk açılış şablonu (Store'da daima ham değerler tutulur)
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
      dailyUsage: storeDebi > 0 ? storeDebi : 70, // Ham m3/gün
      activeMonths: 7,
      waterPrice: 1.59, // Ham Euro bazlı su metreküp fiyatı
      plantCost: planetCapex > 0 ? planetCapex : 327457, // Ham Euro
      annualOpex: annualOpexGideri // Ham Euro
    };
  };

  const [data, setData] = useState(getInitialData);
  
  // Girdi odak yönetimi için geçici yerel string stateleri
  const [editingCell, setEditingCell] = useState(null); // { field: 'string', value: 'string' }
  const [history, setHistory] = useState([]);

  // 🌟 HESAPLAMA MOTORU & RENDER DEĞERLERİ (Dinamik Birim Dönüşümlü)
  const displayDailyUsage = unitSystem === "US" ? data.dailyUsage * 264.172 : data.dailyUsage;
  const displayMonthlyUsage = displayDailyUsage * 30;
  const displayYearlyUsage = displayMonthlyUsage * data.activeMonths;

  const displayWaterPrice = unitSystem === "US" 
    ? (data.waterPrice / 264.172) * exchangeRate 
    : data.waterPrice * exchangeRate;

  const displayYearlyWaterCost = displayYearlyUsage * displayWaterPrice;
  const displayPlantCost = data.plantCost * exchangeRate;
  const displayAnnualOpex = data.annualOpex * exchangeRate;

  const netAnnualSaving = displayYearlyWaterCost - displayAnnualOpex;
  const roiYears = netAnnualSaving > 0 ? displayPlantCost / netAnnualSaving : 0;
  const roiMonths = roiYears * 12;
  const exactYearRound = Math.ceil(roiYears);

  // 🌟 MERKEZİ STORE'A HEM HAM HEM DE RENDER EDİLEN BÜTÜN DATALARI KAYDEDEN FONKSİYON
  const syncWithStore = (updatedData) => {
    const calcDailyUsage = unitSystem === "US" ? updatedData.dailyUsage * 264.172 : updatedData.dailyUsage;
    const calcMonthlyUsage = calcDailyUsage * 30;
    const calcYearlyUsage = calcMonthlyUsage * updatedData.activeMonths;

    const calcWaterPrice = unitSystem === "US" 
      ? (updatedData.waterPrice / 264.172) * exchangeRate 
      : updatedData.waterPrice * exchangeRate;

    const calcYearlyWaterCost = calcYearlyUsage * calcWaterPrice;
    const calcPlantCost = updatedData.plantCost * exchangeRate;
    const calcAnnualOpex = updatedData.annualOpex * exchangeRate;

    const calcNetAnnualSaving = calcYearlyWaterCost - calcAnnualOpex;
    const calcRoiYears = calcNetAnnualSaving > 0 ? calcPlantCost / calcNetAnnualSaving : 0;
    const calcRoiMonths = calcRoiYears * 12;
    const calcExactYearRound = Math.ceil(calcRoiYears);

    updateSection("tables", {
      ...formData?.tables,
      amortisman: {
        ...updatedData,
        currency,
        unitSystem,
        exchangeRate,
        
        // 🌟 Sayısal Kur/Birim Dönüştürülmüş Render Değerleri
        renderedMetrics: {
          dailyUsage: calcDailyUsage,
          monthlyUsage: calcMonthlyUsage,
          yearlyUsage: calcYearlyUsage,
          waterPrice: calcWaterPrice,
          yearlyWaterCost: calcYearlyWaterCost,
          plantCost: calcPlantCost,
          annualOpex: calcAnnualOpex,
          netAnnualSaving: calcNetAnnualSaving,
          roiYears: calcRoiYears,
          roiMonths: calcRoiMonths,
          exactYearRound: calcExactYearRound
        },

        // 🌟 Excel ve Raporlarda Birebir Kullanılabilecek Formatlanmış Metinler
        renderedSummary: {
          dailyUsageFormatted: `${formatInputValue(calcDailyUsage, 2)}${getFlowUnit("day")}`,
          monthlyUsageFormatted: `${formatNumber(Math.round(calcMonthlyUsage), 0, 0)}${getFlowUnit("month")}`,
          yearlyUsageFormatted: `${formatNumber(Math.round(calcYearlyUsage), 0, 0)}${getFlowUnit("year")}`,
          waterPriceFormatted: `${formatInputValue(calcWaterPrice, 4)} ${getCurrencySymbol()}/${unitSystem === "US" ? "gal" : "m³"}`,
          yearlyWaterCostFormatted: `${formatNumber(Math.round(calcYearlyWaterCost), 0, 0)}${getCurrencySymbol()}`,
          plantCostFormatted: `${formatNumber(Math.round(calcPlantCost), 0, 0)}${getCurrencySymbol()}`,
          annualOpexFormatted: `${formatNumber(Math.round(calcAnnualOpex), 0, 0)}${getCurrencySymbol()}`,
          roiYearsFormatted: calcRoiYears > 0 ? formatNumber(calcRoiYears, 2, 2) : "0",
          roiMonthsFormatted: calcRoiMonths > 0 ? formatNumber(Math.round(calcRoiMonths), 0, 0) : "0",
          exactYearRoundFormatted: `${calcExactYearRound >= 0 ? formatNumber(calcExactYearRound, 0, 0) : 0}`,
          
          // Pazarlama Özet Cümlesi
          summaryBannerText: isForeign 
            ? `In ${calcRoiMonths > 0 ? formatNumber(Math.round(calcRoiMonths), 0, 0) : "0"} Months, the WWTP is amortizing itself.`
            : `Sistem kendisini ancak tam ${calcExactYearRound >= 0 ? formatNumber(calcExactYearRound, 0, 0) : 0} YILDA geri döndürebilmektedir.`
        }
      }
    });
  };

  useEffect(() => {
    if (!storeAmortisman || Object.keys(storeAmortisman).length === 0) {
      const initial = getInitialData();
      setData(initial);
      syncWithStore(initial);
    } else {
      syncWithStore(data);
    }
  }, [storeDebi, planetCapex, annualOpexGideri, exchangeRate, currency, unitSystem, teklifDili]);

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
    let finalValue = parseInputValue(value);

    // 🌟 KURAL DÜZELTMELERİ: Ekrandan gelen dönüştürülmüş verileri store'a göndermeden önce ham haline geri çeviriyoruz
    if (field === "dailyUsage" && unitSystem === "US") {
      finalValue = finalValue / 264.172; // GPD -> m³
    } else if (field === "waterPrice") {
      const euroPrice = finalValue / exchangeRate;
      finalValue = unitSystem === "US" ? euroPrice * 264.172 : euroPrice;
    } else if (field === "plantCost") {
      finalValue = finalValue / exchangeRate; // Converted Currency -> Euro
    }

    const updated = { ...data, [field]: finalValue };
    setData(updated);
    syncWithStore(updated);
  };

  // Dinamik input hücre render metodu
  const renderManagedInput = (field, rawValue, maxDigits = 2) => {
    const isCurrent = editingCell?.field === field;
    
    let displayValue = "";
    if (isCurrent) {
      displayValue = editingCell.value;
    } else {
      displayValue = formatInputValue(rawValue, maxDigits);
    }

    return (
      <input
        type="text"
        className="form-control form-control-sm bg-transparent border-0 opex-input rounded text-center text-white fw-bold p-0 mx-auto amort-input-field"
        value={displayValue}
        onChange={(e) => {
          setEditingCell({ ...editingCell, value: e.target.value });
        }}
        onFocus={() => {
          const cleanString = isForeign ? rawValue.toString() : rawValue.toString().replace(".", ",");
          setEditingCell({ field, value: cleanString });
        }}
        onBlur={(e) => {
          handleChange(field, e.target.value);
          setEditingCell(null);
        }}
      />
    );
  };

  return (
    <div className="d-flex flex-column w-100 text-white">
      <style>{`
        .amort-row-layout { display: flex; align-items: stretch; width: 100%; }
        .amort-divider-bottom { border-bottom: 1px solid #334155; }
        .amort-cell-main { border-right: 1px solid #334155; display: flex; align-items: center; justify-content: center; text-align: center; padding: 0.6rem 0.5rem; font-size: 12px; }
        .amort-cell-main:last-child { border-right: none; }
        .amort-input-field { font-size: 12px; box-shadow: none; width: 90%; text-align: center; border-bottom: 1px dashed #475569 !important; color: white; font-weight: bold; }
        .amort-input-field:focus { outline: none; background-color: rgba(255, 255, 255, 0.08) !important; border-bottom: 1px solid #60a5fa !important; }
        .bg-title-dark { background-color: #090d16; color: #94a3b8; font-weight: 600; }
        .bg-unit-gray { background-color: #1e293b; color: #cbd5e1; font-weight: 600; }
        .bg-value-blue { background-color: #151f32; }
      `}</style>

      <div className="w-100" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div className="d-flex flex-column rounded-3 overflow-hidden border" style={{ borderColor: "#475569", minWidth: "950px" }}>

          {/* ÜST PANEL */}
          <div className="d-flex justify-content-between align-items-center p-3 amort-divider-bottom" style={{ backgroundColor: "#151f32" }}>
            <div className="fw-semibold text-white" style={{ fontSize: "13px", textTransform: isForeign ? "uppercase" : "none", letterSpacing: isForeign ? "0.5px" : "normal" }}>
              {isForeign ? "AMORTIZATION TABLE" : "Yatırımın Geri Dönüş Süresi (Amortisman) Tablosu"}
            </div>

            <div className="d-flex align-items-center gap-3">
              <span className="badge fw-bold py-2 px-3" style={{ backgroundColor: "#090d16", color: "#fbbf24", border: "1px solid #475569", fontSize: "11px" }}>
                {currency} - {unitSystem} Modu
              </span>

              <div className="d-flex align-items-center gap-2">
                <button
                  onClick={handleRefresh}
                  className="btn btn-sm px-3 py-1.5 fw-semibold text-white d-flex align-items-center gap-1 border-0"
                  style={{ backgroundColor: "#d97706", fontSize: "11px", borderRadius: "6px" }}
                  title={isForeign ? "Reset Table to Initial Settings" : "Tabloyu İlk Ayarlarına Döndür"}
                >
                  🔄 {isForeign ? "Refresh" : "Yenile"}
                </button>

                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className="btn btn-sm px-3 py-1.5 fw-semibold text-white d-flex align-items-center justify-content-center border-0"
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
          </div>

          {/* BÖLÜM 1: SULAMA AMAÇLI ŞEBEKE SUYUNUN ANALİZİ */}
          <div className="d-flex align-items-stretch amort-divider-bottom">
            <div className="amort-cell-main bg-title-dark text-uppercase fw-bold" style={{ flex: "0 0 30%", fontSize: "11px", letterSpacing: "0.3px" }}>
              {isForeign ? "IF THE IRRIGATION WATER IS SUPPLIED FROM MUNICIPAL WATER" : "Sulama Amaçlı Şebeke Suyu Kullanılırsa"}
            </div>

            <div className="d-flex flex-column" style={{ flex: "0 0 70%" }}>
              {/* 1. Satır: Başlıklar */}
              <div className="amort-row-layout amort-divider-bottom bg-title-dark" style={{ minHeight: "42px" }}>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>{isForeign ? "Daily water required" : "Günlük su kullanımı"}</div>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>{isForeign ? "Monthly water required" : "Aylık su kullanımı"}</div>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>
                  {isForeign ? "Yearly water required" : <>Yılda <input type="number" className="bg-transparent border-0 text-center text-info fw-bold mx-1 p-0" style={{ width: "20px", outline: "none", fontSize: "12px" }} value={data.activeMonths} onChange={(e) => handleChange("activeMonths", e.target.value)} /> ay su kullanımı</>}
                </div>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>{isForeign ? "Unit Price of Municipal Water" : "Şebeke suyu birim fiyatı"}</div>
                <div className="amort-cell-main text-warning" style={{ flex: "0 0 20%" }}>{isForeign ? "Yearly Total Water Use Cost" : "Toplam yıllık su bedeli"}</div>
              </div>
              {/* 2. Satır: Dinamik Birimler */}
              <div className="amort-row-layout amort-divider-bottom bg-unit-gray" style={{ height: "32px" }}>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>{getFlowUnit("day")}</div>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>{getFlowUnit("month")}</div>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>{getFlowUnit("year")}</div>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>{getCurrencySymbol()}/{unitSystem === "US" ? "gal" : "m³"}</div>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>{getCurrencySymbol()} / {isForeign ? "year" : "yıl"}</div>
              </div>
              {/* 3. Satır: Dinamik Değerler */}
              <div className="amort-row-layout bg-value-blue" style={{ minHeight: "48px" }}>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>
                  {renderManagedInput("dailyUsage", displayDailyUsage, 2)}
                </div>
                <div className="amort-cell-main text-white fw-bold" style={{ flex: "0 0 20%" }}>{formatNumber(Math.round(displayMonthlyUsage), 0, 0)}</div>
                <div className="amort-cell-main text-white fw-bold" style={{ flex: "0 0 20%" }}>{formatNumber(Math.round(displayYearlyUsage), 0, 0)}</div>
                <div className="amort-cell-main" style={{ flex: "0 0 20%" }}>
                  {renderManagedInput("waterPrice", displayWaterPrice, 4)}
                </div>
                <div className="amort-cell-main text-warning fw-bold" style={{ flex: "0 0 20%" }}>{formatNumber(Math.round(displayYearlyWaterCost), 0, 0)}</div>
              </div>
            </div>
          </div>

          {/* BÖLÜM 2: SULAMA AMAÇLI ARITMA TESİSİ ANALİZİ */}
          <div className="d-flex align-items-stretch">
            <div className="amort-cell-main bg-title-dark text-uppercase fw-bold" style={{ flex: "0 0 30%", fontSize: "11px", letterSpacing: "0.3px" }}>
              {isForeign ? "IF THE IRRIGATION WATER IS SUPPLIED FROM WWTP" : "Sulama Amaçlı Evsel Atıksu Arıtma Tesisinden Çıkan Su Kullanılırsa"}
            </div>

            <div className="d-flex flex-column" style={{ flex: "0 0 70%" }}>
              {/* Satır 1: Başlıklar */}
              <div className="amort-row-layout amort-divider-bottom" style={{ minHeight: "42px" }}>
                <div className="amort-cell-main bg-title-dark" style={{ flex: "0 0 30%" }}>
                  {isForeign ? "WWTP CAPEX" : "Atıksu Arıtma Tesisinin Yaklaşık Maliyeti"}
                </div>
                <div className="amort-cell-main fw-bold" style={{ flex: "0 0 70%", backgroundColor: "#cbd5e1", color: "#0f172a", fontSize: "13px", letterSpacing: "0.5px" }}>
                  {isForeign ? "Amortization Time" : "ATIKSU ARITMA TESİSİNİN AMORTİ ETME SÜRESİ"}
                </div>
              </div>

              {/* Satır 2: Dinamik Birimler */}
              <div className="amort-row-layout amort-divider-bottom bg-unit-gray" style={{ height: "32px" }}>
                <div className="amort-cell-main" style={{ flex: "0 0 30%" }}>{getCurrencySymbol()}</div>
                <div className="amort-cell-main" style={{ flex: "0 0 35%" }}>{isForeign ? "Year" : "Yıl"}</div>
                <div className="amort-cell-main" style={{ flex: "0 0 35%" }}>{isForeign ? "Month" : "Ay"}</div>
              </div>

              {/* Satır 3: Dönüştürülmüş Değerler */}
              <div className="amort-row-layout bg-value-blue" style={{ minHeight: "48px" }}>
                <div className="amort-cell-main" style={{ flex: "0 0 30%" }}>
                  {renderManagedInput("plantCost", displayPlantCost, 0)}
                </div>
                <div className="amort-cell-main text-white fw-bold font-monospace" style={{ flex: "0 0 35%", fontSize: "14px" }}>
                  {roiYears > 0 ? formatNumber(roiYears, 2, 2) : "0"}
                </div>
                <div className="amort-cell-main text-white fw-bold font-monospace" style={{ flex: "0 0 35%", fontSize: "20px" }}>
                  {roiMonths > 0 ? formatNumber(Math.round(roiMonths), 0, 0) : "0"}
                </div>
              </div>
            </div>
          </div>

          {/* BÖLÜM 3: ÖZET VE NOT PANELİ */}
          <div className="d-flex flex-column value-bg">
            <div className="p-3 text-center border-top" style={{ borderColor: "#334155", backgroundColor: "#111827" }}>
              <div className="mt-1 d-flex align-items-center justify-content-center gap-1 flex-wrap" style={{ fontSize: "14px" }}>
                {isForeign ? (
                  <>
                    <span className="text-white">In</span>
                    <span className="fw-extrabold px-3 py-0.5 rounded border border-danger text-danger bg-danger-subtle mx-1 font-monospace" style={{ fontSize: "18px" }}>
                      {roiMonths > 0 ? formatNumber(Math.round(roiMonths), 0, 0) : "0"}
                    </span>
                    <span className="text-danger fw-bold">Months</span>
                    <span className="text-white">, the WWTP is amortizing itself.</span>
                  </>
                ) : (
                  <>
                    <span className="text-white">Sistem kendisini ancak tam</span>
                    <span className="fw-bold px-2 py-0.5 rounded border border-danger text-danger bg-danger-subtle mx-1">
                      {exactYearRound >= 0 ? formatNumber(exactYearRound, 0, 0) : 0}
                    </span>
                    <span className="text-white fw-bold">YILDA</span>
                    <span className="text-white">geri döndürebilmektedir.</span>
                  </>
                )}
              </div>
            </div>
            <div className="p-2 text-center border-top" style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}>
              <i className="fw-semibold" style={{ fontSize: "11px", color: "#94a3b8" }}>
                {isForeign 
                  ? `*** "Unit Price of Municipal Water = ${formatNumber(displayWaterPrice, 4, 4)} ${getCurrencySymbol()}/${unitSystem === "US" ? "gal" : "m³"}" is given for comparison purposes.`
                  : `⚠️ Not: Bu süreye her yıl güncellenen amortisman tablosundaki işletme giderleri (${formatNumber(Math.round(displayAnnualOpex), 0, 0)}${getCurrencySymbol()}/yıl) dahil edilerek hesaplama yapılmıştır.`
                }
              </i>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AmortismanTablosu;