import React from "react";

// 🚀 PARA BİRİMİ OLMAYAN (METİNSEL VEYA TEKNİK SAYISAL) ALANLAR
const NON_MONETARY_FIELDS = [
    "model", "pompa_adi", "pompa_tipi", "ekipman_adi", "ekipman_tipi", 
    "kw", "ad", "kapasite_birimi", "tipi", "kapasite", "plakaboyut",
    "parametre_adi", "parametre_key",
    "debi", "geri_yikama_debi", "besleme_kw", "geri_yikama_kw" // 🌟 Yeni eklenen teknik ölçüler
];

function PriceChangeUpdateConfirmationModal({ show, onClose, onConfirm, changesList }) {
    if (!show) return null;

    return (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1050, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}
            ></div>

            <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1055 }}>
                <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                    <div
                        className="modal-content border-0 shadow-lg"
                        style={{ backgroundColor: "#1e293b", borderRadius: "14px", fontFamily: "'Segoe UI', Roboto, sans-serif" }}
                    >
                        {/* Header */}
                        <div
                            className="modal-header border-0 py-3 px-4"
                            style={{
                                background: "linear-gradient(135deg, #14532d 0%, #1e293b 100%)",
                                borderTopLeftRadius: "14px", borderTopRightRadius: "14px"
                            }}
                        >
                            <h5 className="modal-title d-flex align-items-center text-white fw-semibold fs-5 m-0">
                                <i className="bi bi-shield-check text-success me-2 fs-4"></i>
                                Veritabanı Güncelleme Onayı
                            </h5>
                            <button type="button" className="btn-close btn-close-white shadow-none opacity-75" onClick={onClose}></button>
                        </div>

                        {/* Body */}
                        <div className="modal-body p-4 text-light">
                            <div className="d-flex align-items-center mb-3">
                                <div
                                    className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center me-3"
                                    style={{ width: "45px", height: "45px" }}
                                >
                                    <i className="bi bi-file-earmark-ruled fs-4"></i>
                                </div>
                                <div>
                                    <h6 className="m-0 fw-bold text-white fs-6">Değişiklik Detayları Kontrolü</h6>
                                    <p className="text-white small m-0">
                                        Toplam <span className="text-success fw-bold">{changesList.length}</span> işlem grubu algılandı.
                                    </p>
                                </div>
                            </div>

                            <div
                                className="table-responsive rounded border"
                                style={{ maxHeight: "320px", overflowY: "auto", borderColor: "#334155", backgroundColor: "#0f172a" }}
                            >
                                <table className="table table-sm table-borderless align-middle mb-0 text-center text-light" style={{ fontSize: "0.8rem" }}>
                                    <thead className="sticky-top" style={{ backgroundColor: "#334155", color: "#cbd5e1", boxShadow: "0 1px 0 #475569" }}>
                                        <tr>
                                            <th className="text-start py-2 ps-3 font-monospace" style={{ letterSpacing: "0.5px", width: "25%" }}>HEDEF SATIR / KADEME</th>
                                            <th className="py-2" style={{ width: "12%" }}>İŞLEM</th>
                                            <th className="py-2" style={{ width: "18%" }}>ALAN / PARAMETRE</th>
                                            <th className="py-2" style={{ width: "20%" }}>ESKİ DEĞER</th>
                                            <th className="py-2" style={{ width: "5%" }}></th>
                                            <th className="py-2" style={{ width: "20%" }}>YENİ DEĞER</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {changesList.map((change, index) => {
                                            const colNameLower = change.columnName ? change.columnName.toLowerCase() : "";
                                            
                                            // Çarpan katsayıları takibi
                                            const isRateOrCoefficient = colNameLower.includes("katsayi") || colNameLower.includes("oran");
                                            
                                            // Metinsel veya teknik süzme (Debi, kW, ad vb. durumlarda yanına € basılmasını engeller)
                                            const isNonMonetary = NON_MONETARY_FIELDS.includes(colNameLower);

                                            // Birim Belirleme Mantığı
                                            let unit = " €";
                                            if (isRateOrCoefficient || isNonMonetary) unit = "";
                                            if (colNameLower.includes("debi")) unit = " m³/h";
                                            if (colNameLower.includes("kw")) unit = " kW";

                                            const formatValue = (val) => {
                                                if (isNonMonetary && typeof val !== "number") return val || "—";
                                                if (val === undefined || val === null || isNaN(Number(val))) return val || "0,00";
                                                return Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
                                            };

                                            // İşlem Badge Tasarımları
                                            let typeBadge = <span className="badge bg-warning text-dark px-2 py-1">UPDATE</span>;
                                            if (change.type === "INSERT") {
                                                typeBadge = <span className="badge bg-success text-white px-2 py-1">INSERT</span>;
                                            } else if (change.type === "DELETE") {
                                                typeBadge = <span className="badge bg-danger text-white px-2 py-1">DELETE</span>;
                                            }

                                            // --- 🚀 YENİ SATIR (INSERT) İÇİN DETAYLI PAYLOAD ÖZETİ ÜRETİCİSİ ---
                                            const renderInsertOrDeleteSummary = () => {
                                                if (change.type === "INSERT" && change.additionalData) {
                                                    // additionalData içindeki anlamlı verileri küçük dizeye çevirip basıyoruz
                                                    return Object.entries(change.additionalData)
                                                        .filter(([k, v]) => v !== 0 && v !== "" && k !== "isNew" && k !== "isDeleted")
                                                        .map(([k, v]) => `${k}: ${v}`).join(" | ");
                                                }
                                                return change.columnName.toUpperCase();
                                            };

                                            return (
                                                <tr key={index} style={{ borderBottom: "1px solid #1e293b" }} className="hover-row">
                                                    <td className="text-start fw-bold py-2 ps-3 text-truncate" style={{ maxWidth: "180px" }}>{change.rowName}</td>
                                                    <td className="py-2">{typeBadge}</td>
                                                    <td className="py-2">
                                                        <span
                                                            className="badge font-monospace px-2 py-1 text-wrap text-start"
                                                            style={{ backgroundColor: "#334155", color: "#38bdf8", border: "1px solid #475569", fontSize: '10px' }}
                                                        >
                                                            {change.type === "INSERT" ? "YENİ KAYIT ÖZETİ" : change.columnName.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="text-muted py-2 text-decoration-line-through" style={{ color: "#64748b" }}>
                                                        {change.type === "INSERT" ? "—" : `${formatValue(change.oldValue)}${unit}`}
                                                    </td>
                                                    <td className="py-2 text-success"><i className="bi bi-chevron-right"></i></td>
                                                    <td className="fw-bold py-2 text-wrap" style={{ color: change.type === "DELETE" ? "#ef4444" : "#4ade80", fontSize: change.type === "INSERT" ? "11px" : "12px" }}>
                                                        {change.type === "DELETE" ? "SİLİNECEK" : 
                                                         change.type === "INSERT" ? renderInsertOrDeleteSummary() : `${formatValue(change.newValue)}${unit}`}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="modal-footer border-0 py-3 px-4 d-flex justify-content-end gap-2" style={{ backgroundColor: "#151f32", borderBottomLeftRadius: "14px", borderBottomRightRadius: "14px" }}>
                            <button type="button" className="btn btn-sm px-3 text-secondary shadow-none fw-semibold border-0" onClick={onClose}>İptal Et</button>
                            <button type="button" className="btn btn-success btn-sm px-4 fw-bold shadow-sm" style={{ backgroundColor: "#16a34a", borderColor: "#16a34a", borderRadius: "6px" }} onClick={onConfirm}>Değişiklikleri Kaydet</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default PriceChangeUpdateConfirmationModal;