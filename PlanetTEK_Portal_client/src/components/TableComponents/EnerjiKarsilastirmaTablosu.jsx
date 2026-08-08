import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";
import { hesaplaKlasikSistemEkipmanlari } from "../../utils/kiyaslamaHesap";

function EnerjiKarsilastirmaTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const teklifDili = formData?.customerInfo?.teklifDili;
  const isForeign = teklifDili === "Yabancı";

  // 🌟 Canlı Döviz ve Kur Bilgilerini Çekiyoruz
  const currency = formData?.customerInfo?.currency || "EUR";
  const exchangeRate = parseFloat(formData?.customerInfo?.exchangeRate) || 1.0000;

  // Kıyaslanacak alternatif sistem seçimi: "aktif_camur" veya "mbbr"
  const [selectedSystem, setSelectedSystem] = useState("aktif_camur");

  const storeTabloVerisi = formData?.tables?.enerjikarsilastirmatablosu?.data || formData?.tables?.enerjikarsilastirmatablosu;

  const planetDiskDetails = formData.planetDiskDetails || {};
  const yerlesimArray = planetDiskDetails?.tasarim?.yerlesimSiralanisi || [];
  const RBCUnite = planetDiskDetails?.tasarim?.aritmaParametreleri?.RBCUnite || "MX";
  const toplamRbcAdedi = yerlesimArray
    .filter(item => item && item.isLamella === false)
    .reduce((sum, item) => sum + (parseInt(item.adet) || 0), 0);

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

  // 🌟 Yardımcı Fonksiyonlar: Dinamik Para Birimi Simgeleri
  const getCurrencySymbol = () => {
    if (currency === "USD") return "$";
    if (currency === "TRY") return "₺";
    return "€";
  };

  const getCurrencyUnitLabel = () => {
    const symbol = getCurrencySymbol();
    return isForeign ? `${symbol} /year` : `${symbol} / yıl`;
  };

  const getTenYearsUnitLabel = () => {
    const symbol = getCurrencySymbol();
    return isForeign ? `${symbol} /10 year` : `${symbol} / 10 yıl`;
  };

  // 1. ADIM: Temel PlanetDISK objesini oluşturuyoruz
  const basePlanetState = {
    qty: toplamRbcAdedi || 8,
    power: RBCUnite === "MX" ? 0.37 : 0.25,
    consumptionFactor: 90,
    price: 0.13, 
    dailyHours: 24,
    yearlyDays: 365
  };

  const sistemSimulasyonu = hesaplaKlasikSistemEkipmanlari(basePlanetState, selectedSystem);

  const defaultInitialState = {
    planet: basePlanetState,
    blower: sistemSimulasyonu.blower,
    pump: sistemSimulasyonu.pump,
    maintenanceSaving: toplamRbcAdedi * 494 
  };

  const [data, setData] = useState(() => {
    if (storeTabloVerisi && storeTabloVerisi.planet) {
      return storeTabloVerisi;
    }
    return defaultInitialState;
  });

  // İnput odak yönetimi için geçici yerel string stateleri
  const [editingCell, setEditingCell] = useState(null); 
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setData(defaultInitialState);
  }, [toplamRbcAdedi, RBCUnite, selectedSystem]);

  // Metrikleri hesaplayan yardımcı fonksiyon
  const getMetrics = (sys) => {
    const totalPower = sys.qty * sys.power;
    const actualPower = totalPower * (sys.consumptionFactor / 100);
    const yearlyCost = actualPower * sys.price * sys.dailyHours * sys.yearlyDays;
    return { totalPower, actualPower, yearlyCost };
  };

  const planetMetrics = getMetrics(data.planet);
  const blowerMetrics = getMetrics(data.blower);
  const pumpMetrics = getMetrics(data.pump);

  // Ham Euro bazlı hesaplamalar
  const totalAltSystemCost = blowerMetrics.yearlyCost + pumpMetrics.yearlyCost;
  const yearlySaving = totalAltSystemCost - planetMetrics.yearlyCost;
  const tenYearsSaving = yearlySaving * 10;
  const totalGainWithMaintenance = tenYearsSaving + data.maintenanceSaving;

  // 🌟 Render edilecek kurla çarpılmış maliyet ve tasarruflar
  const planetYearlyCostConverted = planetMetrics.yearlyCost * exchangeRate;
  const blowerYearlyCostConverted = blowerMetrics.yearlyCost * exchangeRate;
  const pumpYearlyCostConverted = pumpMetrics.yearlyCost * exchangeRate;
  const yearlySavingConverted = yearlySaving * exchangeRate;
  const tenYearsSavingConverted = tenYearsSaving * exchangeRate;
  const totalGainWithMaintenanceConverted = totalGainWithMaintenance * exchangeRate;

  const altSystemName = selectedSystem === "aktif_camur" 
    ? (isForeign ? "ACTIVATED SLUDGE SYSTEM" : "Klasik Aktif Çamur Sistemi") 
    : (isForeign ? "MBBR SYSTEM" : "MBBR Sistemi");

  // 🌟 EKRANDA RENDER EDİLEN BÜTÜN METİNLERİ VE BAŞLIKLARI KAPSAYAN YARDIMCI TANIMLAR
  const unitPiecePlanet = isForeign ? (data.planet.qty > 1 ? "pieces" : "piece") : "Adet";
  const unitPieceBlower = isForeign ? (data.blower.qty > 1 ? "pieces" : "piece") : "Adet";
  const unitPiecePump = isForeign ? (data.pump.qty > 1 ? "pieces" : "piece") : "Adet";
  const unitTimeLabel = isForeign ? "hour" : "saat";
  const unitYearLabel = isForeign ? "/year" : "/ yıl";

  // 🌟 EKRANDA RENDER EDİLEN HER ŞEYİ KAPSAYAN STORE GÜNCELLEMESİ
  useEffect(() => {
    updateSection("tables", {
      ...formData?.tables,
      enerjikarsilastirmatablosu: {
        data: data,
        selectedSystem: selectedSystem,
        altSystemName: altSystemName,
        currency: currency,
        exchangeRate: exchangeRate,
        
        // 🌟 1. EKRANDAKİ TÜM BAŞLIKLAR, ETİKETLER VE BUTON YAZILARI
        headersAndLabels: {
          panelTitle: isForeign ? "Energy and Operational Cost Comparison Analysis" : "Enerji ve İşletme Maliyeti Karşılaştırma Analizi",
          currencyModeBadge: `${currency} Modu`,
          systemToggleBtnActivated: isForeign ? "Compare with Activated Sludge (6x)" : "Aktif Çamur ile Kıyasla (6x)",
          systemToggleBtnMBBR: isForeign ? "Compare with MBBR (5x)" : "MBBR ile Kıyasla (5x)",
          colHeaderSystemComponents: isForeign ? "SYSTEM COMPONENTS" : "SİSTEM BİLEŞENLERİ",
          colHeaderPlanetDisk: isForeign ? "PlanetDISK® Unit" : "PlanetDISK® Ünitesi",
          colHeaderAltSystem: altSystemName,
          colHeaderTechParams: isForeign ? "Technical Parameters" : "Teknik Parametreler",
          colHeaderMotorReducer: isForeign ? "Motor Reduction Gear" : "Motor Redüktörü",
          colHeaderBlower: "Blower",
          colHeaderPump: isForeign ? "Sludge Feed Pump" : "Çamur Geri Devir Pompası",
          rowLabelQty: isForeign ? "Unit / Equipment Number" : "Ünite / Ekipman Adedi",
          rowLabelPower: isForeign ? "Unit Motor Power" : "Birim Motor Gücü (kW)",
          rowLabelTotalPower: isForeign ? "Total Power" : "Toplam Kurulu Güç",
          rowLabelConsumptionFactor: isForeign ? "Power Consumption (%)" : "Anlık Güç Tüketim Oranı (%)",
          rowLabelActualPower: isForeign ? "Total Actual Power to be used" : "Kullanılacak Gerçek Net Güç",
          rowLabelPrice: isForeign ? `Electricity Price (${getCurrencySymbol()}/kWh)` : `Elektrik Birim Fiyatı (${getCurrencySymbol()}/kWh)`,
          rowLabelDailyHours: isForeign ? "Daily Working Time (hour/day)" : "Günlük Çalışma Süresi (saat)",
          rowLabelYearlyCost: isForeign ? "Yearly Energy Consumption Cost" : "Yıllık Tüketim Maliyeti",
          card1Title: isForeign ? "Comparing PlanetDISK® Unit with other systems yearly, electric power saving is" : `"${altSystemName}"'ne Kıyasla Yıllık Enerji Tasarrufu:`,
          card2Title: isForeign ? "For 10 years electric power saving price is equal to" : "Sistem Ömrü Boyunca 10 Yıllık Elektrik Kazancı:",
          card3Title: isForeign ? "and together with blower and diffusers maintenance cost, it will be approx" : "Blower, Difüzör Yenileme ve Bakım Maliyetleri Dahil Yaklaşık Toplam Tasarruf (10 Yıl)"
        },

        // 🌟 2. RENDER EDİLEN HAM SAYISAL METRİKLER
        planetMetrics: {
          totalPower: planetMetrics.totalPower,
          actualPower: planetMetrics.actualPower,
          yearlyCostConverted: Math.round(planetYearlyCostConverted)
        },
        blowerMetrics: {
          totalPower: blowerMetrics.totalPower,
          actualPower: blowerMetrics.actualPower,
          yearlyCostConverted: Math.round(blowerYearlyCostConverted)
        },
        pumpMetrics: {
          totalPower: pumpMetrics.totalPower,
          actualPower: pumpMetrics.actualPower,
          yearlyCostConverted: Math.round(pumpYearlyCostConverted)
        },

        // 🌟 3. RENDER EDİLEN TASARRUF DEĞERLERİ
        yearlySaving: yearlySaving, 
        tenYearsSaving: tenYearsSaving,
        totalGainWithMaintenance: totalGainWithMaintenance,
        yearlySavingConverted: Math.round(yearlySavingConverted),
        tenYearsSavingConverted: Math.round(tenYearsSavingConverted),
        totalGainWithMaintenanceConverted: Math.round(totalGainWithMaintenanceConverted / 1000) * 1000,

        // 🌟 4. EKRANDA HÜCRE HÜCRE BİÇİMLENDİRİLMİŞ (FORMATTED) RENDER EDİLEN BÜTÜN YAZILAR
        renderedTableContent: {
          qtyRow: {
            planet: `${formatInputValue(data.planet.qty)} ${unitPiecePlanet}`,
            blower: `${formatInputValue(data.blower.qty)} ${unitPieceBlower}`,
            pump: `${formatInputValue(data.pump.qty)} ${unitPiecePump}`
          },
          powerRow: {
            planet: `${formatInputValue(data.planet.power, 2)} kW`,
            blower: `${formatInputValue(data.blower.power, 2)} kW`,
            pump: `${formatInputValue(data.pump.power, 2)} kW`
          },
          totalPowerRow: {
            planet: `${formatNumber(planetMetrics.totalPower, 2, 2)} kW`,
            blower: `${formatNumber(blowerMetrics.totalPower, 2, 2)} kW`,
            pump: `${formatNumber(pumpMetrics.totalPower, 2, 2)} kW`
          },
          consumptionFactorRow: {
            planet: `${formatInputValue(data.planet.consumptionFactor)} %`,
            blower: `${formatInputValue(data.blower.consumptionFactor)} %`,
            pump: `${formatInputValue(data.pump.consumptionFactor)} %`
          },
          actualPowerRow: {
            planet: `${formatNumber(planetMetrics.actualPower, 2, 2)} kW`,
            blower: `${formatNumber(blowerMetrics.actualPower, 2, 2)} kW`,
            pump: `${formatNumber(pumpMetrics.actualPower, 2, 2)} kW`
          },
          priceRow: {
            planet: `${formatInputValue(data.planet.price * exchangeRate, 2)} ${getCurrencySymbol()}/kWh`,
            blower: `${formatInputValue(data.blower.price * exchangeRate, 2)} ${getCurrencySymbol()}/kWh`,
            pump: `${formatInputValue(data.pump.price * exchangeRate, 2)} ${getCurrencySymbol()}/kWh`
          },
          dailyHoursRow: {
            planet: `${formatInputValue(data.planet.dailyHours)} ${unitTimeLabel}`,
            blower: `${formatInputValue(data.blower.dailyHours)} ${unitTimeLabel}`,
            pump: `${formatInputValue(data.pump.dailyHours)} ${unitTimeLabel}`
          },
          yearlyCostRow: {
            planet: `${formatNumber(Math.round(planetYearlyCostConverted), 0, 0)} ${getCurrencySymbol()} ${unitYearLabel}`,
            blower: `${formatNumber(Math.round(blowerYearlyCostConverted), 0, 0)} ${getCurrencySymbol()} ${unitYearLabel}`,
            pump: `${formatNumber(Math.round(pumpYearlyCostConverted), 0, 0)} ${getCurrencySymbol()} ${unitYearLabel}`
          },
          summaryCards: {
            yearlySavingFormatted: `${formatNumber(Math.round(yearlySavingConverted), 0, 0)} ${getCurrencyUnitLabel()}`,
            tenYearsSavingFormatted: `${formatNumber(Math.round(tenYearsSavingConverted), 0, 0)} ${getTenYearsUnitLabel()}`,
            totalGainWithMaintenanceFormatted: `${formatNumber(Math.round(totalGainWithMaintenanceConverted / 1000) * 1000, 0, 0)} ${getCurrencySymbol()}`
          }
        }
      }
    });
  }, [
    data, 
    selectedSystem, 
    yearlySaving, 
    tenYearsSaving, 
    totalGainWithMaintenance, 
    exchangeRate, 
    currency, 
    teklifDili
  ]);

  const updateStoreWithNewData = (newData) => {
    setData(newData);
  };

  const handleRefresh = () => {
    setHistory([]);
    updateStoreWithNewData(defaultInitialState);
  };

  const saveToHistory = (currentState) => {
    setHistory([...history, JSON.stringify(currentState)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = JSON.parse(history[history.length - 1]);
    updateStoreWithNewData(previousState);
    setHistory(history.slice(0, -1));
  };

  const handleParamChange = (system, field, value) => {
    saveToHistory(data);
    let finalValue = parseInputValue(value);

    if (field === "price") {
      finalValue = finalValue / exchangeRate;
    }

    setData({
      ...data,
      [system]: {
        ...data[system],
        [field]: finalValue
      }
    });
  };

  // Dinamik input hücre render metodu
  const renderManagedInput = (system, field, rawValue, isPrice = false) => {
    const isCurrent = editingCell?.system === system && editingCell?.field === field;
    
    let displayValue = "";
    if (isCurrent) {
      displayValue = editingCell.value;
    } else {
      const valNum = isPrice ? parseFloat(rawValue || 0) * exchangeRate : parseFloat(rawValue || 0);
      displayValue = formatInputValue(valNum, isPrice || field === "power" ? 2 : 0);
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
          const valNum = isPrice ? parseFloat(rawValue || 0) * exchangeRate : parseFloat(rawValue || 0);
          const cleanString = isForeign ? valNum.toString() : valNum.toString().replace(".", ",");
          setEditingCell({ system, field, value: cleanString });
        }}
        onBlur={(e) => {
          handleParamChange(system, field, e.target.value);
          setEditingCell(null);
        }}
      />
    );
  };

  const headerThemeClass = selectedSystem === "aktif_camur" ? "text-success" : "text-info";
  const headerBgStyle = selectedSystem === "aktif_camur" ? "rgba(22, 163, 74, 0.1)" : "rgba(6, 182, 212, 0.1)";

  return (
    <div className="d-flex flex-column gap-3 w-100 text-white">

      <style>{`
        .comp-row { border-bottom: 1px solid #334155; }
        .comp-row:last-child { border-bottom: none; }
        .comp-input { font-size: 12px; box-shadow: none; width: 70px; border-bottom: 1px dashed #475569 !important; }
        .comp-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.08) !important; border-bottom: 1px solid #60a5fa !important; }
        .header-main-title { font-size: 11px; font-weight: 800; letter-spacing: 0.6px; background-color: #090d16; color: #94a3b8; display: flex; align-items: center; }
        .bg-planet-column { background-color: rgba(217, 119, 6, 0.08); }
        .bg-activated-column { background-color: rgba(22, 163, 74, 0.05); }
        .system-toggle-btn { font-size: 11px; font-weight: 600; letter-spacing: 0.5px; transition: all 0.2s ease; }
      `}</style>

      {/* SİSTEM SWITCH ALANI */}
      <div className="d-flex align-items-center gap-2 bg-dark p-1 rounded-3 border align-self-start" style={{ borderColor: "#334155" }}>
        <button
          type="button"
          onClick={() => setSelectedSystem("aktif_camur")}
          className={`btn btn-sm px-4 system-toggle-btn ${selectedSystem === "aktif_camur" ? "btn-success" : "btn-transparent text-white-50"}`}
          style={{ borderRadius: "6px" }}
        >
          {isForeign ? "Compare with Activated Sludge (6x)" : "Aktif Çamur ile Kıyasla (6x)"}
        </button>
        <button
          type="button"
          onClick={() => setSelectedSystem("mbbr")}
          className={`btn btn-sm px-4 system-toggle-btn ${selectedSystem === "mbbr" ? "btn-info text-dark" : "btn-transparent text-white-50"}`}
          style={{ borderRadius: "6px" }}
        >
          {isForeign ? "Compare with MBBR (5x)" : "MBBR ile Kıyasla (5x)"}
        </button>
      </div>

      <div className="w-100" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div className="d-flex flex-column rounded-3 overflow-hidden" style={{ border: "1px solid #334155", backgroundColor: "#151f32", minWidth: "950px" }}>

          {/* ÜST PANEL */}
          <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: "#0f172a", borderBottom: "1px solid #334155" }}>
            <div className="fw-semibold text-white" style={{ fontSize: "14px" }}>
              {isForeign ? "Energy and Operational Cost Comparison Analysis" : "Enerji ve İşletme Maliyeti Karşılaştırma Analizi"}
            </div>

            <div className="d-flex align-items-center gap-3">
              <span className="badge fw-bold py-2 px-3" style={{ backgroundColor: "#090d16", color: "#fbbf24", border: "1px solid #475569", fontSize: "11px" }}>
                {currency} Modu
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

          {/* DİNAMİK SUTUN BAŞLIKLARI */}
          <div className="d-flex text-center border-bottom align-items-stretch" style={{ borderColor: "#334155" }}>
            <div className="p-2 header-main-title text-start ps-3" style={{ width: "31%" }}>
              {isForeign ? "SYSTEM COMPONENTS" : "SİSTEM BİLEŞENLERİ"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-main-title text-warning justify-content-center" style={{ width: "23%", backgroundColor: "rgba(217, 119, 6, 0.15)" }}>
              {isForeign ? `PlanetDISK® Unit` : "PlanetDISK® Ünitesi"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className={`p-2 header-main-title justify-content-center ${headerThemeClass}`} style={{ width: "46%", backgroundColor: headerBgStyle }}>
              {isForeign ? `${altSystemName}` : altSystemName}
            </div>
          </div>

          <div className="d-flex text-center border-bottom align-items-stretch fw-bold" style={{ borderColor: "#334155", backgroundColor: "#0f172a", fontSize: "11.5px" }}>
            <div className="p-2 text-start ps-3 text-white-50" style={{ width: "31%" }}>
              {isForeign ? "Technical Parameters" : "Teknik Parametreler"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-warning bg-planet-column d-flex align-items-center justify-content-center" style={{ width: "23%" }}>
              {isForeign ? "Motor Reduction Gear" : "Motor Redüktörü"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-success bg-activated-column d-flex align-items-center justify-content-center" style={{ width: "23%" }}>
              Blower
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-success bg-activated-column d-flex align-items-center justify-content-center" style={{ width: "23%" }}>
              {isForeign ? "Sludge Feed Pump" : "Çamur Geri Devir Pompası"}
            </div>
          </div>

          {/* ADET ROW */}
          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2 ps-3 fw-medium text-white-50 d-flex align-items-center" style={{ width: "31%", fontSize: "12px" }}>
              {isForeign ? "Unit / Equipment Number" : "Ünite / Ekipman Adedi"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "23%" }}>
              {renderManagedInput("planet", "qty", data.planet.qty)}
              <span className="text-white-50" style={{ fontSize: "11px" }}>{unitPiecePlanet}</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              {renderManagedInput("blower", "qty", data.blower.qty)}
              <span className="text-white-50" style={{ fontSize: "11px" }}>{unitPieceBlower}</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              {renderManagedInput("pump", "qty", data.pump.qty)}
              <span className="text-white-50" style={{ fontSize: "11px" }}>{unitPiecePump}</span>
            </div>
          </div>

          {/* GÜÇ ROW */}
          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2 ps-3 fw-medium text-white-50 d-flex align-items-center" style={{ width: "31%", fontSize: "12px" }}>
              {isForeign ? "Unit Motor Power" : "Birim Motor Gücü (kW)"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "23%" }}>
              {renderManagedInput("planet", "power", data.planet.power)}
              <span className="text-white-50" style={{ fontSize: "11px" }}>kW</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              {renderManagedInput("blower", "power", data.blower.power)}
              <span className="text-white-50" style={{ fontSize: "11px" }}>kW</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              {renderManagedInput("pump", "power", data.pump.power)}
              <span className="text-white-50" style={{ fontSize: "11px" }}>kW</span>
            </div>
          </div>

          {/* TOPLAM KURULU GÜÇ ROW */}
          <div className="d-flex align-items-stretch comp-row font-monospace text-white" style={{ fontSize: "12px" }}>
            <div className="p-2 ps-3 fw-medium text-white-50 font-sans-serif d-flex align-items-center" style={{ width: "31%" }}>
              {isForeign ? "Total Power" : "Toplam Kurulu Güç"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-planet-column fw-bold d-flex align-items-center justify-content-center" style={{ width: "23%" }}>{formatNumber(planetMetrics.totalPower, 2, 2)} kW</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-activated-column fw-bold d-flex align-items-center justify-content-center" style={{ width: "23%" }}>{formatNumber(blowerMetrics.totalPower, 2, 2)} kW</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-activated-column fw-bold d-flex align-items-center justify-content-center" style={{ width: "23%" }}>{formatNumber(pumpMetrics.totalPower, 2, 2)} kW</div>
          </div>

          {/* TÜKETİM ORANI ROW */}
          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2 ps-3 fw-medium text-white-50 d-flex align-items-center" style={{ width: "31%", fontSize: "12px" }}>
              {isForeign ? "Power Consumption (%)" : "Anlık Güç Tüketim Oranı (%)"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "23%" }}>
              {renderManagedInput("planet", "consumptionFactor", data.planet.consumptionFactor)}
              <span className="text-white-50" style={{ fontSize: "11px" }}>%</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              {renderManagedInput("blower", "consumptionFactor", data.blower.consumptionFactor)}
              <span className="text-white-50" style={{ fontSize: "11px" }}>%</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              {renderManagedInput("pump", "consumptionFactor", data.pump.consumptionFactor)}
              <span className="text-white-50" style={{ fontSize: "11px" }}>%</span>
            </div>
          </div>

          {/* NET GÜÇ ROW */}
          <div className="d-flex align-items-stretch comp-row font-monospace text-white" style={{ fontSize: "12px" }}>
            <div className="p-2 ps-3 fw-medium text-white-50 font-sans-serif d-flex align-items-center" style={{ width: "31%" }}>
              {isForeign ? "Total Actual Power to be used" : "Kullanılacak Gerçek Net Güç"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-planet-column fw-bold text-warning d-flex align-items-center justify-content-center" style={{ width: "23%" }}>{formatNumber(planetMetrics.actualPower, 2, 2)} kW</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-activated-column fw-bold text-success d-flex align-items-center justify-content-center" style={{ width: "23%" }}>{formatNumber(blowerMetrics.actualPower, 2, 2)} kW</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-activated-column fw-bold text-success d-flex align-items-center justify-content-center" style={{ width: "23%" }}>{formatNumber(pumpMetrics.actualPower, 2, 2)} kW</div>
          </div>

          {/* FİYAT ROW */}
          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2 ps-3 fw-medium text-white-50 d-flex align-items-center" style={{ width: "31%", fontSize: "12px" }}>
              {isForeign ? `Electricity Price (${getCurrencySymbol()}/kWh)` : `Elektrik Birim Fiyatı (${getCurrencySymbol()}/kWh)`}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "23%" }}>
              {renderManagedInput("planet", "price", data.planet.price, true)}
              <span className="text-white-50" style={{ fontSize: "11px" }}>{getCurrencySymbol()}/kWh</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              {renderManagedInput("blower", "price", data.blower.price, true)}
              <span className="text-white-50" style={{ fontSize: "11px" }}>{getCurrencySymbol()}/kWh</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              {renderManagedInput("pump", "price", data.pump.price, true)}
              <span className="text-white-50" style={{ fontSize: "11px" }}>{getCurrencySymbol()}/kWh</span>
            </div>
          </div>

          {/* SÜRE ROW */}
          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2 ps-3 fw-medium text-white-50 d-flex align-items-center" style={{ width: "31%", fontSize: "12px" }}>
              {isForeign ? "Daily Working Time (hour/day)" : "Günlük Çalışma Süresi (saat)"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "23%" }}>
              {renderManagedInput("planet", "dailyHours", data.planet.dailyHours)}
              <span className="text-white-50" style={{ fontSize: "11px" }}>{unitTimeLabel}</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              {renderManagedInput("blower", "dailyHours", data.blower.dailyHours)}
              <span className="text-white-50" style={{ fontSize: "11px" }}>{unitTimeLabel}</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              {renderManagedInput("pump", "dailyHours", data.pump.dailyHours)}
              <span className="text-white-50" style={{ fontSize: "11px" }}>{unitTimeLabel}</span>
            </div>
          </div>

          {/* MALİYET TOPLAMLARI ROW */}
          <div className="d-flex align-items-stretch" style={{ backgroundColor: "#0b1524", borderTop: "2px dashed #475569" }}>
            <div className="p-2.5 ps-3 fw-bold text-white-50 text-uppercase d-flex align-items-center" style={{ width: "31%", fontSize: "11px" }}>
              {isForeign ? "Yearly Energy Consumption Cost" : "Yıllık Tüketim Maliyeti"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2.5 text-center bg-planet-column fw-bold text-warning d-flex align-items-center justify-content-center" style={{ width: "23%", fontSize: "13px" }}>
              {formatNumber(Math.round(planetYearlyCostConverted), 0, 0)} {getCurrencySymbol()} <span style={{ fontSize: "10px" }} className="text-white-50 ms-1">{unitYearLabel}</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2.5 text-center bg-activated-column fw-bold text-danger d-flex align-items-center justify-content-center" style={{ width: "23%", fontSize: "13px" }}>
              {formatNumber(Math.round(blowerYearlyCostConverted), 0, 0)} {getCurrencySymbol()} <span style={{ fontSize: "10px" }} className="text-white-50 ms-1">{unitYearLabel}</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2.5 text-center bg-activated-column fw-bold text-danger d-flex align-items-center justify-content-center" style={{ width: "23%", fontSize: "13px" }}>
              {formatNumber(Math.round(pumpYearlyCostConverted), 0, 0)} {getCurrencySymbol()} <span style={{ fontSize: "10px" }} className="text-white-50 ms-1">{unitYearLabel}</span>
            </div>
          </div>

        </div>
      </div>

      {/* ALT DETAY TASARRUF KARTLARI */}
      <div className="d-flex flex-column rounded-3 overflow-hidden border p-3 gap-2" style={{ borderColor: "#475569", backgroundColor: "#090d16" }}>

        <div className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <span className="text-white-50" style={{ fontSize: "12.5px" }}>
            {isForeign ? <>Comparing PlanetDISK® Unit with other systems yearly, electric power saving is</> : <>"{altSystemName}"'ne Kıyasla <b>Yıllık Enerji Tasarrufu</b>:</>}
          </span>
          <span className="fw-bold text-danger font-monospace" style={{ fontSize: "14px" }}>
            {formatNumber(Math.round(yearlySavingConverted), 0, 0)} {getCurrencyUnitLabel()}
          </span>
        </div>

        <div className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <span className="text-white-50" style={{ fontSize: "12.5px" }}>
            {isForeign ? <>For <b>10 years</b> electric power saving price is equal to</> : <>Sistem Ömrü Boyunca <b>10 Yıllık Elektrik Kazancı</b>:</>}
          </span>
          <span className="fw-bold text-danger font-monospace" style={{ fontSize: "14px" }}>
            {formatNumber(Math.round(tenYearsSavingConverted), 0, 0)} {getTenYearsUnitLabel()}
          </span>
        </div>

        <div className="d-flex justify-content-center flex-column align-items-center p-3 rounded-2 mt-1" style={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="text-white-50 mb-1 fw-medium text-center" style={{ fontSize: "12px", letterSpacing: "0.5px" }}>
            {isForeign ? "and together with blower and diffusers maintenance cost, it will be approx" : "Blower, Difüzör Yenileme ve Bakım Maliyetleri Dahil <b>Yaklaşık Toplam Tasarruf (10 Yıl)</b>"}
          </span>
          <span className="fw-extrabold text-danger font-monospace text-center" style={{ fontSize: "32px", letterSpacing: "1px" }}>
            {formatNumber(Math.round(totalGainWithMaintenanceConverted / 1000) * 1000, 0, 0)} {getCurrencySymbol()}
          </span>
        </div>

      </div>

    </div>
  );
}

export default EnerjiKarsilastirmaTablosu;