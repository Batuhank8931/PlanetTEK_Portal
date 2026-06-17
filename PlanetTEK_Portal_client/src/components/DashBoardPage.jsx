import React, { useState, useMemo } from "react";

// --- BACKEND'DEN GELEN DUMMY DATA SİMÜLASYONU (2026 Yılına göre ayarlandı) ---
const INITIAL_OFFERS = [
  { id: "TEK-2026-001", tarih: "2026-05-10", musteri: "Akva Tekstil A.Ş.", tip: "Endüstriyel", kapasite: 1500, ulke: "Türkiye", tutar: 45000, paraBirimi: "EUR", durum: "Onaylandı", gecerlilikSuresiGun: 30 },
  { id: "TEK-2026-002", tarih: "2026-03-15", musteri: "Berlin Eco Waters GmbH", tip: "Evsel Paket", kapasite: 250, ulke: "Almanya", tutar: 28000, paraBirimi: "EUR", durum: "Beklemede", gecerlilikSuresiGun: 30 }, // Süresi dolmuş (Mart)
  { id: "TEK-2026-003", tarih: "2026-05-24", musteri: "Anadolu Gıda Org.", tip: "Endüstriyel", kapasite: 700, ulke: "Türkiye", tutar: 32000, paraBirimi: "USD", durum: "Revize", gecerlilikSuresiGun: 30 },
  { id: "TEK-2026-004", tarih: "2026-06-01", musteri: "Gulf Clean Utilities", tip: "MBR Atıksu", kapasite: 5000, ulke: "BAE", tutar: 185000, paraBirimi: "USD", durum: "Onaylandı", gecerlilikSuresiGun: 30 },
  { id: "TEK-2026-005", tarih: "2026-04-01", musteri: "Ege Organize Sanayi", tip: "Endüstriyel", kapasite: 3200, ulke: "Türkiye", tutar: 95000, paraBirimi: "EUR", durum: "Beklemede", gecerlilikSuresiGun: 30 }  // Süresi dolmuş (Nisan)
];

function DashBoardPage() {
  const [offers, setOffers] = useState(INITIAL_OFFERS);

  // Arama ve Filtreleme State'leri
  const [searchNo, setSearchNo] = useState("");
  const [searchTarih, setSearchTarih] = useState("");
  const [searchKapasite, setSearchKapasite] = useState("");

  // Modal State'leri
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [actionType, setActionType] = useState("Süre Uzatımı");
  const [actionNote, setActionNote] = useState("");

  // --- OTO SÜRE KONTROLÜ (30 Gün Geçenleri Ayıklama) ---
  const { aktifTeklifler, suresiDolmusTeklifler } = useMemo(() => {
    const bugun = new Date("2026-06-04"); // Sistem yılı 2026 simülasyonu

    const aktif = [];
    const dolmus = [];

    offers.forEach(o => {
      const teklifTarihi = new Date(o.tarih);
      const farkZaman = bugun.getTime() - teklifTarihi.getTime();
      const farkGun = Math.ceil(farkZaman / (1000 * 60 * 60 * 24));

      // Eğer beklemedeyse ve 30 günü geçtiyse süresi dolmuşlara girer
      if (o.durum === "Beklemede" && farkGun > o.gecerlilikSuresiGun) {
        dolmus.push({ ...o, gecenGun: farkGun });
      } else {
        aktif.push(o);
      }
    });

    return { aktifTeklifler: aktif, suresiDolmusTeklifler: dolmus };
  }, [offers]);

  // --- METRİK HESAPLAMALARI ---
  const metrikler = useMemo(() => {
    const toplamTeklif = offers.length;
    const yurtiçi = offers.filter(o => o.ulke === "Türkiye").length;
    const yurtdisi = toplamTeklif - yurtiçi;
    const toplamTutar = offers.reduce((acc, curr) => acc + (curr.tutar * (curr.paraBirimi === "USD" ? 0.92 : 1)), 0);
    const toplamTasarimKapasitesi = offers.reduce((acc, curr) => acc + curr.kapasite, 0);

    return { toplamTeklif, yurtiçi, yurtdisi, toplamTutar, toplamTasarimKapasitesi };
  }, [offers]);

  // --- DİNAMİK ARAMA FİLTRESİ (Aktif Tablo İçin) ---
  const filtrelenmişTeklifler = useMemo(() => {
    return aktifTeklifler.filter((teklif) => {
      const noEşleşti = teklif.id.toLowerCase().includes(searchNo.toLowerCase()) ||
        teklif.musteri.toLowerCase().includes(searchNo.toLowerCase());
      const tarihEşleşti = searchTarih === "" ? true : teklif.tarih === searchTarih;
      const kapasiteEşleşti = searchKapasite === "" ? true : teklif.kapasite >= parseFloat(searchKapasite);
      return noEşleşti && tarihEşleşti && kapasiteEşleşti;
    });
  }, [aktifTeklifler, searchNo, searchTarih, searchKapasite]);

  // --- MODAL KAYDETME AKSİYONU ---
  const handleSaveAction = () => {
    if (!actionNote.trim()) {
      alert("Lütfen gerekli bilgi notunu doldurunuz.");
      return;
    }

    setOffers(prevOffers =>
      prevOffers.map(o => {
        if (o.id === selectedOffer.id) {
          // İptal veya Revize seçildiyse durum güncellenir, Süre Uzatımı seçildiyse tarih bugüne çekilir
          return {
            ...o,
            durum: actionType === "Süre Uzatımı" ? "Beklemede" : actionType,
            tarih: actionType === "Süre Uzatımı" ? "2026-06-04" : o.tarih, // Tarihi yeniliyoruz
            not: actionNote
          };
        }
        return o;
      })
    );

    // Kapat ve temizle
    setSelectedOffer(null);
    setActionNote("");
  };

  return (
    <div
      className="container-fluid pb-4 min-vh-100 text-white"
      style={{
        fontSize: "14px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#1a2d3a",
        paddingTop: window.innerWidth < 768 ? "75px" : "20px"
      }}
    >
      {/* ÜST BAŞLIK */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div>
          <h5 className="mb-1 fw-semibold tracking-tight" style={{ color: "#94a3b8" }}>
            <i className="bi bi-grid-1x2-fill me-2" style={{ color: "#00874e" }}></i> Satış Paneli

          </h5>
        </div>
      </div>

      {/* --- REKOR SÜRESİ DOLMUŞ TEKLİFLER ALARMI (KRİTİK UYARI PANELİ) --- */}
      {suresiDolmusTeklifler.length > 0 && (
        <div className="p-3 rounded mb-4 animate__animated animate__fadeIn" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444" }}>
          <div className="d-flex align-items-center gap-2 mb-2 text-danger fw-bold" style={{ fontSize: "13px" }}>
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>DİKKAT: Takip Süresi Dolan ({suresiDolmusTeklifler.length}) Adet Teklif Bulunuyor!</span>
          </div>
          <div className="row g-2">
            {suresiDolmusTeklifler.map(t => (
              <div key={t.id} className="col-md-6 col-12">
                <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1f2937", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                  <div>
                    <span className="fw-bold text-danger" style={{ fontSize: "12px" }}>{t.id}</span>
                    <span className="text-white-50 ms-2" style={{ fontSize: "11px" }}>{t.musteri} ({t.kapasite} m³/g)</span>
                    <div className="text-white-50" style={{ fontSize: "10px" }}>Teklif Tarihi: {t.tarih} - <span className="text-warning">{t.gecenGun} gündür yanıtsız</span></div>
                  </div>
                  <button
                    className="btn btn-sm btn-danger fw-bold px-3"
                    style={{ fontSize: "11px", height: "26px", lineHeight: "12px" }}
                    onClick={() => setSelectedOffer(t)}
                  >
                    Aksiyon Al
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SKOR KARTLARI SATIRI --- */}
      <div className="row g-3 mb-4">
        <div className="col-xl-2.4 col-md-4 col-sm-6 col-12">
          <div className="p-3 rounded h-100" style={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}>
            <span className="text-white-50 d-block mb-1" style={{ fontSize: "11px" }}>TOPLAM TEKLİF</span>
            <div className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0 fw-bold">{metrikler.toplamTeklif}</h3>
              <span className="badge bg-success p-2"><i className="bi bi-files"></i></span>
            </div>
          </div>
        </div>
        <div className="col-xl-2.4 col-md-4 col-sm-6 col-12">
          <div className="p-3 rounded h-100" style={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}>
            <span className="text-white-50 d-block mb-1" style={{ fontSize: "11px" }}>YURTİÇİ TEKLİFLER</span>
            <div className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0 fw-bold text-info">{metrikler.yurtiçi}</h3>
            </div>
          </div>
        </div>
        <div className="col-xl-2.4 col-md-4 col-sm-6 col-12">
          <div className="p-3 rounded h-100" style={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}>
            <span className="text-white-50 d-block mb-1" style={{ fontSize: "11px" }}>YURTDIŞI TEKLİFLER</span>
            <div className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0 fw-bold text-warning">{metrikler.yurtdisi}</h3>
            </div>
          </div>
        </div>
        <div className="col-xl-2.4 col-md-6 col-sm-6 col-12">
          <div className="p-3 rounded h-100" style={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}>
            <span className="text-white-50 d-block mb-1" style={{ fontSize: "11px" }}>TOPLAM HACİM (~EUR)</span>
            <h4 className="mb-0 fw-bold text-success">€ {metrikler.toplamTutar.toLocaleString("tr-TR")}</h4>
          </div>
        </div>
        <div className="col-xl-2.4 col-md-6 col-sm-12 col-12">
          <div className="p-3 rounded h-100" style={{ backgroundColor: "#1f2937", border: "1px solid #00874e" }}>
            <span className="text-success d-block mb-1" style={{ fontSize: "11px", fontWeight: "600" }}>TOPLAM TASARIM DEBİSİ</span>
            <h4 className="mb-0 fw-bold text-white">{metrikler.toplamTasarimKapasitesi.toLocaleString("tr-TR")} m³/g</h4>
          </div>
        </div>
      </div>

      {/* --- FİLTRELEME VE ARAMA PANELİ --- */}
      <div className="p-3 rounded mb-4" style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
        <span className="fw-bold text-uppercase d-block mb-3" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
          <i className="bi bi-funnel-fill me-1"></i> Teklif Gelişmiş Arama & Filtreleme
        </span>
        <div className="row g-2">
          <div className="col-md-4 col-12">
            <label className="form-label mb-1 text-white-50" style={{ fontSize: "11px" }}>Teklif No veya Müşteri Adı</label>
            <input type="text" className="form-control form-control-sm text-white border-0" style={{ backgroundColor: "#1e293b", height: "32px", fontSize: "12px" }} value={searchNo} onChange={(e) => setSearchNo(e.target.value)} placeholder="Arama..." />
          </div>
          <div className="col-md-4 col-6">
            <label className="form-label mb-1 text-white-50" style={{ fontSize: "11px" }}>Teklif Tarihi</label>
            <input type="date" className="form-control form-control-sm text-white border-0 text-center" style={{ backgroundColor: "#1e293b", height: "32px", fontSize: "12px" }} value={searchTarih} onChange={(e) => setSearchTarih(e.target.value)} />
          </div>
          <div className="col-md-4 col-6">
            <label className="form-label mb-1 text-white-50" style={{ fontSize: "11px" }}>Min Kapasite (m³/gün)</label>
            <input type="number" className="form-control form-control-sm text-white border-0 text-center" style={{ backgroundColor: "#1e293b", height: "32px", fontSize: "12px" }} value={searchKapasite} onChange={(e) => setSearchKapasite(e.target.value)} placeholder="Örn: 500" />
          </div>
        </div>
      </div>

      {/* --- DİNAMİK LİSTE TABLOSU --- */}
      <div className="p-3 rounded" style={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}>
        <span className="fw-semibold d-block mb-2" style={{ fontSize: "12px" }}>Aktif Süreçteki Teklifler ({filtrelenmişTeklifler.length} Kayıt)</span>
        <div className="table-responsive">
          <table className="table table-dark table-hover mb-0" style={{ fontSize: "12px" }}>
            <thead>
              <tr style={{ color: "rgba(255,255,255,0.4)" }}>
                <th>Teklif No</th>
                <th>Tarih</th>
                <th>Müşteri</th>
                <th>Tesis Tipi</th>
                <th className="text-center">Kapasite</th>
                <th>Ülke</th>
                <th className="text-end">Tutar</th>
                <th className="text-center">Durum</th>
              </tr>
            </thead>
            <tbody>
              {filtrelenmişTeklifler.map((teklif) => (
                <tr key={teklif.id} style={{ verticalAlign: "middle" }}>
                  <td className="fw-bold text-info">{teklif.id}</td>
                  <td>{teklif.tarih}</td>
                  <td>{teklif.musteri}</td>
                  <td><span className="badge bg-secondary">{teklif.tip}</span></td>
                  <td className="text-center fw-bold">{teklif.kapasite} m³/g</td>
                  <td>{teklif.ulke}</td>
                  <td className="text-end fw-bold text-success">{teklif.tutar.toLocaleString("tr-TR")} {teklif.paraBirimi}</td>
                  <td className="text-center">
                    <span className={`badge ${teklif.durum === "Onaylandı" ? "bg-success" : teklif.durum === "Revize" ? "bg-warning text-dark" : "bg-primary"}`}>
                      {teklif.durum}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- AKSİYON MODAL SİMÜLASYONU (Bootstrap modal yapısı tel çerçeve) --- */}
      {selectedOffer && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1050 }}>
          <div className="p-4 rounded w-100 shadow" style={{ maxWidth: "500px", backgroundColor: "#1f2937", border: "1px solid #ef4444" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 fw-bold text-danger"><i className="bi bi-lightning-charge-fill"></i> Teklif Durum Aksiyonu ({selectedOffer.id})</h6>
              <button className="btn-close btn-close-white btn-sm" onClick={() => setSelectedOffer(null)}></button>
            </div>

            <p className="text-white-50" style={{ fontSize: "12px" }}>
              <strong>{selectedOffer.musteri}</strong> firmasına ait 30 günlük teklif süresi aşılmıştır. Lütfen zorunlu takip aksiyonunu seçiniz.
            </p>

            {/* SEÇENEK RADİO KUTULARI */}
            <div className="mb-3">
              <label className="form-label text-white-50 mb-2" style={{ fontSize: "11px" }}>Alınacak Aksiyon Tipi *</label>
              <select
                className="form-select form-select-sm bg-dark text-white border-secondary"
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                style={{ fontSize: "12px" }}
              >
                <option value="Süre Uzatımı">Süre Uzatımı (Teklifi 30 gün daha canlı tut)</option>
                <option value="Revize">Revize Teklif (Yeniden tasarıma/fiyatlandırmaya gönder)</option>
                <option value="Teklif İptal">Teklif İptal (Projeyi olumsuz kapat)</option>
              </select>
            </div>

            {/* BİLGİ NOTU GİRİŞİ */}
            <div className="mb-3">
              <label className="form-label text-white-50 mb-1" style={{ fontSize: "11px" }}>Aksiyon Nedeni / Bilgi Notu *</label>
              <textarea
                className="form-control bg-dark text-white border-secondary"
                rows="3"
                style={{ fontSize: "12px" }}
                placeholder="Örn: Müşteri bütçe onayı bekliyor, süre uzatıldı..."
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
              ></textarea>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-sm btn-secondary" onClick={() => setSelectedOffer(null)} style={{ fontSize: "11px" }}>Kapat</button>
              <button className="btn btn-sm btn-danger fw-bold" onClick={handleSaveAction} style={{ fontSize: "11px" }}>Aksiyonu Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashBoardPage;