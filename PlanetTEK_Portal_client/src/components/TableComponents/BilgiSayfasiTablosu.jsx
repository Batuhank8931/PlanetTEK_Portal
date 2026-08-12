import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";
import API from "../../utils/utilRequest";

function BilgiSayfasiTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const teklifDili = formData?.customerInfo?.teklifDili;
  const isForeign = teklifDili === "Yabancı";

  // 🌟 Döviz ve Birim Sistemi Parametrelerini Çekiyoruz
  const currency = formData?.customerInfo?.currency || "EUR";
  const unitSystem = formData?.customerInfo?.unitSystem || "Metric";
  const exchangeRate = parseFloat(formData?.customerInfo?.exchangeRate) || 1.0000;

  const storeBilgiSayfasi = formData?.tables?.bilgisayfasitablosu;
  const pDetails = formData?.planetDiskDetails?.tasarim?.aritmaParametreleri || {};
  const equipmentsObject = formData.equipments || {};
  const { modulesState = {} } = equipmentsObject;

  const isFiltrasyonChecked = modulesState.filtrasyon?.checked || false;

  const activeLocale = isForeign ? "en-US" : "tr-TR";

  const formatNumber = (value, minFraction = 0, maxFraction = 2) => {
    if (isNaN(value)) return "0";
    return value.toLocaleString(activeLocale, {
      minimumFractionDigits: minFraction,
      maximumFractionDigits: maxFraction
    });
  };

  const [uniteCapMap, setUniteCapMap] = useState({ MX: 2.05, MINI: 1.30 });
  const [loading, setLoading] = useState(true);

  const currentUniteType = pDetails.RBCUnite || "MX";
  const currentCapMeters = uniteCapMap[currentUniteType] || 2.05;

  // 🌟 US modunda çapı feet (ft) cinsine çeviriyoruz (1 m = 3.28084 ft)
  const displayCap = unitSystem === "US" ? currentCapMeters * 3.28084 : currentCapMeters;
  const currentRadius = displayCap / 2;
  const capUnit = unitSystem === "US" ? "ft" : "m";

  useEffect(() => {
    const fetchParameters = async () => {
      try {
        const response = await API.getParamteters();
        const apiData = response.data || [];
        const paramMap = {};
        apiData.forEach(item => {
          paramMap[item.parametre_key] = parseFloat(item.deger);
        });
        setUniteCapMap({
          MX: paramMap["mx1Cap"] || 2.05,
          MINI: paramMap["miniCap"] || 1.30
        });
      } catch (error) {
        console.error("Parametre verileri backend'den yüklenirken hata oldu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchParameters();
  }, []);

  // 🌟 PROJE DETAYLARI VE DİNAMİK BİRİM MOTORU
  const generateProjectDetails = () => {
    const kaynaklar = pDetails.kaynaklar || [];
    const hesapYontemi = pDetails.hesapYontemi;

    let totalKisi = 0;
    let weightedOrganikYukSum = 0;
    let weightedHidrolikYukSum = 0;

    kaynaklar.forEach(k => {
      const kisi = parseFloat(k.kisiSayisi) || 0;
      totalKisi += kisi;
      weightedOrganikYukSum += (kisi * (parseFloat(k.organikYuk) || 0));
      weightedHidrolikYukSum += (kisi * (parseFloat(k.hidrolikYuk) || 0));
    });

    const avgOrganikYuk = totalKisi > 0 ? (weightedOrganikYukSum / totalKisi) : 0;
    const avgHidrolikYukMetric = totalKisi > 0 ? (weightedHidrolikYukSum / totalKisi) : 0;

    // 🌟 US modunda kişi başı hidrolik yükü galona çevir (1 litre = 0.264172 galon)
    const avgHidrolikYuk = unitSystem === "US" ? avgHidrolikYukMetric * 0.264172 : avgHidrolikYukMetric;
    const hidrolikKisiBirim = unitSystem === "US" ? "gal/PE.day" : (isForeign ? "lt/PE.day" : "lt/kişi.gün");

    const debiM3 = pDetails.debi || 0;
    // 🌟 Ekrandaki debi birimi çevrimi
    const displayDebi = unitSystem === "US" ? debiM3 * 264.172 : debiM3;
    const debiBirim = unitSystem === "US" ? "GPD" : (isForeign ? "m³/day" : "m³/gün");

    const girisBoi = pDetails.girisBoi || 0;
    const organikYukKg = (debiM3 * girisBoi) / 1000;

    // 🌟 US modunda organik yükü lbs cinsine çevir (1 kg = 2.20462 lbs)
    const displayOrganikYuk = unitSystem === "US" ? organikYukKg * 2.20462 : organikYukKg;
    const kütleBirim = unitSystem === "US" ? "lbs/day" : (isForeign ? "kg/day" : "kg/gün");

    const giderimVerimi = pDetails.giderimVerimi || 33;
    const giderilenYuk = (organikYukKg * giderimVerimi) / 100;
    const displayGiderilenYuk = unitSystem === "US" ? giderilenYuk * 2.20462 : giderilenYuk;

    const girenYuk = organikYukKg - giderilenYuk;
    const displayGirenYuk = unitSystem === "US" ? girenYuk * 2.20462 : girenYuk;

    const yerlesim = formData?.planetDiskDetails?.tasarim?.yerlesimSiralanisi || [];
    const rbcSiralari = yerlesim.filter(y => !y.isLamella);
    const toplamMilAdet = rbcSiralari.reduce((sum, item) => sum + (parseInt(item.adet) || 0), 0);

    const toplamDiskSayisi = rbcSiralari.reduce((sum, item) => {
      const milAdet = parseInt(item.adet) || 0;
      const diskAdet = parseInt(item.milBasinaDisk) || 0;
      return sum + (milAdet * diskAdet);
    }, 0);

    const beklemeSuresi = rbcSiralari[0]?.beklemeSuresi || 0;

    const lamellaObj = formData?.planetDiskDetails?.tasarim?.lamella || {};
    const lamellaAdet = parseInt(lamellaObj.lamellaAdet) || 0;
    const lamellaAlaniMetric = parseFloat(lamellaObj.secilenModelAlan) || 0;

    // 🌟 US modunda alanları sq.ft (ft²) cinsine çevir (1 m² = 10.7639 ft²)
    const displayLamellaAlani = unitSystem === "US" ? lamellaAlaniMetric * 10.7639 : lamellaAlaniMetric;
    const alanBirim = unitSystem === "US" ? "ft²" : "m²";

    const lamellaModeliRaw = lamellaObj.secilenLamellaModeli || "LS 45";
    const lamellaModeli = lamellaModeliRaw.replace("_", " ");

    const rows = [];

    if (hesapYontemi === "kisi") {
      rows.push(
        {
          id: "d1",
          label: isForeign ? "Capacity" : "Kapasite",
          value: isForeign ? `: ${formatNumber(totalKisi, 0, 0)} PE` : `: ${formatNumber(totalKisi, 0, 0)} Kişi`
        },
        {
          id: "d2",
          label: isForeign ? "Hydraulic Load Per Person" : "Kişi Başı Hidrolik Yük",
          value: `: ${formatNumber(avgHidrolikYuk, 0, 1)} ${hidrolikKisiBirim}`
        },
        {
          id: "d3",
          label: isForeign ? "Organic Load Per Person" : "Kişi Başı Organik Yük",
          value: isForeign ? `: ${formatNumber(avgOrganikYuk, 0, 0)} gr/PE.day` : `: ${formatNumber(avgOrganikYuk, 0, 0)} gr/kişi.gün`
        }
      );
    }

    rows.push(
      {
        id: "d4",
        label: isForeign ? "Hydraulic Load" : "Hidrolik Yük",
        value: `: ${formatNumber(displayDailyUsage, 0, 2)} ${debiBirim}`
      },
      {
        id: "d5",
        label: isForeign ? "Organic Load" : "Organik Yük",
        value: isForeign
          ? `: ${formatNumber(displayOrganikYuk, 2, 2)} ${kütleBirim} (${formatNumber(displayDailyUsage, 0, 2)} ${debiBirim} x ${formatNumber(girisBoi, 0, 0)} mg/l)`
          : `: ${formatNumber(displayOrganikYuk, 2, 2)} ${kütleBirim} (${formatNumber(displayDailyUsage, 0, 2)} ${debiBirim} x ${formatNumber(girisBoi, 0, 0)} mg/l)`
      },
      {
        id: "d6",
        label: isForeign ? "Elimination of BOD in Pre Treatment" : "Ön Arıtmada Giderilen Organik Yük",
        value: isForeign
          ? `: ${formatNumber(displayGiderilenYuk, 2, 2)} ${kütleBirim} ( ${formatNumber(giderimVerimi, 0, 0)}% )`
          : `: ${formatNumber(displayGiderilenYuk, 2, 2)} ${kütleBirim} ( ${formatNumber(giderimVerimi, 0, 0)}% )`
      },
      {
        id: "d7",
        label: isForeign ? "Treated Organic Load in PlanetDISK® RBC Unit" : "PlanetDISK® Ünitesine Giren Organik Yük",
        value: `: ${formatNumber(displayGirenYuk, 2, 2)} ${kütleBirim}`
      },
      {
        id: "d8",
        label: isForeign ? "Wastewater Temperature" : "Atıksu Sıcaklığı",
        value: isForeign
          ? `: Min ${minTemp}${tempUnit}-Max ${maxTemp}${tempUnit}`
          : `: Min ${minTemp}${tempUnit}-Maks ${maxTemp}${tempUnit}`
      },
      {
        id: "d9",
        label: isForeign ? "Accepted Temperature" : "Kabul Edilen Atıksu Sıcaklığı",
        value: `: ${formatNumber(acceptedTemp, 0, 0)} ${tempUnit}`
      },
      {
        id: "d10",
        label: isForeign ? "Wastewater Retention Time in PlanetDISK® RBC Unit" : "Atıksuyun PlanetDISK® Ünitesinde Bekleme Süresi",
        value: isForeign ? `: ${formatNumber(beklemeSuresi, 0, 2)} hours (>45 minutes minimum)` : `: ${formatNumber(beklemeSuresi, 0, 2)} saat (>45 dakika minimum)`
      }
    );

    const rbcLines = rbcSiralari.map((item, idx) => {
      const adet = parseInt(item.adet) || 0;
      const milDisk = parseInt(item.milBasinaDisk) || 0;
      return isForeign
        ? `· ${formatNumber(adet, 0, 0)} PlanetDISK® ${currentUniteType} 1 units - ${formatNumber(milDisk, 0, 0)} disks of ${formatNumber(displayCap, 2, 2)} ${capUnit} diameter disks, GRP (fiber glass) housing.`
        : `· ${formatNumber(adet, 0, 0)} adet PlanetDISK® ${currentUniteType} 1 ünitesi (${formatNumber(milDisk, 0, 0)} diskli) - Toplam ${formatNumber(adet * milDisk, 0, 0)} adet, ${formatNumber(displayCap, 2, 2)} ${capUnit} çaplı disk, CTP (fiber) gövde.`;
    });

    // Disk Yüzey Alanı Çevrimi (Metric: 6.6 m², US: 6.6 * 10.7639 = ~71.04 sq.ft)
    const tekDiskAlani = unitSystem === "US" ? 6.6 * 10.7639 : 6.6;
    const toplamYuzeyAlani = toplamDiskSayisi * tekDiskAlani;
    const yuzeyAlaniDetayMetni = rbcSiralari.map(item => `${formatNumber(parseInt(item.milBasinaDisk), 0, 0)} disk x ${formatNumber(tekDiskAlani, 1, 2)} ${alanBirim} x ${formatNumber(parseInt(item.adet), 0, 0)} ${isForeign ? "units" : "adet"}`).join(" + ");

    const systemLines = [
      ...rbcLines,
      isForeign
        ? `· TOTAL ${formatNumber(toplamDiskSayisi, 0, 0)} disks x ${formatNumber(tekDiskAlani, 1, 2)} ${alanBirim} x ${formatNumber(toplamMilAdet, 0, 0)} units = ${formatNumber(toplamYuzeyAlani, 1, 1)} ${alanBirim} surface area.`
        : `· TOPLAM YÜZEY ALANI: ${yuzeyAlaniDetayMetni} = ${formatNumber(toplamYuzeyAlani, 1, 1)} ${alanBirim} yüzey alanı.`,
      isForeign
        ? `· ${formatNumber(lamellaAdet, 0, 0)} ${lamellaModeli} Lamella Separator final sedimentation tank, GRP (fiberglass) body.`
        : `· ${formatNumber(lamellaAdet, 0, 0)} adet ${lamellaModeli} Lamella Seperatör Çökeltim Tankı, CTP (fiber) gövde.`,
      isForeign
        ? `· TOTAL ${formatNumber(displayLamellaAlani, 0, 0)} ${alanBirim} x ${formatNumber(lamellaAdet, 0, 0)} units = ${formatNumber(displayLamellaAlani * lamellaAdet, 0, 0)} ${alanBirim} lamella surface area.`
        : `· TOPLAM ${formatNumber(displayLamellaAlani, 0, 0)} ${alanBirim} x ${formatNumber(lamellaAdet, 0, 0)} adet = ${formatNumber(displayLamellaAlani * lamellaAdet, 0, 0)} ${alanBirim} lamella yüzey alanı.`
    ].join("\n");

    return {
      rows,
      toplamDiskSayisi,
      toplamMilAdet,
      systemText: systemLines,
      totalKisi,
      hesapYontemi
    };
  };

  const displayDailyUsage = unitSystem === "US" ? (pDetails.debi || 0) * 264.172 : (pDetails.debi || 0);
  const debiTopBirim = unitSystem === "US" ? "GPD" : (isForeign ? "m³/day" : "m³/gün");

  const [data, setData] = useState({
    title1: "", title2: "", title3: "", detailsHeader: "PROJE DETAYLARI",
    projectDetails: [], noteText: "", sourceHeader: "", sourceText: "",
    systemHeader: "", systemText: "", calcHeader: "", calcText: ""
  });

  const [history, setHistory] = useState([]);

  // 🌟 Title2 Oluşturma Yardımcı Fonksiyonu
  const buildTitle2 = (detailsInfo) => {
    const isKisiMode = detailsInfo.hesapYontemi === "kisi";
    const usageSuffix = isFiltrasyonChecked 
      ? (isForeign ? "Irrigation / Reuse" : "Sulama/Geri Kazanım") 
      : (isForeign ? "Discharge to Nature" : "Alıcı Ortama Deşarj");

    if (isKisiMode) {
      const formattedKisi = formatNumber(detailsInfo.totalKisi, 0, 0);
      return isForeign
        ? `${formattedKisi} (People Equivalent) Capacity - ${usageSuffix}`
        : `${formattedKisi} PE Kapasiteli - ${usageSuffix}`;
    } else {
      const formattedUsage = formatNumber(displayDailyUsage, 0, 2);
      return isForeign
        ? `${formattedUsage} ${debiTopBirim} Capacity - ${usageSuffix}`
        : `${formattedUsage} ${debiTopBirim} Kapasiteli - ${usageSuffix}`;
    }
  };

  // 🌟 Birim sistemi, döviz veya dil değiştiğinde tüm başlık ve içerikleri dinamik tetikle
  useEffect(() => {
    if (loading) return;

    const detailsInfo = generateProjectDetails();
    setData({
      title1: formData?.customerInfo?.ticari_unvan || (isForeign ? "CUSTOMER COMMERCIAL TITLE" : "MÜŞTERI TİCARİ ÜNVANI"),
      title2: buildTitle2(detailsInfo),
      title3: isForeign
        ? "Rotating Biological Contactor (RBC) Sewage Treatment Plant (STP) Offer"
        : "Dönen Biyolojik Disk Atıksu Arıtma Tesisi Teklifi",
      detailsHeader: isForeign ? "PROJECT INFO" : "PROJE DETAYLARI",
      projectDetails: detailsInfo.rows,
      noteText: isForeign
        ? "*These parameters are directly given by client. / chosen according to our experiences and literature reviews."
        : "Bu parametreler müşteri tarafından verilmiştir/ deneyimlerimiz ve literatür değerlerine göre seçilmiştir.",
      sourceHeader: isForeign ? "Wastewater Source" : "Atıksu Kaynağı",
      sourceText: isForeign
        ? "Only domestic wastewater from toilets, sinks, shower, dishwash and laundry.\nWastewater should not contain any chemicals which is harmful for the bacteria inside wastewater.\nRainwater and swimming pool water which may contain chlorine and chemicals should not be allowed into the ST system. Fat, Oil and Grease (FOG) should not be allowed into the system.\nWastewater from kitchens definitely should pass through oil traps in kitchens."
        : "Tuvaletlerden ve her türlü tüketimden kaynaklanan evsel atıksular alınacaktır.\nTesise yemekhanelerden kaynaklanan yağ içerikli atıksular yağ kapanından geçirilmeden alınmayacaktır. Ayrıca yağmur suyu girişi olmayacaktır.",
      systemHeader: isForeign ? "Proposed System" : "Önerilen Sistem",
      systemText: detailsInfo.systemText,
      calcHeader: isForeign ? "Disk Surface Area Calculation" : "Disk Yüzey Alanı Hesaplaması",
      calcText: isForeign
        ? `π x r x r x 2 sides x ${formatNumber(detailsInfo.toplamDiskSayisi, 0, 0)} disks/unit -> 3.14 x ${formatNumber(currentRadius, 3, 3)} x ${formatNumber(currentRadius, 3, 3)} x 2 x ${formatNumber(detailsInfo.toplamDiskSayisi, 0, 0)} = ${formatNumber(3.14 * currentRadius * currentRadius * 2 * detailsInfo.toplamDiskSayisi, 1, 1)} ${unitSystem === "US" ? "ft²" : "m²"}/unit`
        : `π x r x r x 2 taraf x ${formatNumber(detailsInfo.toplamDiskSayisi, 0, 0)} disk -> 3.14 x ${formatNumber(currentRadius, 3, 3)} x ${formatNumber(currentRadius, 3, 3)} x 2 x ${formatNumber(detailsInfo.toplamDiskSayisi, 0, 0)} = ${formatNumber(3.14 * currentRadius * currentRadius * 2 * detailsInfo.toplamDiskSayisi, 1, 1)} ${unitSystem === "US" ? "ft²" : "m²"}`
    });
  }, [loading, unitSystem, currency, exchangeRate, teklifDili, pDetails.debi, pDetails.hesapYontemi, pDetails.kaynaklar, isFiltrasyonChecked]);

  useEffect(() => {
    if (loading || data.projectDetails.length === 0) return;
    updateSection("tables", {
      ...formData?.tables,
      bilgisayfasitablosu: data
    });
  }, [data, loading]);

  const saveToHistory = (currentState) => {
    setHistory([...history, JSON.stringify(currentState)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setData(JSON.parse(history[history.length - 1]));
    setHistory(history.slice(0, -1));
  };

  const handleRefresh = () => {
    setHistory([]);
    const detailsInfo = generateProjectDetails();
    setData({
      title1: formData?.customerInfo?.ticari_unvan || (isForeign ? "CUSTOMER COMMERCIAL TITLE" : "MÜŞTERI TİCARİ ÜNVANI"),
      title2: buildTitle2(detailsInfo),
      title3: isForeign
        ? "Rotating Biological Contactor (RBC) Sewage Treatment Plant (STP) Offer"
        : "Dönen Biyolojik Disk Atıksu Arıtma Tesisi Teklifi",
      detailsHeader: isForeign ? "PROJECT INFO" : "PROJE DETAYLARI",
      projectDetails: detailsInfo.rows,
      noteText: isForeign
        ? "*These parameters are directly given by client. / chosen according to our experiences and literature reviews."
        : "Bu parametreler müşteri tarafından verilmiştir/ deneyimlerimiz ve literatür değerlerine göre seçilmiştir.",
      sourceHeader: isForeign ? "Wastewater Source" : "Atıksu Kaynağı",
      sourceText: isForeign
        ? "Only domestic wastewater from toilets, sinks, shower, dishwash and laundry.\nWastewater should not contain any chemicals which is harmful for the bacteria inside wastewater.\nRainwater and swimming pool water which may contain chlorine and chemicals should not be allowed into the ST system. Fat, Oil and Grease (FOG) should not be allowed into the system.\nWastewater from kitchens definitely should pass through oil traps in kitchens."
        : "Tuvaletlerden ve her türlü tüketimden kaynaklanan evsel atıksular alınacaktır.\nTesise yemekhanelerden kaynaklanan yağ içerikli atıksular yağ kapanından geçirilmeden alınmayacaktır. Ayrıca yağmur suyu girişi olmayacaktır.",
      systemHeader: isForeign ? "Proposed System" : "Önerilen Sistem",
      systemText: detailsInfo.systemText,
      calcHeader: isForeign ? "Disk Surface Area Calculation" : "Disk Yüzey Alanı Hesaplaması",
      calcText: isForeign
        ? `π x r x r x 2 sides x ${formatNumber(detailsInfo.toplamDiskSayisi, 0, 0)} disks/unit -> 3.14 x ${formatNumber(currentRadius, 3, 3)} x ${formatNumber(currentRadius, 3, 3)} x 2 x ${formatNumber(detailsInfo.toplamDiskSayisi, 0, 0)} = ${formatNumber(3.14 * currentRadius * currentRadius * 2 * detailsInfo.toplamDiskSayisi, 1, 1)} ${unitSystem === "US" ? "ft²" : "m²"}/unit`
        : `π x r x r x 2 taraf x ${formatNumber(detailsInfo.toplamDiskSayisi, 0, 0)} disk -> 3.14 x ${formatNumber(currentRadius, 3, 3)} x ${formatNumber(currentRadius, 3, 3)} x 2 x ${formatNumber(detailsInfo.toplamDiskSayisi, 0, 0)} = ${formatNumber(3.14 * currentRadius * currentRadius * 2 * detailsInfo.toplamDiskSayisi, 1, 1)} ${unitSystem === "US" ? "ft²" : "m²"}`
    });
  };

  const handleTextChange = (field, value) => {
    saveToHistory(data);
    setData({ ...data, [field]: value });
  };

  const handleRowChange = (id, field, value) => {
    saveToHistory(data);
    const updatedRows = data.projectDetails.map(row => row.id === id ? { ...row, [field]: value } : row);
    setData({ ...data, projectDetails: updatedRows });
  };

  const insertAfterRow = (index) => {
    saveToHistory(data);
    const newId = `detail_${Date.now()}`;
    const newRow = { id: newId, label: isForeign ? "New Parameter" : "Yeni Parametre", value: ": Value" };
    const updatedRows = [...data.projectDetails];
    updatedRows.splice(index + 1, 0, newRow);
    setData({ ...data, projectDetails: updatedRows });
  };

  const deleteRow = (id) => {
    saveToHistory(data);
    const updatedRows = data.projectDetails.filter(row => row.id !== id);
    setData({ ...data, projectDetails: updatedRows });
  };

  const toFahrenheit = (celsius) => Math.round(celsius * 1.8 + 32);

  const tempUnit = unitSystem === "US" ? "°F" : "°C";

  const minTemp = unitSystem === "US" ? toFahrenheit(15) : 15;
  const maxTemp = unitSystem === "US" ? toFahrenheit(32) : 32;

  const acceptedTempRaw = pDetails.sicaklik || 19;
  const acceptedTemp = unitSystem === "US" ? toFahrenheit(acceptedTempRaw) : acceptedTempRaw;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5 text-white-50">
        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
        <span>{isForeign ? "Loading backend parameters and disk diameters..." : "Backend parametreleri ve disk çapları yükleniyor..."}</span>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3 w-100 text-white">
      <style>{`
        .info-input { background: transparent; border: none; box-shadow: none; color: white; width: 100%; }
        .info-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.05); border-radius: 4px; }
        .info-textarea { resize: none; overflow: hidden; }
        .detail-row { border-bottom: 1px solid #334155; transition: background-color 0.15s ease; }
        .detail-row:last-child { border-bottom: none; }
        .bg-normal { background-color: #1e293b; }
        .section-header { font-size: 14px; font-weight: 800; text-decoration: underline; text-align: center; text-underline-offset: 4px; }
      `}</style>

      {/* ÜST PANEL AKSIYONLARI VE AKTİF MOD BADGE'İ */}
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="badge fw-bold py-2 px-3" style={{ backgroundColor: "#0f172a", color: "#fbbf24", border: "1px solid #475569", fontSize: "11px" }}>
          {currency} - {unitSystem} Modu
        </span>
        <div className="d-flex align-items-center gap-2">
          <button onClick={handleRefresh} className="btn btn-sm px-3 fw-semibold text-white border-0" style={{ backgroundColor: "#d97706", fontSize: "11px", borderRadius: "6px" }}>
            🔄 {isForeign ? "Refresh" : "Yenile"}
          </button>
          <button onClick={handleUndo} disabled={history.length === 0} className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center justify-content-center border-0" style={{ backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a", fontSize: "11px", borderRadius: "6px", opacity: history.length === 0 ? 0.4 : 1 }}>
            ↶
          </button>
        </div>
      </div>

      <div className="d-flex flex-column p-4 rounded-3 border" style={{ backgroundColor: "#0f172a", borderColor: "#334155" }}>
        <div className="d-flex flex-column align-items-center gap-1 mb-5">
          <input type="text" className="info-input text-center fw-extrabold" style={{ fontSize: "20px" }} value={data.title1} onChange={(e) => handleTextChange("title1", e.target.value)} />
          <input type="text" className="info-input text-center fw-bold" style={{ fontSize: "16px" }} value={data.title2} onChange={(e) => handleTextChange("title2", e.target.value)} />
          <input type="text" className="info-input text-center fw-bold" style={{ fontSize: "16px" }} value={data.title3} onChange={(e) => handleTextChange("title3", e.target.value)} />
        </div>

        <div className="mb-4">
          <input type="text" className="info-input section-header mb-3" value={data.detailsHeader} onChange={(e) => handleTextChange("detailsHeader", e.target.value)} />
          <div className="w-100" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <div className="d-flex flex-column rounded-3 overflow-hidden border" style={{ borderColor: "#334155", minWidth: "600px" }}>
              {data.projectDetails.map((row, index) => (
                <div key={row.id} className="d-flex align-items-stretch detail-row bg-normal">
                  <div className="p-2 px-3 d-flex align-items-center" style={{ width: "45%" }}>
                    <input type="text" className="info-input fw-bold" style={{ fontSize: "12px" }} value={row.label} onChange={(e) => handleRowChange(row.id, "label", e.target.value)} />
                  </div>
                  <div className="p-2 px-3 d-flex align-items-center" style={{ width: "45%" }}>
                    <input type="text" className="info-input" style={{ fontSize: "12px" }} value={row.value} onChange={(e) => handleRowChange(row.id, "value", e.target.value)} />
                  </div>
                  <div className="p-1 d-flex align-items-center justify-content-center gap-2 border-start" style={{ width: "10%", borderColor: "rgba(255,255,255,0.1) !important" }}>
                    <button onClick={() => insertAfterRow(index)} className="btn btn-sm p-0 border-0 text-success opacity-50 opacity-hover fw-bold" style={{ fontSize: "15px", lineHeight: "1" }}>+</button>
                    <button onClick={() => deleteRow(row.id)} className="btn btn-sm p-0 border-0 text-danger opacity-50 opacity-hover" style={{ fontSize: "16px", lineHeight: "1" }}>&times;</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 text-center">
            <input type="text" className="info-input fw-bold text-center" style={{ fontSize: "11px", color: "#94a3b8" }} value={data.noteText} onChange={(e) => handleTextChange("noteText", e.target.value)} />
          </div>
        </div>

        <div className="mb-4">
          <input type="text" className="info-input section-header mb-2" value={data.sourceHeader} onChange={(e) => handleTextChange("sourceHeader", e.target.value)} />
          <textarea className="info-input info-textarea text-center" rows={isForeign ? 6 : 3} style={{ fontSize: "13px", lineHeight: "1.6" }} value={data.sourceText} onChange={(e) => handleTextChange("sourceText", e.target.value)} />
        </div>

        <div className="mb-4">
          <input type="text" className="info-input section-header mb-2" value={data.systemHeader} onChange={(e) => handleTextChange("systemHeader", e.target.value)} />
          <textarea className="info-input info-textarea" rows={6} style={{ fontSize: "13px", lineHeight: "1.6", paddingLeft: "5%" }} value={data.systemText} onChange={(e) => handleTextChange("systemText", e.target.value)} />
        </div>

        <div className="mb-2">
          <input type="text" className="info-input section-header mb-2" value={data.calcHeader} onChange={(e) => handleTextChange("calcHeader", e.target.value)} />
          <input type="text" className="info-input text-center" style={{ fontSize: "13px" }} value={data.calcText} onChange={(e) => handleTextChange("calcText", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

export default BilgiSayfasiTablosu;