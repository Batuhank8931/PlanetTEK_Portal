import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";

function KarbonAyakiziTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const teklifDili = formData?.customerInfo?.teklifDili;
  const isForeign = teklifDili === "Yabancı";

  // Enerji karşılaştırma tablosunun store'a yazdığı güncel durumları çekiyoruz
  const enerjiKarsilastirma = formData?.tables?.enerjikarsilastirmatablosu;
  const selectedSystem = enerjiKarsilastirma?.selectedSystem || "aktif_camur";
  const enerjiKarsilastirmaData = enerjiKarsilastirma?.data;

  // Mağazadan veya dinamik parametrelerden gelen günlük kWh hesapları
  // 1. PlanetDISK Günlük kWh (Güç * Adet * Faktör% * Saat)
  const planetTotalPower = (enerjiKarsilastirmaData?.planet?.qty * enerjiKarsilastirmaData?.planet?.power) || 0;
  const planetDailyKwh = planetTotalPower * ((enerjiKarsilastirmaData?.planet?.consumptionFactor || 90) / 100) * (enerjiKarsilastirmaData?.planet?.dailyHours || 24);

  // 2. Alternatif Sistem Günlük kWh (Blower + Pompa Tüketimleri Toplamı)
  const blowerTotalPower = (enerjiKarsilastirmaData?.blower?.qty * enerjiKarsilastirmaData?.blower?.power) || 0;
  const blowerDailyKwh = blowerTotalPower * ((enerjiKarsilastirmaData?.blower?.consumptionFactor || 90) / 100) * (enerjiKarsilastirmaData?.blower?.dailyHours || 24);

  const pumpTotalPower = (enerjiKarsilastirmaData?.pump?.qty * enerjiKarsilastirmaData?.pump?.power) || 0;
  const pumpDailyKwh = pumpTotalPower * ((enerjiKarsilastirmaData?.pump?.consumptionFactor || 90) / 100) * (enerjiKarsilastirmaData?.pump?.dailyHours || 4);

  const altSystemDailyKwh = blowerDailyKwh + pumpDailyKwh;

  const storeTabloVerisi = formData?.tables?.karbonayakizitablosu?.data || formData?.tables?.karbonayakizitablosu;

  // 1. KURAL: İlk açılışta store'da veri varsa yükle, yoksa temiz şablonla başla
  const [data, setData] = useState(() => {
    if (storeTabloVerisi && storeTabloVerisi.co2Factor) {
      return storeTabloVerisi;
    }
    return {
      co2Factor: 0.43, // Standart şebeke emisyon faktörü kg CO2 / kWh
    };
  });

  const [history, setHistory] = useState([]);

  // Enerji karşılaştırma tablosundaki cihaz güçleri veya adetleri değiştikçe burası store ile otomatik senkron kalır
  const currentPlanetDailyKwh = planetDailyKwh || 64.6;
  const currentAltDailyKwh = altSystemDailyKwh || 345.5;

  const planetYearlyKwh = currentPlanetDailyKwh * 365;
  const planetCo2 = (planetYearlyKwh * data.co2Factor) / 1000;

  const altYearlyKwh = currentAltDailyKwh * 365;
  const altCo2 = (altYearlyKwh * data.co2Factor) / 1000;

  const savedCo2 = altCo2 - planetCo2;
  const rawEquivalentTrees = (savedCo2 * 1000) / 22;

  // Pazarlama odaklı jilet gibi yuvarlama: 1000'in altındaysa en yakın 100'e, üstündeyse en yakın 1000'e yuvarla
  const equivalentTrees = rawEquivalentTrees > 1000
    ? Math.round(rawEquivalentTrees / 1000) * 1000
    : Math.round(rawEquivalentTrees / 100) * 100;

  // 2. KURAL: Veriler değiştikçe merkezi store'a kaydet
  useEffect(() => {
    updateSection("tables", {
      ...formData?.tables,
      karbonayakizitablosu: {
        data: data,
        savedCo2: savedCo2,
        equivalentTrees: Number(equivalentTrees)
      }
    });
  }, [data, savedCo2, equivalentTrees]);

  // 4. KURAL: REFRESH BUTONU - Değişiklikleri temizler ve fabrika emisyon değerine sıfırlar
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
    setData({ ...data, [field]: parseFloat(value) || 0 });
  };

  const altSystemName = selectedSystem === "aktif_camur" 
    ? (isForeign ? "Activated Sludge System" : "Klasik Aktif Çamur Sistemi") 
    : (isForeign ? "MBBR System" : "MBBR Sistemi");

  const headerThemeClass = selectedSystem === "aktif_camur" ? "text-success" : "text-info";
  const headerBgStyle = selectedSystem === "aktif_camur" ? "rgba(22, 163, 74, 0.1)" : "rgba(6, 182, 212, 0.1)";

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

          {/* ÜST PANEL: BAŞLIK VE REFRESH / UNDO PANELİ */}
          <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: "#0f172a", borderBottom: "1px solid #334155" }}>
            <div className="fw-semibold text-white" style={{ fontSize: "14px", textTransform: isForeign ? "uppercase" : "none", letterSpacing: isForeign ? "0.5px" : "normal" }}>
              {isForeign ? "CARBON FOOTPRINT and Environmental Impact Analysis" : "Karbon Ayak İzi ve Çevresel Etki Analizi"}
            </div>

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
              {currentPlanetDailyKwh.toFixed(1)} <span className="text-white-50 font-sans-serif fw-normal ms-1" style={{ fontSize: "11px" }}>{isForeign ? "kw/day" : "kWh/gün"}</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-alt-column fw-bold d-flex align-items-center justify-content-center text-white font-monospace" style={{ width: "33%", fontSize: "12.5px" }}>
              {currentAltDailyKwh.toFixed(1)} <span className="text-white-50 font-sans-serif fw-normal ms-1" style={{ fontSize: "11px" }}>{isForeign ? "kw/day" : "kWh/gün"}</span>
            </div>
          </div>

          {/* YILLIK TÜKETİM ROW */}
          <div className="d-flex align-items-stretch comp-row font-monospace text-white" style={{ fontSize: "12.5px" }}>
            <div className="p-2.5 ps-3 fw-medium text-white-50 font-sans-serif d-flex align-items-center" style={{ width: "34%" }}>
              {isForeign ? "Annual Energy Consumption" : "Yıllık Toplam Enerji Tüketimi"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2.5 text-center bg-planet-column fw-bold" style={{ width: "33%" }}>{Math.round(planetYearlyKwh).toLocaleString()} {isForeign ? "kW/year" : "kWh/yıl"}</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2.5 text-center bg-alt-column fw-bold" style={{ width: "33%" }}>{Math.round(altYearlyKwh).toLocaleString()} {isForeign ? "kW/year" : "kWh/yıl"}</div>
          </div>

          {/* EMİSYON FAKTÖRÜ ROW */}
          <div className="d-flex align-items-stretch comp-row" style={{ backgroundColor: "#1e293b" }}>
            <div className="p-2.5 ps-3 fw-medium text-white-50 d-flex align-items-center" style={{ width: "34%", fontSize: "12px" }}>
              {isForeign ? <>CO2 Emission Coefficient<br /><span style={{ fontSize: "10px", color: "#64748b" }}>(Grid Electricity Carbon Intensity)</span></> : <>Grid Emisyon Faktörü<br /><span style={{ fontSize: "10px", color: "#64748b" }}>(Elektrik Üretimi Karbon Yoğunluğu)</span></>}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1" style={{ width: "66%" }}>
              <input type="number" step="0.01" className="form-control form-control-sm bg-transparent border-0 text-center text-warning fw-bold p-0 comp-input" style={{ width: "60px" }} value={data.co2Factor} onChange={(e) => handleParamChange("co2Factor", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>{isForeign ? "kg/eMWh" : "kg CO₂ / kWh"}</span>
            </div>
          </div>

          {/* TOPLAM SALINIM ROW */}
          <div className="d-flex align-items-stretch" style={{ backgroundColor: "#0b1524", borderTop: "2px dashed #475569" }}>
            <div className="p-3 ps-3 fw-bold text-white-50 text-uppercase d-flex align-items-center" style={{ width: "34%", fontSize: "11.5px" }}>
              {isForeign ? "Annual Carbon Footprint" : "Yıllık Karbon Ayak İzi (Salınım)"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-3 text-center bg-planet-column fw-bold text-success font-monospace" style={{ width: "33%", fontSize: "15px" }}>
              {planetCo2.toFixed(1)} <span style={{ fontSize: "11px" }} className="text-white-50 font-sans-serif fw-normal">{isForeign ? "ton/year" : "ton CO₂/yıl"}</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-3 text-center bg-alt-column fw-bold text-danger font-monospace" style={{ width: "33%", fontSize: "15px" }}>
              {altCo2.toFixed(1)} <span style={{ fontSize: "11px" }} className="text-white-50 font-sans-serif fw-normal">{isForeign ? "ton/year" : "ton CO₂/yıl"}</span>
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
            {savedCo2 > 0 ? `+${savedCo2.toFixed(1)}` : savedCo2.toFixed(1)} ton CO₂
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
              {isForeign ? `~ ${equivalentTrees.toLocaleString()} trees to nature / year` : `~ ${equivalentTrees.toLocaleString()} Ağaç / yıl`}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}

export default KarbonAyakiziTablosu;