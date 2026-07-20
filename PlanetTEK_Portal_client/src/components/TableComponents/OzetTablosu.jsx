import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";
import { ozetTabloHesap } from "../../utils/OzettabloHesap"; 

function OzetTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);
  const teklifDili = formData?.customerInfo?.teklifDili;
  const isForeign = teklifDili === "Yabancı";

  const currency = formData?.customerInfo?.currency || "EUR";
  const unitSystem = formData?.customerInfo?.unitSystem || "Metric";
  const exchangeRate = parseFloat(formData?.customerInfo?.exchangeRate) || 1.0000;

  const storeOzetVerisi = formData?.tables?.ozettablosu;
  const activeLocale = isForeign ? "en-US" : "tr-TR";

  // 🌟 Sayı Formatlama Fonksiyonu (Dinamik toFixed(2) kontrolü eklendi)
  const formatInputValue = (val, forceDecimals = false) => {
    if (val === undefined || val === null || val === "") return "";
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    
    return num.toLocaleString(activeLocale, {
      minimumFractionDigits: forceDecimals ? 2 : 0,
      maximumFractionDigits: forceDecimals ? 2 : 4
    });
  };

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

  const [generalInfo, setGeneralInfo] = useState(() => storeOzetVerisi?.generalInfo || { offerNo: "", refNo: "", clientName: "" });
  const [params, setParams] = useState(() => storeOzetVerisi?.params || []);
  const [content, setContent] = useState(() => storeOzetVerisi?.content || []);
  
  const [editingCell, setEditingCell] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(!storeOzetVerisi);

  useEffect(() => {
    if (!storeOzetVerisi && formData && Object.keys(formData).length > 0) {
      const generated = ozetTabloHesap(formData);
      setGeneralInfo(generated.generalInfo);
      setParams(generated.params);
      setContent(generated.content);
      setLoading(false);
    } else if (storeOzetVerisi) {
      setLoading(false);
    }
  }, [storeOzetVerisi, formData]);

  useEffect(() => {
    if (loading || params.length === 0) return;
    updateSection("tables", {
      ...formData?.tables,
      ozettablosu: { generalInfo, params, content }
    });
  }, [generalInfo, params, content, loading]);

  const saveToHistory = () => {
    setHistory([...history, JSON.stringify({ generalInfo, params, content })]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prevState = JSON.parse(history[history.length - 1]);
    setGeneralInfo(prevState.generalInfo);
    setParams(prevState.params);
    setContent(prevState.content);
    setHistory(history.slice(0, -1));
  };

  const handleRefresh = () => {
    if (!formData) return;
    saveToHistory();
    const generated = ozetTabloHesap(formData);
    setGeneralInfo(generated.generalInfo);
    setParams(generated.params);
    setContent(generated.content);
  };

  const handleGeneralChange = (field, val) => {
    saveToHistory();
    setGeneralInfo({ ...generalInfo, [field]: val });
  };

  const handleParamChange = (id, field, val, unitKey = "") => {
    saveToHistory();
    let finalValue = val;

    if (field === "value") {
      const parsedVal = parseInputValue(val);
      if (!isNaN(parsedVal) && unitSystem === "US") {
        const lowerKey = unitKey.toLowerCase();
        if (lowerKey.includes("gpd") || lowerKey.includes("m³/gün") || lowerKey.includes("m³/day")) {
          finalValue = parsedVal / 264.172; 
        } else if (lowerKey.includes("gph") || lowerKey.includes("m³/saat") || lowerKey.includes("m³/hour")) {
          finalValue = parsedVal / 264.172; 
        } else if (lowerKey.includes("°f") || lowerKey.includes("°c")) {
          finalValue = (parsedVal - 32) / 1.8; 
        } else if (lowerKey.includes("lbs") || lowerKey.includes("kg")) {
          finalValue = parsedVal / 2.20462; 
        } else if (lowerKey.includes("ft²") || lowerKey.includes("m²")) {
          finalValue = parsedVal / 10.7639; 
        } else if (lowerKey.includes("ft") || lowerKey === "m") {
          finalValue = parsedVal / 3.28084; 
        }
      } else {
        finalValue = parsedVal;
      }
    }

    setParams(params.map(p => p.id === id ? { ...p, [field]: finalValue } : p));
  };

  const insertParamRow = (index) => {
    saveToHistory();
    const newId = `param_${Date.now()}`;
    const newRow = { id: newId, label: "- Yeni Parametre", value: "0", unit: "birim" };
    const updated = [...params];
    updated.splice(index + 1, 0, newRow);
    setParams(updated);
  };

  const deleteParamRow = (id) => {
    saveToHistory();
    setParams(params.filter(p => p.id !== id));
  };

  const handleContentChange = (id, field, val) => {
    saveToHistory();
    setContent(content.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const toggleCheck = (id) => {
    saveToHistory();
    setContent(content.map(c => c.id === id ? { ...c, isChecked: !c.isChecked } : c));
  };

  const insertContentRow = (index) => {
    saveToHistory();
    const newId = `content_${Date.now()}`;
    const newRow = { id: newId, isChecked: true, qty: "1", unit: "adet", desc: "Yeni Teklif Kalemi" };
    const updated = [...content];
    updated.splice(index + 1, 0, newRow);
    setContent(updated);
  };

  const deleteContentRow = (id) => {
    saveToHistory();
    setContent(content.filter(c => c.id !== id));
  };

  if (loading || params.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5 text-white-50">
        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
        <span>Özet tablosu hesaplanıyor and yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3 w-100 text-white">

      <style>{`
          .comp-row { border-bottom: 1px solid #334155; }
          .comp-row:last-child { border-bottom: none; }
          .comp-input { font-size: 12px; box-shadow: none; width: 70px; border-bottom: 1px dashed #475569 !important; }
          .comp-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.08) !important; border-bottom: 1px solid #60a5fa !important; }
          .header-main-title { font-size: 12px; font-weight: 800; letter-spacing: 0.5px; background-color: #0b1329; color: #94a3b8; }
          .ozet-row { border-bottom: 1px solid #334155; transition: background-color 0.15s ease; }
          .ozet-row:last-child { border-bottom: none; }
          .ozet-row:hover { background-color: rgba(255,255,255,0.02); }
          .ozet-input { font-size: 12px; box-shadow: none; background: transparent; border: none; color: white; width: 100%; }
          .ozet-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.05); border-radius: 4px; }
          .check-box-custom { width: 20px; height: 20px; border: 1px solid #475569; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-weight: bold; font-size: 14px; color: #4ade80; background-color: #1e293b; }
          .check-box-custom:hover { border-color: #60a5fa; }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="badge fw-bold py-2 px-3" style={{ backgroundColor: "#151f32", color: "#fbbf24", border: "1px solid #475569", fontSize: "11px" }}>
          {currency} - {unitSystem} Modu
        </span>
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={handleRefresh}
            className="btn btn-sm px-3 fw-semibold text-white border-0"
            style={{ backgroundColor: "#d97706", fontSize: "11px", borderRadius: "6px" }}
            title={isForeign ? "Reset Table to Initial Settings" : "Tabloyu İlk Ayarlarına Döndür"}
          >
            🔄 {isForeign ? "Refresh" : "Yenile"}
          </button>
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
            style={{ backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a", fontSize: "11px", borderRadius: "6px", opacity: history.length === 0 ? 0.4 : 1 }}
          >
            ↶
          </button>
        </div>
      </div>

      <div className="w-100" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div className="d-flex flex-column rounded-3 overflow-hidden" style={{ border: "1px solid #334155", backgroundColor: "#151f32", minWidth: "950px" }}>

          {/* ÜST TEKLİF BİLGİLERİ */}
          <div className="d-flex flex-column border-bottom" style={{ borderColor: "#334155", backgroundColor: "#0f172a" }}>
            <div className="d-flex align-items-stretch border-bottom ozet-row" style={{ borderColor: "#334155" }}>
              <div className="p-2 px-3 fw-bold text-white-50" style={{ width: "25%", fontSize: "12px", backgroundColor: "#1e293b" }}>
                {isForeign ? "Offer Number" : "Teklif No"}
              </div>
              <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
              <div className="p-2 px-3 fw-bold" style={{ width: "75%" }}>
                <input type="text" className="ozet-input fw-bold" value={generalInfo.offerNo} onChange={(e) => handleGeneralChange("offerNo", e.target.value)} />
              </div>
            </div>
            <div className="d-flex align-items-stretch border-bottom ozet-row" style={{ borderColor: "#334155" }}>
              <div className="p-2 px-3 fw-bold text-white-50" style={{ width: "25%", fontSize: "12px", backgroundColor: "#1e293b" }}>
                {isForeign ? "Offer Reference Number" : "Teklif Referans No"}
              </div>
              <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
              <div className="p-2 px-3 fw-bold" style={{ width: "75%" }}>
                <input type="text" className="ozet-input fw-bold" value={generalInfo.refNo} onChange={(e) => handleGeneralChange("refNo", e.target.value)} />
              </div>
            </div>
            <div className="d-flex align-items-stretch ozet-row">
              <div className="p-2 px-3 fw-bold text-white-50" style={{ width: "25%", fontSize: "12px", backgroundColor: "#1e293b" }}>
                {isForeign ? "Client / Client Title" : "İşveren Adı"}
              </div>
              <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
              <div className="p-2 px-3 fw-bold" style={{ width: "75%" }}>
                <input type="text" className="ozet-input fw-bold" value={generalInfo.clientName} onChange={(e) => handleGeneralChange("clientName", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="p-2 px-3 header-main-title border-bottom" style={{ borderColor: "#334155" }}>
            {isForeign ? "DESIGN CRITERIA / INFLUENT PARAMETERS" : "TASARIM KABUL PARAMETRELERİ"}
          </div>

          {/* TASARIM KABUL KALEMLERİ */}
          <div className="d-flex flex-column border-bottom" style={{ borderColor: "#334155" }}>
            {params.map((p, index) => {
              const isCurrentEditing = editingCell?.id === p.id;
              const rawNumValue = parseFloat(p.value);
              const lowerUnit = (p.unit || "").toLowerCase().trim();

              let displayValue = p.value;
              let displayUnit = p.unit;

              if (!isNaN(rawNumValue) && unitSystem === "US") {
                if (lowerUnit.includes("m³/gün") || lowerUnit.includes("m³/day")) {
                  displayValue = rawNumValue * 264.172;
                  displayUnit = "GPD";
                } else if (lowerUnit.includes("m³/saat") || lowerUnit.includes("m³/hour")) {
                  displayValue = rawNumValue * 264.172;
                  displayUnit = "GPH";
                } else if (lowerUnit === "°c") {
                  displayValue = rawNumValue * 1.8 + 32;
                  displayUnit = "°F";
                } else if (lowerUnit.includes("kg/gün") || lowerUnit.includes("kg/day")) {
                  displayValue = rawNumValue * 2.20462;
                  displayUnit = "lbs/day";
                } else if (lowerUnit.includes("m²/disk") || lowerUnit.includes("m²/disk")) {
                  displayValue = rawNumValue * 10.7639;
                  displayUnit = "sq.ft/disk";
                } else if (lowerUnit.includes("m²/ünite") || lowerUnit.includes("m²/unit")) {
                  displayValue = rawNumValue * 10.7639;
                  displayUnit = "sq.ft/unit";
                } else if (lowerUnit === "m²") {
                  displayValue = rawNumValue * 10.7639;
                  displayUnit = "sq.ft";
                } else if (lowerUnit === "m") {
                  displayValue = rawNumValue * 3.28084;
                  displayUnit = "ft";
                }
              }

              // 🌟 KURAL KONTROLÜ: Sayı adet veya disk birimi değilse forceDecimals (toFixed(2)) tetiklenir
              const isCountUnit = lowerUnit === "units" || lowerUnit === "adet" || lowerUnit.includes("disk") || lowerUnit.includes("pieces");
              const shouldForceDecimals = !isCountUnit && !isNaN(parseFloat(displayValue));

              let displayParamText = "";
              if (isCurrentEditing) {
                displayParamText = editingCell.value;
              } else {
                displayParamText = p.isLongText ? displayValue : formatInputValue(displayValue, shouldForceDecimals);
              }

              return (
                <div key={p.id ? `param-${p.id}-${index}` : `param-idx-${index}`} className="d-flex align-items-stretch ozet-row">

                  <div className="p-2 px-3 d-flex align-items-center" style={{ width: "45%" }}>
                    <input type="text" className="ozet-input text-white-50" value={p.label} onChange={(e) => handleParamChange(p.id, "label", e.target.value)} />
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                  <div className="p-2 px-3 d-flex align-items-center" style={{ width: "49%" }}>
                    {p.isLongText ? (
                      <textarea
                        rows={3}
                        className="ozet-input fw-medium"
                        style={{ resize: "auto" }}
                        value={displayParamText}
                        onChange={(e) => handleParamChange(p.id, "value", e.target.value, p.unit)}
                      />
                    ) : (
                      <div className="d-flex w-100 align-items-center justify-content-between">
                        <input 
                          type="text" 
                          className="ozet-input fw-bold text-center" 
                          style={{ width: "50%" }} 
                          value={displayParamText} 
                          onChange={(e) => setEditingCell({ id: p.id, value: e.target.value })} 
                          onFocus={() => {
                            const cleanNum = parseFloat(displayValue);
                            const cleanString = isNaN(cleanNum) 
                              ? displayValue.toString() 
                              : (shouldForceDecimals ? cleanNum.toFixed(2) : cleanNum.toString());
                            setEditingCell({ id: p.id, value: isForeign ? cleanString : cleanString.replace(".", ",") });
                          }}
                          onBlur={(e) => {
                            handleParamChange(p.id, "value", e.target.value, p.unit);
                            setEditingCell(null);
                          }}
                        />
                        <input type="text" className="ozet-input text-white-50 text-end" style={{ width: "40%" }} value={displayUnit} onChange={(e) => handleParamChange(p.id, "unit", e.target.value)} />
                      </div>
                    )}
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                  <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "6%" }}>
                    <button type="button" onClick={() => insertParamRow(index)} className="btn btn-sm p-0 border-0 text-success opacity-50 hover-opacity-100 fw-bold" style={{ fontSize: "16px" }}>+</button>
                    <button type="button" onClick={() => deleteParamRow(p.id)} className="btn btn-sm p-0 border-0 text-danger opacity-40 hover-opacity-100" style={{ fontSize: "17px" }}>&times;</button>
                  </div>

                </div>
              );
            })}
          </div>

          <div className="p-2 px-3 header-main-title border-bottom" style={{ borderColor: "#334155" }}>
            {isForeign ? "SCOPE OF SUPPLY / EQUIPMENT LIST" : "TEKLİF İÇERİĞİ"}
          </div>

          {/* TEKLİF İÇERİĞİ LİSTESİ */}
          <div className="d-flex flex-column">
            {content.map((c, index) => {
              const rowBg = c.isHeaderStyle ? "#1e293b" : "transparent";

              return (
                <div key={c.id ? `content-${c.id}-${index}` : `content-idx-${index}`} className="d-flex align-items-stretch ozet-row" style={{ backgroundColor: rowBg }}>

                  <div className="p-2 d-flex align-items-center justify-content-center" style={{ width: "5%" }}>
                    <div className="check-box-custom" onClick={() => toggleCheck(c.id)}>
                      {c.isChecked ? "✓" : ""}
                    </div>
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                  <div className="p-2 d-flex align-items-center justify-content-center" style={{ width: "6%" }}>
                    <input type="text" className="ozet-input text-center fw-bold text-white" value={c.qty} onChange={(e) => handleContentChange(c.id, "qty", e.target.value)} />
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                  <div className="p-2 d-flex align-items-center justify-content-center" style={{ width: "8%" }}>
                    <input type="text" className="ozet-input text-center text-white-50" value={c.unit} onChange={(e) => handleContentChange(c.id, "unit", e.target.value)} />
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                  <div className="p-2 px-3 d-flex align-items-center" style={{ width: "75%" }}>
                    <input
                      type="text"
                      className={`ozet-input ${c.isHeaderStyle ? 'fw-bold text-white-50 font-italic' : 'fw-medium text-white'}`}
                      value={c.desc}
                      onChange={(e) => handleContentChange(c.id, "desc", e.target.value)}
                    />
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                  <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "6%" }}>
                    <button type="button" onClick={() => insertContentRow(index)} className="btn btn-sm p-0 border-0 text-success opacity-50 hover-opacity-100 fw-bold" style={{ fontSize: "16px" }}>+</button>
                    <button type="button" onClick={() => deleteContentRow(c.id)} className="btn btn-sm p-0 border-0 text-danger opacity-40 hover-opacity-100" style={{ fontSize: "17px" }}>&times;</button>
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

export default OzetTablosu;