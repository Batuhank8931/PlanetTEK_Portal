import React, { useState, useEffect } from "react";
import sarfMalzemeHesapFonksiyonu from "../../utils/SarfMalzemeHesap";
import { useTeklifStore } from "../../utils/teklifStore";

function SarfMalzemeTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  // 🌟 Canlı Döviz ve Dil Bilgilerini Store'dan Çekiyoruz
  const teklifDili = formData?.customerInfo?.teklifDili;
  const currency = formData?.customerInfo?.currency || "EUR";
  const exchangeRate = parseFloat(formData?.customerInfo?.exchangeRate) || 1.0000;

  const storeTabloVerisi = formData?.tables?.sarfmalzemettablosu?.rows || formData?.tables?.sarfmalzemettablosu || [];

  // 🌟 Lokasyon bazlı format seçimi
  const isForeign = teklifDili === "Yabancı";
  const activeLocale = isForeign ? "en-US" : "tr-TR";

  // Sayı Formatlama Fonksiyonu (Düz Metin Hücreleri İçin)
  const formatNumber = (value, minFraction = 0, maxFraction = 2) => {
    if (isNaN(value)) return "0";
    return value.toLocaleString(activeLocale, {
      minimumFractionDigits: minFraction,
      maximumFractionDigits: maxFraction
    });
  };

  // Input Alanlarında Formatlı Gösterim İçin Yardımcı Fonksiyon
  const formatInputValue = (val, maxDigits = 2) => {
    if (val === undefined || val === null || val === "") return "";
    const num = parseFloat(val);
    if (isNaN(num)) return val;

    return num.toLocaleString(activeLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDigits
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
    return parseFloat(cleanVal) || 0;
  };

  const [rows, setRows] = useState(() => {
    if (storeTabloVerisi && storeTabloVerisi.length > 0) {
      return storeTabloVerisi;
    }
    return [];
  });

  // İnput odak yönetimi için geçici yerel string stateleri
  const [editingCell, setEditingCell] = useState(null); // { id: rowId, field: 'qty'|'consumption'|'unitPrice', value: 'string' }

  const [history, setHistory] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // 🌟 Para birimi simgelerini dinamik getiren yardımcı fonksiyonlar
  const getCurrencySymbol = () => {
    if (currency === "USD") return "$";
    if (currency === "TRY") return "₺";
    return "€";
  };

  // 🌟 Kur Dönüşümlü Satır Toplamı Hesaplama (Euro ham değerini kurla çarpar)
  const calculateRowTotal = (row) => {
    if (row.isHeader || row.isSubHeader) return 0;
    const qty = parseFloat(row.qty) || 0;
    const consumption = parseFloat(row.consumption) || 0;
    const unitPrice = parseFloat(row.unitPrice) || 0; // Arka planda hep Euro
    return qty === 0 ? 0 : qty * consumption * unitPrice * exchangeRate;
  };

  // Gres ve Redüktör yağlarının toplam yıllık fiyatını hesaplayan yardımcı fonksiyon
  const calculateOilTotal = (currentRows) => {
    return currentRows.reduce((sum, row) => {
      const labelUpper = (row.label || "").toLowerCase();
      if (labelUpper.includes("gres") || labelUpper.includes("redüktör") || labelUpper.includes("reduktor")) {
        if (row.isHeader || row.isSubHeader) return sum;
        const qty = parseFloat(row.qty) || 0;
        const consumption = parseFloat(row.consumption) || 0;
        const unitPrice = parseFloat(row.unitPrice) || 0;
        return sum + (qty === 0 ? 0 : qty * consumption * unitPrice);
      }
      return sum;
    }, 0);
  };

  const grandTotal = rows.reduce((sum, row) => sum + calculateRowTotal(row), 0);

  // İlk yükleme
  useEffect(() => {
    if (!storeTabloVerisi || storeTabloVerisi.length === 0) {
      async function loadFromEngine() {
        try {
          const freshRows = await sarfMalzemeHesapFonksiyonu(formData);
          setRows(freshRows);

          const freshGrandTotal = freshRows.reduce((sum, row) => {
            if (row.isHeader || row.isSubHeader) return sum;
            const qty = parseFloat(row.qty) || 0;
            const consumption = parseFloat(row.consumption) || 0;
            const unitPrice = parseFloat(row.unitPrice) || 0;
            return sum + (qty === 0 ? 0 : qty * consumption * unitPrice);
          }, 0);

          const oilTotal = calculateOilTotal(freshRows);

          updateSection("tables", {
            ...formData?.tables,
            sarfmalzemettablosu: {
              rows: freshRows,
              grandTotal: freshGrandTotal,
              RBCYillikSarfMalzeme: oilTotal
            }
          });
        } catch (e) {
          console.error("Sarf malzeme motoru çalışırken hata:", e);
        }
      }
      loadFromEngine();
    }
  }, []);

  // Kullanıcı manuel değişiklik yaparsa store güncelleme
  const updateStoreWithNewRows = (newRows) => {
    setRows(newRows);

    const currentGrandTotalEuro = newRows.reduce((sum, row) => {
      if (row.isHeader || row.isSubHeader) return sum;
      const qty = parseFloat(row.qty) || 0;
      const consumption = parseFloat(row.consumption) || 0;
      const unitPrice = parseFloat(row.unitPrice) || 0;
      return sum + (qty === 0 ? 0 : qty * consumption * unitPrice);
    }, 0);

    const oilTotal = calculateOilTotal(newRows);

    updateSection("tables", {
      ...formData?.tables,
      sarfmalzemettablosu: {
        rows: [...newRows],
        grandTotal: currentGrandTotalEuro,
        RBCYillikSarfMalzeme: oilTotal
      }
    });
  };

  // REFRESH BUTONU
  const handleRefresh = async () => {
    setHistory([]);
    try {
      const freshRows = await sarfMalzemeHesapFonksiyonu(formData);
      setRows(freshRows);

      const freshGrandTotalEuro = freshRows.reduce((sum, row) => {
        if (row.isHeader || row.isSubHeader) return sum;
        const qty = parseFloat(row.qty) || 0;
        const consumption = parseFloat(row.consumption) || 0;
        const unitPrice = parseFloat(row.unitPrice) || 0;
        return sum + (qty === 0 ? 0 : qty * consumption * unitPrice);
      }, 0);

      const oilTotal = calculateOilTotal(freshRows);

      updateSection("tables", {
        ...formData?.tables,
        sarfmalzemettablosu: {
          rows: freshRows,
          grandTotal: freshGrandTotalEuro,
          RBCYillikSarfMalzeme: oilTotal
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
    let parsedVal = val;
    // Eğer nümerik bir alan ise veriyi parse ederek float'a dönüştürürüz
    if (field === "qty" || field === "consumption") {
      parsedVal = parseInputValue(val);
    } else if (field === "unitPrice") {
      // Birim fiyat ekranda kurla çarpılmış gösterilir, store'a giderken bölünür
      parsedVal = parseInputValue(val) / exchangeRate;
    }
    const updatedRows = rows.map(row => row.id === id ? { ...row, [field]: parsedVal } : row);
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
      newRow = { ...newRow, label: "Yeni Sarf Malzemesi", qty: 1, qtyUnit: "adet", consumption: 1, consumptionUnit: "birim/yıl", unitPrice: 0, priceUnit: `${getCurrencySymbol()}/birim` };
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

  // Dinamik input hücre render metodu (yazım kolaylığı ve blur anında tam binler ayracı formatlama)
  const renderManagedInput = (row, field, rawValue, widthStyle, isPrice = false) => {
    const isCurrent = editingCell?.id === row.id && editingCell?.field === field;

    // Değeri ekrana basmak üzere formatlama mantığı
    let displayValue = "";
    if (isCurrent) {
      displayValue = editingCell.value;
    } else {
      const valNum = isPrice ? parseFloat(rawValue || 0) * exchangeRate : parseFloat(rawValue || 0);
      displayValue = formatInputValue(valNum, isPrice ? 2 : 3);
    }

    return (
      <input
        type="text"
        className="form-control form-control-sm text-end bg-transparent border-0 sarf-input fw-semibold p-0 text-white"
        style={{ fontSize: "12px", boxShadow: "none", width: widthStyle }}
        value={displayValue}
        onChange={(e) => {
          setEditingCell({ ...editingCell, value: e.target.value });
        }}
        onFocus={() => {
          const valNum = isPrice ? parseFloat(rawValue || 0) * exchangeRate : parseFloat(rawValue || 0);
          // Odaklandığında düzenlemeyi kolaylaştırmak adına binler ayracını kaldırırız
          const cleanString = isForeign ? valNum.toString() : valNum.toString().replace(".", ",");
          setEditingCell({ id: row.id, field, value: cleanString });
        }}
        onBlur={(e) => {
          handleCellChange(row.id, field, e.target.value);
          setEditingCell(null);
        }}
      />
    );
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
            <div className="d-flex align-items-center gap-3">
              <div className="fw-semibold text-white" style={{ fontSize: "14px" }}>
                {isForeign ? "Consumables and Maintenance Expenses Table" : "Sarf Malzeme ve Bakım Giderleri Tablosu"}
              </div>
              <span className="badge bg-dark text-warning" style={{ fontSize: "11px", border: "1px solid #475569" }}>
                {currency} Modu
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                onClick={handleRefresh}
                className="btn btn-sm px-3 py-1.5 fw-semibold text-white d-flex align-items-center gap-1 border-0"
                style={{ backgroundColor: "#d97706", fontSize: "11px", borderRadius: "6px" }}
                title={isForeign ? "Reset Table to Initial Settings" : "Tabloyu İlk Ayarlarına Döndür"}
              >
                🔄 {isForeign ? "Refresh" : "Yenile"}
              </button>

              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className="btn btn-sm px-3 py-1.5 fw-semibold text-white d-flex align-items-center gap-1 border-0"
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
            <div className="p-2 px-3 header-title-cell justify-content-start" style={{ width: "30%" }}>
              {isForeign ? "Description of Expenses" : "Giderlerin Tanımları"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-title-cell" style={{ width: "16%" }}>
              {isForeign ? "Total Quantity" : "Toplam Miktar"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-title-cell" style={{ width: "18%" }}>
              {isForeign ? "Consumption Rate" : "Tüketim Oranı"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-title-cell" style={{ width: "14%" }}>
              {isForeign ? "Unit Price" : "Birim Fiyat"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-title-cell text-end pe-4" style={{ width: "16%" }}>
              {isForeign ? "Total Price" : "Toplam Fiyat"}
            </div>
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
            <div className="p-2 header-title-cell" style={{ width: "6%" }}>
              {isForeign ? "Action" : "Aksiyon"}
            </div>
          </div>

          {/* TABLO GÖVDESİ */}
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

                  {/* TOPLAM MİKTAR HÜCRESİ */}
                  <div className="p-1 px-2 d-flex align-items-center justify-content-center gap-1" style={{ width: "16%" }}>
                    {!isHeading && (
                      <>
                        {renderManagedInput(row, "qty", row.qty, "50%")}
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

                  {/* TÜKETİM ORANI HÜCRESİ */}
                  <div className="p-1 px-2 d-flex align-items-center justify-content-center gap-1" style={{ width: "18%" }}>
                    {!isHeading && (
                      <>
                        {renderManagedInput(row, "consumption", row.consumption, "40%")}
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

                  {/* BİRİM FİYAT HÜCRESİ (Kur Çevrimli ve Formatlı) */}
                  <div className="p-1 px-2 d-flex align-items-center justify-content-center gap-1" style={{ width: "14%" }}>
                    {!isHeading && (
                      <>
                        {renderManagedInput(row, "unitPrice", row.unitPrice, "45%", true)}
                        <span className="text-white-50 text-start" style={{ fontSize: "11px", width: "50%" }}>
                          {row.priceUnit || "birim"}
                        </span>
                      </>
                    )}
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                  {/* SATIR TOPLAMI (Düz Metin Hücresi) */}
                  <div className="p-1 px-3 d-flex align-items-center justify-content-end fw-bold" style={{ width: "16%", fontSize: "12px", color: isZero ? "#ef4444" : "#4ade80" }}>
                    {!isHeading && (
                      <>
                        <span>{formatNumber(rowTotal, 2, 2)}</span>
                        <span className="text-white-50 ms-1" style={{ fontSize: "11px" }}>
                          {getCurrencySymbol()}/{isForeign ? "year" : "yıl"}
                        </span>
                      </>
                    )}
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                  <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "6%" }}>
                    <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === row.id ? null : row.id); }} className="btn btn-sm p-0 border-0 text-success opacity-50 opacity-hover fw-bold" style={{ fontSize: "16px", lineHeight: "1" }} title={isForeign ? "Add Row" : "Satır Ekle"} type="button">+</button>
                    <button onClick={() => deleteRow(row.id)} className="btn btn-sm p-0 border-0 text-danger opacity-50 opacity-hover" style={{ fontSize: "16px", lineHeight: "1" }} title={isForeign ? "Delete Row" : "Satırı Sil"} type="button">&times;</button>
                    {activeMenuId === row.id && (
                      <div className="dropdown-menu-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 0); setActiveMenuId(null); }}>{isForeign ? "+ Main Header" : "+ Ana Başlık"}</div>
                        <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 1); setActiveMenuId(null); }}>{isForeign ? "+ Sub Header" : "+ Alt Başlık"}</div>
                        <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 2); setActiveMenuId(null); }}>{isForeign ? "+ Sub Header (Open)" : "+ Alt Başlık (Açık)"}</div>
                        <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 3); setActiveMenuId(null); }}>{isForeign ? "+ Normal Row" : "+ Normal Satır"}</div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}

            {/* GENEL TOPLAM SATIRI */}
            <div className="d-flex align-items-stretch p-2.5 px-3 border-top" style={{ borderColor: "#475569", backgroundColor: "#0f172a", borderTopWidth: "2px" }}>
              <div className="fw-bold text-uppercase text-white-50 text-end pe-3" style={{ width: "78%", fontSize: "12px", letterSpacing: "0.5px" }}>
                {isForeign ? "GRAND TOTAL EXPENSES" : "Genel Toplam Giderler"}
              </div>
              <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
              <div className="d-flex align-items-center justify-content-end text-success fw-bold pe-2" style={{ width: "16%", fontSize: "14px" }}>
                <span>{formatNumber(grandTotal, 0, 0)}</span>
                <span style={{ fontSize: "11px", minWidth: "50px" }} className="ms-1 text-white-50">
                  {getCurrencySymbol()}/{isForeign ? "year" : "yıl"}
                </span>
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