import React, { useState, useEffect } from "react";

const EMPTY_FORM_STATE = {
    id: null,
    ticariUnvan: "",
    mensei: "Yerli",
    ulke: "Türkiye",
    adres: "",
    vergiDairesi: "",
    vergiNo: "",
    yetkililer: [{ isim: "", mail: "", telefon: "" }],
    teklifAdedi: 0,
    teklifDetay: "Yeni Kayıt",
    yetkiliSatisci: ""
};

function AddPutMusteri({ isOpen, onClose, selectedCustomer, onSave }) {
    const [formData, setFormData] = useState(EMPTY_FORM_STATE);

    // Düzenleme veya Ekleme moduna geçişte formu doldur/temizle
    useEffect(() => {
        if (selectedCustomer) {
            setFormData({ ...selectedCustomer });
        } else {
            setFormData(EMPTY_FORM_STATE);
        }
    }, [selectedCustomer, isOpen]);

    if (!isOpen) return null;

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

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    // Form inputları için ortak koyu mod stili
    const inputStyle = {
        padding: "0.55rem 0.75rem",
        backgroundColor: "#0f172a",
        borderColor: "#334155",
        color: "#f8fafc",
        fontSize: "13px"
    };

    return (
        <>
            {/* Backdrop Gölgeliği */}
            <div
                className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
                style={{ zIndex: 1040, backdropFilter: "blur(4px)", transition: "all 0.3s ease" }}
                onClick={onClose}
            />

            {/* Panel Gövdesi */}
            <div
                className="position-fixed top-0 end-0 h-100 shadow overflow-y-auto text-white"
                style={{
                    zIndex: 1050,
                    width: "100%",
                    maxWidth: "500px",
                    fontSize: "13px",
                    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                    backgroundColor: "#1e293b", // Ana koyu arka plan
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
                        className="btn-close btn-close-white" // Koyu mod için beyaz çarpı butonu
                        style={{ fontSize: "11px" }}
                    ></button>
                </div>

                <form onSubmit={handleSubmit} className="p-3 p-sm-4">

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
                            name="ticariUnvan"
                            value={formData?.ticariUnvan || ""}
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

                    <div className="mb-4">
                        <label className="form-label mb-1 fw-medium" style={{ fontSize: "12px", color: "#cbd5e1" }}>Sorumlu Yetkili Satışçı</label>
                        <div className="input-group input-group-sm">
                            <span className="input-group-text border-end-0 text-muted" style={{ backgroundColor: "#0f172a", borderColor: "#334155", padding: "0 0.75rem" }}>
                                <i className="bi bi-person text-white-50" style={{ fontSize: "16px" }}></i>
                            </span>
                            <input
                                type="text"
                                name="yetkiliSatisci"
                                value={formData?.yetkiliSatisci || ""}
                                onChange={handleInputChange}
                                className="form-control border-start-0 shadow-none custom-placeholder"
                                style={inputStyle}
                                placeholder="Portföy sorumlusu satış temsilcisi"
                            />
                        </div>
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
                                    value={yetkili.isim}
                                    onChange={(e) => handleYetkiliChange(index, "isim", e.target.value)}
                                />
                            </div>
                            <div className="row g-2">
                                <div className="col-12 col-sm-6">
                                    <label className="fw-semibold mb-1" style={{ fontSize: "11px", color: "#94a3b8" }}>E-Posta</label>
                                    <input
                                        required
                                        type="email"
                                        className="form-control form-control-sm shadow-none"
                                        style={{ ...inputStyle, backgroundColor: "#1e293b" }}
                                        value={yetkili.mail}
                                        onChange={(e) => handleYetkiliChange(index, "mail", e.target.value)}
                                    />
                                </div>
                                <div className="col-12 col-sm-6">
                                    <label className="fw-semibold mb-1" style={{ fontSize: "11px", color: "#94a3b8" }}>Telefon</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm shadow-none"
                                        style={{ ...inputStyle, backgroundColor: "#1e293b" }}
                                        value={yetkili.telefon}
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
                            className="btn btn-sm text-white flex-grow-1 py-2 fw-semibold"
                            style={{ borderRadius: "6px", fontSize: "13px", backgroundColor: "#334155", border: "1px solid #475569" }}
                        >
                            Vazgeç
                        </button>
                        <button
                            type="submit"
                            className="btn btn-sm text-white flex-grow-1 py-2 fw-bold border-0"
                            style={{ backgroundColor: "#00874e", borderRadius: "6px", fontSize: "13px" }}
                        >
                            <i className="bi bi-check-lg me-1"></i>
                            {formData?.id ? "Değişiklikleri Kaydet" : "Müşteriyi Kaydet"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

export default AddPutMusteri;