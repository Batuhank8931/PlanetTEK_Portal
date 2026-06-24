import React, { useState, useEffect } from "react";
import sarfMalzemeHesapFonksiyonu from "../../utils/SarfMalzemeHesap";
import { useTeklifStore } from "../../utils/teklifStore";

function SarfMalzemeTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  // storeTabloVerisi'ni güvenli bir şekilde rows yapısından veya direkt diziden okuyoruz
  const storeTabloVerisi = formData?.tables?.sarfmalzemettablosu?.rows || formData?.tables?.sarfmalzemettablosu || [];

  // 1. KURAL: İlk açılışta sadece store'a bak. Varsa direkt render et, yoksa boş dizi başla.
  const [rows, setRows] = useState(() => {
    if (storeTabloVerisi && storeTabloVerisi.length > 0) {
      return storeTabloVerisi;
    }
    return [];
  });

  const [history, setHistory] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const calculateRowTotal = (row) => {
    if (row.isHeader || row.isSubHeader) return 0;
    const qty = parseFloat(row.qty) || 0;
    const consumption = parseFloat(row.consumption) || 0;
    const unitPrice = parseFloat(row.unitPrice) || 0;
    return qty === 0 ? 0 : qty * consumption * unitPrice;
  };

  // Gres ve Redüktör yağlarının toplam yıllık fiyatını hesaplayan yardımcı fonksiyon
  const calculateOilTotal = (currentRows) => {
    return currentRows.reduce((sum, row) => {
      const labelUpper = (row.label || "").toLowerCase();
      // "gress yağı", "gres yağı" veya "redüktör yağı" içeren satırları yakalar
      if (labelUpper.includes("gres") || labelUpper.includes("redüktör") || labelUpper.includes("reduktor")) {
        return sum + calculateRowTotal(row);
      }
      return sum;
    }, 0);
  };

  const grandTotal = rows.reduce((sum, row) => sum + calculateRowTotal(row), 0);

  // 2. KURAL: Eğer store'da veri yoksa (ilk kez açılıyorsa) fonksiyonu çalıştır ve store'a kaydet.
  useEffect(() => {
    if (!storeTabloVerisi || storeTabloVerisi.length === 0) {
      async function loadFromEngine() {
        try {
          const freshRows = await sarfMalzemeHesapFonksiyonu(formData);
          setRows(freshRows);

          // İlk yüklemede genel toplamı ve yağların toplamını hesaplıyoruz
          const freshGrandTotal = freshRows.reduce((sum, row) => sum + calculateRowTotal(row), 0);
          const oilTotal = calculateOilTotal(freshRows);

          updateSection("tables", {
            ...formData?.tables,
            sarfmalzemettablosu: {
              rows: freshRows,
              grandTotal: freshGrandTotal,
              RBCYillikSarfMalzeme: oilTotal // Özel parametre eklendi
            }
          });
        } catch (e) {
          console.error("Sarf malzeme motoru çalışırken hata:", e);
        }
      }
      loadFromEngine();
    }
  }, []); // Sadece bileşen mount olduğunda tek bir kez çalışır

  // 3. KURAL: Kullanıcı manuel bir değişiklik yaparsa store'u update et.
  const updateStoreWithNewRows = (newRows) => {
    setRows(newRows);

    // Yeni satırlara göre anlık toplamları hesapla ve store'a gönder
    const currentGrandTotal = newRows.reduce((sum, row) => sum + calculateRowTotal(row), 0);
    const oilTotal = calculateOilTotal(newRows);

    updateSection("tables", {
      ...formData?.tables,
      sarfmalzemettablosu: {
        rows: [...newRows],
        grandTotal: currentGrandTotal,
        RBCYillikSarfMalzeme: oilTotal // Özel parametre güncellendi
      }
    });
  };

  // 4. KURAL: REFRESH BUTONU - Motoru çalıştır, render et ve store'a kaydet.
  const handleRefresh = async () => {
    setHistory([]);
    try {
      const freshRows = await sarfMalzemeHesapFonksiyonu(formData);
      setRows(freshRows);

      const freshGrandTotal = freshRows.reduce((sum, row) => sum + calculateRowTotal(row), 0);
      const oilTotal = calculateOilTotal(freshRows);

      updateSection("tables", {
        ...formData?.tables,
        sarfmalzemettablosu: {
          rows: freshRows,
          grandTotal: freshGrandTotal,
          RBCYillikSarfMalzeme: oilTotal // Özel parametre güncellendi
        }
      });
    } catch (error) {
      console.error("Tablo yenilenirken hata oluştu:", error);
    }
  };

  const saveToHistory = (currentRows) => {
    setHistory([...history, JSON.stringify(currentRows)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousRows = JSON.parse(history[history.length - 1]);
    updateStoreWithNewRows(previousRows);
    setHistory(history.slice(0, -1));
  };

  const handleCellChange = (id, field, val) => {
    saveToHistory(rows);
    const updatedRows = rows.map(row => row.id === id ? { ...row, [field]: val } : row);
    updateStoreWithNewRows(updatedRows);
  };

  const insertAfterRow = (index, type) => {
    saveToHistory(rows);
    const newId = `sarf_${Date.now()}`;
    let newRow = { id: newId, label: "" };

    if (type === 0) {
      newRow = { ...newRow, label: "YENİ ANA BAŞLIK", isHeader: true };
    } else if (type === 1) {
      newRow = { ...newRow, label: "Yeni Alt Başlık", isSubHeader: true };
    } else if (type === 2) {
      newRow = { ...newRow, label: "Yeni Alt Başlık (Açık)", isSubHeader: true, isLight: true };
    } else {
      newRow = { ...newRow, label: "Yeni Sarf Malzemesi", qty: 1, qtyUnit: "adet", consumption: 1, consumptionUnit: "birim/yıl", unitPrice: 0, priceUnit: "€/birim" };
    }

    const updatedRows = [...rows];
    updatedRows.splice(index + 1, 0, newRow);
    updateStoreWithNewRows(updatedRows);
  };

  const deleteRow = (id) => {
    saveToHistory(rows);
    const updatedRows = rows.filter(row => row.id !== id);
    updateStoreWithNewRows(updatedRows);
  };

  const getRowBg = (row) => {
    if (row.isHeader) return "#0b1329";
    if (row.isSubHeader) return row.isLight ? "#2a3a52" : "#1e2d42";
    if (!row.isHeader && !row.isSubHeader && (parseFloat(row.qty) === 0)) return "#2a1515";
    return "#151f32";
  };

  return (
    <div className="d-flex flex-column w-100" onClick={() => setActiveMenuId(null)}>
      <style>{`
                .sarf-row { border-bottom: 1px solid #334155; transition: background-color 0.15s ease; position: relative; }
                .sarf-row:last-child { border-bottom: none; }
                .sarf-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.05) !important; }
                .header-title-cell { font-size: 11px; font-weight: 800; color: #94a3b8; background-color: #090d16; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; text-align: center; }
                .opacity-hover:hover { opacity: 1 !important; }
                
                .dropdown-menu-custom {
                    position: absolute;
                    right: 5%;
                    top: 80%;
                    background-color: #0f172a;
                    border: 1px solid #475569;
                    border-radius: 6px;
                    z-index: 100;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                    padding: 4px 0;
                    min-width: 140px;
                }
                .dropdown-item-custom {
                    color: #cbd5e1;
                    padding: 6px 12px;
                    font-size: 11.5px;
                    cursor: pointer;
                    text-align: left;
                    font-weight: 500;
                }
                .dropdown-item-custom:hover {
                    background-color: #1e293b;
                    color: white;
                }
            `}</style>

      <div className="d-flex flex-column rounded-3 overflow-x-auto" style={{ border: "1px solid #334155", width: "100%" }}>
        <div style={{ minWidth: "950px" }}>

          {/* ÜST PANEL */}
          <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: "#151f32", borderBottom: "1px solid #334155" }}>
            <div className="fw-semibold text-white" style={{ fontSize: "14px" }}>
              Sarf Malzeme ve Bakım Giderleri Tablosu
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                onClick={handleRefresh}
                className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
                style={{ backgroundColor: "#d97706", fontSize: "11px", borderRadius: "6px" }}
                title="Tabloyu İlk Ayarlarına Döndür"
              >
                🔄 Yenile
              </button>

              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
                style={{
                  backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a",
                  fontSize: "11px",
                  borderRadius: "6px",
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
            <div className="p-2 header-title-cell" style={{ width: "6%" }}>Aksiyon</div>
          </div>

          {/* TABLO SATIRLARI */}
          <div>
            {rows.map((row, index) => {
              const isHeading = row.isHeader || row.isSubHeader;
              const isZero = !isHeading && (parseFloat(row.qty) === 0);
              const numColor = isZero ? "#ef4444" : "white";
              const rowTotal = calculateRowTotal(row);

              return (
                <div key={row.id} className="d-flex align-items-stretch sarf-row" style={{ backgroundColor: getRowBg(row) }}>

                  <div className="p-2 px-3 d-flex align-items-center" style={{ width: "30%" }}>
                    {isHeading ? (
                      <span className="fw-bold" style={{ fontSize: row.isHeader ? "13px" : "11.5px", color: row.isHeader ? "#60a5fa" : "#cbd5e1" }}>
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
                    {!isHeading && (
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
                    {!isHeading && (
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
                    {!isHeading && (
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
                    {!isHeading && (
                      <>
                        <span>{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}</span>
                        <span className="text-white-50 ms-1" style={{ fontSize: "11px" }}>€/yıl</span>
                      </>
                    )}
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                  <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "6%" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === row.id ? null : row.id); }}
                      className="btn btn-sm p-0 border-0 text-success opacity-50 opacity-hover fw-bold"
                      style={{ fontSize: "16px", lineHeight: "1" }}
                      title="Satır Ekle"
                      type="button"
                    >
                      +
                    </button>
                    <button onClick={() => deleteRow(row.id)} className="btn btn-sm p-0 border-0 text-danger opacity-50 opacity-hover" style={{ fontSize: "16px", lineHeight: "1" }} title="Satırı Sil" type="button">&times;</button>

                    {activeMenuId === row.id && (
                      <div className="dropdown-menu-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 0); setActiveMenuId(null); }}>+ Ana Başlık</div>
                        <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 1); setActiveMenuId(null); }}>+ Alt Başlık</div>
                        <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 2); setActiveMenuId(null); }}>+ Alt Başlık (Açık)</div>
                        <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 3); setActiveMenuId(null); }}>+ Normal Satır</div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}

            {/* GENEL TOPLAM SATIRI */}
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
    </div>
  );
}

export default SarfMalzemeTablosu;