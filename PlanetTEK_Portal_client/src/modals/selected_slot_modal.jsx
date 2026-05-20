// selected_slot_modal.jsx
import React, { useState, useEffect } from "react";
import NewProductStepsModal from "./new_product_steps_modal";
import CalibrationStepsModal from "./calibration_steps_modal";
import API from "../utils/utilRequest";

const SelectedSlot = ({ selectedSlot, setSelectedSlot, handleSave }) => {
	if (!selectedSlot) return null;

	const [shownew_product, setShownew_product] = useState(false);
	const [showCalibrationt, setShowCalibrationt] = useState(false);
	const [saving, setSaving] = useState(false);
	const [selectedRfid, setSelectedRfid] = useState(null);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const [rfidList, setRfIdList] = useState([]);

	const isEmpty = !selectedSlot?.rfid;
	const needsnew_product =
		selectedSlot?.rfid && !selectedSlot.unit_weight_gram;

	const handleSaveWithLoading = async () => {
		setSaving(true);
		await handleSave(selectedSlot);
		setSaving(false);
		setSelectedSlot(null);
	};

	const restoreFromRfid = async (rfid) => {
		const response = await API.getproductbyrfid({ rfid });
		console.log(response.data)
		const selectedrfid = response.data
		setSelectedSlot({
			...selectedSlot,
			product_code: selectedrfid.product_code,
			description: selectedrfid.description,
			unit_weight_gram: selectedrfid.unit_weight_gram,
			standard: selectedrfid.standard,
			rfid:selectedSlot.rfid
		})

		setSelectedRfid(rfid);
		console.log("Restoring from:", rfid);
	};

	const fetchrfids = async () => {
		try {
			const response = await API.getallrfids();

			const allRfIds = response.data;

			setRfIdList(allRfIds)

		} catch (error) {
			console.error("Error getting data:", error);
		}
	};


	useEffect(() => {
		if (needsnew_product) {
			fetchrfids();
		}

		const handleClickOutside = (e) => {
			if (!e.target.closest(".dropdown")) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener("click", handleClickOutside);

		return () => document.removeEventListener("click", handleClickOutside);
	}, [isEmpty]);


	return (
		<div
			className="modal fade show"
			style={{ display: "block", backgroundColor: "rgba(0,0,0,0.6)" }}
			tabIndex="-1"
			role="dialog"
			onClick={() => setSelectedSlot(null)}
		>
			<div
				className="modal-dialog modal-dialog-centered modal-lg"
				role="document"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="modal-content shadow-lg rounded-4">
					{/* HEADER */}
					<div
						className={`modal-header rounded-top-4 ${isEmpty ? "bg-danger" : "bg-primary"
							} text-white`}
					>
						<h5 className="modal-title d-flex align-items-center gap-2">
							Slot Status
							<span className="badge bg-light text-dark">
								{selectedSlot?.rfid || "EMPTY"}
							</span>
						</h5>

						<button
							className="btn-close btn-close-white"
							onClick={() => setSelectedSlot(null)}
						/>
					</div>

					{/* EMPTY STATE */}
					{isEmpty && (
						<div className="modal-body text-center py-5">
							<div className="alert alert-danger mx-4">
								<h5 className="fw-bold mb-2">Slot is Empty</h5>
								<p className="mb-0">
									There is no product or RFID detected in this slot.
								</p>
							</div>
						</div>
					)}

					{/* NORMAL STATE */}
					{!isEmpty && (
						<>
							{/* new_product WARNING */}
							{needsnew_product && (
								<div className="alert alert-warning rounded-0 text-center mb-0">
									<strong>New Product required!</strong>

									<div className="d-flex justify-content-center gap-2 mt-3">

										{/* Add New Product */}
										<button
											className="btn btn-warning btn-sm px-4"
											onClick={() => setShownew_product(true)}
										>
											Start to Add New Product
										</button>

										{/* Restore Dropdown */}
										<div className="dropdown" style={{ position: "relative" }}>
											<button
												className="btn btn-outline-warning btn-sm px-4"
												type="button"
												onClick={() => setIsDropdownOpen((prev) => !prev)}
											>
												{selectedRfid ? selectedRfid : "Restore From Existed rfId"}
												<span className="ms-2">▾</span>
											</button>

											{isDropdownOpen && (
												<ul
													className="dropdown-menu shadow"
													style={{
														display: "block",
														position: "absolute",
														top: "110%",
														left: 0,
														right: 0,
														zIndex: 9999,
													}}
												>
													{rfidList.length === 0 && (
														<li className="dropdown-item text-muted small">
															No RFID found
														</li>
													)}

													{rfidList.map((rfid, index) => (
														<li key={index}>
															<button
																className="dropdown-item"
																onClick={() => {
																	restoreFromRfid(rfid);
																	setIsDropdownOpen(false); // dropdown kapanır
																}}
															>
																{rfid}
															</button>
														</li>
													))}
												</ul>
											)}
										</div>



									</div>
								</div>

							)}

							< div className="modal-body px-4 py-4">
								<div className="row g-3">
									<div className="col-md-6">
										<label className="form-label fw-semibold">
											Product Code
										</label>
										<input
											type="text"
											className="form-control"
											value={selectedSlot.product_code || ""}
											onChange={(e) =>
												setSelectedSlot({
													...selectedSlot,
													product_code: e.target.value,
												})
											}
										/>
									</div>
									{!needsnew_product && (
										<div className="col-md-6">
											<label className="form-label fw-semibold">
												Quantity
											</label>
											<input
												type="number"
												className="form-control bg-light"
												value={selectedSlot.quantity ?? "-"}
												readOnly
											/>

										</div>
									)}
									<div className="col-md-12">
										<label className="form-label fw-semibold">
											Description
										</label>
										<input
											type="text"
											className="form-control"
											value={selectedSlot.description || ""}
											onChange={(e) =>
												setSelectedSlot({
													...selectedSlot,
													description: e.target.value,
												})}
										/>
									</div>
									{!needsnew_product && (
										<div className="col-md-6">
											<label className="form-label fw-semibold">
												Unit Weight (g)
											</label>
											<input
												type="text"
												className={`form-control ${needsnew_product ? "border-warning" : ""
													}`}
												value={selectedSlot.unit_weight_gram || ""}
												onChange={(e) =>
													setSelectedSlot({
														...selectedSlot,
														unit_weight_gram: e.target.value,
													})
												}
											/>
										</div>
									)}
									<div className="col-md-6">
										<label className="form-label fw-semibold">
											Standard
										</label>
										<input
											type="text"
											className="form-control"
											value={selectedSlot.standard || ""}
											onChange={(e) =>
												setSelectedSlot({
													...selectedSlot,
													standard: e.target.value,
												})}
										/>
									</div>
								</div>
							</div>

							{/* FOOTER */}
							<div className="modal-footer px-4 pb-4">
								<button
									className="btn btn-outline-secondary"
									onClick={() => setSelectedSlot(null)}
								>
									Close
								</button>

								<button
									className="btn btn-warning px-4"
									onClick={() => setShowCalibrationt(true)}
								>
									Calibrate Slot
								</button>

								<button
									className="btn btn-success px-4"
									onClick={handleSaveWithLoading}
									disabled={saving}
								>
									{saving && (
										<span className="spinner-border spinner-border-sm me-2" />
									)}
									Save Changes
								</button>
							</div>

						</>
					)}
				</div>
			</div>

			{/* new_product MODAL */}
			{/* new_product MODAL */}
			{
				shownew_product && !isEmpty && (
					<NewProductStepsModal
						selectedSlot={selectedSlot}
						onClose={async () => {
							setShownew_product(false);
							try {
								const response = await API.clear_flash_light();
								console.log("Flash light cleared:", response);
							} catch (err) {
								console.error("Failed to clear flash light:", err);
							}
						}}
						onFinish={({ rfid, amount }) => {
							console.log("new_product DONE", rfid, amount);
						}}
					/>
				)
			}
			{
				showCalibrationt && (
					<CalibrationStepsModal
						selectedSlot={selectedSlot}
						onClose={async () => {
							setShowCalibrationt(false);
							try {
								const response = await API.clear_flash_light();
								console.log("Flash light cleared:", response);
							} catch (err) {
								console.error("Failed to clear flash light:", err);
							}
						}}
						onFinish={({ rfid, amount }) => {
							console.log("Calibration DONE", rfid, amount);
						}}
					/>
				)
			}

		</div >
	);
};

export default SelectedSlot;
