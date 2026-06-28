import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";

function OpexTablosu() {
    const formData = useTeklifStore((state) => state.formData);
    const updateSection = useTeklifStore((state) => state.updateSection);

    const teklifDili = formData?.customerInfo?.teklifDili;
    const isForeign = teklifDili === "Yabancı";

    // Diğer tablolardan doğrudan gelen net toplamlar
    const enerjiGideri = parseFloat(formData?.tables?.enerjiisletmettablosu?.yearlyCostEuro) || 0;
    const sarfMalzemeGideri = parseFloat(formData?.tables?.sarfmalzemettablosu?.grandTotal) || 0;

    const storeTabloVerisi = formData?.tables?.opextablosu?.rows || formData?.tables?.opextablosu || [];

    // 1. KURAL: İlk açılışta store'da veri varsa yükle, yoksa temiz iki ana kalemle başla
    const [rows, setRows] = useState(() => {
        if (storeTabloVerisi && storeTabloVerisi.length > 0) {
            return storeTabloVerisi;
        }
        return [
            { id: "enerji_gideri", label: isForeign ? "Energy Operation Cost" : "Enerji Giderleri", value: enerjiGideri, unit: isForeign ? "€ /year" : "€/yıl", isDynamic: true },
            { id: "sarf_gideri", label: isForeign ? "Consumables and Maintenance Cost" : "Sarf Malzemesi ve Bakım Giderleri", value: sarfMalzemeGideri, unit: isForeign ? "€ /year" : "€/yıl", isDynamic: true }
        ];
    });

    const [history, setHistory] = useState([]);

    // Dil değiştiğinde statik satır etiketlerini ve birimlerini de otomatik güncelle
    useEffect(() => {
        setRows((prevRows) =>
            prevRows.map((row) => {
                if (row.id === "enerji_gideri") {
                    return { 
                        ...row, 
                        label: isForeign ? "Energy Operation Cost" : "Enerji Giderleri", 
                        unit: isForeign ? "€ /year" : "€/yıl",
                        value: enerjiGideri 
                    };
                }
                if (row.id === "sarf_gideri") {
                    return { 
                        ...row, 
                        label: isForeign ? "Consumables and Maintenance Cost" : "Sarf Malzemesi ve Bakım Giderleri", 
                        unit: isForeign ? "€ /year" : "€/yıl",
                        value: sarfMalzemeGideri 
                    };
                }
                return row;
            })
        );
    }, [enerjiGideri, sarfMalzemeGideri, teklifDili]);

    // Dinamik Genel Toplam Hesaplama
    const totalOpex = rows.reduce((sum, row) => sum + (parseFloat(row.value) || 0), 0);

    // Değişiklikleri merkezi store'a yazan useEffect
    useEffect(() => {
        updateSection("tables", {
            ...formData?.tables,
            opextablosu: {
                rows: rows,
                totalOpex: totalOpex
            }
        });
    }, [rows, totalOpex]);

    const updateStoreWithNewRows = (newRows) => {
        setRows(newRows);
    };

    // 4. KURAL: REFRESH BUTONU - Manuel eklenenleri temizler, ana iki kaleme sıfırlar
    const handleRefresh = () => {
        setHistory([]);
        const resetRows = [
            { id: "enerji_gideri", label: isForeign ? "Energy Operation Cost" : "Enerji Giderleri", value: enerjiGideri, unit: isForeign ? "€ /year" : "€/yıl", isDynamic: true },
            { id: "sarf_gideri", label: isForeign ? "Consumables and Maintenance Cost" : "Sarf Malzemesi ve Bakım Giderleri", value: sarfMalzemeGideri, unit: isForeign ? "€ /year" : "€/yıl", isDynamic: true }
        ];
        updateStoreWithNewRows(resetRows);
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

    const handleInputChange = (id, field, newValue) => {
        saveToHistory(rows);
        const updatedRows = rows.map(row => row.id === id ? { ...row, [field]: newValue } : row);
        updateStoreWithNewRows(updatedRows);
    };

    const insertAfterRow = (index) => {
        saveToHistory(rows);
        const newRow = { 
            id: `manual_${Date.now()}`, 
            label: isForeign ? "New Operational Expense Description" : "Yeni İşletme Gideri Tanımı", 
            value: 0, 
            unit: isForeign ? "€ /year" : "€/yıl", 
            isDynamic: false 
        };

        const updatedRows = [...rows];
        updatedRows.splice(index + 1, 0, newRow);
        updateStoreWithNewRows(updatedRows);
    };

    const deleteRow = (id) => {
        saveToHistory(rows);
        const updatedRows = rows.filter(row => row.id !== id);
        updateStoreWithNewRows(updatedRows);
    };

    return (
        <div className="d-flex flex-column gap-3 w-90">
            <style>{`
                .table-row-opex { background-color: #1e293b; border-bottom: 1px solid #334155; transition: background-color 0.15s ease; }
                .table-row-opex:hover { background-color: #243249 !important; }
                .opex-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.05) !important; }
                .header-cell-opex { font-size: 11px; font-weight: 700; color: #94a3b8; background-color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; }
                .total-row-opex { background-color: #111827; border-top: 2px solid #4ade80; }
                .opacity-hover:hover { opacity: 1 !important; }
            `}</style>

            <div className="w-90" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <div className="d-flex flex-column rounded-3" style={{ border: "1px solid #334155", height: "auto", minWidth: "250px" }}>

                    {/* ÜST BUTONLAR PANELİ */}
                    <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: "#151f32", borderBottom: "1px solid #334155" }}>
                        <div className="fw-semibold text-white" style={{ fontSize: "14px", textTransform: isForeign ? "uppercase" : "none", letterSpacing: isForeign ? "0.5px" : "normal" }}>
                            {isForeign ? "OPERATION EXPENDITURE - OPEX" : "OPEX (İşletme Giderleri) Özet Tablosu"}
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
                                style={{ backgroundColor: "#d97706", fontSize: "11px", borderRadius: "6px" }}
                                title={isForeign ? "Reset Table to Initial Settings" : "Tabloyu İlk Ayarlarına Döndür"}
                            >
                                🔄 {isForeign ? "Refresh" : "Yenile"}
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

                    {/* TABLO BAŞLIĞI */}
                    <div className="d-flex align-items-stretch border-bottom" style={{ borderColor: "#334155" }}>
                        <div className="p-2 px-3 header-cell-opex" style={{ width: "50%" }}>
                            {isForeign ? "Description" : "Giderlerin Tanımları"}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 px-3 header-cell-opex text-end justify-content-end" style={{ width: "50%" }}>
                            {isForeign ? "Total Price" : "Toplam Fiyat"}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-cell-opex text-center justify-content-center" style={{ width: "10%" }}>
                            {isForeign ? "Action" : "Aksiyon"}
                        </div>
                    </div>

                    {/* TABLO SATIRLARI */}
                    {rows.map((row, index) => (
                        <div key={row.id} className="d-flex align-items-stretch table-row-opex">

                            {/* 1. KOLON: Gider Tanımı */}
                            <div className="p-2.5 px-3 d-flex align-items-center" style={{ width: "50%" }}>
                                <input
                                    type="text"
                                    disabled={row.isDynamic}
                                    className="form-control form-control-sm text-start text-white bg-transparent border-0 fw-medium p-1 opex-input rounded"
                                    style={{ fontSize: "12px", boxShadow: "none", width: "100%", cursor: row.isDynamic ? "not-allowed" : "text" }}
                                    value={row.label}
                                    onChange={(e) => handleInputChange(row.id, "label", e.target.value)}
                                />
                            </div>

                            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                            {/* 2. KOLON: Değer ve Birim */}
                            <div className="p-2.5 px-3 d-flex align-items-center justify-content-end gap-2" style={{ width: "50%" }}>
                                <input
                                    type="number"
                                    disabled={row.isDynamic}
                                    step="0.01"
                                    className="form-control form-control-sm text-end fw-bold text-white bg-transparent border-0 p-1 opex-input rounded"
                                    style={{ fontSize: "12px", boxShadow: "none", width: "65%", cursor: row.isDynamic ? "not-allowed" : "text" }}
                                    value={row.value === 0 ? "0" : parseFloat(row.value || 0).toFixed(2)}
                                    onChange={(e) => handleInputChange(row.id, "value", e.target.value)}
                                />
                                <span className="text-white-50 text-start ps-1" style={{ fontSize: "11px", minWidth: "50px" }}>
                                    {row.unit}
                                </span>
                            </div>

                            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                            {/* 3. KOLON: AKSİYON PANELİ */}
                            <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "10%" }}>
                                <button
                                    onClick={() => insertAfterRow(index)}
                                    className="btn btn-sm p-0 border-0 text-success opacity-50 opacity-hover fw-bold"
                                    style={{ fontSize: "15px", lineHeight: "1" }}
                                    title={isForeign ? "Insert New Expense Below" : "Altına Yeni Gider Ekle"}
                                >
                                    +
                                </button>
                                <button
                                    onClick={() => deleteRow(row.id)}
                                    disabled={row.isDynamic}
                                    className="btn btn-sm p-0 border-0 text-danger opacity-50 opacity-hover"
                                    style={{ fontSize: "16px", lineHeight: "1", visibility: row.isDynamic ? "hidden" : "visible" }}
                                    title={isForeign ? "Delete Row" : "Satırı Sil"}
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* GENEL TOPLAM SATIRI */}
                    <div className="d-flex align-items-stretch total-row-opex p-2.5 px-3">
                        <div className="fw-bold text-uppercase text-white-50 d-flex align-items-center" style={{ width: "60%", fontSize: "12px", letterSpacing: "0.5px" }}>
                            {isForeign ? "GRAND TOTAL" : "Genel Toplam"}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="d-flex align-items-center justify-content-end gap-2 text-success fw-bold" style={{ width: "35%", fontSize: "13px" }}>
                            <span>{totalOpex.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span style={{ fontSize: "11px", minWidth: "50px" }}>
                                {isForeign ? "€ /year" : "€/yıl"}
                            </span>
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div style={{ width: "5%" }}></div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default OpexTablosu;