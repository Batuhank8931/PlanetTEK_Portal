// CalculationChangeUpdateConfirmationModal.jsx
import React from "react";

function CalculationChangeUpdateConfirmationModal({ show, onClose, onConfirm, changesList }) {
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
                        style={{ backgroundColor: "#1e293b", borderRadius: "14px", fontFamily: "sans-serif" }}
                    >
                        <div
                            className="modal-header border-0 py-3 px-4"
                            style={{
                                background: "linear-gradient(135deg, #14532d 0%, #1e293b 100%)",
                                borderTopLeftRadius: "14px", borderTopRightRadius: "14px"
                            }}
                        >
                            <h5 className="modal-title d-flex align-items-center text-white fw-semibold fs-5 m-0">
                                <i className="bi bi-shield-check text-success me-2 fs-4"></i>
                                Parametre Güncelleme Onayı
                            </h5>
                            <button type="button" className="btn-close btn-close-white shadow-none opacity-75" onClick={onClose}></button>
                        </div>

                        <div className="modal-body p-4 text-light">
                            <div className="d-flex align-items-center mb-3">
                                <div
                                    className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center me-3"
                                    style={{ width: "45px", height: "45px" }}
                                >
                                    <i className="bi bi-sliders fs-4"></i>
                                </div>
                                <div>
                                    <h6 className="m-0 fw-bold text-white fs-6">Katsayı Değişiklik Kontrolü</h6>
                                    <p className="text-white small m-0">
                                        Toplam <span className="text-success fw-bold">{changesList.length}</span> hücre üzerinde işlem yapılacaktır.
                                    </p>
                                </div>
                            </div>

                            {/* 🚀 BİLGİLENDİRME UYARISI */}
                            <div 
                                className="alert py-2 px-3 mb-3 d-flex align-items-center gap-2 border-0" 
                                style={{ backgroundColor: "#0284c71a", color: "#38bdf8", fontSize: "0.8rem", borderRadius: "8px" }}
                            >
                                <i className="bi bi-info-circle-fill fs-6"></i>
                                <span>Bu matris ekranından kayıtlı parametre silme işlemi yapılamaz. Yalnızca katsayı güncellemeleri ve yeni tanımlamalar işlenecektir.</span>
                            </div>

                            <div
                                className="table-responsive rounded border"
                                style={{ maxHeight: "260px", overflowY: "auto", borderColor: "#334155", backgroundColor: "#0f172a" }}
                            >
                                <table className="table table-sm table-borderless align-middle mb-0 text-center text-light" style={{ fontSize: "0.8rem" }}>
                                    <thead className="sticky-top" style={{ backgroundColor: "#334155", color: "#cbd5e1", boxShadow: "0 1px 0 #475569" }}>
                                        <tr>
                                            <th className="text-start py-2 ps-3 font-monospace" style={{ letterSpacing: "0.5px", width: "35%" }}>PARAMETRE</th>
                                            <th className="py-2" style={{ width: "15%" }}>İŞLEM</th>
                                            <th className="py-2" style={{ width: "15%" }}>HÜCRE</th>
                                            <th className="py-2" style={{ width: "15%" }}>ESKİ DEĞER</th>
                                            <th className="py-2" style={{ width: "5%" }}></th>
                                            <th className="py-2" style={{ width: "15%" }}>YENİ DEĞER</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {changesList.map((change, index) => {
                                            let typeBadge = <span className="badge bg-warning text-dark px-2 py-1">UPDATE</span>;
                                            if (change.type === "INSERT") typeBadge = <span className="badge bg-success text-white px-2 py-1">INSERT</span>;

                                            const formatNum = (val) => {
                                                if (val === undefined || val === null || isNaN(val)) return val;
                                                return Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
                                            };

                                            return (
                                                <tr key={index} style={{ borderBottom: "1px solid #1e293b" }}>
                                                    <td className="text-start fw-bold py-2 ps-3">{change.rowName}</td>
                                                    <td className="py-2">{typeBadge}</td>
                                                    <td className="py-2">
                                                        <span className="badge font-monospace px-2 py-1" style={{ backgroundColor: "#334155", color: "#38bdf8", border: "1px solid #475569" }}>
                                                            {change.columnName.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="text-muted py-2 text-decoration-line-through">
                                                        {change.type === "INSERT" ? "—" : formatNum(change.oldValue)}
                                                    </td>
                                                    <td className="py-2 text-success"><i className="bi bi-chevron-right"></i></td>
                                                    <td className="fw-bold py-2" style={{ color: "#4ade80" }}>
                                                        {formatNum(change.newValue)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="modal-footer border-0 py-3 px-4 d-flex justify-content-end gap-2" style={{ backgroundColor: "#151f32", borderBottomLeftRadius: "14px", borderBottomRightRadius: "14px" }}>
                            <button type="button" className="btn btn-sm px-3 text-secondary shadow-none fw-semibold border-0" onClick={onClose}>İptal Et</button>
                            <button type="button" className="btn btn-success btn-sm px-4 fw-bold shadow-sm" style={{ borderRadius: "6px", backgroundColor: "#16a34a", borderColor: "#16a34a" }} onClick={onConfirm}>Değişiklikleri Kaydet</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CalculationChangeUpdateConfirmationModal;