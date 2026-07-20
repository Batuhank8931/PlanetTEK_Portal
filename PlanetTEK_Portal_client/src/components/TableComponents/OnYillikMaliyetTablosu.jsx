import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";

function OnYillikMaliyetTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const teklifDili = formData?.customerInfo?.teklifDili;
  const isForeign = teklifDili === "Yabancı";

  // 🌟 Canlı Döviz, Kur ve Birim Sistemi Bilgilerini Store'dan Çekiyoruz
  const currency = formData?.customerInfo?.currency || "EUR";
  const unitSystem = formData?.customerInfo?.unitSystem || "Metric";
  const exchangeRate = parseFloat(formData?.customerInfo?.exchangeRate) || 1.0000;

  // ENERJİ KARŞILAŞTIRMA TABLOSUNDAKİ SEÇİME GÖRE DİNAMİK BAĞLANTI
  const enerjiKarsilastirma = formData?.tables?.enerjikarsilastirmatablosu;
  const selectedSystem = enerjiKarsilastirma?.selectedSystem || "aktif_camur";
  const enerjiData = enerjiKarsilastirma?.data;

  // Lokasyon bazlı format seçimi
  const activeLocale = isForeign ? "en-US" : "tr-TR";

  // Sayı Formatlama Fonksiyonu
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

  // 🌟 Yardımcı Fonksiyon: Dinamik Para Birimi Simgesi
  const getCurrencySymbol = () => {
    if (currency === "USD") return "$";
    if (currency === "TRY") return "₺";
    return "€";
  };

  // 1. DİNAMİK VERİ ALIMLARI (Merkezi Store'dan Ham Euro Tabanlı)
  const planetCapex = parseFloat(formData?.tables?.capextablosu?.totalNetPrice) || 0;
  const planetYekParca = parseFloat(formData?.tables?.sarfmalzemettablosu?.RBCYillikSarfMalzeme) || 0;

  // PlanetDISK Yıllık Enerji Maliyeti (Ham Euro)
  const planetYearlyEnergy = enerjiKarsilastirma?.yearlySaving
    ? (enerjiKarsilastirma.data?.planet?.qty * enerjiKarsilastirma.data?.planet?.power * 0.9 * 0.13 * 24 * 365)
    : 0;

  // Alternatif sistemlerin enerji verileri (Ham Euro)
  const blowerCost = (enerjiData?.blower?.qty * enerjiData?.blower?.power * 0.9 * 0.13 * 24 * 365) || 0;
  const pumpCost = (enerjiData?.pump?.qty * enerjiData?.pump?.power * 0.9 * 0.13 * 4 * 365) || 0;

  const aktifCamurYearlyEnergy = blowerCost + pumpCost;
  const mbbrYearlyEnergy = (blowerCost + pumpCost) * 0.85;

  const storeTabloVerisi = formData?.tables?.onyillikmaliyettablosu?.data || formData?.tables?.onyillikmaliyettablosu;

  // 2. PAZARLAMA KURALLARINA GÖRE ŞABLON YAPISI (Daima Ham Euro Kaydedilir)
  const defaultInitialState = {
    inflationRate: 5,
    planet: {
      capex: planetCapex,
      energy: planetYearlyEnergy,
      operator: 1219,
      maintenance: planetYekParca || 350,
    },
    aktif_camur: {
      capex: planetCapex * 0.75,
      energy: aktifCamurYearlyEnergy,
      operator: 1219 * 4,
      maintenance: (planetYekParca || 350) * 3
    },
    mbbr: {
      capex: planetCapex,
      energy: mbbrYearlyEnergy,
      operator: 1219 * 4,
      maintenance: (planetYekParca || 350) * 3
    }
  };

  const [data, setData] = useState(() => {
    if (storeTabloVerisi && storeTabloVerisi.planet) {
      return storeTabloVerisi;
    }
    return defaultInitialState;
  });

  const [editingCell, setEditingCell] = useState(null);
  const [history, setHistory] = useState([]);

  // CAPEX veya Enerji Tabloları güncellendikçe satırları senkronize tutar
  useEffect(() => {
    setData((prev) => ({
      ...prev,
      planet: { ...prev.planet, capex: planetCapex, energy: planetYearlyEnergy },
      aktif_camur: { ...prev.aktif_camur, capex: planetCapex * 0.75, energy: aktifCamurYearlyEnergy },
      mbbr: { ...prev.mbbr, capex: planetCapex, energy: mbbrYearlyEnergy }
    }));
  }, [planetCapex, planetYearlyEnergy, aktifCamurYearlyEnergy, mbbrYearlyEnergy, selectedSystem]);

  // Enflasyon kümülatif çarpan formülü
  const r = data.inflationRate / 100;
  const tenYearMultiplier = r === 0 ? 10 : (Math.pow(1 + r, 10) - 1) / r;

  // TCO Hesaplama Fonksiyonu (Euro tabanlı çalışır)
  const calculateTCO = (sysData) => {
    const cumulativeEnergy = sysData.energy * tenYearMultiplier;
    const cumulativeOperator = sysData.operator * tenYearMultiplier;
    const cumulativeMaint = parseFloat(sysData.maintenance) * tenYearMultiplier;
    const totalTCO = sysData.capex + cumulativeEnergy + cumulativeOperator + cumulativeMaint;
    return { cumulativeEnergy, cumulativeOperator, cumulativeMaint, totalTCO };
  };

  const planetRes = calculateTCO(data.planet);
  const altSystemData = selectedSystem === "aktif_camur" ? data.aktif_camur : data.mbbr;

  const altSystemName = selectedSystem === "aktif_camur"
    ? (isForeign ? "Activated Sludge System" : "Klasik Aktif Çamur Sistemi")
    : (isForeign ? "MBBR System" : "MBBR Sistemi");

  const altRes = calculateTCO(altSystemData);
  const totalSavings10Y = altRes.totalTCO - planetRes.totalTCO;
  const roundedSavings10Y = Math.round(totalSavings10Y / 10000) * 10000;

  // Değişiklikler yapıldıkçe store'u güncel tut (Store Euro kalmalı)
  useEffect(() => {
    updateSection("tables", {
      ...formData?.tables,
      onyillikmaliyettablosu: {
        data: data,
        selectedSystem: selectedSystem,
        totalSavings10Y: roundedSavings10Y
      }
    });
  }, [data, selectedSystem, roundedSavings10Y]);

  const handleGeneralChange = (field, value) => {
    setHistory([...history, JSON.stringify(data)]);
    const parsedVal = parseInputValue(value);
    setData({ ...data, [field]: parsedVal });
  };

  const handleParamChange = (system, field, value) => {
    setHistory([...history, JSON.stringify(data)]);
    let parsedVal = parseInputValue(value);

    // 🌟 KURAL DÜZELTMESİ: Kullanıcı ekrandan döviz bazlı bakım maliyeti girdiğinde, store'a kaydetmeden önce Euro'ya geri çeviriyoruz.
    if (field === "maintenance") {
      parsedVal = parsedVal / exchangeRate;
    }

    setData({
      ...data,
      [system]: { ...data[system], [field]: parsedVal }
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setData(JSON.parse(history[history.length - 1]));
    setHistory(history.slice(0, -1));
  };

  const handleRefresh = () => {
    setHistory([]);
    setData(defaultInitialState);
  };

  // Dinamik input hücre render metodu (Ekrandaki para birimine göre dönüştürülmüş basılır)
  const renderManagedInput = (system, field, rawValue, maxDigits = 0) => {
    const isCurrent = editingCell?.system === system && editingCell?.field === field;
    
    // 🌟 Ekranda para birimine göre çarparak gösteriyoruz (Enflasyon hariç)
    const convertedValue = field === "inflationRate" ? rawValue : rawValue * exchangeRate;

    let displayValue = "";
    if (isCurrent) {
      displayValue = editingCell.value;
    } else {
      displayValue = formatInputValue(convertedValue, maxDigits);
    }

    return (
      <input
        type="text"
        className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input"
        value={displayValue}
        onChange={(e) => {
          setEditingCell({ ...editingCell, value: e.target.value });
        }}
        onFocus={() => {
          const cleanString = isForeign ? convertedValue.toString() : convertedValue.toString().replace(".", ",");
          setEditingCell({ system, field, value: cleanString });
        }}
        onBlur={(e) => {
          if (system === "general") {
            handleGeneralChange(field, e.target.value);
          } else {
            handleParamChange(system, field, e.target.value);
          }
          setEditingCell(null);
        }}
      />
    );
  };

  return (
    <div className="d-flex flex-column gap-3 w-100 text-white">

      <style>{`
        .comp-row { border-bottom: 1px solid #334155; }
        .comp-row:last-child { border-bottom: none; }
        .comp-input { font-size: 12px; box-shadow: none; width: 90px; border-bottom: 1px dashed #475569 !important; }
        .comp-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.08) !important; border-bottom: 1px solid #60a5fa !important; }
        .header-main-title { font-size: 11px; font-weight: 800; letter-spacing: 0.6px; background-color: #090d16; color: #94a3b8; }
        .bg-planet-column { background-color: rgba(217, 119, 6, 0.08); }
        .bg-alt-column { background-color: rgba(22, 163, 74, 0.05); }
      `}</style>

      {/* ÜST PARAMETRE ALANI */}
      <div className="d-flex justify-content-between align-items-center mb-1">
        <div className="d-flex align-items-center gap-2 px-3 py-1 rounded-3" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          <span className="text-white-50" style={{ fontSize: "11px" }}>
            {isForeign ? "Annual Inflation Factor:" : "Yıllık Enflasyon Faktörü:"}
          </span>
          {renderManagedInput("general", "inflationRate", data.inflationRate, 2)}
          <span className="text-white-50" style={{ fontSize: "11px" }}>%</span>
        </div>

        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
          style={{ backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a", fontSize: "11px", borderRadius: "6px", opacity: history.length === 0 ? 0.4 : 1 }}
        >
          ↶
        </button>
      </div>

      {/* TABLO ALANI */}
      <div className="w-100" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div className="d-flex flex-column rounded-3 overflow-hidden" style={{ border: "1px solid #334155", backgroundColor: "#151f32", minWidth: "950px" }}>

          {/* ÜST PANEL */}
          <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: "#0f172a", borderBottom: "1px solid #334155" }}>
            <div className="fw-semibold text-white" style={{ fontSize: "14px", textTransform: isForeign ? "uppercase" : "none", letterSpacing: isForeign ? "0.5px" : "normal" }}>
              {isForeign ? "10-Year Life Cycle Cost & Total Cost of Ownership (TCO) Analysis" : "10 Yıllık Ekonomik Ömür ve Yatırım Geri Dönüşüm (TCO) Analizi"}
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <span className="badge fw-bold py-2 px-3" style={{ backgroundColor: "#090d16", color: "#fbbf24", border: "1px solid #475569", fontSize: "11px" }}>
                {currency} - {unitSystem} Modu
              </span>
              <button
                onClick={handleRefresh}
                className="btn btn-sm px-3 fw-semibold text-white border-0"
                style={{ backgroundColor: "#d97706", fontSize: "11px", borderRadius: "6px" }}
              >
                🔄 {isForeign ? "Refresh" : "Yenile"}
              </button>
            </div>
          </div>

          {/* KOLON BAŞLIKLARI */}
          <div className="d-flex text-center border-bottom align-items-stretch" style={{ borderColor: "#334155" }}>
            <div className="p-2 header-main-title text-start ps-3 d-flex align-items-center" style={{ width: "34%" }}>
              {isForeign ? "COST ITEM DEFINITIONS" : "MALİYET VE İŞLETME KALEMLERİ"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-main-title text-warning d-flex align-items-center justify-content-center" style={{ width: "33%", backgroundColor: "rgba(217, 119, 6, 0.15)" }}>
              {isForeign ? "PlanetDISK® RBC System" : "PlanetDISK® DBD Sistemi"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-main-title text-success d-flex align-items-center justify-content-center" style={{ width: "33%", backgroundColor: "rgba(22, 163, 74, 0.1)" }}>
              {altSystemName}
            </div>
          </div>

          {/* CAPEX ROW (Kurla Çarpılmış) */}
          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2.5 ps-3 fw-medium text-white-50 d-flex align-items-center" style={{ width: "34%", fontSize: "12px" }}>
              {isForeign ? "Initial Investment Cost (CAPEX - Civil Works Excluded)" : "İlk Yatırım Maliyeti (CAPEX - İnşaat Hariç)"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-planet-column fw-bold text-white d-flex align-items-center justify-content-center font-monospace" style={{ width: "33%" }}>
              {formatNumber(Math.round(data.planet.capex * exchangeRate), 0, 0)} {getCurrencySymbol()}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-alt-column fw-bold text-white d-flex align-items-center justify-content-center font-monospace" style={{ width: "33%" }}>
              {formatNumber(Math.round(altSystemData.capex * exchangeRate), 0, 0)} {getCurrencySymbol()}
            </div>
          </div>

          {/* ENERJİ ROW (Kurla Çarpılmış) */}
          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2.5 ps-3 fw-medium text-white-50 d-flex align-items-center" style={{ width: "34%", fontSize: "12px" }}>
              {isForeign ? "Annual Energy Cost" : "Yıllık Enerji Maliyeti (Dinamik)"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-planet-column fw-bold text-white d-flex align-items-center justify-content-center font-monospace" style={{ width: "33%" }}>
              {formatNumber(Math.round(data.planet.energy * exchangeRate), 0, 0)} {getCurrencySymbol()} <span className="text-white-50 font-sans-serif fw-normal ms-1" style={{ fontSize: "11px" }}>{isForeign ? "/ year" : "/ yıl"}</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-alt-column fw-bold text-white d-flex align-items-center justify-content-center font-monospace" style={{ width: "33%" }}>
              {formatNumber(Math.round(altSystemData.energy * exchangeRate), 0, 0)} {getCurrencySymbol()} <span className="text-white-50 font-sans-serif fw-normal ms-1" style={{ fontSize: "11px" }}>{isForeign ? "/ year" : "/ yıl"}</span>
            </div>
          </div>

          {/* OPERATÖR ROW (Kurla Çarpılmış) */}
          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2.5 ps-3 fw-medium text-white-50 d-flex align-items-center" style={{ width: "34%", fontSize: "12px" }}>
              {isForeign ? "Annual Operator Cost" : "Yıllık Operatör Maliyeti"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-planet-column fw-bold text-white d-flex align-items-center justify-content-center font-monospace" style={{ width: "33%" }}>
              {formatNumber(Math.round(data.planet.operator * exchangeRate), 0, 0)} {getCurrencySymbol()} <span className="text-white-50 font-sans-serif fw-normal ms-1" style={{ fontSize: "11px" }}>{isForeign ? "/ year" : "/ yıl"}</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-alt-column fw-bold text-white d-flex align-items-center justify-content-center font-monospace" style={{ width: "33%" }}>
              {formatNumber(Math.round(altSystemData.operator * exchangeRate), 0, 0)} {getCurrencySymbol()} <span className="text-white-50 font-sans-serif fw-normal ms-1" style={{ fontSize: "11px" }}>{isForeign ? "/ year" : "/ yıl"}</span>
            </div>
          </div>

          {/* BAKIM ROW (Hücre içi renderManagedInput zaten kur katsayısını içeriyor) */}
          <div className="d-flex align-items-stretch comp-row border-bottom" style={{ borderBottomWidth: "2px", borderColor: "#475569" }}>
            <div className="p-2.5 ps-3 fw-medium text-white-50 d-flex align-items-center" style={{ width: "34%", fontSize: "12px" }}>
              {isForeign ? "Annual Maintenance & Spare Parts Cost" : "Yıllık Bakım ve Yedek Parça Maliyeti"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "33%" }}>
              {renderManagedInput("planet", "maintenance", data.planet.maintenance)}
              <span className="text-white-50" style={{ fontSize: "11px" }}>{getCurrencySymbol()}</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-alt-column" style={{ width: "33%" }}>
              {renderManagedInput(selectedSystem, "maintenance", altSystemData.maintenance)}
              <span className="text-white-50" style={{ fontSize: "11px" }}>{getCurrencySymbol()}</span>
            </div>
          </div>

          {/* TCO TOPLAMI (Kurla Çarpılmış) */}
          <div className="d-flex align-items-stretch font-monospace" style={{ backgroundColor: "#0b1524", borderTop: "1px dashed #474f5d" }}>
            <div className="p-3 ps-3 fw-bold text-white-50 text-uppercase d-flex align-items-center font-sans-serif" style={{ width: "34%", fontSize: "11px", letterSpacing: "0.5px" }}>
              {isForeign ? "Total 10 Years TCO Cumulative Sum" : "Toplam 10 Yıllık İlk Yatırım ve İşletme Maliyeti (TCO)"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-3 text-center bg-planet-column fw-bold text-warning d-flex align-items-center justify-content-center" style={{ width: "33%", fontSize: "15px" }}>
              {formatNumber(Math.round(planetRes.totalTCO * exchangeRate), 0, 0)} {getCurrencySymbol()}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-3 text-center bg-alt-column fw-bold text-danger d-flex align-items-center justify-content-center" style={{ width: "33%", fontSize: "15px" }}>
              {formatNumber(Math.round(altRes.totalTCO * exchangeRate), 0, 0)} {getCurrencySymbol()}
            </div>
          </div>

        </div>
      </div>

      {/* PAZARLAMA TASARRUF PANELİ */}
      <div className="d-flex flex-column rounded-3 overflow-hidden border p-4 gap-2 mt-1" style={{ borderColor: "#475569", backgroundColor: "#090d16" }}>
        <div className="d-flex flex-column align-items-center justify-content-center text-center">
          <span className="text-white-50 mb-2 fw-medium" style={{ fontSize: "13px", letterSpacing: "0.5px" }}>
            {isForeign
              ? <>Total financial savings at the end of 10 Years when <strong>PlanetDISK® RBC System</strong> is chosen over {selectedSystem === "aktif_camur" ? "Activated Sludge" : "MBBR"}:</>
              : <>{altSystemName} yerine <strong>PlanetDISK® DBD Sistemi</strong> tercih edildiğinde 10 Yıl Sonundaki Toplam Kazanç:</>
            }
          </span>
          <span className="fw-extrabold text-success font-monospace" style={{ fontSize: "34px", letterSpacing: "1px", textShadow: "0 0 10px rgba(74, 222, 128, 0.2)" }}>
            ~ {formatNumber(roundedSavings10Y * exchangeRate, 0, 0)} {getCurrencySymbol()}
          </span>
          {data.inflationRate > 0 && (
            <span className="text-white-50 mt-2" style={{ fontSize: "11px" }}>
              {isForeign
                ? `* Future projections include a cumulative annual inflation factor of %${formatNumber(data.inflationRate, 0, 2)} over the 10-year operational period.`
                : `* Gelecek projeksiyonuna, 10 yıllık işletme süresi boyunca yıllık kümülatif %${formatNumber(data.inflationRate, 0, 2)} enflasyon artışı dahil edilmiştir.`
              }
            </span>
          )}
        </div>
      </div>

    </div>
  );
}

export default OnYillikMaliyetTablosu;