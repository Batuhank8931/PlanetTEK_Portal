import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";

// Dil bazlı parametre şablonları
const PARAMETER_TEMPLATES = {
  TR: [
    { key: "hidrolikYuk", label: "Toplam Atıksu Miktarı (max) – Hidrolik Yük", girişFn: (p) => p?.debi ? String(p.debi) : "0", çıkış: "-" },
    { key: "organikYuk", label: "Toplam Kirlilik (max) – Organik Yük", girişFn: (p) => (p?.debi && p?.girisBoi) ? String(((p.debi * p.girisBoi) / 1000).toFixed(2)) : "0", çıkış: "-" },
    { key: "dizaynDebisi", label: "Tesis Dizayn Debisi", girişFn: (p) => p?.debi ? String((p.debi / 24).toFixed(2)) : "0", çıkış: "-" },
    { key: "boi", label: "Biyolojik Oksijen İhtiyacı (BOİ₅)", girişFn: (p) => p?.girisBoi ? String(p.girisBoi) : "0", çıkışFn: (p) => p?.cikisBoi ? String(p.cikisBoi) : "0" },
    {
      key: "filtrasyonBoi",
      label: "Üçüncül Arıtma Sonrası BOİ",
      requiresFiltrasyon: true,
      girişFn: (p) => p?.girisBoi ? String(p.girisBoi) : "0",
      çıkışFn: (p) => {
        const cikisVal = parseFloat(p?.cikisBoi);
        return !isNaN(cikisVal) ? String(Math.round(cikisVal * 0.8 * 100) / 100) : "0";
      }
    },
    { key: "koi", label: "Kimyasal Oksijen İhtiyacı (KOİ)", girişFn: (p) => p?.girisBoi ? String((p.girisBoi * 1.8).toFixed(0)) : "0", çıkışFn: (p) => p?.cikisBoi ? String((p.cikisBoi * 1.8).toFixed(0)) : "0" },
    { key: "akm", label: "Askıda Katı Madde (AKM)", girişFn: (p) => p?.girisBoi ? String(p.girisBoi) : "0", çıkışFn: (p) => p?.cikisBoi ? `<${p.cikisBoi}` : "0" },
    { key: "tn", label: "Toplam Azot (TN)", requiresIleriAritma: true, girişFn: (p, ia) => ia?.girisToplamAzot ? String(ia.girisToplamAzot) : "0", çıkışFn: (p, ia) => ia?.cikisToplamAzot ? String(ia.cikisToplamAzot) : "0" },
    { key: "nh4", label: "Amonyum Azotu (NH4-N)", requiresNitrifikasyon: true, girişFn: (p) => p?.girisAmonyum ? String(p.girisAmonyum) : "0", çıkışFn: (p) => p?.cikisAmonyum ? String(p.cikisAmonyum) : "0" },
    { key: "tp", label: "Toplam Fosfor (TP)", requiresIleriAritma: true, girişFn: (p, ia) => ia?.girisToplamFosfor ? String(ia.girisToplamFosfor) : "0", çıkışFn: (p, ia) => ia?.cikisToplamFosfor ? String(ia.cikisToplamFosfor) : "0" },
    { key: "yagGres", label: "Yağ ve Gres", giriş: "≤25", çıkış: "<20" },
    { key: "ph", label: "pH", giriş: "6 – 9", çıkış: "6 – 9" },
    { key: "sicaklikAralik", label: "Atıksu Sıcaklığı", giriş: "15-32", çıkış: "15-32" },
    { key: "kabulEdilenSicaklik", label: "Kabul Edilen Sıcaklık", girişFn: (p) => p?.sicaklik ? String(p.sicaklik) : "19", çıkış: "-" }
  ],
  EN: [
    { key: "hidrolikYuk", label: "Design Flow Rate (Q)", girişFn: (p) => p?.debi ? String(p.debi) : "0", çıkış: "-" },
    { key: "organikYuk", label: "Daily BOD₅ Load", girişFn: (p) => (p?.debi && p?.girisBoi) ? String(((p.debi * p.girisBoi) / 1000).toFixed(2)) : "0", çıkış: "-" },
    { key: "dizaynDebisi", label: "Plant Design Flow Rate", girişFn: (p) => p?.debi ? String((p.debi / 24).toFixed(2)) : "0", çıkış: "-" },
    { key: "boi", label: "Biochemical Oxygen Demand (BOD₅)", girişFn: (p) => p?.girisBoi ? String(p.girisBoi) : "0", çıkışFn: (p) => p?.cikisBoi ? String(p.cikisBoi) : "0" },
    {
      key: "filtrasyonBoi",
      label: "BOD After Tertiary Treatment",
      requiresFiltrasyon: true,
      girişFn: (p) => p?.girisBoi ? String(p.girisBoi) : "0",
      çıkışFn: (p) => {
        const cikisVal = parseFloat(p?.cikisBoi);
        return !isNaN(cikisVal) ? String(Math.round(cikisVal * 0.8 * 100) / 100) : "0";
      }
    },
    { key: "koi", label: "Chemical Oxygen Demand (COD)", girişFn: (p) => p?.girisBoi ? String((p.girisBoi * 1.8).toFixed(0)) : "0", çıkışFn: (p) => p?.cikisBoi ? String((p.cikisBoi * 1.8).toFixed(0)) : "0" },
    { key: "akm", label: "Total Suspended Solids (TSS)", girişFn: (p) => p?.girisBoi ? String(p.girisBoi) : "0", çıkışFn: (p) => p?.cikisBoi ? `<${p.cikisBoi}` : "0" },
    { key: "tn", label: "Total Nitrogen (TN)", requiresIleriAritma: true, girişFn: (p, ia) => ia?.girisToplamAzot ? String(ia.girisToplamAzot) : "0", çıkışFn: (p, ia) => ia?.cikisToplamAzot ? String(ia.cikisToplamAzot) : "0" },
    { key: "nh4", label: "Ammonium Nitrogen (NH4-N)", requiresNitrifikasyon: true, girişFn: (p) => p?.girisAmonyum ? String(p.girisAmonyum) : "0", checkoutFn: (p) => p?.cikisAmonyum ? String(p.cikisAmonyum) : "0" },
    { key: "tp", label: "Total Phosphorus (TP)", requiresIleriAritma: true, girişFn: (p, ia) => ia?.girisToplamFosfor ? String(ia.girisToplamFosfor) : "0", çıkışFn: (p, ia) => ia?.cikisToplamFosfor ? String(ia.cikisToplamFosfor) : "0" },
    { key: "yagGres", label: "Oil and Grease", giriş: "≤25", çıkış: "<20" },
    { key: "ph", label: "pH", giriş: "6 – 9", çıkış: "6 – 9" },
    { key: "sicaklikAralik", label: "Wastewater Temperature", giriş: "15-32", çıkış: "15-32" },
    { key: "kabulEdilenSicaklik", label: "Accepted Temperature", girişFn: (p) => p?.sicaklik ? String(p.sicaklik) : "19", çıkış: "-" }
  ]
};

function ParametreTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const teklifDili = formData?.customerInfo?.teklifDili;
  const unitSystem = formData?.customerInfo?.unitSystem || "Metric"; 
  const isForeign = teklifDili === "Yabancı";
  const activeTemplates = isForeign ? PARAMETER_TEMPLATES.EN : PARAMETER_TEMPLATES.TR;

  const storeParametre = formData?.tables?.parametretablosu;

  // 🌟 Lokasyon bazlı format seçimi
  const activeLocale = isForeign ? "en-US" : "tr-TR";

  // Sayısal veya Karışık İfadeleri Maskelemek İçin Yardımcı Format Fonksiyonu
  const formatInputValue = (val) => {
    if (val === undefined || val === null || val === "") return "";
    let str = val.toString().trim();
    if (str === "-") return "-";

    // Aralık içeriyorsa ("15-32" veya "15 – 32") iki tarafı da ayrı formatla
    if (str.includes("-") || str.includes("–")) {
      const separator = str.includes("-") ? "-" : "–";
      const parts = str.split(separator).map(p => parseFloat(p.replace(/[^\d.]/g, "")));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return `${parts[0].toLocaleString(activeLocale)} ${separator} ${parts[1].toLocaleString(activeLocale)}`;
      }
    }

    // Ön ek temizliği (Örn: "<25" -> prefix: "<", num: 25)
    const prefix = str.startsWith("<") ? "<" : str.startsWith("≤") ? "≤" : "";
    const cleanStr = str.replace(/[^\d.]/g, "");
    const num = parseFloat(cleanStr);
    
    if (isNaN(num)) return val; // Sayı barındırmıyorsa ("6 – 9" gibi özel durumlar veya düz metin)
    
    return `${prefix}${num.toLocaleString(activeLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  };

  // Formatlanmış string ifadeyi standart JS formatına çevirme
  const parseInputValue = (val) => {
    if (!val) return "0";
    let cleanVal = val.toString();
    if (isForeign) {
      cleanVal = cleanVal.replace(/,/g, "");
    } else {
      cleanVal = cleanVal.replace(/\./g, "").replace(",", ".");
    }
    return cleanVal;
  };

  // Gelişmiş Birim ve Değer Dönüştürücü Gözü
  const convertValueAndUnit = (key, rawStr, targetSystem) => {
    if (!rawStr || rawStr === "-") return { value: rawStr, unit: "-" };
    
    const cleanNum = parseFloat(rawStr.replace(/[^\d.]/g, ""));
    const prefix = rawStr.startsWith("<") ? "<" : rawStr.startsWith("≤") ? "≤" : "";

    if (key === "hidrolikYuk") {
      if (targetSystem === "US" && !isNaN(cleanNum)) {
        return { value: formatInputValue(Math.round(cleanNum * 264.172)), unit: "GPD" };
      }
      return { value: formatInputValue(rawStr), unit: isForeign ? "m³/d" : "m³/gün" };
    }

    if (key === "organikYuk") {
      if (targetSystem === "US" && !isNaN(cleanNum)) {
        return { value: formatInputValue((cleanNum * 2.20462).toFixed(2)), unit: "lb/d" };
      }
      return { value: formatInputValue(rawStr), unit: isForeign ? "kg/d" : "kg/gün" };
    }

    if (key === "dizaynDebisi") {
      if (targetSystem === "US" && !isNaN(cleanNum)) {
        return { value: formatInputValue((cleanNum * 4.40287).toFixed(2)), unit: "GPM" };
      }
      return { value: formatInputValue(rawStr), unit: isForeign ? "m³/h" : "m³/saat" };
    }

    if (key === "sicaklikAralik" || key === "kabulEdilenSicaklik") {
      if (targetSystem === "US") {
        if (rawStr.includes("-")) {
          const parts = rawStr.split("-").map(p => parseFloat(p.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const f1 = Math.round((parts[0] * 1.8) + 32);
            const f2 = Math.round((parts[1] * 1.8) + 32);
            return { value: formatInputValue(`${f1}-${f2}`), unit: "°F" };
          }
        } else if (!isNaN(cleanNum)) {
          return { value: formatInputValue(Math.round((cleanNum * 1.8) + 32)), unit: "°F" };
        }
      }
      return { value: formatInputValue(rawStr), unit: "°C" };
    }

    if (key === "ph") return { value: rawStr, unit: "-" };

    return { value: formatInputValue(rawStr), unit: "mg/L" };
  };

  const generateRowsFromDesign = () => {
    const pDetails = formData?.planetDiskDetails?.tasarim?.aritmaParametreleri || {};
    const ileriAritmaData = formData?.equipments?.ileriAritma?.IleriAritmaInputSelections;

    const hasIleriAritma = formData?.equipments?.modulesState?.ileriAritma?.checked === true;
    const hasNitrifikasyon = pDetails.nitrifikasyon === "nitrifikasyonVar";
    const isFiltrasyonChecked = formData?.equipments?.modulesState?.filtrasyon?.checked === true;

    return activeTemplates
      .filter(param => !param.requiresNitrifikasyon || hasNitrifikasyon)
      .filter(param => !param.requiresIleriAritma || hasIleriAritma)
      .filter(param => !param.requiresFiltrasyon || isFiltrasyonChecked)
      .map((param, index) => {
        const rawGiriş = param.girişFn ? param.girişFn(pDetails, ileriAritmaData) : (param.giriş || "0");
        const rawÇıkış = param.çıkışFn ? param.çıkışFn(pDetails, ileriAritmaData) : (param.çıkış || "0");

        const convertedGiriş = convertValueAndUnit(param.key, rawGiriş, unitSystem);
        const convertedÇıkış = convertValueAndUnit(param.key, rawÇıkış, unitSystem);

        return {
          id: `design_${param.key}_${index}`,
          label: param.label,
          unit: convertedGiriş.unit, 
          giriş: convertedGiriş.value,
          çıkış: convertedÇıkış.value,
          isUrgent: false
        };
      });
  };

  const [rows, setRows] = useState(() => {
    if (storeParametre && storeParametre.length > 0) {
      return storeParametre;
    }
    return generateRowsFromDesign();
  });

  // İnput odak yönetimi için geçici yerel string stateleri
  const [editingCell, setEditingCell] = useState(null); // { id: rowId, field: 'giriş'|'çıkış', value: 'string' }
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const freshRows = generateRowsFromDesign();
    setRows(prevRows => {
      if (prevRows.length === 0) return freshRows;
      return freshRows.map(fRow => {
        const existing = prevRows.find(p => p.id === fRow.id);
        const isUnitSystemChanged = existing && existing.id.startsWith("design_") && (fRow.unit !== existing.unit);
        
        if (existing && !isUnitSystemChanged) {
          return { ...fRow, giriş: existing.giriş, çıkış: existing.çıkış, label: existing.label, unit: existing.unit };
        }
        return fRow;
      }).concat(prevRows.filter(p => !p.id.toString().startsWith("design_")));
    });
  }, [
    formData?.planetDiskDetails?.tasarim?.aritmaParametreleri,
    formData?.equipments?.ileriAritma?.IleriAritmaInputSelections,
    formData?.equipments?.modulesState?.ileriAritma?.checked,
    formData?.equipments?.modulesState?.filtrasyon?.checked,
    teklifDili,
    unitSystem 
  ]);

  useEffect(() => {
    updateSection("tables", {
      ...formData?.tables,
      parametretablosu: [...rows]
    });
  }, [rows]);

  const handleRefresh = () => {
    setHistory([]);
    const freshRows = generateRowsFromDesign();
    setRows(freshRows);
  };

  const saveToHistory = (currentRows) => {
    setHistory([...history, JSON.stringify(currentRows)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = JSON.parse(history[history.length - 1]);
    setRows(previousState);
    setHistory(history.slice(0, -1));
  };

  const handleCellChange = (id, field, newValue) => {
    saveToHistory(rows);
    const parsedValue = parseInputValue(newValue);
    setRows(rows.map(row => row.id === id ? { ...row, [field]: parsedValue } : row));
  };

  const insertAfterRow = (index) => {
    saveToHistory(rows);
    const newId = `new_${Date.now()}`;
    const newRow = {
      id: newId,
      label: isForeign ? "Inserted New Parameter" : "Araya Eklenen Yeni Parametre",
      unit: "mg/L",
      giriş: "0",
      çıkış: "0",
      isUrgent: false
    };

    const updatedRows = [...rows];
    updatedRows.splice(index + 1, 0, newRow);
    setRows(updatedRows);
  };

  const deleteRow = (id) => {
    saveToHistory(rows);
    setRows(rows.filter(row => row.id !== id));
  };

  // Dinamik input render kontrolü fonksiyonu
  const renderCellInput = (row, field) => {
    const isCurrentEditing = editingCell?.id === row.id && editingCell?.field === field;
    let cellDisplayStr = "";

    if (isCurrentEditing) {
      cellDisplayStr = editingCell.value;
    } else {
      cellDisplayStr = formatInputValue(row[field]);
    }

    return (
      <input
        type="text"
        className="form-control form-control-sm text-end fw-bold text-white bg-transparent border-0 p-1 param-input rounded"
        style={{ fontSize: "12px", boxShadow: "none", width: "100%" }}
        value={cellDisplayStr}
        onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
        onFocus={() => {
          let currentRawStr = row[field].toString();
          // Eğer içinde özel karakter varsa, yazma kolaylığı için odaktayken noktayı virgüle (veya tersi) çevirip temiz sunalım
          if (!isForeign) {
            currentRawStr = currentRawStr.replace(/\./g, "").replace(",", "."); // Standart ara çevrim
            currentRawStr = currentRawStr.replace(".", ",");
          }
          setEditingCell({ id: row.id, field, value: currentRawStr });
        }}
        onBlur={(e) => {
          handleCellChange(row.id, field, e.target.value);
          setEditingCell(null);
        }}
      />
    );
  };

  return (
    <div className="d-flex flex-column w-100">
      <style>{`
        .table-row-param { border-bottom: 1px solid #334155; transition: background-color 0.15s ease; }
        .table-row-param:last-child { border-bottom: none; }
        .bg-normal-param { background-color: #1e293b; }
        .bg-normal-param:hover { background-color: #243249 !important; }
        .param-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.05) !important; }
        .header-cell {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          background-color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .opacity-hover:hover { opacity: 1 !important; }
      `}</style>

      <div className="d-flex flex-column rounded-3 overflow-x-auto" style={{ border: "1px solid #334155", width: "100%" }}>
        <div style={{ minWidth: "650px" }}>

          {/* ÜST PANEL */}
          <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
            <div className="fw-semibold text-white" style={{ fontSize: "14px" }}>
              {isForeign ? "Design Influent / Effluent Parameters Table" : "Tasarım Giriş / Çıkış Parametreleri Tablosu"}
              <span className="badge ms-2" style={{ backgroundColor: "#0284c7", fontSize: "10px" }}>{unitSystem} Mode</span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                onClick={handleRefresh}
                className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
                style={{
                  backgroundColor: "#d97706",
                  fontSize: "11px",
                  borderRadius: "6px",
                  transition: "0.2s",
                  cursor: "pointer"
                }}
                title={isForeign ? "Reset Table to Initial Design Settings" : "Tabloyu İlk Tasarım Ayarlarına Döndür"}
              >
                🔄 {isForeign ? "Refresh" : "Yenile"}
              </button>

              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
                style={{
                  backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a",
                  fontSize: "11px",
                  borderRadius: "6px",
                  transition: "0.2s",
                  opacity: history.length === 0 ? 0.4 : 1,
                  cursor: history.length === 0 ? "not-allowed" : "pointer"
                }}
              >
                ↶
              </button>
            </div>
          </div>

          {/* TABLO BAŞLIKLARI */}
          <div className="d-flex align-items-stretch border-bottom" style={{ borderColor: "#334155" }}>
            <div className="p-2 px-3 header-cell" style={{ width: "40%" }}>{isForeign ? "Parameter" : "Parametre"}</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 px-3 header-cell text-center" style={{ width: "15%" }}>{isForeign ? "Unit" : "Birim"}</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 px-3 header-cell text-end" style={{ width: "20%" }}>{isForeign ? "Wastewater Influent" : "Atıksu Giriş"}</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 px-3 header-cell text-end" style={{ width: "20%" }}>{isForeign ? "Wastewater Effluent" : "Atıksu Çıkış"}</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 text-center header-cell" style={{ width: "5%" }}>{isForeign ? "Action" : "Aksiyon"}</div>
          </div>

          {/* TABLO SATIRLARI */}
          <div style={{ overflowY: "auto" }}>
            {rows.map((row, index) => (
              <div key={row.id} className="d-flex align-items-stretch table-row-param bg-normal-param">

                <div className="p-1 px-3 d-flex align-items-center" style={{ width: "40%" }}>
                  <input
                    type="text"
                    className="form-control form-control-sm text-start text-white bg-transparent border-0 fw-medium p-1 param-input rounded"
                    style={{ fontSize: "12px", boxShadow: "none", width: "100%" }}
                    value={row.label}
                    onChange={(e) => handleCellChange(row.id, "label", e.target.value)}
                  />
                </div>

                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                <div className="p-1 px-2 d-flex align-items-center justify-content-center" style={{ width: "15%" }}>
                  <input
                    type="text"
                    className="form-control form-control-sm text-center text-white-50 bg-transparent border-0 p-1 param-input rounded"
                    style={{ fontSize: "12px", boxShadow: "none", width: "100%" }}
                    value={row.unit}
                    onChange={(e) => handleCellChange(row.id, "unit", e.target.value)}
                  />
                </div>

                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                {/* 🌟 Atıksu Giriş hücresi kontrollü hale getirildi */}
                <div className="p-1 px-3 d-flex align-items-center justify-content-end" style={{ width: "20%" }}>
                  {renderCellInput(row, "giriş")}
                </div>

                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                {/* 🌟 Atıksu Çıkış hücresi kontrollü hale getirildi */}
                <div className="p-1 px-3 d-flex align-items-center justify-content-end" style={{ width: "20%" }}>
                  {renderCellInput(row, "çıkış")}
                </div>

                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "5%" }}>
                  <button
                    onClick={() => insertAfterRow(index)}
                    className="btn btn-sm p-0 border-0 text-success opacity-50 opacity-hover fw-bold"
                    style={{ fontSize: "15px", lineHeight: "1" }}
                    title={isForeign ? "Insert New Row Below" : "Altına Yeni Satır Ekle"}
                    type="button"
                  >
                    +
                  </button>
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="btn btn-sm p-0 border-0 text-danger opacity-50 opacity-hover"
                    style={{ fontSize: "16px", lineHeight: "1" }}
                    title={isForeign ? "Delete Row" : "Satırı Sil"}
                    type="button"
                  >
                    &times;
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

export default ParametreTablosu;