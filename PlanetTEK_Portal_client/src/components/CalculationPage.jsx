import React, { useState, useEffect } from "react";
import ExcelGrid from "./FiyatlarComponents/ExcelGrid";
import CalculationChangeUpdateConfirmationModal from "./modals/CalculationChangeUpdateConfirmationModal";
import API from "../utils/utilRequest";

function CalculationPage() {
  const [allParameters, setAllParameters] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Onay Modalı State Yönetimi
  const [showModal, setShowModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);

  // 🔍 Verileri DB'den Getirme Fonksiyonu
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

  // ➕ Yeni Satır Ekleme Motoru
  const handleAddNewRow = (matrixType) => {
    const timestamp = Date.now();
    let newRow = {};

    if (matrixType === "disk") {
      newRow = { id: `new_${timestamp}`, parametre_key: `MX_YENI_KEY`, parametre_adi: "Yeni Disk Tanımı", deger: 0, isNew: true };
    } else if (matrixType === "nitrifikasyon") {
      newRow = { id: `new_${timestamp}`, parametre_key: `nit_yeni`, parametre_adi: "Sıcaklık Koşulu", deger: 0, isNew: true };
    } else if (matrixType === "giderim") {
      newRow = { id: `new_${timestamp}`, parametre_key: `yeni_metrik`, parametre_adi: "Yeni Proses Metriği", deger: 0, isNew: true };
    } else if (matrixType === "lamelle") {
      newRow = { id: `new_${timestamp}`, parametre_key: `LS_YENI_hacim`, parametre_adi: "Yeni Lamelle Özelliği", deger: 0, isNew: true };
    }

    setAllParameters(prev => [...prev, newRow]);
  };

  // 🛠️ Değişiklik Değerlendirme ve Onay Modalı Tetikleyicisi
  // 🛠️ Değişiklik Değerlendirme ve Onay Modalı Tetikleyicisi
  const handleSaveClick = () => {
    const changes = [];

    allParameters.forEach((item) => {
      // ❌ DURUM 1: SİLME (DELETE)
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

      // ➕ DURUM 2: INSERT (Yeni Parametre Ekleme)
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

      // 🔄 DURUM 3: UPDATE (Mevcut Hücre Güncelleme)
      const originalItem = originalData.find((o) => String(o.id) === String(item.id));
      if (originalItem) {
        ["parametre_adi", "deger"].forEach((field) => {
          let isSame = false;

          if (field === "parametre_adi") {
            isSame = String(originalItem[field] || "").trim() === String(item[field] || "").trim();
          } else {
            // İki tarafın da sayısal değerini güvenli bir şekilde karşılaştırıyoruz
            const origNum = Number(originalItem[field]) || 0;
            const currentNum = Number(item[field]) || 0;
            isSame = origNum === currentNum;
          }

          if (!isSame) {
            changes.push({
              type: "UPDATE",
              id: Number(originalItem.id), // ID'nin sayısal olduğundan emin oluyoruz
              columnName: field, // "deger" veya "parametre_adi" gidiyor
              newValue: field === "parametre_adi" ? String(item[field]).trim() : (Number(item[field]) || 0),
              rowName: item.parametre_adi || originalItem.parametre_adi,
              oldValue: originalItem[field]
            });
          }
        });
      }
    });

    // 🔍 DEBUG: Payload'u console'da görerek backend'e ne gittiğini izleyebilirsin

    if (changes.length === 0) {
      alert("Herhangi bir değişiklik algılanmadı.");
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
    } catch (error) {
      console.error("Parametreler güncellenirken teknik hata:", error);
      alert("Kaydedilirken bir hata oluştu.");
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

  // 🛡️ GÜVENLİ TİP KORUMALI FİLTRELEME MOTORU (String dönüşümleri garanti edildi)
  const activeParams = allParameters.filter(p => !p.isDeleted);

  const diskData = activeParams.filter(p => {
    const key = String(p?.parametre_key || "");
    return key.includes("MX_") || key.includes("MINI_") || key.startsWith("NEW_DISK_");
  });

  const nitData = activeParams.filter(p => String(p?.parametre_key || "").startsWith("nit_") || String(p?.parametre_key || "").startsWith("NEW_NIT_"));
  const lamelleData = activeParams.filter(p => String(p?.parametre_key || "").startsWith("LS_") || String(p?.parametre_key || "").startsWith("NEW_LAM_"));

  const reservedKeys = [...diskData, ...nitData, ...lamelleData].map(x => String(x.parametre_key || ""));
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

        {/* GRID 4: LAMELLE (LS) MATRİSİ */}
        <div className="mb-2">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-bold text-uppercase d-flex align-items-center" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#22c55e" }}>
              <i className="bi bi-layers-half me-1.5"></i> 4. Lamelle (LS) Hacim ve Alan Matrisi
            </div>
            <button className="btn btn-xs btn-outline-success py-0 px-2" style={{ fontSize: "11px" }} onClick={() => handleAddNewRow("lamelle")}>
              <i className="bi bi-plus"></i> Yeni Model Verisi
            </button>
          </div>
          <ExcelGrid
            headers={["Formül Anahtarı (Key)", "Model Mühendislik Özelliği", "Değer"]}
            fields={["parametre_key", "parametre_adi", "deger"]}
            data={lamelleData}
            isMainTable={true}
            onDataChange={(updateFn) => {
              setAllParameters(prev => {
                const updatedLamelleData = typeof updateFn === 'function' ? updateFn(lamelleData) : updateFn;
                const otherData = prev.filter(p => !String(p?.parametre_key || "").startsWith("LS_") && !String(p?.parametre_key || "").startsWith("NEW_LAM_"));
                return [...otherData, ...updatedLamelleData];
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
    </div>
  );
}

export default CalculationPage;