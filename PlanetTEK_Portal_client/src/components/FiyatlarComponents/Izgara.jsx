import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";

function Izgara() {
  const [izgaraData, setIzgaraData] = useState([]);
  const [originalData, setOriginalData] = useState([]); // Değişenleri yakalamak için kopya data
  const [loading, setLoading] = useState(true);

  // Modal State Yönetimi
  const [showModal, setShowModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);

  // Başlıklar ve veri anahtarları (fields) eşleşmesi
  const headers = [
    "Kapasite",
    "Yağ Tutucu YD", "Yağ Tutucu YI",
    "M. Kaba YD", "M. Kaba YI",
    "M. İnce YD", "M. İnce YI",
    "Oto Kaba YD", "Oto Kaba YI",
    "Oto İnce YD", "Oto İnce YI"
  ];

  const fields = [
    "plakaYd", "plakaYi",
    "mKabaYd", "mKabaYi",
    "mInceYd", "mInceYi",
    "oKabaYd", "oKabaYi",
    "oInceYd", "oInceYi"
  ];

  // 🔍 Bileşen yüklendiğinde verileri API'den çek
  useEffect(() => {
    const fetchIzgaraData = async () => {
      try {
        setLoading(true);
        const response = await API.getScreenData();
        setIzgaraData(response.data);
        // İlk veriyi derin kopyalayarak hafızaya alıyoruz
        setOriginalData(JSON.parse(JSON.stringify(response.data)));
      } catch (error) {
        console.error("Izgara ve kapasite verileri yüklenirken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIzgaraData();
  }, []);

  // 🔍 Kullanıcı "Kaydet" dediğinde 10 farklı sütunu tarayıp sadece değişenleri bulur
  const handleSaveClick = () => {
    const changes = [];

    izgaraData.forEach((item) => {
      const originalItem = originalData.find((o) => o.id === item.id);

      if (originalItem) {
        fields.forEach((field) => {
          if (Number(originalItem[field]) !== Number(item[field])) {
            changes.push({
              // Backend'in zorunlu parametreleri:
              tableName: "screen_data",
              id: item.id,
              columnName: field,
              newValue: Number(item[field]),

              // Koyu temalı modalın listeleme detayları:
              rowName: item.kapasite, // "100 m³/gün", "200 m³/gün" gibi kapasite bilgisi
              oldValue: Number(originalItem[field])
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

  // ✅ Modal onaylayınca sadece güncellenen hücreleri paralel olarak backend'e yollar
  // ✅ Onay verilince ızgara verilerindeki tüm değişiklikleri tek bir toplu istekte gönder
  const handleConfirmSave = async () => {
    setShowModal(false);
    setLoading(true);

    try {
      // Eğer kaydedilecek bir değişiklik yoksa işlemi durdur
      if (pendingChanges.length === 0) return;

      // İlk elemandan tablonun adını güvenle alıyoruz ("screen_data")
      const targetTableName = pendingChanges[0].tableName;

      // Backend'in beklediği yeni sadeleştirilmiş bulk array formatı
      const updatesPayload = pendingChanges.map((change) => ({
        id: change.id,
        columnName: change.columnName,
        newValue: change.newValue
      }));

      // 🚀 Tek istek, tek transaction!
      await API.updatePriceData({
        tableName: targetTableName,
        updates: updatesPayload
      });

      // Başarılı işlem sonrası ekrandaki güncel halini yeni orijinal referans noktası olarak mühürle
      setOriginalData(JSON.parse(JSON.stringify(izgaraData)));
      setPendingChanges([]); // Bekleyen değişiklikleri temizle
    } catch (error) {
      console.error("Maliyetler güncellenirken teknik hata oluştu:", error);
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
        data={izgaraData}
        fields={fields}
        onDataChange={setIzgaraData}
      />

      {/* Şık Antrasit Onay Modalı */}
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