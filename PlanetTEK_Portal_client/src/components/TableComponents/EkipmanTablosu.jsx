import React, { useState } from "react";

function EkipmanTablosu() {
  const [rows, setRows] = useState([
    { id: "m1", type: "main", label: "MEKANİK EKİPMANLAR" },
    
    { id: "e1", type: "equip", label: "Elle Temizlemeli Kaba Izgara", isUrgent: false },
    { id: "s1_1", type: "spec", label: "Adet", value: "1 Adet" },
    { id: "s1_2", type: "spec", label: "Malzeme", value: "Epoksi boyalı ST37 Karbon Çelik" },
    { id: "s1_3", type: "spec", label: "Çubuk Arası Boşluk", value: "25 mm" },

    { id: "e2", type: "equip", label: "Dengeleme Tankı Terfi Pompaları", isUrgent: false },
    { id: "s2_1", type: "spec", label: "Adet", value: "2 adet (1 asil + 1 yedek)" },
    { id: "s2_2", type: "spec", label: "Kapasite", value: "3 m³/saat @ 10 mSS" },
    { id: "s2_3", type: "spec", label: "Motor Gücü", value: "1.1 kW" },
    { id: "s2_4", type: "spec", label: "Malzeme", value: "Pik Döküm Gövde, Paslanmaz Çelik Fan" },

    { id: "e3", type: "equip", label: "PlanetDISK® MX1 DBD Ünitesi", isUrgent: false },
    { id: "s3_1", type: "spec", label: "Adet", value: "8 Adet" },
    { id: "s3_2", type: "spec", label: "Disk Çapı", value: "2.05 m" },
    { id: "s3_3", type: "spec", label: "Motor Gücü", value: "0.37 kW / Ünite" },
    
    { id: "m2", type: "main", label: "İNŞAAT İŞLERİ" },

    { id: "e4", type: "equip", label: "Izgara Kanalı", isUrgent: true },
    { id: "s4_1", type: "spec", label: "Adet", value: "1 Adet" },
    { id: "s4_2", type: "spec", label: "Açıklama", value: "İdare tarafından projesine uygun yapılacaktır." },

    { id: "e5", type: "equip", label: "Anoksik Denitrifikasyon Tankı", isUrgent: true },
    { id: "s5_1", type: "spec", label: "Adet", value: "1 Adet" },
    { id: "s5_2", type: "spec", label: "Kapasite", value: "Projesine göre" }
  ]);

  const [history, setHistory] = useState([]);

  const saveToHistory = (currentRows) => {
    setHistory([...history, JSON.stringify(currentRows)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setRows(JSON.parse(history[history.length - 1]));
    setHistory(history.slice(0, -1));
  };

  const handleChange = (id, field, value) => {
    saveToHistory(rows);
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const toggleUrgent = (id) => {
    saveToHistory(rows);
    setRows(rows.map(row => row.id === id && row.type === "equip" ? { ...row, isUrgent: !row.isUrgent } : row));
  };

  const deleteRow = (id) => {
    saveToHistory(rows);
    setRows(rows.filter(row => row.id !== id));
  };

  const addNewEquipment = () => {
    saveToHistory(rows);
    const newId = `equip_${Date.now()}`;
    setRows([
      ...rows, 
      { id: newId, type: "equip", label: "Yeni Ekipman / Ünite Adı", isUrgent: false },
      { id: `spec_${Date.now()}_1`, type: "spec", label: "Adet", value: "1 Adet" }
    ]);
  };

  const insertSpecAfter = (index) => {
    saveToHistory(rows);
    const newId = `spec_${Date.now()}`;
    const newSpec = { id: newId, type: "spec", label: "Yeni Özellik", value: "Değer giriniz..." };
    
    const updatedRows = [...rows];
    updatedRows.splice(index + 1, 0, newSpec);
    setRows(updatedRows);
  };

  const getRowBg = (row) => {
    if (row.type === "main") return "#0b1329"; 
    if (row.type === "equip") return row.isUrgent ? "#991b1b" : "#1e293b"; 
    return "#151f32"; 
  };

  return (
    <div className="d-flex flex-column gap-3 w-100 text-white">
      
      <style>{`
        .equip-row {
          border-bottom: 1px solid #334155;
          transition: background-color 0.15s ease;
        }
        .equip-row:last-child { border-bottom: none; }
        
        .equip-input {
          font-size: 12px;
          box-shadow: none;
          background: transparent;
          border: none;
          color: white;
          width: 100%;
          resize: none;
        }
        .equip-input:focus {
          outline: none;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        
        .main-title-input {
          font-size: 14px;
          font-weight: 900;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .equip-title-input {
          font-size: 13px;
          font-weight: 700;
          color: white;
        }
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
        <div className="d-flex flex-column rounded-3 overflow-hidden" style={{ border: "1px solid #334155", minWidth: "800px" }}>
          
          {rows.map((row, index) => {
            
            if (row.type === "main") {
              return (
                <div key={row.id} className="d-flex align-items-stretch equip-row" style={{ backgroundColor: getRowBg(row) }}>
                  <div className="p-2 px-3 d-flex align-items-center" style={{ width: "94%" }}>
                    <input 
                      type="text" 
                      className="equip-input main-title-input text-center" 
                      value={row.label} 
                      onChange={(e) => handleChange(row.id, "label", e.target.value)} 
                    />
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                  <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "6%" }}>
                    <button onClick={() => deleteRow(row.id)} className="btn btn-sm p-0 border-0 text-danger opacity-40 hover-opacity-100" style={{ fontSize: "16px" }}>&times;</button>
                  </div>
                </div>
              );
            }

            if (row.type === "equip") {
              return (
                <div key={row.id} className="d-flex align-items-stretch equip-row" style={{ backgroundColor: getRowBg(row) }}>
                  <div className="p-2 px-3 d-flex align-items-center" style={{ width: "94%" }}>
                    <input 
                      type="text" 
                      className="equip-input equip-title-input" 
                      value={row.label} 
                      onChange={(e) => handleChange(row.id, "label", e.target.value)} 
                    />
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                  <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "6%" }}>
                    <button onClick={() => toggleUrgent(row.id)} className="btn btn-sm p-0 border-0 text-warning opacity-60 hover-opacity-100" style={{ fontSize: "14px" }} title="Kırmızı Vurgu">★</button>
                    <button onClick={() => insertSpecAfter(index)} className="btn btn-sm p-0 border-0 text-success opacity-60 hover-opacity-100 fw-bold" style={{ fontSize: "16px", lineHeight: "1" }} title="Özellik Ekle">+</button>
                    <button onClick={() => deleteRow(row.id)} className="btn btn-sm p-0 border-0 text-danger opacity-40 hover-opacity-100" style={{ fontSize: "16px", lineHeight: "1" }} title="Ekipmanı Sil">&times;</button>
                  </div>
                </div>
              );
            }

            return (
              <div key={row.id} className="d-flex align-items-stretch equip-row" style={{ backgroundColor: getRowBg(row) }}>
                <div className="p-2 px-4 d-flex align-items-start border-end" style={{ width: "30%", borderColor: "#334155" }}>
                  <textarea 
                    rows={1}
                    className="equip-input fw-medium text-white-50" 
                    value={row.label} 
                    onChange={(e) => handleChange(row.id, "label", e.target.value)} 
                  />
                </div>
                
                <div className="p-2 px-3 d-flex align-items-start" style={{ width: "64%" }}>
                  <textarea 
                    rows={row.value.length > 50 ? 2 : 1}
                    className="equip-input fw-bold" 
                    value={row.value} 
                    onChange={(e) => handleChange(row.id, "value", e.target.value)} 
                  />
                </div>
                
                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                
                <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "6%" }}>
                  <button onClick={() => insertSpecAfter(index)} className="btn btn-sm p-0 border-0 text-success opacity-50 hover-opacity-100 fw-bold" style={{ fontSize: "15px", lineHeight: "1" }} title="Altına Özellik Ekle">+</button>
                  <button onClick={() => deleteRow(row.id)} className="btn btn-sm p-0 border-0 text-danger opacity-40 hover-opacity-100" style={{ fontSize: "16px", lineHeight: "1" }} title="Özelliği Sil">&times;</button>
                </div>
              </div>
            );
            
          })}
        </div>
      </div>

      <div className="d-flex justify-content-start gap-2 mt-2">
        <button 
          onClick={addNewEquipment}
          className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1"
          style={{ backgroundColor: "#2e7d32", fontSize: "11px", borderRadius: "6px" }}
        >
          <span style={{ fontSize: "14px" }}>+</span> Yeni Ekipman Grubu Ekle
        </button>

        <button 
          onClick={() => {
            saveToHistory(rows);
            setRows([...rows, { id: `main_${Date.now()}`, type: "main", label: "YENİ ANA KATEGORİ" }]);
          }}
          className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1"
          style={{ backgroundColor: "#0f172a", border: "1px solid #334155", fontSize: "11px", borderRadius: "6px" }}
        >
          <span style={{ fontSize: "14px" }}>+</span> Yeni Ana Başlık Ekle
        </button>
      </div>

    </div>
  );
}

export default EkipmanTablosu;