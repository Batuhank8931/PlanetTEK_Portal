import React, { useEffect, useState } from "react";
import { useTeklifStore } from "../../../utils/teklifStore";

function SludgeDewateringDetail() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const equipmentsCache = formData.equipments || {};
  const storeDewatering = equipmentsCache.sludgeDewatering || {};

  // --- 1. LOCAL STATE / INPUT KONTROLLERİ (Kullanıcı elle değiştirebilsin diye) ---
  const [camurPompasi, setCamurPompasi] = useState(storeDewatering.camurPompasi || "5 m³/h, 1.5 kW");
  const [poliDozlama, setPoliDozlama] = useState(storeDewatering.poliDozlama || "200 L/h, 1.1 kW");
  const [suzuntuPompasi, setSuzuntuPompasi] = useState(storeDewatering.suzuntuPompasi || "3 m³/h, 0.75 kW");
  
  // 3. Seçenek: Seçim alanı (Default: Dekantör)
  const [secilenEkipmanTipi, setSecilenEkipmanTipi] = useState(storeDewatering.ekipmanTipi || "Dekantör");

  // --- 2. SEÇİM DETAYLARI (Sabit Metin Karşılıkları) ---
  const ekipmanDetaylari = {
    "Dekantör": "Dekantör (3 m³/h)",
    "Filtrepres": "Filtrepres (300 L/şarj - 33 Plaka)"
  };

  // --- 3. MERKEZİ STORE EŞZAMANLAMA (SYNC EFFECT) ---
  useEffect(() => {
    // Store'a gidecek tertemiz, minimal JSON yapısı
    const dewateringOzeti = {
      camurPompasi,
      poliDozlama,
      ekipmanTipi: secilenEkipmanTipi,
      ekipmanMetni: ekipmanDetaylari[secilenEkipmanTipi],
      suzuntuPompasi
    };

    updateSection("equipments", {
      ...equipmentsCache,
      sludgeDewatering: dewateringOzeti
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camurPompasi, poliDozlama, secilenEkipmanTipi, suzuntuPompasi]);

  return (
    <div className="d-flex flex-column gap-3 text-white">
      {/* BAŞLIK PANELİ */}
      <div className="d-flex align-items-center">
        <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
          Çamur Susuzlaştırma Sistemi Konfigürasyonu
        </span>
        <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
      </div>

      {/* ANA PARAMETRE VE SEÇİM PANELİ */}
      <div className="p-3 rounded" style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
        <div className="row g-3 align-items-end">
          
          {/* 3. SEÇENEK: DEKANTÖR / FİLTREPRES SEÇİMİ (EN BAŞTA) */}
          <div className="col-md-4 col-12">
            <label className="form-label mb-1 text-warning" style={{ fontSize: "11px", fontWeight: "600" }}>
              Ana Susuzlaştırma Ekipmanı Seçimi
            </label>
            <select
              className="form-select form-select-sm text-white fw-bold border-0 text-center"
              style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", border: "1px solid #f59e0b !important", borderRadius: "6px", fontSize: "12px", height: "32px" }}
              value={secilenEkipmanTipi}
              onChange={(e) => setSecilenEkipmanTipi(e.target.value)}
            >
              <option value="Dekantör" style={{ backgroundColor: "#1e293b" }}>Dekantör</option>
              <option value="Filtrepres" style={{ backgroundColor: "#1e293b" }}>Filtrepres</option>
            </select>
          </div>

          {/* SEÇİLEN EKİPMANIN ÖZET GÖSTERİM KUTUSU */}
          <div className="col-md-8 col-12">
            <label className="form-label mb-1 text-white-50" style={{ fontSize: "11px" }}>Seçilen Ünite Kapasite Detayı</label>
            <div className="form-control form-control-sm text-success fw-bold border-0 text-center d-flex align-items-center justify-content-center"
              style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", height: "32px", fontSize: "12px" }}>
              {ekipmanDetaylari[secilenEkipmanTipi]}
            </div>
          </div>

        </div>
      </div>

      {/* --- ELLE DEĞİŞTİRİLEBİLİR METİN INPUTLARI GÖRSEL PANELİ --- */}
      <div className="card-body d-flex flex-column gap-3" style={{ padding: 0 }}>
        
        <div className="row g-2">
          
          {/* 1. Susuzlaştırma Çamur Pompası */}
          <div className="col-md-4">
            <div className="p-2 rounded h-100 d-flex flex-column gap-1" style={{ backgroundColor: "#1e293b", border: "1px solid #ef4444" }}>
              <label className="text-white-50" style={{ fontSize: "10px", fontWeight: "600" }}>SUSUZLAŞTIRMA ÇAMUR POMPASI</label>
              <input
                type="text"
                className="form-control form-control-sm text-white bg-transparent border-0 p-0 fw-bold"
                style={{ fontSize: "12px", boxShadow: "none" }}
                value={camurPompasi}
                onChange={(e) => setCamurPompasi(e.target.value)}
                placeholder="Örn: 5 m³/h, 1.5 kW"
              />
              <span className="text-white-50" style={{ fontSize: "8px" }}>Değiştirmek için üzerine tıklayın</span>
            </div>
          </div>

          {/* 2. Poli Dozlama Ünitesi */}
          <div className="col-md-4">
            <div className="p-2 rounded h-100 d-flex flex-column gap-1" style={{ backgroundColor: "#1e293b", border: "1px solid #38bdf8" }}>
              <label className="text-info" style={{ fontSize: "10px", fontWeight: "600" }}>POLİ DOZLAMA ÜNİTESİ</label>
              <input
                type="text"
                className="form-control form-control-sm text-white bg-transparent border-0 p-0 fw-bold"
                style={{ fontSize: "12px", boxShadow: "none" }}
                value={poliDozlama}
                onChange={(e) => setPoliDozlama(e.target.value)}
                placeholder="Örn: 200 L/h, 1.1 kW"
              />
              <span className="text-white-50" style={{ fontSize: "8px" }}>Değiştirmek için üzerine tıklayın</span>
            </div>
          </div>

          {/* 4. Süzüntü Suyu Pompası */}
          <div className="col-md-4">
            <div className="p-2 rounded h-100 d-flex flex-column gap-1" style={{ backgroundColor: "#1e293b", border: "1px solid #a855f7" }}>
              <label className="text-white-50" style={{ fontSize: "10px", fontWeight: "600" }}>SÜZÜNTÜ SUYU POMPASI</label>
              <input
                type="text"
                className="form-control form-control-sm text-white bg-transparent border-0 p-0 fw-bold"
                style={{ fontSize: "12px", boxShadow: "none" }}
                value={suzuntuPompasi}
                onChange={(e) => setSuzuntuPompasi(e.target.value)}
                placeholder="Örn: 3 m³/h, 0.75 kW"
              />
              <span className="text-white-50" style={{ fontSize: "8px" }}>Değiştirmek için üzerine tıklayın</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default SludgeDewateringDetail;