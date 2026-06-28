import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";
import AlertModal from "../modals/AlertModal";

function Lamella() {
  const [lamellaData, setLamellaData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State Yönetimi
  const [showModal, setShowModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);

  const [alertConfig, setAlertConfig] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
    showCancel: false, // İptal butonu olsun mu?
    action: null       // "Evet" denirse ne çalışsın?
  });


  // 📊 Kolon Yapısı: Yeni veritabanı şemamıza göre Alan ve Hacim bilgileri eklendi
  const headers = [
    "Lamella Tipi Seçeneği",
    "Yurt Dışı Fiyatı (€)",
    "Yurt İçi Fiyatı (€)",
    "Alan (m²)",
    "Hacim (m³)"
  ];
  const fields = ["tipi", "yd_fiyat", "yi_fiyat", "alan", "hacim"];

  const fetchLamellaData = async () => {
    try {
      setLoading(true);
      const response = await API.getLamellaData();
      setLamellaData(response.data);
      setOriginalData(JSON.parse(JSON.stringify(response.data)));
    } catch (error) {
      console.error("Lamella verileri yüklenirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLamellaData();
  }, []);

  // ➕ Yeni Boş Lamella Satırı Ekleme Fonksiyonu
  const handleAddNewRow = () => {
    const nextNum = lamellaData.length + 1;
    const defaultName = `LS ${nextNum}`;

    const newRow = {
      id: `new_${Date.now()}`, // Benzersiz geçici ID
      tipi: defaultName,
      yd_fiyat: 0,
      yi_fiyat: 0,
      alan: 0,
      hacim: 0,
      isNew: true
    };
    setLamellaData(prev => [...prev, newRow]);
  };

  // 🛠️ KAYDET BUTONU: Ekleme, Silme ve Güncelleme Fark Ayrıştırma Modülü
  const handleSaveClick = () => {
    const changes = [];

    lamellaData.forEach((item) => {
      // ❌ DURUM A: Satır Silinmiş mi? (DELETE)
      if (item.isDeleted) {
        if (String(item.id).startsWith("new_")) return;

        changes.push({
          type: "DELETE",
          tableName: "lamella_data",
          id: item.id,
          columnName: "tipi",
          newValue: null,
          rowName: item.tipi,
          oldValue: 0
        });
        return;
      }

      // ➕ DURUM B: Yeni Satır mı? (INSERT)
      if (String(item.id).startsWith("new_")) {
        changes.push({
          type: "INSERT",
          tableName: "lamella_data",
          id: undefined,
          columnName: "tipi",
          newValue: item.tipi,
          rowName: item.tipi,
          oldValue: 0,
          additionalData: {
            yd_fiyat: Number(item.yd_fiyat) || 0,
            yi_fiyat: Number(item.yi_fiyat) || 0,
            alan: Number(item.alan) || 0,
            hacim: Number(item.hacim) || 0
          }
        });
        return;
      }

      // 🔄 DURUM C: Mevcut Satır Güncelleme mi? (UPDATE)
      const originalItem = originalData.find((o) => String(o.id) === String(item.id));

      if (originalItem) {
        fields.forEach((field) => {
          const esitMi = field === "tipi"
            ? String(originalItem[field]).trim() === String(item[field]).trim()
            : Number(originalItem[field] || 0) === Number(item[field] || 0);

          if (!esitMi) {
            changes.push({
              type: "UPDATE",
              tableName: "lamella_data",
              id: originalItem.id,
              columnName: field,
              newValue: field === "tipi" ? item[field] : Number(item[field]),
              rowName: item.tipi,
              oldValue: originalItem[field] || 0
            });
          }
        });
      }
    });

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
      if (pendingChanges.length === 0) {
        setLoading(false);
        return;
      }

      const targetTableName = pendingChanges[0].tableName;
      const updatesPayload = pendingChanges.map((change) => ({
        id: change.id,
        columnName: change.columnName,
        newValue: change.newValue,
        additionalData: change.additionalData || undefined
      }));

      await API.updatePriceData({
        tableName: targetTableName,
        updates: updatesPayload
      });

      await fetchLamellaData();
      setPendingChanges([]);
    } catch (error) {
      console.error("Lamella verileri güncellenirken teknik hata:", error);
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
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">İşlem Yapılıyor...</span>
        </div>
      </div>
    );
  }

  const visibleLamellaData = lamellaData.filter(l => !l.isDeleted);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
          <i className="bi bi-layers-half me-2 text-success"></i>
          <span className="fw-semibold small">Lamella Tipi, Ölçü ve Bölgesel Fiyat Yönetimi</span>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm px-3" onClick={handleAddNewRow}>
            <i className="bi bi-plus-circle me-2"></i>Yeni Seçenek Ekle
          </button>
          <button className="btn btn-success btn-sm px-4" onClick={handleSaveClick}>
            <i className="bi bi-file-earmark-excel me-2"></i>Kaydet
          </button>
        </div>
      </div>

      <ExcelGrid
        headers={headers}
        data={visibleLamellaData}
        fields={fields}
        onDataChange={setLamellaData}
        isMainTable={true}
      />

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

export default Lamella;