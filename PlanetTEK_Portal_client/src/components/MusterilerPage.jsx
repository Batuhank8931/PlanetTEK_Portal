import React, { useState, useEffect, useMemo } from "react";
import AddPutMusteri from "./MusteriComponents/AddPutMusteri";
import { AnimatePresence } from "framer-motion";
import AlertModal from "./modals/AlertModal";
import API from "../utils/utilRequest";

function MusterilerPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [menseiFilter, setMenseiFilter] = useState("Hepsi");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Alert Modal State'i
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    title: "",
    message: "",
    type: "info",
    showCancel: false,
    action: null
  });

  // 📥 1. Müşteri Verilerini Backend'den Çekme
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await API.getCustomers();
      // API'den dönen veri yapısına göre (örn: res.data veya doğrudan res) ayarlıyoruz
      setCustomers(res.data || res || []);
    } catch (err) {
      console.error("Müşteriler yüklenirken hata:", err);
      setAlertConfig({
        show: true,
        title: "Hata",
        message: "Müşteri listesi sunucudan alınamadı.",
        type: "danger",
        showCancel: false,
        action: () => setAlertConfig(prev => ({ ...prev, show: false }))
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        (c.ticari_unvan && c.ticari_unvan.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.yetkiliSatisci && c.yetkiliSatisci.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.ulke && c.ulke.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesMensei = menseiFilter === "Hepsi" || c.mensei === menseiFilter;
      return matchesSearch && matchesMensei;
    });
  }, [customers, searchQuery, menseiFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const displayedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  const openAddPanel = () => {
    setSelectedCustomer(null);
    setIsPanelOpen(true);
  };

  const openEditPanel = async (customer) => {
    try {
      // Düzenleme modalı açılırken backend'den güncel ve detaylı (kontaklı) halini çekiyoruz
      const res = await API.getCustomerById(customer.id);
      setSelectedCustomer(res.data || res);
      setIsPanelOpen(true);
    } catch (err) {
      console.error("Müşteri detayı alınamadı:", err);
      // Hata olursa eldeki tablo verisiyle açmayı dene
      setSelectedCustomer(customer);
      setIsPanelOpen(true);
    }
  };

  // 💾 Kaydetme / Güncelleme Sonrası Listeyi Yenile
  const handleSaveCustomer = async (incomingData) => {
    // AddPutMusteri bileşeni içeride API isteklerini (addCustomer / putCustomer) zaten yönetiyorsa
    // burada direkt listeyi tazeleyebiliriz:
    setIsPanelOpen(false);
    await fetchCustomers();
  };

  // ❌ Silme İşlemi
  const handleDelete = (id) => {
    setAlertConfig({
      show: true,
      title: "Müşteriyi Sil",
      message: "Bu müşteriyi ve bağlı tüm yetkili kayıtlarını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
      type: "warning",
      showCancel: true,
      action: async () => {
        try {
          await API.deleteCustomer(id);
          
          // Listeden state düzeyinde düşür veya yeniden fetch et
          setCustomers((prev) => prev.filter((c) => c.id !== id));

          setAlertConfig({
            show: true,
            title: "Müşteri Silindi",
            message: "Müşteri kaydı sistemden başarıyla kaldırıldı.",
            type: "success",
            showCancel: false,
            action: () => setAlertConfig(prev => ({ ...prev, show: false }))
          });
        } catch (err) {
          console.error("Silme hatası:", err);
          setAlertConfig({
            show: true,
            title: "İşlem Başarısız",
            message: "Müşteri silinirken teknik bir hata oluştu.",
            type: "danger",
            showCancel: false,
            action: () => setAlertConfig(prev => ({ ...prev, show: false }))
          });
        }
      }
    });
  };

  return (
    <div
      className="container-fluid pb-4 min-vh-100"
      style={{
        fontSize: "14px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#1a2d3a",
        paddingTop: window.innerWidth < 768 ? "75px" : "20px"
      }}
    >
      {/* ÜST BAŞLIK */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-3 border-bottom gap-3" style={{ borderColor: "#dee2e6" }}>
        <div>
          <h5 className="mb-1 fw-semibold tracking-tight" style={{ color: "#94a3b8" }}>
            <i className="bi bi-building me-2" style={{ color: "#00874e" }}></i>Müşteri Portföyü
          </h5>
        </div>
      </div>

      {/* FİLTRELEME ALANI */}
      <div className="card shadow-sm border-0 mb-4" style={{ backgroundColor: "transparent" }}>
        <div className="card-body m-0 p-0 border-0">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text border-end-0 text-white-50" style={{ backgroundColor: "#0f172a", borderColor: "#334155" }}>
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control text-white border-start-0 custom-placeholder"
                  style={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    fontSize: "13px"
                  }}
                  placeholder="Ticari ünvan, ülke veya satışçı ara..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>
            <div className="col-12 col-md-3">
              <select
                className="form-select form-select-sm text-white"
                style={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: "13px" }}
                value={menseiFilter}
                onChange={(e) => { setMenseiFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="Hepsi" style={{ backgroundColor: "#0f172a" }}>Menşei: Tümü</option>
                <option value="Yerli" style={{ backgroundColor: "#0f172a" }}>Yerli Firmalar</option>
                <option value="Yabancı" style={{ backgroundColor: "#0f172a" }}>Yabancı Firmalar</option>
              </select>
            </div>
            <div className="col-12 col-md-2 d-flex align-items-center justify-content-start justify-content-md-end" style={{ fontSize: "12px", color: "#94a3b8" }}>
              Toplam: <span className="fw-semibold ms-1" style={{ color: "#f8fafc" }}>{filteredCustomers.length} Müşteri</span>
            </div>
            <div className="col-12 col-md-3 d-flex justify-content-start justify-content-md-end">
              <button
                onClick={openAddPanel}
                className="btn text-white px-3 py-2 shadow-sm border-0 d-flex align-items-center fw-medium w-md-auto justify-content-center"
                style={{ backgroundColor: "#00874e", fontSize: "13px", borderRadius: "6px", transition: "all 0.2s" }}
              >
                <i className="bi bi-plus-lg me-1.5"></i> Yeni Müşteri Ekle
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLO */}
      <div className="card shadow-sm border-0" style={{ borderRadius: "8px", overflow: "hidden", backgroundColor: "#1e293b" }}>
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0" style={{ fontSize: "13px", minWidth: "800px", backgroundColor: "#1e293b" }}>
            <thead className="text-muted border-bottom" style={{ fontSize: "11px", letterSpacing: "0.5px", borderColor: "#334155" }}>
              <tr>
                <th className="py-3 px-4 fw-semibold text-uppercase" style={{ color: "#94a3b8", backgroundColor: "#0f172a" }}>Firma / Menşei</th>
                <th className="py-3 fw-semibold text-uppercase" style={{ color: "#94a3b8", backgroundColor: "#0f172a" }}>Vergi Bilgileri</th>
                <th className="py-3 fw-semibold text-uppercase" style={{ color: "#94a3b8", backgroundColor: "#0f172a" }}>Primary Yetkili Kişi</th>
                <th className="py-3 fw-semibold text-uppercase text-center" style={{ color: "#94a3b8", backgroundColor: "#0f172a" }}>Teklif Durumu</th>
                <th className="py-3 fw-semibold text-uppercase" style={{ color: "#94a3b8", backgroundColor: "#0f172a" }}>Sorumlu Satışçı</th>
                <th className="py-3 fw-semibold text-uppercase text-end px-4" style={{ color: "#94a3b8", backgroundColor: "#0f172a" }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted" style={{ fontSize: "13px", color: "#94a3b8", backgroundColor: "#1e293b" }}>
                    Yükleniyor...
                  </td>
                </tr>
              ) : displayedCustomers.length > 0 ? (
                displayedCustomers.map((customer) => (
                  <tr key={customer.id} style={{ borderColor: "#334155" }}>
                    <td className="px-4 py-3" style={{ backgroundColor: "#1e293b" }}>
                      <div className="fw-semibold" style={{ color: "#f8fafc" }}>{customer.ticari_unvan}</div>
                      <div className="d-flex align-items-center mt-1 gap-2" style={{ fontSize: "11px" }}>
                        <span
                          className="badge px-2 py-0.5 fw-medium"
                          style={customer.mensei === "Yerli"
                            ? { backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80" }
                            : { backgroundColor: "rgba(234, 179, 8, 0.2)", color: "#fef08a" }
                          }
                        >
                          {customer.mensei}
                        </span>
                        <span style={{ color: "#94a3b8" }}><i className="bi bi-geo-alt me-1"></i>{customer.ulke}</span>
                      </div>
                    </td>
                    <td style={{ backgroundColor: "#1e293b" }}>
                      <div className="fw-medium" style={{ color: "#e2e8f0" }}>{customer.vergiDairesi || "-"}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>No: {customer.vergiNo || "-"}</div>
                    </td>
                    <td style={{ backgroundColor: "#1e293b" }}>
                      {customer.yetkililer && customer.yetkililer[0] ? (
                        <div>
                          <div className="fw-medium" style={{ color: "#e2e8f0" }}>{customer.yetkililer[0].isim}</div>
                          <div className="d-flex align-items-center gap-1" style={{ fontSize: "11px", color: "#94a3b8" }}>
                            <i className="bi bi-envelope" style={{ fontSize: "10px", color: "#94a3b8" }}></i>
                            {customer.yetkililer[0].mail || "-"}
                            {customer.yetkililer.length > 1 && (
                              <span className="badge border px-1.5 py-0.5 fw-normal" style={{ fontSize: "9px", borderColor: "#475569", backgroundColor: "#334155", color: "#cbd5e1" }}>
                                +{customer.yetkililer.length - 1} Diğer
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded fw-medium" style={{ fontSize: "11px", color: "#f87171", backgroundColor: "rgba(239, 68, 68, 0.2)" }}>Atanmadı</span>
                      )}
                    </td>
                    <td className="text-center" style={{ backgroundColor: "#1e293b" }}>
                      <span
                        className="badge px-2.5 py-1 fw-medium"
                        style={customer.teklifAdedi > 0
                          ? { backgroundColor: "rgba(248, 250, 252, 0.08)", color: "#f8fafc", border: "1px solid rgba(248, 250, 252, 0.15)" }
                          : { backgroundColor: "transparent", color: "#64748b", border: "1px dashed #475569" }
                        }
                      >
                        {customer.teklifAdedi || 0} Teklif
                      </span>
                      {customer.teklifAdedi > 0 && (
                        <div className="mt-1 text-truncate mx-auto" style={{ maxWidth: "150px", fontSize: "11px", color: "#94a3b8" }}>
                          {customer.teklifDetay}
                        </div>
                      )}
                    </td>
                    <td style={{ backgroundColor: "#1e293b" }}>
                      <span className="badge border px-2 py-1 fw-normal" style={{ borderColor: "#475569", backgroundColor: "#0f172a", color: "#cbd5e1" }}>
                        <i className="bi bi-person me-1" style={{ color: "#4ade80" }}></i>{customer.yetkiliSatisci || "Atanmadı"}
                      </span>
                    </td>
                    <td className="text-end px-4" style={{ backgroundColor: "#1e293b" }}>
                      <div className="d-inline-flex gap-1">
                        <button
                          onClick={() => openEditPanel(customer)}
                          className="btn btn-sm btn-link text-white p-1 text-decoration-none"
                          title="Düzenle"
                        >
                          <i className="bi bi-pencil" style={{ fontSize: "14px" }}></i>
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="btn btn-sm btn-link text-danger p-1 text-decoration-none"
                          title="Sil"
                        >
                          <i className="bi bi-trash" style={{ fontSize: "14px" }}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted" style={{ fontSize: "13px", color: "#94a3b8", backgroundColor: "#1e293b" }}>Kayıt bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3 px-1 gap-2" style={{ fontSize: "12px" }}>
          <div className="text-white text-center text-sm-start">Toplam {totalPages} sayfadan {currentPage}. sayfadasınız.</div>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link border-0 bg-transparent px-2"
                  style={{ color: "#94a3b8" }}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  <i className="bi bi-chevron-left" style={{ fontSize: "10px" }}></i>
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, idx) => (
                <li key={idx + 1} className={`page-item ${currentPage === idx + 1 ? "active" : ""}`}>
                  <button
                    className="page-link border-0 mx-0.5 rounded-circle text-center d-flex align-items-center justify-content-center"
                    style={currentPage === idx + 1
                      ? { backgroundColor: "#00874e", color: "white", width: "24px", height: "24px", padding: 0 }
                      : { color: "#cbd5e1", backgroundColor: "transparent", width: "24px", height: "24px", padding: 0 }
                    }
                    onClick={() => setCurrentPage(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button
                  className="page-link border-0 bg-transparent px-2"
                  style={{ color: "#94a3b8" }}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  <i className="bi bi-chevron-right" style={{ fontSize: "10px" }}></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* MODAL & SLIDE-OVER PANELS */}
      <AnimatePresence>
        {isPanelOpen && (
          <AddPutMusteri
            isOpen={isPanelOpen}
            onClose={() => setIsPanelOpen(false)}
            selectedCustomer={selectedCustomer}
            onSave={handleSaveCustomer}
          />
        )}
      </AnimatePresence>

      <AlertModal
        {...alertConfig}
        onClose={() => setAlertConfig(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}

export default MusterilerPage;