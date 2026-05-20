// new_product_steps_modal.jsx
import React, { useState, useEffect } from "react";
import API from "../utils/utilRequest";

const NewProductStepsModal = ({ selectedSlot, onClose, onFinish }) => {
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

		setLoading(true);

		try {
			// Step 1 sadece bilgi, backend çağrısı yok
			if (step === 1) {
				setStep(2);
				return;
			}

			// Step 2 – backend çağrısı
			if (step === 2) {
				if (!amount || amount <= 0) {
					console.warn("Amount is required for Step 2");
					return;
				}

				const body = { id: selectedSlot.id, rfid: selectedSlot.rfid, amount };
				const response = await API.new_product_Step_2(body);

				if (!response || response?.data?.success === false) {
					throw new Error("Step 2 failed");
				}

				setStep(3);
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
			style={{ display: "block", backgroundColor: "rgba(0,0,0,0.6)" }}
			tabIndex="-1"
			role="dialog"
			onClick={onClose}
		>
			<div
				className="modal-dialog modal-dialog-centered"
				role="document"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="modal-content shadow-lg rounded-4">
					{/* HEADER */}
					<div className="modal-header bg-dark text-white rounded-top-4">
						<h5 className="modal-title">
							New Product Wizard
							<span className="badge bg-warning text-dark ms-2">
								RFID: {selectedSlot.rfid}
							</span>
						</h5>
						<button className="btn-close btn-close-white" onClick={onClose} />
					</div>

					{/* PROGRESS */}
					<div className="px-4 pt-3">
						<div className="progress" style={{ height: "8px" }}>
							<div
								className="progress-bar bg-success"
								role="progressbar"
								style={{ width: `${progressMap[step]}%` }}
							/>
						</div>
					</div>

					{/* BODY */}
					<div className="modal-body px-4 py-4">
						{loading && (
							<div className="text-center my-4">
								<div className="spinner-border text-primary" role="status" />
								<p className="mt-3 text-muted">Processing...</p>
							</div>
						)}

						{!loading && (
							<>
								{/* STEP 1 */}
								{step === 1 && (
									<div className="alert alert-info text-center">
										<h6 className="fw-bold mb-2">Step 1 – Empty Rack</h6>
										<p className="mb-1">Please empty the rack completely.</p>
										<small className="text-muted">
											When the rack is empty, press <b>OK</b>.
										</small>
									</div>
								)}

								{/* STEP 2 */}
								{step === 2 && (
									<div className="alert alert-warning">
										<h6 className="fw-bold mb-2">Step 2 – Add Products</h6>
										<p>Please place a known amount of product into the rack.</p>

										<input
											type="number"
											className={`form-control mt-3 ${!amount ? "is-invalid" : ""
												}`}
											placeholder="Enter product amount"
											value={amount}
											onChange={(e) => setAmount(e.target.value)}
										/>

										{!amount && (
											<div className="invalid-feedback">
												Amount is required
											</div>
										)}
									</div>
								)}

								{/* STEP 3 */}
								{step === 3 && (
									<div className="alert alert-success text-center">
										<h6 className="fw-bold mb-2">Step 3 – Completed</h6>
										<p className="mb-0">
											New Product Added Successfully
										</p>
									</div>
								)}
							</>
						)}
					</div>

					{/* FOOTER */}
					<div className="modal-footer px-4 pb-4">
						<button
							className="btn btn-outline-secondary"
							onClick={onClose}
							disabled={loading}
						>
							Cancel
						</button>

						{/* BACK BUTTON */}
						{step > 1 && (
							<button
								className="btn btn-secondary me-auto"
								onClick={() => {
									setStep(prev => Math.max(prev - 1, 1));
								}}
								disabled={loading}
							>
								Back
							</button>
						)}

						{step < 3 && (
							<button
								className="btn btn-primary px-4"
								onClick={nextStepWithLoading}
								disabled={loading}
							>
								{loading ? "PLEASE WAIT..." : "OK"}
							</button>
						)}

						{step === 3 && (
							<button
								className="btn btn-success px-4"
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

export default NewProductStepsModal;
