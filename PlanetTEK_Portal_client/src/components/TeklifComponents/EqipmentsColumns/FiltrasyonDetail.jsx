import React, { useEffect, useMemo } from "react";
import { useTeklifStore } from "../../../utils/teklifStore";

// --- SABİT VERİTABANI MODELLEMELERİ ---
const FILTRATION_DATABASE = [
  { maxDebi: 1.0 }, { maxDebi: 1.5 }, { maxDebi: 2.0 }, { maxDebi: 4.0 },
  { maxDebi: 6.0 }, { maxDebi: 6.3 }, { maxDebi: 6.5 }, { maxDebi: 7.0 },
  { maxDebi: 7.7 }, { maxDebi: 8.0 }, { maxDebi: 9.0 }, { maxDebi: 10.0 },
  { maxDebi: 12.0 }, { maxDebi: 15.0 }, { maxDebi: 17.0 }, { maxDebi: 20.0 },
  { maxDebi: 24.5 }, { maxDebi: 26.7 }, { maxDebi: 30.0 }, { maxDebi: 33.0 },
  { maxDebi: 38.5 }, { maxDebi: 40.0 }, { maxDebi: 45.0 }, { maxDebi: 52.3 }
];

const PUMP_DATABASE = {
  besleme: [
    { maxDebi: 1.0, kw: 2.2 }, { maxDebi: 1.15, kw: 2.2 }, { maxDebi: 2.0, kw: 2.2 }, { maxDebi: 3.5, kw: 2.2 },
    { maxDebi: 4.0, kw: 2.2 }, { maxDebi: 6.0, kw: 2.2 }, { maxDebi: 6.5, kw: 2.2 }, { maxDebi: 7.0, kw: 2.2 },
    { maxDebi: 7.3, kw: 2.2 }, { maxDebi: 7.5, kw: 2.2 }, { maxDebi: 8.0, kw: 2.2 }, { maxDebi: 9.4, kw: 2.2 },
    { maxDebi: 10.0, kw: 3.0 }, { maxDebi: 14.0, kw: 3.0 }, { maxDebi: 16.0, kw: 3.0 },
    { maxDebi: 20.0, kw: 4.0 }, { maxDebi: 23.0, kw: 4.0 }, { maxDebi: 25.0, kw: 4.0 },
    { maxDebi: 30.0, kw: 5.5 }, { maxDebi: 33.0, kw: 5.5 }, { maxDebi: 36.2, kw: 5.5 },
    { maxDebi: 37.0, kw: 11.0 }, { maxDebi: 40.0, kw: 11.0 }, { maxDebi: 49.3, kw: 11.0 }
  ],
  geriYikama: [
    { maxDebi: 9.4, kw: 2.2 }, { maxDebi: 15.0, kw: 3.0 }, { maxDebi: 18.0, kw: 4.0 },
    { maxDebi: 23.5, kw: 5.5 }, { maxDebi: 40.0, kw: 11.0 }, { maxDebi: 62.5, kw: 11.0 },
    { maxDebi: 62.5, kw: 12.0 }, { maxDebi: 62.5, kw: 13.0 }, { maxDebi: 90.0, kw: 11.0 },
    { maxDebi: 120.0, kw: 16.5 }
  ]
};

// Yardımcı Tekli Seçim Fonksiyonları
const findOptimalFiltreModel = (hatDebisi) => {
  return FILTRATION_DATABASE.find(item => item.maxDebi >= hatDebisi) || FILTRATION_DATABASE[FILTRATION_DATABASE.length - 1];
};

const findOptimalPumpModel = (hatDebisi, type) => {
  const db = PUMP_DATABASE[type];
  return db.find(item => item.maxDebi >= hatDebisi) || db[db.length - 1];
};

function FiltrasyonDetail() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const anaGunlukDebi = parseFloat(formData.planetDiskDetails?.debi) || 0;
  const equipmentsCache = formData.equipments || {};
  const storeFiltration = equipmentsCache.filtrationSystem || {};

  const lastCalculatedMainDebi = storeFiltration.calculatedMainDebi !== undefined ? storeFiltration.calculatedMainDebi : null;
  const isMainDebiChanged = lastCalculatedMainDebi !== null && lastCalculatedMainDebi !== anaGunlukDebi;

  const calismaSaatiInput = (storeFiltration.calismaSaati !== undefined && !isMainDebiChanged)
    ? storeFiltration.calismaSaati
    : "22";

  const activeCalismaSaati = parseFloat(calismaSaatiInput) || 22;

  // --- TOP YEKÜN SİSTEM VE MÜHENDİSLİK HESAPLARI ---
  const hesaplananDegerler = useMemo(() => {
    if (anaGunlukDebi === 0) {
      return {
        toplamSaatlikDebi: 0, sistemAdet: 1, hatSaatlikDebi: 0, hatBackwashDebi: 0,
        filtreModel: 0, beslemeKw: 0, geriYikamaKw: 0, onKlorlamaDozaj: 0, onKlorlamaTank: 0
      };
    }

    const toplamSaatlikDebi = anaGunlukDebi / activeCalismaSaati;
    const maxKapasite = FILTRATION_DATABASE[FILTRATION_DATABASE.length - 1].maxDebi; // 52.3

    const sistemAdet = Math.ceil(toplamSaatlikDebi / maxKapasite);
    const hatSaatlikDebi = toplamSaatlikDebi / sistemAdet;
    const hatBackwashDebi = hatSaatlikDebi * 2;

    const filtreSecim = findOptimalFiltreModel(hatSaatlikDebi);
    const beslemePompa = findOptimalPumpModel(hatSaatlikDebi, "besleme");
    const geriYikamaPompa = findOptimalPumpModel(hatBackwashDebi, "geriYikama");

    const onKlorlamaDozaj = hatSaatlikDebi * 0.04;
    const onKlorlamaTank = Math.ceil((onKlorlamaDozaj * 24 * 3) / 50) * 50;

    return {
      toplamSaatlikDebi,
      sistemAdet,
      hatSaatlikDebi,
      hatBackwashDebi,
      filtreModel: filtreSecim.maxDebi,
      beslemeKw: beslemePompa.kw,
      geriYikamaKw: geriYikamaPompa.kw,
      onKlorlamaDozaj,
      onKlorlamaTank
    };
  }, [anaGunlukDebi, activeCalismaSaati]);

  // --- MERKEZİ STORE EŞZAMANLAMA ---
  useEffect(() => {
    if (anaGunlukDebi === 0) return;

    // İstediğin filtre modelleri "SecilenFiltreler" yapısı altında store'a ekleniyor
    const filtrasyonOzeti = {
      calismaSaati: activeCalismaSaati,
      sistemAdet: hesaplananDegerler.sistemAdet,

      // Dozaj Ünitesi
      onKlorlama: {
        debiLH: parseFloat(hesaplananDegerler.onKlorlamaDozaj.toFixed(2)),
        basincBar: 5,
        tankLitre: hesaplananDegerler.onKlorlamaTank
      },

      // Pompalar
      pompalar: {
        besleme: {
          debiM3h: parseFloat(hesaplananDegerler.hatSaatlikDebi.toFixed(2)),
          kw: hesaplananDegerler.beslemeKw
        },
        geriYikama: {
          debiM3h: parseFloat(hesaplananDegerler.hatBackwashDebi.toFixed(2)),
          kw: hesaplananDegerler.geriYikamaKw
        }
      },

      // İstenen Filtre Grubu Yapısı
      SecilenFiltreler: {
        seperatorFiltre: {
          isim: "SEPERATÖR FİLTRE",
          debiM3h: hesaplananDegerler.filtreModel
        },
        kumFiltre: {
          isim: "KUM FİLTRE SİSTEMİ",
          debiM3h: hesaplananDegerler.filtreModel
        },
        aktifKarbonFiltre: {
          isim: "AKTİF KARBON FİLTRE SİSTEMİ",
          debiM3h: hesaplananDegerler.filtreModel
        }
      },

      // Geriye dönük uyumluluk bozulmasın diye eski tekil alan da korunuyor
      filtreler: {
        debiM3h: hesaplananDegerler.filtreModel
      }
    };

    updateSection("equipments", {
      ...equipmentsCache,
      filtrationSystem: {
        calculatedMainDebi: anaGunlukDebi,
        ...filtrasyonOzeti
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anaGunlukDebi, activeCalismaSaati, hesaplananDegerler]);

  const handleInputChange = (e) => {
    const { value } = e.target;
    updateSection("equipments", {
      ...equipmentsCache,
      filtrationSystem: {
        ...storeFiltration,
        calismaSaati: value,
        calculatedMainDebi: anaGunlukDebi
      }
    });
  };

  return (
    <div className="d-flex flex-column gap-3 text-white">
      <div className="d-flex align-items-center">
        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
          1. İleri Arıtma Parametreleri
        </span>
        <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
      </div>

      {/* ANA PARAMETRE GİRİŞ PANELİ */}
      <div className="p-3 rounded" style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
        <div className="row g-3 align-items-end">
          <div className="col-xl-5 col-md-6 col-12 border-end-md" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="row g-2">
              <div className="col-6">
                <label className="form-label mb-1 text-white-50" style={{ fontSize: "11px" }}>Günlük Sistem Debisi</label>
                <div className="form-control form-control-sm text-white fw-bold border-0 text-center d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: "#1e293b", height: "32px", fontSize: "12px" }}>
                  {anaGunlukDebi.toFixed(1)} m³/gün
                </div>
              </div>
              <div className="col-6">
                <label className="form-label mb-1 text-warning" style={{ fontSize: "11px", fontWeight: "600" }}>Çalışma Süresi (saat/gün)</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  className="form-control form-control-sm text-white fw-bold border-0 text-center"
                  style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", border: "1px solid #f59e0b !important", borderRadius: "6px", fontSize: "12px", height: "32px" }}
                  value={calismaSaatiInput}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="col-xl-7 col-md-6 col-12">
            <div className="row g-2">
              <div className="col-4">
                <label className="form-label mb-1 text-white-50" style={{ fontSize: "11px" }}>Toplam Tasarım Debisi</label>
                <div className="form-control form-control-sm text-success fw-bold border-0 text-center d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", height: "32px", fontSize: "12px" }}>
                  {hesaplananDegerler.toplamSaatlikDebi.toFixed(2)} m³/h
                </div>
              </div>

              <div className="col-4">
                <label className="form-label mb-1 text-warning" style={{ fontSize: "11px" }}>Gerekli Sistem Adedi</label>
                <div className="form-control form-control-sm text-warning fw-bold border-0 text-center d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", height: "32px", fontSize: "12px" }}>
                  {hesaplananDegerler.sistemAdet} Adet
                </div>
              </div>

              <div className="col-4">
                <label className="form-label mb-1 text-info" style={{ fontSize: "11px" }}>Hat Başına Tasarım Debisi</label>
                <div className="form-control form-control-sm text-info fw-bold border-0 text-center d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: "rgba(14, 165, 233, 0.1)", height: "32px", fontSize: "12px" }}>
                  {hesaplananDegerler.hatSaatlikDebi.toFixed(2)} m³/h
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- EKİPMAN KRİTİK GÖRSEL PANELİ --- */}
      <div className="card-body d-flex flex-column gap-3" style={{ padding: 0 }}>
        
        {/* 2: ÖN KLORLAMA VE SOLÜSYON TANKI */}
        <div className="d-flex flex-column gap-2">
          <div className="d-flex align-items-center">
            <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
              2. Ön Klorlama & Solüsyon Ünitesi (Hat Başına)
            </span>
            <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
          </div>
          <div className="row g-2">
            <div className="col-md-6">
              <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
                <span className="text-white-50" style={{ fontSize: "10px" }}>Dozaj Pompası Kapasitesi & Basıncı:</span>
                <span className="fw-bold text-white" style={{ fontSize: "11px" }}>
                  {hesaplananDegerler.onKlorlamaDozaj.toFixed(2)} L/h - 5 Bar
                </span>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #38bdf8" }}>
                <span className="text-white-50" style={{ fontSize: "10px" }}>Solüsyon Tankı Hacmi:</span>
                <span className="fw-bold text-info" style={{ fontSize: "11px" }}>
                  {hesaplananDegerler.onKlorlamaTank} Litre
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3: POMPA GRUPLARI */}
        <div className="d-flex flex-column gap-2">
          <div className="d-flex align-items-center">
            <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
              3. Pompa Grupları (Hat Başına)
            </span>
            <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
          </div>
          <div className="row g-2">
            <div className="col-md-6">
              <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #ef4444" }}>
                <div>
                  <span className="text-white-50 d-block" style={{ fontSize: "9px" }}>BESLEME SİSTEMİ</span>
                  <span className="fw-bold text-danger" style={{ fontSize: "11px" }}>
                    Q: {hesaplananDegerler.hatSaatlikDebi.toFixed(2)} m³/h
                  </span>
                </div>
                <div className="text-end">
                  <span className="badge bg-danger text-white fw-bold d-block" style={{ fontSize: "10px" }}>
                    1 Adet x {hesaplananDegerler.beslemeKw} kW
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #a855f7" }}>
                <div>
                  <span className="text-white-50 d-block" style={{ fontSize: "9px" }}>GERI YIKAMA POMPASI</span>
                  <span className="fw-bold" style={{ fontSize: "11px", color: "#c084fc" }}>
                    Q (2 Katı): {hesaplananDegerler.hatBackwashDebi.toFixed(2)} m³/h
                  </span>
                </div>
                <div className="text-end">
                  <span className="badge text-white fw-bold d-block" style={{ fontSize: "10px", backgroundColor: "#a855f7" }}>
                    1 Adet x {hesaplananDegerler.geriYikamaKw} kW
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4: FİLTRELER */}
        <div className="d-flex flex-column gap-2">
          <div className="d-flex align-items-center">
            <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
              4. Filtreler (Hat Başına)
            </span>
            <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
          </div>
          <div className="row g-2">
            <div className="col-md-4">
              <div className="p-2 rounded h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}>
                <div className="text-white-50" style={{ fontSize: "9px", fontWeight: "600" }}>SEPERATÖR FİLTRE</div>
                <div className="mt-2">
                  <div className="fw-bold text-white" style={{ fontSize: "12px" }}>
                    {hesaplananDegerler.filtreModel} m³/h
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-2 rounded h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: "#1e293b", border: "1px solid #10b981" }}>
                <div className="text-success" style={{ fontSize: "9px", fontWeight: "600" }}>KUM FİLTRE SİSTEMİ</div>
                <div className="mt-2">
                  <div className="fw-bold text-success" style={{ fontSize: "12px" }}>
                    {hesaplananDegerler.filtreModel} m³/h
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-2 rounded h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: "#1e293b", border: "1px solid #f59e0b" }}>
                <div className="text-warning" style={{ fontSize: "9px", fontWeight: "600" }}>AKTİF KARBON FİLTRE SİSTEMİ</div>
                <div className="mt-2">
                  <div className="fw-bold text-warning" style={{ fontSize: "12px" }}>
                    {hesaplananDegerler.filtreModel} m³/h
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default FiltrasyonDetail;