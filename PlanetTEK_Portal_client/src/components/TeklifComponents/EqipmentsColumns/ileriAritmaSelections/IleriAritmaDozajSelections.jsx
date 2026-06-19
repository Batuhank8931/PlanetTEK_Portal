import React, { useMemo, useEffect } from "react";
import { useTeklifStore } from "../../../../utils/teklifStore"; // Store yolunu kontrol edin

function IleriAritmaDozajSelections() {
  // 1. ZUSTAND STORE BAĞLANTISI
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  // Gerekli verileri store'un ilgili düğümlerinden dinamik ve güvenli bir şekilde süzüyoruz
  const diskDetails = formData.planetDiskDetails || {};
  const debi = parseFloat(diskDetails.debi) || 0; // m3/gün cinsinden debi

  const equipmentsCache = formData.equipments || {};
  const storeIleriAritma = equipmentsCache.ileriAritma || {};
  const inputSelections = storeIleriAritma.IleriAritmaInputSelections || {};
  const storeDozajSelections = storeIleriAritma.IleriAritmaDozajSelections || {};

  // Global veya bu adıma ait bir stok günü tanımı (yoksa varsayılan 30 gün)
  const stokGunu = parseFloat(formData.stokGunu) || 30;

  // Standart piyasa tank hacimlerine yukarı yuvarlama yardımcı fonksiyonu
  const getStandardTankVolume = (requiredLiters) => {
    if (requiredLiters <= 0) return 0;
    const commercialVolumes = [100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000];
    const matched = commercialVolumes.find((v) => v >= requiredLiters);
    return matched || Math.ceil(requiredLiters / 1000) * 1000; // Eğer 10 tondan büyükse en yakın binliğe yuvarla
  };

  // 2. SAF MATEMATİKSEL HESAPLAMA (useMemo)
  const hesaplananDegerler = useMemo(() => {
    const girisP = parseFloat(inputSelections.girisToplamFosfor) || 10; // mg/L
    const cikisP = parseFloat(inputSelections.cikisToplamFosfor) || 3; // mg/L
    const katsayi = parseFloat(inputSelections.gerekliFeKatsayisi) || 2.7;

    // Giderilecek Fosfor yükü kontrolü
    const giderilecekP = Math.max(0, girisP - cikisP);

    // 1. Gerekli Fe Miktarı (kg/gün) = (Q * ΔP * katsayi) / 1000
    const gerekliFe = (debi * giderilecekP * katsayi) / 1000;

    // 2. Gerekli FeCl3 Miktarı (kg/gün)
    const gerekliFeCl3 = gerekliFe * (60 / 26);

    // 3. %40'lık FeCl3 Çözelti Miktarı (Litre/gün)
    const cozeltiLitreGun = gerekliFeCl3 / 1.43 / (40 / 100);

    // 4. Pompa Saatlik Debisi (L/saat)
    const pompaSaatlikDebi = cozeltiLitreGun / 24;

    // 5. Pompa Adedi Hesabı (Standart pompa: 5 L/saat) -> Math.ceil ile Tamsayı
    const standartPompaKapasitesi = 5;
    const pompaAdedi = pompaSaatlikDebi > 0 ? Math.ceil(pompaSaatlikDebi / standartPompaKapasitesi) : 1;

    // 6. Gerekli Tank Hacmi (Litre)
    const tankHacmiLitre = cozeltiLitreGun * stokGunu;
    const standartTankHacmi = getStandardTankVolume(tankHacmiLitre);

    return {
      gerekliFe,
      gerekliFeCl3,
      cozeltiLitreGun,
      pompaSaatlikDebi,
      pompaAdedi,
      tankHacmiLitre,
      standartTankHacmi
    };
  }, [debi, inputSelections, stokGunu]);

  // 3. HESAPLANAN VERİLERİN MERKEZİ STORE'A BAĞLANMASI (Sonsuz döngü korumalı useEffect)
  useEffect(() => {
    if (debi > 0) {
      const currentPompaAdedi = parseInt(storeDozajSelections.pompaAdedi ?? hesaplananDegerler.pompaAdedi, 10) || 1;
      const dozajPompasiString = `${currentPompaAdedi} Adet Dozaj Pompası (5 L/h @ 5 Bar)`;
      
      const currentTankHacmi = storeDozajSelections.standartTankHacmi ?? hesaplananDegerler.standartTankHacmi;
      const kimyasalTankString = currentTankHacmi > 0 
        ? `${Number(currentTankHacmi).toFixed(2)} Litre FeCl₃ Kimyasal Depolama Tankı` 
        : "---";

      // Sadece verilerde gerçekten bir değişiklik varsa store'u güncelle
      if (
        storeDozajSelections.dozajPompasi !== dozajPompasiString ||
        storeDozajSelections.kimyasalTanki !== kimyasalTankString ||
        storeDozajSelections.gerekliFe === undefined // İlk yükleme kontrolü
      ) {
        updateSection("equipments", {
          ...equipmentsCache,
          ileriAritma: {
            ...storeIleriAritma,
            IleriAritmaDozajSelections: {
              gerekliFe: storeDozajSelections.gerekliFe ?? hesaplananDegerler.gerekliFe,
              gerekliFeCl3: storeDozajSelections.gerekliFeCl3 ?? hesaplananDegerler.gerekliFeCl3,
              cozeltiLitreGun: storeDozajSelections.cozeltiLitreGun ?? hesaplananDegerler.cozeltiLitreGun,
              pompaSaatlikDebi: storeDozajSelections.pompaSaatlikDebi ?? hesaplananDegerler.pompaSaatlikDebi,
              pompaAdedi: currentPompaAdedi,
              tankHacmiLitre: storeDozajSelections.tankHacmiLitre ?? hesaplananDegerler.tankHacmiLitre,
              standartTankHacmi: storeDozajSelections.standartTankHacmi ?? hesaplananDegerler.standartTankHacmi,
              dozajPompasi: dozajPompasiString,
              kimyasalTanki: kimyasalTankString
            }
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hesaplananDegerler]);

  // Manuel Input Değişim Yönetimi
  const handleInputChange = (field, value) => {
    // Pompa adedi için tamsayı (int), diğer alanlar için float dönüşümü yapıyoruz
    const numValue = value === "" ? "" : (field === "pompaAdedi" ? parseInt(value, 10) : parseFloat(value)) || 0;
    
    let ekAlanlar = {};
    if (field === "tankHacmiLitre" && numValue !== "") {
      ekAlanlar.standartTankHacmi = getStandardTankVolume(numValue);
    }

    updateSection("equipments", {
      ...equipmentsCache,
      ileriAritma: {
        ...storeIleriAritma,
        IleriAritmaDozajSelections: {
          ...storeDozajSelections,
          [field]: numValue,
          ...ekAlanlar
        }
      }
    });
  };

  // Inputlar için ortak şeffaf stil şablonu
  const inputStyle = {
    background: "transparent",
    border: "none",
    color: "inherit",
    fontWeight: "bold",
    fontSize: "11px",
    textAlign: "right",
    width: "80px",
    outline: "none",
    padding: 0
  };

  // Değerleri güvenli formatlayan yardımcı fonksiyon (isInt parametresi true ise virgülsüz basar)
  const formatValue = (storeVal, calcVal, isInt = false) => {
    const val = storeVal ?? calcVal;
    if (val === undefined || val === "") return "";
    return isInt ? parseInt(val, 10).toString() : Number(val).toFixed(2);
  };

  return (
    <div className="card-body d-flex flex-column gap-3" style={{ position: "relative", color: "#fff", padding: 0 }}>

      {/* BAŞLIK BÖLÜMÜ */}
      <div className="d-flex align-items-center flex-grow-1">
        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
          3. Dozaj Sistemi
        </span>
        <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
      </div>

      {/* SONUÇ KARTLARI PANELİ */}
      <div className="row g-2">

        {/* Sol Kolon: Kütlesel ve Hacimsel Gereksinimler */}
        <div className="col-md-6 d-flex flex-column gap-2">

          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Gerekli Saf Fe Miktarı:</span>
            <div className="d-flex align-items-center gap-1 text-white">
              <input
                type="number"
                step="0.01"
                style={inputStyle}
                value={formatValue(storeDozajSelections.gerekliFe, hesaplananDegerler.gerekliFe)}
                onChange={(e) => handleInputChange("gerekliFe", e.target.value)}
              />
              <span className="text-white-50" style={{ fontSize: "9px" }}>kg/gün</span>
            </div>
          </div>

          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Gerekli Saf FeCl₃ Miktarı:</span>
            <div className="d-flex align-items-center gap-1 text-white">
              <input
                type="number"
                step="0.01"
                style={inputStyle}
                value={formatValue(storeDozajSelections.gerekliFeCl3, hesaplananDegerler.gerekliFeCl3)}
                onChange={(e) => handleInputChange("gerekliFeCl3", e.target.value)}
              />
              <span className="text-white-50" style={{ fontSize: "9px" }}>kg/gün</span>
            </div>
          </div>

          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #00874e" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>%40 Çözelti İhtiyacı:</span>
            <div className="d-flex align-items-center gap-1 text-success">
              <input
                type="number"
                step="0.01"
                style={{ ...inputStyle, color: "#198754" }}
                value={formatValue(storeDozajSelections.cozeltiLitreGun, hesaplananDegerler.cozeltiLitreGun)}
                onChange={(e) => handleInputChange("cozeltiLitreGun", e.target.value)}
              />
              <span style={{ fontSize: "9px" }}>L/gün</span>
            </div>
          </div>

        </div>

        {/* Sağ Kolon: Pompa ve Tank Boyutlandırma */}
        <div className="col-md-6 d-flex flex-column gap-2">

          {/* Pompa Saatlik Debisi */}
          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Pompa Saatlik Debisi:</span>
            <div className="d-flex align-items-center gap-1 text-white">
              <input
                type="number"
                step="0.01"
                style={inputStyle}
                value={formatValue(storeDozajSelections.pompaSaatlikDebi, hesaplananDegerler.pompaSaatlikDebi)}
                onChange={(e) => handleInputChange("pompaSaatlikDebi", e.target.value)}
              />
              <span className="text-white-50" style={{ fontSize: "9px" }}>L/saat</span>
            </div>
          </div>

          {/* DİNAMİK POMPA ADEDİ KUTUSU (TAMSAYI - INT) */}
          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #ef4444" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Gerekli Pompa Adedi (5 L/h @ 5 Bar):</span>
            <div className="d-flex align-items-center gap-1 text-danger">
              <input
                type="number"
                step="1"
                style={{ ...inputStyle, color: "#dc3545" }}
                value={formatValue(storeDozajSelections.pompaAdedi, hesaplananDegerler.pompaAdedi, true)}
                onChange={(e) => handleInputChange("pompaAdedi", e.target.value)}
              />
              <span style={{ fontSize: "9px" }}>Adet</span>
            </div>
          </div>

          {/* Tank Hacmi Kutusu */}
          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #38bdf8" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Gerekli Tank Hacmi ({stokGunu} Gün):</span>
            <div className="d-flex align-items-center gap-1 text-info">
              <input
                type="number"
                step="0.01"
                style={{ ...inputStyle, color: "#0dcaf0", width: "65px" }}
                value={formatValue(storeDozajSelections.tankHacmiLitre, hesaplananDegerler.tankHacmiLitre)}
                onChange={(e) => handleInputChange("tankHacmiLitre", e.target.value)}
              />
              <span style={{ fontSize: "9px" }}>Litre</span>
              {((storeDozajSelections.standartTankHacmi ?? hesaplananDegerler.standartTankHacmi) > 0) && (
                <span className="text-warning ms-1" style={{ fontSize: "10px", whiteSpace: "nowrap" }}>
                  (Seçilen: {Number(storeDozajSelections.standartTankHacmi ?? hesaplananDegerler.standartTankHacmi).toFixed(2)} L)
                </span>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export default IleriAritmaDozajSelections;