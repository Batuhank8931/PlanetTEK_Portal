import React, { useState } from "react";

function OzetTablosu() {
  const [generalInfo, setGeneralInfo] = useState({
    offerNo: "2026 / 3500",
    refNo: "YİD R0 01 01 2026 8 MX 1 70 25 0",
    clientName: "İSKİ",
  });

  const [params, setParams] = useState([
    { id: 1, label: "- Atıksu Kaynağı", value: "Yalnızca kişisel kullanımdan kaynaklanan evsel atıksulara göre tasarım yapılmış olup, hayvanlardan kaynaklanan atıksular, klorlu havuz suları ve yağmur suları hesaba dahil edilmemiştir.", unit: "", isLongText: true },
    { id: 2, label: "- Nihai Kullanım Amacı", value: "Deşarj Amaçlı", unit: "" },
    { id: 3, label: "- Hidrolik Yük", value: "70,00", unit: "m³/gün" },
    { id: 4, label: "- Saatlik Debi", value: "2,92", unit: "m³/saat" },
    { id: 5, label: "- Pik Debi", value: "5,80", unit: "m³/saat" },
    { id: 6, label: "- Organik Yük", value: "25", unit: "kg/gün" },
    { id: 7, label: "- Atıksu Sıcaklığı", value: "19", unit: "°C" },
    { id: 8, label: "- PlanetDISK® Ünitesi Alıkonma Süresi", value: "12,34", unit: "saat" },
    { id: 9, label: "- PlanetDISK® MX 1 DBD Ünitesi Sayısı", value: "8", unit: "adet" },
    { id: 10, label: "- Disk Adedi", value: "0", unit: "adet/ünite" },
    { id: 11, label: "- Disk Çapı", value: "2,05", unit: "m" },
    { id: 12, label: "- 1 Diskin Yüzey Alanı", value: "6,60", unit: "m²/disk" },
    { id: 13, label: "- PlanetDISK® MX 1 DBD Ünitesi Yüzey Alanı", value: "0", unit: "m²/ünite" },
    { id: 14, label: "- Bu Projedeki Toplam Disk Yüzey Alanı", value: "0", unit: "m²" },
    { id: 15, label: "- Lamella Seperatör LS 45 Son Çöktürme Tankı", value: "1", unit: "adet" },
    { id: 16, label: "- 1 Adet Lamella Seperatör LS 45 Son Çöktürme Tankı", value: "45", unit: "m²/ünite" },
    { id: 17, label: "- Lamella Seperatör LS 45 Son Çöktürme Tankı Toplam Yüzey Alanı", value: "45", unit: "m²" }
  ]);

  const [content, setContent] = useState([
    { id: 1, isChecked: true, qty: "1", unit: "set", desc: "Elle Temizlemeli Kaba Izgara" },
    { id: 2, isChecked: true, qty: "1", unit: "set", desc: "Elle Temizlemeli İnce Izgara" },
    { id: 3, isChecked: true, qty: "4", unit: "adet", desc: "Kum-Yağ Tutucu Plakaları" },
    { id: 4, isChecked: true, qty: "2", unit: "adet", desc: "Dengeleme Tankı Terfi Pompaları" },
    { id: 5, isChecked: true, qty: "8", unit: "adet", desc: "PlanetDISK® MX 1 DBD Ünitesi" },
    { id: 6, isChecked: true, qty: "8", unit: "adet", desc: "PlanetDISK® MX 1 DBD Ünitesi Kapağı" },
    { id: 7, isChecked: true, qty: "1", unit: "adet", desc: "LS 45 Lamella Seperatör Son Çöktürme Tankı" },
    { id: 8, isChecked: true, qty: "1", unit: "adet", desc: "LS 45 Lamella Seperatör Son Çöktürme Tankı Çamur Pompası" },
    { id: 9, isChecked: true, qty: "0", unit: "set", desc: "FeCl3 Koagülant Dozaj Sistemi" },
    { id: 10, isChecked: true, qty: "0", unit: "set", desc: "Ön Klorlama Sistemi" },
    { id: 11, isChecked: true, qty: "0", unit: "set", desc: "Filtrasyon Besleme ve Geri Yıkama Pompası" },
    { id: 12, isChecked: true, qty: "0", unit: "adet", desc: "Seperatör Filtre" },
    { id: 13, isChecked: true, qty: "0", unit: "adet", desc: "Tam Otomatik Multimedia Filtrasyon Sistemi" },
    { id: 14, isChecked: true, qty: "0", unit: "adet", desc: "Tam Otomatik Aktif karbon Filtrasyon Sistemi" },
    { id: 15, isChecked: true, qty: "0", unit: "set", desc: "Çamur Susuzlaştırma Ünitesi" },
    { id: 16, isChecked: false, qty: "", unit: "", desc: "İnşaat İşleri – idare tarafından yapılacaktır", isHeaderStyle: true },
    { id: 17, isChecked: true, qty: "", unit: "", desc: "Borulama & Elektrik İşleri" },
    { id: 18, isChecked: true, qty: "1", unit: "adet", desc: "PlanetDISK® Kontrol Panosu" },
    { id: 19, isChecked: true, qty: "", unit: "", desc: "Proje Onay Dosyasının Hazırlanması ve Onayının Alınması (Harçlar Hariç)" },
    { id: 20, isChecked: true, qty: "", unit: "", desc: "Proje ve Mühendislik, Devreye Alma ve Eğitim Verilmesi" }
  ]);

  const [history, setHistory] = useState([]);

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

      <div className="d-flex justify-content-end align-items-center mb-1">
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1"
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
              const isZero = c.qty === "0";
              const textColor = isZero ? "#ef4444" : "white";
              const rowBg = c.isHeaderStyle ? "#1e293b" : isZero ? "rgba(239, 68, 68, 0.05)" : "transparent";

              return (
                <div key={c.id} className="d-flex align-items-stretch ozet-row" style={{ backgroundColor: rowBg }}>
                  
                  <div className="p-2 d-flex align-items-center justify-content-center" style={{ width: "5%" }}>
                    <div className="check-box-custom" onClick={() => toggleCheck(c.id)}>
                      {c.isChecked ? "✓" : ""}
                    </div>
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                  <div className="p-2 d-flex align-items-center justify-content-center" style={{ width: "6%" }}>
                    <input type="text" className="ozet-input text-center fw-bold" style={{ color: textColor }} value={c.qty} onChange={(e) => handleContentChange(c.id, "qty", e.target.value)} />
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                  <div className="p-2 d-flex align-items-center justify-content-center" style={{ width: "8%" }}>
                    <input type="text" className="ozet-input text-center text-white-50" value={c.unit} onChange={(e) => handleContentChange(c.id, "unit", e.target.value)} />
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                  <div className="p-2 px-3 d-flex align-items-center" style={{ width: "75%" }}>
                    <input 
                      type="text" 
                      className={`ozet-input ${c.isHeaderStyle ? 'fw-bold text-white-50 font-italic' : 'fw-medium'}`} 
                      style={{ color: textColor }} 
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