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


	return (
		<>
			{/* Backdrop Gölgeliği */}
			<div
				className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-25"
				style={{ zIndex: 1040, backdropFilter: "blur(2px)", transition: "all 0.3s ease" }}
				onClick={onClose}
			/>

			{/* Panel Gövdesi - Mobilde %100 genişlik, büyük ekranda maks 500px */}
			<div
				className="position-fixed top-0 end-0 h-100 shadow overflow-y-auto text-white"
				style={{
					zIndex: 1050,
					width: "100%",
					maxWidth: "500px",
					fontSize: "13px",
					fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
					backgroundColor: "#00874e",
					boxShadow: "-5px 0 25px rgba(0,0,0,0.15)"
				}}
			>
				{/* PANEL BAŞLIĞI */}
				<div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white sticky-top shadow-sm">
					<div>
						<h6 className="mb-0 fw-bold" style={{ color: "#1a1c1d", fontSize: "14px" }}>
							<i className="bi bi-building-add me-2" style={{ color: "#00874e" }}></i>
							{formData?.id ? "Müşteri Bilgilerini Düzenle" : "Yeni Müşteri Tanımla"}
						</h6>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="btn-close"
						style={{ fontSize: "11px" }}
					></button>
				</div>

				<form onSubmit={handleSubmit} className="p-3 p-sm-4">

					{/* SEKSİYON 1 - ŞİRKET GENEL BİLGİLERİ */}
					<div className="d-flex align-items-center mb-3">
						<span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#e0f2f1" }}>
							Şirket Genel Bilgileri
						</span>
						<div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.2)" }}></div>
					</div>

					<div className="mb-3">
						<label className="form-label mb-1 fw-medium text-white-50" style={{ fontSize: "12px" }}>Ticari Ünvan / Şirket Adı *</label>
						<input
							required
							type="text"
							name="ticariUnvan"
							value={formData?.ticariUnvan || ""}
							onChange={handleInputChange}
							className="form-control form-control-sm border-0 shadow-none bg-white text-dark"
							style={{ padding: "0.55rem 0.75rem" }}
							placeholder="Örn: Acme Holding A.Ş."
						/>
					</div>

					{/* row g-2 eklenerek mobil uyumluluk artırıldı, col-12 telefonda tek satır yapar */}
					<div className="row g-2 mb-3">
						<div className="col-12 col-sm-6">
							<label className="form-label mb-1 fw-medium text-white-50" style={{ fontSize: "12px" }}>Menşei</label>
							<select
								name="mensei"
								value={formData?.mensei || "Yerli"}
								onChange={handleInputChange}
								className="form-select form-select-sm border-0 shadow-none bg-white text-dark"
								style={{ padding: "0.55rem 0.75rem" }}
							>
								<option value="Yerli">Yerli</option>
								<option value="Yabancı">Yabancı</option>
							</select>
						</div>
						<div className="col-12 col-sm-6">
							<label className="form-label mb-1 fw-medium text-white-50" style={{ fontSize: "12px" }}>Ülke</label>
							<input
								type="text"
								name="ulke"
								value={formData?.ulke || ""}
								onChange={handleInputChange}
								className="form-control form-control-sm border-0 shadow-none bg-white text-dark"
								style={{ padding: "0.55rem 0.75rem" }}
								placeholder="Örn: Türkiye"
							/>
						</div>
					</div>

					<div className="row g-2 mb-3">
						<div className="col-12 col-sm-6">
							<label className="form-label mb-1 fw-medium text-white-50" style={{ fontSize: "12px" }}>Vergi Dairesi</label>
							<input
								type="text"
								name="vergiDairesi"
								value={formData?.vergiDairesi || ""}
								onChange={handleInputChange}
								className="form-control form-control-sm border-0 shadow-none bg-white text-dark"
								style={{ padding: "0.55rem 0.75rem" }}
							/>
						</div>
						<div className="col-12 col-sm-6">
							<label className="form-label mb-1 fw-medium text-white-50" style={{ fontSize: "12px" }}>Vergi Numarası</label>
							<input
								type="text"
								name="vergiNo"
								value={formData?.vergiNo || ""}
								onChange={handleInputChange}
								className="form-control form-control-sm border-0 shadow-none bg-white text-dark"
								style={{ padding: "0.55rem 0.75rem" }}
							/>
						</div>
					</div>

					<div className="mb-3">
						<label className="form-label mb-1 fw-medium text-white-50" style={{ fontSize: "12px" }}>Şirket Adresi</label>
						<textarea
							name="adres"
							value={formData?.adres || ""}
							onChange={handleInputChange}
							rows="2"
							className="form-control form-control-sm border-0 shadow-none bg-white text-dark"
							style={{ padding: "0.55rem 0.75rem" }}
							placeholder="Açık adres detayları..."
						></textarea>
					</div>

					<div className="mb-4">
						<label className="form-label mb-1 fw-medium text-white-50" style={{ fontSize: "12px" }}>Sorumlu Yetkili Satışçı</label>
						<div className="input-group input-group-sm">
							<span className="input-group-text bg-white border-0 text-muted" style={{ padding: "0 0.75rem" }}>
								<i className="bi bi-person" style={{ fontSize: "16px" }}></i>
							</span>
							<input
								type="text"
								name="yetkiliSatisci"
								value={formData?.yetkiliSatisci || ""}
								onChange={handleInputChange}
								className="form-control border-0 shadow-none bg-white text-dark"
								style={{ padding: "0.55rem 0.75rem" }}
								placeholder="Portföy sorumlusu satış temsilcisi"
							/>
						</div>
					</div>

					{/* SEKSİYON 2 - ŞİRKET YETKİLİ KİŞİLERİ */}
					<div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
						<div className="d-flex align-items-center flex-grow-1 w-100">
							<span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#e0f2f1", whiteSpace: "nowrap" }}>
								Şirket Yetkili Kişileri
							</span>
							<div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.2)" }}></div>
						</div>
						<button
							type="button"
							onClick={addYetkiliField}
							className="btn btn-sm btn-link text-decoration-none p-0 fw-bold d-flex align-items-center"
							style={{ color: "#a7ffeb", fontSize: "12px" }}
						>
							<i className="bi bi-plus-circle me-1" style={{ fontSize: "14px" }}></i> Yetkili Ekle
						</button>
					</div>

					{formData?.yetkililer?.map((yetkili, index) => (
						<div
							key={index}
							className="p-3 bg-white rounded-3 mb-3 border position-relative text-dark shadow-sm"
							style={{ borderStyle: "solid", borderColor: "#e0e0e0" }}
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
								<label className="fw-semibold text-secondary mb-1" style={{ fontSize: "11px" }}>Adı Soyadı</label>
								<input
									required
									type="text"
									className="form-control form-control-sm border shadow-none bg-light"
									value={yetkili.isim}
									onChange={(e) => handleYetkiliChange(index, "isim", e.target.value)}
								/>
							</div>
							<div className="row g-2">
								<div className="col-12 col-sm-6">
									<label className="fw-semibold text-secondary mb-1" style={{ fontSize: "11px" }}>E-Posta</label>
									<input
										required
										type="email"
										className="form-control form-control-sm border shadow-none bg-light"
										value={yetkili.mail}
										onChange={(e) => handleYetkiliChange(index, "mail", e.target.value)}
									/>
								</div>
								<div className="col-12 col-sm-6">
									<label className="fw-semibold text-secondary mb-1" style={{ fontSize: "11px" }}>Telefon</label>
									<input
										type="text"
										className="form-control form-control-sm border shadow-none bg-light"
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
							className="btn btn-sm btn-light border-0 flex-grow-1 py-2 text-dark fw-semibold"
							style={{ borderRadius: "6px", fontSize: "13px", backgroundColor: "rgba(255,255,255,0.85)" }}
						>
							Vazgeç
						</button>
						<button
							type="submit"
							className="btn btn-sm bg-white flex-grow-1 py-2 fw-bold border-0"
							style={{ color: "#00874e", borderRadius: "6px", fontSize: "13px" }}
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