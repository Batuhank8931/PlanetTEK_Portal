// new_product_steps_modal.jsx
import React, { useState, useEffect } from "react";
import API from "../utils/utilRequest";

const CalibrationStepsModal = ({ selectedSlot, onClose, onFinish }) => {
	const [step, setStep] = useState(1);
	const [amount, setAmount] = useState("");
	const [loading, setLoading] = useState(false);

	if (!selectedSlot) return null;

	const progressMap = {
		1: 33,
		2: 66,
		3: 100,
	};

	const STEP_LIGHT_MAP = {
		1: { light: 2, state: true },
		2: { light: 3, state: true },
		3: { light: 3, state: false },
	};

	const nextStepWithLoading = async () => {
		if (loading) return;
		if (!selectedSlot?.id) return;

		try {
			setLoading(true);

			const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

			// Step 1 – sadece bilgi, backend çağrısı yok
			if (step === 1) {
				const body = { id: selectedSlot.id, rfid: selectedSlot.rfid, step: 1 };
				const response = await API.calibration(body);

				if (!response || response?.data?.success === false) {
					throw new Error("Step 2 failed");
				}
				setStep(2);
				return;
			}

			// Step 2 – backend çağrısı
			if (step === 2) {
				// UI zaten processing gösteriyor varsayıyoruz

				// 1️⃣ 10 saniye bekle
				await delay(10000);

				// 2️⃣ Backend’e gönder
				const body = {
					id: selectedSlot.id,
					rfid: selectedSlot.rfid,
					step: 2
				};

				const response = await API.calibration(body);

				// 3️⃣ Hata kontrolü
				if (!response || response?.data?.success === false) {
					throw new Error("Step 2 failed");
				}

				// 4️⃣ Kalibrasyon bitti
				setStep(3);
				return;
			}

		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}

	};

	const readySlot = async (id, step) => {
		const config = STEP_LIGHT_MAP[step];
		if (!config) return;

		const { light, state } = config;

		const body = {
			id,
			light,
			state,
		};

		try {
			await API.get_flash_light(body);
		} catch (error) {
			console.error("Error getting data:", error);
		}
	};


	useEffect(() => {
		if (!selectedSlot?.id) return;
		readySlot(selectedSlot.id, step);

	}, [step]);

	const finishWithLoading = () => {
		setLoading(true);
		onClose();
	};


	return (
		<div
			className="modal fade show"
			style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
			tabIndex="-1"
			role="dialog"
			onClick={onClose}
		>
			<div
				className="modal-dialog modal-dialog-centered modal-lg"
				role="document"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="modal-content shadow-xl rounded-5 overflow-hidden">
					{/* HEADER */}
					<div
						className="modal-header text-white d-flex align-items-center"
						style={{
							background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
							padding: "1rem 1.5rem",
						}}
					>
						<h5 className="modal-title fw-bold">
							<i className="bi bi-gear-fill me-2"></i> Calibration Wizard
							<span className="badge bg-warning text-dark ms-3">
								RFID: {selectedSlot.rfid}
							</span>
						</h5>
						<button className="btn-close btn-close-white" onClick={onClose} />
					</div>

					{/* PROGRESS */}
					<div className="px-4 pt-3 pb-2">
						<div
							className="progress rounded-pill"
							style={{ height: "12px", backgroundColor: "#e9ecef" }}
						>
							<div
								className="progress-bar bg-success rounded-pill"
								role="progressbar"
								style={{ width: `${progressMap[step]}%`, transition: "width 0.4s ease" }}
							/>
						</div>
					</div>

					{/* BODY */}
					<div className="modal-body px-5 py-4">
						{/* STEP 1 */}
						{step === 1 && (
							<div className="alert alert-info text-center shadow-sm p-4 rounded-4">
								<h6 className="fw-bold mb-3">
									<i className="bi bi-box-seam me-2"></i> Step 1 – Empty Rack
								</h6>
								<p className="mb-2">Please empty the rack completely.</p>
								<small className="text-muted">
									When the rack is empty, press <b>OK</b> to start.
								</small>

								{/* spinner loading ise */}
								{loading && (
									<div className="text-center mt-3">
										<div className="spinner-border text-primary" role="status" />
										<p className="mt-2 text-muted fw-semibold">Processing...</p>
									</div>
								)}
							</div>
						)}

						{/* STEP 2 */}
						{step === 2 && (
							<div className="alert alert-warning shadow-sm p-4 rounded-4">
								<h6 className="fw-bold mb-3">
									<i className="bi bi-speedometer2 me-2"></i> Step 2 – Measuring
								</h6>
								<p className="mb-2">Please place the calibration weight on the shelf and press <b>OK</b></p>

								{/* spinner loading ise */}
								{loading && (
									<div className="text-center mt-3">
										<div className="spinner-border text-warning" role="status" />
										<p className="mt-2 text-muted fw-semibold">Wait while the system measures the Calibration.</p>
									</div>
								)}
							</div>
						)}

						{/* STEP 3 */}
						{step === 3 && (
							<div className="alert alert-success text-center shadow-sm p-4 rounded-4">
								<h6 className="fw-bold mb-3">
									<i className="bi bi-check-circle-fill me-2"></i> Step 3 – Completed
								</h6>
								<p className="mb-0 fw-semibold">Calibration Completed Successfully</p>

								{loading && (
									<div className="text-center mt-3">
										<div className="spinner-border text-success" role="status" />
										<p className="mt-2 text-muted fw-semibold">Finalizing...</p>
									</div>
								)}
							</div>
						)}
					</div>


					{/* FOOTER */}
					<div className="modal-footer px-5 pb-4 pt-3">
						<button
							className="btn btn-outline-secondary btn-lg"
							onClick={onClose}
							disabled={loading}
						>
							Cancel
						</button>

						{step > 1 && (
							<button
								className="btn btn-secondary btn-lg me-auto"
								onClick={() => setStep(prev => Math.max(prev - 1, 1))}
								disabled={loading}
							>
								Back
							</button>
						)}

						{step < 3 && (
							<button
								className="btn btn-primary btn-lg px-5"
								onClick={nextStepWithLoading}
								disabled={loading}
							>
								{loading ? "PLEASE WAIT..." : "OK"}
							</button>
						)}

						{step === 3 && (
							<button
								className="btn btn-success btn-lg px-5"
								onClick={finishWithLoading}
								disabled={loading}
							>
								Finish
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);


};

export default CalibrationStepsModal;
