import React, { useEffect, useRef, useState } from "react";

const AutoResizeTextarea = ({ value, onChange, disabled, style, className }) => {
    const textareaRef = useRef(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            disabled={disabled}
            style={{ ...style, resize: "none", overflowY: "hidden" }}
            className={className}
            rows={1}
        />
    );
};

function CapexTableView({ numberedRows, historyLength, handleUndo, handleCellChange, insertAfterRow, deleteRow, handleRefresh, initialGeneralInfo, teklifDili }) {
    const [activeMenuId, setActiveMenuId] = useState(null);

    useEffect(() => {
        const handleOutsideClick = () => setActiveMenuId(null);
        if (activeMenuId !== null) {
            window.addEventListener("click", handleOutsideClick);
        }
        return () => window.removeEventListener("click", handleOutsideClick);
    }, [activeMenuId]);

    const getRowBg = (row) => {
        if (row.type === 0) return "#0b1329";
        if (row.type === 1) return "#1e2d42";
        if (row.type === 2) return "#2a3a52";
        if (row.isUrgent) return "#1e2d42";
        if (row.piece === 0) return "#2d1f2d";
        return "#151f32";
    };

    // İndirim sonrası toplam fiyatı hesaplama (Orijinal yapı)
    const totalNetPrice = numberedRows.reduce((sum, row) => {
        if (row.type === 3 && !row.isUrgent && !row.isOptional && row.piece > 0) {
            return sum + (row.netTotal || 0);
        }
        return sum;
    }, 0);

    // Dil seçimine göre sayı formatlama fonksiyonu (Hesaplamaları etkilemez, sadece görünüm)
    const formatPrice = (value) => {
        const locale = teklifDili === "Yerli" ? "de-DE" : "en-US";
        return Number(value).toLocaleString(locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    };

    return (
        <div className="d-flex flex-column w-100">
            <style>{`
                .capex-row { border-bottom: 1px solid #334155; }
                .capex-row:last-child { border-bottom: none; }
                .capex-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.05) !important; }
                .header-title-cell { font-size: 8px; font-weight: 800; color: #94a3b8; background-color: #090d16; text-transform: uppercase; letter-spacing: 0.6px; }
                .action-dropdown { 
                    position: relative; 
                    display: inline-block; 
                }

                .dropdown-menu-custom { 
                    position: absolute; 
                    background-color: #1e293b; 
                    border: 1px solid #475569; 
                    border-radius: 6px; 
                    z-index: 999999 !important; 
                    right: 0; 
                    top: 100%; 
                    margin-top: 4px; 
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7); 
                }
                .dropdown-item-custom { padding: 8px 14px; font-size: 11px; color: #cbd5e1; cursor: pointer; white-space: nowrap; text-align: left; }
                .dropdown-item-custom:hover { background-color: #334155; color: #fff; }

                .optional-indicator-dot {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background-color: transparent;
                    border: 1px solid #475569;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }
                
                .capex-row:hover .optional-indicator-dot {
                    border-color: #94a3b8;
                    box-shadow: 0 0 4px rgba(255, 255, 255, 0.1);
                }
                
                .optional-dot-active {
                    background-color: #38bdf8 !important;
                    border-color: #38bdf8 !important;
                    box-shadow: 0 0 8px #38bdf8, 0 0 12px rgba(56, 189, 248, 0.4) !important;
                }

                .optional-cell-selected {
                    background-color: rgba(56, 189, 248, 0.06);
                    border-radius: 4px;
                    padding-right: 16px !important;
                }
            `}</style>

            <div className="d-flex flex-column rounded-3 overflow-hidden" style={{ border: "1px solid #334155" }}>

                {/* ÜST PANEL */}
                <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
                    <div className="fw-semibold text-white" style={{ fontSize: "14px" }}>
                        Maliyet ve Yatırım Tablosu (CAPEX)
                    </div>

                    <div className="d-flex align-items-center gap-2">
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
                            title="Tabloyu İlk Ayarlarına Döndür"
                        >
                            🔄 Yenile
                        </button>

                        <button
                            onClick={handleUndo}
                            disabled={!handleUndo || historyLength === 0}
                            className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
                            style={{
                                backgroundColor: historyLength === 0 ? "#334155" : "#1e3a8a",
                                fontSize: "11px",
                                borderRadius: "6px",
                                transition: "0.2s",
                                opacity: historyLength === 0 ? 0.4 : 1,
                                cursor: historyLength === 0 ? "not-allowed" : "pointer"
                            }}
                        >
                            ↶
                        </button>
                    </div>
                </div>

                {/* BİRİM FİYAT TEKLİF CETVELİ */}
                <div className="p-3 d-flex flex-column gap-2 text-white" style={{ backgroundColor: "#0b1329", borderBottom: "1px solid #334155", fontStyle: "italic" }}>
                    <div className="d-flex justify-content-between align-items-start">
                        <div className="fw-bold text-center flex-grow-1 w-100 ps-5" style={{ fontSize: "13px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                            {teklifDili === "Yabancı" ? "CAPEX" : "BİRİM FİYAT TEKLİF CETVELİ"}
                        </div>
                        <div className="text-end flex-shrink-0" style={{ fontSize: "11px", color: "#94a3b8" }}>
                            {teklifDili === "Yabancı" ? "Offer Number : " : "Teklif Numarası : "}<span className="text-white fw-semibold">{initialGeneralInfo?.offerNo || "-"}</span>
                        </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-1" style={{ fontSize: "11px" }}>
                        <div style={{ color: "#94a3b8" }}>
                            {teklifDili === "Yabancı" ? "Offer Reference Number : " : "Teklif Referans Numarası : "}<span className="text-white fw-semibold">{initialGeneralInfo?.refNo || "-"}</span>
                        </div>
                        <div className="fw-bold text-white" style={{ letterSpacing: "0.5px" }}>
                            {initialGeneralInfo?.clientName || "-"}
                        </div>
                    </div>
                </div>

                {/* TABLO BAŞLIĞI */}
                <div className="d-flex align-items-stretch border-bottom" style={{ borderBottomColor: "#334155" }}>
                    <div className="p-2 px-2 header-title-cell text-center" style={{ width: "4%" }}>No</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-3 header-title-cell" style={{ width: "46%" }}>{teklifDili === "Yabancı" ? "Dsscription" : "Tanım"}</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-2 header-title-cell text-center" style={{ width: "5%" }}>{teklifDili === "Yabancı" ? "Piece" : "Adet"}</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-2 header-title-cell text-end" style={{ width: "11%" }}>{teklifDili === "Yabancı" ? "Unit Price" : "Birim Fiyat"}</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-2 header-title-cell text-end" style={{ width: "11%" }}>{teklifDili === "Yabancı" ? "Total Price" : "Toplam Fiyat"}</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-2 header-title-cell text-center" style={{ width: "7%" }}>{teklifDili === "Yabancı" ? "Discount rate" : "İndirim Oranı"}</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-2 header-title-cell text-end" style={{ width: "12%" }}>{teklifDili === "Yabancı" ? "Total Price after Discount" : "İndirim Sonrası Toplam Fiyat"}</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 header-title-cell text-center" style={{ width: "4%" }}>X</div>
                </div>

                {/* TABLO GÖVDESİ */}
                <div style={{ overflowY: "auto" }}>
                    {numberedRows.map((row, index) => {
                        const rawTotal = row.rawTotal ?? 0;
                        const netTotal = row.netTotal ?? 0;

                        // Dinamik formatlama fonksiyonunu burada kullanıyoruz
                        let totalStr = `${formatPrice(rawTotal)} €`;
                        let netStr = `${formatPrice(netTotal)} €`;

                        if (row.isUrgent) { totalStr = (teklifDili === "Yerli" ? "MÜŞTERİYE AİT" : "BELONG TO CUSTOMER"); netStr = "-"; }
                        else if (row.isOptionalStyle) { totalStr = "Seçime bağlı"; netStr = "Seçime bağlı"; }
                        else if (row.isShippingStyle) { totalStr = "-"; netStr = "Bilgi Amaçlı"; }
                        else if (row.unitPrice === 0 && row.type === 3) { totalStr = "-"; netStr = "-"; }

                        if (row.type === 3 && row.isOptional) {
                            netStr = (teklifDili === "Yerli" ? "Opsiyonel" : "Optional");
                        }

                        return (
                            <div key={row.id} className="d-flex align-items-stretch capex-row" style={{ backgroundColor: getRowBg(row) }}>
                                <div className="p-2 px-2 d-flex align-items-center justify-content-center text-white-50 fw-bold" style={{ width: "4%", fontSize: "11px" }}>
                                    {row.computedNo}
                                </div>
                                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                <div className="p-2 px-3 d-flex align-items-center" style={{ width: "46%" }}>
                                    {row.type < 3 ? (
                                        <input
                                            type="text"
                                            className="form-control form-control-sm text-start text-white bg-transparent border-0 fw-bold p-0 capex-input"
                                            style={{ fontSize: row.type === 0 ? "13px" : "12px", color: row.type === 0 ? "#60a5fa" : row.type === 1 ? "#cbd5e1" : "#94a3b8", boxShadow: "none", width: "100%" }}
                                            value={row.label}
                                            onChange={(e) => handleCellChange(row.id, "label", e.target.value)}
                                        />
                                    ) : (
                                        <AutoResizeTextarea
                                            className="form-control form-control-sm text-start text-white bg-transparent border-0 fw-medium p-0 capex-input rounded"
                                            style={{ fontSize: "12px", boxShadow: "none", width: "100%", lineHeight: "1.4" }}
                                            value={row.label}
                                            onChange={(e) => handleCellChange(row.id, "label", e.target.value)}
                                        />
                                    )}
                                </div>

                                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                                <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "5%" }}>
                                    {row.type < 3 || row.isUrgent ? null : (
                                        <input type="number" className="form-control form-control-sm text-center text-white bg-transparent border-0 p-0 capex-input fw-bold" style={{ fontSize: "12px", boxShadow: "none" }} value={row.piece} onChange={(e) => handleCellChange(row.id, "piece", e.target.value)} />
                                    )}
                                </div>
                                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                                <div className="p-1 px-2 d-flex align-items-center justify-content-end" style={{ width: "11%" }}>
                                    {row.type < 3 || row.isUrgent ? null : (
                                        <input
                                            type={activeMenuId === `edit-${row.id}` ? "number" : "text"}
                                            className="form-control form-control-sm text-end text-white bg-transparent border-0 p-0 capex-input fw-bold"
                                            style={{ fontSize: "12px", boxShadow: "none" }}
                                            value={activeMenuId === `edit-${row.id}` ? row.unitPrice : formatPrice(row.unitPrice)}
                                            onFocus={() => setActiveMenuId(`edit-${row.id}`)}
                                            onBlur={() => setActiveMenuId(null)}
                                            onChange={(e) => handleCellChange(row.id, "unitPrice", e.target.value)}
                                        />
                                    )}
                                    {(row.type === 3 && !row.isUrgent) && <span className="text-white-50 ms-1" style={{ fontSize: "11px" }}>€</span>}
                                </div>
                                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                                <div className="p-1 px-2 d-flex align-items-center justify-content-end text-white fw-bold" style={{ width: "11%", fontSize: "11.5px" }}>
                                    {row.type < 3 ? null : totalStr}
                                </div>
                                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                                <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "7%" }}>
                                    {row.type < 3 || row.isUrgent || row.isShippingStyle ? null : (
                                        <div className="d-flex align-items-center justify-content-center gap-1 w-100">
                                            <input type="number" className="form-control form-control-sm text-center text-white-50 bg-transparent border-0 p-0 capex-input" style={{ fontSize: "11.5px", boxShadow: "none", width: "45%" }} value={row.discount} onChange={(e) => handleCellChange(row.id, "discount", e.target.value)} />
                                            <span className="text-white-50" style={{ fontSize: "10px" }}>%</span>
                                        </div>
                                    )}
                                </div>
                                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                <div
                                    className={`p-1 px-3 d-flex align-items-center justify-content-end fw-bold position-relative ${row.type === 3 && row.isOptional ? 'optional-cell-selected' : ''}`}
                                    style={{
                                        width: "12%",
                                        fontSize: "12px",
                                        color: row.isUrgent ? "#94a3b8" : row.piece === 0 ? "#94a3b8" : row.isOptional ? "#38bdf8" : "#4ade80",
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    {row.type < 3 ? null : netStr}

                                    {row.type === 3 && !row.isUrgent && (
                                        <div
                                            className={`optional-indicator-dot ${row.isOptional ? 'optional-dot-active' : ''}`}
                                            onClick={() => handleCellChange(row.id, "isOptional", !row.isOptional)}
                                            title={row.isOptional ? "Toplam fiyata geri ekle" : "Opsiyonel yap (Toplamdan çıkar)"}
                                        />
                                    )}
                                </div>
                                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "4%" }}>
                                    <div className="action-dropdown d-flex align-items-center justify-content-center" style={{ width: "24px", height: "24px" }}>
                                        <button
                                            type="button"
                                            className="btn btn-sm p-0 border-0 text-success opacity-70 fw-bold"
                                            style={{ fontSize: "16px", lineHeight: "1" }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(activeMenuId === row.id ? null : row.id);
                                            }}
                                        >
                                            +
                                        </button>

                                        {activeMenuId === row.id && (
                                            <div className="dropdown-menu-custom" onClick={(e) => e.stopPropagation()}>
                                                <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 0); setActiveMenuId(null); }}>+ Ana Başlık</div>
                                                <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 1); setActiveMenuId(null); }}>+ Alt Başlık Lvl 1</div>
                                                <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 2); setActiveMenuId(null); }}>+ Alt Başlık Lvl 2</div>
                                                <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 3); setActiveMenuId(null); }}>+ Normal Satır</div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); deleteRow(row.id); }}
                                        className="btn btn-sm p-0 border-0 text-danger opacity-60"
                                        style={{ fontSize: "16px", lineHeight: "1" }}
                                        title="Bu Satırı Sil"
                                    >
                                        &times;
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* EN ALT TOPLAM FİYAT ALANI */}
                <div className="d-flex align-items-center justify-content-between p-3" style={{ backgroundColor: "#0f172a", borderTop: "2px solid #334155" }}>
                    <div className="text-white-50 fw-medium animate-fade" style={{ fontSize: "11px", letterSpacing: "0.3px" }}>
                        * <span style={{ color: "#38bdf8" }}>Neon mavi</span> işaretli opsiyonel kalemler genel toplama dahil edilmemiştir.
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <span className="fw-bold text-uppercase" style={{ fontSize: "12px", color: "#94a3b8", letterSpacing: "1px" }}>İndirim Sonrası Genel Toplam:</span>
                        <span className="fw-extrabold text-white px-3 py-1 rounded bg-success bg-opacity-20" style={{ fontSize: "16px", border: "1px solid #22c55e", boxShadow: "0 0 10px rgba(34, 197, 94, 0.15)" }}>
                            {formatPrice(totalNetPrice)} €
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default CapexTableView;