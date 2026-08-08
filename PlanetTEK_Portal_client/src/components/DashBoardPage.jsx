import React, { useState, useMemo, useEffect, useCallback } from "react";
import AlertModal from "./modals/AlertModal";
import API from "../utils/utilRequest";

const INITIAL_FILTERS = {
  search: "",
  offer_number: "",
  offer_status: "", // 🆕 Teklif Durumu Filtresi Eklendi
  teklif_no: "",
  ticari_unvan: "",
  hazirlayan_kullanici: "",
  currency: "",
  atiksutype: "",
  hesap_yontemi: "",
  unit_model_type: "",
  teklif_dili: "",
  min_debi: "",
  max_debi: "",
  min_boi: "",
  max_boi: "",
  startDate: "",
  endDate: ""
};

function DashBoardPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Pagination & Filtreleme State'leri
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Tüm filtre parametrelerini tek bir nesnede topluyoruz
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modal State'leri
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [actionType, setActionType] = useState("Süre Uzatımı");
  const [actionNote, setActionNote] = useState("");

  const [alertConfig, setAlertConfig] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
    showCancel: false,
    action: null
  });

  // Filtre input değişim handler'ı
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Filtre değiştiğinde 1. sayfaya dön
  };

  // Tüm filtreleri sıfırlama
  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  // 🚀 SUNUCUDAN VERİ ÇEKME (Tüm filtre parametreleri ile)
  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const response = await API.getAllOffers({
        page,
        limit,
        ...filters
      });

      const resData = response.data || response;
      setOffers(resData.data || []);
      if (resData.pagination) {
        setTotalPages(resData.pagination.totalPages);
        setTotalRecords(resData.pagination.total);
      }
    } catch (err) {
      console.error("Teklifler çekilirken hata:", err);
      setErrorMsg("Teklifler yüklenemedi. Oturum doğrulanıyor veya sunucu hatası olabilir.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  // Filtreler veya sayfa değiştiğinde istek at (Debounce ile)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOffers();
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchOffers]);

  // 📄 DOSYA İNDİRME AKSİYONU (Sunucudan Gelen Orijinal Dosya Adı İle)
  const handleDownloadFile = async (offerNumber, fileType, customerId) => {
    try {
      const response = await API.getDocData(offerNumber, fileType, customerId);

      let fileName = null;
      const contentDisposition = response.headers?.["content-disposition"];

      if (contentDisposition) {
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        const standardMatch = contentDisposition.match(/filename="?([^";]+)"?/i);

        if (utf8Match && utf8Match[1]) {
          fileName = decodeURIComponent(utf8Match[1]);
        } else if (standardMatch && standardMatch[1]) {
          fileName = standardMatch[1];
        }
      }

      // Eğer sunucu header'ından dosya adı alınamazsa fallback olarak teklif nosunu kullanır
      if (!fileName) {
        const cleanFileName = offerNumber.replace(/\s+/g, "_");
        fileName = `${cleanFileName}.${fileType}`;
      }

      const blob = new Blob([response.data], {
        type: response.headers?.["content-type"] || "application/octet-stream"
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      // Sunucudan alınan dinamik dosya adı buraya atanır:
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Dosya indirme hatası:", err);
      setAlertConfig({
        show: true,
        title: "Hata",
        message: `.${fileType.toUpperCase()} belgesi indirilemedi.`,
        type: "danger"
      });
    }
  };

  // OTO SÜRE KONTROLÜ (30 Gün Geçenleri Ayıklama)
  const { suresiDolmusTeklifler } = useMemo(() => {
    const bugun = new Date();
    const dolmus = [];

    offers.forEach((o) => {
      const teklifTarihi = new Date(o.created_at);
      const farkZaman = bugun.getTime() - teklifTarihi.getTime();
      const farkGun = Math.ceil(farkZaman / (1000 * 60 * 60 * 24));

      if (farkGun > 30) {
        dolmus.push({ ...o, gecenGun: farkGun });
      }
    });

    return { suresiDolmusTeklifler: dolmus };
  }, [offers]);

  // METRİK HESAPLAMALARI
  const metrikler = useMemo(() => {
    const toplamTeklif = totalRecords;
    const toplamTasarimKapasitesi = offers.reduce(
      (acc, curr) => acc + (parseFloat(curr.debi) || parseFloat(curr.parsed_debi) || 0),
      0
    );

    return { toplamTeklif, toplamTasarimKapasitesi };
  }, [offers, totalRecords]);

  // 🎨 Teklif Durumuna Göre Badge (Etiket) Rengi Döndüren Yardımcı Fonksiyon
  const getStatusBadge = (status) => {
    if (!status) return <span className="badge bg-secondary py-1 px-2">Bilinmiyor</span>;

    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("onay") || lowerStatus.includes("kazan")) {
      return <span className="badge bg-success text-white py-1 px-2"><i className="bi bi-check-circle me-1"></i>{status}</span>;
    }
    if (lowerStatus.includes("bekle")) {
      return <span className="badge bg-warning text-dark py-1 px-2"><i className="bi bi-clock me-1"></i>{status}</span>;
    }
    if (lowerStatus.includes("gönder") || lowerStatus.includes("gonder")) {
      return <span className="badge bg-info text-dark py-1 px-2"><i className="bi bi-send me-1"></i>{status}</span>;
    }
    if (lowerStatus.includes("olumsuz") || lowerStatus.includes("iptal") || lowerStatus.includes("kayıp")) {
      return <span className="badge bg-danger text-white py-1 px-2"><i className="bi bi-x-circle me-1"></i>{status}</span>;
    }
    if (lowerStatus.includes("reviz")) {
      return <span className="badge bg-primary text-white py-1 px-2"><i className="bi bi-arrow-repeat me-1"></i>{status}</span>;
    }

    return <span className="badge bg-secondary text-white py-1 px-2">{status}</span>;
  };

  const handleSaveAction = () => {
    if (!actionNote.trim()) {
      setAlertConfig({
        show: true,
        title: "Uyarı",
        message: "Lütfen gerekli bilgi notunu doldurunuz.",
        type: "warning"
      });
      return;
    }

    setAlertConfig({
      show: true,
      title: "Başarılı",
      message: "Aksiyon kaydı oluşturuldu.",
      type: "success"
    });

    setSelectedOffer(null);
    setActionNote("");
  };

  return (
    <div
      className="container-fluid pb-4 min-vh-100 text-white"
      style={{
        fontSize: "11.5px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#1a2d3a",
        paddingTop: window.innerWidth < 768 ? "75px" : "15px"
      }}
    >
      {/* ÜST BAŞLIK */}
      <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div>
          <h6 className="mb-0 fw-semibold tracking-tight" style={{ color: "#94a3b8", fontSize: "14px" }}>
            <i className="bi bi-grid-1x2-fill me-2" style={{ color: "#00874e" }}></i> Satış Paneli & Teklif Yönetimi
          </h6>
        </div>
      </div>

      {errorMsg && (
        <div className="alert alert-warning py-1 px-3 mb-2" role="alert" style={{ fontSize: "11px" }}>
          {errorMsg}
        </div>
      )}

      {/* KRİTİK UYARI PANELİ */}
      {suresiDolmusTeklifler.length > 0 && (
        <div className="p-2 rounded mb-3 animate__animated animate__fadeIn" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444" }}>
          <div className="d-flex align-items-center gap-2 mb-2 text-danger fw-bold" style={{ fontSize: "11.5px" }}>
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>DİKKAT: Takip Süresi Dolan ({suresiDolmusTeklifler.length}) Adet Teklif Bulunuyor!</span>
          </div>
          <div className="row g-2">
            {suresiDolmusTeklifler.map((t) => (
              <div key={t.id} className="col-md-6 col-12">
                <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1f2937", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                  <div>
                    <span className="fw-bold text-danger" style={{ fontSize: "11px" }}>{t.offer_number || t.teklif_no}</span>
                    <span className="text-white-50 ms-2" style={{ fontSize: "10.5px" }}>{t.ticari_unvan || "Bilinmeyen Müşteri"}</span>
                    <div className="text-white-50" style={{ fontSize: "10px" }}>Tarih: {new Date(t.created_at).toLocaleDateString("tr-TR")} - <span className="text-warning">{t.gecenGun} gündür yanıt bekleniyor</span></div>
                  </div>
                  <button
                    className="btn btn-sm btn-danger fw-bold px-2 py-0"
                    style={{ fontSize: "10px", height: "22px" }}
                    onClick={() => setSelectedOffer(t)}
                  >
                    Aksiyon Al
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GELİŞMİŞ ÇOKLU FİLTRELEME VE ARAMA PANELİ */}
      <div className="p-3 rounded mb-3" style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="fw-bold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#00874e" }}>
            <i className="bi bi-funnel-fill me-1"></i> Gelişmiş Çoklu Süzme & Arama Panel
          </span>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-light py-0 px-2"
              style={{ fontSize: "10.5px" }}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <i className={`bi bi-${showAdvancedFilters ? "chevron-up" : "sliders"} me-1`}></i>
              {showAdvancedFilters ? "Detaylı Filtreleri Gizle" : "Tüm Kolon Filtrelerini Aç"}
            </button>
            <button
              className="btn btn-sm btn-outline-warning py-0 px-2"
              style={{ fontSize: "10.5px" }}
              onClick={handleResetFilters}
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i> Sıfırla
            </button>
          </div>
        </div>

        {/* Hızlı Arama Satırı */}
        <div className="row g-2 mb-2">
          <div className="col-md-3 col-12">
            <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Genel Arama (Hepsinde)</label>
            <input
              type="text"
              className="form-control form-control-sm text-white border-0 custom-dark-input"
              style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "11px" }}
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Teklif No, Müşteri, Durum..."
            />
          </div>
          <div className="col-md-2 col-6">
            <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Teklif Durumu</label>
            <select
              className="form-select form-select-sm bg-dark text-white border-0"
              style={{ height: "28px", fontSize: "11px" }}
              value={filters.offer_status}
              onChange={(e) => handleFilterChange("offer_status", e.target.value)}
            >
              <option value="">Tüm Durumlar</option>
              <option value="beklemede">Beklemede</option>
              <option value="gönderildi">Gönderildi</option>
              <option value="onaylandı">Onaylandı</option>
              <option value="olumsuz">Olumsuz</option>
              <option value="revize edildi">Revize Edildi</option>
            </select>
          </div>
          <div className="col-md-2 col-6">
            <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Teklif No / Kodu</label>
            <input
              type="text"
              className="form-control form-control-sm text-white border-0 custom-dark-input"
              style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "11px" }}
              value={filters.offer_number}
              onChange={(e) => handleFilterChange("offer_number", e.target.value)}
              placeholder="Örn: PLN R0..."
            />
          </div>
          <div className="col-md-3 col-6">
            <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Ticari Ünvan</label>
            <input
              type="text"
              className="form-control form-control-sm text-white border-0 custom-dark-input"
              style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "11px" }}
              value={filters.ticari_unvan}
              onChange={(e) => handleFilterChange("ticari_unvan", e.target.value)}
              placeholder="Firma adı..."
            />
          </div>
          <div className="col-md-2 col-6">
            <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Hazırlayan Kullanıcı</label>
            <input
              type="text"
              className="form-control form-control-sm text-white border-0 custom-dark-input"
              style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "11px" }}
              value={filters.hazirlayan_kullanici}
              onChange={(e) => handleFilterChange("hazirlayan_kullanici", e.target.value)}
              placeholder="İsim soyisim..."
            />
          </div>
        </div>

        {/* Detaylı Filtre Seçenekleri Panel (Açılır/Kapanır) */}
        {showAdvancedFilters && (
          <div className="pt-2 mt-2 border-top border-secondary animate__animated animate__fadeIn">
            <div className="row g-2">
              {/* Tarih Aralığı */}
              <div className="col-md-3 col-6">
                <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Başlangıç Tarihi</label>
                <input
                  type="date"
                  className="form-control form-control-sm text-white border-0 text-center"
                  style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "10.5px" }}
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                />
              </div>
              <div className="col-md-3 col-6">
                <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Bitiş Tarihi</label>
                <input
                  type="date"
                  className="form-control form-control-sm text-white border-0 text-center"
                  style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "10.5px" }}
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                />
              </div>

              {/* Debi Aralığı */}
              <div className="col-md-3 col-6">
                <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Min Debi (m³/g)</label>
                <input
                  type="number"
                  className="form-control form-control-sm text-white border-0 text-center custom-dark-input"
                  style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "11px" }}
                  value={filters.min_debi}
                  onChange={(e) => handleFilterChange("min_debi", e.target.value)}
                  placeholder="Min"
                />
              </div>
              <div className="col-md-3 col-6">
                <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Max Debi (m³/g)</label>
                <input
                  type="number"
                  className="form-control form-control-sm text-white border-0 text-center custom-dark-input"
                  style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "11px" }}
                  value={filters.max_debi}
                  onChange={(e) => handleFilterChange("max_debi", e.target.value)}
                  placeholder="Max"
                />
              </div>

              {/* Atıksu & Hesap Yöntemi & Model */}
              <div className="col-md-2 col-6">
                <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Atıksu Tipi</label>
                <select
                  className="form-select form-select-sm bg-dark text-white border-0"
                  style={{ height: "28px", fontSize: "11px" }}
                  value={filters.atiksutype}
                  onChange={(e) => handleFilterChange("atiksutype", e.target.value)}
                >
                  <option value="">Tümü</option>
                  <option value="Evsel">Evsel</option>
                  <option value="Endüstriyel">Endüstriyel</option>
                </select>
              </div>

              <div className="col-md-2 col-6">
                <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Hesap Yöntemi</label>
                <select
                  className="form-select form-select-sm bg-dark text-white border-0"
                  style={{ height: "28px", fontSize: "11px" }}
                  value={filters.hesap_yontemi}
                  onChange={(e) => handleFilterChange("hesap_yontemi", e.target.value)}
                >
                  <option value="">Tümü</option>
                  <option value="Hidrolik">Hidrolik</option>
                  <option value="Kişi">Kişi</option>
                </select>
              </div>

              <div className="col-md-2 col-6">
                <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Ünite Model Tipi</label>
                <select
                  className="form-select form-select-sm bg-dark text-white border-0"
                  style={{ height: "28px", fontSize: "11px" }}
                  value={filters.unit_model_type}
                  onChange={(e) => handleFilterChange("unit_model_type", e.target.value)}
                >
                  <option value="">Tümü</option>
                  <option value="MX 1">MX 1</option>
                  <option value="MINI">MINI</option>
                </select>
              </div>
              <div className="col-md-2 col-6">
                <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Para Birimi</label>
                <select
                  className="form-select form-select-sm bg-dark text-white border-0"
                  style={{ height: "28px", fontSize: "11px" }}
                  value={filters.currency}
                  onChange={(e) => handleFilterChange("currency", e.target.value)}
                >
                  <option value="">Tümü</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="TRY">TRY (₺)</option>
                </select>
              </div>

              {/* 🆕 Teklif Dili (DROPDOWN) */}
              <div className="col-md-2 col-6">
                <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Teklif Dili</label>
                <select
                  className="form-select form-select-sm bg-dark text-white border-0"
                  style={{ height: "28px", fontSize: "11px" }}
                  value={filters.teklif_dili}
                  onChange={(e) => handleFilterChange("teklif_dili", e.target.value)}
                >
                  <option value="">Tüm Diller</option>
                  <option value="Yerli">Yerli (TR)</option>
                  <option value="Yabancı">Yabancı (EN)</option>
                </select>
              </div>

              {/* BOİ Değerleri */}
              <div className="col-md-1 col-3">
                <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Min BOİ</label>
                <input
                  type="number"
                  className="form-control form-control-sm text-white border-0 text-center custom-dark-input"
                  style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "11px" }}
                  value={filters.min_boi}
                  onChange={(e) => handleFilterChange("min_boi", e.target.value)}
                  placeholder="Giriş"
                />
              </div>
              <div className="col-md-1 col-3">
                <label className="form-label mb-0 text-white-50" style={{ fontSize: "10px" }}>Max BOİ</label>
                <input
                  type="number"
                  className="form-control form-control-sm text-white border-0 text-center custom-dark-input"
                  style={{ backgroundColor: "#1e293b", height: "28px", fontSize: "11px" }}
                  value={filters.max_boi}
                  onChange={(e) => handleFilterChange("max_boi", e.target.value)}
                  placeholder="Çıkış"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DENSE / KOMPAKT MÜHENDİSLİK VERİ TABLOSU */}
      <div className="p-2 rounded" style={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}>
        <div className="d-flex justify-content-between align-items-center mb-2 px-1">
          <span className="fw-semibold" style={{ fontSize: "11px" }}>
            Teklif Listesi ({totalRecords} Kayıt Bulundu) {loading && <span className="ms-2 text-warning spinner-border spinner-border-sm" role="status"></span>}
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

        {/* Tablo Konteyneri (Yatay Kaydırma Destekli) */}
        <div className="table-responsive">
          <table className="table table-dark table-hover table-striped table-bordered align-middle text-nowrap mb-0" style={{ fontSize: "11px" }}>
            <thead>
              <tr className="table-active text-uppercase" style={{ fontSize: "10px", color: "#9ca3af", letterSpacing: "0.3px" }}>
                <th style={{ width: "40px" }}>#ID</th>
                <th>Teklif Kodu / No</th>
                <th className="text-center">Durum</th>
                <th>Tarih</th>
                <th>Ticari Ünvan</th>
                <th>İlgili Kişi</th>
                <th>Hazırlayan</th>
                <th className="text-center">Debi (m³/g)</th>
                <th className="text-center">Atıksu Tipi</th>
                <th className="text-center">Hesap Yöntemi</th>
                <th className="text-center">Model Tipi</th>
                {/* 🛠️ AYRILAN KOLONLAR */}
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
                  <td colSpan="16" className="text-center text-white-50 py-4">
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
                    <td className="text-center">
                      {getStatusBadge(teklif.offer_status)}
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

                    {/* 🛠️ AYRILAN HÜCRELER */}
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

        {/* PAGINATION PANELİ */}
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

      {/* AKSİYON MODALİ */}
      {selectedOffer && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1050 }}>
          <div className="p-3 rounded w-100 shadow" style={{ maxWidth: "450px", backgroundColor: "#1f2937", border: "1px solid #ef4444" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0 fw-bold text-danger" style={{ fontSize: "12px" }}>
                <i className="bi bi-lightning-charge-fill me-1"></i> Teklif Aksiyonu
              </h6>
              <button className="btn-close btn-close-white btn-sm" onClick={() => setSelectedOffer(null)}></button>
            </div>

            <p className="text-white-50 mb-2" style={{ fontSize: "11px" }}>
              <strong>{selectedOffer.ticari_unvan}</strong> firmasına ait <strong>{selectedOffer.offer_number || selectedOffer.teklif_no}</strong> teklifinin süresi aşılmıştır.
            </p>

            <div className="mb-2">
              <label className="form-label text-white-50 mb-1" style={{ fontSize: "10.5px" }}>Aksiyon Tipi *</label>
              <select
                className="form-select form-select-sm bg-dark text-white border-secondary py-1"
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                style={{ fontSize: "11px" }}
              >
                <option value="Süre Uzatımı">Süre Uzatımı (Teklifi 30 gün daha canlı tut)</option>
                <option value="Revize">Revize Teklif (Yeniden tasarıma/fiyatlandırmaya gönder)</option>
                <option value="Teklif İptal">Teklif İptal (Projeyi olumsuz kapat)</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label text-white-50 mb-1" style={{ fontSize: "10.5px" }}>Not / Açıklama *</label>
              <textarea
                className="form-control bg-dark text-white border-secondary p-1"
                rows="2"
                style={{ fontSize: "11px" }}
                placeholder="Aksiyon nedeni..."
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
              ></textarea>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-sm btn-secondary py-0" onClick={() => setSelectedOffer(null)} style={{ fontSize: "11px" }}>Kapat</button>
              <button className="btn btn-sm btn-danger fw-bold py-0" onClick={handleSaveAction} style={{ fontSize: "11px" }}>Aksiyonu Kaydet</button>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        show={alertConfig.show}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showCancel={alertConfig.showCancel}
        onConfirm={alertConfig.action}
        onClose={() => setAlertConfig((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}

export default DashBoardPage;