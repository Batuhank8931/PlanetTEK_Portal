import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";
import API from "../../utils/utilRequest";

function BilgiSayfasiTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const storeBilgiSayfasi = formData?.tables?.bilgisayfasitablosu;
  const pDetails = formData?.planetDiskDetails?.tasarim?.aritmaParametreleri || {};
  const equipmentsObject = formData.equipments || {};
  const { modulesState = {} } = equipmentsObject;

  const isFiltrasyonChecked = modulesState.filtrasyon?.checked || false;

  const [uniteCapMap, setUniteCapMap] = useState({ MX: 2.05, MINI: 1.30 });
  const [loading, setLoading] = useState(true);

  const currentUniteType = pDetails.RBCUnite || "MX";
  const currentCap = uniteCapMap[currentUniteType] || 2.05;
  const currentRadius = currentCap / 2;

  // 1. ADIM: Çap Parametrelerini Backend'den Çekme
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

  // Proje detaylarını ve dinamik metinleri hesaplayan ana motor
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

    const avgOrganikYuk = totalKisi > 0 ? (weightedOrganikYukSum / totalKisi).toFixed(0) : "0";
    const avgHidrolikYuk = totalKisi > 0 ? (weightedHidrolikYukSum / totalKisi).toFixed(0) : "0";

    const debiM3 = pDetails.debi || 0;
    const girisBoi = pDetails.girisBoi || 0;
    const organikYukKg = ((debiM3 * girisBoi) / 1000).toFixed(2);
    const giderimVerimi = pDetails.giderimVerimi || 33;
    const giderilenYuk = ((organikYukKg * giderimVerimi) / 100).toFixed(2);
    const girenYuk = (organikYukKg - giderilenYuk).toFixed(2);

    const yerlesim = formData?.planetDiskDetails?.tasarim?.yerlesimSiralanisi || [];
    const rbcSiralari = yerlesim.filter(y => !y.isLamella);
    const toplamMilAdet = rbcSiralari.reduce((sum, item) => sum + (parseInt(item.adet) || 0), 0);
    const milBasinaDisk = rbcSiralari[0]?.milBasinaDisk || 0;
    const toplamDiskSayisi = toplamMilAdet * milBasinaDisk;
    const beklemeSuresi = rbcSiralari[0]?.beklemeSuresi || 0;

    // --- LAMELLA VERİLERİNİ ÇEKME ALANI ---
    const lamellaObj = formData?.planetDiskDetails?.tasarim?.lamella || {};
    const lamellaAdet = parseInt(lamellaObj.lamellaAdet) || 0;
    const lamellaAlani = parseFloat(lamellaObj.secilenModelAlan) || 0;
    const lamellaModeliRaw = lamellaObj.secilenLamellaModeli || "LS 45";
    const lamellaModeli = lamellaModeliRaw.replace("_", " ");

    const rows = [];

    if (hesapYontemi === "kisi") {
      rows.push(
        { id: "d1", label: "Kapasite", value: `: ${totalKisi.toLocaleString(undefined)} Kişi` },
        { id: "d2", label: "Kişi Başı Hidrolik Yük", value: `: ${avgHidrolikYuk} lt/kişi.gün` },
        { id: "d3", label: "Kişi Başı Organik Yük", value: `: ${avgOrganikYuk} gr/kişi.gün` }
      );
    }

    rows.push(
      { id: "d4", label: "Hidrolik Yük", value: `: ${debiM3} m³/gün` },
      { id: "d5", label: "Organik Yük", value: `: ${organikYukKg} kg/gün (${debiM3} m³/gün x ${girisBoi} mg/l)` },
      { id: "d6", label: "Ön Arıtmada Giderilen Organik Yük", value: `: ${giderilenYuk} kg/gün ( ${giderimVerimi}% )` },
      { id: "d7", label: "PlanetDISK® Ünitesine Giren Organik Yük", value: `: ${girenYuk} kg/gün` },
      { id: "d8", label: "Atıksu Sıcaklığı", value: `: Min 15°C-Maks 32°C` },
      { id: "d9", label: "Kabul Edilen Atıksu Sıcaklığı", value: `: ${pDetails.sicaklik || 19} °C` },
      { id: "d10", label: "Atıksuyun PlanetDISK® Ünitesinde Bekleme Süresi", value: `: ${beklemeSuresi} saat (>45 dakika minimum)` }
    );

    const systemLines = [
      `· ${toplamMilAdet} adet PlanetDISK® ${currentUniteType} 1 ünitesi - ${toplamDiskSayisi} adet, ${currentCap} m çaplı disk, CTP (fiber) gövde.`,
      `· TOPLAM ${milBasinaDisk} disk x 6.6 m² x ${toplamMilAdet} adet = ${(toplamDiskSayisi * 6.6).toFixed(1)} m² yüzey alanı.`,
      `· ${lamellaAdet} adet ${lamellaModeli} Lamella Seperatör Çökeltim Tankı, CTP (fiber) gövde.`,
      `· TOPLAM ${lamellaAlani.toFixed(0)} m² x ${lamellaAdet} adet = ${(lamellaAlani * lamellaAdet).toFixed(0)} m² lamella yüzey alanı.`
    ].join("\n");

    return {
      rows,
      toplamDiskSayisi,
      toplamMilAdet,
      systemText: systemLines
    };
  };

  // 2. ADIM: Lazy Initialization Mantığı
  const [data, setData] = useState({
    title1: "", title2: "", title3: "", detailsHeader: "PROJE DETAYLARI",
    projectDetails: [], noteText: "", sourceHeader: "", sourceText: "",
    systemHeader: "", systemText: "", calcHeader: "", calcText: ""
  });

  const [history, setHistory] = useState([]);

  // 3. ADIM: İlk kurulumda store verisini koruma veya sıfırdan üretme
  useEffect(() => {
    if (loading) return;

    if (storeBilgiSayfasi && data.projectDetails.length > 0) {
      return;
    }

    if (storeBilgiSayfasi && storeBilgiSayfasi.projectDetails?.length > 0) {
      setData(storeBilgiSayfasi);
    } else {
      const detailsInfo = generateProjectDetails();
      setData({
        title1: formData?.customerInfo?.ticariUnvan || "MÜŞTERİ TİCARİ ÜNVANI",
        title2: `${pDetails.debi || 0} m³/gün Kapasiteli - ${isFiltrasyonChecked ? "Sulama/Geri Kazanım" : "Alıcı Ortama Deşarj"}`,
        title3: "Dönen Biyolojik Disk Atıksu Arıtma Tesisi Teklifi",
        detailsHeader: "PROJE DETAYLARI",
        projectDetails: detailsInfo.rows,
        noteText: "Bu parametreler müşteri tarafından verilmiştir/ deneyimlerimiz ve literatür değerlerine göre seçilmiştir.",
        sourceHeader: "Atıksu Kaynağı",
        sourceText: "Tuvaletlerden and her türlü tüketimden kaynaklanan evsel atıksular alınacaktır.\nTesise yemekhanelerden kaynaklanan yağ içerikli atıksular yağ kapanından geçirilmeden alınmayacaktır. Ayrıca yağmur suyu girişi olmayacaktır.",
        systemHeader: "Önerilen Sistem",
        systemText: detailsInfo.systemText,
        calcHeader: "Disk Yüzey Alanı Hesaplaması",
        calcText: `π x r x r x 2 taraf x ${detailsInfo.toplamDiskSayisi} disk -> 3,14 x ${currentRadius.toFixed(3)} x ${currentRadius.toFixed(3)} x 2 x ${detailsInfo.toplamDiskSayisi} = ${(3.14 * currentRadius * currentRadius * 2 * detailsInfo.toplamDiskSayisi).toFixed(1)} m²`
      });
    }
  }, [loading, storeBilgiSayfasi]);

  // 4. ADIM: Local State değiştikçe store senkronizasyonu
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

  // 5. ADIM: REFRESH BUTONU (Lamella satırları da dahil asenkron formüle döner)
  const handleRefresh = () => {
    setHistory([]);
    const detailsInfo = generateProjectDetails();
    setData({
      title1: formData?.customerInfo?.ticariUnvan || "MÜŞTERİ TİCARİ ÜNVANI",
      title2: `${pDetails.debi || 0} m³/gün Kapasiteli - ${isFiltrasyonChecked ? "Sulama/Geri Kazanım" : "Alıcı Ortama Deşarj"}`,
      title3: "Dönen Biyolojik Disk Atıksu Arıtma Tesisi Teklifi",
      detailsHeader: "PROJE DETAYLARI",
      projectDetails: detailsInfo.rows,
      noteText: "Bu parametreler müşteri tarafından verilmiştir/ deneyimlerimiz ve literatür değerlerine göre seçilmiştir.",
      sourceHeader: "Atıksu Kaynağı",
      sourceText: "Tuvaletlerden ve her türlü tüketimden kaynaklanan evsel atıksular alınacaktır.\nTesise yemekhanelerden kaynaklanan yağ içerikli atıksular yağ kapanından geçirilmeden alınmayacaktır. Ayrıca yağmur suyu girişi olmayacaktır.",
      systemHeader: "Önerilen Sistem",
      systemText: detailsInfo.systemText, // <-- Artık burası da tam dinamik lamella satırlarını alıyor
      calcHeader: "Disk Yüzey Alanı Hesaplaması",
      calcText: `π x r x r x 2 taraf x ${detailsInfo.toplamDiskSayisi} disk -> 3,14 x ${currentRadius.toFixed(3)} x ${currentRadius.toFixed(3)} x 2 x ${detailsInfo.toplamDiskSayisi} = ${(3.14 * currentRadius * currentRadius * 2 * detailsInfo.toplamDiskSayisi).toFixed(1)} m²`
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
    const newRow = { id: newId, label: "Yeni Parametre", value: ": Değer" };
    const updatedRows = [...data.projectDetails];
    updatedRows.splice(index + 1, 0, newRow);
    setData({ ...data, projectDetails: updatedRows });
  };

  const deleteRow = (id) => {
    saveToHistory(data);
    const updatedRows = data.projectDetails.filter(row => row.id !== id);
    setData({ ...data, projectDetails: updatedRows });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5 text-white-50">
        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
        <span>Backend parametreleri ve disk çapları yükleniyor...</span>
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

      <div className="d-flex justify-content-end align-items-center gap-2 mb-1">
        <button onClick={handleRefresh} className="btn btn-sm px-3 fw-semibold text-white border-0" style={{ backgroundColor: "#d97706", fontSize: "11px", borderRadius: "6px" }}>
          🔄 Yenile
        </button>
        <button onClick={handleUndo} disabled={history.length === 0} className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0" style={{ backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a", fontSize: "11px", borderRadius: "6px", opacity: history.length === 0 ? 0.4 : 1 }}>
          ↶
        </button>
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
          <textarea className="info-input info-textarea text-center" rows={3} style={{ fontSize: "13px", lineHeight: "1.6" }} value={data.sourceText} onChange={(e) => handleTextChange("sourceText", e.target.value)} />
        </div>

        <div className="mb-4">
          <input type="text" className="info-input section-header mb-2" value={data.systemHeader} onChange={(e) => handleTextChange("systemHeader", e.target.value)} />
          <textarea className="info-input info-textarea" rows={5} style={{ fontSize: "13px", lineHeight: "1.6", paddingLeft: "5%" }} value={data.systemText} onChange={(e) => handleTextChange("systemText", e.target.value)} />
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