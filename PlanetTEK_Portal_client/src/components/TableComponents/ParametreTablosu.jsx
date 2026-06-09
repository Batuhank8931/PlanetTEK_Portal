import React, { useState } from "react";

function ParametreTablosu() {
    // Görseldeki default verilerle state'i başlatıyoruz
    const [rows, setRows] = useState([
        { id: 1, label: "Toplam Atıksu Miktarı (max) – Hidrolik Yük", unit: "m³/gün", giriş: "70,00", çıkış: "-", isUrgent: false },
        { id: 2, label: "Toplam Kirlilik (max) – Organik Yük", unit: "kg/gün", giriş: "25,00", çıkış: "-", isUrgent: false },
        { id: 3, label: "Tesis Dizayn Debisi", unit: "m³/saat", giriş: "2,92", çıkış: "-", isUrgent: false },
        { id: 4, label: "Biyolojik Oksijen İhtiyacı (BOİ₅)", unit: "mg/L", giriş: "350,00", çıkış: "40", isUrgent: false },
        { id: 5, label: "Kimyasal Oksijen İhtiyacı (KOİ)", unit: "mg/L", giriş: "630,00", çıkış: "125", isUrgent: false },
        { id: 6, label: "Askıda Katı Madde (AKM)", unit: "mg/L", giriş: "350,00", çıkış: "<20", isUrgent: false },
        { id: 7, label: "Toplam Azot (TN)", unit: "mg/L", giriş: "0", çıkış: "0", isUrgent: true }, // Default Kırmızı
        { id: 8, label: "Amonyum Azotu (NH4-N)", unit: "mg/L", giriş: "0", çıkış: "0", isUrgent: true }, // Default Kırmızı
        { id: 9, label: "Toplam Fosfor (TP)", unit: "mg/L", giriş: "0", çıkış: "0", isUrgent: true }, // Default Kırmızı
        { id: 10, label: "Yağ ve Gres", unit: "mg/L", giriş: "≤25", çıkış: "<20", isUrgent: false },
        { id: 11, label: "Sülfat", unit: "mg/L", giriş: "≤60", çıkış: "-", isUrgent: false },
        { id: 12, label: "pH", unit: "-", giriş: "6 – 9", çıkış: "6 – 9", isUrgent: false },
        { id: 13, label: "Atıksu Sıcaklığı", unit: "°C", giriş: "15-32", çıkış: "15-32", isUrgent: false },
        { id: 14, label: "Kabul Edilen Sıcaklık", unit: "°C", giriş: "19", çıkış: "-", isUrgent: false },
    ]);

    // Hücre değişikliklerini yakalayan fonksiyon
    const handleInputChange = (id, field, newValue) => {
        setRows(rows.map(row => row.id === id ? { ...row, [field]: newValue } : row));
    };

    // Tıklanan satırın hemen altına yeni satır enjekte eden fonksiyon
    const insertAfterRow = (index) => {
        const currentMaxId = rows.length > 0 ? Math.max(...rows.map(r => (typeof r.id === 'number' ? r.id : 0))) : 0;
        const newId = Math.max(currentMaxId, Date.now()) + 1; // Benzersiz id garantisi

        const newRow = { id: newId, label: "Araya Eklenen Yeni Parametre", unit: "mg/L", giriş: "0", çıkış: "0", isUrgent: false };

        const updatedRows = [...rows];
        updatedRows.splice(index + 1, 0, newRow); // İlgili indisin bir sonrasına yerleştirir
        setRows(updatedRows);
    };


    // Satır silme
    const deleteRow = (id) => {
        setRows(rows.filter(row => row.id !== id));
    };

    return (
        <div className="d-flex flex-column gap-3 w-100">

            <style>{`
        .table-row-param {
          border-bottom: 1px solid #334155;
          transition: background-color 0.15s ease;
        }
        .table-row-param:last-child {
          border-bottom: none;
        }
        .bg-normal-param {
          background-color: #1e293b;
        }
        .bg-normal-param:hover {
          background-color: #243249 !important;
        }
        .bg-urgent-param {
          background-color: #991b1b !important;
        }
        .bg-urgent-param:hover {
          background-color: #b91c1c !important;
        }
        .param-input:focus {
          outline: none;
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        .header-cell {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          background-color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>

            {/* Ana Tablo Bloğu */}
            <div
                className="d-flex flex-column rounded-3 overflow-hidden"
                style={{ border: "1px solid #334155", height: "auto" }}
            >

                {/* TABLO BAŞLIĞI (HEADER) */}
                <div className="d-flex align-items-stretch border-bottom" style={{ borderColor: "#334155" }}>
                    <div className="p-2 px-3 header-cell" style={{ width: "40%" }}>Parametre</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-3 header-cell text-center" style={{ width: "15%" }}>Birim</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-3 header-cell text-end" style={{ width: "20%" }}>Atıksu Giriş</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-3 header-cell text-end" style={{ width: "20%" }}>Atıksu Çıkış</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 text-center header-cell" style={{ width: "5%" }}>Aksiyon</div>
                </div>

                {/* TABLO SATIRLARI */}
                {rows.map((row, index) => (
                    <div
                        key={row.id}
                        className={`d-flex align-items-stretch table-row-param ${row.isUrgent ? 'bg-urgent-param' : 'bg-normal-param'}`}
                    >
                        {/* 1. KOLON: Parametre Adı */}
                        <div className="p-1 px-3 d-flex align-items-center" style={{ width: "40%" }}>
                            <input
                                type="text"
                                className="form-control form-control-sm text-start text-white bg-transparent border-0 fw-medium p-1 param-input rounded"
                                style={{ fontSize: "12px", boxShadow: "none", width: "100%" }}
                                value={row.label}
                                onChange={(e) => handleInputChange(row.id, "label", e.target.value)}
                            />
                        </div>

                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                        {/* 2. KOLON: Birim */}
                        <div className="p-1 px-2 d-flex align-items-center justify-content-center" style={{ width: "15%" }}>
                            <input
                                type="text"
                                className="form-control form-control-sm text-center text-white-50 bg-transparent border-0 p-1 param-input rounded"
                                style={{ fontSize: "12px", boxShadow: "none", width: "100%" }}
                                value={row.unit}
                                onChange={(e) => handleInputChange(row.id, "unit", e.target.value)}
                            />
                        </div>

                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                        {/* 3. KOLON: Giriş Değerleri */}
                        <div className="p-1 px-3 d-flex align-items-center justify-content-end" style={{ width: "20%" }}>
                            <input
                                type="text"
                                className="form-control form-control-sm text-end fw-bold text-white bg-transparent border-0 p-1 param-input rounded"
                                style={{ fontSize: "12px", boxShadow: "none", width: "100%" }}
                                value={row.giriş}
                                onChange={(e) => handleInputChange(row.id, "giriş", e.target.value)}
                            />
                        </div>

                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                        {/* 4. KOLON: Çıkış Değerleri */}
                        <div className="p-1 px-3 d-flex align-items-center justify-content-end" style={{ width: "20%" }}>
                            <input
                                type="text"
                                className="form-control form-control-sm text-end fw-bold text-white bg-transparent border-0 p-1 param-input rounded"
                                style={{ fontSize: "12px", boxShadow: "none", width: "100%" }}
                                value={row.çıkış}
                                onChange={(e) => handleInputChange(row.id, "çıkış", e.target.value)}
                            />
                        </div>

                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                        {/* AKSİYON PANELİ (Hem Silme Hem Araya Ekleme) */}
                        <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "5%" }}>
                            {/* Araya Ekle Butonu */}
                            <button
                                onClick={() => insertAfterRow(index)}
                                className="btn btn-sm p-0 border-0 text-success opacity-50 hover-opacity-100 fw-bold"
                                style={{ fontSize: "15px", lineHeight: "1" }}
                                title="Altına Yeni Satır Ekle"
                            >
                                +
                            </button>
                            {/* Silme Butonu */}
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
            </div>



        </div>
    );
}

export default ParametreTablosu;