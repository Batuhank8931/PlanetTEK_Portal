import React, { useState, useEffect } from "react";
import { Modal, Button, Row, Col, Card } from "react-bootstrap";
import API from "../utils/utilRequest";

function SettingModal({ show, handleClose, rack }) {
	const [levels, setLevels] = useState([]); // Levels and slots state
	const [loading, setLoading] = useState(false);

	// Rack design'ı backend'den çek
	useEffect(() => {
		const fetchRack = async () => {
			if (!rack) return;
			setLoading(true);
			try {
				const response = await API.get_reckdesign_by_id(rack);
				const data = response.data;

				// Backend design array'ini levels/slots formatına çevir
				const levelsData = data.design.reduce((acc, slot) => {
					const lvlIndex = acc.findIndex(l => l.levelId === slot.level_id);
					if (lvlIndex >= 0) {
						acc[lvlIndex].slots.push({ slotId: slot.slot_id });
					} else {
						acc.push({ levelId: slot.level_id, slots: [{ slotId: slot.slot_id }] });
					}
					return acc;
				}, []);

				setLevels(levelsData);
			} catch (err) {
				console.error("Error fetching rack design:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchRack();
	}, [rack, show]);

	// Add a new level
	const addLevel = () => {
		setLevels([...levels, { levelId: levels.length + 1, slots: [] }]);
	};

	// Remove a level
	const removeLevel = (levelIndex) => {
		const newLevels = [...levels];
		newLevels.splice(levelIndex, 1);
		// Reindex level IDs
		const reindexed = newLevels.map((lvl, idx) => ({
			...lvl,
			levelId: idx + 1,
		}));
		setLevels(reindexed);
	};

	// Add a new slot to a level
	const addSlot = (levelIndex) => {
		const newLevels = [...levels];
		newLevels[levelIndex].slots.push({
			slotId: newLevels[levelIndex].slots.length + 1,
		});
		setLevels(newLevels);
	};

	// Remove a slot from a level
	const removeSlot = (levelIndex, slotIndex) => {
		const newLevels = [...levels];
		newLevels[levelIndex].slots.splice(slotIndex, 1);
		// Reindex slot IDs
		newLevels[levelIndex].slots = newLevels[levelIndex].slots.map((slot, idx) => ({
			...slot,
			slotId: idx + 1,
		}));
		setLevels(newLevels);
	};

	// Save / Update rack design
	const saveRackDesign = async () => {
		if (levels.length === 0) {
			alert("Please add at least one level with slots before saving.");
			return;
		}

		const payload = {
			rack_id: rack,
			design: levels.flatMap(level =>
				level.slots.map(slot => ({
					level_id: level.levelId,
					slot_id: slot.slotId
				}))
			)
		};

		try {
			// Backend'e gönder (update veya add)
			const response = await API.get_reckdesign_by_id(rack)
				.then(() => API.update_reckdesign(rack, payload.design)) // Eğer var, update
				.catch(() => API.add_reckdesign(payload)); // Yoksa add

			alert("Rack saved successfully!");
			handleClose();
			setLevels([]);
		} catch (err) {
			console.error("Error saving rack:", err);
			alert("Error saving rack");
		}
	};

	// Delete rack
	const deleteRack = async () => {
		if (!window.confirm("Are you sure you want to delete this rack?")) return;

		try {
			await API.delete_reckdesign(rack);
			alert("Rack deleted successfully!");
			handleClose();
			setLevels([]);
		} catch (err) {
			console.error("Error deleting rack:", err);
			alert("Error deleting rack");
		}
	};

	return (
		<Modal show={show} onHide={handleClose} size="lg">
			<Modal.Header closeButton>
				<Modal.Title>Rack Settings - {rack}</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{loading ? (
					<p>Loading...</p>
				) : (
					<>
						<Button variant="primary" onClick={addLevel} className="mb-3">
							Add Level
						</Button>

						{levels.map((level, levelIndex) => (
							<Card key={level.levelId} className="mb-3 p-2">
								<Row className="align-items-center">
									<Col xs={2}>
										<strong>Level {level.levelId}</strong>
										<Button
											variant="light"
											size="sm"
											className="ms-2 p-0"
											style={{ fontWeight: "bold", color: "black", border: "none" }}
											onClick={() => removeLevel(levelIndex)}
										>
											×
										</Button>
									</Col>
									<Col xs={8}>
										{level.slots.map((slot, slotIndex) => (
											<div
												key={slot.slotId}
												style={{
													display: "inline-flex",
													alignItems: "center",
													marginRight: "8px",
													marginBottom: "4px",
													padding: "4px 8px",
													backgroundColor: "#6c757d",
													color: "white",
													borderRadius: "4px",
													position: "relative",
													fontSize: "0.875rem",
												}}
											>
												<span style={{ marginRight: "6px" }}>Slot {slot.slotId}</span>
												<span
													style={{
														cursor: "pointer",
														fontWeight: "bold",
														color: "black",
														padding: "0 4px",
													}}
													onClick={() => removeSlot(levelIndex, slotIndex)}
												>
													×
												</span>
											</div>
										))}
									</Col>
									<Col xs={2}>
										<Button
											variant="success"
											size="sm"
											onClick={() => addSlot(levelIndex)}
										>
											Add Slot
										</Button>
									</Col>
								</Row>
							</Card>
						))}

						{levels.length === 0 && <p>No levels added yet.</p>}
					</>
				)}
			</Modal.Body>
			<Modal.Footer>
				<Button variant="danger" onClick={deleteRack}>
					Delete Rack
				</Button>
				<Button variant="secondary" onClick={handleClose}>
					Close
				</Button>
				<Button variant="primary" onClick={saveRackDesign}>
					Save
				</Button>
			</Modal.Footer>
		</Modal>
	);
}

export default SettingModal;
