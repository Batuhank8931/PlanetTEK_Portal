import React, { useState, useMemo } from "react";
import AddPutMusteri from "./MusteriComponents/AddPutMusteri";

const INITIAL_CUSTOMERS = [
  {
    id: 1,
    ticariUnvan: "Acme Endüstri Teknolojileri A.Ş.",
    mensei: "Yerli",
    ulke: "Türkiye",
    adres: "İkitelli OSB, Depo Sk. No:12, Başakşehir, İstanbul",
    vergiDairesi: "İkitelli V.D.",
    vergiNo: "1234567890",
    yetkililer: [
      { isim: "Ahmet Yılmaz", mail: "ahmet@acme.com", telefon: "+90 555 000 1122" },
      { isim: "Elif Kaya", mail: "elif.kaya@acme.com", telefon: "+90 555 000 1123" }
    ],
    teklifAdedi: 4,
    teklifDetay: "2 Aktif, 1 Onaylandı, 1 Reddedildi",
    yetkiliSatisci: "Caner Aydın"
  },
  {
    id: 2,
    ticariUnvan: "Global Logistics GmbH",
    mensei: "Yabancı",
    ulke: "Almanya",
    adres: "Kaiserstraße 44, 60311 Frankfurt am Main",
    vergiDairesi: "Frankfurt Central",
    vergiNo: "DE812345678",
    yetkililer: [
      { isim: "Hans Müller", mail: "hans.m@globallog.de", telefon: "+49 69 123456" }
    ],
    teklifAdedi: 2,
    teklifDetay: "1 Aktif, 1 Beklemede",
    yetkiliSatisci: "Selin Demir"
  },
  {
    id: 3,
    ticariUnvan: "Asya Enerji Sistemleri Ltd. Şti.",
    mensei: "Yerli",
    ulke: "Türkiye",
    adres: "GOP Mahallesi, Çankaya Cd. No:45, Ankara",
    vergiDairesi: "Kızılbey V.D.",
    vergiNo: "9876543210",
    yetkililer: [
      { isim: "Murat Özkan", mail: "mozkan@asyaenerji.com", telefon: "+90 532 111 2233" }
    ],
    teklifAdedi: 0,
    teklifDetay: "Teklif gönderilmedi",
    yetkiliSatisci: "Caner Aydın"
  },
  ...Array.from({ length: 9 }, (_, i) => ({
    id: i + 4,
    ticariUnvan: `Kardeşler İmalat Sanayi Ltd. #${i + 1}`,
    mensei: i % 3 === 0 ? "Yabancı" : "Yerli",
    ulke: i % 3 === 0 ? "İtalya" : "Türkiye",
    adres: "Organize Sanayi Bölgesi 3. Cadde, Bursa",
    vergiDairesi: "Nilüfer V.D.",
    vergiNo: `45612378${i}`,
    yetkililer: [{ isim: "Mehmet Demir", mail: "mehmet@kardesler.com", telefon: "+90 544 333 2211" }],
    teklifAdedi: i,
    teklifDetay: `${i} Adet Geçmiş Teklif Kaydı`,
    yetkiliSatisci: i % 2 === 0 ? "Selin Demir" : "Caner Aydın"
  }))
];

function MusterilerPage() {
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [menseiFilter, setMenseiFilter] = useState("Hepsi");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        c.ticariUnvan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.yetkiliSatisci.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.ulke.toLowerCase().includes(searchQuery.toLowerCase());
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

  const openEditPanel = (customer) => {
    setSelectedCustomer(customer);
    setIsPanelOpen(true);
  };

  const handleSaveCustomer = (incomingData) => {
    if (incomingData.id) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === incomingData.id ? { ...incomingData } : c))
      );
    } else {
      const newCustomer = {
        ...incomingData,
        id: Date.now(),
        teklifAdedi: 0,
        teklifDetay: "Yeni oluşturuldu"
      };
      setCustomers((prev) => [newCustomer, ...prev]);
    }
    setIsPanelOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Bu müşteriyi silmek istediğinize emin misiniz?")) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div
      className="container-fluid pb-4 min-vh-100"
      style={{
        fontSize: "14px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#1a2d3a",
        // Mobilde navbar arkasında kalmasın diye 70px (veya navbar yüksekliğin kadar) boşluk, masaüstünde 0
        paddingTop: window.innerWidth < 768 ? "75px" : "20px"
      }}
    >
      {/* ÜST BAŞLIK - Mobilde alt alta, md ekranda yan yana */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-3 border-bottom gap-3" style={{ borderColor: "#dee2e6" }}>
        <div>
          <h5 className="mb-1 fw-semibold tracking-tight" style={{ color: "#1a1c1d" }}>
            <i className="bi bi-building me-2" style={{ color: "#00874e" }}></i><span style={{ color: "#ffffff" }}>Müşteri Portföyü </span>
          </h5>
          <p className="mb-0" style={{ fontSize: "12px", color: '#6b8aaa' }}>Müşteri listesi, iletişim ve teklif takibi</p>
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
            {/* Buton d-flex ve justify-content-end ile en sağa yaslandı */}
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
          {/* Bootstrap'in beyaz arka planı ezmesi için table-dark sınıfı eklendi */}
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
              {displayedCustomers.length > 0 ? (
                displayedCustomers.map((customer) => (
                  <tr key={customer.id} style={{ borderColor: "#334155" }}>
                    <td className="px-4 py-3" style={{ backgroundColor: "#1e293b" }}>
                      <div className="fw-semibold" style={{ color: "#f8fafc" }}>{customer.ticariUnvan}</div>
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
                      <div className="fw-medium" style={{ color: "#e2e8f0" }}>{customer.vergiDairesi}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>No: {customer.vergiNo}</div>
                    </td>
                    <td style={{ backgroundColor: "#1e293b" }}>
                      {customer.yetkililer && customer.yetkililer[0] ? (
                        <div>
                          <div className="fw-medium" style={{ color: "#e2e8f0" }}>{customer.yetkililer[0].isim}</div>
                          <div className="d-flex align-items-center gap-1" style={{ fontSize: "11px", color: "#94a3b8" }}>
                            <i className="bi bi-envelope" style={{ fontSize: "10px", color: "#94a3b8" }}></i>
                            {customer.yetkililer[0].mail}
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
                        {customer.teklifAdedi} Teklif
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


      {/* DIŞARIYA ALINAN PENCERE BİLEŞENİ */}
      <AddPutMusteri
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        selectedCustomer={selectedCustomer}
        onSave={handleSaveCustomer}
      />
    </div>
  );
}

export default MusterilerPage;