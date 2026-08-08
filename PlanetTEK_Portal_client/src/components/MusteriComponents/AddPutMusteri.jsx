import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import API from "../../utils/utilRequest.js";

const EMPTY_FORM_STATE = {
    id: null,
    ticari_unvan: "",
    mensei: "Yerli",
    ulke: "Türkiye",
    adres: "",
    vergiDairesi: "",
    vergiNo: "",
    yetkililer: [{ isim: "", mail: "", telefon: "" }],
    yetkiliSatisci: ""
};

function AddPutMusteri({ isOpen, onClose, selectedCustomer, onSave }) {
    const [formData, setFormData] = useState(EMPTY_FORM_STATE);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (selectedCustomer) {
            setFormData({
                ...selectedCustomer,
                // Yetkililer dizisi yoksa veya boşsa varsayılan alan oluştur
                yetkililer: (selectedCustomer.yetkililer && selectedCustomer.yetkililer.length > 0)
                    ? selectedCustomer.yetkililer
                    : [{ isim: "", mail: "", telefon: "" }]
            });
        } else {
            setFormData(EMPTY_FORM_STATE);
        }
        setErrorMessage("");
    }, [selectedCustomer, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleYetkiliChange = (index, field, value) => {
        const updatedYetkililer = [...formData.yetkililer];
        updatedYetkililer[index][field] = value;
        setFormData((prev) => ({ ...prev, yetkililer: updatedYetkililer }));
    };

    const addYetkiliField = () => {
        setFormData((prev) => ({
            ...prev,
            yetkililer: [...prev.yetkililer, { isim: "", mail: "", telefon: "" }]
        }));
    };

    const removeYetkiliField = (index) => {
        if (formData.yetkililer.length > 1) {
            const updated = formData.yetkililer.filter((_, i) => i !== index);
            setFormData((prev) => ({ ...prev, yetkililer: updated }));
        }
    };

    // 🚀 Backend Kaydet/Güncelle İsteği
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMessage("");

        // Backend `contacts` ismiyle beklediği için mapping yapıyoruz
        const payload = {
            ticari_unvan: formData.ticari_unvan,
            mensei: formData.mensei,
            ulke: formData.ulke,
            adres: formData.adres,
            vergiDairesi: formData.vergiDairesi,
            vergiNo: formData.vergiNo,
            contacts: formData.yetkililer.filter(k => k.isim && k.isim.trim() !== "")
        };

        try {
            if (formData.id) {
                // Güncelleme işlemi
                await API.putCustomer(formData.id, payload);
            } else {
                // Yeni kayıt işlemi
                await API.addCustomer(payload);
            }

            // İşlem başarılıysa parent fonksiyonunu tetikle
            if (onSave) onSave(formData);
        } catch (err) {
            console.error("Müşteri kaydedilirken hata oluştu:", err);
            setErrorMessage(err.response?.data?.message || "Kayıt sırasında bir hata oluştu.");
        } finally {
            setSubmitting(false);
        }
    };

    const inputStyle = {
        padding: "0.55rem 0.75rem",
        backgroundColor: "#0f172a",
        borderColor: "#334155",
        color: "#f8fafc",
        fontSize: "13px"
    };

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
                style={{ zIndex: 1040, backdropFilter: "blur(4px)" }}
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="position-fixed top-0 end-0 h-100 shadow overflow-y-auto text-white"
                style={{
                    zIndex: 1050,
                    width: "100%",
                    maxWidth: "500px",
                    fontSize: "13px",
                    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                    backgroundColor: "#1e293b",
                    boxShadow: "-5px 0 25px rgba(0,0,0,0.3)"
                }}
            >
                {/* PANEL BAŞLIĞI */}
                <div
                    className="p-3 border-bottom d-flex justify-content-between align-items-center sticky-top shadow-sm"
                    style={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                >
                    <div>
                        <h6 className="mb-0 fw-bold" style={{ color: "#f8fafc", fontSize: "14px" }}>
                            <i className="bi bi-building-add me-2" style={{ color: "#22c55e" }}></i>
                            {formData?.id ? "Müşteri Bilgilerini Düzenle" : "Yeni Müşteri Tanımla"}
                        </h6>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-close btn-close-white"
                        style={{ fontSize: "11px" }}
                    ></button>
                </div>

                <form onSubmit={handleSubmit} className="p-3 p-sm-4">

                    {errorMessage && (
                        <div className="alert alert-danger py-2 mb-3" style={{ fontSize: "12px", backgroundColor: "rgba(239, 68, 68, 0.2)", borderColor: "#ef4444", color: "#fca5a5" }}>
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            {errorMessage}
                        </div>
                    )}

                    {/* SEKSİYON 1 - ŞİRKET GENEL BİLGİLERİ */}
                    <div className="d-flex align-items-center mb-3">
                        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#94a3b8" }}>
                            Şirket Genel Bilgileri
                        </span>
                        <div className="flex-grow-1 border-bottom" style={{ borderColor: "#334155" }}></div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label mb-1 fw-medium" style={{ fontSize: "12px", color: "#cbd5e1" }}>Ticari Ünvan / Şirket Adı *</label>
                        <input
                            required
                            type="text"
                            name="ticari_unvan"
                            value={formData?.ticari_unvan || ""}
                            onChange={handleInputChange}
                            className="form-control form-control-sm shadow-none custom-placeholder"
                            style={inputStyle}
                            placeholder="Örn: Acme Holding A.Ş."
                        />
                    </div>

                    <div className="row g-2 mb-3">
                        <div className="col-12 col-sm-6">
                            <label className="form-label mb-1 fw-medium" style={{ fontSize: "12px", color: "#cbd5e1" }}>Menşei</label>
                            <select
                                name="mensei"
                                value={formData?.mensei || "Yerli"}
                                onChange={handleInputChange}
                                className="form-select form-select-sm shadow-none"
                                style={inputStyle}
                            >
                                <option value="Yerli" style={{ backgroundColor: "#0f172a" }}>Yerli</option>
                                <option value="Yabancı" style={{ backgroundColor: "#0f172a" }}>Yabancı</option>
                            </select>
                        </div>
                        <div className="col-12 col-sm-6">
                            <label className="form-label mb-1 fw-medium" style={{ fontSize: "12px", color: "#cbd5e1" }}>Ülke</label>
                            <input
                                type="text"
                                name="ulke"
                                value={formData?.ulke || ""}
                                onChange={handleInputChange}
                                className="form-control form-control-sm shadow-none custom-placeholder"
                                style={inputStyle}
                                placeholder="Örn: Türkiye"
                            />
                        </div>
                    </div>

                    <div className="row g-2 mb-3">
                        <div className="col-12 col-sm-6">
                            <label className="form-label mb-1 fw-medium" style={{ fontSize: "12px", color: "#cbd5e1" }}>Vergi Dairesi</label>
                            <input
                                type="text"
                                name="vergiDairesi"
                                value={formData?.vergiDairesi || ""}
                                onChange={handleInputChange}
                                className="form-control form-control-sm shadow-none"
                                style={inputStyle}
                            />
                        </div>
                        <div className="col-12 col-sm-6">
                            <label className="form-label mb-1 fw-medium" style={{ fontSize: "12px", color: "#cbd5e1" }}>Vergi Numarası</label>
                            <input
                                type="text"
                                name="vergiNo"
                                value={formData?.vergiNo || ""}
                                onChange={handleInputChange}
                                className="form-control form-control-sm shadow-none"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label mb-1 fw-medium" style={{ fontSize: "12px", color: "#cbd5e1" }}>Şirket Adresi</label>
                        <textarea
                            name="adres"
                            value={formData?.adres || ""}
                            onChange={handleInputChange}
                            rows="2"
                            className="form-control form-control-sm shadow-none custom-placeholder"
                            style={inputStyle}
                            placeholder="Açık adres detayları..."
                        ></textarea>
                    </div>

                    {/* SEKSİYON 2 - ŞİRKET YETKİLİ KİŞİLERİ */}
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
                        <div className="d-flex align-items-center flex-grow-1 w-100">
                            <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                                Şirket Yetkili Kişileri
                            </span>
                            <div className="flex-grow-1 border-bottom" style={{ borderColor: "#334155" }}></div>
                        </div>
                        <button
                            type="button"
                            onClick={addYetkiliField}
                            className="btn btn-sm btn-link text-decoration-none p-0 fw-bold d-flex align-items-center"
                            style={{ color: "#4ade80", fontSize: "12px" }}
                        >
                            <i className="bi bi-plus-circle me-1" style={{ fontSize: "14px" }}></i> Yetkili Ekle
                        </button>
                    </div>

                    {formData?.yetkililer?.map((yetkili, index) => (
                        <div
                            key={index}
                            className="p-3 rounded-3 mb-3 position-relative shadow-sm border"
                            style={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                        >
                            {formData.yetkililer.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeYetkiliField(index)}
                                    className="btn btn-sm btn-link text-danger position-absolute end-0 top-0 mt-2 me-2 p-0 text-decoration-none"
                                    title="Yetkiliyi Sil"
                                >
                                    <i className="bi bi-x-circle-fill" style={{ fontSize: "14px" }}></i>
                                </button>
                            )}
                            <div className="mb-2">
                                <label className="fw-semibold mb-1" style={{ fontSize: "11px", color: "#94a3b8" }}>Adı Soyadı</label>
                                <input
                                    required
                                    type="text"
                                    className="form-control form-control-sm shadow-none"
                                    style={{ ...inputStyle, backgroundColor: "#1e293b" }}
                                    value={yetkili.isim || ""}
                                    onChange={(e) => handleYetkiliChange(index, "isim", e.target.value)}
                                />
                            </div>
                            <div className="row g-2">
                                <div className="col-12 col-sm-6">
                                    <label className="fw-semibold mb-1" style={{ fontSize: "11px", color: "#94a3b8" }}>E-Posta</label>
                                    <input
                                        type="email"
                                        className="form-control form-control-sm shadow-none"
                                        style={{ ...inputStyle, backgroundColor: "#1e293b" }}
                                        value={yetkili.mail || ""}
                                        onChange={(e) => handleYetkiliChange(index, "mail", e.target.value)}
                                    />
                                </div>
                                <div className="col-12 col-sm-6">
                                    <label className="fw-semibold mb-1" style={{ fontSize: "11px", color: "#94a3b8" }}>Telefon</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm shadow-none"
                                        style={{ ...inputStyle, backgroundColor: "#1e293b" }}
                                        value={yetkili.telefon || ""}
                                        placeholder="+90"
                                        onChange={(e) => handleYetkiliChange(index, "telefon", e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* FORM AKSİYONLARI */}
                    <div className="d-flex gap-2 mt-4 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="btn btn-sm text-white flex-grow-1 py-2 fw-semibold"
                            style={{ borderRadius: "6px", fontSize: "13px", backgroundColor: "#334155", border: "1px solid #475569" }}
                        >
                            Vazgeç
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn btn-sm text-white flex-grow-1 py-2 fw-bold border-0 d-flex align-items-center justify-content-center"
                            style={{ backgroundColor: "#00874e", borderRadius: "6px", fontSize: "13px" }}
                        >
                            {submitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Kaydediliyor...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-lg me-1"></i>
                                    {formData?.id ? "Değişiklikleri Kaydet" : "Müşteriyi Kaydet"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </>
    );
}

export default AddPutMusteri;