import React, { useEffect, useMemo, useState } from "react";
import { useTeklifStore } from "../../../utils/teklifStore";
import API from "../../../utils/utilRequest";

function FiltrasyonDetail() {
  const CALC_HOURS = 24;

  // 🚀 API'den gelecek filtrasyon matrisi için state
  const [filtrationDatabase, setFiltrationDatabase] = useState([]);

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

  // 🚀 Bileşen yüklendiğinde filtrasyon maliyet/teknik tablosunu çek
  useEffect(() => {
    const fetchFiltrationData = async () => {
      try {
        const response = await API.getFiltrationCosts();
        // Teknik hesaplama yapacağımız alanları sayı tipine garantiye alarak map'liyoruz
        const formatted = (response.data || []).map(item => ({
          id: item.id,
          debi: parseFloat(item.debi) || 0,
          besleme_kw: parseFloat(item.besleme_kw) || 0,
          geri_yikama_debi: parseFloat(item.geri_yikama_debi) || 0,
          geri_yikama_kw: parseFloat(item.geri_yikama_kw) || 0
        }));
        setFiltrationDatabase(formatted);
      } catch (error) {
        console.error("Filtrasyon teknik matrisi yüklenirken hata:", error);
      }
    };
    fetchFiltrationData();
  }, []);

  // 🚀 Hat debisini karşılayan en uygun satırı dinamik DB içinden bulan yardımcı fonksiyon
  const findOptimalRow = (hatSaatlikDebi, db) => {
    if (!db || db.length === 0) return null;
    return db.find(row => row.debi >= hatSaatlikDebi) || db[db.length - 1];
  };

  // --- HESAPLAMALAR ---
  const hesaplananDegerler = useMemo(() => {
    // Eğer veri henüz gelmediyse veya debi sıfırsa güvenli default objeyi dön
    if (anaGunlukDebi === 0 || filtrationDatabase.length === 0) {
      return {
        toplamSaatlikDebi: 0, sistemAdet: 1, hatSaatlikDebi: 0, hatBackwashDebi: 0,
        filtreModel: 0, beslemeKw: 0, geriYikamaKw: 0, onKlorlamaDozaj: 0, onKlorlamaTank: 0
      };
    }

    const toplamSaatlikDebi = anaGunlukDebi / activeCalismaSaati;
    
    // 🚀 Maksimum kapasiteyi statik 52.3 yerine tablonun son satırından dinamik okuyoruz
    const maxKapasite = filtrationDatabase[filtrationDatabase.length - 1].debi;

    const sistemAdet = Math.ceil(toplamSaatlikDebi / maxKapasite);
    const hatSaatlikDebi = toplamSaatlikDebi / sistemAdet;

    // Hat debisine göre satırı dinamik DB'den buluyoruz
    const secilenSatir = findOptimalRow(hatSaatlikDebi, filtrationDatabase);

    if (!secilenSatir) {
      return {
        toplamSaatlikDebi, sistemAdet, hatSaatlikDebi, hatBackwashDebi: 0,
        filtreModel: 0, beslemeKw: 0, geriYikamaKw: 0, onKlorlamaDozaj: 0, onKlorlamaTank: 0
      };
    }

    const onKlorlamaDozaj = hatSaatlikDebi * 0.04;
    const onKlorlamaTank = Math.ceil((onKlorlamaDozaj * 24 * 3) / 50) * 50;

    return {
      toplamSaatlikDebi,
      sistemAdet,
      hatSaatlikDebi,
      hatBackwashDebi: secilenSatir.geri_yikama_debi,
      filtreModel: secilenSatir.debi,                 
      beslemeKw: secilenSatir.besleme_kw,             
      geriYikamaKw: secilenSatir.geri_yikama_kw,       
      onKlorlamaDozaj,
      onKlorlamaTank
    };
  }, [anaGunlukDebi, activeCalismaSaati, filtrationDatabase]);

  // --- MERKEZİ STORE EŞZAMANLAMA ---
  useEffect(() => {
    if (anaGunlukDebi === 0 || filtrationDatabase.length === 0) return;

    const filtrasyonOzeti = {
      calismaSaati: activeCalismaSaati,
      sistemAdet: hesaplananDegerler.sistemAdet,

      onKlorlama: {
        debiLH: parseFloat(hesaplananDegerler.onKlorlamaDozaj.toFixed(2)),
        basincBar: 5,
        tankLitre: hesaplananDegerler.onKlorlamaTank
      },

      pompalar: {
        besleme: {
          debiM3h: parseFloat(hesaplananDegerler.hatSaatlikDebi.toFixed(2)),
          kw: hesaplananDegerler.beslemeKw
        },
        geriYikama: {
          debiM3h: hesaplananDegerler.hatBackwashDebi,
          kw: hesaplananDegerler.geriYikamaKw
        }
      },

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
  }, [anaGunlukDebi, activeCalismaSaati, hesaplananDegerler, filtrationDatabase]);

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

  // Veritabanı yüklenene kadar arayüz kilitlenmesin/hataya düşmesin diye koruma loader'ı
  if (filtrationDatabase.length === 0) {
    return (
      <div className="d-flex flex-column gap-2 p-3 justify-content-center align-items-center" style={{ minHeight: "150px" }}>
        <div className="spinner-border spinner-border-sm text-success" role="status"></div>
        <span className="text-white-50" style={{ fontSize: "11px" }}>Filtrasyon Teknik Verileri Senkronize Ediliyor...</span>
      </div>
    );
  }

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

      {/* --- EKİPMAN PANELİ --- */}
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
                    Q: {hesaplananDegerler.hatBackwashDebi} m³/h
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