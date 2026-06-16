import React, { useState } from "react";
import AnaUnite from "./FiyatlarComponents/AnaUnite";
import Izgara from "./FiyatlarComponents/Izgara";
import Lamella from "./FiyatlarComponents/Lamella";
import KapakGovde from "./FiyatlarComponents/KapakGovde";
import DebiDagitim from "./FiyatlarComponents/DebiDagitim";
import IscilikMaliyetleri from "./FiyatlarComponents/IscilikMaliyetleri";

function FiyatlarPage() {
  const [activeTab, setActiveTab] = useState("anaUniteler");

  return (
    <div
      className="container-fluid pb-5 min-vh-100"
      style={{
        fontSize: "14px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#1a2d3a",
        paddingTop: typeof window !== "undefined" && window.innerWidth < 768 ? "75px" : "20px"
      }}
    >
      {/* BAŞLIK ALANI */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-3 border-bottom gap-3" style={{ borderColor: "#334155" }}>
        <div>
          <h5 className="mb-1 fw-semibold tracking-tight" style={{ color: "#ffffff" }}>
            <i className="bi bi-currency-exchange me-2" style={{ color: "#4ade80" }}></i>Fiyat Yönetim Paneli
          </h5>
        </div>
      </div>

      {/* DİNAMİK GRUP SEKMELERİ (TABS) */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <button className={`btn btn-sm ${activeTab === "anaUniteler" ? "btn-info text-dark fw-bold" : "btn-outline-secondary text-white"}`} onClick={() => setActiveTab("anaUniteler")}>
          1. Ana Üniteler &amp; Panolar
        </button>
        <button className={`btn btn-sm ${activeTab === "izgaralar" ? "btn-info text-dark fw-bold" : "btn-outline-secondary text-white"}`} onClick={() => setActiveTab("izgaralar")}>
          2. Kapasite &amp; Izgaralar
        </button>
        <button className={`btn btn-sm ${activeTab === "lamellalar" ? "btn-info text-dark fw-bold" : "btn-outline-secondary text-white"}`} onClick={() => setActiveTab("lamellalar")}>
          3. Lamella Grupları
        </button>
        <button className={`btn btn-sm ${activeTab === "paslanmazKapak" ? "btn-info text-dark fw-bold" : "btn-outline-secondary text-white"}`} onClick={() => setActiveTab("paslanmazKapak")}>
          4. Paslanmaz &amp; Kapak-Gövde
        </button>
        <button className={`btn btn-sm ${activeTab === "debiDagitim" ? "btn-info text-dark fw-bold" : "btn-outline-secondary text-white"}`} onClick={() => setActiveTab("debiDagitim")}>
          5. Debi Dağıtım (Çıkışlar)
        </button>
        <button className={`btn btn-sm ${activeTab === "iscilik" ? "btn-info text-dark fw-bold" : "btn-outline-secondary text-white"}`} onClick={() => setActiveTab("iscilik")}>
          6. İşçilik Maliyetleri
        </button>
      </div>

      {/* SEKMEYE GÖRE İLGİLİ BİLEŞENİN ÇAĞRILMASI */}
      <div className="tab-content">
        {activeTab === "anaUniteler" && <AnaUnite />}
        {activeTab === "izgaralar" && <Izgara />}
        {activeTab === "lamellalar" && <Lamella />}
        {activeTab === "paslanmazKapak" && <KapakGovde />}
        {activeTab === "debiDagitim" && <DebiDagitim />}
        {activeTab === "iscilik" && <IscilikMaliyetleri />}
      </div>
    </div>
  );
}

export default FiyatlarPage;