import React, { useState, useEffect } from "react";
import { motion } from "framer-motion"; // 🚀 Framer Motion eklendi

const EMPTY_FORM_STATE = {
    id: null,
    isim: "",
    eposta: "",
    rol: "Satış Temsilcisi",
    durum: "Aktif",
    departman: "Satış",
    password: "" 
};

function AddPutKullanici({ isOpen, onClose, selectedUser, onSave }) {
    const [formData, setFormData] = useState(EMPTY_FORM_STATE);
    const [showPassword, setShowPassword] = useState(false); 

    useEffect(() => {
        if (selectedUser) {
            setFormData({ ...selectedUser, password: "" });
        } else {
            setFormData(EMPTY_FORM_STATE);
        }
        setShowPassword(false); 
    }, [selectedUser, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
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
            {/* 🚀 Backdrop Gölgeliği (Yumuşak Opaklık Geçişi) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
                style={{ zIndex: 1040, backdropFilter: "blur(4px)" }}
                onClick={onClose}
            />

            {/* 🚀 Panel Gövdesi (Sağdan Kayarak Giriş/Çıkış) */}
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
                            <i className="bi bi-person-plus me-2" style={{ color: "#22c55e" }}></i>
                            {formData?.id ? "Kullanıcı Bilgilerini Düzenle" : "Yeni Kullanıcı Tanımla"}
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

                    {/* SEKSİYON 1 - KULLANICI KİMLİK BİLGİLERİ */}
                    <div className="d-flex align-items-center mb-3">
                        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#94a3b8" }}>
                            Kimlik Bilgileri
                        </span>
                        <div className="flex-grow-1 border-bottom" style={{ borderColor: "#334155" }}></div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label mb-1 fw-medium" style={{ fontSize: "12px", color: "#cbd5e1" }}>Kullanıcı Adı</label>
                        <div className="input-group input-group-sm">
                            <span className="input-group-text border-end-0 text-muted" style={{ backgroundColor: "#0f172a", borderColor: "#334155", padding: "0 0.75rem" }}>
                                <i className="bi bi-person text-white-50" style={{ fontSize: "14px" }}></i>
                            </span>
                            <input
                                required
                                type="text"
                                name="isim"
                                value={formData?.isim || ""}
                                onChange={handleInputChange}
                                className="form-control border-start-0 shadow-none custom-placeholder"
                                style={inputStyle}
                                placeholder="Örn: Ahmet Yılmaz"
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label mb-1 fw-medium" style={{ fontSize: "12px", color: "#cbd5e1" }}>E-Posta Adresi *</label>
                        <div className="input-group input-group-sm">
                            <span className="input-group-text border-end-0 text-muted" style={{ backgroundColor: "#0f172a", borderColor: "#334155", padding: "0 0.75rem" }}>
                                <i className="bi bi-envelope text-white-50" style={{ fontSize: "14px" }}></i>
                            </span>
                            <input
                                required
                                type="email"
                                name="eposta"
                                value={formData?.eposta || ""}
                                onChange={handleInputChange}
                                className="form-control border-start-0 shadow-none custom-placeholder"
                                style={inputStyle}
                                placeholder="Örn: ahmet@planettek.com"
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label mb-1 fw-medium" style={{ fontSize: "12px", color: "#cbd5e1" }}>
                            {formData?.id ? "Şifre Değiştir (Opsiyonel)" : "Giriş Şifresi *"}
                        </label>
                        <div className="input-group input-group-sm">
                            <span className="input-group-text border-end-0 text-muted" style={{ backgroundColor: "#0f172a", borderColor: "#334155", padding: "0 0.75rem" }}>
                                <i className="bi bi-lock text-white-50" style={{ fontSize: "14px" }}></i>
                            </span>
                            <input
                                required={!formData?.id}
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData?.password || ""}
                                onChange={handleInputChange}
                                className="form-control border-start-0 border-end-0 shadow-none custom-placeholder"
                                style={inputStyle}
                                placeholder={formData?.id ? "Değiştirmek istemiyorsanız boş bırakın" : "En az 6 karakterli şifre girin"}
                            />
                            <button
                                type="button"
                                className="btn border-start-0 shadow-none"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#64748b" }}
                            >
                                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                            </button>
                        </div>
                    </div>

                    {/* SEKSİYON 2 - YETKİ VE DEPARTMAN AYARLARI */}
                    <div className="d-flex align-items-center mb-3 mt-4">
                        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#94a3b8" }}>
                            Sistem Yetki Ayarları
                        </span>
                        <div className="flex-grow-1 border-bottom" style={{ borderColor: "#334155" }}></div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label mb-1 fw-medium" style={{ fontSize: "12px", color: "#cbd5e1" }}>Departman</label>
                        <input
                            type="text"
                            name="departman"
                            value={formData?.departman || ""}
                            onChange={handleInputChange}
                            className="form-control form-control-sm shadow-none custom-placeholder"
                            style={inputStyle}
                            placeholder="Örn: Satış, Operasyon, Yönetim"
                        />
                    </div>

                    <div className="row g-2 mb-3">
                        <div className="col-12 col-sm-6">
                            <label className="form-label mb-1 fw-medium" style={{ fontSize: "12px", color: "#cbd5e1" }}>Erişim Rolü</label>
                            <select
                                name="rol"
                                value={formData?.rol || "Satış Temsilcisi"}
                                onChange={handleInputChange}
                                className="form-select form-select-sm shadow-none"
                                style={inputStyle}
                            >
                                <option value="Admin" style={{ backgroundColor: "#0f172a" }}>Admin</option>
                                <option value="Satış Temsilcisi" style={{ backgroundColor: "#0f172a" }}>Satış Temsilcisi</option>
                            </select>
                        </div>
                        <div className="col-12 col-sm-6">
                            <label className="form-label mb-1 fw-medium" style={{ fontSize: "12px", color: "#cbd5e1" }}>Sistem Durumu</label>
                            <select
                                name="durum"
                                value={formData?.durum || "Aktif"}
                                onChange={handleInputChange}
                                className="form-select form-select-sm shadow-none"
                                style={inputStyle}
                            >
                                <option value="Aktif" style={{ backgroundColor: "#0f172a" }}>Aktif</option>
                                <option value="Pasif" style={{ backgroundColor: "#0f172a" }}>Pasif</option>
                                <option value="Askıda" style={{ backgroundColor: "#0f172a" }}>Askıda</option>
                            </select>
                        </div>
                    </div>

                    {/* FORM AKSİYONLARI */}
                    <div className="d-flex gap-2 mt-4 pt-4 border-top" style={{ borderColor: "#334155" }}>
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
                            {formData?.id ? "Değişiklikleri Kaydet" : "Kullanıcıyı Kaydet"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </>
    );
}

export default AddPutKullanici;