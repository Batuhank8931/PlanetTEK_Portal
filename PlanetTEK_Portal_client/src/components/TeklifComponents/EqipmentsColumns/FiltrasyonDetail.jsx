import React, { useEffect, useMemo, useState } from "react";
import { useTeklifStore } from "../../../utils/teklifStore";
import API from "../../../utils/utilRequest";

function FiltrasyonDetail() {
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

  const lastCalculatedMainDebi =
    storeFiltration.calculatedMainDebi !== undefined
      ? storeFiltration.calculatedMainDebi
      : null;
  const isMainDebiChanged =
    lastCalculatedMainDebi !== null && lastCalculatedMainDebi !== anaGunlukDebi;

  const calismaSaatiInput =
    storeFiltration.calismaSaati !== undefined && !isMainDebiChanged
      ? storeFiltration.calismaSaati
      : "22";

  const activeCalismaSaati = parseFloat(calismaSaatiInput) || 22;

  // Üçüncül Arıtma Sonrası BOİ Varsayılan Hesaplaması
  const defaultThirdTreatmentBOD = useMemo(() => {
    const pDetails =
      formData?.planetDiskDetails?.tasarim?.aritmaParametreleri || {};
    const cikisBoiVal = parseFloat(pDetails.cikisBoi);
    if (!isNaN(cikisBoiVal)) {
      return String(Math.round(cikisBoiVal * 0.8 * 100) / 100);
    }
    return "";
  }, [formData?.planetDiskDetails?.tasarim?.aritmaParametreleri]);

  const thirdTreatmentBODInput =
    storeFiltration.thirdTreatmentBOD !== undefined && !isMainDebiChanged
      ? storeFiltration.thirdTreatmentBOD
      : defaultThirdTreatmentBOD;

  const selectedSeparatorDebi = !isMainDebiChanged
    ? storeFiltration.SecilenFiltreler?.seperatorFiltre?.debiM3h
    : null;
  const selectedKumDebi = !isMainDebiChanged
    ? storeFiltration.SecilenFiltreler?.kumFiltre?.debiM3h
    : null;
  const selectedKarbonDebi = !isMainDebiChanged
    ? storeFiltration.SecilenFiltreler?.aktifKarbonFiltre?.debiM3h
    : null;

  const selectedFeedDebi = !isMainDebiChanged
    ? storeFiltration.pompalar?.besleme?.debiM3h
    : null;
  const selectedBwDebi = !isMainDebiChanged
    ? storeFiltration.pompalar?.geriYikama?.debiM3h
    : null;
  const selectedKlorPompaId = !isMainDebiChanged
    ? storeFiltration.onKlorlama?.pompaId
    : null;
  const selectedKlorTankId = !isMainDebiChanged
    ? storeFiltration.onKlorlama?.tankId
    : null;

  useEffect(() => {
    const fetchFiltrationData = async () => {
      try {
        setIsLoading(true);
        const response = await API.getFiltrationCosts();
        const {
          filtrationEquipments = [],
          feedPumps = [],
          backwashPumps = [],
          onKlorlamaEquipments = [],
        } = response.data || {};

        setDbEquipments(
          filtrationEquipments.map((item) => ({
            ...item,
            debi: parseFloat(item.debi) || 0,
          }))
        );
        setDbFeedPumps(
          feedPumps.map((item) => ({
            ...item,
            debi: parseFloat(item.debi) || 0,
            kw: parseFloat(item.kw) || 0,
          }))
        );
        setDbBackwashPumps(
          backwashPumps.map((item) => ({
            ...item,
            geri_yikama_debi: parseFloat(item.geri_yikama_debi) || 0,
            kw: parseFloat(item.kw) || 0,
          }))
        );
        setDbOnKlorlama(onKlorlamaEquipments);
      } catch (error) {
        console.error("Filtrasyon teknik matrisi yüklenirken hata:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiltrationData();
  }, []);

  const idealDegerler = useMemo(() => {
    if (anaGunlukDebi === 0 || dbEquipments.length === 0) {
      return {
        toplamSaatlikDebi: 0,
        sistemAdet: 1,
        hatSaatlikDebi: 0,
        idealEquipDebi: 0,
        idealFeedDebi: 0,
        idealFeedKw: 0,
        idealBwDebi: 0,
        idealBwKw: 0,
        idealKlorPompaRow: null,
        idealKlorTankRow: null,
      };
    }

    const toplamSaatlikDebi = anaGunlukDebi / activeCalismaSaati;
    const uniqueEquipDebis = Array.from(
      new Set(dbEquipments.map((i) => i.debi))
    ).sort((a, b) => a - b);
    const maxKapasite = uniqueEquipDebis[uniqueEquipDebis.length - 1] || 52.3;

    const sistemAdet = Math.ceil(toplamSaatlikDebi / maxKapasite);
    const hatSaatlikDebi = toplamSaatlikDebi / sistemAdet;

    const idealEquipDebi =
      uniqueEquipDebis.find((d) => d >= hatSaatlikDebi) || maxKapasite;

    const uniqueFeedDebis = Array.from(
      new Set(dbFeedPumps.map((i) => i.debi))
    ).sort((a, b) => a - b);
    const idealFeedDebi =
      uniqueFeedDebis.find((d) => d >= hatSaatlikDebi) || idealEquipDebi;
    const feedMatch = dbFeedPumps.find((p) => p.debi === idealFeedDebi) || {};

    const bwMatch =
      dbBackwashPumps.find((b) => b.geri_yikama_debi >= hatSaatlikDebi * 2) ||
      dbBackwashPumps[0] ||
      {};

    const klorPompalar = dbOnKlorlama.filter((i) => i.ekipman_tipi === "pompa");
    const klorTanklar = dbOnKlorlama.filter((i) => i.ekipman_tipi === "tank");
    const teorikKlorLH = hatSaatlikDebi * 0.04;

    const idealKlorPompaRow =
      klorPompalar.find((p) => {
        const match = p.ekipman_adi.match(/(\d+[\.,]?\d*)\s*L\/h/i);
        return match
          ? parseFloat(match[1].replace(",", ".")) >= teorikKlorLH
          : false;
      }) ||
      klorPompalar[klorPompalar.length - 1] ||
      null;

    const teorikTankLitre = Math.ceil((teorikKlorLH * 24 * 3) / 50) * 50;
    const idealKlorTankRow =
      klorTanklar.find((t) => {
        const match = t.ekipman_adi.match(/(\d+)\s*Litre/i);
        return match ? parseInt(match[1]) >= teorikTankLitre : false;
      }) ||
      klorTanklar[klorTanklar.length - 1] ||
      null;

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
      idealKlorTankRow,
    };
  }, [
    anaGunlukDebi,
    activeCalismaSaati,
    dbEquipments,
    dbFeedPumps,
    dbBackwashPumps,
    dbOnKlorlama,
  ]);

  const aktifSecimler = useMemo(() => {
    if (!idealDegerler) return null;

    const currentSeparatorDebi =
      selectedSeparatorDebi || idealDegerler.idealEquipDebi;
    const currentKumDebi = selectedKumDebi || idealDegerler.idealEquipDebi;
    const currentKarbonDebi =
      selectedKarbonDebi || idealDegerler.idealEquipDebi;

    const currentFeedDebi = selectedFeedDebi || idealDegerler.idealFeedDebi;
    const currentBwDebi = selectedBwDebi || idealDegerler.idealBwDebi;
    const currentKlorPompaId =
      selectedKlorPompaId || idealDegerler.idealKlorPompaRow?.id;
    const currentKlorTankId =
      selectedKlorTankId || idealDegerler.idealKlorTankRow?.id;

    const feedMatch =
      dbFeedPumps.find((p) => p.debi === currentFeedDebi) || {};
    const bwMatch =
      dbBackwashPumps.find((b) => b.geri_yikama_debi === currentBwDebi) || {};
    const pompaMatch =
      dbOnKlorlama.find((x) => x.id === parseInt(currentKlorPompaId)) || {};
    const tankMatch =
      dbOnKlorlama.find((x) => x.id === parseInt(currentKlorTankId)) || {};

    const pompaKapasite = pompaMatch.ekipman_adi
      ? pompaMatch.ekipman_adi.match(/\(([^)]+)\)/)?.[1] ||
      pompaMatch.ekipman_adi
      : "";

    const tankKapasite = tankMatch.ekipman_adi
      ? parseFloat(
        tankMatch.ekipman_adi.match(/(\d+)\s*(lt|Litre)/i)?.[1]
      ) || ""
      : "";

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
      klorTankAdi: tankMatch.ekipman_adi || "—",
      dozajPompasiKapasitesi: pompaKapasite,
      kimyasalTankKapasitesi: tankKapasite,
    };
  }, [
    idealDegerler,
    selectedSeparatorDebi,
    selectedKumDebi,
    selectedKarbonDebi,
    selectedFeedDebi,
    selectedBwDebi,
    selectedKlorPompaId,
    selectedKlorTankId,
    dbFeedPumps,
    dbBackwashPumps,
    dbOnKlorlama,
  ]);

  useEffect(() => {
    if (anaGunlukDebi === 0 || dbEquipments.length === 0 || !aktifSecimler)
      return;

    const filtrasyonOzeti = {
      calismaSaati: activeCalismaSaati,
      thirdTreatmentBOD: thirdTreatmentBODInput,
      sistemAdet: idealDegerler.sistemAdet,
      calculatedMainDebi: anaGunlukDebi,
      onKlorlama: {
        pompaId: aktifSecimler.klorPompaId,
        pompaAdi: aktifSecimler.klorPompaAdi,
        tankId: aktifSecimler.klorTankId,
        tankAdi: aktifSecimler.klorTankAdi,
        dozajPompasiKapasitesi: aktifSecimler.dozajPompasiKapasitesi,
        kimyasalTankKapasitesi: aktifSecimler.kimyasalTankKapasitesi,
      },
      pompalar: {
        besleme: { debiM3h: aktifSecimler.feedDebi, kw: aktifSecimler.feedKw },
        geriYikama: { debiM3h: aktifSecimler.bwDebi, kw: aktifSecimler.bwKw },
      },
      SecilenFiltreler: {
        seperatorFiltre: {
          isim: "SEPERATÖR FİLTRE",
          debiM3h: aktifSecimler.separatorDebi,
        },
        kumFiltre: {
          isim: "KUM FİLTRE SİSTEMİ",
          debiM3h: aktifSecimler.kumDebi,
        },
        aktifKarbonFiltre: {
          isim: "AKTİF KARBON FİLTRE SİSTEMİ",
          debiM3h: aktifSecimler.karbonDebi,
        },
      },
    };

    updateSection("equipments", {
      ...equipmentsCache,
      filtrationSystem: filtrasyonOzeti,
    });
  }, [
    anaGunlukDebi,
    activeCalismaSaati,
    thirdTreatmentBODInput,
    aktifSecimler,
    idealDegerler.sistemAdet,
  ]);

  const handleInputChange = (e) => {
    const { value } = e.target;
    updateSection("equipments", {
      ...equipmentsCache,
      filtrationSystem: {
        ...storeFiltration,
        calismaSaati: value,
        calculatedMainDebi: anaGunlukDebi,
      },
    });
  };

  const handleBodChange = (e) => {
    const { value } = e.target;
    updateSection("equipments", {
      ...equipmentsCache,
      filtrationSystem: {
        ...storeFiltration,
        thirdTreatmentBOD: value,
        calculatedMainDebi: anaGunlukDebi,
      },
    });
  };

  const handleDropdownUpdate = (payload) => {
    updateSection("equipments", {
      ...equipmentsCache,
      filtrationSystem: {
        ...storeFiltration,
        ...payload,
      },
    });
  };

  const handleResetClick = () => {
    if (anaGunlukDebi === 0) return;
    updateSection("equipments", {
      ...equipmentsCache,
      filtrationSystem: {
        calismaSaati: "22",
        thirdTreatmentBOD: defaultThirdTreatmentBOD,
        calculatedMainDebi: anaGunlukDebi,
        onKlorlama: undefined,
        pompalar: undefined,
        SecilenFiltreler: undefined,
      },
    });
  };

  if (isLoading || dbEquipments.length === 0 || !aktifSecimler) {
    return (
      <div
        className="d-flex flex-column gap-2 p-3 justify-content-center align-items-center"
        style={{ minHeight: "150px" }}
      >
        <div
          className="spinner-border spinner-border-sm text-success"
          role="status"
        ></div>
        <span className="text-white-50" style={{ fontSize: "11px" }}>
          Filtrasyon Teknik Verileri Senkronize Ediliyor...
        </span>
      </div>
    );
  }

  const uniqueEquipOptions = Array.from(
    new Set(dbEquipments.map((i) => i.debi))
  ).sort((a, b) => a - b);
  const uniqueFeedOptions = Array.from(
    new Set(dbFeedPumps.map((i) => i.debi))
  ).sort((a, b) => a - b);

  return (
    <div className="d-flex flex-column gap-3 text-white">
      {/* BAŞLIK BÖLÜMÜ VE YENİLEME BUTONU */}
      <div className="d-flex align-items-center justify-content-between">
        <span
          className="fw-bold text-uppercase pe-2"
          style={{
            fontSize: "11px",
            letterSpacing: "0.7px",
            color: "#00874e",
          }}
        >
          1. Filtrasyon Parametreleri
        </span>
        <div className="d-flex align-items-center flex-grow-1 gap-2">
          <div
            className="flex-grow-1 border-bottom"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          ></div>
          <button
            onClick={handleResetClick}
            disabled={anaGunlukDebi === 0}
            className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
            style={{
              backgroundColor: "#d97706",
              fontSize: "11px",
              borderRadius: "6px",
            }}
            title="Tabloyu İlk Ayarlarına Döndür"
          >
            🔄 Yenile
          </button>
        </div>
      </div>

      {/* ANA PARAMETRE GİRİŞ PANELİ */}
      <div
        className="p-3 rounded"
        style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}
      >
        <div className="row g-3 align-items-end">
          {/* SOL GRUP (INPUTLAR) */}
          <div
            className="col-xl-6 col-md-12 border-end-xl"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}
          >
            <div className="row g-2 align-items-end">
              <div className="col-md-4 col-12 d-flex flex-column justify-content-end">
                <label
                  className="form-label mb-1 text-white-50 text-truncate"
                  style={{ fontSize: "11px", minHeight: "32px", display: "flex", alignItems: "flex-end" }}
                  title="Günlük Sistem Debisi"
                >
                  Günlük Sistem Debisi
                </label>
                <div
                  className="form-control form-control-sm text-white fw-bold border-0 text-center d-flex align-items-center justify-content-center"
                  style={{
                    backgroundColor: "#1e293b",
                    height: "32px",
                    fontSize: "12px",
                  }}
                >
                  {anaGunlukDebi.toFixed(1)} m³/gün
                </div>
              </div>

              <div className="col-md-4 col-12 d-flex flex-column justify-content-end">
                <label
                  className="form-label mb-1 text-warning text-truncate"
                  style={{ fontSize: "11px", fontWeight: "600", minHeight: "32px", display: "flex", alignItems: "flex-end" }}
                  title="Çalışma Süresi (saat/gün)"
                >
                  Çalışma Süresi (saat/gün)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  className="form-control form-control-sm text-white fw-bold border-0 text-center"
                  style={{
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    border: "1px solid #f59e0b",
                    borderRadius: "6px",
                    fontSize: "12px",
                    height: "32px",
                  }}
                  value={calismaSaatiInput}
                  onChange={handleInputChange}
                />
              </div>

              <div className="col-md-4 col-12 d-flex flex-column justify-content-end">
                <label
                  className="form-label mb-1 text-info"
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    minHeight: "32px",
                    display: "flex",
                    alignItems: "flex-end",
                    lineHeight: "1.2"
                  }}
                  title="Üçüncül Arıtma Sonrası BOİ"
                >
                  Üçüncül Arıtma Sonrası BOİ
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm text-white fw-bold border-0 text-center"
                  style={{
                    backgroundColor: "rgba(14, 165, 233, 0.15)",
                    border: "1px solid #0ea5e9",
                    borderRadius: "6px",
                    fontSize: "12px",
                    height: "32px",
                  }}
                  value={thirdTreatmentBODInput}
                  onChange={handleBodChange}
                />
              </div>
            </div>
          </div>

          {/* SAĞ GRUP (SONUÇLAR) */}
          <div className="col-xl-6 col-md-12">
            <div className="row g-2 align-items-end">
              <div className="col-4 d-flex flex-column justify-content-end">
                <label
                  className="form-label mb-1 text-white-50"
                  style={{ fontSize: "11px", minHeight: "32px", display: "flex", alignItems: "flex-end" }}
                >
                  Toplam Tasarım Debisi
                </label>
                <div
                  className="form-control form-control-sm text-success fw-bold border-0 text-center d-flex align-items-center justify-content-center"
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    height: "32px",
                    fontSize: "12px",
                  }}
                >
                  {idealDegerler.toplamSaatlikDebi.toFixed(2)} m³/h
                </div>
              </div>

              <div className="col-4 d-flex flex-column justify-content-end">
                <label
                  className="form-label mb-1 text-warning"
                  style={{ fontSize: "11px", minHeight: "32px", display: "flex", alignItems: "flex-end" }}
                >
                  Gerekli Sistem Adedi
                </label>
                <div
                  className="form-control form-control-sm text-warning fw-bold border-0 text-center d-flex align-items-center justify-content-center"
                  style={{
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    height: "32px",
                    fontSize: "12px",
                  }}
                >
                  {idealDegerler.sistemAdet} Adet
                </div>
              </div>

              <div className="col-4 d-flex flex-column justify-content-end">
                <label
                  className="form-label mb-1 text-info"
                  style={{ fontSize: "11px", minHeight: "32px", display: "flex", alignItems: "flex-end" }}
                >
                  Hat Başına Tasarım Debisi
                </label>
                <div
                  className="form-control form-control-sm text-info fw-bold border-0 text-center d-flex align-items-center justify-content-center"
                  style={{
                    backgroundColor: "rgba(14, 165, 233, 0.1)",
                    height: "32px",
                    fontSize: "12px",
                  }}
                >
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
            <span
              className="fw-bold text-uppercase pe-2"
              style={{
                fontSize: "11px",
                letterSpacing: "0.7px",
                color: "#00874e",
              }}
            >
              2. Ön Klorlama & Solüsyon Ünitesi (Hat Başına)
            </span>
            <div
              className="flex-grow-1 border-bottom"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            ></div>
          </div>
          <div className="row g-2">
            <div className="col-md-6">
              <div
                className="p-2 rounded d-flex justify-content-between align-items-center h-100"
                style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
              >
                <div className="flex-grow-1 me-2">
                  <span
                    className="text-white-50 d-block"
                    style={{ fontSize: "9px" }}
                  >
                    DOZAJ POMPASI KAPASİTESİ & BASINCI
                  </span>
                  <select
                    className="form-select form-select-sm text-white border-0 py-0 fw-bold mt-1 shadow-none"
                    style={{
                      backgroundColor: "transparent",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                    value={aktifSecimler.klorPompaId}
                    onChange={(e) =>
                      handleDropdownUpdate({
                        onKlorlama: {
                          ...storeFiltration.onKlorlama,
                          pompaId: e.target.value,
                        },
                      })
                    }
                  >
                    {dbOnKlorlama
                      .filter((i) => i.ekipman_tipi === "pompa")
                      .map((p) => (
                        <option
                          key={p.id}
                          value={p.id}
                          style={{ backgroundColor: "#1e293b", color: "#fff" }}
                        >
                          {p.ekipman_adi}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div
                className="p-2 rounded d-flex justify-content-between align-items-center h-100"
                style={{ backgroundColor: "#1e293b", border: "1px solid #38bdf8" }}
              >
                <div className="flex-grow-1 me-2">
                  <span
                    className="text-white-50 d-block"
                    style={{ fontSize: "9px" }}
                  >
                    SOLÜSYON TANKI HACMİ
                  </span>
                  <select
                    className="form-select form-select-sm text-white border-0 py-0 fw-bold mt-1 shadow-none"
                    style={{
                      backgroundColor: "transparent",
                      fontSize: "12px",
                      cursor: "pointer",
                      color: "#38bdf8",
                    }}
                    value={aktifSecimler.klorTankId}
                    onChange={(e) =>
                      handleDropdownUpdate({
                        onKlorlama: {
                          ...storeFiltration.onKlorlama,
                          tankId: e.target.value,
                        },
                      })
                    }
                  >
                    {dbOnKlorlama
                      .filter((i) => i.ekipman_tipi === "tank")
                      .map((t) => (
                        <option
                          key={t.id}
                          value={t.id}
                          style={{ backgroundColor: "#1e293b", color: "#fff" }}
                        >
                          {t.ekipman_adi}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3: POMPA GRUPLARI */}
        <div className="d-flex flex-column gap-2">
          <div className="d-flex align-items-center">
            <span
              className="fw-bold text-uppercase pe-2"
              style={{
                fontSize: "11px",
                letterSpacing: "0.7px",
                color: "#00874e",
              }}
            >
              3. Pompa Grupları (Hat Başına)
            </span>
            <div
              className="flex-grow-1 border-bottom"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            ></div>
          </div>
          <div className="row g-2">
            <div className="col-md-6">
              <div
                className="p-2 rounded d-flex justify-content-between align-items-center h-100"
                style={{ backgroundColor: "#1e293b", border: "1px solid #ef4444" }}
              >
                <div className="flex-grow-1 me-2">
                  <span
                    className="text-white-50 d-block"
                    style={{ fontSize: "9px" }}
                  >
                    BESLEME SİSTEMİ
                  </span>
                  <select
                    className="form-select form-select-sm text-white border-0 py-0 fw-bold mt-1 shadow-none"
                    style={{
                      backgroundColor: "transparent",
                      fontSize: "12px",
                      cursor: "pointer",
                      color: "#f87171",
                    }}
                    value={aktifSecimler.feedDebi}
                    onChange={(e) =>
                      handleDropdownUpdate({
                        pompalar: {
                          ...storeFiltration.pompalar,
                          besleme: {
                            ...storeFiltration.pompalar?.besleme,
                            debiM3h: parseFloat(e.target.value),
                          },
                        },
                      })
                    }
                  >
                    {uniqueFeedOptions.map((d) => (
                      <option
                        key={d}
                        value={d}
                        style={{ backgroundColor: "#1e293b", color: "#fff" }}
                      >
                        Q: {d.toFixed(2)} m³/h
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-end">
                  <span
                    className="badge bg-danger text-white fw-bold d-block"
                    style={{ fontSize: "10px" }}
                  >
                    {aktifSecimler.feedKw} kW
                  </span>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div
                className="p-2 rounded d-flex justify-content-between align-items-center h-100"
                style={{ backgroundColor: "#1e293b", border: "1px solid #a855f7" }}
              >
                <div className="flex-grow-1 me-2">
                  <span
                    className="text-white-50 d-block"
                    style={{ fontSize: "9px" }}
                  >
                    GERİ YIKAMA POMPASI
                  </span>
                  <select
                    className="form-select form-select-sm text-white border-0 py-0 fw-bold mt-1 shadow-none"
                    style={{
                      backgroundColor: "transparent",
                      fontSize: "12px",
                      cursor: "pointer",
                      color: "#c084fc",
                    }}
                    value={aktifSecimler.bwDebi}
                    onChange={(e) =>
                      handleDropdownUpdate({
                        pompalar: {
                          ...storeFiltration.pompalar,
                          geriYikama: {
                            ...storeFiltration.pompalar?.geriYikama,
                            debiM3h: parseFloat(e.target.value),
                          },
                        },
                      })
                    }
                  >
                    {dbBackwashPumps.map((b) => (
                      <option
                        key={b.id}
                        value={b.geri_yikama_debi}
                        style={{ backgroundColor: "#1e293b", color: "#fff" }}
                      >
                        Q: {b.geri_yikama_debi} m³/h
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-end">
                  <span
                    className="badge text-white fw-bold d-block"
                    style={{ fontSize: "10px", backgroundColor: "#a855f7" }}
                  >
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
            <span
              className="fw-bold text-uppercase pe-2"
              style={{
                fontSize: "11px",
                letterSpacing: "0.7px",
                color: "#00874e",
              }}
            >
              4. Filtreler (Hat Başına)
            </span>
            <div
              className="flex-grow-1 border-bottom"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            ></div>
          </div>
          <div className="row g-2">
            <div className="col-md-4">
              <div
                className="p-2 rounded d-flex justify-content-between align-items-center h-100"
                style={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
              >
                <div className="flex-grow-1 me-2">
                  <span
                    className="text-white-50 d-block"
                    style={{ fontSize: "9px" }}
                  >
                    SEPERATÖR FİLTRE
                  </span>
                  <select
                    className="form-select form-select-sm text-white border-0 py-0 fw-bold mt-1 shadow-none"
                    style={{
                      backgroundColor: "transparent",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                    value={aktifSecimler.separatorDebi}
                    onChange={(e) =>
                      handleDropdownUpdate({
                        SecilenFiltreler: {
                          ...storeFiltration.SecilenFiltreler,
                          seperatorFiltre: {
                            isim: "SEPERATÖR FİLTRE",
                            debiM3h: parseFloat(e.target.value),
                          },
                        },
                      })
                    }
                  >
                    {uniqueEquipOptions.map((d) => (
                      <option
                        key={d}
                        value={d}
                        style={{ backgroundColor: "#1e293b", color: "#fff" }}
                      >
                        {d} m³/h
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div
                className="p-2 rounded d-flex justify-content-between align-items-center h-100"
                style={{ backgroundColor: "#1e293b", border: "1px solid #10b981" }}
              >
                <div className="flex-grow-1 me-2">
                  <span
                    className="text-success d-block fw-semibold"
                    style={{ fontSize: "9px" }}
                  >
                    KUM FİLTRE SİSTEMİ
                  </span>
                  <select
                    className="form-select form-select-sm border-0 py-0 fw-bold mt-1 shadow-none"
                    style={{
                      backgroundColor: "transparent",
                      fontSize: "12px",
                      cursor: "pointer",
                      color: "#10b981",
                    }}
                    value={aktifSecimler.kumDebi}
                    onChange={(e) =>
                      handleDropdownUpdate({
                        SecilenFiltreler: {
                          ...storeFiltration.SecilenFiltreler,
                          kumFiltre: {
                            isim: "KUM FİLTRE SİSTEMİ",
                            debiM3h: parseFloat(e.target.value),
                          },
                        },
                      })
                    }
                  >
                    {uniqueEquipOptions.map((d) => (
                      <option
                        key={d}
                        value={d}
                        style={{ backgroundColor: "#1e293b", color: "#fff" }}
                      >
                        {d} m³/h
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div
                className="p-2 rounded d-flex justify-content-between align-items-center h-100"
                style={{ backgroundColor: "#1e293b", border: "1px solid #f59e0b" }}
              >
                <div className="flex-grow-1 me-2">
                  <span
                    className="text-warning d-block fw-semibold"
                    style={{ fontSize: "9px" }}
                  >
                    AKTİF KARBON FİLTRE SİSTEMİ
                  </span>
                  <select
                    className="form-select form-select-sm border-0 py-0 fw-bold mt-1 shadow-none"
                    style={{
                      backgroundColor: "transparent",
                      fontSize: "12px",
                      cursor: "pointer",
                      color: "#f59e0b",
                    }}
                    value={aktifSecimler.karbonDebi}
                    onChange={(e) =>
                      handleDropdownUpdate({
                        SecilenFiltreler: {
                          ...storeFiltration.SecilenFiltreler,
                          aktifKarbonFiltre: {
                            isim: "AKTİF KARBON FİLTRE SİSTEMİ",
                            debiM3h: parseFloat(e.target.value),
                          },
                        },
                      })
                    }
                  >
                    {uniqueEquipOptions.map((d) => (
                      <option
                        key={d}
                        value={d}
                        style={{ backgroundColor: "#1e293b", color: "#fff" }}
                      >
                        {d} m³/h
                      </option>
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