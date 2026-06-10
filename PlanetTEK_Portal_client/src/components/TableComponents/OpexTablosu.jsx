import React, { useState } from "react";

function OpexTablosu() {
    // Görseldeki varsayılan verilerle state'i başlatıyoruz
    const [rows, setRows] = useState([
        { id: 1, label: "Enerji Giderleri", value: 3850, unit: "€/yıl" },
        { id: 2, label: "Sarf Malzemesi ve Bakım Giderleri", value: 285, unit: "€/yıl" }
    ]);

    // Sağ taraftaki değerlerin ve sol taraftaki tanımların güncellenmesi
    const handleInputChange = (id, field, newValue) => {
        setRows(rows.map(row => row.id === id ? { ...row, [field]: newValue } : row));
    };

    // Tıklanan satırın hemen altına yeni gider kalemi ekleyen fonksiyon
    const insertAfterRow = (index) => {
        const currentMaxId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) : 0;
        const newId = Math.max(currentMaxId, Date.now()) + 1;

        const newRow = { id: newId, label: "Yeni İşletme Gideri Tanımı", value: 0, unit: "€/yıl" };

        const updatedRows = [...rows];
        updatedRows.splice(index + 1, 0, newRow);
        setRows(updatedRows);
    };


    // Satır silme fonksiyonu
    const deleteRow = (id) => {
        setRows(rows.filter(row => row.id !== id));
    };

    // Dinamik Genel Toplam Hesaplama
    const totalOpex = rows.reduce((sum, row) => sum + (parseFloat(row.value) || 0), 0);

    return (
        <div className="d-flex flex-column gap-3 w-100">

            <style>{`
        .table-row-opex {
          background-color: #1e293b;
          border-bottom: 1px solid #334155;
          transition: background-color 0.15s ease;
        }
        .table-row-opex:hover {
          background-color: #243249 !important;
        }
        .opex-input:focus {
          outline: none;
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        .header-cell-opex {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          background-color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .total-row-opex {
          background-color: #111827;
          border-top: 2px solid #4ade80;
        }
      `}</style>

            {/* Blok Tablo Yapısı */}
            <div
                className="d-flex flex-column rounded-3 overflow-hidden"
                style={{ border: "1px solid #334155", height: "auto" }}
            >
                {/* TABLO BAŞLIĞI (HEADER) */}
                <div className="d-flex align-items-stretch border-bottom" style={{ borderColor: "#334155" }}>
                    <div className="p-2 px-3 header-cell-opex" style={{ width: "60%" }}>Giderlerin Tanımları</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-3 header-cell-opex text-end" style={{ width: "35%" }}>Toplam Fiyat</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 header-cell-opex text-center" style={{ width: "5%" }}>Aksiyon</div>
                </div>

                {/* TABLO SATIRLARI */}
                {rows.map((row, index) => (
                    <div
                        key={row.id}
                        className="d-flex align-items-stretch table-row-opex"
                    >
                        {/* 1. KOLON: Gider Tanımı */}
                        <div className="p-2.5 px-3 d-flex align-items-center" style={{ width: "60%" }}>
                            <input
                                type="text"
                                className="form-control form-control-sm text-start text-white bg-transparent border-0 fw-medium p-1 opex-input rounded"
                                style={{ fontSize: "12px", boxShadow: "none", width: "100%" }}
                                value={row.label}
                                onChange={(e) => handleInputChange(row.id, "label", e.target.value)}
                            />
                        </div>

                        {/* ORTAK DİKEY ÇİZGİ */}
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                        {/* 2. KOLON: Değer ve Birim */}
                        <div className="p-2.5 px-3 d-flex align-items-center justify-content-end gap-2" style={{ width: "35%" }}>
                            <input
                                type="number"
                                className="form-control form-control-sm text-end fw-bold text-white bg-transparent border-0 p-1 opex-input rounded"
                                style={{ fontSize: "12px", boxShadow: "none", width: "65%" }}
                                value={row.value}
                                onChange={(e) => handleInputChange(row.id, "value", e.target.value)}
                            />

                            {/* Birim Alanı */}
                            <span className="text-white-50 text-start ps-1" style={{ fontSize: "11px", minWidth: "50px" }}>
                                {row.unit}
                            </span>
                        </div>

                        {/* ORTAK DİKEY ÇİZGİ */}
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                        {/* 3. KOLON: AKSİYON PANELİ */}
                        <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "5%" }}>
                            <button
                                onClick={() => insertAfterRow(index)}
                                className="btn btn-sm p-0 border-0 text-success opacity-50 hover-opacity-100 fw-bold"
                                style={{ fontSize: "15px", lineHeight: "1" }}
                                title="Altına Yeni Gider Ekle"
                            >
                                +
                            </button>
                            <button
                                onClick={() => deleteRow(row.id)}
                                className="btn btn-sm p-0 border-0 text-danger opacity-50 hover-opacity-100"
                                style={{ fontSize: "16px", lineHeight: "1" }}
                                title="Satırı Sil"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                ))}

                {/* GENEL TOPLAM SATIRI (Dinamik Hesaplanan Alan) */}
                <div className="d-flex align-items-stretch total-row-opex p-2.5 px-3">
                    <div className="fw-bold text-uppercase text-white-50" style={{ width: "60%", fontSize: "12px", letterSpacing: "0.5px" }}>
                        Genel Toplam
                    </div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="d-flex align-items-center justify-content-end gap-2 text-success fw-bold" style={{ width: "35%", fontSize: "13px" }}>
                        <span>{totalOpex.toLocaleString()}</span>
                        <span style={{ fontSize: "11px", minWidth: "50px" }}>€/yıl</span>
                    </div>
                    <div style={{ width: "1px", backgroundColor: "transparent" }}></div>
                    <div style={{ width: "5%" }}></div>
                </div>

            </div>


        </div>
    );
}

export default OpexTablosu;