import React, { useMemo, useEffect, useState } from "react";
import { useTeklifStore } from "../../../../utils/teklifStore";
import API from "../../../../utils/utilRequest";

function LamellaParameters() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  // 1. Akışı kontrol etmek ve boş render/erken store sıfırlamasını engellemek için loading ekliyoruz
  const [loading, setLoading] = useState(true);
  const [lamellaModels, setLamellaModels] = useState([]);

  useEffect(() => {
    const fetchParameters = async () => {
      try {
        const response = await API.getParamteters();
        const data = response.data || [];

        const modelsMap = {};

        data.forEach(item => {
          const key = item.parametre_key;

          if (key.startsWith("LS_")) {
            const parcalar = key.split("_");
            const modelId = `${parcalar[0]}_${parcalar[1]}`; 
            const name = `${parcalar[0]} ${parcalar[1]}`;    
            const field = parcalar[2];                        

            if (!modelsMap[modelId]) {
              modelsMap[modelId] = {
                id: modelId,
                name: name
              };
            }

            modelsMap[modelId][field] = parseFloat(item.deger);
          }
        });

        const dinamikLamellaModelleri = Object.values(modelsMap);
        dinamikLamellaModelleri.sort((a, b) => a.alan - b.alan);

        setLamellaModels(dinamikLamellaModelleri);
        setLoading(false); // Veri yüklendi, kilidi açıyoruz

      } catch (error) {
        console.error("Parametre verileri yüklenirken hata oldu:", error);
        setLoading(false);
      }
    };

    fetchParameters();
  }, []);

  const debiGun = parseFloat(formData.planetDiskDetails?.debi) || 0;
  const debiSaat = debiGun / 24;

  const currentLamellaData = formData.planetDiskDetails?.tasarim?.lamella || {};

  const displayBeklemeSuresi = currentLamellaData.LamellabeklemeSuresiMin ?? "30";
  const displayLamellaKatsayisi = currentLamellaData.lamellaKatsayisi ?? "0.40";

  const LamellabeklemeSuresiMin = parseFloat(displayBeklemeSuresi) || 0;
  const lamellaKatsayisi = parseFloat(displayLamellaKatsayisi) || 0;

  // Hesaplamalar sadece veri yüklendiğinde çalışır (Hatalı 0 değerleri store'a basılmaz)
  const { gerekliAlan, gerekliHacim, adet, secilenModel } = useMemo(() => {
    const alan = debiSaat * lamellaKatsayisi;
    const hacim = debiSaat * (LamellabeklemeSuresiMin / 60);

    if (loading) {
      return { gerekliAlan: alan, gerekliHacim: hacim, adet: 0, secilenModel: null };
    }

    const model = lamellaModels.find(m => m.id === currentLamellaData.secilenLamellaModeli);
    let modelAdet = 0;

    if (model) {
      const alanaGoreAdet = alan / model.alan;
      const hacmeGoreAdet = hacim / model.hacim;
      modelAdet = Math.ceil(Math.max(alanaGoreAdet, hacmeGoreAdet)) || 1;
    }

    return { gerekliAlan: alan, gerekliHacim: hacim, adet: modelAdet, secilenModel: model };
  }, [debiSaat, lamellaKatsayisi, LamellabeklemeSuresiMin, currentLamellaData.secilenLamellaModeli, lamellaModels, loading]);

  // Store Güncelleme Efekti (Loading bariyeriyle korundu)
  useEffect(() => {
    if (loading) return; // Veriler gelmeden store'a sıfırlama veya eksik veri basma!

    const currentAdetInStore = currentLamellaData.lamellaAdet;
    const currentAlanInStore = currentLamellaData.gerekliLamellaAlani;
    const currentHacimInStore = currentLamellaData.gerekliLamellaHacmi;

    const formattedAlan = gerekliAlan.toFixed(2);
    const formattedHacim = gerekliHacim.toFixed(2);

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
  }, [adet, gerekliAlan, gerekliHacim, updateSection, loading]);

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

    const targetModel = lamellaModels.find(m => m.id === nextLamellaState.secilenLamellaModeli);
      
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

  // API'den veri dönerken boş/bozuk UI gösterimini engelliyoruz
  if (loading) {
    return <div className="p-4 text-center text-white-50">Lamella parametreleri yükleniyor...</div>;
  }

  return (
    <div className="card border-0 text-white h-100" style={{ backgroundColor: "#1a1c1d", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
      <div className="card-body p-4">

        <div className="d-flex align-items-center mb-3">
          <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
            Lamella Çöktürme Seçimi
          </span>
          <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
        </div>

        <div style={{ display: "flex", flexDirection: "row", gap: "16px", alignItems: "flex-end", marginBottom: "20px" }}>
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

          <div style={{ flex: "1 1 50%", display: "flex", flexDirection: "column" }}>
            <div className="rounded" style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "4px 12px", height: "46px", display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", textAlign: "center", width: "100%" }}>
                <div style={{ flex: 1 }}>
                  <div className="text-white-50" style={{ fontSize: "8px", letterSpacing: "0.5px", lineHeight: "1.1" }}>GEREKLİ ALAN</div>
                  <div className="fw-bold text-success" style={{ fontSize: "14px" }}>{gerekliAlan.toFixed(2)} m²</div>
                </div>

                <div style={{ width: "1px", height: "26px", backgroundColor: "rgba(255,255,255,0.15)", margin: "0 8px" }}></div>

                <div style={{ flex: 1 }}>
                  <div className="text-white-50" style={{ fontSize: "8px", letterSpacing: "0.5px", lineHeight: "1.1" }}>GEREKLİ HACİM</div>
                  <div className="fw-bold text-info" style={{ fontSize: "14px" }}>{gerekliHacim.toFixed(2)} m³</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-end text-muted mb-3" style={{ fontSize: "9px", marginTop: "-12px", paddingRight: "4px" }}>
          Net Saatlik Debi: {debiSaat.toFixed(2)} m³/saat
        </div>

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
              {lamellaModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} (Hacim: {model.hacim}m³ / Alan: {model.alan}m²)
                </option>
              ))}
            </select>
          </div>

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