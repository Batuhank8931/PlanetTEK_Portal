import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";

function Izgara() {
  const [izgaraData, setIzgaraData] = useState([]);
  const [originalData, setOriginalData] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Modal State Yönetimi
  const [showModal, setShowModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);

  // 📊 Kolon Yapısı: 11 Başlık ve 11 Field tam 1:1 senkronize edildi!
  const headers = [
    "Kapasite",
    "Yağ Tutucu YD", "Yağ Tutucu YI",
    "M. Kaba YD", "M. Kaba YI",
    "M. İnce YD", "M. İnce YI",
    "Oto Kaba YD", "Oto Kaba YI",
    "Oto İnce YD", "Oto İnce YI"
  ];

  // 'kapasite' kolonunu field listesinin en başına yerleştirdik
  const fields = [
    "kapasite",
    "plakaYd", "plakaYi",
    "mKabaYd", "mKabaYi",
    "mInceYd", "mInceYi",
    "oKabaYd", "oKabaYi",
    "oInceYd", "oInceYi"
  ];

  const fetchIzgaraData = async () => {
    try {
      setLoading(true);
      const response = await API.getScreenData();
      setIzgaraData(response.data);
      setOriginalData(JSON.parse(JSON.stringify(response.data)));
    } catch (error) {
      console.error("Izgara ve kapasite verileri yüklenirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIzgaraData();
  }, []);

  // ➕ Yeni Boş Izgara Kademesi Ekleme Fonksiyonu
  const handleAddNewRow = () => {
    const nextNum = izgaraData.length + 1;
    const defaultKapasite = `${nextNum * 100} m³/gün`;

    const newRow = {
      id: `new_${Date.now()}`, // Benzersiz geçici ID
      kapasite: defaultKapasite,
      plakaYd: 0, plakaYi: 0,
      mKabaYd: 0, mKabaYi: 0,
      mInceYd: 0, mInceYi: 0,
      oKabaYd: 0, oKabaYi: 0,
      oInceYd: 0, oInceYi: 0,
      isNew: true
    };
    setIzgaraData(prev => [...prev, newRow]);
  };

  // 🛠️ KAYDET BUTONU: Ekleme, Silme ve Güncelleme Fark Ayrıştırma Modülü
  const handleSaveClick = () => {
    const changes = [];

    izgaraData.forEach((item) => {
      // ❌ DURUM A: Satır Silinmiş mi? (DELETE)
      if (item.isDeleted) {
        if (String(item.id).startsWith("new_")) return; // DB'ye yazılmadan silindiyse pas geç

        changes.push({
          type: "DELETE",
          tableName: "screen_data",
          id: item.id,
          columnName: "kapasite", // Güvenlik duvarı için geçerli placeholder kolon
          newValue: null,
          rowName: item.kapasite,
          oldValue: 0
        });
        return;
      }

      // ➕ DURUM B: Yeni Satır mı? (INSERT)
      if (String(item.id).startsWith("new_")) {
        changes.push({
          type: "INSERT",
          tableName: "screen_data",
          id: undefined,
          columnName: "kapasite", // Tetikleyici ana kolonumuz
          newValue: item.kapasite,
          rowName: item.kapasite,
          oldValue: 0,
          additionalData: {
            plakaYd: Number(item.plakaYd) || 0, plakaYi: Number(item.plakaYi) || 0,
            mKabaYd: Number(item.mKabaYd) || 0, mKabaYi: Number(item.mKabaYi) || 0,
            mInceYd: Number(item.mInceYd) || 0, mInceYi: Number(item.mInceYi) || 0,
            oKabaYd: Number(item.oKabaYd) || 0, oKabaYi: Number(item.oKabaYi) || 0,
            oInceYd: Number(item.oInceYd) || 0, oInceYi: Number(item.oInceYi) || 0
          }
        });
        return;
      }

      // 🔄 DURUM C: Mevcut Satır Güncelleme mi? (UPDATE)
      const originalItem = originalData.find((o) => String(o.id) === String(item.id));

      if (originalItem) {
        fields.forEach((field) => {
          const esitMi = field === "kapasite"
            ? String(originalItem[field]).trim() === String(item[field]).trim()
            : Number(originalItem[field] || 0) === Number(item[field] || 0);

          if (!esitMi) {
            changes.push({
              type: "UPDATE",
              tableName: "screen_data",
              id: originalItem.id,
              columnName: field,
              newValue: field === "kapasite" ? item[field] : Number(item[field]),
              rowName: item.kapasite,
              oldValue: originalItem[field] || 0
            });
          }
        });
      }
    });

    if (changes.length === 0) {
      alert("Değişen bir veri bulunamadı.");
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

      // Taptaze verileri DB'den tekrar çekip mühürle
      await fetchIzgaraData();
      setPendingChanges([]); 
    } catch (error) {
      console.error("Maliyetler güncellenirken teknik hata oluştu:", error);
      alert("Veriler kaydedilirken sistemsel bir hata meydana geldi.");
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

  const visibleIzgaraData = izgaraData.filter(i => !i.isDeleted);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
          <i className="bi bi-grid-3x3-gap me-2 text-success"></i>
          <span className="fw-semibold small">Izgara & Yağ Tutucu Fiyat Yönetimi</span>
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
        data={visibleIzgaraData}
        fields={fields}
        onDataChange={setIzgaraData}
        isMainTable={true} // Aksiyon silme butonu aktif
      />

      <PriceChangeUpdateConfirmationModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmSave}
        changesList={pendingChanges}
      />
    </div>
  );
}

export default Izgara;