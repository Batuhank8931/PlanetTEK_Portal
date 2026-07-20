// CalculationPage.jsx
import React, { useState, useEffect } from "react";
import ExcelGrid from "./FiyatlarComponents/ExcelGrid";
import CalculationChangeUpdateConfirmationModal from "./modals/CalculationChangeUpdateConfirmationModal";
import API from "../utils/utilRequest";
import AlertModal from "./modals/AlertModal"; // Yeni modalımız import edildi

function CalculationPage() {
  const [activeTableId, setActiveTableId] = useState(null);
  const [allParameters, setAllParameters] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Onay Modalı State Yönetimi
  const [showModal, setShowModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);

  // 🌟 Yeni AlertModal State Yönetimi
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
    showCancel: false, // İptal butonu olsun mu?
    action: null       // "Evet" denirse ne çalışsın?
  });

  const fetchParameters = async () => {
    try {
      setLoading(true);
      const response = await API.getParamteters();
      setAllParameters(response.data || []);
      setOriginalData(JSON.parse(JSON.stringify(response.data || [])));
    } catch (error) {
      console.error("Parametre verileri yüklenirken hata oldu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParameters();
  }, []);

  const handleAddNewRow = (matrixType) => {
    const timestamp = Date.now();
    let newRow = {};

    if (matrixType === "disk") {
      newRow = { id: `new_${timestamp}`, parametre_key: `MX_YENI_KEY`, parametre_adi: "Yeni Disk Tanımı", deger: 0, isNew: true };
    } else if (matrixType === "nitrifikasyon") {
      newRow = { id: `new_${timestamp}`, parametre_key: `nit_yeni`, parametre_adi: "Sıcaklık Koşulu", deger: 0, isNew: true };
    } else if (matrixType === "giderim") {
      newRow = { id: `new_${timestamp}`, parametre_key: `yeni_metrik`, parametre_adi: "Yeni Proses Metriği", deger: 0, isNew: true };
    }

    setAllParameters(prev => [...prev, newRow]);
  };

  const handleSaveClick = () => {
    const changes = [];

    allParameters.forEach((item) => {
      if (item.isDeleted) {
        if (String(item.id).startsWith("new_")) return;
        changes.push({
          type: "DELETE",
          id: item.id,
          columnName: "deger",
          newValue: null,
          rowName: item.parametre_adi,
          oldValue: item.deger
        });
        return;
      }

      if (String(item.id).startsWith("new_") || item.isNew) {
        changes.push({
          type: "INSERT",
          id: undefined,
          columnName: "deger",
          newValue: item.deger,
          rowName: item.parametre_key,
          additionalData: {
            parametre_key: item.parametre_key,
            parametre_adi: item.parametre_adi
          }
        });
        return;
      }

      const originalItem = originalData.find((o) => String(o.id) === String(item.id));
      if (originalItem) {
        ["parametre_adi", "deger"].forEach((field) => {
          let isSame = false;

          if (field === "parametre_adi") {
            isSame = String(originalItem[field] || "").trim() === String(item[field] || "").trim();
          } else {
            const origNum = Number(originalItem[field]) || 0;
            const currentNum = Number(item[field]) || 0;
            isSame = origNum === currentNum;
          }

          if (!isSame) {
            changes.push({
              type: "UPDATE",
              id: Number(originalItem.id),
              columnName: field,
              newValue: field === "parametre_adi" ? String(item[field]).trim() : (Number(item[field]) || 0),
              rowName: item.parametre_adi || originalItem.parametre_adi,
              oldValue: originalItem[field]
            });
          }
        });
      }
    });

    if (changes.length === 0) {
      // 🔄 MODERN UYARI MODALI TETİKLENDİ
      setAlertConfig({
        show: true,
        title: "Değişiklik Yok",
        message: "Herhangi bir değişiklik algılanmadı. Kaydetmek için önce hücreleri düzenleyin.",
        type: "warning",
        showCancel: false,
        action: null
      });
      return;
    }

    setPendingChanges(changes);
    setShowModal(true);
  };

  const handleConfirmSave = async () => {
    setShowModal(false);
    setLoading(true);
    try {
      await API.updateParametersData({ updates: pendingChanges });
      await fetchParameters();
      setPendingChanges([]);

      // ✅ BAŞARILI KAYIT BİLDİRİMİ
      setAlertConfig({
        show: true,
        title: "İşlem Tamamlandı",
        message: "Proses parametreleri başarıyla güncellendi.",
        type: "success",
        showCancel: false,
        action: null
      });
    } catch (error) {
      console.error("Parametreler güncellenirken teknik hata:", error);
      // ❌ HATA BİLDİRİMİ
      setAlertConfig({
        show: true,
        title: "Sistem Hatası",
        message: "Parametreler veritabanına kaydedilirken teknik bir sorun oluştu.",
        type: "error",
        showCancel: false,
        action: null
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  const activeParams = allParameters.filter(p => !p.isDeleted);
  const diskData = activeParams.filter(p => {
    const key = String(p?.parametre_key || "");
    return key.includes("MX_") || key.includes("MINI_") || key.startsWith("NEW_DISK_");
  });
  const nitData = activeParams.filter(p => String(p?.parametre_key || "").startsWith("nit_") || String(p?.parametre_key || "").startsWith("NEW_NIT_"));
  const reservedKeys = [...diskData, ...nitData].map(x => String(x.parametre_key || ""));
  const giderimData = activeParams.filter(p => !reservedKeys.includes(String(p?.parametre_key || "")) || String(p?.parametre_key || "").startsWith("NEW_GID_"));

  return (
    <div
      className="container-fluid pb-5 min-vh-100"
      style={{
        fontSize: "14px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#1a2d3a",
        paddingTop: window.innerWidth < 768 ? "75px" : "20px"
      }}
    >
      {/* ÜST BAŞLIK */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-3 border-bottom gap-3" style={{ borderColor: "#334155" }}>
        <div>
          <h5 className="mb-1 fw-semibold tracking-tight" style={{ color: "#cbd5e1" }}>
            <i className="bi bi-grid-3x3-gap me-2" style={{ color: "#00874e" }}></i>
            Proses Mühendisliği Parametre Matrisi
          </h5>
        </div>
        <button className="btn btn-success btn-sm px-4 fw-bold" onClick={handleSaveClick}>
          <i className="bi bi-file-earmark-excel me-2"></i>Değişiklikleri Kaydet
        </button>
      </div>

      {/* BAĞIMSIZ TABLOLAR DİZİLİMİ */}
      <div className="d-flex flex-column gap-4">

        {/* GRID 1: DİNAMİK DİSK SINIRLARI */}
        <div className="mb-2">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-bold text-uppercase d-flex align-items-center" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#38bdf8" }}>
              <i className="bi bi-disc-fill me-1.5"></i> 1. Dinamik Disk Sınırları Matrisi
            </div>
            <button className="btn btn-xs btn-outline-info py-0 px-2" style={{ fontSize: "11px" }} onClick={() => handleAddNewRow("disk")}>
              <i className="bi bi-plus"></i> Yeni Disk Seçeneği
            </button>
          </div>
          <ExcelGrid
            tableId="dinamikdisksinir"
            activeTableId={activeTableId}
            setActiveTableId={setActiveTableId}
            headers={["Sistem Anahtarı (Key)", "Parametre Tanımı", "Değer"]}
            fields={["parametre_key", "parametre_adi", "deger"]}
            data={diskData}
            isMainTable={true}
            onDataChange={(updateFn) => {
              setAllParameters(prev => {
                const updatedDiskData = typeof updateFn === 'function' ? updateFn(diskData) : updateFn;
                const otherData = prev.filter(p => {
                  const k = String(p?.parametre_key || "");
                  return !k.includes("MX_") && !k.includes("MINI_") && !k.startsWith("NEW_DISK_");
                });
                return [...otherData, ...updatedDiskData];
              });
            }}
          />
        </div>

        {/* GRID 2: DİNAMİK NİTRİFİKASYON KATSAYILARI */}
        <div className="mb-2">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-bold text-uppercase d-flex align-items-center" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#4ade80" }}>
              <i className="bi bi-thermometer-half me-1.5"></i> 2. Dinamik Nitrifikasyon Katsayıları
            </div>
            <button className="btn btn-xs btn-outline-success py-0 px-2" style={{ fontSize: "11px" }} onClick={() => handleAddNewRow("nitrifikasyon")}>
              <i className="bi bi-plus"></i> Yeni Koşul Ekle
            </button>
          </div>
          <ExcelGrid
            tableId="dinamiknitrifikasyon"
            activeTableId={activeTableId}
            setActiveTableId={setActiveTableId}
            headers={["Hesaplama Anahtarı (Key)", "Sıcaklık Koşulu", "Katsayı (Fi)"]}
            fields={["parametre_key", "parametre_adi", "deger"]}
            data={nitData}
            isMainTable={true}
            onDataChange={(updateFn) => {
              setAllParameters(prev => {
                const updatedNitData = typeof updateFn === 'function' ? updateFn(nitData) : updateFn;
                const otherData = prev.filter(p => !String(p?.parametre_key || "").startsWith("nit_") && !String(p?.parametre_key || "").startsWith("NEW_NIT_"));
                return [...otherData, ...updatedNitData];
              });
            }}
          />
        </div>

        {/* GRID 3: GİDERİM KABULLERİ */}
        <div className="mb-2">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-bold text-uppercase d-flex align-items-center" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#a855f7" }}>
              <i className="bi bi-clipboard-check me-1.5"></i> 3. Giderim Kabulleri ve Tasarım Metrikleri
            </div>
            <button className="btn btn-xs btn-outline-primary py-0 px-2" style={{ fontSize: "11px" }} onClick={() => handleAddNewRow("giderim")}>
              <i className="bi bi-plus"></i> Yeni Metrik Ekle
            </button>
          </div>
          <ExcelGrid
            tableId="giderimkabulleri"
            activeTableId={activeTableId}
            setActiveTableId={setActiveTableId}
            headers={["Parametre Anahtarı (Key)", "Parametre Adı", "Değer"]}
            fields={["parametre_key", "parametre_adi", "deger"]}
            data={giderimData}
            isMainTable={true}
            onDataChange={(updateFn) => {
              setAllParameters(prev => {
                const updatedGiderimData = typeof updateFn === 'function' ? updateFn(giderimData) : updateFn;
                const otherData = prev.filter(p => {
                  const k = String(p?.parametre_key || "");
                  return reservedKeys.includes(k) && !k.startsWith("NEW_GID_");
                });
                return [...otherData, ...updatedGiderimData];
              });
            }}
          />
        </div>

      </div>

      <CalculationChangeUpdateConfirmationModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmSave}
        changesList={pendingChanges}
      />

      {/* 🌟 PROJEDEKİ ALERT'LERİ SİLİP YERİNE KOYDUĞUMUZ YENİ NESİL MODAL */}
      <AlertModal
        show={alertConfig.show}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showCancel={alertConfig.showCancel} // State ne derse o (true/false)
        onConfirm={alertConfig.action}     // Varsa fonksiyon çalışır, yoksa pas geçer
        onClose={() => setAlertConfig(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}

export default CalculationPage;