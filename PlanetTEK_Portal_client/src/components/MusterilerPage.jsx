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
        backgroundColor: "#f4f6f8",
        // Mobilde navbar arkasında kalmasın diye 70px (veya navbar yüksekliğin kadar) boşluk, masaüstünde 0
        paddingTop: window.innerWidth < 768 ? "75px" : "20px"
      }}
    >
      {/* ÜST BAŞLIK - Mobilde alt alta, md ekranda yan yana */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-3 border-bottom gap-3" style={{ borderColor: "#dee2e6" }}>
        <div>
          <h5 className="mb-1 fw-semibold tracking-tight" style={{ color: "#1a1c1d" }}>
            <i className="bi bi-building me-2" style={{ color: "#00874e" }}></i>Müşteri Portföyü
          </h5>
          <p className="text-muted mb-0" style={{ fontSize: "12px" }}>Müşteri listesi, iletişim ve teklif takibi</p>
        </div>
        <button
          onClick={openAddPanel}
          className="btn text-white px-3 py-1.5 shadow-sm border-0 d-flex align-items-center fw-medium w-100 w-md-auto justify-content-center"
          style={{ backgroundColor: "#00874e", fontSize: "13px", borderRadius: "6px", transition: "all 0.2s" }}
        >
          <i className="bi bi-plus-lg me-1.5"></i> Yeni Müşteri Ekle
        </button>
      </div>

      {/* FİLTRELEME ALANI */}
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: "8px" }}>
        <div className="card-body p-3 bg-white" style={{ borderRadius: "8px" }}>
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0 text-muted" style={{ borderColor: "#dcdfe4" }}>
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-white border-start-0"
                  style={{ borderColor: "#dcdfe4", fontSize: "13px" }}
                  placeholder="Ticari ünvan, ülke veya satışçı ara..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>
            <div className="col-12 col-md-3">
              <select
                className="form-select form-select-sm bg-white"
                style={{ borderColor: "#dcdfe4", fontSize: "13px" }}
                value={menseiFilter}
                onChange={(e) => { setMenseiFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="Hepsi">Menşei: Tümü</option>
                <option value="Yerli">Yerli Firmalar</option>
                <option value="Yabancı">Yabancı Firmalar</option>
              </select>
            </div>
            <div className="col-12 col-md-4 d-flex align-items-center text-muted justify-content-start justify-content-md-end mt-2 mt-md-0" style={{ fontSize: "12px" }}>
              Toplam: <span className="fw-semibold ms-1" style={{ color: "#1a1c1d" }}>{filteredCustomers.length} Müşteri</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABLO */}
      <div className="card shadow-sm border-0 bg-white" style={{ borderRadius: "8px", overflow: "hidden" }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px", minWidth: "800px" }}>
            <thead className="text-secondary border-bottom" style={{ backgroundColor: "#f8f9fa", fontSize: "11px", letterSpacing: "0.5px", borderColor: "#dee2e6" }}>
              <tr>
                <th className="py-3 px-4 fw-semibold text-uppercase">Firma / Menşei</th>
                <th className="py-3 fw-semibold text-uppercase">Vergi Bilgileri</th>
                <th className="py-3 fw-semibold text-uppercase">Primary Yetkili Kişi</th>
                <th className="py-3 fw-semibold text-uppercase text-center">Teklif Durumu</th>
                <th className="py-3 fw-semibold text-uppercase">Sorumlu Satışçı</th>
                <th className="py-3 fw-semibold text-uppercase text-end px-4">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {displayedCustomers.length > 0 ? (
                displayedCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-4 py-3">
                      <div className="fw-semibold" style={{ color: "#1a1c1d" }}>{customer.ticariUnvan}</div>
                      <div className="d-flex align-items-center mt-1 gap-2" style={{ fontSize: "11px" }}>
                        <span
                          className="badge px-2 py-0.5 fw-medium"
                          style={customer.mensei === "Yerli"
                            ? { backgroundColor: "rgba(0, 135, 78, 0.1)", color: "#00874e" }
                            : { backgroundColor: "rgba(255, 193, 7, 0.15)", color: "#9a6e00" }
                          }
                        >
                          {customer.mensei}
                        </span>
                        <span className="text-muted"><i className="bi bi-geo-alt me-1"></i>{customer.ulke}</span>
                      </div>
                    </td>
                    <td>
                      <div className="fw-medium" style={{ color: "#2d3133" }}>{customer.vergiDairesi}</div>
                      <div className="text-muted" style={{ fontSize: "11px" }}>No: {customer.vergiNo}</div>
                    </td>
                    <td>
                      {customer.yetkililer && customer.yetkililer[0] ? (
                        <div>
                          <div className="fw-medium" style={{ color: "#2d3133" }}>{customer.yetkililer[0].isim}</div>
                          <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: "11px" }}>
                            <i className="bi bi-envelope text-muted" style={{ fontSize: "10px" }}></i>
                            {customer.yetkililer[0].mail}
                            {customer.yetkililer.length > 1 && (
                              <span className="badge bg-light text-secondary border px-1.5 py-0.5 fw-normal" style={{ fontSize: "9px", borderColor: "#dee2e6" }}>
                                +{customer.yetkililer.length - 1} Diğer
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-danger-emphasis bg-danger-subtle px-2 py-0.5 rounded fw-medium" style={{ fontSize: "11px" }}>Atanmadı</span>
                      )}
                    </td>
                    <td className="text-center">
                      <span
                        className="badge px-2.5 py-1 fw-medium"
                        style={customer.teklifAdedi > 0
                          ? { backgroundColor: "rgba(26, 28, 29, 0.05)", color: "#1a1c1d", border: "1px solid rgba(26, 28, 29, 0.1)" }
                          : { backgroundColor: "transparent", color: "#adb5bd", border: "1px dashed #dee2e6" }
                        }
                      >
                        {customer.teklifAdedi} Teklif
                      </span>
                      {customer.teklifAdedi > 0 && (
                        <div className="text-muted mt-1 text-truncate mx-auto" style={{ maxWidth: "150px", fontSize: "11px" }}>
                          {customer.teklifDetay}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border px-2 py-1 fw-normal" style={{ borderColor: "#dee2e6" }}>
                        <i className="bi bi-person me-1" style={{ color: "#00874e" }}></i>{customer.yetkiliSatisci || "Atanmadı"}
                      </span>
                    </td>
                    <td className="text-end px-4">
                      <div className="d-inline-flex gap-1">
                        <button
                          onClick={() => openEditPanel(customer)}
                          className="btn btn-sm btn-link text-secondary p-1 text-decoration-none"
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
                  <td colSpan="6" className="text-center py-5 text-muted" style={{ fontSize: "13px" }}>Kayıt bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION - Mobilde ortalandı veya dikey esnetildi */}
      {totalPages > 1 && (
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3 px-1 gap-2" style={{ fontSize: "12px" }}>
          <div className="text-muted text-center text-sm-start">Toplam {totalPages} sayfadan {currentPage}. sayfadasınız.</div>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link border-0 bg-transparent text-dark px-2"
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
                      : { color: "#1a1c1d", backgroundColor: "transparent", width: "24px", height: "24px", padding: 0 }
                    }
                    onClick={() => setCurrentPage(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button
                  className="page-link border-0 bg-transparent text-dark px-2"
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