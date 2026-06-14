import React, { useState, useEffect } from "react";

function ExcelGrid({ headers, data, fields, onDataChange }) {
  const [selection, setSelection] = useState(null); // { startRow, startCol, endRow, endCol }
  const [isSelecting, setIsSelecting] = useState(false);

  // --- UNDO / REDO STATE ---
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const updateDataWithHistory = (newData) => {
    setPast(prev => [...prev.slice(-49), data]);
    setFuture([]);
    onDataChange(newData);
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setPast(newPast);
    setFuture(prev => [data, ...prev]);
    onDataChange(previous);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setFuture(newFuture);
    setPast(prev => [...prev, data]);
    onDataChange(next);
  };

  // Sayı formatlama
  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return "";
    return new Intl.NumberFormat("tr-TR").format(num);
  };

  const parseNumber = (str) => {
    const cleanStr = str.replace(/\./g, "").replace(/,/g, ".");
    return cleanStr === "" ? 0 : Number(cleanStr);
  };

  // Mouse Seçim Mantığı
  const handleMouseDown = (rowIndex, colIndex) => {
    if (colIndex === 0) return;
    setIsSelecting(true);
    setSelection({ startRow: rowIndex, startCol: colIndex, endRow: rowIndex, endCol: colIndex });
  };

  const handleMouseEnter = (rowIndex, colIndex) => {
    if (!isSelecting || colIndex === 0) return;
    setSelection(prev => ({ ...prev, endRow: rowIndex, endCol: colIndex }));
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  const isSelected = (rowIndex, colIndex) => {
    if (!selection) return false;
    const { startRow, startCol, endRow, endCol } = selection;
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    return rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol;
  };

  // --- GÜVENLİ KOPYALA / YAPIŞTIR MEKANİZMASI ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // CTRL + Z
      if (isCtrl && key === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }

      // CTRL + Y
      if (isCtrl && key === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (!selection) return;

      // CTRL + C (Kopyalama Düzeltmesi)
      if (isCtrl && key === "c") {
        // Eğer tek bir input seçiliyse ve kullanıcı metin seçtiyse tarayıcıya bırakalım
        if (document.activeElement.tagName === "INPUT" && window.getSelection().toString() !== "") {
          return; 
        }

        e.preventDefault();
        const { startRow, startCol, endRow, endCol } = selection;
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        let clipboardRows = [];
        for (let r = minRow; r <= maxRow; r++) {
          let rowCells = [];
          for (let c = minCol; c <= maxCol; c++) {
            const field = fields[c - 1];
            rowCells.push(data[r]?.[field] || 0);
          }
          clipboardRows.push(rowCells.join("\t"));
        }

        const finalString = clipboardRows.join("\n");
        
        // Hem modern hem eski yöntem garantisi
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(finalString);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = finalString;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
      }

      // CTRL + V (Yapıştırma Düzeltmesi)
      if (isCtrl && key === "v") {
        // Kullanıcı inputun içine çift tıklayıp sadece o hücreyi düzenlemek istiyorsa yapıştırmaya müdahale etme
        if (selection.startRow === selection.endRow && selection.startCol === selection.endCol && document.activeElement.tagName === "INPUT") {
          // Sistem input yapıştırmasını kendi yapsın, history'yi tetiklemek için input'un onChange'i çalışacak
          return; 
        }

        e.preventDefault();

        // En kararlı clipboard okuma yöntemi
        const processClipboardText = (text) => {
          if (!text) return;
          const rows = text.split(/\r?\n/).filter(row => row.length > 0);
          const { startRow, startCol } = selection;
          let updatedData = [...data];

          rows.forEach((rowText, rOffset) => {
            const targetRowIndex = startRow + rOffset;
            if (targetRowIndex >= updatedData.length) return;

            const cells = rowText.split("\t");
            cells.forEach((cellValue, cOffset) => {
              const targetColIndex = startCol + cOffset;
              if (targetColIndex > fields.length) return;

              const field = fields[targetColIndex - 1];
              // Excel formatındaki noktaları ve para birimlerini temizleyen regex
              const cleanValue = cellValue.replace(/[^0-9,-]/g, "").replace(",", ".");
              const cleanNum = Number(cleanValue);
              
              updatedData[targetRowIndex] = {
                ...updatedData[targetRowIndex],
                [field]: isNaN(cleanNum) ? 0 : cleanNum
              };
            });
          });

          updateDataWithHistory(updatedData);
        };

        if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard.readText().then(processClipboardText);
        } else {
          // Tarayıcı Clipboard API'ye izin vermiyorsa fallback (Geri çekilme planı)
          alert("Tarayıcınız panoya erişim izni vermiyor. Lütfen hücreye çift tıklayarak yapıştırın veya tarayıcı izinlerini kontrol edin.");
        }
      }
    };

    // { capture: true } ekleyerek event'in inputlar tarafından yutulmasını engelliyoruz
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [selection, data, fields, past, future]);

  const handleInputChange = (rowIndex, field, val) => {
    const numericValue = parseNumber(val);
    let updatedData = [...data];
    updatedData[rowIndex] = { ...updatedData[rowIndex], [field]: numericValue };
    updateDataWithHistory(updatedData);
  };

  // Stiller
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
    <div>
      <div className="d-flex gap-2 mb-2 justify-content-start align-items-center" style={{ fontSize: "11px" }}>
        <button 
          className="btn btn-dark btn-sm py-2 px-2 border-secondary text-muted" 
          onClick={handleUndo} 
          disabled={past.length === 0}
          style={{ opacity: past.length === 0 ? 0.4 : 1 }}
        >
          <i className="bi bi-arrow-counterclockwise text-warning"></i>
        </button>
        <button 
          className="btn btn-dark btn-sm py-2 px-2 border-secondary text-muted" 
          onClick={handleRedo} 
          disabled={future.length === 0}
          style={{ opacity: future.length === 0 ? 0.4 : 1 }}
        >
          <i className="bi bi-arrow-clockwise text-info"></i>
        </button>
      </div>

      <div className="table-responsive" onMouseUp={handleMouseUp} style={{ overflow: "auto", maxHeight: "650px", borderRadius: "8px" }}>
        <table style={gridTableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: "45px", backgroundColor: "#020617", color: "#475569" }}>#</th>
              {headers.map((h, i) => (
                <th key={i} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} style={{ borderBottom: "1px solid #334155" }}>
                <td style={{ ...thStyle, backgroundColor: "#0f172a", fontWeight: "bold", color: "#64748b" }}>
                  {rowIndex + 1}
                </td>
                <td style={{ border: "1px solid #334155", padding: "6px 12px", backgroundColor: "#1e293b", fontWeight: "bold", color: "#ffffff" }}>
                  {row.name || row.kapasite || row.tipi || row.ad}
                </td>
                {fields.map((field, colIndex) => {
                  const realColIndex = colIndex + 1;
                  const selected = isSelected(rowIndex, realColIndex);

                  return (
                    <td
                      key={field}
                      onMouseDown={() => handleMouseDown(rowIndex, realColIndex)}
                      onMouseEnter={() => handleMouseEnter(rowIndex, realColIndex)}
                      style={{
                        border: selected ? "2px solid #38bdf8" : "1px solid #334155",
                        backgroundColor: selected ? "rgba(56, 189, 248, 0.15)" : "#0f172a",
                        padding: "0",
                        width: "140px"
                      }}
                    >
                      <input
                        type="text"
                        value={formatNumber(row[field])}
                        onChange={(e) => handleInputChange(rowIndex, field, e.target.value)}
                        style={{
                          width: "100%",
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          textAlign: "right",
                          padding: "6px 12px",
                          fontFamily: "inherit",
                          fontSize: "12px",
                          color: "#38bdf8",
                          fontWeight: "500"
                        }}
                  
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ExcelGrid;