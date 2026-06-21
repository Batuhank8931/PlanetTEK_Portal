import React, { useState } from "react";

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
  const [activeTab, setActiveTab] = useState(1); // CAPEX varsayılan

  const tablesList = [
    { id: 1, name: "1. Kapak Tablosu", component: <KapakTablosu /> },
    { id: 2, name: "2. Parametre Tablosu", component: <ParametreTablosu /> },
    { id: 3, name: "3. CAPEX", component: <CapexTablosu /> },
    { id: 4, name: "4. OPEX", component: <OpexTablosu /> },
    { id: 5, name: "5. Enerji İşletme Giderleri", component: <EnerjiIsletmeTablosu /> },
    { id: 6, name: "6. Sarf Malzeme", component: <SarfMalzemeTablosu /> },
    { id: 7, name: "7. Enerji Karşılaştırma", component: <EnerjiKarsilastirmaTablosu /> },
    { id: 8, name: "8. Karbon Ayakizi", component: <KarbonAyakiziTablosu /> },
    { id: 9, name: "9. 10 Yıllık Maliyet", component: <OnYillikMaliyetTablosu /> },
    { id: 10, name: "10. Amortisman", component: <AmortismanTablosu /> },
    { id: 11, name: "11. Bilgi Sayfası", component: <BilgiSayfasiTablosu /> },
    { id: 12, name: "12. Özet Tablosu", component: <OzetTablosu /> },
    { id: 13, name: "13. Ekipman Tablosu", component: <EkipmanTablosu /> },
  ];

  const currentTable = tablesList.find((t) => t.id === activeTab);

  return (
    <div
      className="container-fluid py-4 d-flex flex-column text-start align-items-stretch"
      style={{ minHeight: "100vh", backgroundColor: "#0b0c0c", overflow: "visible" }}
    >

      {/* ÜST SABİT BAŞLIK SATIRI */}
      <div className="d-flex align-items-center mb-0 mb-md-4">
        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.8px", color: "#4ade80" }}>
          Teklif Tabloları
        </span>
        <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)", borderWidth: "1px" }}></div>
      </div>

      {/* KRİTİK DEĞİŞİKLİK: align-content-start eklenerek mobilde aradaki boşluk tamamen yok edildi */}
      <div className="row g-3 flex-grow-1 align-items-start align-content-start">

        {/* SOL YAN MENÜ */}
        <div className="col-12 col-md-2">
          <div
            className="card border-0 text-white sticky-md-top"
            style={{ backgroundColor: "#141617", borderRadius: "12px", top: "24px" }}
          >
            <div className="card-body p-2">
              <div className="row g-1 m-0">
                {tablesList.map((table) => (
                  <div key={table.id} className="col-4 col-md-12 p-1">
                    <button
                      type="button"
                      className="w-100 border-0 text-center text-md-start py-1.5 py-md-2.5 px-2 rounded-3 text-white"
                      style={{
                        backgroundColor: activeTab === table.id ? "#2e7d32" : "transparent",
                        fontSize: "11px",
                        fontWeight: activeTab === table.id ? "600" : "400",
                        transition: "all 0.15s ease",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block"
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
          <div
            className="card border-0 text-white"
            style={{ backgroundColor: "#141617", borderRadius: "12px" }}
          >
            <div className="card-body py-4 d-flex flex-column gap-3">
              <div className="d-flex align-items-center w-100 mb-2">
                <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.8px", color: "#4ade80", whiteSpace: "nowrap" }}>
                  {currentTable ? currentTable.name.toUpperCase() : "TABLO SEÇİMİ"}
                </span>
                <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)", borderWidth: "1px" }}></div>
              </div>

              <div
                className="rounded-3"
                style={{
                  backgroundColor: "#0d0e0f",
                  border: "1px solid rgba(255,255,255,0.03)",
                  height: "auto",
                  overflow: "visible"
                }}
              >
                {currentTable ? currentTable.component : <span className="text-white-50" style={{ fontSize: "12px" }}>Lütfen listeden bir tablo seçin.</span>}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default SelectTables;