import React, { useState, useEffect } from "react";

const STATUS_OPTIONS = [
  "beklemede",
  "gönderildi",
  "onaylandı",
  "olumsuz",
  "revize edildi"
];

function UpdateStatusModal({ show, offer, onClose, onSave }) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (offer) {
      setSelectedStatus(offer.offer_status || "beklemede");
    }
  }, [offer]);

  if (!show || !offer) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSave(offer.id, selectedStatus);
    setSubmitting(false);
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div
          className="modal-content text-white border-secondary shadow-lg"
          style={{ backgroundColor: "#0f172a", fontSize: "12px" }}
        >
          <div className="modal-header border-secondary py-2">
            <h6 className="modal-title fw-semibold text-warning m-0">
              <i className="bi bi-pencil-square me-2"></i>Teklif Durumu Güncelle
            </h6>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={submitting}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body py-3">
              <div className="mb-2">
                <span className="text-white-50 d-block" style={{ fontSize: "10.5px" }}>Teklif Kodu:</span>
                <strong className="text-info">{offer.offer_number || offer.teklif_no || `TEK-${offer.id}`}</strong>
              </div>

              <div className="mb-2">
                <label className="form-label text-white-50 mb-1" style={{ fontSize: "10.5px" }}>
                  Yeni Durum Seçin:
                </label>
                <select
                  className="form-select form-select-sm bg-dark text-white border-secondary"
                  style={{ fontSize: "11.5px" }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={submitting}
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer border-secondary py-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-light py-1 px-3"
                style={{ fontSize: "11px" }}
                onClick={onClose}
                disabled={submitting}
              >
                İptal
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-success py-1 px-3"
                style={{ fontSize: "11px" }}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    Kaydediliyor...
                  </>
                ) : (
                  "Güncelle"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UpdateStatusModal;