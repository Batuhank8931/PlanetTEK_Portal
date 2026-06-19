import React, { useEffect, useMemo } from "react";
import { useTeklifStore } from "../../../../utils/teklifStore";

function IleriAritmaTankMixerSelections() {
  // 1. ZUSTAND STORE BAĞLANTISI
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  // Kök debi bilgisi (m3/gün)
  const debi = parseFloat(formData.planetDiskDetails?.debi) || 0;

  const equipmentsCache = formData.equipments || {};
  const storeIleriAritma = equipmentsCache.ileriAritma || {};
  const storeMixerSelections = storeIleriAritma.IleriAritmaTankMixerSelections || {};

  // Sabit Tasarım Kriterleri
  const POWER_DENSITY = 10; // 10 W/m³ güç yoğunluğu
  const MIXER_RPM = 400; // Standart anoksik karıştırıcı pervane devri
  const commercialMotorPowers = [0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3.0, 4.0, 5.5, 7.5];

  // --- MANUEL USER CONTROL & MÜHÜR MANTIĞI ---
  const DEFAULT_HRT = "2";
  const lastCalculatedDebi = storeMixerSelections.calculatedDebi !== undefined ? storeMixerSelections.calculatedDebi : null;
  const isDebiChanged = lastCalculatedDebi !== null && lastCalculatedDebi !== debi;

  // Eğer dışarıdan gelen ana debi değiştiyse default değere (2) dön, değişmediyse store'daki güncel input değerini oku
  const manualHrtHours = (storeMixerSelections.manualHrtHours !== undefined && !isDebiChanged)
    ? storeMixerSelections.manualHrtHours
    : DEFAULT_HRT;

  const activeHrtHours = useMemo(() => {
    const val = parseFloat(manualHrtHours);
    return isNaN(val) || val <= 0 ? 2 : val; // Güvenli fallback olarak 2 saat
  }, [manualHrtHours]);

  // 2. SAF DİNAMİK MÜHENDİSLİK HESAPLAMALARI
  const hesaplananDegerler = useMemo(() => {
    if (debi <= 0) {
      return { tankHacmi: 0, hamGucKw: 0, secilenGucKw: 0, gucHp: 0, mikserMetni: "---", tankMetni: "---" };
    }

    // 1. Tank Hacmi (m³) = (Q * HRT) / 24
    const tankHacmi = (debi * activeHrtHours) / 24;

    // 2. Ham Güç İhtiyacı (kW) = (Hacim * Power Density) / 1000
    const hamGucKw = (tankHacmi * POWER_DENSITY) / 1000;

    // 3. Standart Motor Gücüne Yukarı Yuvarlama
    const secilenGucKw = commercialMotorPowers.find((p) => p >= hamGucKw) || commercialMotorPowers[commercialMotorPowers.length - 1];

    // 4. kW -> HP Dönüşümü
    const gucHp = secilenGucKw * 1.341;

    // Teklif çıktı metinleri (Varsayılan dinamik metinler)
    const tankMetni = `${tankHacmi.toFixed(2)} m³ Anoksik Tank Hacmi (${Number(activeHrtHours).toFixed(2)} Saat HRT)`;
    const mikserMetni = `1 Adet Dalgıç Mikser (${secilenGucKw.toFixed(2)} kW / ${gucHp.toFixed(2)} HP, ${MIXER_RPM} RPM)`;

    return {
      tankHacmi,
      hamGucKw,
      secilenGucKw,
      gucHp,
      tankMetni,
      mikserMetni,
    };
  }, [debi, activeHrtHours]);

  // 3. STORE SENKRONİZASYON EFFECT'İ
  useEffect(() => {
    if (debi > 0) {
      // Store'da var olan veya anlık olarak elle/otomatik üretilen güncel değerleri süzüyoruz
      const currentTankHacmi = storeMixerSelections.anoksikTankHacmi ?? hesaplananDegerler.tankHacmi;
      const currentHrt = storeMixerSelections.manualHrtHours ?? manualHrtHours;
      const currentKw = storeMixerSelections.gerekliGucKw ?? hesaplananDegerler.secilenGucKw;
      const currentHp = storeMixerSelections.gerekliGucHp ?? hesaplananDegerler.gucHp;
      const currentRpm = storeMixerSelections.mikserRpm ?? MIXER_RPM;

      const tankMetniString = `${Number(currentTankHacmi).toFixed(2)} m³ Anoksik Tank Hacmi (${Number(currentHrt).toFixed(2)} Saat HRT)`;
      const mikserMetniString = `1 Adet Dalgıç Mikser (${Number(currentKw).toFixed(2)} kW / ${Number(currentHp).toFixed(2)} HP, ${parseInt(currentRpm, 10)} RPM)`;

      if (
        storeMixerSelections.anoksikTankHacmi !== currentTankHacmi ||
        storeMixerSelections.secilenMikserMetni !== mikserMetniString ||
        storeMixerSelections.anoksikTankHacmi === undefined || // İlk yüklenme kontrolü
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
              secilenTankMetni: tankMetniString,
              secilenMikserMetni: mikserMetniString,
              calculatedDebi: debi
            },
          },
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hesaplananDegerler, debi, isDebiChanged]);

  // Manuel Input Değişim Yönetimi
  const handleInputChange = (field, value) => {
    // RPM tamsayı, diğerleri float dönüşümü
    let numValue = value === "" ? "" : (field === "mikserRpm" ? parseInt(value, 10) : parseFloat(value)) || 0;

    // Eğer kW değiştiyse HP'yi de otomatik güncelle
    let ekAlanlar = {};
    if (field === "gerekliGucKw" && numValue !== "") {
      ekAlanlar.gerekliGucHp = numValue * 1.341;
    }

    updateSection("equipments", {
      ...equipmentsCache,
      ileriAritma: {
        ...storeIleriAritma,
        IleriAritmaTankMixerSelections: {
          ...storeMixerSelections,
          [field]: numValue,
          ...ekAlanlar,
          calculatedDebi: debi
        }
      }
    });
  };

  // Ortak şeffaf input stili
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

  // Değerleri formatlayan yardımcı fonksiyon
  const formatValue = (storeVal, calcVal, isInt = false) => {
    const val = storeVal ?? calcVal;
    if (val === undefined || val === "") return "";
    return isInt ? parseInt(val, 10).toString() : Number(val).toFixed(2);
  };

  return (
    <div className="card-body d-flex flex-column gap-3 pt-3" style={{ position: "relative", color: "#fff", padding: 0 }}>
      {/* BAŞLIK BÖLÜMÜ */}
      <div className="d-flex align-items-center flex-grow-1">
        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
          4. Anoksik Tank & Mikser Seçimi
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

        {/* 3. GEREKLİ MİKSER GÜCÜ (kW / HP) INPUT */}
        <div className="col-md-6">
          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0f172a", border: "1px solid #00874e" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Gerekli Mikser Gücü (Standart):</span>
            <div className="d-flex align-items-center gap-1 text-success">
              <input
                type="number"
                step="0.01"
                style={{ ...inputStyle, color: "#198754", width: "55px" }}
                value={formatValue(storeMixerSelections.gerekliGucKw, hesaplananDegerler.secilenGucKw)}
                onChange={(e) => handleInputChange("gerekliGucKw", e.target.value)}
              />
              <span style={{ fontSize: "9px" }}>kW</span>
              <span className="text-white-50 ms-1" style={{ fontSize: "10px", whiteSpace: "nowrap" }}>
                ({formatValue(storeMixerSelections.gerekliGucHp, hesaplananDegerler.gucHp)} HP)
              </span>
            </div>
          </div>
        </div>

        {/* 4. MİKSER KARIŞTIRICI DEVRİ (RPM) INPUT - TAMSAYI */}
        <div className="col-md-6">
          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0f172a", border: "1px solid #ef4444" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Mikser Karıştırıcı Devri:</span>
            <div className="d-flex align-items-center gap-1 text-danger">
              <input
                type="number"
                step="1"
                style={{ ...inputStyle, color: "#dc3545" }}
                value={formatValue(storeMixerSelections.mikserRpm, MIXER_RPM, true)}
                onChange={(e) => handleInputChange("mikserRpm", e.target.value)}
              />
              <span style={{ fontSize: "9px" }}>RPM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Özet Görünüm Şeridi (İçerikler anlık store'daki inputlara göre senkronize üretilir) */}
      {debi > 0 && (
        <div className="p-2 rounded mt-1" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", borderLeft: "3px solid #10b981", fontSize: "11px" }}>
          <div className="text-white-50" style={{ fontSize: "9px", fontWeight: "bold" }}>SİSTEME EKLENECEK EKİPMAN ÖZETLERİ</div>
          <div className="text-white fw-medium mt-0.5">
            • {formatValue(storeMixerSelections.anoksikTankHacmi, hesaplananDegerler.tankHacmi)} m³ Anoksik Tank Hacmi ({formatValue(storeMixerSelections.manualHrtHours, manualHrtHours)} Saat HRT)
          </div>
          <div className="text-warning fw-medium">
            • 1 Adet Dalgıç Mikser ({formatValue(storeMixerSelections.gerekliGucKw, hesaplananDegerler.secilenGucKw)} kW / {formatValue(storeMixerSelections.gerekliGucHp, hesaplananDegerler.gucHp)} HP, {formatValue(storeMixerSelections.mikserRpm, MIXER_RPM, true)} RPM)
          </div>
        </div>
      )}
    </div>
  );
}

export default IleriAritmaTankMixerSelections;