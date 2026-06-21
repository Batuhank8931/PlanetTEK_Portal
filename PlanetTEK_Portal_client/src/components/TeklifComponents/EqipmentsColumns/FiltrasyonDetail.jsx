import React, { useEffect, useMemo, useState } from "react";
import { useTeklifStore } from "../../../utils/teklifStore";
import API from "../../../utils/utilRequest";

function FiltrasyonDetail() {
  // 🚀 API'den gelecek 4 bağımsız matris için state havuzları
  const [dbEquipments, setDbEquipments] = useState([]);
  const [dbFeedPumps, setDbFeedPumps] = useState([]);
  const [dbBackwashPumps, setDbBackwashPumps] = useState([]);
  const [dbOnKlorlama, setDbOnKlorlama] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Manuel seçim takipleri (Değişim yoksa ideal atanır)
  const selectedSeparatorDebi = !isMainDebiChanged ? storeFiltration.SecilenFiltreler?.seperatorFiltre?.debiM3h : null;
  const selectedKumDebi = !isMainDebiChanged ? storeFiltration.SecilenFiltreler?.kumFiltre?.debiM3h : null;
  const selectedKarbonDebi = !isMainDebiChanged ? storeFiltration.SecilenFiltreler?.aktifKarbonFiltre?.debiM3h : null;
  
  const selectedFeedDebi = !isMainDebiChanged ? storeFiltration.pompalar?.besleme?.debiM3h : null;
  const selectedBwDebi = !isMainDebiChanged ? storeFiltration.pompalar?.geriYikama?.debiM3h : null;
  const selectedKlorPompaId = !isMainDebiChanged ? storeFiltration.onKlorlama?.pompaId : null;
  const selectedKlorTankId = !isMainDebiChanged ? storeFiltration.onKlorlama?.tankId : null;

  // 🚀 Bileşen yüklendiğinde yeni API yapısına göre verileri çek
  useEffect(() => {
    const fetchFiltrationData = async () => {
      try {
        setIsLoading(true);
        const response = await API.getFiltrationCosts();
        const { filtrationEquipments = [], feedPumps = [], backwashPumps = [], onKlorlamaEquipments = [] } = response.data || {};

        setDbEquipments(filtrationEquipments.map(item => ({ ...item, debi: parseFloat(item.debi) || 0 })));
        setDbFeedPumps(feedPumps.map(item => ({ ...item, debi: parseFloat(item.debi) || 0, kw: parseFloat(item.kw) || 0 })));
        setDbBackwashPumps(backwashPumps.map(item => ({ ...item, geri_yikama_debi: parseFloat(item.geri_yikama_debi) || 0, kw: parseFloat(item.kw) || 0 })));
        setDbOnKlorlama(onKlorlamaEquipments);
      } catch (error) {
        console.error("Filtrasyon teknik matrisi yüklenirken hata:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiltrationData();
  }, []);

  // --- BAZ EN UYGUN (İDEAL) HESAPLAMALAR ---
  const idealDegerler = useMemo(() => {
    if (anaGunlukDebi === 0 || dbEquipments.length === 0) {
      return {
        toplamSaatlikDebi: 0, sistemAdet: 1, hatSaatlikDebi: 0, 
        idealEquipDebi: 0, idealFeedDebi: 0, idealFeedKw: 0, idealBwDebi: 0, idealBwKw: 0,
        idealKlorPompaRow: null, idealKlorTankRow: null
      };
    }

    const toplamSaatlikDebi = anaGunlukDebi / activeCalismaSaati;
    
    // Benzersiz debi listesini sırala
    const uniqueEquipDebis = Array.from(new Set(dbEquipments.map(i => i.debi))).sort((a, b) => a - b);
    const maxKapasite = uniqueEquipDebis[uniqueEquipDebis.length - 1] || 52.3;

    const sistemAdet = Math.ceil(toplamSaatlikDebi / maxKapasite);
    const hatSaatlikDebi = toplamSaatlikDebi / sistemAdet;

    // İdealleri Bulma
    const idealEquipDebi = uniqueEquipDebis.find(d => d >= hatSaatlikDebi) || maxKapasite;
    
    const uniqueFeedDebis = Array.from(new Set(dbFeedPumps.map(i => i.debi))).sort((a, b) => a - b);
    const idealFeedDebi = uniqueFeedDebis.find(d => d >= hatSaatlikDebi) || idealEquipDebi;
    const feedMatch = dbFeedPumps.find(p => p.debi === idealFeedDebi) || {};

    const bwMatch = dbBackwashPumps.find(b => b.geri_yikama_debi >= hatSaatlikDebi * 2) || dbBackwashPumps[0] || {};

    // Ön klorlama eşleşen ekipman bulucuları
    const klorPompalar = dbOnKlorlama.filter(i => i.ekipman_tipi === "pompa");
    const klorTanklar = dbOnKlorlama.filter(i => i.ekipman_tipi === "tank");
    const teorikKlorLH = hatSaatlikDebi * 0.04;

    const idealKlorPompaRow = klorPompalar.find(p => {
      const match = p.ekipman_adi.match(/(\d+[\.,]?\d*)\s*L\/h/i);
      return match ? parseFloat(match[1].replace(',', '.')) >= teorikKlorLH : false;
    }) || klorPompalar[klorPompalar.length - 1] || null;

    const teorikTankLitre = Math.ceil((teorikKlorLH * 24 * 3) / 50) * 50;
    const idealKlorTankRow = klorTanklar.find(t => {
      const match = t.ekipman_adi.match(/(\d+)\s*Litre/i);
      return match ? parseInt(match[1]) >= teorikTankLitre : false;
    }) || klorTanklar[klorTanklar.length - 1] || null;

    return {
      toplamSaatlikDebi,
      sistemAdet,
      hatSaatlikDebi,
      idealEquipDebi,
      idealFeedDebi,
      idealFeedKw: feedMatch.kw || 0,
      idealBwDebi: bwMatch.geri_yikama_debi || 0,
      idealBwKw: bwMatch.kw || 0,
      idealKlorPompaRow,
      idealKlorTankRow
    };
  }, [anaGunlukDebi, activeCalismaSaati, dbEquipments, dbFeedPumps, dbBackwashPumps, dbOnKlorlama]);

  // --- AKTİF SEÇİLEN KOMBİNASYONLAR ---
  const aktifSecimler = useMemo(() => {
    if (!idealDegerler) return null;

    const currentSeparatorDebi = selectedSeparatorDebi || idealDegerler.idealEquipDebi;
    const currentKumDebi = selectedKumDebi || idealDegerler.idealEquipDebi;
    const currentKarbonDebi = selectedKarbonDebi || idealDegerler.idealEquipDebi;

    const currentFeedDebi = selectedFeedDebi || idealDegerler.idealFeedDebi;
    const currentBwDebi = selectedBwDebi || idealDegerler.idealBwDebi;
    const currentKlorPompaId = selectedKlorPompaId || idealDegerler.idealKlorPompaRow?.id;
    const currentKlorTankId = selectedKlorTankId || idealDegerler.idealKlorTankRow?.id;

    const feedMatch = dbFeedPumps.find(p => p.debi === currentFeedDebi) || {};
    const bwMatch = dbBackwashPumps.find(b => b.geri_yikama_debi === currentBwDebi) || {};
    const pompaMatch = dbOnKlorlama.find(x => x.id === parseInt(currentKlorPompaId)) || {};
    const tankMatch = dbOnKlorlama.find(x => x.id === parseInt(currentKlorTankId)) || {};

    return {
      separatorDebi: currentSeparatorDebi,
      kumDebi: currentKumDebi,
      karbonDebi: currentKarbonDebi,
      feedDebi: currentFeedDebi,
      feedKw: feedMatch.kw || idealDegerler.idealFeedKw,
      bwDebi: currentBwDebi,
      bwKw: bwMatch.kw || idealDegerler.idealBwKw,
      klorPompaId: currentKlorPompaId,
      klorPompaAdi: pompaMatch.ekipman_adi || "—",
      klorTankId: currentKlorTankId,
      klorTankAdi: tankMatch.ekipman_adi || "—"
    };
  }, [idealDegerler, selectedSeparatorDebi, selectedKumDebi, selectedKarbonDebi, selectedFeedDebi, selectedBwDebi, selectedKlorPompaId, selectedKlorTankId, dbFeedPumps, dbBackwashPumps, dbOnKlorlama]);

  // --- MERKEZİ STORE EŞZAMANLAMA SÜRECİ ---
  useEffect(() => {
    if (anaGunlukDebi === 0 || dbEquipments.length === 0 || !aktifSecimler) return;

    const filtrasyonOzeti = {
      calismaSaati: activeCalismaSaati,
      sistemAdet: idealDegerler.sistemAdet,
      calculatedMainDebi: anaGunlukDebi,

      onKlorlama: {
        pompaId: aktifSecimler.klorPompaId,
        pompaAdi: aktifSecimler.klorPompaAdi,
        tankId: aktifSecimler.klorTankId,
        tankAdi: aktifSecimler.klorTankAdi
      },
      pompalar: {
        besleme: { debiM3h: aktifSecimler.feedDebi, kw: aktifSecimler.feedKw },
        geriYikama: { debiM3h: aktifSecimler.bwDebi, kw: aktifSecimler.bwKw }
      },
      SecilenFiltreler: {
        seperatorFiltre: { isim: "SEPERATÖR FİLTRE", debiM3h: aktifSecimler.separatorDebi },
        kumFiltre: { isim: "KUM FİLTRE SİSTEMİ", debiM3h: aktifSecimler.kumDebi },
        aktifKarbonFiltre: { isim: "AKTİF KARBON FİLTRE SİSTEMİ", debiM3h: aktifSecimler.karbonDebi }
      }
    };

    updateSection("equipments", {
      ...equipmentsCache,
      filtrationSystem: filtrasyonOzeti
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anaGunlukDebi, activeCalismaSaati, aktifSecimler, idealDegerler.sistemAdet]);

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

  // Dropdown değişiklik tetikleyicisi
  const handleDropdownUpdate = (payload) => {
    updateSection("equipments", {
      ...equipmentsCache,
      filtrationSystem: {
        ...storeFiltration,
        ...payload
      }
    });
  };

  if (isLoading || dbEquipments.length === 0 || !aktifSecimler) {
    return (
      <div className="d-flex flex-column gap-2 p-3 justify-content-center align-items-center" style={{ minHeight: "150px" }}>
        <div className="spinner-border spinner-border-sm text-success" role="status"></div>
        <span className="text-white-50" style={{ fontSize: "11px" }}>Filtrasyon Teknik Verileri Senkronize Ediliyor...</span>
      </div>
    );
  }

  // Benzersiz listeler (Dropdown seçenekleri için)
  const uniqueEquipOptions = Array.from(new Set(dbEquipments.map(i => i.debi))).sort((a, b) => a - b);
  const uniqueFeedOptions = Array.from(new Set(dbFeedPumps.map(i => i.debi))).sort((a, b) => a - b);

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
                  {idealDegerler.toplamSaatlikDebi.toFixed(2)} m³/h
                </div>
              </div>

              <div className="col-4">
                <label className="form-label mb-1 text-warning" style={{ fontSize: "11px" }}>Gerekli Sistem Adedi</label>
                <div className="form-control form-control-sm text-warning fw-bold border-0 text-center d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", height: "32px", fontSize: "12px" }}>
                  {idealDegerler.sistemAdet} Adet
                </div>
              </div>

              <div className="col-4">
                <label className="form-label mb-1 text-info" style={{ fontSize: "11px" }}>Hat Başına Tasarım Debisi</label>
                <div className="form-control form-control-sm text-info fw-bold border-0 text-center d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: "rgba(14, 165, 233, 0.1)", height: "32px", fontSize: "12px" }}>
                  {idealDegerler.hatSaatlikDebi.toFixed(2)} m³/h
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
                <select
                  className="bg-transparent border-0 fw-bold text-white text-end cursor-pointer p-0 select-clean focus-none"
                  style={{ fontSize: "11px", outline: "none" }}
                  value={aktifSecimler.klorPompaId}
                  onChange={(e) => handleDropdownUpdate({ onKlorlama: { ...storeFiltration.onKlorlama, pompaId: e.target.value } })}
                >
                  {dbOnKlorlama.filter(i => i.ekipman_tipi === "pompa").map(p => (
                    <option key={p.id} value={p.id} className="bg-slate">{p.ekipman_adi}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #38bdf8" }}>
                <span className="text-white-50" style={{ fontSize: "10px" }}>Solüsyon Tankı Hacmi:</span>
                <select
                  className="bg-transparent border-0 fw-bold text-info text-end cursor-pointer p-0 select-clean focus-none"
                  style={{ fontSize: "11px", outline: "none" }}
                  value={aktifSecimler.klorTankId}
                  onChange={(e) => handleDropdownUpdate({ onKlorlama: { ...storeFiltration.onKlorlama, tankId: e.target.value } })}
                >
                  {dbOnKlorlama.filter(i => i.ekipman_tipi === "tank").map(t => (
                    <option key={t.id} value={t.id} className="bg-slate">{t.ekipman_adi}</option>
                  ))}
                </select>
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
                  <select
                    className="bg-transparent border-0 fw-bold text-danger cursor-pointer p-0 select-clean focus-none"
                    style={{ fontSize: "11px", outline: "none" }}
                    value={aktifSecimler.feedDebi}
                    onChange={(e) => handleDropdownUpdate({ pompalar: { ...storeFiltration.pompalar, besleme: { ...storeFiltration.pompalar?.besleme, debiM3h: parseFloat(e.target.value) } } })}
                  >
                    {uniqueFeedOptions.map(d => (
                      <option key={d} value={d} className="bg-slate">Q: {d.toFixed(2)} m³/h</option>
                    ))}
                  </select>
                </div>
                <div className="text-end">
                  <span className="badge bg-danger text-white fw-bold d-block" style={{ fontSize: "10px" }}>
                    {aktifSecimler.feedKw} kW
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #a855f7" }}>
                <div>
                  <span className="text-white-50 d-block" style={{ fontSize: "9px" }}>GERI YIKAMA POMPASI</span>
                  <select
                    className="bg-transparent border-0 fw-bold cursor-pointer p-0 select-clean focus-none"
                    style={{ fontSize: "11px", color: "#c084fc", outline: "none" }}
                    value={aktifSecimler.bwDebi}
                    onChange={(e) => handleDropdownUpdate({ pompalar: { ...storeFiltration.pompalar, geriYikama: { ...storeFiltration.pompalar?.geriYikama, debiM3h: parseFloat(e.target.value) } } })}
                  >
                    {dbBackwashPumps.map(b => (
                      <option key={b.id} value={b.geri_yikama_debi} className="bg-slate">Q: {b.geri_yikama_debi} m³/h</option>
                    ))}
                  </select>
                </div>
                <div className="text-end">
                  <span className="badge text-white fw-bold d-block" style={{ fontSize: "10px", backgroundColor: "#a855f7" }}>
                    {aktifSecimler.bwKw} kW
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
                  <select
                    className="bg-transparent border-0 fw-bold text-white cursor-pointer w-100 p-0 select-clean focus-none"
                    style={{ fontSize: "12px", outline: "none" }}
                    value={aktifSecimler.separatorDebi}
                    onChange={(e) => handleDropdownUpdate({ SecilenFiltreler: { ...storeFiltration.SecilenFiltreler, seperatorFiltre: { isim: "SEPERATÖR FİLTRE", debiM3h: parseFloat(e.target.value) } } })}
                  >
                    {uniqueEquipOptions.map(d => (
                      <option key={d} value={d} className="bg-slate">{d} m³/h</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-2 rounded h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: "#1e293b", border: "1px solid #10b981" }}>
                <div className="text-success" style={{ fontSize: "9px", fontWeight: "600" }}>KUM FİLTRE SİSTEMİ</div>
                <div className="mt-2">
                  <select
                    className="bg-transparent border-0 fw-bold text-success cursor-pointer w-100 p-0 select-clean focus-none"
                    style={{ fontSize: "12px", outline: "none" }}
                    value={aktifSecimler.kumDebi}
                    onChange={(e) => handleDropdownUpdate({ SecilenFiltreler: { ...storeFiltration.SecilenFiltreler, kumFiltre: { isim: "KUM FİLTRE SİSTEMİ", debiM3h: parseFloat(e.target.value) } } })}
                  >
                    {uniqueEquipOptions.map(d => (
                      <option key={d} value={d} className="bg-slate">{d} m³/h</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-2 rounded h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: "#1e293b", border: "1px solid #f59e0b" }}>
                <div className="text-warning" style={{ fontSize: "9px", fontWeight: "600" }}>AKTİF KARBON FİLTRE SİSTEMİ</div>
                <div className="mt-2">
                  <select
                    className="bg-transparent border-0 fw-bold text-warning cursor-pointer w-100 p-0 select-clean focus-none"
                    style={{ fontSize: "12px", outline: "none" }}
                    value={aktifSecimler.karbonDebi}
                    onChange={(e) => handleDropdownUpdate({ SecilenFiltreler: { ...storeFiltration.SecilenFiltreler, aktifKarbonFiltre: { isim: "AKTİF KARBON FİLTRE SİSTEMİ", debiM3h: parseFloat(e.target.value) } } })}
                  >
                    {uniqueEquipOptions.map(d => (
                      <option key={d} value={d} className="bg-slate">{d} m³/h</option>
                    ))}
                  </select>
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