import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";

function DebiDagitim() {
  const [debiDagitimData, setDebiDagitimData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State Yönetimi
  const [showModal, setShowModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);

  const headers = ["Çıkış Grubu Kademesi", "Yurt Dışı Fiyat (€)", "Yurt İçi Fiyat (€)"];
  const fields = ["yd", "yi"];

  useEffect(() => {
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

    fetchDebiDagitim();
  }, []);

  // 🔍 Değişiklikleri hesaplayan ve detayları modele hazırlayan fonksiyon
  const handleSaveClick = () => {
    const changes = [];

    debiDagitimData.forEach((item) => {
      const originalItem = originalData.find((o) => o.id === item.id);

      if (originalItem) {
        fields.forEach((field) => {
          if (Number(originalItem[field]) !== Number(item[field])) {
            changes.push({
              // Backend'in beklediği zorunlu alanlar:
              tableName: "flow_distribution",
              id: item.id,
              columnName: field,
              newValue: Number(item[field]),

              // Modalda görselleştirmek için eklediğimiz ekstra alanlar:
              rowName: item.ad,       // Tablodaki "3 Çıkış", "4 Çıkış" gibi isim
              oldValue: Number(originalItem[field]) // Üzeri çizilecek eski değer
            });
          }
        });
      }
    });

    if (changes.length === 0) {
      console.log("Değişen bir veri bulunamadı.");
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
      // Eğer kaydedilecek bir değişiklik yoksa işlemi durdur
      if (pendingChanges.length === 0) return;

      const targetTableName = pendingChanges[0].tableName;

      // Backend'in yeni beklediği toplu array formatı
      const updatesPayload = pendingChanges.map((change) => ({
        id: change.id,
        columnName: change.columnName,
        newValue: change.newValue
      }));

      // 🚀 Tek bir paket halinde backend'e fırlatıyoruz
      await API.updatePriceData({
        tableName: targetTableName,
        updates: updatesPayload
      });

      // Başarılıysa güncel datayı orijinal durum olarak mühürle
      setOriginalData(JSON.parse(JSON.stringify(debiDagitimData)));
      setPendingChanges([]); // Değişiklik listesini temizle
    } catch (error) {
      console.error("Debi dağıtım fiyatları kaydedilirken teknik hata:", error);
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

  return (
    <div>
      <div className="d-flex justify-content-end align-items-center mb-3">
        <button className="btn btn-success btn-sm px-4" onClick={handleSaveClick}>
          <i className="bi bi-file-earmark-excel me-2"></i>Kaydet
        </button>
      </div>

      <ExcelGrid
        headers={headers}
        data={debiDagitimData}
        fields={fields}
        onDataChange={setDebiDagitimData}
      />

      <PriceChangeUpdateConfirmationModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmSave}
        changesList={pendingChanges} // Array'i doğrudan içeri fırlatıyoruz
      />
    </div>
  );
}

export default DebiDagitim;