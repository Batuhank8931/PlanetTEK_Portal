import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";

// Dil bazlı temel parametre şablonları
const PARAMETER_TEMPLATES = {
  TR: [
    { key: "debi", label: "Debi" },
    { key: "girisBoi", label: "Giriş BOİ₅" },
    { key: "cikisBoi", label: "Çıkış BOİ₅" },
    { key: "filtrasyonBoi", label: "Üçüncül Arıtma Sonrası BOİ", requiresFiltrasyon: true },
    { key: "sicaklik", label: "Atıksu Sıcaklığı" },
    { key: "girisAmonyum", label: "Giriş Amonyumu (NH₄-N)", requiresNitrifikasyon: true },
    { key: "cikisAmonyum", label: "Çıkış Amonyumu (NH₄-N)", requiresNitrifikasyon: true }
  ],
  EN: [
    { key: "debi", label: "Flow Rate" },
    { key: "girisBoi", label: "Influent BOD₅" },
    { key: "cikisBoi", label: "Effluent BOD₅" },
    { key: "filtrasyonBoi", label: "BOD After Tertiary Treatment", requiresFiltrasyon: true },
    { key: "sicaklik", label: "Wastewater Temperature" },
    { key: "girisAmonyum", label: "Influent Ammonium (NH₄-N)", requiresNitrifikasyon: true },
    { key: "cikisAmonyum", label: "Effluent Ammonium (NH₄-N)", requiresNitrifikasyon: true }
  ]
};

function KapakTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const equipmentsObject = formData.equipments || {};
  const { modulesState = {} } = equipmentsObject;

  // Modul Aktiflik Kontrolleri
  const isFiltrasyonChecked = modulesState.filtrasyon?.checked || false;

  // Dil ve Birim Sistemi Kontrolü
  const teklifDili = formData?.customerInfo?.teklifDili;
  const unitSystem = formData?.customerInfo?.unitSystem || "Metric"; // 'Metric' veya 'US'
  const isForeign = teklifDili === "Yabancı";
  const activeTemplates = isForeign ? PARAMETER_TEMPLATES.EN : PARAMETER_TEMPLATES.TR;

  const storeKapak = formData?.tables?.kapaktablosu;

  // 🌟 Lokasyon bazlı format seçimi
  const activeLocale = isForeign ? "en-US" : "tr-TR";

  // Input Alanlarında Formatlı Gösterim İçin Yardımcı Fonksiyon
  const formatInputValue = (val) => {
    if (val === undefined || val === null || val === "") return "";
    const num = parseFloat(val);
    if (isNaN(num)) return val; // Eğer sayıya çevrilemiyorsa string halini koru
    
    return num.toLocaleString(activeLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  // Formatlanmış string girdiyi temiz JS float sayısına çevirme
  const parseInputValue = (val) => {
    if (!val) return 0;
    let cleanVal = val.toString();
    if (isForeign) {
      cleanVal = cleanVal.replace(/,/g, "");
    } else {
      cleanVal = cleanVal.replace(/\./g, "").replace(",", ".");
    }
    const parsed = parseFloat(cleanVal);
    return isNaN(parsed) ? val : parsed;
  };

  // Yardımcı Birim ve Değer Dönüştürücü Fonksiyon
  const getUnitAndValue = (key, metricValue, targetSystem) => {
    const numVal = parseFloat(metricValue);
    if (isNaN(numVal)) return { value: metricValue, unit: "mg/l" };

    if (key === "debi") {
      if (targetSystem === "US") {
        const gpdVal = Math.round(numVal * 264.172);
        // 🌟 Başlangıç değerini de teklif diline göre formatlayarak string döndürüyoruz
        return { value: formatInputValue(gpdVal), unit: "GPD" };
      }
      return { value: formatInputValue(metricValue), unit: isForeign ? "m³/day" : "m³/gün" };
    }

    if (key === "sicaklik") {
      if (targetSystem === "US") {
        const fahrenheitVal = Math.round((numVal * 1.8) + 32);
        return { value: formatInputValue(fahrenheitVal), unit: "°F" };
      }
      return { value: formatInputValue(metricValue), unit: "°C" };
    }

    return { value: formatInputValue(metricValue), unit: "mg/l" };
  };

  const generateRowsFromDesign = () => {
    const pDetails = formData?.planetDiskDetails?.tasarim?.aritmaParametreleri || {};
    const hasNitrifikasyon = pDetails.nitrifikasyon === "nitrifikasyonVar";

    return activeTemplates
      .filter(param => {
        if (param.requiresNitrifikasyon && !hasNitrifikasyon) return false;
        if (param.requiresFiltrasyon && !isFiltrasyonChecked) return false;
        return true;
      })
      .map((param, index) => {
        let rawValue = "0";
        
        if (param.key === "filtrasyonBoi") {
          const cikisBoiVal = parseFloat(pDetails.cikisBoi);
          if (!isNaN(cikisBoiVal)) {
            rawValue = String(Math.round(cikisBoiVal * 0.8 * 100) / 100); 
          }
        } else {
          rawValue = pDetails[param.key] !== undefined ? String(pDetails[param.key]) : "0";
        }

        const converted = getUnitAndValue(param.key, rawValue, unitSystem);

        return {
          id: `design_${param.key}_${index}`,
          label: param.label,
          value: converted.value,
          isNumeric: true,
          unit: converted.unit,
          isUrgent: false
        };
      });
  };

  const [rows, setRows] = useState(() => {
    if (storeKapak && storeKapak.length > 0) {
      return storeKapak;
    }
    return generateRowsFromDesign();
  });

  // İnput odak yönetimi için geçici yerel string stateleri
  const [editingCell, setEditingCell] = useState(null); // { id: rowId, value: 'string' }
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const freshRows = generateRowsFromDesign();
    setRows(prevRows => {
      if (prevRows.length === 0) return freshRows;
      return freshRows.map(fRow => {
        const existing = prevRows.find(p => p.id === fRow.id);
        const isUnitSystemChanged = existing && existing.id.startsWith("design_") && (fRow.unit !== existing.unit);
        
        if (existing && !isUnitSystemChanged) {
          return { ...fRow, value: existing.value, label: existing.label, unit: existing.unit };
        }
        return fRow;
      }).concat(prevRows.filter(p => !p.id.toString().startsWith("design_")));
    });
  }, [formData?.planetDiskDetails?.tasarim?.aritmaParametreleri, teklifDili, isFiltrasyonChecked, unitSystem]);

  useEffect(() => {
    updateSection("tables", {
      ...formData?.tables,
      kapaktablosu: [...rows]
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
    let finalValue = newValue;
    if (field === "value") {
      finalValue = parseInputValue(newValue);
    }
    setRows(rows.map(row => row.id === id ? { ...row, [field]: finalValue } : row));
  };

  const insertAfterRow = (index) => {
    saveToHistory(rows);
    const newId = `new_${Date.now()}`;
    const newRow = {
      id: newId,
      label: isForeign ? "New Parameter Name" : "Yeni Parametre Adı",
      value: "0",
      isNumeric: true,
      unit: "-",
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

  return (
    <div className="d-flex flex-column w-100">
      <style>{`
        .table-row-custom { border-bottom: 1px solid #334155; transition: background-color 0.15s ease; }
        .table-row-custom:last-child { border-bottom: none; }
        .bg-normal { background-color: #1e293b; }
        .bg-normal:hover { background-color: #243249 !important; }
        .custom-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.05) !important; }
        .opacity-hover:hover { opacity: 1 !important; }
      `}</style>

      <div className="d-flex flex-column rounded-3 overflow-x-auto" style={{ border: "1px solid #334155", width: "100%" }}>

        <div style={{ minWidth: "500px" }}>

          {/* ÜST PANEL */}
          <div className="p-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
            <div className="fw-semibold text-white" style={{ fontSize: "14px" }}>
              {isForeign ? "Cover Table Parameters" : "Kapak Tablosu Parametreleri"} 
              <span className="badge ms-2" style={{ backgroundColor: "#00874e", fontSize: "10px" }}>{unitSystem}</span>
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

          <div style={{ overflowY: "auto" }}>
            {rows.map((row, index) => {
              const isCurrentEditing = editingCell?.id === row.id;

              // Değeri ekrana basmak üzere kontrollü string gösterme mantığı
              let displayRowValue = "";
              if (isCurrentEditing) {
                displayRowValue = editingCell.value;
              } else {
                // Eğer state'deki veri bir şekilde float ise formatInputValue üzerinden geçirilir, yoksa ham metni basar
                const parsedNum = parseFloat(row.value);
                displayRowValue = isNaN(parsedNum) ? row.value : formatInputValue(row.value);
              }

              return (
                <div key={row.id} className="d-flex align-items-stretch table-row-custom bg-normal">
                  <div className="p-2.5 px-3 d-flex align-items-center" style={{ width: "55%" }}>
                    <input
                      type="text"
                      className="form-control form-control-sm text-start text-white bg-transparent border-0 fw-medium p-1 custom-input rounded"
                      style={{ fontSize: "12px", boxShadow: "none", width: "100%" }}
                      value={row.label}
                      onChange={(e) => handleCellChange(row.id, "label", e.target.value)}
                    />
                  </div>

                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                  <div className="p-2.5 px-3 d-flex align-items-center justify-content-end gap-2" style={{ width: "45%" }}>
                    {/* 🌟 Değer girişi type="text" kontrollü yapıya geçirildi */}
                    <input
                      type="text"
                      className="form-control form-control-sm text-end fw-bold text-white bg-transparent border-0 p-1 custom-input rounded"
                      style={{ fontSize: "12px", boxShadow: "none", width: "65%" }}
                      value={displayRowValue}
                      placeholder="0.00"
                      onChange={(e) => setEditingCell({ id: row.id, value: e.target.value })}
                      onFocus={() => {
                        const rawNum = parseInputValue(row.value);
                        const cleanString = isNaN(rawNum) 
                          ? row.value.toString() 
                          : (isForeign ? rawNum.toString() : rawNum.toString().replace(".", ","));
                        setEditingCell({ id: row.id, value: cleanString });
                      }}
                      onBlur={(e) => {
                        handleCellChange(row.id, "value", e.target.value);
                        setEditingCell(null);
                      }}
                    />

                    <input
                      type="text"
                      className="form-control form-control-sm text-start text-white-50 bg-transparent border-0 p-0 custom-input rounded ps-1"
                      style={{ fontSize: "11px", minWidth: "55px", width: "55px", boxShadow: "none" }}
                      value={row.unit}
                      placeholder={isForeign ? "unit" : "birim"}
                      onChange={(e) => handleCellChange(row.id, "unit", e.target.value)}
                    />

                    <div style={{ width: "1px", height: "14px", backgroundColor: "#334155" }}></div>

                    <div className="d-flex align-items-center gap-2 ms-1">
                      <button
                        onClick={() => insertAfterRow(index)}
                        className="btn btn-sm p-0 border-0 text-success opacity-50 opacity-hover fw-bold"
                        style={{ fontSize: "16px", lineHeight: "1", width: "15px" }}
                        title={isForeign ? "Insert New Row Below" : "Altına Yeni Satır Ekle"}
                      >
                        +
                    </button>
                      <button
                        onClick={() => deleteRow(row.id)}
                        className="btn btn-sm p-0 border-0 text-danger opacity-50 opacity-hover"
                        style={{ fontSize: "16px", lineHeight: "1", width: "15px" }}
                        title={isForeign ? "Delete Row" : "Satırı Sil"}
                      >
                        &times;
                    </button>
                    </div>
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

export default KapakTablosu;