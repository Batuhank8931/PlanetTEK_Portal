import React, { useState, useEffect, useRef } from "react";

const ExcelGrid = ({ headers, data, fields, onDataChange }) => {
  const tableRef = useRef(null);

  const [selection, setSelection] = useState({ start: null, end: null });
  const [isDragging, setIsDragging] = useState(false);
  const [editingCell, setEditingCell] = useState({ row: null, col: null });

  // --- Sayı Biçimlendirme Yardımcıları ---
  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num) || num === "") return "";
    return new Intl.NumberFormat("tr-TR").format(num);
  };

  const parseNumber = (str) => {
    if (!str) return 0;
    // İçindeki noktaları temizle, excel'den virgüllü geldiyse noktaya çevir
    const cleanStr = str.toString().replace(/\./g, "").replace(",", ".").trim();
    const num = Number(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  // --- Seçim Alanı Hesaplamaları ---
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

  // --- Seçili Hücreleri Delete İle Temizleme ---
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Delete") return;
      if (!selection.start || editingCell.row !== null) return; // Hücre içi düzenlemedeyse silmesin

      const cells = getSelectionCells();
      onDataChange(prev => {
        const updated = [...prev];
        cells.forEach(({ row, col }) => {
          if (col === 0) return; // İsim/Kapasite kolonu silinmesin
          const key = fields[col - 1];
          if (key) {
            updated[row] = { ...updated[row], [key]: 0 }; // Fiyatı sıfırla
          }
        });
        return updated;
      });
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selection, fields, editingCell, onDataChange]);

  // --- Yerel Copy / Paste Event Manipülasyonu ---
  useEffect(() => {
    const onCopy = (e) => {
      // Eğer kullanıcı bir hücrenin içinde metin seçiyorsa kopyalamayı bozma
      if (document.activeElement.getAttribute("contenteditable") === "true") return;

      const cells = getSelectionCells();
      if (!cells.length) return;

      const rows = [];
      const rowGroups = {};

      cells.forEach(({ row, col }) => {
        if (!rowGroups[row]) rowGroups[row] = [];
        // İlk kolon metin, diğerleri sayı formatlı hali veya ham veri
        const val = col === 0 ? (data[row].name || data[row].kapasite || data[row].tipi || data[row].ad) : (data[row][fields[col - 1]] || 0);
        rowGroups[row].push({ col, val });
      });

      Object.keys(rowGroups).sort((a, b) => a - b).forEach(r => {
        const sorted = rowGroups[r].sort((a, b) => a.col - b.col);
        rows.push(sorted.map(x => x.val).join("\t"));
      });

      const text = rows.join("\n");
      e.clipboardData.setData("text/plain", text);
      e.preventDefault();
    };

    const onPaste = (e) => {
      // Hücre içine odaklanıp çift tıklanmışsa standart yapıştırmaya izin ver
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
          if (rIndex >= updated.length) return; // Mevcut satır sayısını aşmasın

          rowVals.forEach((val, j) => {
            const cIndex = start.col + j;
            if (cIndex === 0) return; // İlk kolona (İsim/Kapasite) yapıştırma yapılmasın

            const key = fields[cIndex - 1];
            if (key) {
              updated[rIndex] = {
                ...updated[rIndex],
                [key]: parseNumber(val)
              };
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
    const columnKey = fields[colIndex - 1];
    onDataChange(prev => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        [columnKey]: parseNumber(textValue)
      };
      return updated;
    });
    setEditingCell({ row: null, col: null });
  };

  // --- ŞIK KOYU TEMA STİLLERİ ---
  const gridTableStyle = {
    borderCollapse: "collapse",
    width: "100%",
    backgroundColor: "#1e293b",
    color: "#ffffff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: "12px",
    userSelect: "none"
  };

  const thStyle = {
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    padding: "8px 12px",
    fontWeight: "600",
    textAlign: "center",
    color: "#94a3b8"
  };

  return (
    <div
      ref={tableRef}
      className="table-responsive"
      onMouseUp={() => setIsDragging(false)}
      style={{ overflow: "auto", maxHeight: "650px", borderRadius: "8px", outline: "none" }}
    >
      <table style={gridTableStyle}>
        <thead style={{ sticky: "top", zIndex: 10 }}>
          <tr>
            <th style={{ ...thStyle, width: "45px", backgroundColor: "#020617", color: "#475569" }}>#</th>
            {headers.map((h, i) => (
              <th key={i} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} style={{ borderBottom: "1px solid #334155" }}>
              {/* Satır Numarası */}
              <td style={{ ...thStyle, backgroundColor: "#0f172a", fontWeight: "bold", color: "#64748b" }}>
                {rowIndex + 1}
              </td>

              {/* Sabit İsim Kolonu (Seçilebilir ama verisi paste ile ezilemez) */}
              <td
                onMouseDown={() => {
                  setIsDragging(true);
                  setSelection({ start: { row: rowIndex, col: 0 }, end: { row: rowIndex, col: 0 } });
                }}
                onMouseEnter={() => {
                  if (!isDragging) return;
                  setSelection(prev => ({ ...prev, end: { row: rowIndex, col: 0 } }));
                }}
                style={{
                  border: isCellSelected(rowIndex, 0) ? "2px solid #38bdf8" : "1px solid #334155",
                  backgroundColor: isCellSelected(rowIndex, 0) ? "rgba(56, 189, 248, 0.15)" : "#1e293b",
                  padding: "6px 12px",
                  fontWeight: "bold",
                  color: "#ffffff",
                  minWidth: "160px"
                }}
              >
                {row.name || row.kapasite || row.tipi || row.ad}
              </td>

              {/* Düzenlenebilir Fiyat Hücreleri */}
              {fields.map((field, colIndex) => {
                const realColIndex = colIndex + 1; // İsim kolonundan ötürü 1 kaydırıyoruz
                const isSelected = isCellSelected(rowIndex, realColIndex);
                const isEditing = editingCell.row === rowIndex && editingCell.col === realColIndex;

                return (
                  <td
                    key={field}
                    contentEditable={isEditing}
                    suppressContentEditableWarning
                    onDoubleClick={(e) => {
                      setEditingCell({ row: rowIndex, col: realColIndex });
                      // Çift tıklandığında içindeki sayıyı ham metin yap ki nokta kriz yaratmasın
                      e.currentTarget.innerText = row[field] || "";
                    }}
                    onBlur={(e) => handleCellBlur(rowIndex, realColIndex, e.currentTarget.innerText)}
                    onMouseDown={() => {
                      if (isEditing) return;
                      setIsDragging(true);
                      setSelection({
                        start: { row: rowIndex, col: realColIndex },
                        end: { row: rowIndex, col: realColIndex }
                      });
                    }}
                    onMouseEnter={() => {
                      if (!isDragging || isEditing) return;
                      setSelection(prev => ({
                        ...prev,
                        end: { row: rowIndex, col: realColIndex }
                      }));
                    }}
                    style={{
                      border: isSelected ? "2px solid #38bdf8" : "1px solid #334155",
                      backgroundColor: isEditing ? "#0284c7" : isSelected ? "rgba(56, 189, 248, 0.15)" : "#0f172a",
                      color: isEditing ? "#ffffff" : "#38bdf8",
                      padding: "6px 12px",
                      textAlign: "right",
                      fontWeight: "500",
                      minWidth: "130px",
                      outline: "none"
                    }}
                  >
                    {isEditing ? row[field] : formatNumber(row[field])}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExcelGrid;