import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";

const PARAMETER_TEMPLATES = [
  { key: "debi", label: "Debi", unit: "m³/gün" },
  { key: "girisBoi", label: "Giriş BOİ₅", unit: "mg/l" },
  { key: "cikisBoi", label: "Çıkış BOİ₅", unit: "mg/l" },
  { key: "sicaklik", label: "Atıksu Sıcaklığı", unit: "°C" },
  { key: "girisAmonyum", label: "Giriş Amonyumu (NH₄-N)", unit: "mg/l", requiresNitrifikasyon: true },
  { key: "cikisAmonyum", label: "Çıkış Amonyumu (NH₄-N)", unit: "mg/l", requiresNitrifikasyon: true }
];

function KapakTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const storeKapak = formData?.tables?.kapaktablosu;

  // Tasarım verilerini şablona göre eşleştiren temel jeneratör fonksiyonu
  const generateRowsFromDesign = () => {
    const pDetails = formData?.planetDiskDetails?.tasarim?.aritmaParametreleri || {};
    const hasNitrifikasyon = pDetails.nitrifikasyon === "nitrifikasyonVar";

    return PARAMETER_TEMPLATES
      .filter(param => !param.requiresNitrifikasyon || hasNitrifikasyon)
      .map((param, index) => ({
        id: `design_${param.key}_${index}`,
        label: param.label,
        value: pDetails[param.key] !== undefined ? String(pDetails[param.key]) : "0",
        isNumeric: true,
        unit: param.unit,
        isUrgent: false
      }));
  };

  // 1. BASAMAK: Eğer store'da kapaktablosu datası dolu ise direkt onu al, yoksa sıfırdan hesapla
  const [rows, setRows] = useState(() => {
    if (storeKapak && storeKapak.length > 0) {
      return storeKapak;
    }
    return generateRowsFromDesign();
  });

  const [history, setHistory] = useState([]);

  // Girdi verileri değiştikçe yerel state'i sadece tasarım satırları için reaktif koru
  useEffect(() => {
    // Eğer store'da zaten kaydedilmiş bir data varsa dış tasarım değişikliklerinin tabloyu ezmesini engellemek için kontrol ekleyebilirsiniz.
    // Şimdilik mevcut akış mantığını koruyoruz.
    const freshRows = generateRowsFromDesign();
    setRows(prevRows => {
      if (prevRows.length === 0) return freshRows;
      return freshRows.map(fRow => {
        const existing = prevRows.find(p => p.id === fRow.id);
        return existing ? { ...fRow, value: existing.value, label: existing.label, unit: existing.unit } : fRow;
      }).concat(prevRows.filter(p => !p.id.toString().startsWith("design_")));
    });
  }, [formData?.planetDiskDetails?.tasarim?.aritmaParametreleri]);

  // Rows değiştikçe Zustand store'u besle (Yenilenmiş yeni array referansı ile)
  useEffect(() => {
    updateSection("tables", {
      ...formData?.tables,
      kapaktablosu: [...rows]
    });
  }, [rows]);

  // 2. BASAMAK: YENİLEME FONKSİYONU
  // Dataları temizler, tasarımdan verileri yeniden hesaplar ve render eder.
  const handleRefresh = () => {
    setHistory([]); // Geçmişi temizle
    const freshRows = generateRowsFromDesign();
    setRows(freshRows);
  };

  const saveToHistory = (currentRows) => {
    setHistory([...history, JSON.stringify(currentRows)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = JSON.parse(history[history.length - 1]);
    setRows(previousState);
    setHistory(history.slice(0, -1));
  };

  const handleCellChange = (id, field, newValue) => {
    saveToHistory(rows);
    setRows(rows.map(row => row.id === id ? { ...row, [field]: newValue } : row));
  };

  const insertAfterRow = (index) => {
    saveToHistory(rows);
    const newId = `new_${Date.now()}`;
    const newRow = { id: newId, label: "Yeni Parametre Adı", value: "0", isNumeric: true, unit: "-", isUrgent: false };

    const updatedRows = [...rows];
    updatedRows.splice(index + 1, 0, newRow);
    setRows(updatedRows);
  };

  const deleteRow = (id) => {
    saveToHistory(rows);
    setRows(rows.filter(row => row.id !== id));
  };

  return (
    <div className="d-flex flex-column w-100">
      <style>{`
        .table-row-custom { border-bottom: 1px solid #334155; transition: background-color 0.15s ease; }
        .table-row-custom:last-child { border-bottom: none; }
        .bg-normal { background-color: #1e293b; }
        .bg-normal:hover { background-color: #243249 !important; }
        .custom-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.05) !important; }
        .opacity-hover:hover { opacity: 1 !important; }
      `}</style>

      <div className="d-flex flex-column rounded-3 overflow-hidden" style={{ border: "1px solid #334155" }}>
        
        {/* ÜST PANEL */}
        <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
          <div className="fw-semibold text-white" style={{ fontSize: "14px" }}>
            Kapak Tablosu Parametreleri
          </div>

          {/* YENİLE VE GERİ AL BUTONLARI YAN YANA */}
          <div className="d-flex align-items-center gap-2">
            {/* Yenileme Butonu */}
            <button
              onClick={handleRefresh}
              className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
              style={{
                backgroundColor: "#d97706",
                fontSize: "11px",
                borderRadius: "6px",
                transition: "0.2s",
                cursor: "pointer"
              }}
              title="Tabloyu İlk Tasarım Ayarlarına Döndür"
            >
              🔄 Yenile
            </button>

            {/* Geri Al Butonu */}
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
              style={{
                backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a",
                fontSize: "11px",
                borderRadius: "6px",
                transition: "0.2s",
                opacity: history.length === 0 ? 0.4 : 1,
                cursor: history.length === 0 ? "not-allowed" : "pointer"
              }}
            >
              ↶ Geri Al
            </button>
          </div>
        </div>

        <div style={{ overflowY: "auto" }}>
          {rows.map((row, index) => (
            <div key={row.id} className="d-flex align-items-stretch table-row-custom bg-normal">
              <div className="p-2.5 px-3 d-flex align-items-center" style={{ width: "55%" }}>
                <input
                  type="text"
                  className="form-control form-control-sm text-start text-white bg-transparent border-0 fw-medium p-1 custom-input rounded"
                  style={{ fontSize: "12px", boxShadow: "none", width: "100%" }}
                  value={row.label}
                  onChange={(e) => handleCellChange(row.id, "label", e.target.value)}
                />
              </div>

              <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

              <div className="p-2.5 px-3 d-flex align-items-center justify-content-end gap-2" style={{ width: "45%" }}>
                <input
                  type="text"
                  className="form-control form-control-sm text-end fw-bold text-white bg-transparent border-0 p-1 custom-input rounded"
                  style={{ fontSize: "12px", boxShadow: "none", width: "65%" }}
                  value={row.value}
                  placeholder="0.00"
                  onChange={(e) => handleCellChange(row.id, "value", e.target.value)}
                />

                <input
                  type="text"
                  className="form-control form-control-sm text-start text-white-50 bg-transparent border-0 p-0 custom-input rounded ps-1"
                  style={{ fontSize: "11px", minWidth: "45px", width: "45px", boxShadow: "none" }}
                  value={row.unit}
                  placeholder="birim"
                  onChange={(e) => handleCellChange(row.id, "unit", e.target.value)}
                />

                <div style={{ width: "1px", height: "14px", backgroundColor: "#334155" }}></div>

                <div className="d-flex align-items-center gap-2 ms-1">
                  <button
                    onClick={() => insertAfterRow(index)}
                    className="btn btn-sm p-0 border-0 text-success opacity-50 opacity-hover fw-bold"
                    style={{ fontSize: "16px", lineHeight: "1", width: "15px" }}
                    title="Altına Yeni Satır Ekle"
                  >
                    +
                  </button>
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="btn btn-sm p-0 border-0 text-danger opacity-50 opacity-hover"
                    style={{ fontSize: "16px", lineHeight: "1", width: "15px" }}
                    title="Satırı Sil"
                  >
                    &times;
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default KapakTablosu;