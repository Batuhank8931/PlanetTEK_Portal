import React, { useState } from "react";

function CalculationPage() {
  // 1. DİNAMİK DİSK SINIRLARI MATRİSİ STATE'İ
  const [diskMatrisi, setDiskMatrisi] = useState({
    MX: {
      evsel: { minDisk: 100, maxDisk: 140 },
      endustriyel: { minDisk: 90, maxDisk: 100 }
    },
    MINI: {
      evsel: { minDisk: 50, maxDisk: 75 },
      endustriyel: { minDisk: 45, maxDisk: 65 }
    }
  });

  // 2. DİNAMİK NİTRİFİKASYON MATRİSİ STATE'İ
  const [nitrifikasyonKatsayilari, setNitrifikasyonKatsayilari] = useState([
    { min: 23.01, max: "Infinity", katsayi: 1.7, etiket: "☀️ Sıcaklık > 23 °C", renk: "#4ade80" },
    { min: 17,    max: 23,       katsayi: 1.4, etiket: "⛅ Sıcaklık 17 - 23 °C", renk: "#38bdf8" },
    { min: 13,    max: 16.99,    katsayi: 1.0, etiket: "🌤️ Sıcaklık 13 - 16 °C", renk: "#facc15" },
    { min: "-Infinity", max: 12.99,katsayi: 0.6, etiket: "❄️ Sıcaklık < 13 °C", renk: "#f87171" }
  ]);

  // 3. YENİ: GİDERİM KABULLERİ VE MODEL METRİKLERİ STATE'İ
  const [giderimKabulleri, setGiderimKabulleri] = useState({
    boiEmperik: 22,
    maksBeklemeSuresi: 1.28,
    mx1Hacim: 4.5,
    mx1Cap: 2.05,
    miniHacim: 2,
    miniCap: 1.35
  });

  // 4. YENİ: LAMELLE HACİM VE ALAN MATRİSİ STATE'İ
  const [lamelleMatrisi, setLamelleMatrisi] = useState([
    { model: "LS 8", hacim: 1, alan: 8 },
    { model: "LS 15", hacim: 1.5, alan: 15 },
    { model: "LS 30", hacim: 3, alan: 30 },
    { model: "LS 45", hacim: 4.5, alan: 45 }
  ]);

  // Handler Fonksiyonları
  const handleDiskMatrixChange = (cihaz, tip, field, value) => {
    setDiskMatrisi((prev) => ({
      ...prev,
      [cihaz]: { ...prev[cihaz], [tip]: { ...prev[cihaz][tip], [field]: value } }
    }));
  };

  const handleNitrifikasyonChange = (index, field, value) => {
    setNitrifikasyonKatsayilari((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleGiderimChange = (field, value) => {
    setGiderimKabulleri((prev) => ({ ...prev, [field]: value }));
  };

  const handleLamelleChange = (index, field, value) => {
    setLamelleMatrisi((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleSaveParameters = () => {
    console.log("Tüm Güncel Veriler:", { diskMatrisi, nitrifikasyonKatsayilari, giderimKabulleri, lamelleMatrisi });
    alert("Tüm mühendislik parametreleri ve giderim kabulleri başarıyla güncellendi!");
  };

  const inputStyle = {
    padding: "0.55rem 0.75rem",
    backgroundColor: "#0f172a",
    borderColor: "#334155",
    color: "#f8fafc",
    fontSize: "13px",
    borderRadius: "6px"
  };

  const labelColor = "#94a3b8";

  return (
    <div
      className="container-fluid pb-5 min-vh-100"
      style={{
        fontSize: "14px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#1a2d3a",
        paddingTop: window.innerWidth < 768 ? "75px" : "20px"
      }}
    >
      {/* ÜST BAŞLIK */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-3 border-bottom gap-3" style={{ borderColor: "#334155" }}>
        <div>
          <h5 className="mb-1 fw-semibold tracking-tight" style={{ color: "#ffffff" }}>
            <i className="bi bi-sliders me-2" style={{ color: "#00874e" }}></i>Hesaplama Parametreleri ve Katsayı Ayarları
          </h5>
          <p className="small mb-0" style={{ color: "#94a3b8" }}>
            Maliyet hesaplama modülünün arka planda kullandığı dinamik sınır matrislerini ve kinetik çarpanları buradan revize edebilirsiniz.
          </p>
        </div>
      </div>

      {/* ANAPANELLER DİZİLİMİ */}
      <div className="d-flex flex-column gap-4">
        
        {/* SECTION 1: DİNAMİK DİSK SINIRLARI MATRİSİ */}
        <div className="col-12">
          <div className="card shadow-sm border-0" style={{ borderRadius: "8px", overflow: "hidden", backgroundColor: "#1e293b" }}>
            <div className="p-3 border-bottom" style={{ backgroundColor: "#0f172a", borderColor: "#334155" }}>
              <h6 className="mb-0 fw-bold text-white">
                <i className="bi bi-grid-3x3-gap me-2" style={{ color: "#38bdf8" }}></i>
                1. Dinamik Disk Sınırları Matrisi
              </h6>
            </div>
            
            <div className="p-4 d-flex flex-column gap-4">
              {/* MX SERİSİ */}
              <div>
                <div className="d-flex align-items-center mb-3">
                  <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#38bdf8" }}>
                    MX Serisi Disk Limitleri
                  </span>
                  <div className="flex-grow-1 border-bottom" style={{ borderColor: "#334155" }}></div>
                </div>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="p-3 rounded-3 border" style={{ backgroundColor: "#111c2a", borderColor: "#334155" }}>
                      <div className="fw-semibold mb-2" style={{ color: "#cbd5e1", fontSize: "12px" }}>Evsel Atıksu</div>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Min Disk</label>
                          <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={diskMatrisi.MX.evsel.minDisk} onChange={(e) => handleDiskMatrixChange("MX", "evsel", "minDisk", e.target.value)} />
                        </div>
                        <div className="col-6">
                          <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Max Disk</label>
                          <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={diskMatrisi.MX.evsel.maxDisk} onChange={(e) => handleDiskMatrixChange("MX", "evsel", "maxDisk", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="p-3 rounded-3 border" style={{ backgroundColor: "#111c2a", borderColor: "#334155" }}>
                      <div className="fw-semibold mb-2" style={{ color: "#cbd5e1", fontSize: "12px" }}>Endüstriyel Atıksu</div>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Min Disk</label>
                          <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={diskMatrisi.MX.endustriyel.minDisk} onChange={(e) => handleDiskMatrixChange("MX", "endustriyel", "minDisk", e.target.value)} />
                        </div>
                        <div className="col-6">
                          <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Max Disk</label>
                          <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={diskMatrisi.MX.endustriyel.maxDisk} onChange={(e) => handleDiskMatrixChange("MX", "endustriyel", "maxDisk", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MINI SERİSİ */}
              <div>
                <div className="d-flex align-items-center mb-3">
                  <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#facc15" }}>
                    MINI Serisi Disk Limitleri
                  </span>
                  <div className="flex-grow-1 border-bottom" style={{ borderColor: "#334155" }}></div>
                </div>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="p-3 rounded-3 border" style={{ backgroundColor: "#111c2a", borderColor: "#334155" }}>
                      <div className="fw-semibold mb-2" style={{ color: "#cbd5e1", fontSize: "12px" }}>Evsel Atıksu</div>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Min Disk</label>
                          <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={diskMatrisi.MINI.evsel.minDisk} onChange={(e) => handleDiskMatrixChange("MINI", "evsel", "minDisk", e.target.value)} />
                        </div>
                        <div className="col-6">
                          <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Max Disk</label>
                          <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={diskMatrisi.MINI.evsel.maxDisk} onChange={(e) => handleDiskMatrixChange("MINI", "evsel", "maxDisk", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="p-3 rounded-3 border" style={{ backgroundColor: "#111c2a", borderColor: "#334155" }}>
                      <div className="fw-semibold mb-2" style={{ color: "#cbd5e1", fontSize: "12px" }}>Endüstriyel Atıksu</div>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Min Disk</label>
                          <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={diskMatrisi.MINI.endustriyel.minDisk} onChange={(e) => handleDiskMatrixChange("MINI", "endustriyel", "minDisk", e.target.value)} />
                        </div>
                        <div className="col-6">
                          <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Max Disk</label>
                          <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={diskMatrisi.MINI.endustriyel.maxDisk} onChange={(e) => handleDiskMatrixChange("MINI", "endustriyel", "maxDisk", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: DİNAMİK NİTRİFİKASYON MATRİSİ */}
        <div className="col-12">
          <div className="card shadow-sm border-0" style={{ borderRadius: "8px", overflow: "hidden", backgroundColor: "#1e293b" }}>
            <div className="p-3 border-bottom" style={{ backgroundColor: "#0f172a", borderColor: "#334155" }}>
              <h6 className="mb-0 fw-bold text-white">
                <i className="bi bi-thermometer-half me-2" style={{ color: "#4ade80" }}></i>
                2. Dinamik Nitrifikasyon Katsayıları
              </h6>
            </div>
            <div className="p-4 d-flex flex-column gap-3">
              {nitrifikasyonKatsayilari.map((item, index) => (
                <div key={index} className="p-3 rounded-3 border" style={{ backgroundColor: "#111c2a", borderColor: "#334155" }}>
                  <div className="d-flex align-items-center mb-2.5">
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: item.renk }} className="d-inline-block me-2"></span>
                    <span className="fw-semibold" style={{ color: item.renk, fontSize: "13px" }}>
                      {item.etiket}
                    </span>
                  </div>
                  <div className="row g-2">
                    <div className="col-4">
                      <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Min Sıcaklık</label>
                      <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={item.min} onChange={(e) => handleNitrifikasyonChange(index, "min", e.target.value)} />
                    </div>
                    <div className="col-4">
                      <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Max Sıcaklık</label>
                      <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={item.max} onChange={(e) => handleNitrifikasyonChange(index, "max", e.target.value)} />
                    </div>
                    <div className="col-4">
                      <label className="mb-1 d-block fw-medium text-success" style={{ fontSize: "11px" }}>Katsayı</label>
                      <input type="text" className="form-control form-control-sm shadow-none border-success-subtle" style={{...inputStyle, color: "#4ade80", fontWeight: "600"}} value={item.katsayi} onChange={(e) => handleNitrifikasyonChange(index, "katsayi", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: YENİ - GİDERİM KABULLERİ VE TASARIM METRİKLERİ */}
        <div className="col-12">
          <div className="card shadow-sm border-0" style={{ borderRadius: "8px", overflow: "hidden", backgroundColor: "#1e293b" }}>
            <div className="p-3 border-bottom" style={{ backgroundColor: "#0f172a", borderColor: "#334155" }}>
              <h6 className="mb-0 fw-bold text-white">
                <i className="bi bi-clipboard-check me-2" style={{ color: "#a855f7" }}></i>
                3. Giderim Kabulleri ve Model Metrikleri
              </h6>
            </div>
            
            <div className="p-4 d-flex flex-column gap-4">
              {/* Genel Parametreler Grubu */}
              <div>
                <div className="d-flex align-items-center mb-3">
                  <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#a855f7" }}>
                    Proses Genel Kabulleri
                  </span>
                  <div className="flex-grow-1 border-bottom" style={{ borderColor: "#334155" }}></div>
                </div>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Maksimum BOİ Emperik (gr/m²/gün)</label>
                    <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={giderimKabulleri.boiEmperik} onChange={(e) => handleGiderimChange("boiEmperik", e.target.value)} />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Minimum Bekleme Süresi (Saat)</label>
                    <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={giderimKabulleri.maksBeklemeSuresi} onChange={(e) => handleGiderimChange("maksBeklemeSuresi", e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Model Hacim ve Çap Tanımları */}
              <div>
                <div className="d-flex align-items-center mb-3">
                  <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#f43f5e" }}>
                    Ünite Model Spesifikasyonları
                  </span>
                  <div className="flex-grow-1 border-bottom" style={{ borderColor: "#334155" }}></div>
                </div>
                <div className="row g-3">
                  {/* MX1 Metrikleri */}
                  <div className="col-12 col-md-6">
                    <div className="p-3 rounded-3 border" style={{ backgroundColor: "#111c2a", borderColor: "#334155" }}>
                      <div className="fw-semibold mb-2" style={{ color: "#38bdf8", fontSize: "12px" }}>MX1 Ünitesi</div>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Hacim (m³)</label>
                          <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={giderimKabulleri.mx1Hacim} onChange={(e) => handleGiderimChange("mx1Hacim", e.target.value)} />
                        </div>
                        <div className="col-6">
                          <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Disk Çapı (m)</label>
                          <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={giderimKabulleri.mx1Cap} onChange={(e) => handleGiderimChange("mx1Cap", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* MINI Metrikleri */}
                  <div className="col-12 col-md-6">
                    <div className="p-3 rounded-3 border" style={{ backgroundColor: "#111c2a", borderColor: "#334155" }}>
                      <div className="fw-semibold mb-2" style={{ color: "#facc15", fontSize: "12px" }}>MINI Ünitesi</div>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Hacim (m³)</label>
                          <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={giderimKabulleri.miniHacim} onChange={(e) => handleGiderimChange("miniHacim", e.target.value)} />
                        </div>
                        <div className="col-6">
                          <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Disk Çapı (m)</label>
                          <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={giderimKabulleri.miniCap} onChange={(e) => handleGiderimChange("miniCap", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lamelle (LS) Matrisi */}
              <div>
                <div className="d-flex align-items-center mb-3">
                  <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.5px", color: "#22c55e" }}>
                    Lamelle (LS) Hacim ve Alan Matrisi
                  </span>
                  <div className="flex-grow-1 border-bottom" style={{ borderColor: "#334155" }}></div>
                </div>
                <div className="row g-3">
                  {lamelleMatrisi.map((ls, idx) => (
                    <div key={idx} className="col-12 col-sm-6 col-md-3">
                      <div className="p-3 rounded-3 border" style={{ backgroundColor: "#111c2a", borderColor: "#334155" }}>
                        <div className="fw-bold mb-2 text-white" style={{ fontSize: "13px" }}>{ls.model}</div>
                        <div className="d-flex flex-column gap-2">
                          <div>
                            <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Hacim (m³)</label>
                            <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={ls.hacim} onChange={(e) => handleLamelleChange(idx, "hacim", e.target.value)} />
                          </div>
                          <div>
                            <label className="mb-1 d-block" style={{ fontSize: "11px", color: labelColor }}>Alan (m²)</label>
                            <input type="text" className="form-control form-control-sm shadow-none" style={inputStyle} value={ls.alan} onChange={(e) => handleLamelleChange(idx, "alan", e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* EN ALT AKSİYON BUTONU */}
      <div className="d-flex justify-content-end mt-4">
        <button
          onClick={handleSaveParameters}
          className="btn text-white px-4 py-2.5 shadow-sm border-0 d-flex align-items-center fw-bold"
          style={{ backgroundColor: "#00874e", fontSize: "13px", borderRadius: "6px", transition: "all 0.2s" }}
        >
          <i className="bi bi-check-all me-1.5 fs-6"></i> Parametreleri ve Katsayıları Güncelle
        </button>
      </div>

    </div>
  );
}

export default CalculationPage;