import React, { useState, useEffect, useRef } from "react";
import { useTeklifStore } from "../../utils/teklifStore";
import { ozetTabloHesap } from "../../utils/OzettabloHesap";

function OzetTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);
  const teklifDili = formData?.customerInfo?.teklifDili;
  const isForeign = teklifDili === "Yabancı";

  const currency = formData?.customerInfo?.currency || "EUR";
  const unitSystem = formData?.customerInfo?.unitSystem || "Metric";
  const storeOzetVerisi = formData?.tables?.ozettablosu;
  const activeLocale = isForeign ? "en-US" : "tr-TR";

  // Veri ilk yüklendiğinde Metric kabul edilir
  const [generalInfo, setGeneralInfo] = useState(() => storeOzetVerisi?.generalInfo || { offerNo: "", refNo: "", clientName: "" });
  const [params, setParams] = useState(() => storeOzetVerisi?.params || []);
  const [content, setContent] = useState(() => storeOzetVerisi?.content || []);

  const [editingCell, setEditingCell] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(!storeOzetVerisi);

  // Sayfa açıldığında veya store boşsa hesaplamayı tetikle
  // OzetTablosu.jsx

  useEffect(() => {
    if (!storeOzetVerisi && formData && Object.keys(formData).length > 0) {
      const generated = ozetTabloHesap(formData);
      const gInfo = generated.generalInfo || { offerNo: "", refNo: "", clientName: "" };
      const gParams = generated.params || [];
      const gContent = generated.content || [];

      setGeneralInfo(gInfo);
      setParams(gParams);
      setContent(gContent);
      setLoading(false);

      // KAZANILAN VERİYİ ZUSTAND STORE'A YAZ:
      syncToStore(gInfo, gParams, gContent);
    } else if (storeOzetVerisi) {
      setGeneralInfo(storeOzetVerisi.generalInfo);
      setParams(storeOzetVerisi.params || []);
      setContent(storeOzetVerisi.content || []);
      setLoading(false);
    }
  }, [storeOzetVerisi]);

  // Sayısal değerlerin girildiği gibi güvenle saklanması için parse edici (ORİJİNAL)
  const parseInputValue = (val) => {
    if (val === undefined || val === null || val === "") return "";
    let cleanVal = val.toString().trim();
    if (isForeign) {
      cleanVal = cleanVal.replace(/,/g, "");
    } else {
      cleanVal = cleanVal.replace(/\./g, "").replace(",", ".");
    }
    const parsed = parseFloat(cleanVal);
    return isNaN(parsed) ? val : parsed;
  };

  // Dinamik Görüntüleme & Birim Dönüşümü (ORİJİNAL)
  const getConvertedParam = (p) => {
    let rawVal = p.value;
    let unit = p.unit || "";

    // Metin veya longText durumunda dönüşüm yapılmaz
    if (p.isLongText || typeof rawVal === "string" && isNaN(parseFloat(rawVal.replace(",", ".")))) {
      return { value: rawVal, unit };
    }

    const numVal = typeof rawVal === "number" ? rawVal : parseFloat(rawVal.toString().replace(",", "."));
    if (isNaN(numVal)) return { value: rawVal, unit };

    const lowerUnit = unit.toLowerCase().trim();

    if (unitSystem === "US") {
      if (lowerUnit.includes("m³/gün") || lowerUnit.includes("m³/day")) {
        return { value: numVal * 264.172, unit: "GPD" };
      } else if (lowerUnit.includes("m³/saat") || lowerUnit.includes("m³/hour")) {
        return { value: numVal * 264.172, unit: "GPH" };
      } else if (lowerUnit === "°c") {
        return { value: numVal * 1.8 + 32, unit: "°F" };
      } else if (lowerUnit.includes("kg/gün") || lowerUnit.includes("kg/day")) {
        return { value: numVal * 2.20462, unit: "lbs/day" };
      } else if (lowerUnit.includes("m²/disk")) {
        return { value: numVal * 10.7639, unit: "sq.ft/disk" };
      } else if (lowerUnit.includes("m²/ünite") || lowerUnit.includes("m²/unit")) {
        return { value: numVal * 10.7639, unit: "sq.ft/unit" };
      } else if (lowerUnit === "m²") {
        return { value: numVal * 10.7639, unit: "sq.ft" };
      } else if (lowerUnit === "m") {
        return { value: numVal * 3.28084, unit: "ft" };
      }
    }

    return { value: numVal, unit };
  };

  // Sayıları Yerel Formata Göre Ekrana Basma (ORİJİNAL)
  const formatDisplayValue = (val, isCountUnit = false) => {
    if (val === undefined || val === null || val === "") return "";
    const num = typeof val === "number" ? val : parseFloat(val.toString().replace(",", "."));
    if (isNaN(num)) return val;

    return num.toLocaleString(activeLocale, {
      minimumFractionDigits: isCountUnit ? 0 : 2,
      maximumFractionDigits: isCountUnit ? 0 : 2
    });
  };

  // Store Güncellemesi (Ekranda görünene göre birebir tam string karşılığı ile kaydedilir)
  const syncToStore = (newInfo, newParams, newContent) => {
    // Ekranda render edilen string çıktıyı birebir oluşturur
    const stringParams = newParams.map((p) => {
      const converted = getConvertedParam(p);
      const lowerUnit = (converted.unit || "").toLowerCase().trim();
      const isCountUnit = lowerUnit === "units" || lowerUnit === "adet" || lowerUnit.includes("pieces") || lowerUnit === "adet/ünite";

      let displayVal = "";
      if (p.isLongText) {
        displayVal = String(converted.value ?? "");
      } else {
        displayVal = String(formatDisplayValue(converted.value, isCountUnit));
      }

      return {
        ...p,
        value: displayVal,
        unit: String(converted.unit || "")
      };
    });

    const stringContent = newContent.map((c) => ({
      ...c,
      qty: String(c.qty ?? ""),
      unit: String(c.unit ?? ""),
      desc: String(c.desc ?? "")
    }));

    const stringInfo = {
      offerNo: String(newInfo?.offerNo ?? ""),
      refNo: String(newInfo?.refNo ?? ""),
      clientName: String(newInfo?.clientName ?? "")
    };

    updateSection("tables", {
      ...formData?.tables,
      ozettablosu: {
        generalInfo: stringInfo,
        params: stringParams,
        content: stringContent
      }
    });
  };

  const saveToHistory = () => {
    setHistory((prev) => [...prev, JSON.stringify({ generalInfo, params, content })]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prevState = JSON.parse(history[history.length - 1]);
    setGeneralInfo(prevState.generalInfo);
    setParams(prevState.params);
    setContent(prevState.content);
    setHistory((prev) => prev.slice(0, -1));
    syncToStore(prevState.generalInfo, prevState.params, prevState.content);
  };

  const handleRefresh = () => {
    if (!formData) return;
    saveToHistory();
    const generated = ozetTabloHesap(formData);
    setGeneralInfo(generated.generalInfo);
    setParams(generated.params);
    setContent(generated.content);
    syncToStore(generated.generalInfo, generated.params, generated.content);
  };

  const handleGeneralChange = (field, val) => {
    saveToHistory();
    const updated = { ...generalInfo, [field]: val };
    setGeneralInfo(updated);
    syncToStore(updated, params, content);
  };

  const handleParamChange = (id, field, val) => {
    saveToHistory();
    const updated = params.map((p) => {
      if (p.id === id) {
        let finalValue = val;
        if (field === "value" && !p.isLongText) {
          finalValue = parseInputValue(val);
        }
        return { ...p, [field]: finalValue };
      }
      return p;
    });

    setParams(updated);
    syncToStore(generalInfo, updated, content);
  };

  const insertParamRow = (index) => {
    saveToHistory();
    const newId = `param_${Date.now()}`;
    const newRow = { id: newId, label: "- Yeni Parametre", value: "0", unit: "birim" };
    const updated = [...params];
    updated.splice(index + 1, 0, newRow);
    setParams(updated);
    syncToStore(generalInfo, updated, content);
  };

  const deleteParamRow = (id) => {
    saveToHistory();
    const updated = params.filter((p) => p.id !== id);
    setParams(updated);
    syncToStore(generalInfo, updated, content);
  };

  const handleContentChange = (id, field, val) => {
    saveToHistory();
    const updated = content.map((c) => (c.id === id ? { ...c, [field]: val } : c));
    setContent(updated);
    syncToStore(generalInfo, params, updated);
  };

  const toggleCheck = (id) => {
    saveToHistory();
    const updated = content.map((c) => (c.id === id ? { ...c, isChecked: !c.isChecked } : c));
    setContent(updated);
    syncToStore(generalInfo, params, updated);
  };

  const insertContentRow = (index) => {
    saveToHistory();
    const newId = `content_${Date.now()}`;
    const newRow = { id: newId, isChecked: true, qty: "1", unit: "adet", desc: "Yeni Teklif Kalemi" };
    const updated = [...content];
    updated.splice(index + 1, 0, newRow);
    setContent(updated);
    syncToStore(generalInfo, updated, content);
  };

  const deleteContentRow = (id) => {
    saveToHistory();
    const updated = content.filter((c) => c.id !== id);
    setContent(updated);
    syncToStore(generalInfo, params, updated);
  };

  if (loading || params.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5 text-white-50">
        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
        <span>Özet tablosu hesaplanıyor ve yükleniyor...</span>
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
                <input type="text" className="ozet-input fw-bold" value={generalInfo.offerNo || ""} onChange={(e) => handleGeneralChange("offerNo", e.target.value)} />
              </div>
            </div>
            <div className="d-flex align-items-stretch border-bottom ozet-row" style={{ borderColor: "#334155" }}>
              <div className="p-2 px-3 fw-bold text-white-50" style={{ width: "25%", fontSize: "12px", backgroundColor: "#1e293b" }}>
                {isForeign ? "Offer Reference Number" : "Teklif Referans No"}
              </div>
              <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
              <div className="p-2 px-3 fw-bold" style={{ width: "75%" }}>
                <input type="text" className="ozet-input fw-bold" value={generalInfo.refNo || ""} onChange={(e) => handleGeneralChange("refNo", e.target.value)} />
              </div>
            </div>
            <div className="d-flex align-items-stretch ozet-row">
              <div className="p-2 px-3 fw-bold text-white-50" style={{ width: "25%", fontSize: "12px", backgroundColor: "#1e293b" }}>
                {isForeign ? "Client / Client Title" : "İşveren Adı"}
              </div>
              <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
              <div className="p-2 px-3 fw-bold" style={{ width: "75%" }}>
                <input type="text" className="ozet-input fw-bold" value={generalInfo.clientName || ""} onChange={(e) => handleGeneralChange("clientName", e.target.value)} />
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

              // Birim dönüşümünü anlık al
              const converted = getConvertedParam(p);
              const lowerUnit = (converted.unit || "").toLowerCase().trim();
              const isCountUnit = lowerUnit === "units" || lowerUnit === "adet" || lowerUnit.includes("pieces") || lowerUnit === "adet/ünite";

              let displayParamText = "";
              if (isCurrentEditing) {
                displayParamText = editingCell.value;
              } else {
                displayParamText = p.isLongText ? converted.value : formatDisplayValue(converted.value, isCountUnit);
              }

              return (
                <div key={p.id ? `param-${p.id}-${index}` : `param-idx-${index}`} className="d-flex align-items-stretch ozet-row">
                  <div className="p-2 px-3 d-flex align-items-center" style={{ width: "45%" }}>
                    <input type="text" className="ozet-input text-white-50" value={p.label || ""} onChange={(e) => handleParamChange(p.id, "label", e.target.value)} />
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                  <div className="p-2 px-3 d-flex align-items-center" style={{ width: "49%" }}>
                    {p.isLongText ? (
                      <textarea
                        rows={3}
                        className="ozet-input fw-medium"
                        style={{ resize: "auto" }}
                        value={converted.value || ""}
                        onChange={(e) => handleParamChange(p.id, "value", e.target.value)}
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
                            const valToEdit = converted.value !== undefined ? converted.value : "";
                            const rawStr = valToEdit.toString();
                            const cleanString = isForeign ? rawStr.replace(",", "") : rawStr.replace(".", ",");
                            setEditingCell({ id: p.id, value: cleanString });
                          }}
                          onBlur={(e) => {
                            handleParamChange(p.id, "value", e.target.value);
                            setEditingCell(null);
                          }}
                        />
                        <input
                          type="text"
                          className="ozet-input text-white-50 text-end"
                          style={{ width: "40%" }}
                          value={converted.unit || ""}
                          onChange={(e) => handleParamChange(p.id, "unit", e.target.value)}
                        />
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
                    <input type="text" className="ozet-input text-center fw-bold text-white" value={c.qty || ""} onChange={(e) => handleContentChange(c.id, "qty", e.target.value)} />
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                  <div className="p-2 d-flex align-items-center justify-content-center" style={{ width: "8%" }}>
                    <input type="text" className="ozet-input text-center text-white-50" value={c.unit || ""} onChange={(e) => handleContentChange(c.id, "unit", e.target.value)} />
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                  <div className="p-2 px-3 d-flex align-items-center" style={{ width: "75%" }}>
                    <input
                      type="text"
                      className={`ozet-input ${c.isHeaderStyle ? 'fw-bold text-white-50 font-italic' : 'fw-medium text-white'}`}
                      value={c.desc || ""}
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