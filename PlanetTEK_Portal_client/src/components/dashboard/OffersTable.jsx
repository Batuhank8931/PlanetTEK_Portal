import React from "react";

function OffersTable({
  offers,
  loading,
  totalRecords,
  limit,
  setLimit,
  page,
  setPage,
  totalPages,
  getStatusBadge,
  setStatusModalConfig,
  reviseOffer,
  handleDownloadFile
}) {
  return (
    <div className="p-2 rounded" style={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}>
      <div className="d-flex justify-content-between align-items-center mb-2 px-1">
        <span className="fw-semibold" style={{ fontSize: "11px" }}>
          Teklif Listesi ({totalRecords} Kayıt Bulundu){" "}
          {loading && <span className="ms-2 text-warning spinner-border spinner-border-sm" role="status"></span>}
        </span>
        <div className="d-flex align-items-center gap-2">
          <label style={{ fontSize: "10px" }} className="text-white-50">Sayfa Başı:</label>
          <select
            className="form-select form-select-sm bg-dark text-white border-secondary py-0"
            style={{ width: "65px", height: "24px", fontSize: "10px" }}
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-dark table-hover table-striped table-bordered align-middle text-nowrap mb-0" style={{ fontSize: "11px" }}>
          <thead>
            <tr className="table-active text-uppercase" style={{ fontSize: "10px", color: "#9ca3af", letterSpacing: "0.3px" }}>
              <th style={{ width: "40px" }}>#ID</th>
              <th>Teklif Kodu / No</th>
              <th className="text-center">Durum</th>
              <th className="text-center">REVİZE ET</th>
              <th>Tarih</th>
              <th>Ticari Ünvan</th>
              <th>İlgili Kişi</th>
              <th>Hazırlayan</th>
              <th className="text-center">Debi (m³/g)</th>
              <th className="text-center">Atıksu Tipi</th>
              <th className="text-center">Hesap Yöntemi</th>
              <th className="text-center">Model Tipi</th>
              <th className="text-center">Giriş BOİ</th>
              <th className="text-center">Çıkış BOİ</th>
              <th className="text-center">Dil</th>
              <th className="text-center">Para B.</th>
              <th className="text-center" style={{ width: "130px" }}>İndir / Dokümanlar</th>
            </tr>
          </thead>
          <tbody>
            {offers.length === 0 ? (
              <tr>
                <td colSpan="17" className="text-center text-white-50 py-4">
                  {loading ? "Veriler filtreleniyor ve yükleniyor..." : "Seçilen filtrelere uygun kayıt bulunamadı."}
                </td>
              </tr>
            ) : (
              offers.map((teklif) => (
                <tr key={teklif.id} style={{ height: "30px" }}>
                  <td className="text-white-50 fw-bold">{teklif.id}</td>
                  <td className="fw-bold text-info">
                    {teklif.offer_number || teklif.teklif_no || `TEK-${teklif.id}`}
                    {teklif.offer_rev_code && <span className="badge bg-secondary ms-1 py-0 px-1" style={{ fontSize: "9px" }}>{teklif.offer_rev_code}</span>}
                  </td>
                  <td
                    className="text-center"
                    onClick={() => setStatusModalConfig({ show: true, offer: teklif })}
                  >
                    {getStatusBadge(teklif.offer_status)}
                  </td>
                  <td className="text-center">
                    <button 
                      className="btn btn-sm btn-outline-light py-0 px-2" 
                      style={{ fontSize: "10px" }}
                      onClick={() => reviseOffer(teklif.full_form_data)}
                    >
                      Revize Et
                    </button>
                  </td>
                  <td>
                    {new Date(teklif.created_at)
                      .toLocaleString("sv-SE", { timeZone: "Europe/Istanbul" })
                      .replace(" ", " ")}
                  </td>
                  <td className="fw-semibold text-white" style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis" }} title={teklif.ticari_unvan}>
                    {teklif.ticari_unvan || "-"}
                  </td>
                  <td className="text-white-50">
                    <div>{teklif.ilgili_kisi || "-"}</div>
                    {teklif.ilgili_kisi_email && <div style={{ fontSize: "9.5px" }} className="text-muted">{teklif.ilgili_kisi_email}</div>}
                  </td>
                  <td>
                    <div>{teklif.hazirlayan_kullanici || "Bilinmiyor"}</div>
                    {teklif.hazirlayan_departman && <span className="text-white-50" style={{ fontSize: "9px" }}>({teklif.hazirlayan_departman})</span>}
                  </td>
                  <td className="text-center fw-bold text-warning">
                    {teklif.debi || teklif.parsed_debi ? `${teklif.debi || teklif.parsed_debi}` : "-"}
                  </td>
                  <td className="text-center">
                    {teklif.atiksutype ? <span className="badge bg-dark border border-secondary text-light py-0 px-1" style={{ fontSize: "9.5px" }}>{teklif.atiksutype}</span> : "-"}
                  </td>
                  <td className="text-center text-white-50" style={{ fontSize: "10.5px" }}>
                    {teklif.hesap_yontemi || "-"}
                  </td>
                  <td className="text-center" style={{ fontSize: "10.5px" }}>
                    {teklif.unit_model_type || "-"}
                  </td>
                  <td className="text-center" style={{ fontSize: "10.5px" }}>
                    {teklif.giris_boi ?? "-"}
                  </td>
                  <td className="text-center text-success" style={{ fontSize: "10.5px" }}>
                    {teklif.cikis_boi ?? "-"}
                  </td>
                  <td className="text-center" style={{ fontSize: "10.5px" }}>
                    <span className="badge bg-dark text-white border border-secondary">{teklif.teklif_dili || "TR"}</span>
                  </td>
                  <td className="text-center fw-bold text-success" style={{ fontSize: "10.5px" }}>
                    {teklif.currency || "EUR"}
                  </td>
                  <td className="text-center">
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-primary py-0 px-1"
                        style={{ fontSize: "10px", lineHeight: "1.2" }}
                        title="DOCX İndir"
                        disabled={!teklif.files?.docx?.length}
                        onClick={() => handleDownloadFile(teklif.offer_number, "docx", teklif.customer_id)}
                      >
                        DOC
                      </button>
                      <button
                        className="btn btn-outline-danger py-0 px-1"
                        style={{ fontSize: "10px", lineHeight: "1.2" }}
                        title="PDF İndir"
                        disabled={!teklif.files?.pdf?.length}
                        onClick={() => handleDownloadFile(teklif.offer_number, "pdf", teklif.customer_id)}
                      >
                        PDF
                      </button>
                      <button
                        className="btn btn-outline-success py-0 px-1"
                        style={{ fontSize: "10px", lineHeight: "1.2" }}
                        title="XLSX İndir"
                        disabled={!teklif.files?.xlsx?.length}
                        onClick={() => handleDownloadFile(teklif.offer_number, "xlsx", teklif.customer_id)}
                      >
                        XLS
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-secondary px-1">
        <span style={{ fontSize: "10.5px" }} className="text-white-50">
          Sayfa {page} / {totalPages} (Gösterilen: {offers.length} / Toplam: {totalRecords})
        </span>
        <div className="btn-group btn-group-sm">
          <button
            className="btn btn-secondary py-0 px-2"
            style={{ fontSize: "10.5px" }}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <i className="bi bi-chevron-left"></i> Önceki
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
            .map((pNum) => (
              <button
                key={pNum}
                className={`btn py-0 px-2 ${pNum === page ? "btn-success" : "btn-outline-secondary text-white"}`}
                style={{ fontSize: "10.5px" }}
                onClick={() => setPage(pNum)}
              >
                {pNum}
              </button>
            ))}
          <button
            className="btn btn-secondary py-0 px-2"
            style={{ fontSize: "10.5px" }}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Sonraki <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default OffersTable;