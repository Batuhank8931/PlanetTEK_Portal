import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";

function KarbonAyakiziTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const teklifDili = formData?.customerInfo?.teklifDili;
  const isForeign = teklifDili === "Yabancı";
  const unitSystem = formData?.customerInfo?.unitSystem || "Metric";
  const isUS = unitSystem === "US"; // 🇺🇸 US sistemi kontrolü

  // 🌟 Lokasyon bazlı format seçimi (US modunda zorunlu en-US formatı)
  const activeLocale = isUS || isForeign ? "en-US" : "tr-TR";

  // 🌟 Canlı Döviz Bilgisini Çekiyoruz
  const currency = formData?.customerInfo?.currency || "EUR";

  // Enerji karşılaştırma tablosunun store'a yazdığı güncel durumları çekiyoruz
  const enerjiKarsilastirma = formData?.tables?.enerjikarsilastirmatablosu;
  const selectedSystem = enerjiKarsilastirma?.selectedSystem || "aktif_camur";
  const enerjiKarsilastirmaData = enerjiKarsilastirma?.data;

  // Sayı Formatlama Fonksiyonu
  const formatNumber = (value, minFraction = 0, maxFraction = 2) => {
    if (isNaN(value)) return "0";
    return value.toLocaleString(activeLocale, {
      minimumFractionDigits: minFraction,
      maximumFractionDigits: maxFraction
    });
  };

  // Input Alanlarında Formatlı Gösterim
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
    if (isUS || isForeign) {
      cleanVal = cleanVal.replace(/,/g, "");
    } else {
      cleanVal = cleanVal.replace(/\./g, "").replace(",", ".");
    }
    return parseFloat(cleanVal) || 0;
  };

  // Mağazadan veya dinamik parametrelerden gelen günlük kWh hesapları
  const planetTotalPower = (enerjiKarsilastirmaData?.planet?.qty * enerjiKarsilastirmaData?.planet?.power) || 0;
  const planetDailyKwh = planetTotalPower * ((enerjiKarsilastirmaData?.planet?.consumptionFactor || 90) / 100) * (enerjiKarsilastirmaData?.planet?.dailyHours || 24);

  const blowerTotalPower = (enerjiKarsilastirmaData?.blower?.qty * enerjiKarsilastirmaData?.blower?.power) || 0;
  const blowerDailyKwh = blowerTotalPower * ((enerjiKarsilastirmaData?.blower?.consumptionFactor || 90) / 100) * (enerjiKarsilastirmaData?.blower?.dailyHours || 24);

  const pumpTotalPower = (enerjiKarsilastirmaData?.pump?.qty * enerjiKarsilastirmaData?.pump?.power) || 0;
  const pumpDailyKwh = pumpTotalPower * ((enerjiKarsilastirmaData?.pump?.consumptionFactor || 90) / 100) * (enerjiKarsilastirmaData?.pump?.dailyHours || 4);

  const altSystemDailyKwh = blowerDailyKwh + pumpDailyKwh;

  const storeTabloVerisi = formData?.tables?.karbonayakizitablosu?.data || formData?.tables?.karbonayakizitablosu;

  const [data, setData] = useState(() => {
    if (storeTabloVerisi && storeTabloVerisi.co2Factor) {
      return storeTabloVerisi;
    }
    return {
      co2Factor: 0.43,
    };
  });

  // İnput odak yönetimi için geçici yerel string stateleri
  const [editingCell, setEditingCell] = useState(null);
  const [history, setHistory] = useState([]);

  const currentPlanetDailyKwh = planetDailyKwh || 64.6;
  const currentAltDailyKwh = altSystemDailyKwh || 345.5;

  const planetYearlyKwh = currentPlanetDailyKwh * 365;
  const altYearlyKwh = currentAltDailyKwh * 365;

  // 🌍 Tonaj Dönüşüm Katsayısı (1 Metrik Ton = 1.10231 US Short Ton)
  const tonToUsTon = 1.10231;

  // Temel Karbon Hesapları (Metrik Ton cinsinden)
  let planetCo2 = (planetYearlyKwh * data.co2Factor) / 1000;
  let altCo2 = (altYearlyKwh * data.co2Factor) / 1000;
  let savedCo2 = altCo2 - planetCo2;

  // 🇺🇸 Eğer sistem US ise hesapları Amerikan Tonu'na (Short Ton) çeviriyoruz
  if (isUS) {
    planetCo2 = planetCo2 * tonToUsTon;
    altCo2 = altCo2 * tonToUsTon;
    savedCo2 = savedCo2 * tonToUsTon;
  }

  // Ağaç eşdeğeri hesabı
const rawEquivalentTrees = isUS
    ? (savedCo2 * 2000) / 942.5  
    : (savedCo2 * 1000) / 427.5; // 37.2 ton * (1000 / 427.5) = 87 ağaç

  // Binlik yuvarlama yerine tam/en yakın sayıya yuvarlama:
  const equivalentTrees = Math.round(rawEquivalentTrees);

  const altSystemName = selectedSystem === "aktif_camur"
    ? (isForeign ? "Activated Sludge System" : "Klasik Aktif Çamur Sistemi")
    : (isForeign ? "MBBR System" : "MBBR Sistemi");

  const headerThemeClass = selectedSystem === "aktif_camur" ? "text-success" : "text-info";
  const headerBgStyle = selectedSystem === "aktif_camur" ? "rgba(22, 163, 74, 0.1)" : "rgba(6, 182, 212, 0.1)";

  // CO2 Emisyon Faktörü Input Değeri Yönetimi
  const isEditingFactor = editingCell?.field === "co2Factor";
  const factorDisplayValue = isEditingFactor ? editingCell.value : formatInputValue(data.co2Factor, 2);

  // Dinamik Birim Etiketleri
  const tonLabel = isUS 
    ? "Ton" 
    : (isForeign ? "ton" : "ton CO₂");

  const tonYearLabel = isUS
    ? "Ton/year"
    : (isForeign ? "ton/year" : "ton CO₂/yıl");

  // 🌟 EXCEL EXPORT İÇİN TÜM RENDER VERİLERİNİ FORMDATA'YA YAZAN EFFECT
  useEffect(() => {
    updateSection("tables", {
      ...formData?.tables,
      karbonayakizitablosu: {
        data: data,
        selectedSystem: selectedSystem,
        altSystemName: altSystemName,
        unitSystemUsed: unitSystem,
        
        // 🌟 Sayısal Ham Değerler
        co2Factor: data.co2Factor,
        currentPlanetDailyKwh: currentPlanetDailyKwh,
        currentAltDailyKwh: currentAltDailyKwh,
        planetYearlyKwh: planetYearlyKwh,
        altYearlyKwh: altYearlyKwh,
        planetCo2: planetCo2,
        altCo2: altCo2,
        savedCo2: savedCo2,
        equivalentTrees: Number(equivalentTrees),

        // 🌟 Ekranda Birebir Render Edilen Formatlı Metinler
        renderedSummary: {
          planetDailyKwhFormatted: `${formatNumber(currentPlanetDailyKwh, 1, 1)} ${isForeign ? "kw/day" : "kWh/gün"}`,
          altDailyKwhFormatted: `${formatNumber(currentAltDailyKwh, 1, 1)} ${isForeign ? "kw/day" : "kWh/gün"}`,
          planetYearlyKwhFormatted: `${formatNumber(Math.round(planetYearlyKwh), 0, 0)} ${isForeign ? "kW/year" : "kWh/yıl"}`,
          altYearlyKwhFormatted: `${formatNumber(Math.round(altYearlyKwh), 0, 0)} ${isForeign ? "kW/year" : "kWh/yıl"}`,
          co2FactorFormatted: `${formatInputValue(data.co2Factor, 2)} ${isUS || isForeign ? "kg/eMWh" : "kg CO₂ / kWh"}`,
          planetCo2Formatted: `${formatNumber(planetCo2, 1, 1)} ${tonYearLabel}`,
          altCo2Formatted: `${formatNumber(altCo2, 1, 1)} ${tonYearLabel}`,
          savedCo2Formatted: `${savedCo2 > 0 ? `+${formatNumber(savedCo2, 1, 1)}` : formatNumber(savedCo2, 1, 1)} ${tonLabel}`,
          treesFormatted: isUS || isForeign 
            ? `~ ${formatNumber(equivalentTrees, 0, 0)} trees to nature / year` 
            : `~ ${formatNumber(equivalentTrees, 0, 0)} Ağaç / yıl`
        }
      }
    });
  }, [data, savedCo2, equivalentTrees, unitSystem, selectedSystem, isForeign, isUS, currentPlanetDailyKwh, currentAltDailyKwh]);

  const handleRefresh = () => {
    setHistory([]);
    setData({ co2Factor: 0.43 });
  };

  const saveToHistory = (currentState) => {
    setHistory([...history, JSON.stringify(currentState)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setData(JSON.parse(history[history.length - 1]));
    setHistory(history.slice(0, -1));
  };

  const handleParamChange = (field, value) => {
    saveToHistory(data);
    const parsedVal = parseInputValue(value);
    setData({ ...data, [field]: parsedVal });
  };

  return (
    <div className="d-flex flex-column gap-3 w-100 text-white">

      <style>{`
        .comp-row { border-bottom: 1px solid #334155; }
        .comp-row:last-child { border-bottom: none; }
        .comp-input { font-size: 13px; box-shadow: none; width: 80px; border-bottom: 1px dashed #475569 !important; }
        .comp-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.08) !important; border-bottom: 1px solid #60a5fa !important; }
        .header-main-title { font-size: 11px; font-weight: 800; letter-spacing: 0.6px; background-color: #090d16; color: #94a3b8; }
        .bg-planet-column { background-color: rgba(217, 119, 6, 0.08); }
        .bg-alt-column { background-color: rgba(22, 163, 74, 0.05); }
      `}</style>

      <div className="w-100" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div className="d-flex flex-column rounded-3 overflow-hidden" style={{ border: "1px solid #334155", backgroundColor: "#151f32", minWidth: "850px" }}>

          {/* ÜST PANEL */}
          <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: "#0f172a", borderBottom: "1px solid #334155" }}>
            <div className="fw-semibold text-white" style={{ fontSize: "14px", textTransform: isForeign ? "uppercase" : "none", letterSpacing: isForeign ? "0.5px" : "normal" }}>
              {isForeign ? "CARBON FOOTPRINT and Environmental Impact Analysis" : "Karbon Ayak İzi ve Çevresel Etki Analizi"}
            </div>

            <div className="d-flex align-items-center gap-3">
              <span className="badge fw-bold py-2 px-3" style={{ backgroundColor: "#090d16", color: "#fbbf24", border: "1px solid #475569", fontSize: "11px" }}>
                {currency} Modu ({unitSystem})
              </span>

              <div className="d-flex align-items-center gap-2">
                <button
                  onClick={handleRefresh}
                  className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
                  style={{ backgroundColor: "#d97706", fontSize: "11px", borderRadius: "6px" }}
                  title={isForeign ? "Reset Table to Initial Settings" : "Tabloyu İlk Ayarlarına Döndür"}
                >
                  🔄 {isForeign ? "Refresh" : "Yenile"}
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
          </div>

          {/* SUTUN BAŞLIKLARI */}
          <div className="d-flex text-center border-bottom align-items-stretch" style={{ borderColor: "#334155" }}>
            <div className="p-2 header-main-title text-start ps-3 d-flex align-items-center" style={{ width: "34%" }}>
              {isForeign ? "ELECTRICITY CONSUMPTION DEFINITIONS" : "KARBON AYAK İZİ PARAMETRELERİ"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-main-title text-warning d-flex align-items-center justify-content-center" style={{ width: "33%", backgroundColor: "rgba(217, 119, 6, 0.15)" }}>
              {isForeign ? "PlanetDISK® Unit" : "PlanetDISK® Ünitesi"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className={`p-2 header-main-title d-flex align-items-center justify-content-center ${headerThemeClass}`} style={{ width: "33%", backgroundColor: headerBgStyle }}>
              {altSystemName}
            </div>
          </div>

          {/* GÜNLÜK TÜKETİM ROW */}
          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2.5 ps-3 fw-medium text-white-50 d-flex align-items-center" style={{ width: "34%", fontSize: "12px" }}>
              {isForeign ? "Daily Energy Consumption (Dynamic)" : "Günlük Enerji Tüketimi (Dinamik)"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-planet-column fw-bold d-flex align-items-center justify-content-center text-white font-monospace" style={{ width: "33%", fontSize: "12.5px" }}>
              {formatNumber(currentPlanetDailyKwh, 1, 1)} <span className="text-white-50 font-sans-serif fw-normal ms-1" style={{ fontSize: "11px" }}>{isForeign ? "kw/day" : "kWh/gün"}</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-alt-column fw-bold d-flex align-items-center justify-content-center text-white font-monospace" style={{ width: "33%", fontSize: "12.5px" }}>
              {formatNumber(currentAltDailyKwh, 1, 1)} <span className="text-white-50 font-sans-serif fw-normal ms-1" style={{ fontSize: "11px" }}>{isForeign ? "kw/day" : "kWh/gün"}</span>
            </div>
          </div>

          {/* YILLIK TÜKETİM ROW */}
          <div className="d-flex align-items-stretch comp-row font-monospace text-white" style={{ fontSize: "12.5px" }}>
            <div className="p-2.5 ps-3 fw-medium text-white-50 font-sans-serif d-flex align-items-center" style={{ width: "34%" }}>
              {isForeign ? "Annual Energy Consumption" : "Yıllık Toplam Enerji Tüketimi"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2.5 text-center bg-planet-column fw-bold" style={{ width: "33%" }}>{formatNumber(Math.round(planetYearlyKwh), 0, 0)} {isForeign ? "kW/year" : "kWh/yıl"}</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2.5 text-center bg-alt-column fw-bold" style={{ width: "33%" }}>{formatNumber(Math.round(altYearlyKwh), 0, 0)} {isForeign ? "kW/year" : "kWh/yıl"}</div>
          </div>

          {/* EMİSYON FAKTÖRÜ ROW */}
          <div className="d-flex align-items-stretch comp-row" style={{ backgroundColor: "#1e293b" }}>
            <div className="p-2.5 ps-3 fw-medium text-white-50 d-flex align-items-center" style={{ width: "34%", fontSize: "12px" }}>
              {isForeign ? <>CO2 Emission Coefficient<br /><span style={{ fontSize: "10px", color: "#64748b" }}>(Grid Electricity Carbon Intensity)</span></> : <>Grid Emisyon Faktörü<br /><span style={{ fontSize: "10px", color: "#64748b" }}>(Elektrik Üretimi Karbon Yoğunluğu)</span></>}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1" style={{ width: "66%" }}>
              <input
                type="text"
                className="form-control form-control-sm bg-transparent border-0 text-center text-warning fw-bold p-0 comp-input"
                style={{ width: "60px" }}
                value={factorDisplayValue}
                onChange={(e) => setEditingCell({ field: "co2Factor", value: e.target.value })}
                onFocus={() => {
                  const cleanString = isUS || isForeign ? data.co2Factor.toString() : data.co2Factor.toString().replace(".", ",");
                  setEditingCell({ field: "co2Factor", value: cleanString });
                }}
                onBlur={(e) => {
                  handleParamChange("co2Factor", e.target.value);
                  setEditingCell(null);
                }}
              />
              <span className="text-white-50" style={{ fontSize: "11px" }}>{isUS || isForeign ? "kg/eMWh" : "kg CO₂ / kWh"}</span>
            </div>
          </div>

          {/* TOPLAM SALINIM ROW */}
          <div className="d-flex align-items-stretch" style={{ backgroundColor: "#0b1524", borderTop: "2px dashed #475569" }}>
            <div className="p-3 ps-3 fw-bold text-white-50 text-uppercase d-flex align-items-center" style={{ width: "34%", fontSize: "11.5px" }}>
              {isForeign ? "Annual Carbon Footprint" : "Yıllık Karbon Ayak İzi (Salınım)"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-3 text-center bg-planet-column fw-bold text-success font-monospace" style={{ width: "33%", fontSize: "15px" }}>
              {formatNumber(planetCo2, 1, 1)} <span style={{ fontSize: "11px" }} className="text-white-50 font-sans-serif fw-normal">{tonYearLabel}</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-3 text-center bg-alt-column fw-bold text-danger font-monospace" style={{ width: "33%", fontSize: "15px" }}>
              {formatNumber(altCo2, 1, 1)} <span style={{ fontSize: "11px" }} className="text-white-50 font-sans-serif fw-normal">{tonYearLabel}</span>
            </div>
          </div>

        </div>
      </div>

      {/* ALT DETAY PAZARLAMA KARTLARI */}
      <div className="d-flex flex-column rounded-3 overflow-hidden border p-3 gap-3 mt-1" style={{ borderColor: "#475569", backgroundColor: "#090d16" }}>

        <div className="d-flex justify-content-between align-items-center border-bottom pb-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="d-flex flex-column">
            <span className="text-white" style={{ fontSize: "13px", fontWeight: "600" }}>
              {isForeign ? `Prevented Carbon Footprint compared to ${selectedSystem === "aktif_camur" ? "Activated Sludge" : "MBBR"}:` : `${altSystemName}'ne Kıyasla Önlenen Karbon Salınımı:`}
            </span>
            <span className="text-white-50" style={{ fontSize: "11px" }}>
              {isForeign ? "The amount of greenhouse gas emissions prevented from entering nature." : "Doğaya salınması engellenen sera gazı miktarı."}
            </span>
          </div>
          <span className="fw-extrabold text-success font-monospace" style={{ fontSize: "22px" }}>
            {savedCo2 > 0 ? `+${formatNumber(savedCo2, 1, 1)}` : formatNumber(savedCo2, 1, 1)} {tonLabel}
          </span>
        </div>

        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex flex-column">
            <span className="text-white" style={{ fontSize: "13px", fontWeight: "600" }}>
              {isForeign ? "Ecological Credit in Nature (Tree Equivalent):" : "Doğal Denge Karşılığı (Ağaç Eşdeğeri):"}
            </span>
            <span className="text-white-50" style={{ fontSize: "11px" }}>
              {isForeign ? "Due to electricity consumption selection, there is an annual contribution equivalent to:" : "Bu tasarruf, her yıl kaç yetişkin ağacın yaptığı karbon temizliğine eşdeğerdir?"}
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: "24px" }}>🌳</span>
            <span className="fw-extrabold text-info font-monospace" style={{ fontSize: "22px" }}>
              {isUS || isForeign ? `~ ${formatNumber(equivalentTrees, 0, 0)} trees to nature / year` : `~ ${formatNumber(equivalentTrees, 0, 0)} Ağaç / yıl`}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}

export default KarbonAyakiziTablosu;