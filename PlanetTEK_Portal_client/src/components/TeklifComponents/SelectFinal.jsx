import React, { useEffect, useState, useCallback } from "react";
import { useTeklifStore } from "../../utils/teklifStore";
import API from "../../utils/utilRequest";
import LoadingEkrani from "../modals/LoadingEkrani";

// Doğrulanması gereken zorunlu tabloların listesi
const REQUIRED_TABLES = [
  "parametretablosu",
  "enerjiisletmettablosu",
  "capextablosu",
  "sarfmalzemettablosu",
  "opextablosu",
  "enerjikarsilastirmatablosu",
  "karbonayakizitablosu",
  "onyillikmaliyettablosu",
  "amortisman",
  "bilgisayfasitablosu",
  "ozettablosu",
  "ekipantablosu",
  "kapaktablosu"
];

function SelectFinal() {
  const formData = useTeklifStore((state) => state.formData) || {};
  const customerInfo = formData.customerInfo || {};
  const updateSection = useTeklifStore((state) => state.updateSection);

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingFiles, setIsCheckingFiles] = useState(false);
  const [downloadingType, setDownloadingType] = useState(null); // 'pdf' | 'docx' | 'xlsx' | null

  // Sunucudaki mevcut dosya listesinin tutulduğu state
  const [existingFiles, setExistingFiles] = useState({
    docx: [],
    pdf: [],
    xlsx: []
  });

  const [modalInfo, setModalInfo] = useState({
    show: false,
    title: "",
    message: "",
    isError: false,
    missingItems: []
  });

  const debi = formData.q_debi || formData.debi || customerInfo.debi || "";

  // 🔍 Teklif Dosyalarını Getiren Fonksiyon
  const fetchTeklifFiles = useCallback(async (offerNumber, customerId) => {
    if (!offerNumber) return;
    setIsCheckingFiles(true);
    try {
      const response = await API.getTeklifData(offerNumber, customerId);
      if (response.data?.exists && response.data?.files) {
        setExistingFiles(response.data.files);
      } else {
        setExistingFiles({ docx: [], pdf: [], xlsx: [] });
      }
    } catch (error) {
      console.warn("Teklif dosyaları sorgulanırken klasör bulunamadı veya hata oluştu:", error);
      setExistingFiles({ docx: [], pdf: [], xlsx: [] });
    } finally {
      setIsCheckingFiles(false);
    }
  }, []);

  // Sayfa render olduğunda hem teslimat sürelerini hem de varsa teklif dosyalarını yükle
  useEffect(() => {
    const updatedDelivery = {
      "##delivery1##": customerInfo["##delivery1##"] ?? "1",
      "##delivery2##": customerInfo["##delivery2##"] ?? "8-10",
      "##delivery3##": customerInfo["##delivery3##"] ?? "3-4",
      "##delivery4##": customerInfo["##delivery4##"] ?? "1",
    };

    if (
      customerInfo["##delivery1##"] === undefined ||
      customerInfo["##delivery2##"] === undefined ||
      customerInfo["##delivery3##"] === undefined ||
      customerInfo["##delivery4##"] === undefined
    ) {
      updateSection("customerInfo", {
        ...customerInfo,
        ...updatedDelivery,
      });
    }

    if (customerInfo.offer_number) {
      fetchTeklifFiles(customerInfo.offer_number, customerInfo.customer_id);
    }
  }, [customerInfo.offer_number, customerInfo.customer_id, fetchTeklifFiles]);

  const handleDeliveryChange = (e) => {
    const { name, value } = e.target;
    updateSection("customerInfo", {
      ...customerInfo,
      [name]: value,
    });
  };

  const isNotEmpty = (val) => {
    if (val === undefined || val === null) return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === "object") return Object.keys(val).length > 0;
    return true;
  };

  const validateFormData = () => {
    const missingItems = [];

    if (!isNotEmpty(formData.equipments)) {
      missingItems.push("Ekipman Bilgileri (equipments)");
    }

    const tables = formData.tables || {};
    REQUIRED_TABLES.forEach((tableName) => {
      if (!isNotEmpty(tables[tableName])) {
        missingItems.push(`Tablo: ${tableName}`);
      }
    });

    return {
      isValid: missingItems.length === 0,
      missingItems
    };
  };

  // 1. Teklifi Oluştur İstek Handleri
  const handleCreateOffer = async () => {
    const { isValid, missingItems } = validateFormData();

    if (!isValid) {
      setModalInfo({
        show: true,
        title: "Eksik Form Verisi Uyarısı",
        message: "Teklif oluşturulmadan önce eksik veya hesaplanmamış modüller/tablolar tespit edildi. Lütfen ilgili adımları tamamlayınız.",
        isError: true,
        missingItems
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await API.sendFormData(formData);
      
      setModalInfo({
        show: true,
        title: "Başarılı",
        message: response.data?.message || "Teklif verisi başarıyla gönderildi ve dokümanlar oluşturuldu.",
        isError: false,
        missingItems: []
      });

      if (customerInfo.offer_number) {
        await fetchTeklifFiles(customerInfo.offer_number, customerInfo.customer_id);
      }
    } catch (error) {
      console.error("Teklif oluşturulurken hatayla karşılaşıldı:", error);
      const serverMessage = error?.response?.data?.message || error?.message || "Teklif oluşturulurken sunucu taraflı bir hata oluştu.";
      setModalInfo({
        show: true,
        title: "İşlem Başarısız",
        message: serverMessage,
        isError: true,
        missingItems: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 📄 2. Genel Dosya İndirme Handleri (PDF, WORD, EXCEL)
  const handleDownloadFile = async (fileType) => {
    const offerNumber = customerInfo.offer_number;
    const customerId = customerInfo.customer_id;

    if (!offerNumber) {
      setModalInfo({
        show: true,
        title: "Eksik Bilgi Uyarısı",
        message: "Teklif numarası (offer_number) bulunamadı. Lütfen önce teklif bilgilerini doldurunuz.",
        isError: true,
        missingItems: []
      });
      return;
    }

    setDownloadingType(fileType);
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

      if (!fileName) {
        const cleanFileName = offerNumber.replace(/\s+/g, "_");
        fileName = `${cleanFileName}.${fileType}`;
      }

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(`${fileType.toUpperCase()} dosyası indirilirken hata oluştu:`, error);
      setModalInfo({
        show: true,
        title: "İndirme Hatası",
        message: `${fileType.toUpperCase()} dokümanı indirilirken bir hata oluştu. Lütfen dosyanın oluşturulduğundan emin olun.`,
        isError: true,
        missingItems: []
      });
    } finally {
      setDownloadingType(null);
    }
  };

  const deliveryFields = [
    {
      key: "##delivery1##",
      label: "Yerleşim ve proses projelerinin hazırlanması",
      placeholder: "1",
    },
    {
      key: "##delivery2##",
      label: "Atıksu Arıtma Tesisi ekipman temin ve imali",
      placeholder: "8-10",
    },
    {
      key: "##delivery3##",
      label: "Borulama ve montaj işlerinin yapılması",
      placeholder: "3-4",
    },
    {
      key: "##delivery4##",
      label: "İşletmeye alma ve personel eğitimi işleri",
      placeholder: "1",
    },
  ];

  const hasAnyFile =
    existingFiles.docx.length > 0 ||
    existingFiles.pdf.length > 0 ||
    existingFiles.xlsx.length > 0;

  return (
    <div
      className="card border-0 text-white h-100 p-4 gap-3"
      style={{
        backgroundColor: "#1a1c1d",
        borderRadius: "5px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
      }}
    >
      {/* Yükleme Ekranı Animasyon Modalı */}
      <LoadingEkrani
        isGenerating={isLoading}
        generatingModuleName="Teklif Dokümanları"
        debi={debi}
        version="EQ-V10"
      />

      {/* Başlık Çizgisi */}
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center flex-grow-1">
          <span
            className="fw-bold text-uppercase pe-2"
            style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}
          >
            Teslimat Süreleri ve Teklif Onayı
          </span>
          <div
            className="flex-grow-1 border-bottom"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          ></div>
        </div>
        {isCheckingFiles && (
          <span className="badge bg-secondary ms-2" style={{ fontSize: "10px" }}>
            Dosyalar Kontrol Ediliyor...
          </span>
        )}
      </div>

      {/* Ana Gövde */}
      <div className="row g-4 align-items-stretch">
        {/* Sol Taraf: Teslimat Süreleri */}
        <div className="col-12 col-lg-7">
          <div className="d-flex flex-column gap-2">
            {deliveryFields.map((field) => (
              <div
                key={field.key}
                className="row align-items-center g-2 py-1 border-bottom border-secondary border-opacity-10"
              >
                <div className="col-8 col-sm-8">
                  <span className="small text-white-50" style={{ fontSize: "12px" }}>
                    {field.label}
                  </span>
                </div>
                <div className="col-4 col-sm-4">
                  <div className="input-group input-group-sm">
                    <input
                      type="text"
                      name={field.key}
                      value={customerInfo[field.key] ?? ""}
                      onChange={handleDeliveryChange}
                      className="form-control text-white fw-bold border-0 text-center py-1"
                      style={{
                        backgroundColor: "#1e293b",
                        fontSize: "12px",
                        color: "#38bdf8",
                        borderRadius: "4px 0 0 4px",
                      }}
                      placeholder={field.placeholder}
                    />
                    <span
                      className="input-group-text border-0 text-white-50 px-2"
                      style={{
                        backgroundColor: "#0f172a",
                        fontSize: "11px",
                        borderRadius: "0 4px 4px 0",
                      }}
                    >
                      Hafta
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sağ Taraf: Büyütülmüş Teklifi Oluştur Butonu */}
        <div className="col-12 col-lg-5 d-flex">
          <button
            onClick={handleCreateOffer}
            disabled={isLoading || downloadingType !== null}
            className="btn w-100 py-3 d-flex flex-column align-items-center justify-content-center gap-2 border-0 text-white fw-bold rounded-2 shadow-sm"
            style={{
              backgroundColor: "#00874e",
              minHeight: "140px",
              opacity: isLoading ? 0.7 : 1,
              transition: "all 0.2s ease-in-out"
            }}
          >
            {isLoading ? (
              <span
                className="spinner-border spinner-border-lg"
                role="status"
                aria-hidden="true"
              ></span>
            ) : (
              <i className="bi bi-check-circle-fill display-5"></i>
            )}
            <span style={{ fontSize: "15px", letterSpacing: "0.5px" }}>
              {isLoading ? "Teklif Hazırlanıyor..." : "Teklifi Oluştur"}
            </span>
          </button>
        </div>
      </div>

      {/* 📁 SUNUCUDAKİ HAZIRLANMIŞ DOSYALARIN LİSTESİ (ALT ALTA) */}
      <div className="mt-2 p-3 rounded" style={{ backgroundColor: "#111827" }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="fw-bold text-white-50" style={{ fontSize: "12px" }}>
            <i className="bi bi-folder-check text-success me-1"></i>
            Hazırlanmış Teklif Dokümanları {customerInfo.offer_number ? `(${customerInfo.offer_number})` : ""}
          </span>
          {customerInfo.offer_number && (
            <button
              onClick={() => fetchTeklifFiles(customerInfo.offer_number, customerInfo.customer_id)}
              disabled={isCheckingFiles}
              className="btn btn-sm btn-outline-secondary py-0 px-2"
              style={{ fontSize: "10px" }}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>Yenile
            </button>
          )}
        </div>

        {hasAnyFile ? (
          <div className="d-flex flex-column gap-2">
            {/* DOCX Dosyaları */}
            {existingFiles.docx.map((fileName, idx) => (
              <div
                key={`docx-${idx}`}
                className="d-flex align-items-center justify-content-between p-2.5 px-3 rounded border border-primary border-opacity-25 w-100"
                style={{ backgroundColor: "#1e293b" }}
              >
                <div className="d-flex align-items-center text-truncate me-2">
                  <i className="bi bi-file-earmark-word-fill text-primary fs-5 me-2"></i>
                  <span className="text-white text-truncate" style={{ fontSize: "12px" }} title={fileName}>
                    {fileName}
                  </span>
                </div>
                <button
                  onClick={() => handleDownloadFile("docx")}
                  disabled={downloadingType !== null}
                  className="btn btn-sm btn-primary py-1 px-3 text-nowrap"
                  style={{ fontSize: "11px" }}
                >
                  <i className="bi bi-download me-1"></i> İndir
                </button>
              </div>
            ))}

            {/* PDF Dosyaları */}
            {existingFiles.pdf.map((fileName, idx) => (
              <div
                key={`pdf-${idx}`}
                className="d-flex align-items-center justify-content-between p-2.5 px-3 rounded border border-danger border-opacity-25 w-100"
                style={{ backgroundColor: "#1e293b" }}
              >
                <div className="d-flex align-items-center text-truncate me-2">
                  <i className="bi bi-file-earmark-pdf-fill text-danger fs-5 me-2"></i>
                  <span className="text-white text-truncate" style={{ fontSize: "12px" }} title={fileName}>
                    {fileName}
                  </span>
                </div>
                <button
                  onClick={() => handleDownloadFile("pdf")}
                  disabled={downloadingType !== null}
                  className="btn btn-sm btn-danger py-1 px-3 text-nowrap"
                  style={{ fontSize: "11px" }}
                >
                  <i className="bi bi-download me-1"></i> İndir
                </button>
              </div>
            ))}

            {/* XLSX Dosyaları */}
            {existingFiles.xlsx.map((fileName, idx) => (
              <div
                key={`xlsx-${idx}`}
                className="d-flex align-items-center justify-content-between p-2.5 px-3 rounded border border-success border-opacity-25 w-100"
                style={{ backgroundColor: "#1e293b" }}
              >
                <div className="d-flex align-items-center text-truncate me-2">
                  <i className="bi bi-file-earmark-excel-fill text-success fs-5 me-2"></i>
                  <span className="text-white text-truncate" style={{ fontSize: "12px" }} title={fileName}>
                    {fileName}
                  </span>
                </div>
                <button
                  onClick={() => handleDownloadFile("xlsx")}
                  disabled={downloadingType !== null}
                  className="btn btn-sm btn-success py-1 px-3 text-nowrap"
                  style={{ fontSize: "11px" }}
                >
                  <i className="bi bi-download me-1"></i> İndir
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3 text-white-50" style={{ fontSize: "11px" }}>
            {customerInfo.offer_number
              ? "Bu teklif için henüz sunucuda oluşturulmuş dosya bulunamadı."
              : "Dosyaların listelenmesi için geçerli bir teklif numarası gereklidir."}
          </div>
        )}
      </div>

      {/* Alt Bilgi */}
      <div className="text-center pt-1">
        <p className="mb-0 text-white-50" style={{ fontSize: "11px" }}>
          "Teklifi Oluştur" butonuna basarak belgeleri sunucuda ürettirebilir, ardından aşağıdaki listeden indirebilirsiniz.
        </p>
      </div>

      {/* UYARI / BILGI MODALI */}
      {modalInfo.show && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1060 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content text-white border-0"
              style={{ backgroundColor: "#1e293b", borderRadius: "8px" }}
            >
              <div
                className={`modal-header border-bottom ${
                  modalInfo.isError ? "border-danger" : "border-secondary"
                }`}
              >
                <h5
                  className={`modal-title fs-6 fw-bold ${
                    modalInfo.isError ? "text-danger" : "text-info"
                  }`}
                >
                  <i
                    className={`bi me-2 ${
                      modalInfo.isError
                        ? "bi-exclamation-triangle-fill"
                        : "bi-info-circle-fill"
                    }`}
                  ></i>
                  {modalInfo.title}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setModalInfo({ ...modalInfo, show: false })}
                ></button>
              </div>
              <div className="modal-body py-3">
                <p className="mb-2 text-white-50 small">{modalInfo.message}</p>

                {modalInfo.missingItems.length > 0 && (
                  <div
                    className="p-2 rounded mt-2 border border-danger border-opacity-25"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      maxHeight: "150px",
                      overflowY: "auto",
                    }}
                  >
                    <span className="d-block fw-bold text-danger mb-1" style={{ fontSize: "11px" }}>
                      Tespit Edilen Eksik Nesneler:
                    </span>
                    <ul className="mb-0 ps-3 small text-white-50" style={{ fontSize: "11px" }}>
                      {modalInfo.missingItems.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top border-secondary py-2">
                <button
                  type="button"
                  className={`btn btn-sm px-3 ${
                    modalInfo.isError ? "btn-danger" : "btn-secondary"
                  }`}
                  onClick={() => setModalInfo({ ...modalInfo, show: false })}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SelectFinal;