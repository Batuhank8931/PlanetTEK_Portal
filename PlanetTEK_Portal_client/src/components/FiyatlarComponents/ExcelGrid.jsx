import React, { useState, useEffect, useRef } from "react";

const ExcelGrid = ({ headers, data, fields, onDataChange, isMainTable = false }) => {
  const tableRef = useRef(null);

  const [selection, setSelection] = useState({ start: null, end: null });
  const [isDragging, setIsDragging] = useState(false);
  const [editingCell, setEditingCell] = useState({ row: null, col: null });

  // 🛠️ TÜRKÇE/AVRUPA SAYI FORMATI DOSTU BİÇİMLENDİRİCİ
  const formatCellValue = (value, fieldName) => {
    if (value === undefined || value === null || value === "") return "";
    
    // sale_amount bir adettir, küsuratsız tam sayı bas
    if (fieldName === "sale_amount") return parseInt(value, 10) || 0;

    // 🚀 Metinsel kolon kontrolü ('tipi' listeye eklendi)
    if (["model", "pompa_adi", "ad", "ekipman_tipi", "kapasite_birimi", "tipi", "kapasite"].includes(fieldName)) return String(value);
    if (typeof value === "string" && isNaN(value)) return value;

    // Fiyat verilerini HER ZAMAN virgülden sonra 2 basamak garanti ederek bas (Örn: 223,00)
    const num = Number(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  // 🛠️ SAYI PARSERI (Hücreden çıkarken sayıların uçmasını engeller)
  const parseCellValue = (str, fieldName) => {
    if (str === undefined || str === null || str === "") {
      return ["model", "pompa_adi", "ad", "ekipman_tipi", "kapasite_birimi", "tipi", "kapasite"].includes(fieldName) ? "" : 0;
    }
    
    // 🚀 Metinsel kolon kontrolü ('tipi' listeye eklendi)
    if (["model", "pompa_adi", "ad", "ekipman_tipi", "kapasite_birimi", "tipi", "kapasite"].includes(fieldName)) {
      return String(str).trim();
    }
    
    // Arayüzde "223,00" veya "32.036,00" gibi görünen dizeyi JS'in anlayacağı saf float'a çevirir
    let cleanStr = str.toString().trim();
    
    // Nokta binlik, virgül ondalık ayracı ise (tr-TR): Noktaları sil, virgülü noktaya çevir
    if (cleanStr.includes(",") && cleanStr.includes(".")) {
      cleanStr = cleanStr.replace(/\./g, "").replace(",", ".");
    } else if (cleanStr.includes(",")) {
      // Sadece virgül varsa (Ondalık kısmıdır)
      cleanStr = cleanStr.replace(",", ".");
    }
    
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  const getSelectionCells = () => {
    if (!selection.start || !selection.end) return [];
    const { start, end } = selection;
    const rowMin = Math.min(start.row, end.row);
    const rowMax = Math.max(start.row, end.row);
    const colMin = Math.min(start.col, end.col);
    const colMax = Math.max(start.col, end.col);

    const cells = [];
    for (let r = rowMin; r <= rowMax; r++) {
      for (let c = colMin; c <= colMax; c++) {
        cells.push({ row: r, col: c });
      }
    }
    return cells;
  };

  const isCellSelected = (row, col) => {
    const cells = getSelectionCells();
    return cells.some(cell => cell.row === row && cell.col === col);
  };

  const handleRowDeleteClick = (rowIndex) => {
    onDataChange(prev => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], isDeleted: true };
      return updated;
    });
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Delete") return;
      if (!selection.start || editingCell.row !== null) return;

      const cells = getSelectionCells();
      onDataChange(prev => {
        const updated = [...prev];
        cells.forEach(({ row, col }) => {
          const key = fields[col];
          if (key) {
            updated[row] = { ...updated[row], [key]: ["model", "pompa_adi", "ad", "ekipman_tipi", "tipi", "kapasite"].includes(key) ? "" : 0 };
          }
        });
        return updated;
      });
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selection, fields, editingCell, onDataChange]);

  useEffect(() => {
    const onCopy = (e) => {
      if (document.activeElement.getAttribute("contenteditable") === "true") return;
      const cells = getSelectionCells();
      if (!cells.length) return;

      const rows = [];
      const rowGroups = {};

      cells.forEach(({ row, col }) => {
        if (!rowGroups[row]) rowGroups[row] = [];
        const key = fields[col];
        const val = data[row][key] || "";
        rowGroups[row].push({ col, val });
      });

      Object.keys(rowGroups).sort((a, b) => Number(a) - Number(b)).forEach(r => {
        const sorted = rowGroups[r].sort((a, b) => a.col - b.col);
        rows.push(sorted.map(x => x.val).join("\t"));
      });

      const text = rows.join("\n");
      e.clipboardData.setData("text/plain", text);
      e.preventDefault();
    };

    const onPaste = (e) => {
      if (document.activeElement.getAttribute("contenteditable") === "true") return;
      const text = e.clipboardData.getData("text/plain");
      if (!text) return;

      const start = selection.start;
      if (!start) return;

      const rows = text.split(/\r?\n/).map(r => r.split("\t"));

      onDataChange(prev => {
        const updated = [...prev];
        rows.forEach((rowVals, i) => {
          const rIndex = start.row + i;
          if (rIndex >= updated.length) return;

          rowVals.forEach((val, j) => {
            const cIndex = start.col + j;
            const key = fields[cIndex];
            if (key) {
              updated[rIndex] = { ...updated[rIndex], [key]: parseCellValue(val, key) };
            }
          });
        });
        return updated;
      });
      e.preventDefault();
    };

    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
    };
  }, [selection, data, fields, onDataChange]);

  const handleCellBlur = (rowIndex, colIndex, textValue) => {
    const columnKey = fields[colIndex]; 
    if (!columnKey) return;

    onDataChange(prev => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [columnKey]: parseCellValue(textValue, columnKey) };
      return updated;
    });
    setEditingCell({ row: null, col: null });
  };

  const gridTableStyle = {
    borderCollapse: "separate",
    borderSpacing: 0,
    width: "100%",
    backgroundColor: "#0f172a", 
    color: "#cbd5e1", 
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: "11.5px", 
    userSelect: "none"
  };

  const thStyle = {
    backgroundColor: "#1e293b", 
    borderBottom: "2px solid #334155",
    borderRight: "1px solid #1e293b",
    padding: "6px 10px", 
    fontWeight: "600",
    textAlign: "center",
    color: "#94a3b8", 
    letterSpacing: "0.3px"
  };

  return (
    <>
      {/* 🎨 Scrollbar'ları modernleştirmek için dinamik CSS enjekte ediyoruz */}
      <style>{`
        .custom-excel-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-excel-container::-webkit-scrollbar-track {
          background: #0f172a; 
          border-radius: 6px;
        }
        .custom-excel-container::-webkit-scrollbar-thumb {
          background: #1e293b; 
          border-radius: 6px;
          border: 1px solid #334155;
        }
        .custom-excel-container::-webkit-scrollbar-thumb:hover {
          background: #00874e; 
        }
      `}</style>

      <div
        ref={tableRef}
        className="table-responsive border border-secondary border-opacity-25 custom-excel-container"
        onMouseUp={() => setIsDragging(false)}
        style={{ overflow: "auto", maxHeight: "650px", borderRadius: "6px", outline: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)" }}
      >
        <table style={gridTableStyle}>
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ ...thStyle, width: "35px", backgroundColor: "#020617", color: "#475569", borderRight: "1px solid #1e293b" }}>#</th>
              {headers.map((h, i) => (
                <th key={i} style={thStyle}>{h}</th>
              ))}
              {isMainTable && <th style={{ ...thStyle, width: "50px" }}>İşlem</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} style={{ transition: "background-color 0.15s ease" }} className="grid-row-hover">
                <td style={{ ...thStyle, backgroundColor: "#0f172a", borderRight: "1px solid #1e293b", borderBottom: "1px solid #1e293b", fontWeight: "bold", color: "#475569" }}>
                  {rowIndex + 1}
                </td>

                {fields.map((field, colIndex) => {
                  const isSelected = isCellSelected(rowIndex, colIndex);
                  const isEditing = editingCell.row === rowIndex && editingCell.col === colIndex;
                  
                  // 🚀 'tipi' ve 'kapasite' alanları da dize olarak algılansın
                  const isStringField = ["model", "pompa_adi", "ad", "ekipman_tipi", "kapasite_birimi", "tipi", "kapasite"].includes(field) || (typeof row[field] === "string" && isNaN(row[field]));

                  const getEditText = () => {
                    if (row[field] === undefined || row[field] === null) return "";
                    if (isStringField || field === "sale_amount") return String(row[field]);
                    return Number(row[field]).toFixed(2);
                  };

                  return (
                    <td
                      key={field}
                      contentEditable={isEditing}
                      suppressContentEditableWarning
                      onDoubleClick={(e) => {
                        setEditingCell({ row: rowIndex, col: colIndex });
                        e.currentTarget.innerText = getEditText();
                      }}
                      onBlur={(e) => handleCellBlur(rowIndex, colIndex, e.currentTarget.innerText)}
                      onMouseDown={() => {
                        if (isEditing) return;
                        setIsDragging(true);
                        setSelection({ start: { row: rowIndex, col: colIndex }, end: { row: rowIndex, col: colIndex } });
                      }}
                      onMouseEnter={() => {
                        if (!isDragging || isEditing) return;
                        setSelection(prev => ({ ...prev, end: { row: rowIndex, col: colIndex } }));
                      }}
                      style={{
                        borderRight: "1px solid #1e293b",
                        borderBottom: "1px solid #1e293b",
                        borderTop: isSelected ? "1px solid #00874e" : "transparent",
                        borderLeft: isSelected ? "1px solid #00874e" : "transparent",
                        outline: isSelected ? "1px solid #00874e" : "none",
                        backgroundColor: isEditing ? "#00663a" : isSelected ? "rgba(0, 135, 78, 0.15)" : "#131c2e",
                        color: isEditing ? "#ffffff" : isStringField ? "#94a3b8" : "#22c55e", // Seçili alanlar dışındakiler de okunabilir yeşil/gri kalsın diye düzenlendi
                        padding: "5px 8px", 
                        textAlign: isStringField ? "center" : "right",
                        fontWeight: isStringField ? "600" : "500",
                        minWidth: isStringField ? "100px" : "115px"
                      }}
                    >
                      {isEditing ? getEditText() : formatCellValue(row[field], field)}
                    </td>
                  );
                })}

                {isMainTable && (
                  <td style={{ borderBottom: "1px solid #1e293b", borderRight: "1px solid #1e293b", textAlign: "center", padding: "2px" }}>
                    <button 
                      type="button" 
                      className="btn btn-sm text-danger p-0 shadow-none border-0 bg-transparent"
                      onClick={() => handleRowDeleteClick(rowIndex)}
                      style={{ opacity: 0.7, transition: "opacity 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
                      title="Satırı Sil"
                    >
                      <i className="bi bi-trash3-fill" style={{ fontSize: "11px" }}></i>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ExcelGrid;