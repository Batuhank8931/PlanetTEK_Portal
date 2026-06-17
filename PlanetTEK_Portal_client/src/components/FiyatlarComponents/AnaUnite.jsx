import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";

function AnaUnite() {
  const [anaUniteler, setAnaUniteler] = useState([]);
  const [sabitBilesenler, setSabitBilesenler] = useState([]);

  const [originalData, setOriginalData] = useState([]);
  const [originalSabitData, setOriginalSabitData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);

  // 📊 11 adet Başlık (1 adet sol sabit kılavuz + 10 adet field kolonu)
  const headers = [
    "Model (MX1/MINI)",
    "Satış Adedi",
    "PlanetDISK YD (€)",
    "PlanetDISK YI (€)",
    "Kontrol Pano YD (€)",
    "Kontrol Pano YI (€)",
    "Tüm Tesisat YD (€)",
    "Tüm Tesisat YI (€)",
    "Kapak Hariç YD (€)",
    "Kapak Hariç YI (€)"
  ];

  // Tam 10 adet dinamik field kolonu
  const fields = ["model", "sale_amount", "bYd", "bYi", "pYd", "pYi", "tYd", "tYi", "yd_kapaksiz", "yi_kapaksiz"];

  const sabitHeaders = ["Yurt Dışı (YD) Fiyatı (€)", "Yurt İçi (Yİ) Fiyatı (€)"];
  const sabitFields = ["fiyat_yd", "fiyat_yi"];

  // 🛠️ Sol taraftaki kılavuz etiketini tamamen dinamik ve sınırsız üretir
  const generateLabelName = (unite) => {
    if (String(unite.model).toUpperCase() === "MINI") return "MINI";
    return `${unite.sale_amount || 0} MX 1`;
  };

  const fetchAnaUniteler = async () => {
    try {
      setLoading(true);
      const response = await API.getMainUnits();

      const formattedData = response.data.map(unite => ({
        ...unite,
        name: generateLabelName(unite)
      }));

      setAnaUniteler(JSON.parse(JSON.stringify(formattedData)));
      setOriginalData(JSON.parse(JSON.stringify(formattedData)));

      const referans = formattedData[0] || {};
      const ilkSabitler = [
        { id: "kapak", name: "Kapak Birim Fiyatı", fiyat_yd: referans.kapak_fiyati_yd || 0, fiyat_yi: referans.kapak_fiyati_yi || 0 },
        { id: "sase", name: "Gövde-Şase Birim Fiyatı", fiyat_yd: referans.sase_fiyati_yd || 0, fiyat_yi: referans.sase_fiyati_yi || 0 }
      ];

      setSabitBilesenler(ilkSabitler);
      setOriginalSabitData(JSON.parse(JSON.stringify(ilkSabitler)));

    } catch (error) {
      console.error("Ana üniteler yüklenirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnaUniteler();
  }, []);

  // ➕ Yeni Boş Ünite Satırı Ekleme Fonksiyonu
  const handleAddNewRow = () => {
    const nextAmount = anaUniteler.length + 1;
    const tempRow = { model: "MX1", sale_amount: nextAmount };

    const newRow = {
      id: `new_${Date.now()}`,
      name: generateLabelName(tempRow),
      model: "MX1",
      sale_amount: nextAmount,
      bYd: 0, bYi: 0,
      pYd: 0, pYi: 0,
      tYd: 0, tYi: 0,
      yd_kapaksiz: 0, yi_kapaksiz: 0,
      isNew: true
    };
    setAnaUniteler(prev => [...prev, newRow]);
  };

  // 🔄 Model veya Satış Adedi değiştiğinde sol etiketi anlık yenileyen takipçi
  const handleGridDataChange = (newData) => {
    const resolvedData = typeof newData === "function" ? newData(anaUniteler) : newData;
    if (!resolvedData || !Array.isArray(resolvedData)) return;

    const updated = resolvedData.map(item => {
      const formattedItem = {
        ...item,
        model: item.model ? String(item.model).toUpperCase().trim() : "MX1",
        sale_amount: item.sale_amount !== undefined ? Number(item.sale_amount) : 1
      };

      return {
        ...formattedItem,
        name: generateLabelName(formattedItem)
      };
    });
    setAnaUniteler(updated);
  };

  // 🛠️ KAYDET BUTONU: Fark Ayrıştırma Modülü
  const handleSaveClick = () => {
    const changes = [];

    const kapakRow = sabitBilesenler.find(r => r.id === "kapak") || {};
    const saseRow = sabitBilesenler.find(r => r.id === "sase") || {};

    anaUniteler.forEach((unite) => {
      if (unite.isDeleted) {
        if (String(unite.id).startsWith("new_")) return;

        changes.push({
          type: "DELETE",
          tableName: "main_units",
          id: unite.id,
          columnName: "sale_amount",
          newValue: null,
          rowName: generateLabelName(unite),
          oldValue: 0
        });
        return;
      }

      const currentKapakYd = kapakRow.fiyat_yd !== undefined ? Number(kapakRow.fiyat_yd) : Number(unite.kapak_fiyati_yd || 0);
      const currentKapakYi = kapakRow.fiyat_yi !== undefined ? Number(kapakRow.fiyat_yi) : Number(unite.kapak_fiyati_yi || 0);

      const hesaplananYdKapaksiz = Number(unite.bYd) - currentKapakYd;
      const hesaplananYiKapaksiz = Number(unite.bYi) - currentKapakYi;

      const guncelUnite = {
        ...unite,
        yd_kapaksiz: hesaplananYdKapaksiz,
        yi_kapaksiz: hesaplananYiKapaksiz,
        kapak_fiyati_yd: currentKapakYd,
        kapak_fiyati_yi: currentKapakYi,
        sase_fiyati_yd: saseRow.fiyat_yd !== undefined ? Number(saseRow.fiyat_yd) : Number(unite.sase_fiyati_yd || 0),
        sase_fiyati_yi: saseRow.fiyat_yi !== undefined ? Number(saseRow.fiyat_yi) : Number(unite.sase_fiyati_yi || 0),
      };

      if (String(unite.id).startsWith("new_")) {
        changes.push({
          type: "INSERT",
          tableName: "main_units",
          id: undefined,
          columnName: "sale_amount",
          newValue: guncelUnite.sale_amount,
          rowName: generateLabelName(guncelUnite),
          oldValue: 0,
          additionalData: {
            model: guncelUnite.model,
            bYd: Number(guncelUnite.bYd) || 0,
            bYi: Number(guncelUnite.bYi) || 0,
            pYd: Number(guncelUnite.pYd) || 0,
            pYi: Number(guncelUnite.pYi) || 0,
            tYd: Number(guncelUnite.tYd) || 0,
            tYi: Number(guncelUnite.tYi) || 0,
            yd_kapaksiz: Number(guncelUnite.yd_kapaksiz) || 0,
            yi_kapaksiz: Number(guncelUnite.yi_kapaksiz) || 0,
            kapak_fiyati_yd: Number(guncelUnite.kapak_fiyati_yd) || 0,
            kapak_fiyati_yi: Number(guncelUnite.kapak_fiyati_yi) || 0,
            sase_fiyati_yd: Number(guncelUnite.sase_fiyati_yd) || 0,
            sase_fiyati_yi: Number(guncelUnite.sase_fiyati_yi) || 0
          }
        });
        return;
      }

      const originalUnite = originalData.find((o) => String(o.id) === String(unite.id));
      if (!originalUnite) return;

      const tumGuncellenecekSutunlar = [...fields, "kapak_fiyati_yd", "kapak_fiyati_yi", "sase_fiyati_yd", "sase_fiyati_yi"];

      tumGuncellenecekSutunlar.forEach((field) => {
        const esitMi = field === "model"
          ? String(originalUnite[field]).toUpperCase().trim() === String(guncelUnite[field]).toUpperCase().trim()
          : Number(originalUnite[field] || 0) === Number(guncelUnite[field] || 0);

        if (!esitMi) {
          changes.push({
            type: "UPDATE",
            tableName: "main_units",
            id: unite.id,
            columnName: field,
            newValue: field === "model" ? guncelUnite[field] : Number(guncelUnite[field]),
            rowName: generateLabelName(guncelUnite),
            oldValue: originalUnite[field]
          });
        }
      });
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

      const response = await API.getMainUnits();
      const formattedData = response.data.map(unite => ({
        ...unite,
        name: generateLabelName(unite)
      }));

      setAnaUniteler(JSON.parse(JSON.stringify(formattedData)));
      setOriginalData(JSON.parse(JSON.stringify(formattedData)));

      const referans = formattedData[0] || {};
      const yeniSabitler = [
        { id: "kapak", name: "Kapak Birim Fiyatı", fiyat_yd: referans.kapak_fiyati_yd || 0, fiyat_yi: referans.kapak_fiyati_yi || 0 },
        { id: "sase", name: "Gövde-Şase Birim Fiyatı", fiyat_yd: referans.sase_fiyati_yd || 0, fiyat_yi: referans.sase_fiyati_yi || 0 }
      ];

      setSabitBilesenler(yeniSabitler);
      setOriginalSabitData(JSON.parse(JSON.stringify(yeniSabitler)));
      setPendingChanges([]);

    } catch (error) {
      console.error("Kaydetme esnasında teknik hata:", error);
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

  const visibleAnaUniteler = anaUniteler.filter(u => !u.isDeleted);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
          <i className="bi bi-gear-fill me-2 text-success"></i>
          <span className="fw-semibold small">Ana Ünete Yönetimi (Ayrık Hücre Düzeni)</span>
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

      <div className="mb-4">
        <ExcelGrid
          headers={headers}
          data={visibleAnaUniteler}
          fields={fields}
          onDataChange={handleGridDataChange}
          isMainTable={true}
        />
      </div>

      <div className="mt-5">
        <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
          <i className="bi bi-gear-fill me-2 text-success"></i>
          <span className="fw-semibold small">Sabit Ek Bileşen Fiyat Ayarları</span>
        </div>
        <ExcelGrid
          headers={sabitHeaders}
          data={sabitBilesenler}
          fields={sabitFields}
          onDataChange={setSabitBilesenler}
        />
      </div>

      <PriceChangeUpdateConfirmationModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmSave}
        changesList={pendingChanges}
      />
    </div>
  );
}

export default AnaUnite;