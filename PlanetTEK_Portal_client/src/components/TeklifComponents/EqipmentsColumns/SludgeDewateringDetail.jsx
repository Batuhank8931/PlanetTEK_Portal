import React, { useEffect, useState, useMemo } from "react";
import { useTeklifStore } from "../../../utils/teklifStore";
import API from "../../../utils/utilRequest";

const SABIT_EKIPMAN_TIPI = ["dekantor", "filtrepres", "besleme_pompasi", "suzuntu_pompasi"];

function SludgeDewateringDetail() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const equipmentsCache = formData.equipments || {};
  const storeDewatering = equipmentsCache.sludgeDewatering || {};

  const [dbData, setDbData] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);

  const [hesapParametreleri, setHesapParametreleri] = useState(storeDewatering.hesapParametreleri || {
    dekantorCalismaSaati: 20.0,
    filtrepresKatiMaddeYuzdesi: 30.0,
    sarjAdedi: 3.0
  });

  const [secilenEkipmanTipi, setSecilenEkipmanTipi] = useState(storeDewatering.ekipmanTipi || "Dekantör");

  const [anaOffset, setAnaOffset] = useState(storeDewatering.anaOffset || 0);
  const [beslemeOffset, setBeslemeOffset] = useState(storeDewatering.beslemeOffset || 0);
  const [suzuntuOffset, setSuzuntuOffset] = useState(storeDewatering.suzuntuOffset || 0);

  useEffect(() => {
    const fetchDewateringData = async () => {
      try {
        setDbLoading(true);
        const response = await API.getSludgeDewateringCosts();
        setDbData(response.data || []);
      } catch (error) {
        console.error("Çamur susuzlaştırma verileri yüklenirken hata oluştu:", error);
      } finally {
        setDbLoading(false);
      }
    };
    fetchDewateringData();
  }, []);

  const { ekipmanGruplari, opsiyonelTipler } = useMemo(() => {
    const gruplar = {};
    if (dbData.length === 0) return { ekipmanGruplari: {}, opsiyonelTipler: [] };

    dbData.forEach((eq) => {
      if (!gruplar[eq.ekipman_tipi]) gruplar[eq.ekipman_tipi] = [];
      gruplar[eq.ekipman_tipi].push(eq);
    });
    const opsiyoneller = Object.keys(gruplar).filter((tip) => !SABIT_EKIPMAN_TIPI.includes(tip));
    return { ekipmanGruplari: gruplar, opsiyonelTipler: opsiyoneller };
  }, [dbData]);

  const [opsiyonlar, setOpsiyonlar] = useState({});

  useEffect(() => {
    if (dbLoading || dbData.length === 0) return;

    // Eğer store'da eski veri varsa veya yeni yapıda polimerUnitesi ayrılmışsa state senkronizasyonu
    if ((storeDewatering.opsiyonlar && Object.keys(storeDewatering.opsiyonlar).length > 0) || storeDewatering.polimerUnitesi) {
      const restoreOpsiyonlar = { ...storeDewatering.opsiyonlar };
      if (storeDewatering.polimerUnitesi) {
        restoreOpsiyonlar["polimer_unitesi"] = storeDewatering.polimerUnitesi;
      }
      setOpsiyonlar(restoreOpsiyonlar);
      return;
    }

    const baslangicOpsiyonlari = {};
    opsiyonelTipler.forEach((tip) => {
      const ilkModel = ekipmanGruplari[tip]?.[0];
      const varsayilanSecili = tip === "polimer_unitesi";
      baslangicOpsiyonlari[tip] = { 
        secili: varsayilanSecili, 
        id: ilkModel ? ilkModel.id : "",
        adet: 1 
      };
    });
    setOpsiyonlar(baslangicOpsiyonlari);
  }, [dbLoading, dbData, opsiyonelTipler, ekipmanGruplari]);

  const { debi, boi } = useMemo(() => {
    const d = parseFloat(formData.planetDiskDetails?.debi) || 70;
    const b = parseFloat(formData.planetDiskDetails?.tasarim?.aritmaParametreleri?.girisBoi) || 350;
    return { debi: d, boi: b };
  }, [formData]);

  const otomatikKonfigurasyon = useMemo(() => {
    if (dbLoading || dbData.length === 0 || Object.keys(ekipmanGruplari).length === 0) {
      return { ana: null, besleme: null, suzuntu: null, idealAnaIndex: -1, idealBeslemeIndex: -1, idealSuzuntuIndex: -1, hamIhtiyac: 0, birim: "" };
    }

    let hesaplananIhtiyac = 0;
    let birim = "";
    let tipKey = secilenEkipmanTipi === "Dekantör" ? "dekantor" : "filtrepres";

    const akm = boi;
    const calismaSaati = parseFloat(hesapParametreleri.dekantorCalismaSaati || 1);
    const katiMaddeYuzdesi = parseFloat(hesapParametreleri.filtrepresKatiMaddeYuzdesi || 1);
    const sarjAdedi = parseFloat(hesapParametreleri.sarjAdedi || 1);

    const onCokturmeCamuruKutle = (debi * akm) / 1000;
    const sonCokturmeCamuruKutle = ((debi * boi) / 1000) * 0.5;

    if (tipKey === "dekantor") {
      birim = "m3/saat";
      const onCokturmeCamuruHacim = onCokturmeCamuruKutle / 20;
      const sonCokturmeCamuruHacim = sonCokturmeCamuruKutle / 10;
      const toplamCamurHacmi = onCokturmeCamuruHacim + sonCokturmeCamuruHacim;
      hesaplananIhtiyac = toplamCamurHacmi / calismaSaati;
    } else {
      birim = "Lt/sarj";
      const toplamCamurKutle = onCokturmeCamuruKutle + sonCokturmeCamuruKutle;
      const tekSarjCamurKutle = toplamCamurKutle / sarjAdedi;
      hesaplananIhtiyac = tekSarjCamurKutle / katiMaddeYuzdesi;
    }

    let hamIhtiyacFormatli = parseFloat(hesaplananIhtiyac.toFixed(3));
    let aramaKapasitesi = hamIhtiyacFormatli;
    if (tipKey === "filtrepres" && aramaKapasitesi < 1 && aramaKapasitesi > 0) {
      aramaKapasitesi = 1.00;
    }

    const anaModeller = ekipmanGruplari[tipKey] || [];
    const idealAnaIndex = anaModeller.findIndex((e) => parseFloat(e.kapasite_degeri) >= aramaKapasitesi);
    let finalAnaIndex = idealAnaIndex !== -1 ? idealAnaIndex : anaModeller.length - 1;

    if (idealAnaIndex !== -1 && anaOffset !== 0) {
      finalAnaIndex = idealAnaIndex + anaOffset;
      if (finalAnaIndex < 0) finalAnaIndex = 0;
      if (finalAnaIndex >= anaModeller.length) finalAnaIndex = anaModeller.length - 1;
    }
    const secilenAna = anaModeller[finalAnaIndex] || null;

    const pompaReferansDebi = ((onCokturmeCamuruKutle / 20) + (sonCokturmeCamuruKutle / 10)) / calismaSaati;

    const beslemePompalari = ekipmanGruplari["besleme_pompasi"] || [];
    const idealBeslemeIndex = beslemePompalari.findIndex((e) => parseFloat(e.kapasite_degeri) >= pompaReferansDebi);
    let finalBeslemeIndex = idealBeslemeIndex !== -1 ? idealBeslemeIndex : beslemePompalari.length - 1;

    if (idealBeslemeIndex !== -1 && beslemeOffset !== 0) {
      finalBeslemeIndex = idealBeslemeIndex + beslemeOffset;
      if (finalBeslemeIndex < 0) finalBeslemeIndex = 0;
      if (finalBeslemeIndex >= beslemePompalari.length) finalBeslemeIndex = beslemePompalari.length - 1;
    }
    const secilenBesleme = beslemePompalari[finalBeslemeIndex] || null;

    const suzuntuPompalari = ekipmanGruplari["suzuntu_pompasi"] || [];
    const idealSuzuntuIndex = suzuntuPompalari.findIndex((e) => parseFloat(e.kapasite_degeri) >= pompaReferansDebi * 0.9);
    let finalSuzuntuIndex = idealSuzuntuIndex !== -1 ? idealSuzuntuIndex : suzuntuPompalari.length - 1;

    if (idealSuzuntuIndex !== -1 && suzuntuOffset !== 0) {
      finalSuzuntuIndex = idealSuzuntuIndex + suzuntuOffset;
      if (finalSuzuntuIndex < 0) finalSuzuntuIndex = 0;
      if (finalSuzuntuIndex >= suzuntuPompalari.length) finalSuzuntuIndex = suzuntuPompalari.length - 1;
    }
    const secilenSuzuntu = suzuntuPompalari[finalSuzuntuIndex] || null;

    return {
      ana: secilenAna,
      besleme: secilenBesleme,
      suzuntu: secilenSuzuntu,
      idealAnaIndex,
      idealBeslemeIndex,
      idealSuzuntuIndex,
      hamIhtiyac: hamIhtiyacFormatli,
      birim: birim
    };
  }, [debi, boi, secilenEkipmanTipi, ekipmanGruplari, hesapParametreleri, dbLoading, dbData, anaOffset, beslemeOffset, suzuntuOffset]);

  useEffect(() => {
    setAnaOffset(0);
  }, [secilenEkipmanTipi]);

  // 🚀 STORE UPDATE MOTORU (YENİLENEN MODEL)
  useEffect(() => {
    if (dbLoading || dbData.length === 0) return;

    const temizleEkipman = (ekipmanObj) => {
      if (!ekipmanObj) return null;
      const { id, ekipman_tipi, kapasite_degeri, kapasite_birimi, besleme_kw, geri_yikama_kw } = ekipmanObj;
      return {
        id,
        ekipman_tipi,
        kapasite_degeri,
        kapasite_birimi,
        ...(besleme_kw && { besleme_kw }),
        ...(geri_yikama_kw && { geri_yikama_kw })
      };
    };

    // 🚀 Polimer Ünitesini opsiyonlar içinden ayırıyoruz
    const { polimer_unitesi, ...gercekOpsiyonlar } = opsiyonlar;

    updateSection("equipments", {
      ...equipmentsCache,
      sludgeDewatering: {
        ekipmanTipi: secilenEkipmanTipi,
        hesapParametreleri,
        anaEkipman: temizleEkipman(otomatikKonfigurasyon.ana),
        beslemePompasi: temizleEkipman(otomatikKonfigurasyon.besleme),
        suzuntuPompasi: temizleEkipman(otomatikKonfigurasyon.suzuntu),
        anaOffset,
        beslemeOffset,
        suzuntuOffset,
        polimerUnitesi: polimer_unitesi || null, // 🚀 Doğrudan kök obje seviyesinde
        opsiyonlar: gercekOpsiyonlar,          // 🚀 İçinde polimer_unitesi barındırmayan saf opsiyonlar
        gerekliIhtiyac: otomatikKonfigurasyon.hamIhtiyac,
      },
    });
  }, [secilenEkipmanTipi, hesapParametreleri, otomatikKonfigurasyon, opsiyonlar, dbLoading, dbData, anaOffset, beslemeOffset, suzuntuOffset]);

  const handleParametreChange = (key, value) => {
    setHesapParametreleri((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpsiyonChange = (tip, field, value) => {
    setOpsiyonlar((prev) => ({
      ...prev,
      [tip]: { ...prev[tip], [field]: value },
    }));
  };

  const handleAnaDropdownChange = (targetId) => {
    const tipKey = secilenEkipmanTipi === "Dekantör" ? "dekantor" : "filtrepres";
    const modeller = ekipmanGruplari[tipKey] || [];
    const targetIdx = modeller.findIndex(m => m.id === Number(targetId) || m.id === String(targetId));
    if (targetIdx === -1 || otomatikKonfigurasyon.idealAnaIndex === -1) return;
    setAnaOffset(targetIdx - otomatikKonfigurasyon.idealAnaIndex);
  };

  const handleBeslemeDropdownChange = (targetId) => {
    const modeller = ekipmanGruplari["besleme_pompasi"] || [];
    const targetIdx = modeller.findIndex(m => m.id === Number(targetId) || m.id === String(targetId));
    if (targetIdx === -1 || otomatikKonfigurasyon.idealBeslemeIndex === -1) return;
    setBeslemeOffset(targetIdx - otomatikKonfigurasyon.idealBeslemeIndex);
  };

  const handleSuzuntuDropdownChange = (targetId) => {
    const modeller = ekipmanGruplari["suzuntu_pompasi"] || [];
    const targetIdx = modeller.findIndex(m => m.id === Number(targetId) || m.id === String(targetId));
    if (targetIdx === -1 || otomatikKonfigurasyon.idealSuzuntuIndex === -1) return;
    setSuzuntuOffset(targetIdx - otomatikKonfigurasyon.idealSuzuntuIndex);
  };

  if (dbLoading || Object.keys(opsiyonlar).length === 0) {
    return (
      <div className="d-flex flex-column gap-2 p-3 justify-content-center align-items-center" style={{ minHeight: "150px" }}>
        <div className="spinner-border spinner-border-sm text-success" role="status"></div>
        <span className="text-white-50" style={{ fontSize: "11px" }}>Çamur Susuzlaştırma Verileri Senkronize Ediliyor...</span>
      </div>
    );
  }

  const tipKeyCurrent = secilenEkipmanTipi === "Dekantör" ? "dekantor" : "filtrepres";

  return (
    <div className="d-flex flex-column gap-3 text-white">
      {/* 1. BAŞLIK PANELİ */}
      <div className="d-flex align-items-center">
        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
          1. Çamur Tasarım Parametreleri Özet & Giriş Paneli
        </span>
        <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
      </div>

      {/* INPUT GRUPLARI PANELİ */}
      <div className="p-3 rounded" style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
        <div className="row g-3 align-items-start">
          <div className="col-xl-7 col-12 border-end-xl" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="row g-2 align-items-start">
              <div className="col-4">
                <label className="form-label mb-1 text-warning d-block" style={{ fontSize: "11px", fontWeight: "600", minHeight: "33px" }}>
                  Dekantör Çalışma <br /> Saati (saat/gün)
                </label>
                <input
                  type="number"
                  className="form-control form-control-sm text-white fw-bold border-0 text-center"
                  style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", borderRadius: "6px", fontSize: "12px", height: "32px" }}
                  value={hesapParametreleri.dekantorCalismaSaati}
                  onChange={(e) => handleParametreChange("dekantorCalismaSaati", e.target.value)}
                />
              </div>
              <div className="col-4">
                <label className="form-label mb-1 text-warning d-block" style={{ fontSize: "11px", fontWeight: "600", minHeight: "33px" }}>
                  Filtrepres Kuru <br /> Madde Yüzdesi (%)
                </label>
                <input
                  type="number"
                  className="form-control form-control-sm text-white fw-bold border-0 text-center"
                  style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", borderRadius: "6px", fontSize: "12px", height: "32px" }}
                  value={hesapParametreleri.filtrepresKatiMaddeYuzdesi}
                  onChange={(e) => handleParametreChange("filtrepresKatiMaddeYuzdesi", e.target.value)}
                />
              </div>
              <div className="col-4">
                <label className="form-label mb-1 text-warning d-block" style={{ fontSize: "11px", fontWeight: "600", minHeight: "33px" }}>
                  Filtrepres Şarj <br /> Adedi (şarj/gün)
                </label>
                <input
                  type="number"
                  className="form-control form-control-sm text-white fw-bold border-0 text-center"
                  style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", borderRadius: "6px", fontSize: "12px", height: "32px" }}
                  value={hesapParametreleri.sarjAdedi}
                  onChange={(e) => handleParametreChange("sarjAdedi", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="col-xl-5 col-12">
            <div className="row g-2">
              <div className="col-12">
                <label className="form-label mb-1 text-white-50" style={{ fontSize: "11px", minHeight: "33px", display: "flex", alignItems: "flex-end" }}>
                  Tesis Tasarım Yükü Referansı
                </label>
                <div className="form-control form-control-sm text-white fw-bold border-0 text-center d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: "#1e293b", height: "32px", fontSize: "11px" }}>
                  {debi.toFixed(0)} m³/gün — {boi.toFixed(0)} mg/L (BOD / AKM)
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-2 mt-2 pt-2 border-top" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="col-md-6 col-12">
            <label className="form-label mb-1 text-white-50" style={{ fontSize: "11px" }}>Sistem Teknolojisi Seçimi</label>
            <select
              className="form-select form-select-sm text-info fw-bold border-0"
              style={{ backgroundColor: "rgba(14, 165, 233, 0.15)", borderRadius: "6px", fontSize: "12px", height: "32px" }}
              value={secilenEkipmanTipi}
              onChange={(e) => setSecilenEkipmanTipi(e.target.value)}
            >
              <option value="Dekantör" style={{ backgroundColor: "#1e293b" }}>Dekantör Santrifüj Sistemi</option>
              <option value="Filtrepres" style={{ backgroundColor: "#1e293b" }}>Filtrepres Filtrasyon Sistemi</option>
            </select>
          </div>
          <div className="col-md-6 col-12">
            <label className="form-label mb-1 text-white-50" style={{ fontSize: "11px" }}>Formüle Göre Gerekli Net Minimum Kapasite</label>
            <div className="form-control form-control-sm text-info fw-bold border-0 d-flex align-items-center justify-content-center"
              style={{ backgroundColor: "rgba(14, 165, 233, 0.1)", height: "32px", fontSize: "12px" }}>
              {otomatikKonfigurasyon.hamIhtiyac} {otomatikKonfigurasyon.birim}
            </div>
          </div>
        </div>
      </div>

      {/* --- PANEL GRUPLARI --- */}
      <div className="card-body d-flex flex-column gap-3" style={{ padding: 0 }}>

        {/* 2. ANA SUSUZLAŞTIRMA ÜNİTESİ */}
        <div className="d-flex flex-column gap-2">
          <div className="d-flex align-items-center">
            <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
              2. Ana Susuzlaştırma Ünitesi Seçimi
            </span>
            <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
          </div>
          <div className="row g-2">
            <div className="col-md-12">
              <div className="p-2 rounded d-flex justify-content-between align-items-center h-100" style={{ backgroundColor: "#1e293b", border: anaOffset !== 0 ? "1px solid #f59e0b" : "1px solid #10b981" }}>
                <div className="flex-grow-1 me-2">
                  <span className="text-white-50 d-block" style={{ fontSize: "9px" }}>SEÇİLEN {secilenEkipmanTipi.toUpperCase()} MODELİ</span>
                  <select
                    className="form-select form-select-sm text-white border-0 py-0 fw-bold mt-1 shadow-none"
                    style={{ backgroundColor: "transparent", fontSize: "12px", cursor: "pointer", color: anaOffset !== 0 ? "#f59e0b" : "#22c55e" }}
                    value={otomatikKonfigurasyon.ana ? otomatikKonfigurasyon.ana.id : ""}
                    disabled={otomatikKonfigurasyon.idealAnaIndex === -1}
                    onChange={(e) => handleAnaDropdownChange(e.target.value)}
                  >
                    {otomatikKonfigurasyon.idealAnaIndex === -1 && <option value="">Katalog Limit Dışı (Büyük Model Gerekli)</option>}
                    {(ekipmanGruplari[tipKeyCurrent] || []).map((m) => (
                      <option key={m.id} value={m.id} style={{ backgroundColor: "#1e293b", color: "#fff" }}>
                        Kapasite: {parseFloat(m.kapasite_degeri).toFixed(2)} {m.kapasite_birimi}
                      </option>
                    ))}
                  </select>
                </div>
                {anaOffset !== 0 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-warning p-0 d-flex align-items-center justify-content-center"
                    style={{ width: "24px", height: "24px", borderRadius: "4px" }}
                    onClick={() => setAnaOffset(0)}
                    title="Otomatik Hesaplanan Modele Dön"
                  >
                    <i className="bi bi-arrow-counterclockwise text-dark" style={{ fontSize: "11px", fontWeight: "bold" }}></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. ENTEGRE POMPA GRUPLARI */}
        <div className="d-flex flex-column gap-2">
          <div className="d-flex align-items-center">
            <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
              3. Entegre Pompa Grupları (Seçilebilir)
            </span>
            <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
          </div>
          <div className="row g-2">
            <div className="col-md-6">
              <div className="p-2 rounded d-flex justify-content-between align-items-center h-100" style={{ backgroundColor: "#1e293b", border: beslemeOffset !== 0 ? "1px solid #f59e0b" : "1px solid #ef4444" }}>
                <div className="flex-grow-1 me-2">
                  <span className="text-white-50 d-block" style={{ fontSize: "9px" }}>ÇAMUR BESLEME POMPASI</span>
                  <select
                    className="form-select form-select-sm text-white border-0 py-0 fw-bold mt-1 shadow-none"
                    style={{ backgroundColor: "transparent", fontSize: "12px", cursor: "pointer", color: beslemeOffset !== 0 ? "#f59e0b" : "#f87171" }}
                    value={otomatikKonfigurasyon.besleme ? otomatikKonfigurasyon.besleme.id : ""}
                    disabled={otomatikKonfigurasyon.idealBeslemeIndex === -1}
                    onChange={(e) => handleBeslemeDropdownChange(e.target.value)}
                  >
                    {(ekipmanGruplari["besleme_pompasi"] || []).map((m) => (
                      <option key={m.id} value={m.id} style={{ backgroundColor: "#1e293b", color: "#fff" }}>
                        Kapasite: {parseFloat(m.kapasite_degeri).toFixed(2)} {m.kapasite_birimi} (Güç: {m.besleme_kw || '2.20'} kW)
                      </option>
                    ))}
                  </select>
                </div>
                {beslemeOffset !== 0 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-warning p-0 d-flex align-items-center justify-content-center"
                    style={{ width: "24px", height: "24px", borderRadius: "4px" }}
                    onClick={() => setBeslemeOffset(0)}
                    title="Otomatik Hesaplanan Modele Dön"
                  >
                    <i className="bi bi-arrow-counterclockwise text-dark" style={{ fontSize: "11px", fontWeight: "bold" }}></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-2 rounded d-flex justify-content-between align-items-center h-100" style={{ backgroundColor: "#1e293b", border: suzuntuOffset !== 0 ? "1px solid #f59e0b" : "1px solid #a855f7" }}>
                <div className="flex-grow-1 me-2">
                  <span className="text-white-50 d-block" style={{ fontSize: "9px" }}>SÜZÜNTÜ SUYU GERİ DEVİR POMPASI</span>
                  <select
                    className="form-select form-select-sm text-white border-0 py-0 fw-bold mt-1 shadow-none"
                    style={{ backgroundColor: "transparent", fontSize: "12px", cursor: "pointer", color: suzuntuOffset !== 0 ? "#f59e0b" : "#c084fc" }}
                    value={otomatikKonfigurasyon.suzuntu ? otomatikKonfigurasyon.suzuntu.id : ""}
                    disabled={otomatikKonfigurasyon.idealSuzuntuIndex === -1}
                    onChange={(e) => handleSuzuntuDropdownChange(e.target.value)}
                  >
                    {(ekipmanGruplari["suzuntu_pompasi"] || []).map((m) => (
                      <option key={m.id} value={m.id} style={{ backgroundColor: "#1e293b", color: "#fff" }}>
                        Kapasite: {parseFloat(m.kapasite_degeri).toFixed(2)} {m.kapasite_birimi} (Güç: {m.geri_yikama_kw || '2.20'} kW)
                      </option>
                    ))}
                  </select>
                </div>
                {suzuntuOffset !== 0 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-warning p-0 d-flex align-items-center justify-content-center"
                    style={{ width: "24px", height: "24px", borderRadius: "4px" }}
                    onClick={() => setSuzuntuOffset(0)}
                    title="Otomatik Hesaplanan Modele Dön"
                  >
                    <i className="bi bi-arrow-counterclockwise text-dark" style={{ fontSize: "11px", fontWeight: "bold" }}></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. YARDIMCI VE OPSİYONEL EKİPMAN PANELİ */}
        <div className="d-flex flex-column gap-2 mt-2">
          <div className="d-flex align-items-center">
            <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
              4. Yardımcı ve Opsiyonel Sistem Bileşenleri
            </span>
            <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
          </div>

          <div className="row g-2">
            {opsiyonelTipler.map((tip) => {
              const modeller = ekipmanGruplari[tip] || [];
              const mevcutOpsiyon = opsiyonlar[tip] || { secili: false, id: "", adet: 1 };
              const ilkModel = modeller[0];

              const baslikFormatli = tip
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());

              return (
                <div className="col-md-6 col-12" key={tip}>
                  <div className="p-2 rounded d-flex align-items-center justify-content-between text-white"
                    style={{
                      backgroundColor: mevcutOpsiyon.secili ? "rgba(16, 185, 129, 0.08)" : "#1e293b",
                      border: mevcutOpsiyon.secili ? "1px solid #10b981" : "1px solid #2d3748"
                    }}>
                    <div className="d-flex flex-column justify-content-center">
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="checkbox"
                          className="form-check-input m-0 cursor-pointer"
                          style={{ width: "16px", height: "16px", accentColor: "#10b981" }}
                          id={`check-${tip}`}
                          checked={mevcutOpsiyon.secili}
                          onChange={(e) => handleOpsiyonChange(tip, "secili", e.target.checked)}
                        />
                        <label htmlFor={`check-${tip}`} className="form-check-label fw-semibold m-0 cursor-pointer" style={{ fontSize: "11px" }}>
                          {baslikFormatli} Entegrasyonu
                        </label>
                      </div>
                      {ilkModel && (
                        <span className="text-white-50 ms-4 mt-0.5" style={{ fontSize: "9px" }}>
                          Kapasite: {parseFloat(ilkModel.kapasite_degeri).toFixed(2)} {ilkModel.kapasite_birimi}
                        </span>
                      )}
                    </div>

                    {mevcutOpsiyon.secili && (
                      <div className="d-flex align-items-center gap-1">
                        <span className="text-white-50" style={{ fontSize: "10px" }}>Adet:</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className="form-control form-control-sm text-center text-white fw-bold border-0"
                          style={{ 
                            backgroundColor: "#0f172a", 
                            fontSize: "11px", 
                            height: "26px", 
                            width: "55px", 
                            borderRadius: "4px" 
                          }}
                          value={mevcutOpsiyon.adet || 1}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            handleOpsiyonChange(tip, "adet", isNaN(val) || val < 1 ? 1 : val);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default SludgeDewateringDetail;