import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";
import { generateInitialData } from "../../utils/OzettabloHesap"; // Dışarıdan export edilen fonksiyonu aldık

function OzetTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const storeOzetVerisi = formData?.tables?.ozettablosu;

  // KURAL 1: Store'da data varsa oradan başlat, yoksa geçici boş şablon kur
  const [generalInfo, setGeneralInfo] = useState(() => storeOzetVerisi?.generalInfo || { offerNo: "", refNo: "", clientName: "" });
  const [params, setParams] = useState(() => storeOzetVerisi?.params || []);
  const [content, setContent] = useState(() => storeOzetVerisi?.content || []);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(!storeOzetVerisi);

  // KURAL 2: Eğer store tamamen boşsa (ilk yükleme anı) ve formData geldiyse dataları üretir
  useEffect(() => {
    if (!storeOzetVerisi && formData && Object.keys(formData).length > 0) {
      const generated = generateInitialData(formData);
      setGeneralInfo(generated.generalInfo);
      setParams(generated.params);
      setContent(generated.content);
      setLoading(false);
    } else if (storeOzetVerisi) {
      // Store dolmuşsa loading'i kapat
      setLoading(false);
    }
  }, [storeOzetVerisi, formData]);

  // KURAL 3: Yerel datalardan herhangi biri değiştikçe (manuel müdahale) store'u güncel tutar
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

  // KURAL 4: REFRESH BUTONU - Tüm manuel değişiklikleri temizler ve taze form parametrelerini basar
  const handleRefresh = () => {
    if (!formData) return;
    saveToHistory();
    const generated = generateInitialData(formData);
    setGeneralInfo(generated.generalInfo);
    setParams(generated.params);
    setContent(generated.content);
  };

  const handleGeneralChange = (field, val) => {
    saveToHistory();
    setGeneralInfo({ ...generalInfo, [field]: val });
  };

  const handleParamChange = (id, field, val) => {
    saveToHistory();
    setParams(params.map(p => p.id === id ? { ...p, [field]: val } : p));
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
        <span>Özet tablosu hesaplanıyor ve yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3 w-100 text-white">

      <style>{`
        .ozet-row {
          border-bottom: 1px solid #334155;
          transition: background-color 0.15s ease;
        }
        .ozet-row:last-child { border-bottom: none; }
        .ozet-row:hover { background-color: rgba(255,255,255,0.02); }
        
        .ozet-input {
          font-size: 12px;
          box-shadow: none;
          background: transparent;
          border: none;
          color: white;
          width: 100%;
        }
        .ozet-input:focus {
          outline: none;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .header-main-title {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.5px;
          background-color: #0b1329;
          color: #94a3b8;
        }
        .check-box-custom {
          width: 20px;
          height: 20px;
          border: 1px solid #475569;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-weight: bold;
          font-size: 14px;
          color: #4ade80;
          background-color: #1e293b;
        }
        .check-box-custom:hover { border-color: #60a5fa; }
      `}</style>

      <div className="d-flex justify-content-end align-items-center gap-2 mb-1">
        <button
          onClick={handleRefresh}
          className="btn btn-sm px-3 fw-semibold text-white border-0"
          style={{ backgroundColor: "#d97706", fontSize: "11px", borderRadius: "6px" }}
          title="Yenile"
        >
          🔄 Yenile
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

      <div className="w-100" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div className="d-flex flex-column rounded-3 overflow-hidden" style={{ border: "1px solid #334155", backgroundColor: "#151f32", minWidth: "950px" }}>

          <div className="d-flex flex-column border-bottom" style={{ borderColor: "#334155", backgroundColor: "#0f172a" }}>
            <div className="d-flex align-items-stretch border-bottom ozet-row" style={{ borderColor: "#334155" }}>
              <div className="p-2 px-3 fw-bold text-white-50" style={{ width: "25%", fontSize: "12px", backgroundColor: "#1e293b" }}>Teklif No</div>
              <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
              <div className="p-2 px-3 fw-bold" style={{ width: "75%" }}>
                <input type="text" className="ozet-input fw-bold" value={generalInfo.offerNo} onChange={(e) => handleGeneralChange("offerNo", e.target.value)} />
              </div>
            </div>
            <div className="d-flex align-items-stretch border-bottom ozet-row" style={{ borderColor: "#334155" }}>
              <div className="p-2 px-3 fw-bold text-white-50" style={{ width: "25%", fontSize: "12px", backgroundColor: "#1e293b" }}>Teklif Referans No</div>
              <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
              <div className="p-2 px-3 fw-bold" style={{ width: "75%" }}>
                <input type="text" className="ozet-input fw-bold" value={generalInfo.refNo} onChange={(e) => handleGeneralChange("refNo", e.target.value)} />
              </div>
            </div>
            <div className="d-flex align-items-stretch ozet-row">
              <div className="p-2 px-3 fw-bold text-white-50" style={{ width: "25%", fontSize: "12px", backgroundColor: "#1e293b" }}>İşveren Adı</div>
              <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
              <div className="p-2 px-3 fw-bold" style={{ width: "75%" }}>
                <input type="text" className="ozet-input fw-bold" value={generalInfo.clientName} onChange={(e) => handleGeneralChange("clientName", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="p-2 px-3 header-main-title border-bottom" style={{ borderColor: "#334155" }}>
            TASARIM KABUL PARAMETRELERİ
          </div>

          <div className="d-flex flex-column border-bottom" style={{ borderColor: "#334155" }}>
            {params.map((p, index) => (
              <div key={p.id} className="d-flex align-items-stretch ozet-row">

                <div className="p-2 px-3 d-flex align-items-center" style={{ width: "45%" }}>
                  <input type="text" className="ozet-input text-white-50" value={p.label} onChange={(e) => handleParamChange(p.id, "label", e.target.value)} />
                </div>
                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                <div className="p-2 px-3 d-flex align-items-center" style={{ width: "49%" }}>
                  {p.isLongText ? (
                    <textarea
                      rows={4}
                      className="ozet-input fw-medium"
                      style={{ resize: "none" }}
                      value={p.value}
                      onChange={(e) => handleParamChange(p.id, "value", e.target.value)}
                    />
                  ) : (
                    <div className="d-flex w-100 align-items-center justify-content-between">
                      <input type="text" className="ozet-input fw-bold text-center" style={{ width: "50%" }} value={p.value} onChange={(e) => handleParamChange(p.id, "value", e.target.value)} />
                      <input type="text" className="ozet-input text-white-50 text-end" style={{ width: "40%" }} value={p.unit} onChange={(e) => handleParamChange(p.id, "unit", e.target.value)} />
                    </div>
                  )}
                </div>
                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "6%" }}>
                  <button onClick={() => insertParamRow(index)} className="btn btn-sm p-0 border-0 text-success opacity-50 hover-opacity-100 fw-bold" style={{ fontSize: "16px" }}>+</button>
                  <button onClick={() => deleteParamRow(p.id)} className="btn btn-sm p-0 border-0 text-danger opacity-40 hover-opacity-100" style={{ fontSize: "17px" }}>&times;</button>
                </div>

              </div>
            ))}
          </div>

          <div className="p-2 px-3 header-main-title border-bottom" style={{ borderColor: "#334155" }}>
            TEKLİF İÇERİĞİ
          </div>

          <div className="d-flex flex-column">
            {content.map((c, index) => {
              const rowBg = c.isHeaderStyle ? "#1e293b" : "transparent";

              return (
                <div key={c.id} className="d-flex align-items-stretch ozet-row" style={{ backgroundColor: rowBg }}>

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
                    <button onClick={() => insertContentRow(index)} className="btn btn-sm p-0 border-0 text-success opacity-50 hover-opacity-100 fw-bold" style={{ fontSize: "16px" }}>+</button>
                    <button onClick={() => deleteContentRow(c.id)} className="btn btn-sm p-0 border-0 text-danger opacity-40 hover-opacity-100" style={{ fontSize: "17px" }}>&times;</button>
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