import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";
import { hesaplaKlasikSistemEkipmanlari } from "../../utils/kıyaslamaHesap";

function EnerjiKarsilastirmaTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  // Kıyaslanacak alternatif sistem seçimi: "aktif_camur" veya "mbbr"
  const [selectedSystem, setSelectedSystem] = useState("aktif_camur");

  const storeTabloVerisi = formData?.tables?.enerjikarsilastirmatablosu?.data || formData?.tables?.enerjikarsilastirmatablosu;

  const planetDiskDetails = formData.planetDiskDetails || {};
  const yerlesimArray = planetDiskDetails?.tasarim?.yerlesimSiralanisi || [];
  const RBCUnite = planetDiskDetails?.tasarim?.aritmaParametreleri?.RBCUnite || "MX";
  const toplamRbcAdedi = yerlesimArray
    .filter(item => item && item.isLamella === false)
    .reduce((sum, item) => sum + (parseInt(item.adet) || 0), 0);

  // 1. ADIM: Temel PlanetDISK objesini oluşturuyoruz
  const basePlanetState = {
    qty: toplamRbcAdedi || 8,
    power: RBCUnite === "MX" ? 0.37 : 0.25,
    consumptionFactor: 90,
    price: 0.13,
    dailyHours: 24,
    yearlyDays: 365
  };

  // 2. ADIM: Güncellenmiş pazarlama motorunu seçili sisteme göre (6 katı veya 5 katı) çalıştırıyoruz
  const sistemSimulasyonu = hesaplaKlasikSistemEkipmanlari(basePlanetState, selectedSystem);

  // Fabrika ayarları şablonu
  const defaultInitialState = {
    planet: basePlanetState,
    blower: sistemSimulasyonu.blower,
    pump: sistemSimulasyonu.pump,
    maintenanceSaving: toplamRbcAdedi * 494 // Adet başına bakım tasarrufu
  };

  // 1. KURAL: İlk açılışta store'a bak. Varsa onu yükle, yoksa varsayılan şablonla başla.
  const [data, setData] = useState(() => {
    if (storeTabloVerisi && storeTabloVerisi.planet) {
      return storeTabloVerisi;
    }
    return defaultInitialState;
  });

  const [history, setHistory] = useState([]);

  // Form verisindeki disk adetleri, tipleri veya kıyaslanan sistem switch'i değiştikçe state'i tazeleyelim
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

  const totalAltSystemCost = blowerMetrics.yearlyCost + pumpMetrics.yearlyCost;
  const yearlySaving = totalAltSystemCost - planetMetrics.yearlyCost;
  const tenYearsSaving = yearlySaving * 10;
  const totalGainWithMaintenance = tenYearsSaving + data.maintenanceSaving;

  // 2. KURAL: State, metrikler veya switch her değiştiğinde store'u güncel tut
  useEffect(() => {
    updateSection("tables", {
      ...formData?.tables,
      enerjikarsilastirmatablosu: {
        data: data,
        selectedSystem: selectedSystem,
        yearlySaving: yearlySaving,
        tenYearsSaving: tenYearsSaving,
        totalGainWithMaintenance: totalGainWithMaintenance
      }
    });
  }, [data, selectedSystem, yearlySaving, tenYearsSaving, totalGainWithMaintenance]);

  const updateStoreWithNewData = (newData) => {
    setData(newData);
  };

  // 4. KURAL: REFRESH BUTONU - Tüm değişiklikleri siler ve tabloyu fabrika ayarlarına çeker
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
    setData({
      ...data,
      [system]: {
        ...data[system],
        [field]: parseFloat(value) || 0
      }
    });
  };

  // Dinamik metin ve renklendirme yönetimi
  const altSystemName = selectedSystem === "aktif_camur" ? "Klasik Aktif Çamur Sistemi" : "MBBR Sistemi";
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
          Aktif Çamur ile Kıyasla (6x)
        </button>
        <button
          type="button"
          onClick={() => setSelectedSystem("mbbr")}
          className={`btn btn-sm px-4 system-toggle-btn ${selectedSystem === "mbbr" ? "btn-info text-dark" : "btn-transparent text-white-50"}`}
          style={{ borderRadius: "6px" }}
        >
          MBBR ile Kıyasla (5x)
        </button>
      </div>

      <div className="w-100" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div className="d-flex flex-column rounded-3 overflow-hidden" style={{ border: "1px solid #334155", backgroundColor: "#151f32", minWidth: "950px" }}>

          {/* ÜST PANEL: REFRESH / UNDO BUTONLARI */}
          <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: "#0f172a", borderBottom: "1px solid #334155" }}>
            <div className="fw-semibold text-white" style={{ fontSize: "14px" }}>
              Enerji ve İşletme Maliyeti Karşılaştırma Analizi
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

          {/* DİNAMİK SUTUN BAŞLIKLARI */}
          <div className="d-flex text-center border-bottom align-items-stretch" style={{ borderColor: "#334155" }}>
            <div className="p-2 header-main-title text-start ps-3" style={{ width: "31%" }}>SİSTEM BİLEŞENLERİ</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-main-title text-warning justify-content-center" style={{ width: "23%", backgroundColor: "rgba(217, 119, 6, 0.15)" }}>PlanetDISK® Ünitesi</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className={`p-2 header-main-title justify-content-center ${headerThemeClass}`} style={{ width: "46%", backgroundColor: headerBgStyle }}>
              {altSystemName}
            </div>
          </div>

          <div className="d-flex text-center border-bottom align-items-stretch fw-bold" style={{ borderColor: "#334155", backgroundColor: "#0f172a", fontSize: "11.5px" }}>
            <div className="p-2 text-start ps-3 text-white-50" style={{ width: "31%" }}>Teknik Parametreler</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-warning bg-planet-column d-flex align-items-center justify-content-center" style={{ width: "23%" }}>Motor Redüktörü</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-success bg-activated-column d-flex align-items-center justify-content-center" style={{ width: "23%" }}>Blower</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-success bg-activated-column d-flex align-items-center justify-content-center" style={{ width: "23%" }}>Çamur Geri Devir Pompası</div>
          </div>

          {/* ADET ROW */}
          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2 ps-3 fw-medium text-white-50 d-flex align-items-center" style={{ width: "31%", fontSize: "12px" }}>Ünite / Ekipman Adedi</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.planet.qty} onChange={(e) => handleParamChange("planet", "qty", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>Adet</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.blower.qty} onChange={(e) => handleParamChange("blower", "qty", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>Adet</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.pump.qty} onChange={(e) => handleParamChange("pump", "qty", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>Adet</span>
            </div>
          </div>

          {/* GÜÇ ROW */}
          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2 ps-3 fw-medium text-white-50 d-flex align-items-center" style={{ width: "31%", fontSize: "12px" }}>Birim Motor Gücü (kW)</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "23%" }}>
              <input type="number" step="0.01" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.planet.power} onChange={(e) => handleParamChange("planet", "power", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>kW</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" step="0.1" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.blower.power} onChange={(e) => handleParamChange("blower", "power", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>kW</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" step="0.1" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.pump.power} onChange={(e) => handleParamChange("pump", "power", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>kW</span>
            </div>
          </div>

          {/* TOPLAM KURULU GÜÇ ROW */}
          <div className="d-flex align-items-stretch comp-row font-monospace text-white" style={{ fontSize: "12px" }}>
            <div className="p-2 ps-3 fw-medium text-white-50 font-sans-serif d-flex align-items-center" style={{ width: "31%" }}>Toplam Kurulu Güç</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-planet-column fw-bold d-flex align-items-center justify-content-center" style={{ width: "23%" }}>{planetMetrics.totalPower.toFixed(2)} kW</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-activated-column fw-bold d-flex align-items-center justify-content-center" style={{ width: "23%" }}>{blowerMetrics.totalPower.toFixed(2)} kW</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-activated-column fw-bold d-flex align-items-center justify-content-center" style={{ width: "23%" }}>{pumpMetrics.totalPower.toFixed(2)} kW</div>
          </div>

          {/* TÜKETİM ORANI ROW */}
          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2 ps-3 fw-medium text-white-50 d-flex align-items-center" style={{ width: "31%", fontSize: "12px" }}>Anlık Güç Tüketim Oranı (%)</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.planet.consumptionFactor} onChange={(e) => handleParamChange("planet", "consumptionFactor", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>%</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.blower.consumptionFactor} onChange={(e) => handleParamChange("blower", "consumptionFactor", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>%</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.pump.consumptionFactor} onChange={(e) => handleParamChange("pump", "consumptionFactor", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>%</span>
            </div>
          </div>

          {/* NET GÜÇ ROW */}
          <div className="d-flex align-items-stretch comp-row font-monospace text-white" style={{ fontSize: "12px" }}>
            <div className="p-2 ps-3 fw-medium text-white-50 font-sans-serif d-flex align-items-center" style={{ width: "31%" }}>Kullanılacak Gerçek Net Güç</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-planet-column fw-bold text-warning d-flex align-items-center justify-content-center" style={{ width: "23%" }}>{planetMetrics.actualPower.toFixed(2)} kW</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-activated-column fw-bold text-success d-flex align-items-center justify-content-center" style={{ width: "23%" }}>{blowerMetrics.actualPower.toFixed(2)} kW</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center bg-activated-column fw-bold text-success d-flex align-items-center justify-content-center" style={{ width: "23%" }}>{pumpMetrics.actualPower.toFixed(2)} kW</div>
          </div>

          {/* FİYAT ROW */}
          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2 ps-3 fw-medium text-white-50 d-flex align-items-center" style={{ width: "31%", fontSize: "12px" }}>Elektrik Birim Fiyatı (€/kWh)</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "23%" }}>
              <input type="number" step="0.01" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.planet.price} onChange={(e) => handleParamChange("planet", "price", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>€</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" step="0.01" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.blower.price} onChange={(e) => handleParamChange("blower", "price", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>€</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" step="0.01" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.pump.price} onChange={(e) => handleParamChange("pump", "price", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>€</span>
            </div>
          </div>

          {/* SÜRE ROW */}
          <div className="d-flex align-items-stretch comp-row">
            <div className="p-2 ps-3 fw-medium text-white-50 d-flex align-items-center" style={{ width: "31%", fontSize: "12px" }}>Günlük Çalışma Süresi (saat)</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-planet-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.planet.dailyHours} onChange={(e) => handleParamChange("planet", "dailyHours", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>saat</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm bg-transparent border-0 text-center text-white fw-bold p-0 comp-input" value={data.blower.dailyHours} onChange={(e) => handleParamChange("blower", "dailyHours", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>saat</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 d-flex justify-content-center align-items-center gap-1 bg-activated-column" style={{ width: "23%" }}>
              <input type="number" className="form-control form-control-sm text-center bg-transparent border-0 text-white fw-bold p-0 comp-input" value={data.pump.dailyHours} onChange={(e) => handleParamChange("pump", "dailyHours", e.target.value)} />
              <span className="text-white-50" style={{ fontSize: "11px" }}>saat</span>
            </div>
          </div>

          {/* MALİYET TOPLAMLARI ROW */}
          <div className="d-flex align-items-stretch" style={{ backgroundColor: "#0b1524", borderTop: "2px dashed #475569" }}>
            <div className="p-2.5 ps-3 fw-bold text-white-50 text-uppercase d-flex align-items-center" style={{ width: "31%", fontSize: "11px" }}>Yıllık Tüketim Maliyeti</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2.5 text-center bg-planet-column fw-bold text-warning d-flex align-items-center justify-content-center" style={{ width: "23%", fontSize: "13px" }}>
              {Math.round(planetMetrics.yearlyCost).toLocaleString()} € <span style={{ fontSize: "10px" }} className="text-white-50 ms-1">/ yıl</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2.5 text-center bg-activated-column fw-bold text-danger d-flex align-items-center justify-content-center" style={{ width: "23%", fontSize: "13px" }}>
              {Math.round(blowerMetrics.yearlyCost).toLocaleString()} € <span style={{ fontSize: "10px" }} className="text-white-50 ms-1">/ yıl</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2.5 text-center bg-activated-column fw-bold text-danger d-flex align-items-center justify-content-center" style={{ width: "23%", fontSize: "13px" }}>
              {Math.round(pumpMetrics.yearlyCost).toLocaleString()} € <span style={{ fontSize: "10px" }} className="text-white-50 ms-1">/ yıl</span>
            </div>
          </div>

        </div>
      </div>

      {/* ALT DETAY TASARRUF KARTLARI */}
      <div className="d-flex flex-column rounded-3 overflow-hidden border p-3 gap-2" style={{ borderColor: "#475569", backgroundColor: "#090d16" }}>

        <div className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <span className="text-white-50" style={{ fontSize: "12.5px" }}>{altSystemName}'ne Kıyasla **Yıllık Enerji Tasarrufu**:</span>
          <span className="fw-bold text-success font-monospace" style={{ fontSize: "14px" }}>
            {Math.round(yearlySaving).toLocaleString()} € / yıl
          </span>
        </div>

        <div className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <span className="text-white-50" style={{ fontSize: "12.5px" }}>Sistem Ömrü Boyunca **10 Yıllık Elektrik Kazancı**:</span>
          <span className="fw-bold text-success font-monospace" style={{ fontSize: "14px" }}>
            {Math.round(tenYearsSaving).toLocaleString()} € / 10 yıl
          </span>
        </div>

        <div className="d-flex justify-content-center flex-column align-items-center p-3 rounded-2 mt-1" style={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="text-white-50 mb-1 fw-medium text-center" style={{ fontSize: "12px", letterSpacing: "0.5px" }}>
            Blower, Difüzör Yenileme ve Bakım Maliyetleri Dahil **Yaklaşık Toplam Tasarruf**
          </span>
          <span className="fw-extrabold text-success font-monospace text-center" style={{ fontSize: "32px", letterSpacing: "1px" }}>
            ~ {Math.round(totalGainWithMaintenance / 10000) * 10000} €
          </span>
        </div>

      </div>

    </div>
  );
}

export default EnerjiKarsilastirmaTablosu;