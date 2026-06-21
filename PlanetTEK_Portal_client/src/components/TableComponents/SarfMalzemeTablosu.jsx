import React, { useState } from "react";

function SarfMalzemeTablosu() {
  const [rows, setRows] = useState([
    { id: "h1", label: "SARF MALZEME VE BAKIM GİDERLERİ", isHeader: true },
    
    { id: "s1", label: "Biyolojik Arıtma Üniteleri (İkincil Arıtma)", isSubHeader: true },
    { id: "s1_sub", label: "PlanetDISK® MX 1 DBD Ünitesi", isSubHeader: true, isLight: true },
    { id: "r1", label: "Rulman Gres Yağı", qty: 16, qtyUnit: "rulman", consumption: 0.5, consumptionUnit: "kg/yıl.rulman", unitPrice: 6, priceUnit: "€/kg" },
    { id: "r2", label: "Redüktör Yağı", qty: 8, qtyUnit: "redüktör", consumption: 7.4, consumptionUnit: "lt/yıl.redüktör", unitPrice: 4, priceUnit: "€/lt" },
    { id: "r3", label: "Demir Üç Klorür (FeCl3)", qty: 0, qtyUnit: "Dozaj Ün.", consumption: 1.11, consumptionUnit: "ton/yıl", unitPrice: 200, priceUnit: "€/ton" },

    { id: "s2", label: "Filtrasyon ve Dezenfeksiyon Üniteleri (İleri Arıtma)", isSubHeader: true },
    { id: "s2_sub", label: "Ön Klorlama Dozaj Pompası", isSubHeader: true, isLight: true },
    { id: "r4", label: "Sıvı Klor", qty: 0, qtyUnit: "Dozaj Ün.", consumption: 1.34, consumptionUnit: "ton/yıl", unitPrice: 0.38, priceUnit: "€/kg" },

    { id: "s3", label: "Planet Membran Ünitesi (İleri Arıtma)", isSubHeader: true },
    { id: "s3_sub", label: "Membran Dozaj Pompası", isSubHeader: true, isLight: true },
    { id: "r5", label: "Klor", qty: 0, qtyUnit: "Dozaj Ün.", consumption: 0.00, consumptionUnit: "ton/yıl", unitPrice: 0.38, priceUnit: "€/kg" },
    { id: "r6", label: "Sitrik Asit", qty: 0, qtyUnit: "Dozaj Ün.", consumption: 0.00, consumptionUnit: "ton/yıl", unitPrice: 6.00, priceUnit: "€/kg" },

    { id: "s4", label: "Çamur Susuzlaştırma Ünitesi", isSubHeader: true },
    { id: "r7", label: "Katyonik Polielektrolit", qty: 0, qtyUnit: "Dozaj Ün.", consumption: 91, consumptionUnit: "kg/yıl", unitPrice: 26, priceUnit: "€/kg" }
  ]);

  const [history, setHistory] = useState([]);

  const calculateRowTotal = (row) => {
    if (row.isHeader || row.isSubHeader) return 0;
    const qty = parseFloat(row.qty) || 0;
    const consumption = parseFloat(row.consumption) || 0;
    const unitPrice = parseFloat(row.unitPrice) || 0;
    return qty === 0 ? 0 : qty * consumption * unitPrice;
  };

  const grandTotal = rows.reduce((sum, row) => sum + calculateRowTotal(row), 0);

  const saveToHistory = (currentRows) => {
    setHistory([...history, JSON.stringify(currentRows)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setRows(JSON.parse(history[history.length - 1]));
    setHistory(history.slice(0, -1));
  };

  const handleCellChange = (id, field, val) => {
    saveToHistory(rows);
    setRows(rows.map(row => row.id === id ? { ...row, [field]: val } : row));
  };

  const insertAfterRow = (index) => {
    saveToHistory(rows);
    const newId = `sarf_${Date.now()}`;
    const newRow = { id: newId, label: "Yeni Sarf Malzemesi", qty: 1, qtyUnit: "adet", consumption: 1, consumptionUnit: "birim/yıl", unitPrice: 0, priceUnit: "€/birim" };
    const updatedRows = [...rows];
    updatedRows.splice(index + 1, 0, newRow);
    setRows(updatedRows);
  };

  const deleteRow = (id) => {
    saveToHistory(rows);
    setRows(rows.filter(row => row.id !== id));
  };

  const getRowBg = (row) => {
    if (row.isHeader) return "#0b1329"; 
    if (row.isSubHeader) return row.isLight ? "#2a3a52" : "#1e2d42"; 
    if (!row.isHeader && !row.isSubHeader && (parseFloat(row.qty) === 0)) return "#2a1515";
    return "#151f32"; 
  };

  return (
    <div className="d-flex flex-column gap-3 w-100">
      
      <style>{`
        .sarf-row { border-bottom: 1px solid #334155; }
        .sarf-row:last-child { border-bottom: none; }
        .sarf-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.05) !important; }
        .header-title-cell { font-size: 11px; font-weight: 800; color: #94a3b8; background-color: #090d16; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; text-align: center; }
      `}</style>

      <div className="d-flex justify-content-end align-items-center mb-1">
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1"
          style={{ backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a", fontSize: "11px", borderRadius: "6px", opacity: history.length === 0 ? 0.4 : 1 }}
        >
          <span style={{ fontSize: "12px" }}>↶</span>
        </button>
      </div>

      <div className="w-100" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div className="d-flex flex-column rounded-3" style={{ border: "1px solid #334155", height: "auto", minWidth: "950px" }}>
          
          <div className="d-flex align-items-stretch border-bottom" style={{ borderColor: "#334155" }}>
            <div className="p-2 px-3 header-title-cell justify-content-start" style={{ width: "30%" }}>Giderlerin Tanımları</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-title-cell" style={{ width: "16%" }}>Toplam Miktar</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-title-cell" style={{ width: "18%" }}>Tüketim Oranı</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-title-cell" style={{ width: "14%" }}>Birim Fiyat</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-title-cell text-end pe-4" style={{ width: "16%" }}>Toplam Fiyat</div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-title-cell" style={{ width: "6%" }}></div>
          </div>

          {rows.map((row, index) => {
            const isZero = parseFloat(row.qty) === 0;
            const numColor = isZero ? "#ef4444" : "white";
            const rowTotal = calculateRowTotal(row);

            return (
              <div key={row.id} className="d-flex align-items-stretch sarf-row" style={{ backgroundColor: getRowBg(row) }}>
                
                <div className="p-2 px-3 d-flex align-items-center" style={{ width: "30%" }}>
                  {row.isHeader || row.isSubHeader ? (
                    <span className="text-white fw-bold" style={{ fontSize: row.isHeader ? "13px" : "11.5px", color: row.isHeader ? "#60a5fa" : "#cbd5e1" }}>
                      {row.label}
                    </span>
                  ) : (
                    <textarea
                      rows={row.label.includes("\n") ? 3 : 1}
                      className="form-control form-control-sm text-start text-white bg-transparent border-0 fw-medium p-0 sarf-input"
                      style={{ fontSize: "12px", boxShadow: "none", width: "100%", resize: "none" }}
                      value={row.label}
                      onChange={(e) => handleCellChange(row.id, "label", e.target.value)}
                    />
                  )}
                </div>
                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                <div className="p-1 px-2 d-flex align-items-center justify-content-center gap-1" style={{ width: "16%" }}>
                  {!row.isHeader && !row.isSubHeader && (
                    <>
                      <input
                        type="number"
                        className="form-control form-control-sm text-end bg-transparent border-0 sarf-input fw-bold p-0"
                        style={{ fontSize: "12px", boxShadow: "none", color: numColor, width: "50%" }}
                        value={row.qty}
                        onChange={(e) => handleCellChange(row.id, "qty", e.target.value)}
                      />
                      <input
                        type="text"
                        className="form-control form-control-sm text-start text-white-50 bg-transparent border-0 p-0"
                        style={{ fontSize: "11px", boxShadow: "none", width: "45%" }}
                        value={row.qtyUnit}
                        onChange={(e) => handleCellChange(row.id, "qtyUnit", e.target.value)}
                      />
                    </>
                  )}
                </div>
                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                <div className="p-1 px-2 d-flex align-items-center justify-content-center gap-1" style={{ width: "18%" }}>
                  {!row.isHeader && !row.isSubHeader && (
                    <>
                      <input
                        type="number"
                        className="form-control form-control-sm text-end text-white bg-transparent border-0 sarf-input fw-semibold p-0"
                        style={{ fontSize: "12px", boxShadow: "none", width: "40%" }}
                        value={row.consumption}
                        onChange={(e) => handleCellChange(row.id, "consumption", e.target.value)}
                      />
                      <input
                        type="text"
                        className="form-control form-control-sm text-start text-white-50 bg-transparent border-0 p-0"
                        style={{ fontSize: "10px", boxShadow: "none", width: "55%" }}
                        value={row.consumptionUnit}
                        onChange={(e) => handleCellChange(row.id, "consumptionUnit", e.target.value)}
                      />
                    </>
                  )}
                </div>
                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                <div className="p-1 px-2 d-flex align-items-center justify-content-center gap-1" style={{ width: "14%" }}>
                  {!row.isHeader && !row.isSubHeader && (
                    <>
                      <input
                        type="number"
                        className="form-control form-control-sm text-end text-white bg-transparent border-0 sarf-input fw-semibold p-0"
                        style={{ fontSize: "12px", boxShadow: "none", width: "45%" }}
                        value={row.unitPrice}
                        onChange={(e) => handleCellChange(row.id, "unitPrice", e.target.value)}
                      />
                      <input
                        type="text"
                        className="form-control form-control-sm text-start text-white-50 bg-transparent border-0 p-0"
                        style={{ fontSize: "10px", boxShadow: "none", width: "50%" }}
                        value={row.priceUnit}
                        onChange={(e) => handleCellChange(row.id, "priceUnit", e.target.value)}
                      />
                    </>
                  )}
                </div>
                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                <div className="p-1 px-3 d-flex align-items-center justify-content-end fw-bold" style={{ width: "16%", fontSize: "12px", color: isZero ? "#ef4444" : "#4ade80" }}>
                  {!row.isHeader && !row.isSubHeader && (
                    <>
                      <span>{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}</span>
                      <span className="text-white-50 ms-1" style={{ fontSize: "11px" }}>€/yıl</span>
                    </>
                  )}
                </div>
                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "6%" }}>
                  <button onClick={() => insertAfterRow(index)} className="btn btn-sm p-0 border-0 text-success opacity-50 hover-opacity-100 fw-bold" style={{ fontSize: "15px", lineHeight: "1" }} title="Altına Satır Ekle">+</button>
                  <button onClick={() => deleteRow(row.id)} className="btn btn-sm p-0 border-0 text-danger opacity-40 hover-opacity-100" style={{ fontSize: "16px", lineHeight: "1" }} title="Satırı Sil">&times;</button>
                </div>

              </div>
            );
          })}

          <div className="d-flex align-items-stretch p-2.5 px-3 border-top" style={{ borderColor: "#475569", backgroundColor: "#0f172a", borderTopWidth: "2px" }}>
            <div className="fw-bold text-uppercase text-white-50 text-end pe-3" style={{ width: "78%", fontSize: "12px", letterSpacing: "0.5px" }}>
              Genel Toplam Giderler
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="d-flex align-items-center justify-content-end text-success fw-bold pe-2" style={{ width: "16%", fontSize: "14px" }}>
              <span>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              <span style={{ fontSize: "11px", minWidth: "40px" }} className="ms-1 text-white-50">€/yıl</span>
            </div>
            <div style={{ width: "1px", backgroundColor: "transparent" }}></div>
            <div style={{ width: "6%" }}></div>
          </div>

        </div>
      </div>

    </div>
  );
}

export default SarfMalzemeTablosu;