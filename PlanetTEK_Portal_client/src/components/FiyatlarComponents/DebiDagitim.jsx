import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";
import AlertModal from "../modals/AlertModal";

function DebiDagitim() {
  const [debiDagitimData, setDebiDagitimData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State Yönetimi
  const [showModal, setShowModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);

  // 🌟 AlertModal kontrolü için state
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
    showCancel: false, // İptal butonu olsun mu?
    action: null       // "Evet" denirse ne çalışsın?
  });

  // 📊 Kolon Yapısı: Başlıklar ve field'lar birebir (1:1) eşleşiyor!
  const headers = ["Çıkış Sayısı", "Yurt Dışı Fiyat (€)", "Yurt İçi Fiyat (€)"];
  const fields = ["ad", "yd", "yi"]; // 'ad' alanı artık grid'in ilk dinamik hücresi

  const fetchDebiDagitim = async () => {
    try {
      setLoading(true);
      const response = await API.getFlowDistribution();
      setDebiDagitimData(response.data);
      setOriginalData(JSON.parse(JSON.stringify(response.data)));
    } catch (error) {
      console.error("Debi dağıtım verileri yüklenirken hata oldu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebiDagitim();
  }, []);

  // ➕ Yeni Boş Satır Ekleme Fonksiyonu
  const handleAddNewRow = () => {
    const nextNum = debiDagitimData.length + 1;
    const defaultName = `${nextNum} Çıkış`;

    const newRow = {
      id: `new_${Date.now()}`, // Benzersiz geçici ID
      ad: defaultName,         // Kullanıcı grid hücresinden bunu değiştirebilecek
      yd: 0,
      yi: 0,
      isNew: true
    };
    setDebiDagitimData(prev => [...prev, newRow]);
  };

  // 🛠️ Grid üzerinde herhangi bir hücre (isim veya fiyat) değiştiğinde doğrudan state'e yansıtır
  const handleGridDataChange = (newData) => {
    const resolvedData = typeof newData === "function" ? newData(debiDagitimData) : newData;
    if (!resolvedData || !Array.isArray(resolvedData)) return;

    // Artık 'item.name' gibi ara değişkenlere gerek yok, doğrudan gelen saf veriyi mühürlüyoruz
    setDebiDagitimData(resolvedData);
  };

  // 🔍 Değişiklikleri hesaplayan ve detayları modele hazırlayan fonksiyon
  const handleSaveClick = () => {
    const changes = [];

    debiDagitimData.forEach((item) => {
      // ❌ DURUM A: Satır Silinmiş mi? (DELETE)
      if (item.isDeleted) {
        if (String(item.id).startsWith("new_")) return; // DB'ye yazılmadan silindiyse pas geç

        changes.push({
          type: "DELETE",
          tableName: "flow_distribution",
          id: item.id,
          columnName: "ad", // Güvenlik duvarı için geçerli placeholder kolon
          newValue: null,
          rowName: item.ad,
          oldValue: 0
        });
        return;
      }

      // ➕ DURUM B: Yeni Satır mı? (INSERT)
      if (String(item.id).startsWith("new_")) {
        changes.push({
          type: "INSERT",
          tableName: "flow_distribution",
          id: undefined,
          columnName: "ad", // İlk zorunlu tetikleyici alanımız (Grup Adı)
          newValue: item.ad,
          rowName: item.ad,
          oldValue: 0,
          additionalData: {
            yd: Number(item.yd) || 0,
            yi: Number(item.yi) || 0
          }
        });
        return;
      }

      // 🔄 DURUM C: Mevcut Satır Güncelleme mi? (UPDATE)
      const originalItem = originalData.find((o) => String(o.id) === String(item.id));

      if (originalItem) {
        fields.forEach((field) => {
          const esitMi = field === "ad"
            ? String(originalItem[field]).trim() === String(item[field]).trim()
            : Number(originalItem[field] || 0) === Number(item[field] || 0);

          if (!esitMi) {
            changes.push({
              type: "UPDATE",
              tableName: "flow_distribution",
              id: originalItem.id,
              columnName: field,
              newValue: field === "ad" ? item[field] : Number(item[field]),
              rowName: item.ad,
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

  // ✅ Onay verilince API isteklerini tetikleyen fonksiyon
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

      // Başarılıysa güncel datayı ID'leriyle birlikte yeniden mühürle
      await fetchDebiDagitim();
      setPendingChanges([]);
    } catch (error) {
      console.error("Debi dağıtım fiyatları kaydedilirken teknik hata:", error);
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

  const visibleDebiDagitimData = debiDagitimData.filter(d => !d.isDeleted);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
          <i className="bi bi-shuffle me-2 text-success"></i>
          <span className="fw-semibold small">Debi Dağıtım / Çıkış Grubu Yönetimi</span>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm px-3" onClick={handleAddNewRow}>
            <i className="bi bi-plus-circle me-2"></i>Yeni Kademe Ekle
          </button>
          <button className="btn btn-success btn-sm px-4" onClick={handleSaveClick}>
            <i className="bi bi-file-earmark-excel me-2"></i>Kaydet
          </button>
        </div>
      </div>

      <ExcelGrid
        headers={headers}
        data={visibleDebiDagitimData}
        fields={fields}
        onDataChange={handleGridDataChange}
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

export default DebiDagitim;