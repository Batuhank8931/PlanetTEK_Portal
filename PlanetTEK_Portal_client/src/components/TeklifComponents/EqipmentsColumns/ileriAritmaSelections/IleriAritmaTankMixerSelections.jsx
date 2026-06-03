import React, { useEffect, useMemo } from "react";
import { useTeklifStore } from "../../../../utils/teklifStore"; // Store yolunu kontrol edin

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
  const HRT_HOURS = 2; // Hidrolik bekletme süresi (2 saat)
  const POWER_DENSITY = 10; // 10 W/m³ güç yoğunluğu
  const MIXER_RPM = 400; // Standart anoksik karıştırıcı pervane devri

  // Standart piyasa motor güçleri (kW)
  const commercialMotorPowers = [0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3.0, 4.0, 5.5, 7.5];

  // 2. SAF DİNAMİK MÜHENDİSLİK HESAPLAMALARI
  const hesaplananDegerler = useMemo(() => {
    if (debi <= 0) {
      return { tankHacmi: 0, hamGucKw: 0, secilenGucKw: 0, gucHp: 0, mikserMetni: "---", tankMetni: "---" };
    }

    // 1. Tank Hacmi (m³) = (Q * HRT) / 24
    const tankHacmi = (debi * HRT_HOURS) / 24;

    // 2. Ham Güç İhtiyacı (kW) = (Hacim * Power Density) / 1000
    const hamGucKw = (tankHacmi * POWER_DENSITY) / 1000;

    // 3. Standart Motor Gücüne Yukarı Yuvarlama
    const secilenGucKw = commercialMotorPowers.find((p) => p >= hamGucKw) || commercialMotorPowers[commercialMotorPowers.length - 1];

    // 4. kW -> HP Dönüşümü
    const gucHp = secilenGucKw * 1.341;

    // Teklif çıktı metinleri
    const tankMetni = `${tankHacmi.toFixed(1)} m³ Anoksik Tank Hacmi (${HRT_HOURS} Saat HRT)`;
    const mikserMetni = `1 Adet Dalgıç Mikser (${secilenGucKw.toFixed(2)} kW / ${gucHp.toFixed(2)} HP, ${MIXER_RPM} RPM)`;

    return {
      tankHacmi,
      hamGucKw,
      secilenGucKw,
      gucHp,
      tankMetni,
      mikserMetni,
    };
  }, [debi]);

  // 3. STORE SENKRONİZASYON EFFECT'İ (Kardeş elemanları spread ile korur)
  useEffect(() => {
    if (debi > 0) {
      if (
        storeMixerSelections.anoksikTankHacmi !== hesaplananDegerler.tankHacmi ||
        storeMixerSelections.secilenMikserMetni !== hesaplananDegerler.mikserMetni
      ) {
        updateSection("equipments", {
          ...equipmentsCache, // Üst düğümleri koru
          ileriAritma: {
            ...storeIleriAritma, // Giriş, Pompa ve Dozaj seçimlerini koru!
            IleriAritmaTankMixerSelections: {
              anoksikTankHacmi: hesaplananDegerler.tankHacmi,
              gerekliGucKw: hesaplananDegerler.secilenGucKw,
              gerekliGucHp: hesaplananDegerler.gucHp,
              mikserRpm: MIXER_RPM,
              secilenTankMetni: hesaplananDegerler.tankMetni,
              secilenMikserMetni: hesaplananDegerler.mikserMetni,
            },
          },
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hesaplananDegerler]);

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
        {/* Anoksik Tank Hacmi */}
        <div className="col-md-6">
          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Hesaplanan Tank Hacmi:</span>
            <span className="fw-bold text-info" style={{ fontSize: "11px" }}>
              {hesaplananDegerler.tankHacmi.toFixed(1)} <span style={{ fontSize: "9px" }}>m³</span>
            </span>
          </div>
        </div>

        {/* Bekletme Süresi Bilgisi */}
        <div className="col-md-6">
          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Tasarım Bekletme Süresi (HRT):</span>
            <span className="fw-bold text-white-50" style={{ fontSize: "11px" }}>
              {HRT_HOURS} <span style={{ fontSize: "9px" }}>Saat</span>
            </span>
          </div>
        </div>

        {/* Seçilen Mikser Motor Gücü */}
        <div className="col-md-6">
          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0f172a", border: "1px solid #00874e" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Gerekli Mikser Gücü (Standart):</span>
            <span className="fw-bold text-success" style={{ fontSize: "11px" }}>
              {hesaplananDegerler.secilenGucKw.toFixed(2)} <span style={{ fontSize: "9px" }}>kW</span>
              <span className="text-white-50 ms-1" style={{ fontSize: "10px" }}>({hesaplananDegerler.gucHp.toFixed(2)} HP)</span>
            </span>
          </div>
        </div>

        {/* Mikser Devri RPM */}
        <div className="col-md-6">
          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0f172a", border: "1px solid #ef4444" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Mikser Karıştırıcı Devri:</span>
            <span className="fw-bold text-danger" style={{ fontSize: "11px" }}>
              {MIXER_RPM} <span style={{ fontSize: "9px" }}>RPM</span>
            </span>
          </div>
        </div>
      </div>

      {/* Özet Görünüm Şeridi */}
      {debi > 0 && (
        <div className="p-2 rounded mt-1" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", borderLeft: "3px solid #10b981", fontSize: "11px" }}>
          <div className="text-white-50" style={{ fontSize: "9px", fontWeight: "bold" }}>SİSTEME EKLENECEK EKİPMAN ÖZETLERİ</div>
          <div className="text-white fw-medium mt-0.5">• {hesaplananDegerler.tankMetni}</div>
          <div className="text-warning fw-medium">• {hesaplananDegerler.mikserMetni}</div>
        </div>
      )}
    </div>
  );
}

export default IleriAritmaTankMixerSelections;