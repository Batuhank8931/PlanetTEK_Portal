import React, { useEffect, useMemo, useState } from "react";
import { useTeklifStore } from "../../../../utils/teklifStore";
import API from "../../../../utils/utilRequest";

function IleriAritmaTankMixerSelections({ geriDevirDebisi = 0 }) {
  // 1. STATE TANIMLAMALARI
  const [apiMixers, setApiMixers] = useState([]);
  const [loading, setLoading] = useState(false);

  // 2. ZUSTAND STORE BAĞLANTISI
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const debi = parseFloat(formData.planetDiskDetails?.debi) || 0;

  const equipmentsCache = formData.equipments || {};
  const storeIleriAritma = equipmentsCache.ileriAritma || {};
  const storeMixerSelections = storeIleriAritma.IleriAritmaTankMixerSelections || {};

  // Sabit Tasarım Kriterleri
  const POWER_DENSITY = 10; // 10 W/m³ güç yoğunluğu
  const DEFAULT_HRT = "4";   // Varsayılan HRT 4 Saat

  // API'den mikserleri çekme işlemi
  const fetchMixersData = async () => {
    try {
      setLoading(true);
      const response = await API.getIlerAritmaEquipmentsCosts();
      const allEquipments = response.data || [];
      setApiMixers(allEquipments.filter(e => e.ekipman_tipi === "mikser"));
    } catch (error) {
      console.error("Mikser verileri yüklenirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMixersData();
  }, []);

  // --- MANUEL USER CONTROL & MÜHÜR MANTIĞI ---
  const lastCalculatedDebi = storeMixerSelections.calculatedDebi !== undefined ? storeMixerSelections.calculatedDebi : null;
  const isDebiChanged = lastCalculatedDebi !== null && lastCalculatedDebi !== debi;

  const manualHrtHours = (storeMixerSelections.manualHrtHours !== undefined && !isDebiChanged)
    ? storeMixerSelections.manualHrtHours
    : DEFAULT_HRT;

  const activeHrtHours = useMemo(() => {
    const val = parseFloat(manualHrtHours);
    return isNaN(val) || val <= 0 ? 4 : val;
  }, [manualHrtHours]);

  // 3. PROP OLARAK GELEN GERİ DEVİR DEBİSİ İLE TANK HACMİ VE MİKSER HESABI
  const hesaplananDegerler = useMemo(() => {
    if (geriDevirDebisi <= 0) {
      return { tankHacmi: 0, hamGucKw: 0, otomatikMikserId: "", otomatikKw: 0, otomatikHp: 0, otomatikRpm: 400 };
    }

    // FORMÜL: Tank Hacmi (m³) = Geri Devir Debisi (m³/h) × HRT (Saat)
    const tankHacmi = geriDevirDebisi * activeHrtHours;
    const hamGucKw = (tankHacmi * POWER_DENSITY) / 1000;

    let otomatikMikser = null;
    if (apiMixers.length > 0) {
      const sortedMixers = [...apiMixers].sort((a, b) => (parseFloat(a.kw) || 0) - (parseFloat(b.kw) || 0));
      otomatikMikser = sortedMixers.find(m => (parseFloat(m.kw) || 0) >= hamGucKw);
      
      if (!otomatikMikser) {
        otomatikMikser = sortedMixers[sortedMixers.length - 1];
      }
    }

    const otomatikKw = otomatikMikser ? (parseFloat(otomatikMikser.kw) || 0) : 0.37;
    const otomatikHp = otomatikKw * 1.341;
    const otomatikRpm = otomatikMikser ? (parseInt(otomatikMikser.ekipman_adi.match(/(\d+)\s*RPM/)?.[1], 10) || 400) : 400;

    return {
      tankHacmi,
      hamGucKw,
      otomatikMikserId: otomatikMikser ? String(otomatikMikser.id) : "",
      otomatikKw,
      otomatikHp,
      otomatikRpm
    };
  }, [geriDevirDebisi, activeHrtHours, apiMixers]);

  // 4. OTOMATİK İLK YÜKLEME VE DEBİ DEĞİŞİM SENKRONİZASYONU
  useEffect(() => {
    if (geriDevirDebisi > 0 && apiMixers.length > 0) {
      const asilMikserId = (storeMixerSelections.secilenMikserId === undefined || isDebiChanged)
        ? hesaplananDegerler.otomatikMikserId 
        : String(storeMixerSelections.secilenMikserId);

      const secilenMikserObj = apiMixers.find(m => String(m.id) === asilMikserId);

      const currentTankHacmi = isDebiChanged ? hesaplananDegerler.tankHacmi : (storeMixerSelections.anoksikTankHacmi ?? hesaplananDegerler.tankHacmi);
      const currentHrt = isDebiChanged ? DEFAULT_HRT : manualHrtHours;
      
      const currentKw = secilenMikserObj ? (parseFloat(secilenMikserObj.kw) || 0) : hesaplananDegerler.otomatikKw;
      const currentHp = currentKw * 1.341;
      const currentRpm = secilenMikserObj ? (parseInt(secilenMikserObj.ekipman_adi.match(/(\d+)\s*RPM/)?.[1], 10) || 400) : hesaplananDegerler.otomatikRpm;

      const tankMetniString = `${Number(currentTankHacmi).toFixed(2)} m³ Anoksik Tank Hacmi (${Number(currentHrt).toFixed(2)} Saat HRT)`;
      const mikserMetniString = secilenMikserObj 
        ? `1 Adet ${secilenMikserObj.ekipman_adi}`
        : `1 Adet Dalgıç Mikser (${currentKw.toFixed(2)} kW)`;

      if (
        storeMixerSelections.anoksikTankHacmi !== currentTankHacmi ||
        storeMixerSelections.secilenMikserId !== asilMikserId ||
        storeMixerSelections.secilenMikserMetni !== mikserMetniString ||
        storeMixerSelections.anoksikTankHacmi === undefined ||
        isDebiChanged
      ) {
        updateSection("equipments", {
          ...equipmentsCache,
          ileriAritma: {
            ...storeIleriAritma,
            IleriAritmaTankMixerSelections: {
              manualHrtHours: currentHrt,
              anoksikTankHacmi: currentTankHacmi,
              gerekliGucKw: currentKw,
              gerekliGucHp: currentHp,
              mikserRpm: currentRpm,
              secilenMikserId: asilMikserId,
              secilenTankMetni: tankMetniString,
              secilenMikserMetni: mikserMetniString,
              mikserBirimFiyat: secilenMikserObj?.alis_fiyati || 0,
              calculatedDebi: debi
            },
          },
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hesaplananDegerler, geriDevirDebisi, debi, isDebiChanged, apiMixers]);

  // 5. MANUEL DROPDOWN VE INPUT YÖNETİMİ
  const handleInputChange = (field, value) => {
    let nextState = { ...storeMixerSelections };

    if (field === "secilenMikserId") {
      const targetId = value === "" ? "" : String(value);
      const secilenMikserObj = apiMixers.find(m => String(m.id) === targetId);

      if (secilenMikserObj) {
        const kw = parseFloat(secilenMikserObj.kw) || 0;
        const hp = kw * 1.341;
        const rpm = parseInt(secilenMikserObj.ekipman_adi.match(/(\d+)\s*RPM/)?.[1], 10) || 400;

        nextState = {
          ...nextState,
          secilenMikserId: targetId,
          gerekliGucKw: kw,
          gerekliGucHp: hp,
          mikserRpm: rpm,
          secilenMikserMetni: `1 Adet ${secilenMikserObj.ekipman_adi}`,
          mikserBirimFiyat: secilenMikserObj.alis_fiyati || 0
        };
      } else {
        nextState.secilenMikserId = targetId;
      }
    } else {
      const numValue = value === "" ? "" : parseFloat(value) || 0;
      nextState[field] = numValue;

      if (field === "manualHrtHours" && numValue > 0) {
        const yeniHacim = geriDevirDebisi * numValue;
        nextState.anoksikTankHacmi = yeniHacim;
        nextState.secilenTankMetni = `${yeniHacim.toFixed(2)} m³ Anoksik Tank Hacmi (${Number(numValue).toFixed(2)} Saat HRT)`;
      }
    }

    updateSection("equipments", {
      ...equipmentsCache,
      ileriAritma: {
        ...storeIleriAritma,
        IleriAritmaTankMixerSelections: {
          ...nextState,
          calculatedDebi: debi
        }
      }
    });
  };

  const inputStyle = {
    background: "transparent",
    border: "none",
    color: "inherit",
    fontWeight: "bold",
    fontSize: "11px",
    textAlign: "right",
    width: "75px",
    outline: "none",
    padding: 0
  };

  const selectStyle = {
    background: "#0f172a",
    border: "1px solid #334155",
    color: "#fff",
    fontSize: "11px",
    borderRadius: "4px",
    padding: "2px 5px",
    outline: "none",
    maxWidth: "210px"
  };

  const formatValue = (storeVal, calcVal, isInt = false) => {
    const val = storeVal ?? calcVal;
    if (val === undefined || val === "") return "";
    return isInt ? parseInt(val, 10).toString() : Number(val).toFixed(2);
  };

  if (loading) return <div className="text-white-50" style={{ fontSize: '11px' }}>Mikser verileri yükleniyor...</div>;

  return (
    <div className="card-body d-flex flex-column gap-3 py-3" style={{ position: "relative", color: "#fff", padding: 0 }}>
      {/* BAŞLIK BÖLÜMÜ */}
      <div className="d-flex align-items-center flex-grow-1">
        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
          3. Anoksik Tank & Mikser Seçimi
        </span>
        <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
      </div>

      {/* SONUÇ KARTLARI PANELİ */}
      <div className="row g-2">
        {/* 1. HESAPLANAN TANK HACMİ INPUT */}
        <div className="col-md-6">
          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Hesaplanan Tank Hacmi:</span>
            <div className="d-flex align-items-center gap-1 text-info">
              <input
                type="number"
                step="0.01"
                style={{ ...inputStyle, color: "#0dcaf0" }}
                value={formatValue(storeMixerSelections.anoksikTankHacmi, hesaplananDegerler.tankHacmi)}
                onChange={(e) => handleInputChange("anoksikTankHacmi", e.target.value)}
              />
              <span style={{ fontSize: "9px" }}>m³</span>
            </div>
          </div>
        </div>

        {/* 2. TASARIM BEKLETME SÜRESİ (HRT) INPUT */}
        <div className="col-md-6">
          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Tasarım Bekletme Süresi (HRT):</span>
            <div className="d-flex align-items-center gap-1 text-warning">
              <input
                type="number"
                step="0.01"
                style={{ ...inputStyle, color: "#f59e0b" }}
                value={formatValue(storeMixerSelections.manualHrtHours, manualHrtHours)}
                onChange={(e) => handleInputChange("manualHrtHours", e.target.value)}
              />
              <span className="text-white-50" style={{ fontSize: "9px" }}>Saat</span>
            </div>
          </div>
        </div>

        {/* 3. MİKSER SEÇİM DROPDOWN */}
        <div className="col-md-6">
          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0f172a", border: "1px solid #00874e" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Mikser Ekipmanı Seçimi:</span>
            <select
              style={selectStyle}
              value={storeMixerSelections.secilenMikserId || hesaplananDegerler.otomatikMikserId || ""}
              onChange={(e) => handleInputChange("secilenMikserId", e.target.value)}
            >
              {apiMixers.map(mixer => (
                <option key={mixer.id} value={String(mixer.id)}>
                  {mixer.ekipman_adi} ({mixer.kw} kW)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. DİNAMİK GÜÇ VE DEVRİ GÖSTEREN BİLGİ ALANI */}
        <div className="col-md-6">
          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0f172a", border: "1px solid #ef4444" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Seçilen Mikser Detayları:</span>
            <span className="text-danger fw-bold" style={{ fontSize: "11px" }}>
              {formatValue(storeMixerSelections.gerekliGucKw, hesaplananDegerler.otomatikKw)} kW / {formatValue(storeMixerSelections.gerekliGucHp, hesaplananDegerler.otomatikHp)} HP @ {formatValue(storeMixerSelections.mikserRpm, hesaplananDegerler.otomatikRpm, true)} RPM
            </span>
          </div>
        </div>
      </div>

      {/* Özet Görünüm Şeridi */}
      {(debi > 0 || geriDevirDebisi > 0) && (
        <div className="p-2 rounded mt-1" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", borderLeft: "3px solid #10b981", fontSize: "11px" }}>
          <div className="text-white-50" style={{ fontSize: "9px", fontWeight: "bold" }}>SİSTEME EKLENECEK EKİPMAN ÖZETLERİ</div>
          <div className="text-white fw-medium mt-0.5">
            • {formatValue(storeMixerSelections.anoksikTankHacmi, hesaplananDegerler.tankHacmi)} m³ Anoksik Tank Hacmi ({formatValue(storeMixerSelections.manualHrtHours, manualHrtHours)} Saat HRT)
          </div>
          <div className="text-warning fw-medium">
            • {storeMixerSelections.secilenMikserMetni || "Mikser Seçilmedi"}
          </div>
        </div>
      )}
    </div>
  );
}

export default IleriAritmaTankMixerSelections;