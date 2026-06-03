import React from "react";
import { useTeklifStore } from "../../utils/teklifStore";
// 1. Yeni paketi import ediyoruz
import ReactJson from "@microlink/react-json-view";

function SelectionsModal({ show, onClose }) {
	const formData = useTeklifStore((state) => state.formData);

	if (!show) return null;

	console.log("--- TEMA / MERKEZİ STORE JSON AĞACI ---", formData);

	return (
		<>
			{/* Modal Arka Plan Karartısı */}
			<div className="modal-backdrop fade show" onClick={onClose} style={{ zIndex: 1050 }}></div>

			{/* Modal Penceresi */}
			<div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
				<div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
					<div className="modal-content border-0 shadow-lg" style={{ backgroundColor: "#0f172a", color: "#fff" }}>

						{/* MODAL HEADER */}
						<div className="modal-header border-bottom d-flex align-items-center justify-content-between p-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
							<span className="fw-bold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#f59e0b" }}>
								<i className="bi bi-braces me-1.5"></i> Canlı JSON Monitörü
							</span>
							<button
								type="button"
								className="btn-close btn-close-white shadow-none"
								onClick={onClose}
								aria-label="Close"
								style={{ fontSize: "12px" }}
							></button>
						</div>

						{/* MODAL BODY */}
						<div className="modal-body p-3">
							<p className="text-white-50" style={{ fontSize: "11.5px" }}>
								Şu ana kadar adımlardan topladığımız ve utils içindeki koda ihtiyaç duymadan tuttuğumuz anlık <strong>Zustand Cache (JSON)</strong> çıktısı aşağıdadır:
							</p>

							{/* INTERAKTIF JSON GÖRÜNÜMÜ */}
							<div
								className="p-3 rounded mb-0"
								style={{
									backgroundColor: "#070d19",
									maxHeight: "450px",
									overflowY: "auto",
									border: "1px solid rgba(255,255,255,0.05)",
									fontSize: "12px"
								}}
							>
								<ReactJson
									src={formData}               // Gösterilecek obje
									theme="monokai"              // Teman
									collapsed={1}                // İlk açılış derinliği
									displayDataTypes={false}     // Veri tiplerini gizler
									displayObjectSize={false}    // "3 items", "5 items" gibi ibareleri tamamen gizler ❌
									enableClipboard={true}       // Kopyalama butonu aktif
									style={{ backgroundColor: "transparent" }}
								/>
							</div>
						</div>

						{/* MODAL FOOTER */}
						<div className="modal-footer border-top p-2 d-flex justify-content-between align-items-center" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
							<div className="text-muted text-start" style={{ fontSize: "10px" }}>
								ℹ️ <i>Okları kullanarak objeleri daraltıp genişletebilirsiniz.</i>
							</div>
							<button type="button" className="btn btn-sm btn-secondary px-3" onClick={onClose} style={{ fontSize: "12px", borderRadius: "4px" }}>
								Kapat
							</button>
						</div>

					</div>
				</div>
			</div>
		</>
	);
}

export default SelectionsModal;