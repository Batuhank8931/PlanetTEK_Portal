import React from "react";

function PriceChangeUpdateConfirmationModal({ show, onClose, onConfirm, changesList }) {
    if (!show) return null;

    return (
        <>
            {/* Yumuşak ve premium bir arka plan karartısı */}
            <div
                className="modal-backdrop fade show"
                style={{
                    zIndex: 1050,
                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                    backdropFilter: "blur(4px)"
                }}
            ></div>

            {/* Modal Ana Gövde */}
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1055 }}>
                <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                    <div
                        className="modal-content border-0 shadow-lg"
                        style={{
                            backgroundColor: "#1e293b", // Slate 800 - Koyu şık arka plan
                            borderRadius: "14px",
                            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
                        }}
                    >

                        {/* 🏷️ Header: Hafif yeşil tonlu antrasit geçiş */}
                        <div
                            className="modal-header border-0 py-3 px-4"
                            style={{
                                background: "linear-gradient(135deg, #14532d 0%, #1e293b 100%)",
                                borderTopLeftRadius: "14px",
                                borderTopRightRadius: "14px"
                            }}
                        >
                            <h5 className="modal-title d-flex align-items-center text-white fw-semibold fs-5 m-0">
                                <i className="bi bi-shield-check text-success me-2 fs-4"></i>
                                Veritabanı Güncelleme Onayı
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white shadow-none opacity-75"
                                onClick={onClose}
                            ></button>
                        </div>

                        {/* 📝 Body: Bilgi ve Değişiklik Tablosu */}
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
                                    <p className="text-white small m-0" style={{ color: "#94a3b8 !important" }}>
                                        Toplam <span className="text-success fw-bold">{changesList.length}</span> hücrede yeni değer algılandı.
                                    </p>
                                </div>
                            </div>

                            {/* 📋 Koyu Tema Uyumlu Veri Tablosu */}
                            <div
                                className="table-responsive rounded border"
                                style={{
                                    maxHeight: "260px",
                                    overflowY: "auto",
                                    borderColor: "#334155", // Slate 700 sınır çizgisi
                                    backgroundColor: "#0f172a" // Slate 900 iç tablo arka planı
                                }}
                            >
                                <table className="table table-sm table-borderless align-middle mb-0 text-center text-light" style={{ fontSize: "0.8rem" }}>
                                    <thead
                                        className="sticky-top"
                                        style={{
                                            backgroundColor: "#334155",
                                            color: "#cbd5e1",
                                            boxShadow: "0 1px 0 #475569"
                                        }}
                                    >
                                        <tr>
                                            <th className="text-start py-2 ps-3 font-monospace" style={{ letterSpacing: "0.5px" }}>SATIR ADI</th>
                                            <th className="py-2">PARAMETRE</th>
                                            <th className="py-2">ESKİ DEĞER</th>
                                            <th className="py-2"></th>
                                            <th className="py-2">YENİ DEĞER</th>
                                        </tr>
                                    </thead>
                                    <tbody>

                                        {changesList.map((change, index) => {
                                            const isRateOrCoefficient =
                                                change.columnName.toLowerCase().includes("katsayi") ||
                                                change.columnName.toLowerCase().includes("oran");

                                            const unit = isRateOrCoefficient ? "" : " €";

                                            // 🎨 İşlem tipine göre badge renk şeması
                                            let typeBadge = <span className="badge bg-warning text-dark px-2 py-1">UPDATE</span>;
                                            if (change.type === "INSERT") {
                                                typeBadge = <span className="badge bg-success text-white px-2 py-1">INSERT</span>;
                                            } else if (change.type === "DELETE") {
                                                typeBadge = <span className="badge bg-danger text-white px-2 py-1">DELETE</span>;
                                            }

                                            return (
                                                <tr key={index} style={{ borderBottom: "1px solid #1e293b" }} className="hover-row">
                                                    <td className="text-start fw-bold py-2 ps-3">
                                                        {change.rowName}
                                                    </td>
                                                    <td className="py-2">
                                                        {typeBadge}
                                                    </td>
                                                    <td className="py-2">
                                                        <span
                                                            className="badge font-monospace px-2 py-1"
                                                            style={{ backgroundColor: "#334155", color: "#38bdf8", border: "1px solid #475569" }}
                                                        >
                                                            {change.columnName.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    {/* Eski Değer */}
                                                    <td className="text-muted py-2 text-decoration-line-through" style={{ color: "#64748b" }}>
                                                        {change.type === "INSERT" ? "—" : `${change.oldValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}${unit}`}
                                                    </td>
                                                    <td className="py-2 text-success">
                                                        <i className="bi bi-chevron-right"></i>
                                                    </td>
                                                    {/* Yeni Değer */}
                                                    <td className="fw-bold py-2" style={{ color: change.type === "DELETE" ? "#ef4444" : "#4ade80" }}>
                                                        {change.type === "DELETE" ? "SİLİNECEK" : `${change.newValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}${unit}`}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 🏁 Footer: Temiz buton yerleşimi */}
                        <div
                            className="modal-footer border-0 py-3 px-4 d-flex justify-content-end gap-2"
                            style={{ backgroundColor: "#151f32", borderBottomLeftRadius: "14px", borderBottomRightRadius: "14px" }}
                        >
                            <button
                                type="button"
                                className="btn btn-sm px-3 text-secondary shadow-none fw-semibold border-0"
                                style={{ color: "#94a3b8" }}
                                onClick={onClose}
                            >
                                İptal Et
                            </button>
                            <button
                                type="button"
                                className="btn btn-success btn-sm px-4 fw-bold shadow-sm"
                                style={{
                                    borderRadius: "6px",
                                    backgroundColor: "#16a34a",
                                    borderColor: "#16a34a"
                                }}
                                onClick={onConfirm}
                            >
                                Değişiklikleri Kaydet
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}

export default PriceChangeUpdateConfirmationModal;