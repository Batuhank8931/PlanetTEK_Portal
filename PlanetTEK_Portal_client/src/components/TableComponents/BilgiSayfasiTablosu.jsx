import React, { useState } from "react";

function BilgiSayfasiTablosu() {
  // Tüm sayfa içeriğini barındıran devasa ve esnek state yapısı
  const [data, setData] = useState({
    title1: "İSKİ",
    title2: "70 m³/gün Kapasiteli - Deşarj Niteliği",
    title3: "Dönen Biyolojik Disk Atıksu Arıtma Tesisi Teklifi",
    
    detailsHeader: "PROJE DETAYLARI",
    projectDetails: [
      { id: 1, label: "Kapasite", value: ": 3.000 Kişi", isUrgent: true },
      { id: 2, label: "Kişi Başı Hidrolik Yük", value: ": 200 lt/kişi.gün", isUrgent: true },
      { id: 3, label: "Kişi Başı Organik Yük", value: ": 60 gr/kişi.gün", isUrgent: true },
      { id: 4, label: "Hidrolik Yük", value: ": 70 m³/gün", isUrgent: false },
      { id: 5, "label": "Organik Yük", "value": ": 25 kg/gün (70 m³/gün x 350 mg/l)", isUrgent: false },
      { id: 6, label: "Ön Arıtmada Giderilen Organik Yük", value: ": 8.25 kg/gün ( 33% )", isUrgent: false },
      { id: 7, label: "PlanetDISK® Ünitesine Giren Organik Yük", value: ": 16.75 kg/gün", isUrgent: false },
      { id: 8, label: "Atıksu Sıcaklığı", value: ": Min 15°C-Maks 32°C", isUrgent: false },
      { id: 9, label: "Kabul Edilen Atıksu Sıcaklığı", value: ": 19 °C", isUrgent: false },
      { id: 10, label: "Atıksuyun PlanetDISK® Ünitesinde Bekleme Süresi", value: ": 12.34 saat (>45 dakika minimum)", isUrgent: false }
    ],
    noteText: "*Bu parametreler müşteri tarafından verilmiştir/ deneyimlerimiz ve literatür değerlerine göre seçilmiştir.",
    
    sourceHeader: "Atıksu Kaynağı",
    sourceText: "Tuvaletlerden ve her türlü tüketimden kaynaklanan evsel atıksular alınacaktır.\nTesise yemekhanelerden kaynaklanan yağ içerikli atıksular yağ kapanından geçirilmeden alınmayacaktır. Ayrıca yağmur suyu girişi olmayacaktır.",
    
    systemHeader: "Önerilen Sistem",
    systemText: "· 8 adet PlanetDISK® MX 1 ünitesi - 0 adet, 2.05 m çaplı disk, CTP (fiber) gövde.\n· TOPLAM 0 disk x 6.6 m² x 8 adet = 0 m² yüzey alanı.\n· 1 adet LS 45 Lamella Seperatör Çökeltim Tankı, CTP (fiber) gövde.\n· TOPLAM 45 m² x 1 adet = 45 m² lamella yüzey alanı.",
    
    calcHeader: "Disk Yüzey Alanı Hesaplaması",
    calcText: "π x r x r x 2 taraf x 0 disk/unite -> 3,14 x 1.025 x 1.025 x 2 x 0 = 0 m²/unite"
  });

  const [history, setHistory] = useState([]);

  // --- AKSİYON YÖNETİMİ ---
  const saveToHistory = (currentState) => {
    setHistory([...history, JSON.stringify(currentState)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setData(JSON.parse(history[history.length - 1]));
    setHistory(history.slice(0, -1));
  };

  // Serbest metinleri (başlıklar, paragraflar) güncelleyen fonksiyon
  const handleTextChange = (field, value) => {
    saveToHistory(data);
    setData({ ...data, [field]: value });
  };

  // Tablo satırlarını güncelleyen fonksiyon
  const handleRowChange = (id, field, value) => {
    saveToHistory(data);
    const updatedRows = data.projectDetails.map(row => row.id === id ? { ...row, [field]: value } : row);
    setData({ ...data, projectDetails: updatedRows });
  };

  const toggleRowUrgent = (id) => {
    saveToHistory(data);
    const updatedRows = data.projectDetails.map(row => row.id === id ? { ...row, isUrgent: !row.isUrgent } : row);
    setData({ ...data, projectDetails: updatedRows });
  };

  const insertAfterRow = (index) => {
    saveToHistory(data);
    const newId = `detail_${Date.now()}`;
    const newRow = { id: newId, label: "Yeni Parametre", value: ": Değer", isUrgent: false };
    const updatedRows = [...data.projectDetails];
    updatedRows.splice(index + 1, 0, newRow);
    setData({ ...data, projectDetails: updatedRows });
  };

  const deleteRow = (id) => {
    saveToHistory(data);
    const updatedRows = data.projectDetails.filter(row => row.id !== id);
    setData({ ...data, projectDetails: updatedRows });
  };

  return (
    <div className="d-flex flex-column gap-3 w-100 text-white">
      
      <style>{`
        .info-input {
          background: transparent;
          border: none;
          box-shadow: none;
          color: white;
          width: 100%;
        }
        .info-input:focus {
          outline: none;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .info-textarea {
          resize: none;
          overflow: hidden;
        }
        .detail-row {
          border-bottom: 1px solid #334155;
          transition: background-color 0.15s ease;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .bg-normal { background-color: #1e293b; }
        .bg-urgent { background-color: #991b1b; }
        .section-header {
          font-size: 14px;
          font-weight: 800;
          text-decoration: underline;
          text-align: center;
          text-underline-offset: 4px;
        }
      `}</style>

      {/* ÜST PANEL: GERİ AL BUTONU */}
      <div className="d-flex justify-content-end align-items-center mb-1">
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1"
          style={{ backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a", fontSize: "11px", borderRadius: "6px", opacity: history.length === 0 ? 0.4 : 1 }}
        >
          ↶ Geri Al ({history.length})
        </button>
      </div>

      {/* SAYFA İÇERİĞİ KAPSAYICISI (Görseldeki beyaz sayfa efekti için hafif belirgin bir kart) */}
      <div className="d-flex flex-column p-4 rounded-3 border" style={{ backgroundColor: "#0f172a", borderColor: "#334155" }}>
        
        {/* ==================== 1. ANA BAŞLIKLAR (Titles) ==================== */}
        <div className="d-flex flex-column align-items-center gap-1 mb-5">
          <input 
            type="text" 
            className="info-input text-center fw-extrabold" 
            style={{ fontSize: "20px" }} 
            value={data.title1} 
            onChange={(e) => handleTextChange("title1", e.target.value)} 
          />
          <input 
            type="text" 
            className="info-input text-center fw-bold" 
            style={{ fontSize: "16px" }} 
            value={data.title2} 
            onChange={(e) => handleTextChange("title2", e.target.value)} 
          />
          <input 
            type="text" 
            className="info-input text-center fw-bold" 
            style={{ fontSize: "16px" }} 
            value={data.title3} 
            onChange={(e) => handleTextChange("title3", e.target.value)} 
          />
        </div>

        {/* ==================== 2. PROJE DETAYLARI TABLOSU ==================== */}
        <div className="mb-4">
          <input 
            type="text" 
            className="info-input section-header mb-3" 
            value={data.detailsHeader} 
            onChange={(e) => handleTextChange("detailsHeader", e.target.value)} 
          />
          
          <div className="d-flex flex-column rounded-3 overflow-hidden border" style={{ borderColor: "#334155" }}>
            {data.projectDetails.map((row, index) => (
              <div key={row.id} className={`d-flex align-items-stretch detail-row ${row.isUrgent ? 'bg-urgent' : 'bg-normal'}`}>
                
                {/* Parametre Adı */}
                <div className="p-2 px-3 d-flex align-items-center" style={{ width: "45%" }}>
                  <input
                    type="text"
                    className="info-input fw-bold"
                    style={{ fontSize: "12px" }}
                    value={row.label}
                    onChange={(e) => handleRowChange(row.id, "label", e.target.value)}
                  />
                </div>
                
                {/* Parametre Değeri */}
                <div className="p-2 px-3 d-flex align-items-center" style={{ width: "45%" }}>
                  <input
                    type="text"
                    className="info-input"
                    style={{ fontSize: "12px" }}
                    value={row.value}
                    onChange={(e) => handleRowChange(row.id, "value", e.target.value)}
                  />
                </div>

                {/* Aksiyon Paneli (Renk Değiştir, Ekle, Sil) */}
                <div className="p-1 d-flex align-items-center justify-content-center gap-2 border-start" style={{ width: "10%", borderColor: "rgba(255,255,255,0.1) !important" }}>
                  <button onClick={() => toggleRowUrgent(row.id)} className="btn btn-sm p-0 border-0 text-warning opacity-50 hover-opacity-100" title="Kırmızı Vurgu (Aç/Kapat)">★</button>
                  <button onClick={() => insertAfterRow(index)} className="btn btn-sm p-0 border-0 text-success opacity-50 hover-opacity-100 fw-bold" style={{ fontSize: "15px", lineHeight: "1" }} title="Altına Satır Ekle">+</button>
                  <button onClick={() => deleteRow(row.id)} className="btn btn-sm p-0 border-0 text-danger opacity-50 hover-opacity-100" style={{ fontSize: "16px", lineHeight: "1" }} title="Satırı Sil">&times;</button>
                </div>
              </div>
            ))}
          </div>

          {/* Kırmızı Alt Not */}
          <div className="mt-3 text-center">
            <input 
              type="text" 
              className="info-input fw-bold text-center" 
              style={{ fontSize: "11px", color: "#ef4444" }} 
              value={data.noteText} 
              onChange={(e) => handleTextChange("noteText", e.target.value)} 
            />
          </div>
        </div>

        {/* ==================== 3. ATIKSU KAYNAĞI ==================== */}
        <div className="mb-4">
          <input 
            type="text" 
            className="info-input section-header mb-2" 
            value={data.sourceHeader} 
            onChange={(e) => handleTextChange("sourceHeader", e.target.value)} 
          />
          <textarea 
            className="info-input info-textarea text-center" 
            rows={3}
            style={{ fontSize: "13px", lineHeight: "1.6" }} 
            value={data.sourceText} 
            onChange={(e) => handleTextChange("sourceText", e.target.value)} 
          />
        </div>

        {/* ==================== 4. ÖNERİLEN SİSTEM ==================== */}
        <div className="mb-4">
          <input 
            type="text" 
            className="info-input section-header mb-2" 
            value={data.systemHeader} 
            onChange={(e) => handleTextChange("systemHeader", e.target.value)} 
          />
          <textarea 
            className="info-input info-textarea" 
            rows={5}
            style={{ fontSize: "13px", lineHeight: "1.6", paddingLeft: "10%" }} 
            value={data.systemText} 
            onChange={(e) => handleTextChange("systemText", e.target.value)} 
          />
        </div>

        {/* ==================== 5. DİSK YÜZEY ALANI HESAPLAMASI ==================== */}
        <div className="mb-2">
          <input 
            type="text" 
            className="info-input section-header mb-2" 
            value={data.calcHeader} 
            onChange={(e) => handleTextChange("calcHeader", e.target.value)} 
          />
          <input 
            type="text" 
            className="info-input text-center" 
            style={{ fontSize: "13px" }} 
            value={data.calcText} 
            onChange={(e) => handleTextChange("calcText", e.target.value)} 
          />
        </div>

      </div>

    </div>
  );
}

export default BilgiSayfasiTablosu;