import React, { useMemo, useEffect } from "react";
import { useTeklifStore } from "../../../../utils/teklifStore"; // Store yolunu kontrol edin

const LAMELLA_MODELS = [
  { id: "LS_8", name: "LS 8", hacim: 1, alan: 8 },
  { id: "LS_15", name: "LS 15", hacim: 1.5, alan: 15 },
  { id: "LS_30", name: "LS 30", hacim: 3, alan: 30 },
  { id: "LS_45", name: "LS 45", hacim: 4.5, alan: 45 },
];

function LamellaParameters() {
  // 1. Zustand Store entegrasyonu
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  // Bir önceki adımdan gelen debi bilgisini güvenli bir şekilde çekiyoruz
  const debiGun = parseFloat(formData.planetDiskDetails?.debi) || 0;
  const debiSaat = debiGun / 24;

  // Store'daki lamella düğümünü alıyoruz
  const currentLamellaData = formData.planetDiskDetails?.tasarim?.lamella || {};

  // 2. Controlled Fallback (Boşsa varsayılan değerleri atıyoruz)
  const displayBeklemeSuresi = currentLamellaData.LamellabeklemeSuresiMin ?? "30";
  const displayLamellaKatsayisi = currentLamellaData.lamellaKatsayisi ?? "0.40";

  const LamellabeklemeSuresiMin = parseFloat(displayBeklemeSuresi) || 0;
  const lamellaKatsayisi = parseFloat(displayLamellaKatsayisi) || 0;

  // 3. Hesaplamaları useMemo ile senkronize yürütüyoruz
  const { gerekliAlan, gerekliHacim, adet, secilenModel } = useMemo(() => {
    const alan = debiSaat * lamellaKatsayisi;
    const hacim = debiSaat * (LamellabeklemeSuresiMin / 60);

    const model = LAMELLA_MODELS.find(m => m.id === currentLamellaData.secilenLamellaModeli);
    let modelAdet = 0;

    if (model) {
      const alanaGoreAdet = alan / model.alan;
      const hacmeGoreAdet = hacim / model.hacim;
      modelAdet = Math.ceil(Math.max(alanaGoreAdet, hacmeGoreAdet)) || 1;
    }

    return { gerekliAlan: alan, gerekliHacim: hacim, adet: modelAdet, secilenModel: model };
  }, [debiSaat, lamellaKatsayisi, LamellabeklemeSuresiMin, currentLamellaData.secilenLamellaModeli]);

  // 🔥 YENİ: Debi veya diğer parametreler değiştiğinde Store'u otomatik senkronize eden efekt
  useEffect(() => {
    const currentAdetInStore = currentLamellaData.lamellaAdet;
    const currentAlanInStore = currentLamellaData.gerekliLamellaAlani;
    const currentHacimInStore = currentLamellaData.gerekliLamellaHacmi;

    const formattedAlan = gerekliAlan.toFixed(2);
    const formattedHacim = gerekliHacim.toFixed(2);

    // Eğer hesaplanan değerler store'dakilerden farklıysa store'u güncelle (Sonsuz döngüyü engeller)
    if (
      currentAdetInStore !== adet ||
      currentAlanInStore !== formattedAlan ||
      currentHacimInStore !== formattedHacim
    ) {
      updateSection("planetDiskDetails", {
        tasarim: {
          ...formData.planetDiskDetails?.tasarim,
          lamella: {
            ...currentLamellaData,
            gerekliLamellaAlani: formattedAlan,
            gerekliLamellaHacmi: formattedHacim,
            lamellaAdet: adet
          }
        }
      });
    }
  }, [adet, gerekliAlan, gerekliHacim, updateSection, currentLamellaData, formData.planetDiskDetails]);

  // 4. Input Değişim Yönetimi (Kullanıcı etkileşimi)
  const handleLocalChange = (e) => {
    const { name, value } = e.target;

    const nextLamellaState = {
      LamellabeklemeSuresiMin: displayBeklemeSuresi,
      lamellaKatsayisi: displayLamellaKatsayisi,
      secilenLamellaModeli: currentLamellaData.secilenLamellaModeli,
      [name]: value
    };

    const nextBekleme = parseFloat(nextLamellaState.LamellabeklemeSuresiMin) || 0;
    const nextKatsayi = parseFloat(nextLamellaState.lamellaKatsayisi) || 0;
    
    const nextAlan = debiSaat * nextKatsayi;
    const nextHacim = debiSaat * (nextBekleme / 60);

    const targetModel = LAMELLA_MODELS.find(m => m.id === nextLamellaState.secilenLamellaModeli);
    let nextAdet = 0;
    if (targetModel) {
      nextAdet = Math.ceil(Math.max(nextAlan / targetModel.alan, nextHacim / targetModel.hacim)) || 1;
    }

    updateSection("planetDiskDetails", {
      tasarim: {
        ...formData.planetDiskDetails?.tasarim,
        lamella: {
          ...currentLamellaData,
          [name]: value,
          gerekliLamellaAlani: nextAlan.toFixed(2),
          gerekliLamellaHacmi: nextHacim.toFixed(2),
          lamellaAdet: nextAdet
        }
      }
    });
  };

  return (
    <div className="card border-0 text-white h-100" style={{ backgroundColor: "#1a1c1d", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
      <div className="card-body p-4">

        {/* Başlık */}
        <div className="d-flex align-items-center mb-3">
          <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
            Lamella Çöktürme Seçimi
          </span>
          <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
        </div>

        {/* 3 KOLONLU ANA YATAY PANEL */}
        <div style={{ display: "flex", flexDirection: "row", gap: "16px", alignItems: "flex-end", marginBottom: "20px" }}>

          {/* Kolon 1: Bekleme Süresi */}
          <div style={{ flex: "1 1 25%" }}>
            <label className="text-white-50 mb-1" style={{ fontSize: "10px", letterSpacing: "0.3px", display: "block" }}>
              BEKLEME SÜRESİ (DK)
            </label>
            <input
              type="number"
              name="LamellabeklemeSuresiMin"
              value={displayBeklemeSuresi}
              onChange={handleLocalChange}
              className="form-control form-control-sm bg-dark text-white border-0 text-center fw-bold"
              style={{ fontSize: "13px", padding: "10px", width: "100%", height: "46px" }}
            />
          </div>

          {/* Kolon 2: Lamella Katsayısı */}
          <div style={{ flex: "1 1 25%" }}>
            <label className="text-white-50 mb-1" style={{ fontSize: "10px", letterSpacing: "0.3px", display: "block" }}>
              LAMELLA KATSAYISI
            </label>
            <input
              type="number"
              step="0.01"
              name="lamellaKatsayisi"
              value={displayLamellaKatsayisi}
              onChange={handleLocalChange}
              className="form-control form-control-sm bg-dark text-white border-0 text-center fw-bold"
              style={{ fontSize: "13px", padding: "10px", width: "100%", height: "46px" }}
            />
          </div>

          {/* Kolon 3: Hesaplanan İhtiyaçlar (Gerekli Alan & Hacim) */}
          <div style={{ flex: "1 1 50%", display: "flex", flexDirection: "column" }}>
            <div className="rounded" style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "4px 12px", height: "46px", display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", textAlign: "center", width: "100%" }}>

                {/* Gerekli Alan Bölümü */}
                <div style={{ flex: 1 }}>
                  <div className="text-white-50" style={{ fontSize: "8px", letterSpacing: "0.5px", lineHeight: "1.1" }}>GEREKLİ ALAN</div>
                  <div className="fw-bold text-success" style={{ fontSize: "14px" }}>{gerekliAlan.toFixed(2)} m²</div>
                </div>

                {/* Dikey Ayırıcı Çizgi */}
                <div style={{ width: "1px", height: "26px", backgroundColor: "rgba(255,255,255,0.15)", margin: "0 8px" }}></div>

                {/* Gerekli Hacim Bölümü */}
                <div style={{ flex: 1 }}>
                  <div className="text-white-50" style={{ fontSize: "8px", letterSpacing: "0.5px", lineHeight: "1.1" }}>GEREKLİ HACİM</div>
                  <div className="fw-bold text-info" style={{ fontSize: "14px" }}>{gerekliHacim.toFixed(2)} m³</div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Küçük Bilgi Etiketi (Saatlik Debi) */}
        <div className="text-end text-muted mb-3" style={{ fontSize: "9px", marginTop: "-12px", paddingRight: "4px" }}>
          Net Saatlik Debi: {debiSaat.toFixed(2)} m³/saat
        </div>

        {/* Model Seçim Alanı ve Sonuç */}
        <div className="p-3 rounded mb-3" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          <div className="mb-3">
            <label className="text-white-50 mb-1" style={{ fontSize: "11px" }}>Lamella Ünite Modeli</label>
            <select
              name="secilenLamellaModeli"
              value={currentLamellaData.secilenLamellaModeli || ""}
              onChange={handleLocalChange}
              className="form-select form-select-sm bg-dark text-white border-0"
              style={{ fontSize: "12px" }}
            >
              <option value="">Seçiniz...</option>
              {LAMELLA_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} (Hacim: {model.hacim}m³ / Alan: {model.alan}m²)
                </option>
              ))}
            </select>
          </div>

          {/* Sonuç Gösterimi */}
          {secilenModel && (
            <div className="p-2 rounded text-center" style={{ backgroundColor: "rgba(0, 135, 78, 0.1)", border: "1px solid rgba(0, 135, 78, 0.3)" }}>
              <div className="fs-4 fw-bold text-white">
                {adet} <span style={{ fontSize: "14px" }}>Adet {secilenModel.name}</span>
              </div>
              <div className="text-white mt-1" style={{ fontSize: "10px" }}>
                Toplam Alan: {adet * secilenModel.alan} m² | Hacim: {adet * secilenModel.hacim} m³
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default LamellaParameters;