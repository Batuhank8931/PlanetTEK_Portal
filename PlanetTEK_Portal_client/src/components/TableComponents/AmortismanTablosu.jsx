import React, { useState } from "react";

function AmortismanTablosu() {
  // Görseldeki matematiği ve sonuçları veren dinamik veri seti
  const [data, setData] = useState({
    dailyUsage: 70,        // Günlük su kullanımı (m³/gün)
    activeMonths: 7,       // Yılda kaç ay sulama yapıldığı
    waterPrice: 1.59,      // Şebeke suyu birim fiyatı (€)
    plantCost: 327457,     // Atıksu Arıtma Tesisi Maliyeti (€)
    annualOpex: 6537,      // Yıllık İşletme Maliyeti (€) - 19.45 yıl hesabını doğrulayan gizli OPEX değeri
  });

  const [history, setHistory] = useState([]);

  // --- AKSİYON VE GEÇMİŞ YÖNETİMİ ---
  const saveToHistory = (currentState) => {
    setHistory([...history, JSON.stringify(currentState)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setData(JSON.parse(history[history.length - 1]));
    setHistory(history.slice(0, -1));
  };

  const handleChange = (field, value) => {
    saveToHistory(data);
    setData({ ...data, [field]: parseFloat(value) || 0 });
  };

  // --- MATEMATİKSEL HESAPLAMALAR ---
  // Şebeke Suyu Senaryosu
  const monthlyUsage = data.dailyUsage * 30; // Aylık kullanım
  const yearlyUsage = monthlyUsage * data.activeMonths; // Yıllık aktif kullanım
  const yearlyWaterCost = yearlyUsage * data.waterPrice; // Yıllık şebeke suyu faturası

  // Amortisman (ROI) Senaryosu
  // Net Kazanç = (Şebeke suyuna ödenecek para) - (Tesisin yıllık işletme maliyeti)
  const netAnnualSaving = yearlyWaterCost - data.annualOpex; 
  
  // Amortisman Süresi
  const roiYears = netAnnualSaving > 0 ? data.plantCost / netAnnualSaving : 0;
  const roiMonths = roiYears * 12;

  // Tam Yıl Değeri (Özet metni için)
  const exactYearRound = Math.floor(roiYears);

  return (
    <div className="d-flex flex-column gap-3 w-100 text-white">
      
      <style>{`
        .amort-cell {
          border-right: 1px solid #334155;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0.75rem;
        }
        .amort-cell:last-child {
          border-right: none;
        }
        .amort-input {
          font-size: 14px;
          box-shadow: none;
          width: 80px;
          text-align: center;
          border-bottom: 1px dashed #475569 !important;
          color: white;
          font-weight: bold;
        }
        .amort-input:focus {
          outline: none;
          background-color: rgba(255, 255, 255, 0.08) !important;
          border-bottom: 1px solid #60a5fa !important;
        }
        .title-bg { background-color: #090d16; color: #94a3b8; }
        .unit-bg { background-color: #1e293b; color: #cbd5e1; font-size: 11px; font-weight: bold; }
        .value-bg { background-color: #151f32; }
      `}</style>

      {/* ÜST PANEL: GERİ AL VE OPEX AYARI */}
      <div className="d-flex justify-content-between align-items-end mb-1">
        <div className="d-flex flex-column gap-1">
          <span className="text-white-50" style={{ fontSize: "11px" }}>
            * Amortisman hesabına dahil edilen Yıllık İşletme Maliyeti (OPEX):
          </span>
          <div className="d-flex align-items-center gap-2 bg-dark px-2 py-1 rounded border" style={{ borderColor: "#334155", width: "fit-content" }}>
            <input 
              type="number" 
              className="form-control form-control-sm bg-transparent border-0 text-warning fw-bold p-0 text-end" 
              style={{ width: "60px", fontSize: "13px", boxShadow: "none" }}
              value={data.annualOpex} 
              onChange={(e) => handleChange("annualOpex", e.target.value)} 
            />
            <span className="text-white-50" style={{ fontSize: "12px" }}>€ / yıl</span>
          </div>
        </div>

        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1"
          style={{ backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a", fontSize: "11px", borderRadius: "6px", opacity: history.length === 0 ? 0.4 : 1 }}
        >
          ↶ Geri Al
        </button>
      </div>

      {/* BÜYÜK TABLO YAPISI */}
      <div className="d-flex flex-column rounded-3 overflow-hidden border" style={{ borderColor: "#475569" }}>
        
        {/* ==========================================
            BÖLÜM 1: ŞEBEKE SUYU MALİYETİ
           ========================================== */}
        <div className="d-flex align-items-stretch border-bottom" style={{ borderColor: "#334155" }}>
          
          {/* Sol Başlık */}
          <div className="amort-cell title-bg fw-bold text-uppercase" style={{ width: "25%", fontSize: "12px", letterSpacing: "0.5px" }}>
            Sulama Amaçlı Şebeke<br/>Suyu Kullanılırsa
          </div>

          {/* Sağ Grid (5 Kolon) */}
          <div className="d-flex flex-column" style={{ width: "75%" }}>
            
            {/* Başlıklar */}
            <div className="d-flex align-items-stretch border-bottom" style={{ borderColor: "#334155" }}>
              <div className="amort-cell title-bg" style={{ width: "20%", fontSize: "11px", fontWeight: "700" }}>Günlük su kullanımı</div>
              <div className="amort-cell title-bg" style={{ width: "20%", fontSize: "11px", fontWeight: "700" }}>Aylık su kullanımı</div>
              <div className="amort-cell title-bg" style={{ width: "20%", fontSize: "11px", fontWeight: "700" }}>Yılda <input type="number" className="bg-transparent border-0 text-center text-info fw-bold mx-1 p-0" style={{ width: "20px", outline: "none" }} value={data.activeMonths} onChange={(e) => handleChange("activeMonths", e.target.value)} /> ay su kullanımı</div>
              <div className="amort-cell title-bg" style={{ width: "20%", fontSize: "11px", fontWeight: "700" }}>Şebeke suyu birim fiyatı</div>
              <div className="amort-cell title-bg text-warning" style={{ width: "20%", fontSize: "11px", fontWeight: "700" }}>Toplam yıllık su bedeli</div>
            </div>

            {/* Birimler */}
            <div className="d-flex align-items-stretch border-bottom" style={{ borderColor: "#334155" }}>
              <div className="amort-cell unit-bg" style={{ width: "20%" }}>BİRİM</div>
              <div className="amort-cell unit-bg" style={{ width: "20%" }}>m³/ay</div>
              <div className="amort-cell unit-bg" style={{ width: "20%" }}>m³/yıl</div>
              <div className="amort-cell unit-bg" style={{ width: "20%" }}>€</div>
              <div className="amort-cell unit-bg" style={{ width: "20%" }}>€/yıl</div>
            </div>

            {/* Değerler */}
            <div className="d-flex align-items-stretch value-bg">
              <div className="amort-cell" style={{ width: "20%" }}>
                <div className="d-flex align-items-center gap-1">
                  <input type="number" className="form-control form-control-sm bg-transparent border-0 amort-input" value={data.dailyUsage} onChange={(e) => handleChange("dailyUsage", e.target.value)} />
                </div>
              </div>
              <div className="amort-cell text-white fw-bold" style={{ width: "20%", fontSize: "14px" }}>
                {monthlyUsage.toLocaleString()}
              </div>
              <div className="amort-cell text-white fw-bold" style={{ width: "20%", fontSize: "14px" }}>
                {yearlyUsage.toLocaleString()}
              </div>
              <div className="amort-cell" style={{ width: "20%" }}>
                <input type="number" step="0.01" className="form-control form-control-sm bg-transparent border-0 amort-input" value={data.waterPrice} onChange={(e) => handleChange("waterPrice", e.target.value)} />
              </div>
              <div className="amort-cell text-warning fw-extrabold" style={{ width: "20%", fontSize: "15px" }}>
                {Math.round(yearlyWaterCost).toLocaleString()}
              </div>
            </div>

          </div>
        </div>

        {/* ==========================================
            BÖLÜM 2: ARITMA TESİSİ AMORTİSMANI
           ========================================== */}
        <div className="d-flex align-items-stretch border-bottom" style={{ borderColor: "#334155" }}>
          
          {/* Sol Bilgi */}
          <div className="d-flex flex-column" style={{ width: "40%", borderRight: "1px solid #334155" }}>
            <div className="d-flex align-items-stretch h-100">
              <div className="amort-cell title-bg fw-bold text-uppercase" style={{ width: "62.5%", fontSize: "11px", letterSpacing: "0.5px" }}>
                Sulama Amaçlı Evsel Atıksu Arıtma Tesisinden Çıkan Su Kullanılırsa
              </div>
              <div className="d-flex flex-column" style={{ width: "37.5%" }}>
                <div className="amort-cell title-bg" style={{ fontSize: "11px", fontWeight: "700", borderRight: "none" }}>Atıksu Arıtma Tesisi Yaklaşık Maliyeti</div>
                <div className="amort-cell unit-bg" style={{ borderRight: "none", borderTop: "1px solid #334155", borderBottom: "1px solid #334155" }}>€</div>
                <div className="amort-cell value-bg h-100" style={{ borderRight: "none" }}>
                  <input type="number" className="form-control form-control-sm bg-transparent border-0 amort-input text-info" style={{ width: "100px", fontSize: "15px" }} value={data.plantCost} onChange={(e) => handleChange("plantCost", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Büyük Sonuç Alanı */}
          <div className="d-flex flex-column" style={{ width: "60%" }}>
            <div className="amort-cell fw-extrabold text-white" style={{ fontSize: "20px", backgroundColor: "#cbd5e1", color: "#0f172a", borderRight: "none" }}>
              <span style={{ color: "#0f172a" }}>Atıksu Arıtma Tesisinin Amorti Etme Süresi</span>
            </div>
            <div className="d-flex align-items-stretch border-top h-100" style={{ borderColor: "#334155" }}>
              
              {/* Yıl Sonucu */}
              <div className="d-flex flex-column" style={{ width: "50%", borderRight: "1px solid #334155" }}>
                <div className="amort-cell unit-bg" style={{ borderRight: "none", borderBottom: "1px solid #334155" }}>Yıl</div>
                <div className="amort-cell value-bg h-100 fw-extrabold" style={{ borderRight: "none", fontSize: "42px", color: "#f8fafc", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
                  {roiYears > 0 ? roiYears.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0"}
                </div>
              </div>

              {/* Ay Sonucu */}
              <div className="d-flex flex-column" style={{ width: "50%" }}>
                <div className="amort-cell unit-bg" style={{ borderRight: "none", borderBottom: "1px solid #334155" }}>Ay</div>
                <div className="amort-cell value-bg h-100 fw-extrabold" style={{ borderRight: "none", fontSize: "42px", color: "#f8fafc", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
                  {roiMonths > 0 ? Math.round(roiMonths).toLocaleString() : "0"}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ==========================================
            BÖLÜM 3: ÖZET METİNLERİ
           ========================================== */}
        <div className="d-flex flex-column value-bg">
          <div className="p-3 text-center border-bottom" style={{ borderColor: "#334155" }}>
            <span className="text-white" style={{ fontSize: "14px" }}>Arıtma tesisi yaklaşık </span>
            <span className="fw-extrabold mx-2" style={{ fontSize: "28px", color: "#ef4444" }}>{exactYearRound}</span>
            <span className="text-white fw-bold" style={{ fontSize: "14px" }}>YILDA</span>
            <span className="text-white" style={{ fontSize: "14px" }}> kendini amorti etmektedir.</span>
          </div>
          <div className="p-2 text-center" style={{ backgroundColor: "#1e293b" }}>
            <i className="fw-bold" style={{ fontSize: "12px", color: "#ef4444" }}>
              Amortisman süresinde işletme maliyetleri göz önünde tutulmuştur.
            </i>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AmortismanTablosu;