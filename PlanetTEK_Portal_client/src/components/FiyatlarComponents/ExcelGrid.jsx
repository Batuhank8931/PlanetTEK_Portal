import React, { useState, useEffect, useRef } from "react";

// 🚀 METİNSEL KOLONLAR BURADAN YÖNETİLİR
// Yeni bir metin kolonu ekleneceğinde sadece bu listeye eklemeniz yeterlidir.
const TEXT_FIELDS = [
  "model",
  "pompa_adi",
  "pompa_tipi",
  "ekipman_adi",
  "ekipman_tipi",
  "kw", // 🚀 BURAYA EKLENDİ - Artık hücre euro sembolü basmayacak ve sağa yaslamak yerine ortalayacak
  "ad",
  "ekipman_tipi",
  "kapasite_birimi",
  "tipi",
  "kapasite",
  "parametre_adi",
  "parametre_key",
  "plakaboyut"
];

const ExcelGrid = ({ headers, data, fields, onDataChange, isMainTable = false, onActionClick }) => {
  const tableRef = useRef(null);

  const [selection, setSelection] = useState({ start: null, end: null });
  const [isDragging, setIsDragging] = useState(false);
  const [editingCell, setEditingCell] = useState({ row: null, col: null });

  // 🛠️ TÜRKÇE/AVRUPA SAYI FORMATI DOSTU BİÇİMLENDİRİCİ
  const formatCellValue = (value, fieldName) => {
    if (value === undefined || value === null || value === "") return "";

    // sale_amount bir adettir, küsuratsız tam sayı bas
    if (fieldName === "sale_amount") return parseInt(value, 10) || 0;

    // 🚀 Metinsel kolon kontrolü sabit diziden yapılıyor
    if (TEXT_FIELDS.includes(fieldName)) return String(value);
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
      return TEXT_FIELDS.includes(fieldName) ? "" : 0;
    }

    // 🚀 Metinsel kolon kontrolü sabit diziden yapılıyor
    if (TEXT_FIELDS.includes(fieldName)) {
      return String(str).trim();
    }

    let cleanStr = str.toString().trim();

    if (cleanStr.includes(",") && cleanStr.includes(".")) {
      cleanStr = cleanStr.replace(/\./g, "").replace(",", ".");
    } else if (cleanStr.includes(",")) {
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
          if (key && key !== "curve_action") { // Aksiyon butonu hücresi silinmesin
            updated[row] = { ...updated[row], [key]: TEXT_FIELDS.includes(key) ? "" : 0 };
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
        if (key === "curve_action") return; // Aksiyon sütununu kopyalamaya dahil etme
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

    document.addEventListener("copy", onCopy);
    return () => {
      document.removeEventListener("copy", onCopy);
    };
  }, [selection, data, fields]);

  useEffect(() => {
    const onPaste = (e) => {
      if (editingCell.row !== null) return;
      if (!selection.start) return;

      const clipboardData = e.clipboardData || window.clipboardData;
      const pastedData = clipboardData.getData("Text");
      if (!pastedData) return;

      e.preventDefault();

      const rows = pastedData.split(/\r?\n/);
      if (rows.length && rows[rows.length - 1] === "") {
        rows.pop();
      }

      const startRow = Math.min(selection.start.row, selection.end?.row ?? selection.start.row);
      const startCol = Math.min(selection.start.col, selection.end?.col ?? selection.start.col);

      onDataChange((prev) => {
        const updated = [...prev];

        rows.forEach((rowText, rIndex) => {
          const targetRowIndex = startRow + rIndex;
          if (targetRowIndex >= updated.length) return;

          const cols = rowText.split("\t");
          let skippedCols = 0;

          cols.forEach((cellValue, cIndex) => {
            const targetColIndex = startCol + cIndex + skippedCols;
            if (targetColIndex >= fields.length) return;

            let fieldKey = fields[targetColIndex];

            if (fieldKey === "curve_action") {
              skippedCols++;
              const actualTargetColIndex = startCol + cIndex + skippedCols;
              if (actualTargetColIndex >= fields.length) return;
              fieldKey = fields[actualTargetColIndex];
            }

            if (fieldKey) {
              const parsedValue = parseCellValue(cellValue, fieldKey);
              updated[targetRowIndex] = {
                ...updated[targetRowIndex],
                [fieldKey]: parsedValue,
              };
            }
          });
        });

        return updated;
      });
    };

    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("paste", onPaste);
    };
  }, [selection, fields, editingCell, onDataChange]);

  const handleCellBlur = (rowIndex, colIndex, textValue) => {
    const columnKey = fields[colIndex];
    if (!columnKey || columnKey === "curve_action") return;

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
              {headers.map((h, i) => {
                const isActionHeader = h === "@";
                return (
                  <th
                    key={i}
                    style={{
                      ...thStyle,
                      ...(isActionHeader ? { width: "35px", minWidth: "35px", maxWidth: "35px" } : {})
                    }}
                  >
                    {h}
                  </th>
                );
              })}
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
                  if (field === "curve_action") {
                    const isNewPump = String(row.id).startsWith("new_");
                    return (
                      <td
                        key={field}
                        className="text-center align-middle p-0"
                        style={{
                          borderRight: "1px solid #1e293b",
                          borderBottom: "1px solid #1e293b",
                          width: "35px",
                          minWidth: "35px",
                          maxWidth: "35px",
                          backgroundColor: "#131c2e"
                        }}
                      >
                        <button
                          type="button"
                          className={`btn btn-sm p-0 border-0 bg-transparent ${isNewPump ? 'text-secondary opacity-25' : 'text-info'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isNewPump && onActionClick) {
                              onActionClick(row);
                            }
                          }}
                          disabled={isNewPump}
                          title={isNewPump ? "Önce pompayı kaydetmelisiniz." : "Pompa eğrisini düzenle"}
                          style={{ cursor: isNewPump ? "not-allowed" : "pointer" }}
                        >
                          <i className="bi bi-activity" style={{ fontSize: "14px" }}></i>
                        </button>
                      </td>
                    );
                  }

                  const isSelected = isCellSelected(rowIndex, colIndex);
                  const isEditing = editingCell.row === rowIndex && editingCell.col === colIndex;

                  // 🚀 Sabit değişkenden kontrol ediliyor
                  const isStringField = TEXT_FIELDS.includes(field) || (typeof row[field] === "string" && isNaN(row[field]));

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
                        color: isEditing ? "#ffffff" : isStringField ? "#94a3b8" : "#22c55e",
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