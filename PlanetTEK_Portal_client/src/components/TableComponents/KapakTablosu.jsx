import React, { useState } from "react";

function KapakTablosu() {
  const [rows, setRows] = useState([
    { id: 1, label: "Teklif Numarası", value: "YİD R0 01 01 2026 8 MX 1 70 25 0", isNumeric: false, unit: "", isUrgent: false },
    { id: 2, label: "Giriş BOİ₅", value: "350", isNumeric: true, unit: "mg/l", isUrgent: false },
    { id: 3, label: "Çıkış BOİ₅ (ikincil arıtma sonrası)", value: "40", isNumeric: true, unit: "mg/l", isUrgent: false },
    { id: 4, label: "Çıkış BOİ₅ (üçüncül arıtma sonrası)", value: "20", isNumeric: true, unit: "mg/l", isUrgent: true }, // Default Kırmızı
    { id: 5, label: "Atıksu Sıcaklığı", value: "19", isNumeric: true, unit: "°C", isUrgent: false },
    { id: 6, label: "Projedeki Toplam Disk Yüzey Alanı (PlanetTEK Tarafından tasarlanmıştır.)", value: "0,00", isNumeric: true, unit: "m²", isUrgent: false },
  ]);

  const handleValueChange = (id, newValue) => {
    setRows(rows.map(row => row.id === id ? { ...row, value: newValue } : row));
  };

  const addNewRow = () => {
    const newId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) + 1 : 1;
    setRows([
      ...rows,
      { id: newId, label: "Yeni Parametre Adı", value: "0", isNumeric: true, unit: "-", isUrgent: false }
    ]);
  };

  const deleteRow = (id) => {
    setRows(rows.filter(row => row.id !== id));
  };

  return (
    <div className="d-flex flex-column gap-3 w-100">
      
      {/* CSS Stil Enjeksiyonu */}
      <style>{`
        .table-row-custom {
          border-bottom: 1px solid #334155;
          transition: background-color 0.15s ease;
        }
        .table-row-custom:last-child {
          border-bottom: none;
        }
        .bg-normal {
          background-color: #1e293b;
        }
        .bg-normal:hover {
          background-color: #243249 !important;
        }
        .bg-urgent {
          background-color: #991b1b !important;
        }
        .bg-urgent:hover {
          background-color: #b91c1c !important;
        }
        .custom-input:focus {
          outline: none;
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>

      {/* Blok Tablo Yapısı */}
      <div 
        className="d-flex flex-column rounded-3 overflow-hidden" 
        style={{ border: "1px solid #334155", maxHeight: "60vh", overflowY: "auto" }}
      >
        {rows.map((row) => (
          <div 
            key={row.id} 
            className={`d-flex align-items-stretch table-row-custom ${row.isUrgent ? 'bg-urgent' : 'bg-normal'}`}
          >
            {/* SOL KOLON: Parametre Adı */}
            <div className="p-2.5 px-3 d-flex align-items-center" style={{ width: "60%" }}>
              <input
                type="text"
                className="form-control form-control-sm text-start text-white bg-transparent border-0 fw-medium p-1 custom-input rounded"
                style={{ fontSize: "12px", boxShadow: "none", width: "100%" }}
                value={row.label}
                onChange={(e) => {
                  setRows(rows.map(r => r.id === row.id ? { ...r, label: e.target.value } : r));
                }}
              />
            </div>

            {/* ORTAK DİKEY ÇİZGİ */}
            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

            {/* SAĞ KOLON: Değerler, Birim ve Silme Butonu */}
            <div className="p-2.5 px-3 d-flex align-items-center justify-content-end gap-2" style={{ width: "40%" }}>
              <input
                type="text"
                className="form-control form-control-sm text-end fw-bold text-white bg-transparent border-0 p-1 custom-input rounded"
                style={{ fontSize: "12px", boxShadow: "none", width: "75%" }}
                value={row.value}
                placeholder="0.00"
                onChange={(e) => handleValueChange(row.id, e.target.value)}
              />
              
              {/* Birim Alanı */}
              <span className="text-white-50 text-start ps-1" style={{ fontSize: "11px", minWidth: "45px" }}>
                {row.unit}
              </span>
              
              {/* Silme Butonu */}
              <button 
                onClick={() => deleteRow(row.id)}
                className="btn btn-sm p-0 border-0 text-danger opacity-50 hover-opacity-100 ms-1"
                style={{ fontSize: "16px", lineHeight: "1", width: "15px" }}
                title="Satırı Sil"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Satır Ekleme Butonu */}
      <div className="d-flex justify-content-start">
        <button 
          onClick={addNewRow}
          className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1"
          style={{ backgroundColor: "#2e7d32", fontSize: "11px", borderRadius: "6px", transition: "0.2s" }}
        >
          <span style={{ fontSize: "14px" }}>+</span> Yeni Satır Ekle
        </button>
      </div>

    </div>
  );
}

export default KapakTablosu;