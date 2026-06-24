import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";
import AlertModal from "../modals/AlertModal";

// Tablo importların aynen kalıyor...
import KapakTablosu from "../TableComponents/KapakTablosu";
import ParametreTablosu from "../TableComponents/ParametreTablosu";
import CapexTablosu from "../TableComponents/CapexTablosu";
import OpexTablosu from "../TableComponents/OpexTablosu";
import EnerjiIsletmeTablosu from "../TableComponents/EnerjiIsletmeTablosu";
import SarfMalzemeTablosu from "../TableComponents/SarfMalzemeTablosu";
import EnerjiKarsilastirmaTablosu from "../TableComponents/EnerjiKarsilastirmaTablosu";
import KarbonAyakiziTablosu from "../TableComponents/KarbonAyakiziTablosu";
import OnYillikMaliyetTablosu from "../TableComponents/OnYillikMaliyetTablosu";
import AmortismanTablosu from "../TableComponents/AmortismanTablosu";
import BilgiSayfasiTablosu from "../TableComponents/BilgiSayfasiTablosu";
import OzetTablosu from "../TableComponents/OzetTablosu";
import EkipmanTablosu from "../TableComponents/EkipmanTablosu";

function SelectTables() {
  const [activeTab, setActiveTab] = useState(1);

  // Otomatik çalışma durumunu kontrol eden stateler
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingTableName, setGeneratingTableName] = useState("");

  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  // 🌟 AlertModal kontrolü için state
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    title: "",
    message: "",
    type: "success"
  });

  const tablesList = [
    { id: 1, name: "Kapak Tablosu", component: <KapakTablosu /> },
    { id: 2, name: "Parametre Tablosu", component: <ParametreTablosu /> },
    { id: 3, name: "CAPEX", component: <CapexTablosu /> },
    { id: 4, name: "Enerji İşletme Giderleri", component: <EnerjiIsletmeTablosu /> },
    { id: 5, name: "Sarf Malzeme", component: <SarfMalzemeTablosu /> },
    { id: 6, name: "OPEX", component: <OpexTablosu /> },
    { id: 7, name: "Enerji Karşılaştırma", component: <EnerjiKarsilastirmaTablosu /> },
    { id: 8, name: "Karbon Ayakizi", component: <KarbonAyakiziTablosu /> },
    { id: 9, name: "10 Yıllık Maliyet", component: <OnYillikMaliyetTablosu /> },
    { id: 10, name: "Amortisman", component: <AmortismanTablosu /> },
    { id: 11, name: "Bilgi Sayfası", component: <BilgiSayfasiTablosu /> },
    { id: 12, name: "Özet Tablosu", component: <OzetTablosu /> },
    { id: 13, name: "Ekipman Tablosu", component: <EkipmanTablosu /> },
  ];

  // SİHİRLİ OTOMASYON FONKSİYONU
  const handleAutoGenerateAll = async () => {
    setIsGenerating(true);

    // 1. Önce store'daki mevcut tabloları temizliyoruz (Sıfırdan temiz render olsunlar diye)
    updateSection("tables", {});

    // 2. Her tabloyu sırayla açıp render olması için bekliyoruz
    for (let i = 0; i < tablesList.length; i++) {
      const currentTable = tablesList[i];
      setGeneratingTableName(currentTable.name);

      // Sekmeyi aktifleştir (React bunu DOM'a basacak)
      setActiveTab(currentTable.id);

      // Tablonun mount olması ve useEffect'inin çalışması için 400ms bekleme süresi
      // (Bunu bilgisayarın hızına göre 300-500ms arası ayarlayabilirsin)
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    // 3. İşlem bitince modu kapat ve ilk tabloya geri dön
    setIsGenerating(false);
    setGeneratingTableName("");
    setActiveTab(1);
    // Oski alert satırını sil, yerine bunu ekle:
    setAlertConfig({
      show: true,
      title: "İşlem Tamamlandı",
      message: "Tüm tablolar başarıyla baştan hesaplandı ve oluşturuldu!",
      type: "success"
    });
  };

  const currentTable = tablesList.find((t) => t.id === activeTab);

  return (
    <div
      className="container-fluid py-4 d-flex flex-column text-start align-items-stretch"
      style={{ minHeight: "100vh", backgroundColor: "#0b0c0c", overflow: "visible", position: "relative" }}
    >

      {/* ⚠️ TAM EKRAN LOADING PANELİ (Oluşturma esnasında arkaya tıklanmasın diye) */}
      {isGenerating && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(11, 12, 12, 0.9)", zIndex: 9999,
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"
          }}
        >
          <div className="spinner-border text-success mb-3" role="status" style={{ width: "3rem", height: "3rem" }}></div>
          <h4 className="text-white fw-bold">Tablolar Yeniden Oluşturuluyor...</h4>
          <p className="text-white-50" style={{ fontSize: "14px" }}>
            Şu an hazırlanan: <span className="text-success fw-bold">{generatingTableName}</span>
          </p>
        </div>
      )}

      {/* ÜST SABİT BAŞLIK SATIRI */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center flex-grow-1">
          <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.8px", color: "#4ade80" }}>
            Teklif Tabloları
          </span>
          <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)", borderWidth: "1px" }}></div>
        </div>

        {/* TETİKLEYİCİ BUTONUMUZ */}
        <button
          type="button"
          onClick={handleAutoGenerateAll}
          disabled={isGenerating}
          className="btn btn-sm ms-3 px-3 fw-bold text-white border-0"
          style={{
            backgroundColor: "#2563eb",
            fontSize: "11px",
            borderRadius: "6px",
            whiteSpace: "nowrap",
            transition: "0.2s"
          }}
        >
          🔄 Tüm Tabloları Baştan Oluştur
        </button>
      </div>

      <div className="row g-3 flex-grow-1 align-items-start align-content-start">
        {/* SOL YAN MENÜ */}
        <div className="col-12 col-md-2">
          <div className="card border-0 text-white sticky-md-top" style={{ backgroundColor: "#141617", borderRadius: "12px", top: "24px" }}>
            <div className="card-body p-2">
              <div className="row g-1 m-0">
                {tablesList.map((table) => (
                  <div key={table.id} className="col-4 col-md-12 p-1">
                    <button
                      type="button"
                      disabled={isGenerating} // Otomasyon çalışırken menü butonlarını kilitliyoruz
                      className="w-100 border-0 text-center text-md-start py-1.5 py-md-2.5 px-2 rounded-3 text-white"
                      style={{
                        backgroundColor: activeTab === table.id ? "#2e7d32" : "transparent",
                        fontSize: "11px",
                        fontWeight: activeTab === table.id ? "600" : "400",
                        transition: "all 0.15s ease",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                        opacity: isGenerating ? 0.5 : 1
                      }}
                      onClick={() => setActiveTab(table.id)}
                      title={table.name}
                    >
                      {table.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ PANEL: TABLONUN DOĞAL UZAMA ALANI */}
        <div className="col-12 col-md-10">
          <div className="card border-0 text-white" style={{ backgroundColor: "#141617", borderRadius: "12px" }}>
            <div className="card-body py-4 d-flex flex-column gap-3">
              <div className="d-flex align-items-center w-100 mb-2">
                <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.8px", color: "#4ade80", whiteSpace: "nowrap" }}>
                  {currentTable ? currentTable.name.toUpperCase() : "TABLO SEÇİMİ"}
                </span>
                <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)", borderWidth: "1px" }}></div>
              </div>

              <div className="rounded-3" style={{ backgroundColor: "#0d0e0f", border: "1px solid rgba(255,255,255,0.03)", height: "auto", overflow: "visible" }}>
                {currentTable ? currentTable.component : <span className="text-white-50" style={{ fontSize: "12px" }}>Lütfen listeden bir tablo seçin.</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <AlertModal
        show={alertConfig.show}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}

export default SelectTables;