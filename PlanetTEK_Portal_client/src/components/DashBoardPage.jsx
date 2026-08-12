import React, { useState, useEffect, useCallback } from "react";
import AlertModal from "./modals/AlertModal";
import UpdateStatusModal from "./modals/UpdateStatusModal";
import StatsCards from "./dashboard/StatsCards"; // 👈 YENİ
import FilterPanel from "./dashboard/FilterPanel"; // 👈 YENİ
import OffersTable from "./dashboard/OffersTable"; // 👈 YENİ
import API from "../utils/utilRequest";
import { useNavigate } from "react-router-dom";
import { useTeklifStore } from "../utils/teklifStore";

const INITIAL_FILTERS = {
  search: "",
  offer_number: "",
  offer_status: "",
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
  const navigate = useNavigate();
  const setFormData = useTeklifStore((state) => state.setFormData);
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);
  const setCurrentStepStore = useTeklifStore((state) => state.setCurrentStepStore);

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // İstatistik State'leri
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Pagination & Filtreleme
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modallar
  const [statusModalConfig, setStatusModalConfig] = useState({ show: false, offer: null });
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
    showCancel: false,
    action: null
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  // 📊 İSTATİSTİKLERİ ÇEKME
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const response = await API.getOfferStatsCount();
      const resData = response.data?.data || response.data || response;
      setStats(resData);
    } catch (err) {
      console.error("İstatistikler çekilirken hata:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // 🚀 LİSTE VERİSİNİ ÇEKME
  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const response = await API.getAllOffers({ page, limit, ...filters });
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

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOffers();
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchOffers]);

  // ✏️ TEKLİF DURUMUNU GÜNCELLEME
  const handleSaveStatus = async (offerId, newStatus) => {
    try {
      await API.updateOfferStatus(offerId, newStatus);
      setStatusModalConfig({ show: false, offer: null });
      fetchOffers();
      fetchStats(); // İstatistikleri de güncelle

      setAlertConfig({
        show: true,
        title: "Başarılı",
        message: "Teklif durumu başarıyla güncellendi.",
        type: "success"
      });
    } catch (error) {
      console.error("Durum güncelleme hatası:", error);
      setAlertConfig({
        show: true,
        title: "Hata",
        message: error.response?.data?.message || "Teklif durumu güncellenirken hata oluştu.",
        type: "danger"
      });
    }
  };

  // 📄 DOSYA İNDİRME
  const handleDownloadFile = async (offerNumber, fileType, customerId) => {
    try {
      const response = await API.getDocData(offerNumber, fileType, customerId);
      let fileName = null;
      const contentDisposition = response.headers?.["content-disposition"];

      if (contentDisposition) {
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        const standardMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
        if (utf8Match && utf8Match[1]) fileName = decodeURIComponent(utf8Match[1]);
        else if (standardMatch && standardMatch[1]) fileName = standardMatch[1];
      }

      if (!fileName) fileName = `${offerNumber.replace(/\s+/g, "_")}.${fileType}`;

      const blob = new Blob([response.data], {
        type: response.headers?.["content-type"] || "application/octet-stream"
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
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

  // 🎨 BADGE RENKLERİ
  const getStatusBadge = (status) => {
    const displayStatus = status || "Bilinmiyor";
    const lowerStatus = displayStatus.toLowerCase();

    let badgeClass = "bg-secondary text-white";
    let iconClass = "bi-question-circle";

    if (lowerStatus.includes("onay") || lowerStatus.includes("kazan")) {
      badgeClass = "bg-success text-white";
      iconClass = "bi-check-circle";
    } else if (lowerStatus.includes("bekle")) {
      badgeClass = "bg-warning text-dark";
      iconClass = "bi-clock";
    } else if (lowerStatus.includes("gönder") || lowerStatus.includes("gonder")) {
      badgeClass = "bg-info text-dark";
      iconClass = "bi-send";
    } else if (lowerStatus.includes("olumsuz") || lowerStatus.includes("iptal") || lowerStatus.includes("kayıp")) {
      badgeClass = "bg-danger text-white";
      iconClass = "bi-x-circle";
    } else if (lowerStatus.includes("reviz")) {
      badgeClass = "bg-primary text-white";
      iconClass = "bi-arrow-repeat";
    }

    return (
      <span className={`badge ${badgeClass} py-1 px-2 cursor-pointer shadow-sm`} style={{ cursor: "pointer" }}>
        <i className={`bi ${iconClass} me-1`}></i>
        {displayStatus}
      </span>
    );
  };

  const reviseOffer = async (full_form_data) => {
    try {
      const currentRev = full_form_data.customerInfo?.revizyonNo || full_form_data.revizyonNo || "R0";
      const currentTeklifNo = formData.customerInfo?.teklifNo;

      const currentNumber = parseInt(currentRev.replace(/\D/g, ""), 10);
      const nextRevNumber = isNaN(currentNumber) ? 1 : currentNumber + 1;
      const newRevizyonNo = `R${nextRevNumber}`;

      const unsetRes = await API.unSetOfferNumber(currentTeklifNo);

      if (unsetRes) {
        const res = await API.setOfferNumber();
        const fetchedNumber = res.data?.teklif_no || res.teklif_no;

        setFormData(full_form_data);
        updateSection("customerInfo", { revizyonNo: newRevizyonNo, teklifNo: fetchedNumber });
        setCurrentStepStore(1);
        navigate("/teklif");
      }
    } catch (error) {
      console.error("Revize işlemi hatası:", error);
    }
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
        <h6 className="mb-0 fw-semibold tracking-tight" style={{ color: "#94a3b8", fontSize: "14px" }}>
          <i className="bi bi-grid-1x2-fill me-2" style={{ color: "#00874e" }}></i> Satış Paneli & Teklif Yönetimi
        </h6>
      </div>

      {errorMsg && (
        <div className="alert alert-warning py-1 px-3 mb-2" role="alert" style={{ fontSize: "11px" }}>
          {errorMsg}
        </div>
      )}

      {/* 📊 1. İSTATİSTİK KARTLARI (Kırmızı Yanıp Sönen Uyarı Dahil) */}
      <StatsCards stats={stats} loading={loadingStats} />

      {/* 🔍 2. GELİŞMİŞ FİLTRELEME PANELİ */}
      <FilterPanel
        filters={filters}
        handleFilterChange={handleFilterChange}
        handleResetFilters={handleResetFilters}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
      />

      {/* 📋 3. TABLO VE PAGINATION */}
      <OffersTable
        offers={offers}
        loading={loading}
        totalRecords={totalRecords}
        limit={limit}
        setLimit={setLimit}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        getStatusBadge={getStatusBadge}
        setStatusModalConfig={setStatusModalConfig}
        reviseOffer={reviseOffer}
        handleDownloadFile={handleDownloadFile}
      />

      {/* MODALLAR */}
      <UpdateStatusModal
        show={statusModalConfig.show}
        offer={statusModalConfig.offer}
        onClose={() => setStatusModalConfig({ show: false, offer: null })}
        onSave={handleSaveStatus}
      />

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