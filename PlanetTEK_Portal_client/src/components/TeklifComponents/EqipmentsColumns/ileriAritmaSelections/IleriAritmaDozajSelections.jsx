import React, { useMemo, useEffect, useState } from "react";
import { useTeklifStore } from "../../../../utils/teklifStore"; 
import API from "../../../../utils/utilRequest";

function IleriAritmaDozajSelections({ inputParams }) {

  // 1. STATE TANIMLAMALARI
  const [apiEquipments, setApiEquipments] = useState([]); 
  const [loading, setLoading] = useState(false);

  // 2. ZUSTAND STORE BAĞLANTISI
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const diskDetails = formData.planetDiskDetails || {};
  const debi = parseFloat(diskDetails.debi) || 0; 

  const equipmentsCache = formData.equipments || {};
  const storeIleriAritma = equipmentsCache.ileriAritma || {};
  const storeDozajSelections = storeIleriAritma.IleriAritmaDozajSelections || {};

  // API'den gelen ekipmanları çekip filtrelemeye hazır hale getirme
  const fetchEquipmentsData = async () => {
    try {
      setLoading(true);
      const response = await API.getIlerAritmaEquipmentsCosts();
      setApiEquipments(response.data || []);
    } catch (error) {
      console.error("Ekipman verileri yüklenirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipmentsData();
  }, []);

  // Pompa ve Tank listelerini tiplerine göre ayırıyoruz
  const availablePumps = useMemo(() => apiEquipments.filter(e => e.ekipman_tipi === "pompa"), [apiEquipments]);
  const availableTanks = useMemo(() => apiEquipments.filter(e => e.ekipman_tipi === "tank"), [apiEquipments]);

  const stokGunu = parseFloat(formData.stokGunu) || 30;

  // --- PARAMETRE DEĞİŞİM KONTROLÜ (inputParams veya debi değişti mi?) ---
  const girisP = parseFloat(inputParams?.girisToplamFosfor); 
  const cikisP = parseFloat(inputParams?.cikisToplamFosfor); 
  const katsayi = parseFloat(inputParams?.gerekliFeKatsayisi);

  const isParamsChanged = 
    storeDozajSelections.lastGirisP !== undefined && (
      storeDozajSelections.lastGirisP !== girisP ||
      storeDozajSelections.lastCikisP !== cikisP ||
      storeDozajSelections.lastKatsayi !== katsayi ||
      storeDozajSelections.lastDebi !== debi
    );

  // 3. SAF MATEMATİKSEL HESAPLAMA VE OTOMATİK EKİPMAN SEÇİMİ
  const hesaplananDegerler = useMemo(() => {
    const giderilecekP = Math.max(0, girisP - cikisP);
    const gerekliFe = (debi * giderilecekP * katsayi) / 1000;
    const gerekliFeCl3 = gerekliFe * (60 / 26);
    const cozeltiLitreGun = gerekliFeCl3 / 1.43 / (40 / 100);
    const pompaSaatlikDebi = cozeltiLitreGun / 24;

    // --- OTOMATİK POMPA SEÇİMİ ---
    let otomatikPompa = null;
    let pompaAdedi = 1;

    if (pompaSaatlikDebi > 0 && availablePumps.length > 0) {
      const sortedPumps = [...availablePumps].sort((a, b) => {
        const capA = parseFloat(a.ekipman_adi.match(/(\d+)\s*L\/h/)?.[1]) || 5;
        const capB = parseFloat(b.ekipman_adi.match(/(\d+)\s*L\/h/)?.[1]) || 5;
        return capA - capB;
      });

      let found = sortedPumps.find(p => {
        const cap = parseFloat(p.ekipman_adi.match(/(\d+)\s*L\/h/)?.[1]) || 5;
        return cap >= pompaSaatlikDebi;
      });

      if (found) {
        otomatikPompa = found;
        pompaAdedi = 1;
      } else {
        otomatikPompa = sortedPumps[sortedPumps.length - 1];
        const maxCap = parseFloat(otomatikPompa?.ekipman_adi.match(/(\d+)\s*L\/h/)?.[1]) || 5;
        pompaAdedi = Math.ceil(pompaSaatlikDebi / maxCap);
      }
    } else {
      otomatikPompa = availablePumps[0] || null;
    }

    // --- OTOMATİK TANK SEÇİMİ ---
    const tankHacmiLitre = cozeltiLitreGun * stokGunu;
    let otomatikTank = null;

    if (tankHacmiLitre > 0 && availableTanks.length > 0) {
      const sortedTanks = [...availableTanks].sort((a, b) => {
        const volA = parseFloat(a.ekipman_adi.match(/(\d+)\s*(lt|Litre)/i)?.[1]) || 0;
        const volB = parseFloat(b.ekipman_adi.match(/(\d+)\s*(lt|Litre)/i)?.[1]) || 0;
        return volA - volB;
      });

      let foundTank = sortedTanks.find(t => {
        const vol = parseFloat(t.ekipman_adi.match(/(\d+)\s*(lt|Litre)/i)?.[1]) || 0;
        return vol >= tankHacmiLitre;
      });

      otomatikTank = foundTank || sortedTanks[sortedTanks.length - 1];
    } else {
      otomatikTank = availableTanks[0] || null;
    }

    return {
      gerekliFe,
      gerekliFeCl3,
      cozeltiLitreGun,
      pompaSaatlikDebi,
      pompaAdedi,
      tankHacmiLitre,
      otomatikPompaId: otomatikPompa ? String(otomatikPompa.id) : "", 
      otomatikTankId: otomatikTank ? String(otomatikTank.id) : ""     
    };
  }, [debi, girisP, cikisP, katsayi, stokGunu, availablePumps, availableTanks]);

  // 4. OTOMATİK İLK YÜKLEME VE DEBİ/GİRİŞ PARAMETRELERİ DEĞİŞİM SENKRONİZASYONU
  useEffect(() => {
    if ((debi > 0 || girisP > 0) && apiEquipments.length > 0) {
      // Parametreler değiştiyse otomatik hesaplanan ekipmana dön
      const finalPompaId = (storeDozajSelections.secilenPompaId === undefined || isParamsChanged) 
        ? hesaplananDegerler.otomatikPompaId 
        : String(storeDozajSelections.secilenPompaId);

      const finalTankId = (storeDozajSelections.secilenTankId === undefined || isParamsChanged) 
        ? hesaplananDegerler.otomatikTankId 
        : String(storeDozajSelections.secilenTankId);
      
      const currentPompaAdedi = isParamsChanged 
        ? hesaplananDegerler.pompaAdedi 
        : (parseInt(storeDozajSelections.pompaAdedi ?? hesaplananDegerler.pompaAdedi, 10) || 1);

      const secilenPompaObj = apiEquipments.find(e => String(e.id) === finalPompaId);
      const secilenTankObj = apiEquipments.find(e => String(e.id) === finalTankId);
      
      const dozajPompasiString = secilenPompaObj 
        ? `${currentPompaAdedi} Adet ${secilenPompaObj.ekipman_adi}`
        : `${currentPompaAdedi} Adet Dozaj Pompası (Hesaplanıyor)`;

      const kimyasalTankString = secilenTankObj 
        ? secilenTankObj.ekipman_adi 
        : "---";

      const dozajPompasiKapasitesi = secilenPompaObj
        ? secilenPompaObj.ekipman_adi.match(/\(([^)]+)\)/)?.[1] || secilenPompaObj.ekipman_adi
        : "";
        
      const kimyasalTankKapasitesi = secilenTankObj
        ? parseFloat(secilenTankObj.ekipman_adi.match(/(\d+)\s*(lt|Litre)/i)?.[1]) || ""
        : "";

      // Parametreler değiştiğinde hesaplanan değerler anında yenilenir
      const nextGerekliFe = isParamsChanged ? hesaplananDegerler.gerekliFe : (storeDozajSelections.gerekliFe ?? hesaplananDegerler.gerekliFe);
      const nextGerekliFeCl3 = isParamsChanged ? hesaplananDegerler.gerekliFeCl3 : (storeDozajSelections.gerekliFeCl3 ?? hesaplananDegerler.gerekliFeCl3);
      const nextCozeltiLitreGun = isParamsChanged ? hesaplananDegerler.cozeltiLitreGun : (storeDozajSelections.cozeltiLitreGun ?? hesaplananDegerler.cozeltiLitreGun);
      const nextPompaSaatlikDebi = isParamsChanged ? hesaplananDegerler.pompaSaatlikDebi : (storeDozajSelections.pompaSaatlikDebi ?? hesaplananDegerler.pompaSaatlikDebi);
      const nextTankHacmiLitre = isParamsChanged ? hesaplananDegerler.tankHacmiLitre : (storeDozajSelections.tankHacmiLitre ?? hesaplananDegerler.tankHacmiLitre);

      if (
        isParamsChanged ||
        storeDozajSelections.dozajPompasi !== dozajPompasiString ||
        storeDozajSelections.kimyasalTanki !== kimyasalTankString ||
        storeDozajSelections.secilenPompaId !== finalPompaId ||
        storeDozajSelections.secilenTankId !== finalTankId ||
        storeDozajSelections.gerekliFe === undefined ||
        storeDozajSelections.dozajPompasiKapasitesi !== dozajPompasiKapasitesi ||
        storeDozajSelections.kimyasalTankKapasitesi !== kimyasalTankKapasitesi
      ) {
        updateSection("equipments", {
          ...equipmentsCache,
          ileriAritma: {
            ...storeIleriAritma,
            IleriAritmaDozajSelections: {
              gerekliFe: nextGerekliFe,
              gerekliFeCl3: nextGerekliFeCl3,
              cozeltiLitreGun: nextCozeltiLitreGun,
              pompaSaatlikDebi: nextPompaSaatlikDebi,
              pompaAdedi: currentPompaAdedi,
              tankHacmiLitre: nextTankHacmiLitre,
              secilenPompaId: finalPompaId, 
              secilenTankId: finalTankId,   
              dozajPompasi: dozajPompasiString,
              kimyasalTanki: kimyasalTankString,
              pompaBirimFiyat: secilenPompaObj?.alis_fiyati || 0,
              tankBirimFiyat: secilenTankObj?.alis_fiyati || 0,
              dozajPompasiKapasitesi: dozajPompasiKapasitesi,
              kimyasalTankKapasitesi: kimyasalTankKapasitesi,
              // Parametre değim kontrolü için Store'a yazılan mühür değerler
              lastGirisP: girisP,
              lastCikisP: cikisP,
              lastKatsayi: katsayi,
              lastDebi: debi
            }
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hesaplananDegerler, apiEquipments, isParamsChanged, debi, girisP]);

  // 5. MANUEL DROPDOWN VE INPUT YÖNETİMİ
  const handleInputChange = (field, value) => {
    let nextState = { ...storeDozajSelections };

    if (field === "secilenPompaId") {
      const targetId = value === "" ? "" : String(value);
      const secilenPompaObj = apiEquipments.find(e => String(e.id) === targetId);
      const currentPompaAdedi = parseInt(storeDozajSelections.pompaAdedi ?? hesaplananDegerler.pompaAdedi, 10) || 1;

      if (secilenPompaObj) {
        const pompaKapasite = secilenPompaObj.ekipman_adi.match(/\(([^)]+)\)/)?.[1] || secilenPompaObj.ekipman_adi;
        nextState = {
          ...nextState,
          secilenPompaId: targetId,
          dozajPompasi: `${currentPompaAdedi} Adet ${secilenPompaObj.ekipman_adi}`,
          pompaBirimFiyat: secilenPompaObj.alis_fiyati || 0,
          dozajPompasiKapasitesi: pompaKapasite
        };
      } else {
        nextState.secilenPompaId = targetId;
        nextState.dozajPompasiKapasitesi = "";
      }
    } 
    else if (field === "secilenTankId") {
      const targetId = value === "" ? "" : String(value);
      const secilenTankObj = apiEquipments.find(e => String(e.id) === targetId);

      if (secilenTankObj) {
        const tankKapasite = parseFloat(secilenTankObj.ekipman_adi.match(/(\d+)\s*(lt|Litre)/i)?.[1]) || "";
        nextState = {
          ...nextState,
          secilenTankId: targetId,
          kimyasalTanki: secilenTankObj.ekipman_adi,
          tankBirimFiyat: secilenTankObj.alis_fiyati || 0,
          kimyasalTankKapasitesi: tankKapasite
        };
      } else {
        nextState.secilenTankId = targetId;
        nextState.kimyasalTankKapasitesi = "";
      }
    } 
    else if (field === "pompaAdedi") {
      const targetCount = value === "" ? "" : parseInt(value, 10) || 0;
      nextState.pompaAdedi = targetCount;

      const asilPompaId = storeDozajSelections.secilenPompaId || hesaplananDegerler.otomatikPompaId;
      const secilenPompaObj = apiEquipments.find(e => String(e.id) === String(asilPompaId));
      if (secilenPompaObj) {
        nextState.dozajPompasi = `${targetCount} Adet ${secilenPompaObj.ekipman_adi}`;
      }
    } 
    else {
      nextState[field] = value === "" ? "" : parseFloat(value) || 0;
    }

    updateSection("equipments", {
      ...equipmentsCache,
      ileriAritma: {
        ...storeIleriAritma,
        IleriAritmaDozajSelections: nextState
      }
    });
  };

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

  const selectStyle = {
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#fff",
    fontSize: "11px",
    borderRadius: "4px",
    padding: "2px 5px",
    outline: "none",
    maxWidth: "180px"
  };

  const formatValue = (storeVal, calcVal, isInt = false) => {
    const val = storeVal ?? calcVal;
    if (val === undefined || val === "") return "";
    return isInt ? parseInt(val, 10).toString() : Number(val).toFixed(2);
  };

  if (loading) return <div className="text-white-50" style={{ fontSize: '11px' }}>Ekipman verileri yükleniyor...</div>;

  return (
    <div className="card-body d-flex flex-column gap-3" style={{ position: "relative", color: "#fff", padding: 0 }}>

      {/* BAŞLIK BÖLÜMÜ */}
      <div className="d-flex align-items-center flex-grow-1">
        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
          4. Dozaj Sistemi
        </span>
        <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
      </div>

      {/* SONUÇ KARTLARI PANELİ */}
      <div className="row g-2">

        {/* Sol Kolon */}
        <div className="col-md-6 d-flex flex-column gap-2">
          {/* Gerekli Saf Fe Miktarı */}
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

          {/* Gerekli Saf FeCl3 Miktarı */}
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

          {/* %40 Çözelti İhtiyacı */}
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

        {/* Sağ Kolon */}
        <div className="col-md-6 d-flex flex-column gap-2">
          
          {/* Pompa Seçimi */}
          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Dozaj Pompası Seçimi:</span>
            <select
              style={selectStyle}
              value={storeDozajSelections.secilenPompaId || hesaplananDegerler.otomatikPompaId || ""}
              onChange={(e) => handleInputChange("secilenPompaId", e.target.value)}
            >
              {availablePumps.map(pump => (
                <option key={pump.id} value={String(pump.id)}>{pump.ekipman_adi}</option>
              ))}
            </select>
          </div>

          {/* Dinamik Pompa Adedi */}
          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #ef4444" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Gerekli Pompa Adedi:</span>
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

          {/* Tank Seçimi */}
          <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #38bdf8" }}>
            <span className="text-white-50" style={{ fontSize: "10px" }}>Kimyasal Depo Tankı ({stokGunu} Gün):</span>
            <select
              style={selectStyle}
              value={storeDozajSelections.secilenTankId || hesaplananDegerler.otomatikTankId || ""}
              onChange={(e) => handleInputChange("secilenTankId", e.target.value)}
            >
              {availableTanks.map(tank => (
                <option key={tank.id} value={String(tank.id)}>{tank.ekipman_adi}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

    </div>
  );
}

export default IleriAritmaDozajSelections;