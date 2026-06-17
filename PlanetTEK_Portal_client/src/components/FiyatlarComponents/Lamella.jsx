import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";

function Lamella() {
  const [lamellaData, setLamellaData] = useState([]);
  const [originalData, setOriginalData] = useState([]); // Değişenleri süzmek için kopya data
  const [loading, setLoading] = useState(true);

  // Modal State Yönetimi
  const [showModal, setShowModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);

  // ExcelGrid kolon ve alan eşleştirmeleri
  const headers = ["Lamella Tipi Seçeneği", "Birim Fiyat (€)"];
  const fields = ["fiyat"];

  // 🔍 Bileşen yüklendiğinde verileri API'den çek
  useEffect(() => {
    const fetchLamellaData = async () => {
      try {
        setLoading(true);
        const response = await API.getLamellaData();
        setLamellaData(response.data);
        // İlk halini hafızaya derin kopyalayarak alıyoruz
        setOriginalData(JSON.parse(JSON.stringify(response.data)));
      } catch (error) {
        console.error("Lamella verileri yüklenirken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLamellaData();
  }, []);

  // 🔍 Kaydet tuşuna basıldığında sadece değişen hücreleri yakala ve modalı aç
  const handleSaveClick = () => {
    const changes = [];

    lamellaData.forEach((item) => {
      const originalItem = originalData.find((o) => o.id === item.id);

      if (originalItem && Number(originalItem.fiyat) !== Number(item.fiyat)) {
        changes.push({
          tableName: "lamella_data",
          id: item.id,
          columnName: "fiyat",
          newValue: Number(item.fiyat),
          rowName: item.tipi, // "Yurt İçi - LS 8" gibi modalda görünecek ad
          oldValue: Number(originalItem.fiyat)
        });
      }
    });

    if (changes.length === 0) {
      console.log("Değişen bir lamella verisi bulunamadı.");
      return;
    }

    setPendingChanges(changes);
    setShowModal(true);
  };

  // ✅ Modal onay verince istekleri paralel olarak backend'e fırlat
  // ✅ Onay verilince lamella fiyatlarındaki tüm değişiklikleri tek bir toplu istekte gönder
  const handleConfirmSave = async () => {
    setShowModal(false);
    setLoading(true);

    try {
      // Eğer kaydedilecek bir değişiklik yoksa işlemi durdur
      if (pendingChanges.length === 0) return;

      // İlk elemandan tablonun adını güvenle alıyoruz ("lamella_data")
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

      // Güncel durumu yeni referans noktası (orijinalData) olarak mühürle
      setOriginalData(JSON.parse(JSON.stringify(lamellaData)));
      setPendingChanges([]); // Bekleyen değişiklikleri temizle
    } catch (error) {
      console.error("Lamella fiyatları güncellenirken teknik hata:", error);
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

      <div className="row justify-content-start">
        <div className="col-12 col-md-6">
          <ExcelGrid
            headers={headers}
            data={lamellaData}
            fields={fields}
            onDataChange={setLamellaData}
          />
        </div>
      </div>

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

export default Lamella;