import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";
import AlertModal from "../modals/AlertModal";

function Izgara() {
  // 3 bağımsız tablo için 3 ayrı state yönetimi
  const [activeTableId, setActiveTableId] = useState(null);
  const [greaseData, setGreaseData] = useState([]);
  const [coarseData, setCoarseData] = useState([]);
  const [fineData, setFineData] = useState([]);

  const [alertConfig, setAlertConfig] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
    showCancel: false, // İptal butonu olsun mu?
    action: null       // "Evet" denirse ne çalışsın?
  });

  // Orijinal verileri mühürlemek için
  const [originalData, setOriginalData] = useState({ grease: [], coarse: [], fine: [] });
  const [loading, setLoading] = useState(true);

  // Modal State Yönetimi
  const [showModal, setShowModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);

  // Tablolara göre kolon ayrıştırmaları (Fark motoru ve API payload'u için kritik whitelist'ler)
  const tablesWhitelist = {
    grease_trap_data: ["kapasite", "plakaboyut", "yd_fiyat", "yi_fiyat"],
    coarse_screen_data: ["kapasite", "tipi", "yd_fiyat", "yi_fiyat"],
    fine_screen_data: ["kapasite", "tipi", "yd_fiyat", "yi_fiyat"]
  };

  // 1️⃣ TABLO: YAĞ TUTUCU PLAKALARI (DB Alanları: id, kapasite, plakaboyut, yd_fiyat, yi_fiyat)
  const greaseHeaders = ["Kapasite", "Yağ Tutucu Boyutu", "Yurt Dışı Fiyatı (€)", "Yurt İçi Fiyatı (€)"];
  const greaseFields = ["kapasite", "plakaboyut", "yd_fiyat", "yi_fiyat"];

  // 2️⃣ & 3️⃣ TABLOLAR: IZGARALAR ORTAK BAŞLIK VE ALANLARI (DB Alanları: id, kapasite, tipi, yd_fiyat, yi_fiyat)
  const screenHeaders = ["Kapasite", "Izgara Tipi (Manuel/Otomatik)", "Yurt Dışı Fiyatı (€)", "Yurt İçi Fiyatı (€)"];
  const screenFields = ["kapasite", "tipi", "yd_fiyat", "yi_fiyat"];

  // Verileri çekip state'lere temizce dağıtma
  const fetchIzgaraData = async () => {
    try {
      setLoading(true);
      const response = await API.getScreenData();
      const { greaseTrap = [], coarseScreen = [], fineScreen = [] } = response.data || {};

      // String dönüşümleriyle sayısal alanları sanitize edelim
      const formatIncoming = (arr) => arr.map(item => ({
        ...item,
        yd_fiyat: Number(item.yd_fiyat) || 0,
        yi_fiyat: Number(item.yi_fiyat) || 0
      }));

      const gFormed = formatIncoming(greaseTrap);
      const cFormed = formatIncoming(coarseScreen);
      const fFormed = formatIncoming(fineScreen);

      setGreaseData(gFormed);
      setCoarseData(cFormed);
      setFineData(fFormed);

      setOriginalData({
        grease: JSON.parse(JSON.stringify(gFormed)),
        coarse: JSON.parse(JSON.stringify(cFormed)),
        fine: JSON.parse(JSON.stringify(fFormed))
      });
    } catch (error) {
      console.error("Izgara verileri yüklenirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIzgaraData();
  }, []);

  // ➕ HER TABLO İÇİN KENDİ BAĞIMSIZ EKLEME FONKSİYONLARI
  const handleAddGreaseRow = () => {
    setGreaseData(prev => [...prev, {
      id: `new_grease_${Date.now()}`,
      kapasite: `${(prev.length + 1) * 100} m³/gün`,
      plakaboyut: "1000 x 1000 mm",
      yd_fiyat: 0, yi_fiyat: 0,
      isNew: true
    }]);
  };

  const handleAddCoarseRow = () => {
    setCoarseData(prev => [...prev, {
      id: `new_coarse_${Date.now()}`,
      kapasite: `${Math.ceil((prev.length + 1) / 2) * 100} m³/gün`,
      tipi: prev.length % 2 === 0 ? "Manuel" : "Otomatik",
      yd_fiyat: 0, yi_fiyat: 0,
      isNew: true
    }]);
  };

  const handleAddFineRow = () => {
    setFineData(prev => [...prev, {
      id: `new_fine_${Date.now()}`,
      kapasite: `${Math.ceil((prev.length + 1) / 2) * 100} m³/gün`,
      tipi: prev.length % 2 === 0 ? "Manuel" : "Otomatik",
      yd_fiyat: 0, yi_fiyat: 0,
      isNew: true
    }]);
  };

  // 🛠️ MERKEZİ FARK AYRIŞTIRMA MOTORU
  const handleSaveClick = () => {
    const changes = [];

    const diffTable = (currentArr, originalArr, tableName, textFields = ["kapasite", "plakaboyut", "tipi"]) => {
      currentArr.forEach((item) => {
        // DELETE
        if (item.isDeleted) {
          if (String(item.id).startsWith("new_")) return;
          changes.push({
            type: "DELETE", tableName, id: item.id, columnName: "kapasite", newValue: null, rowName: item.kapasite, oldValue: 0
          });
          return;
        }

        // INSERT
        if (String(item.id).startsWith("new_")) {
          const triggerField = textFields.includes("plakaboyut") ? "plakaboyut" : "tipi";
          const additional = { ...item };
          delete additional.id;
          delete additional.isNew;
          delete additional.isDeleted;
          delete additional[triggerField];

          changes.push({
            type: "INSERT", tableName, id: undefined, columnName: triggerField,
            newValue: item[triggerField], rowName: item.kapasite, oldValue: 0,
            additionalData: additional
          });
          return;
        }

        // UPDATE
        const originalItem = originalArr.find(o => String(o.id) === String(item.id));
        if (originalItem) {
          Object.keys(item).forEach((field) => {
            if (field === "id" || field === "isNew" || field === "isDeleted" || field === "created_at" || field === "updated_at") return;

            const isText = textFields.includes(field);
            const esitMi = isText
              ? String(originalItem[field] || "").trim() === String(item[field] || "").trim()
              : Number(originalItem[field] || 0) === Number(item[field] || 0);

            if (!esitMi) {
              changes.push({
                type: "UPDATE", tableName, id: originalItem.id, columnName: field,
                newValue: isText ? item[field] : Number(item[field]),
                rowName: item.kapasite, oldValue: originalItem[field] || 0
              });
            }
          });
        }
      });
    };

    diffTable(greaseData, originalData.grease, "grease_trap_data", ["kapasite", "plakaboyut"]);
    diffTable(coarseData, originalData.coarse, "coarse_screen_data", ["kapasite", "tipi"]);
    diffTable(fineData, originalData.fine, "fine_screen_data", ["kapasite", "tipi"]);

    if (changes.length === 0) {
      setAlertConfig({
        show: true,
        title: "Uyarı",
        message: "Değişen bir veri bulunamadı.",
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
      if (pendingChanges.length === 0) return;

      const tableGroups = pendingChanges.reduce((acc, change) => {
        if (!acc[change.tableName]) acc[change.tableName] = [];
        acc[change.tableName].push({
          id: change.id,
          columnName: change.columnName,
          newValue: change.newValue,
          additionalData: change.additionalData || undefined
        });
        return acc;
      }, {});

      await Promise.all(
        Object.entries(tableGroups).map(([tName, updatesPayload]) =>
          API.updatePriceData({ tableName: tName, updates: updatesPayload })
        )
      );

      await fetchIzgaraData();
      setPendingChanges([]);
    } catch (error) {
      console.error("Maliyetler güncellenirken hata oluştu:", error);
      setAlertConfig({
        show: true,
        title: "Veriler kaydedilirken sistemsel bir hata meydana geldi",
        message: error,
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
        <div className="spinner-border text-success" role="status"><span className="visually-hidden">Yükleniyor...</span></div>
      </div>
    );
  }

  return (
    <div>
      {/* ÜST PANEL */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center" style={{ color: "#94a3b8" }}>
          <i className="bi bi-grid-3x3-gap me-2 text-success" style={{ fontSize: "18px" }}></i>
          <span className="fw-semibold small fs-6">Izgara & Yağ Tutucu Fiyat Yönetim Merkezi</span>
        </div>
        <button className="btn btn-success btn-sm px-5" onClick={handleSaveClick}>
          <i className="bi bi-file-earmark-excel me-2"></i>Değişiklikleri Kaydet
        </button>
      </div>

      {/* 📊 TABLO 1: YAĞ TUTUCU PLAKALARI */}

      <div className="mb-4">
        <div className="mb-2 d-flex align-items-center justify-content-between w-100" style={{ color: "#94a3b8" }}>
          <div className="d-flex align-items-center fw-bold small text-primary">
            <i className="bi bi-droplet-half me-2"></i>
            <span>Yağ Tutucu Plaka Detayları ve Fiyatları</span>
          </div>
          <button className="btn btn-outline-primary btn-xs px-2 py-0.5" style={{ fontSize: '10px' }} onClick={handleAddGreaseRow}>
            + Data Ekle
          </button>
        </div>
        <ExcelGrid
          tableId="greaseData"
          activeTableId={activeTableId}
          setActiveTableId={setActiveTableId}
          headers={greaseHeaders}
          data={greaseData.filter(i => !i.isDeleted)}
          fields={greaseFields}
          onDataChange={setGreaseData}
          isMainTable={true}
        />
      </div>

      {/* 📊 TABLO 2: KABA IZGARALAR */}
      <div className="mb-4">
        <div className="mb-2 d-flex align-items-center justify-content-between w-100" style={{ color: "#94a3b8" }}>
          <div className="d-flex align-items-center fw-bold small text-primary">
            <i className="bi bi-droplet-half me-2"></i>
            <span>Kaba Izgara Grubu (Manuel & Otomatik)</span>
          </div>
          <button className="btn btn-outline-primary btn-xs px-2 py-0.5" style={{ fontSize: '10px' }} onClick={handleAddCoarseRow}>
            + Data Ekle
          </button>
        </div>
        <ExcelGrid
          tableId="coarseData"
          activeTableId={activeTableId}
          setActiveTableId={setActiveTableId}
          headers={screenHeaders}
          data={coarseData.filter(i => !i.isDeleted)}
          fields={screenFields}
          onDataChange={setCoarseData}
          isMainTable={true}
        />
      </div>


      {/* 📊 TABLO 3: İNCE IZGARALAR (Düzeltilen Kısım burasıdır) */}

      <div className="mb-4">
        <div className="mb-2 d-flex align-items-center justify-content-between w-100" style={{ color: "#94a3b8" }}>
          <div className="d-flex align-items-center fw-bold small text-primary">
            <i className="bi bi-droplet-half me-2"></i>
            <span>İnce Izgara Grubu (Manuel & Otomatik)</span>
          </div>
          <button className="btn btn-outline-primary btn-xs px-2 py-0.5" style={{ fontSize: '10px' }} onClick={handleAddFineRow}>
            + Data Ekle
          </button>
        </div>
        <ExcelGrid
          tableId="fineData"
          activeTableId={activeTableId}
          setActiveTableId={setActiveTableId}
          headers={screenHeaders} // 🌟 KRİTİK DÜZELTME: Tanımlı olan screenHeaders atandı
          data={fineData.filter(i => !i.isDeleted)}
          fields={screenFields}
          onDataChange={setFineData}
          isMainTable={true}
        />
      </div>



      <PriceChangeUpdateConfirmationModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmSave}
        changesList={pendingChanges}
      />
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

export default Izgara;