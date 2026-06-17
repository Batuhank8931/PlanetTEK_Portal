import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";

function AnaUnite() {
  const [anaUniteler, setAnaUniteler] = useState([]);
  const [sabitBilesenler, setSabitBilesenler] = useState([]); // Alt tablo için state

  // Orijinal verileri karşılaştırmak için kopyalar
  const [originalData, setOriginalData] = useState([]);
  const [originalSabitData, setOriginalSabitData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);

  // 1. Üst Tablo Konfigürasyonu
  const headers = [
    "Ünite Adı",
    "PlanetDISK YD (€)",
    "PlanetDISK YI (€)",
    "Kontrol Pano YD (€)",
    "Kontrol Pano YI (€)",
    "Tüm Tesisat YD (€)",
    "Tüm Tesisat YI (€)",
    "Kapak Hariç YD (€)",
    "Kapak Hariç YI (€)"
  ];
  const fields = ["bYd", "bYi", "pYd", "pYi", "tYd", "tYi", "yd_kapaksiz", "yi_kapaksiz"];

  // 2. Alt Tablo Konfigürasyonu
  const sabitHeaders = ["Bileşen Tipi", "Yurt Dışı (YD) Fiyatı (€)", "Yurt İçi (Yİ) Fiyatı (€)"];
  const sabitFields = ["fiyat_yd", "fiyat_yi"];

  useEffect(() => {
    const fetchAnaUniteler = async () => {
      try {
        setLoading(true);
        const response = await API.getMainUnits();

        // Üst tablo datasını biçimlendir
        const formattedData = response.data.map(unite => ({
          ...unite,
          display_name: unite.is_mini
            ? "MINI"
            : unite.sale_amount === 14
              ? "13 MX 1 VE ÜSTÜ"
              : `${unite.sale_amount} MX 1`
        }));

        setAnaUniteler(formattedData);
        setOriginalData(JSON.parse(JSON.stringify(formattedData)));

        // Alt tablo için ilk satırdaki sabit verileri baz alarak state doldur
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

    fetchAnaUniteler();
  }, []);

  // 🔍 Kullanıcı "Kaydet" dediğinde hem üst hem alt tablodaki değişiklikleri hesapla
  const handleSaveClick = () => {
    const changes = [];

    // Önce alt tablodaki kapak/şase değişimlerini ana ünite listemize sanal olarak yedirelim ki formül doğru çalışsın
    const kapakRow = sabitBilesenler.find(r => r.id === "kapak") || {};
    const saseRow = sabitBilesenler.find(r => r.id === "sase") || {};

    anaUniteler.forEach((unite) => {
      const originalUnite = originalData.find((o) => o.id === unite.id);
      if (!originalUnite) return;

      // --- 1. ÜST TABLO ALANLARININ KONTROLÜ ---
      // (bYd veya bYi değiştiyse kapaksız fiyatları güncel kapak fiyatına göre hesapla)
      const currentKapakYd = kapakRow.fiyat_yd !== undefined ? Number(kapakRow.fiyat_yd) : Number(unite.kapak_fiyati_yd);
      const currentKapakYi = kapakRow.fiyat_yi !== undefined ? Number(kapakRow.fiyat_yi) : Number(unite.kapak_fiyati_yi);

      const hesaplananYdKapaksiz = Number(unite.bYd) - currentKapakYd;
      const hesaplananYiKapaksiz = Number(unite.bYi) - currentKapakYi;

      // ExcelGrid'den gelen veya formülden çıkan güncel değerleri bir objede toplayalım
      const guncelUnite = {
        ...unite,
        yd_kapaksiz: hesaplananYdKapaksiz,
        yi_kapaksiz: hesaplananYiKapaksiz,
        kapak_fiyati_yd: currentKapakYd,
        kapak_fiyati_yi: currentKapakYi,
        sase_fiyati_yd: saseRow.fiyat_yd !== undefined ? Number(saseRow.fiyat_yd) : Number(unite.sase_fiyati_yd),
        sase_fiyati_yi: saseRow.fiyat_yi !== undefined ? Number(saseRow.fiyat_yi) : Number(unite.sase_fiyati_yi),
      };

      // Kontrol edilecek tüm DB kolon listesi
      const tumAlanlar = [...fields, "kapak_fiyati_yd", "kapak_fiyati_yi", "sase_fiyati_yd", "sase_fiyati_yi"];

      tumAlanlar.forEach((field) => {
        if (Number(originalUnite[field]) !== Number(guncelUnite[field])) {
          changes.push({
            tableName: "main_units",
            id: unite.id,
            columnName: field,
            newValue: Number(guncelUnite[field]),
            rowName: `${unite.display_name} -> Kolon: ${field}`,
            oldValue: Number(originalUnite[field])
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

  // ✅ Onay verilince TEK BİR TOPLU API isteği gönder
  const handleConfirmSave = async () => {
    setShowModal(false);
    setLoading(true);

    try {
      // Eğer hiç değişiklik yoksa boşuna istek atma
      if (pendingChanges.length === 0) return;

      // Tüm pendingChanges'ların aynı tabloya ait olduğunu varsayarak 
      // (veya ilk elemandan tableName'i çekerek) payload hazırlıyoruz
      const targetTableName = pendingChanges[0].tableName;

      // Backend'in beklediği yeni formata göre array'i sadeleştiriyoruz
      const updatesPayload = pendingChanges.map((change) => ({
        id: change.id,
        columnName: change.columnName,
        newValue: change.newValue
      }));

      // 🚀 Tek istek, tek kurşun!
      await API.updatePriceData({
        tableName: targetTableName,
        updates: updatesPayload
      });

      // Başarılıysa güncel dataları orijinal durum (orijinalData) olarak mühürle
      setOriginalData(JSON.parse(JSON.stringify(anaUniteler)));
      setOriginalSabitData(JSON.parse(JSON.stringify(sabitBilesenler)));
      setPendingChanges([]); // Değişiklik listesini sıfırla

    } catch (error) {
      console.error("Kaydetme esnasında teknik hata:", error);
      // Kullanıcıya bir toast veya alert ile hata göstermek iyi olabilir
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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
          <i className="bi bi-gear-fill me-2 text-success"></i>
          <span className="fw-semibold small">Ana Ünite Fiyatları</span>
        </div>
        <button className="btn btn-success btn-sm px-4" onClick={handleSaveClick}>
          <i className="bi bi-file-earmark-excel me-2"></i>Kaydet
        </button>
      </div>

      {/* Üst Ana Tablo */}
      <div className="mb-4">
        <ExcelGrid
          headers={headers}
          data={anaUniteler.map(u => ({ ...u, name: u.display_name }))}
          fields={fields}
          onDataChange={setAnaUniteler}
        />
      </div>

      {/* Alt Sabit Tablo */}
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
        <div className="mt-2 text-muted" style={{ fontSize: "0.8rem" }}>
          * Sabit bileşenlerde yapacağınız değişiklikler üstteki tüm kademelere otomatik olarak dağıtılarak kaydedilecektir.
        </div>
      </div>

      {/* Onay Modalı */}
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