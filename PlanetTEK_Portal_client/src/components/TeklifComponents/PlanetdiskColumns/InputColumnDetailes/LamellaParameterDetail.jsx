import React, { useEffect, useState } from "react";
import { useTeklifStore } from "../../../../utils/teklifStore";
import API from "../../../../utils/utilRequest";

function LamellaParameters() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const [loading, setLoading] = useState(true);
  const [lamellaModels, setLamellaModels] = useState([]);
  const [centrifugePumps, setCentrifugePumps] = useState([]);

  useEffect(() => {
    const fetchParameters = async () => {
      try {
        const response = await API.getLamellaData();
        const response2 = await API.getCentrifugePumps();

        const data = response.data || [];
        const pumpsData = response2.data || [];

        setCentrifugePumps(pumpsData);
        const dinamikLamellaModelleri = data.map(item => {
          const modelId = item.tipi ? item.tipi.replace(" ", "_") : `model_${item.id}`;
          return {
            id: modelId,
            name: item.tipi,
            alan: parseFloat(item.alan) || 0,
            hacim: parseFloat(item.hacim) || 0,
            yd_fiyat: parseFloat(item.yd_fiyat) || 0,
            yi_fiyat: parseFloat(item.yi_fiyat) || 0
          };
        });

        dinamikLamellaModelleri.sort((a, b) => a.alan - b.alan);
        setLamellaModels(dinamikLamellaModelleri);
        setLoading(false);
      } catch (error) {
        console.error("Parametre verileri yüklenirken hata oldu:", error);
        setLoading(false);
      }
    };

    fetchParameters();
  }, []);

  // 1. Temel Girdiler (Debi ve Temel Store Verileri)
  const debiGun = parseFloat(formData.planetDiskDetails?.debi) || 0;
  const debiSaat = debiGun / 24;

  const currentLamellaData = formData.planetDiskDetails?.tasarim?.lamella || {};
  const secilenLamellaDebisi = parseFloat(currentLamellaData.secilenLamellaDebisi) || 0;

  const displayBeklemeSuresi = currentLamellaData.LamellabeklemeSuresiMin ?? "30";
  const displayLamellaKatsayisi = currentLamellaData.lamellaKatsayisi ?? "0.40";

  const currentCamurPompasiObj = currentLamellaData.camurPompasi || {};
  const currentCamurPompasiId = currentCamurPompasiObj.id || "";

  // 2. Sayısal Dönüşümler (Hata veren değişkenler yukarı taşındı 🚀)
  const currentCamurPompasiAdet = currentLamellaData.camurPompasiAdet !== undefined ? parseInt(currentLamellaData.camurPompasiAdet, 10) : 0;
  const currentLamellaAdetInStore = currentLamellaData.lamellaAdet !== undefined ? parseInt(currentLamellaData.lamellaAdet, 10) : null;
  const currentModelId = currentLamellaData.secilenLamellaModeli || "";

  const LamellabeklemeSuresiMin = parseFloat(displayBeklemeSuresi) || 0;
  const lamellaKatsayisi = parseFloat(displayLamellaKatsayisi) || 0;

  const gerekliAlan = debiSaat * lamellaKatsayisi;
  const gerekliHacim = debiSaat * (LamellabeklemeSuresiMin / 60);

  // 3. Durum Kontrolleri ve Hesaplamalar
  const isDebiChanged = debiGun !== secilenLamellaDebisi;
  const activeModelId = isDebiChanged ? "" : currentModelId;

  const autoCalculatedAdet = React.useMemo(() => {
    if (!activeModelId || lamellaModels.length === 0) return 0;
    const model = lamellaModels.find(m => m.id === activeModelId);
    if (!model) return 0;

    const alanaGoreAdet = gerekliAlan / model.alan;
    const hacmeGoreAdet = gerekliHacim / model.hacim;
    return Math.ceil(Math.max(alanaGoreAdet, hacmeGoreAdet)) || 1;
  }, [activeModelId, lamellaModels, gerekliAlan, gerekliHacim]);

  const secilenModel = React.useMemo(() => {
    return lamellaModels.find(m => m.id === activeModelId) || null;
  }, [activeModelId, lamellaModels]);

  const resolvedLamellaAdet = isDebiChanged ? 0 : (currentLamellaAdetInStore !== null ? currentLamellaAdetInStore : autoCalculatedAdet);

  // Store Güncelleme Efekti
  useEffect(() => {
    if (loading) return;

    const currentAdetInStore = currentLamellaData.lamellaAdet;
    const currentAlanInStore = currentLamellaData.gerekliLamellaAlani;
    const currentHacimInStore = currentLamellaData.gerekliLamellaHacmi;

    const currentModelAlanInStore = currentLamellaData.secilenModelAlan;
    const currentModelHacimInStore = currentLamellaData.secilenModelHacim;

    const formattedAlan = gerekliAlan.toFixed(2);
    const formattedHacim = gerekliHacim.toFixed(2);

    let finalLamellaAdet = currentAdetInStore !== undefined && currentAdetInStore !== null ? currentAdetInStore : autoCalculatedAdet;
    let targetPumpAdet = currentCamurPompasiAdet !== 0 ? currentCamurPompasiAdet : finalLamellaAdet;
    let targetModelId = currentModelId;
    
    let targetModelAlan = secilenModel ? secilenModel.alan : 0;
    let targetModelHacim = secilenModel ? secilenModel.hacim : 0;

    if (isDebiChanged) {
      targetModelId = ""; 
      finalLamellaAdet = 0;
      targetPumpAdet = 0;
      targetModelAlan = 0;
      targetModelHacim = 0;
    }

    let targetCamurPompasiObj = currentCamurPompasiObj;
    if (!currentCamurPompasiId && centrifugePumps.length > 0) {
      const firstPump = centrifugePumps[0];
      targetCamurPompasiObj = {
        id: firstPump.id,
        name: firstPump.name,
        pompa_tipi: firstPump.pompa_tipi,
        kw: firstPump.kw
      };
    }

    if (
      isDebiChanged || 
      currentAdetInStore !== finalLamellaAdet ||
      currentAlanInStore !== formattedAlan ||
      currentHacimInStore !== formattedHacim ||
      currentCamurPompasiId !== targetCamurPompasiObj.id ||
      currentCamurPompasiAdet !== targetPumpAdet ||
      currentModelAlanInStore !== targetModelAlan || 
      currentModelHacimInStore !== targetModelHacim ||
      currentModelId !== targetModelId
    ) {
      updateSection("planetDiskDetails", {
        tasarim: {
          ...formData.planetDiskDetails?.tasarim,
          lamella: {
            ...currentLamellaData,
            secilenLamellaDebisi: debiGun, 
            secilenLamellaModeli: targetModelId,
            gerekliLamellaAlani: formattedAlan,
            gerekliLamellaHacmi: formattedHacim,
            lamellaAdet: finalLamellaAdet,
            camurPompasi: targetCamurPompasiObj,
            camurPompasiAdet: targetPumpAdet,
            secilenModelAlan: targetModelAlan,   
            secilenModelHacim: targetModelHacim  
          }
        }
      });
    }
  }, [
    debiGun, 
    isDebiChanged,
    autoCalculatedAdet, 
    gerekliAlan, 
    gerekliHacim, 
    updateSection, 
    loading, 
    centrifugePumps, 
    currentCamurPompasiId, 
    currentCamurPompasiObj, 
    currentCamurPompasiAdet, 
    currentLamellaData.lamellaAdet,
    currentModelId,
    secilenModel
  ]);

  const handleLocalChange = (e) => {
    const { name, value } = e.target;

    let targetCamurPompasiPayload = currentCamurPompasiObj;
    let updatedLamellaAdet = resolvedLamellaAdet;
    let updatedPumpAdet = currentCamurPompasiAdet;

    if (name === "camurPompasi") {
      const selectedRealPump = centrifugePumps.find(p => String(p.id) === String(value));
      if (selectedRealPump) {
        targetCamurPompasiPayload = {
          id: selectedRealPump.id,
          name: selectedRealPump.name,
          pompa_tipi: selectedRealPump.pompa_tipi,
          kw: selectedRealPump.kw
        };
      } else {
        targetCamurPompasiPayload = {};
      }
    }

    const nextLamellaState = {
      LamellabeklemeSuresiMin: displayBeklemeSuresi,
      lamellaKatsayisi: displayLamellaKatsayisi,
      secilenLamellaModeli: activeModelId,
      [name]: value
    };

    const nextBekleme = parseFloat(nextLamellaState.LamellabeklemeSuresiMin) || 0;
    const nextKatsayi = parseFloat(nextLamellaState.lamellaKatsayisi) || 0;

    const nextAlan = debiSaat * nextKatsayi;
    const nextHacim = debiSaat * (nextBekleme / 60);

    const targetModel = lamellaModels.find(m => m.id === nextLamellaState.secilenLamellaModeli);

    let nextAutoAdet = 0;
    if (targetModel) {
      nextAutoAdet = Math.ceil(Math.max(nextAlan / targetModel.alan, nextHacim / targetModel.hacim)) || 1;
    }

    if (name === "secilenLamellaModeli" || name === "LamellabeklemeSuresiMin" || name === "lamellaKatsayisi") {
      updatedLamellaAdet = nextAutoAdet;
      updatedPumpAdet = nextAutoAdet;
    }

    if (name === "lamellaAdet") {
      const parsedLamellaValue = parseInt(value, 10) || 0;
      updatedLamellaAdet = parsedLamellaValue;
      updatedPumpAdet = parsedLamellaValue;
    }

    if (name === "camurPompasiAdet") {
      updatedPumpAdet = parseInt(value, 10) || 0;
    }

    const targetModelAlan = targetModel ? targetModel.alan : 0;
    const targetModelHacim = targetModel ? targetModel.hacim : 0;

    updateSection("planetDiskDetails", {
      tasarim: {
        ...formData.planetDiskDetails?.tasarim,
        lamella: {
          ...currentLamellaData,
          [name]: name === "camurPompasi" ? targetCamurPompasiPayload : value,
          gerekliLamellaAlani: nextAlan.toFixed(2),
          gerekliLamellaHacmi: nextHacim.toFixed(2),
          lamellaAdet: updatedLamellaAdet,
          camurPompasiAdet: updatedPumpAdet,
          secilenModelAlan: targetModelAlan,   
          secilenModelHacim: targetModelHacim  
        }
      }
    });
  };

  if (loading) {
    return <div className="p-4 text-center text-white-50">Lamella parametreleri yükleniyor...</div>;
  }

  const isLamellaAdetManual = currentLamellaAdetInStore !== null && currentLamellaAdetInStore !== autoCalculatedAdet;

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

        <div className="p-3 rounded mb-2" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          
          <div className="mb-3">
            <label className="text-white-50 mb-1" style={{ fontSize: "11px" }}>Lamella Ünite Modeli ve Adedi</label>
            <div className="d-flex gap-1 align-items-center">
              <select
                name="secilenLamellaModeli"
                value={activeModelId}
                onChange={handleLocalChange}
                className="form-select form-select-sm text-warning fw-bold flex-grow-1 shadow-none"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.12)",
                  border: activeModelId ? "1px solid #10b981" : "1px solid #f59e0b",
                  borderRadius: "6px",
                  fontSize: "12px",
                  height: "36px"
                }}
              >
                <option value="" style={{ backgroundColor: "#1e293b", color: "#fff" }}>Seçiniz...</option>
                {lamellaModels.map((model) => (
                  <option key={model.id} value={model.id} style={{ backgroundColor: "#1e293b", color: "#fff" }}>
                    {model.name} (Hacim: {model.hacim}m³ / Alan: {model.alan}m²)
                  </option>
                ))}
              </select>

              <input
                type="number"
                name="lamellaAdet"
                min="0"
                value={resolvedLamellaAdet}
                onChange={handleLocalChange}
                disabled={!activeModelId}
                className="form-control form-control-sm text-warning fw-bold bg-dark border-0 text-center shadow-none"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.12)",
                  border: isLamellaAdetManual ? "1px solid #f59e0b" : "1px solid #10b981",
                  borderRadius: "6px",
                  fontSize: "12px",
                  height: "36px",
                  width: "65px"
                }}
              />

              {isLamellaAdetManual && !isDebiChanged && (
                <button
                  type="button"
                  className="btn btn-warning p-0 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: "36px", height: "36px", borderRadius: "6px" }}
                  onClick={() => {
                    updateSection("planetDiskDetails", {
                      tasarim: {
                        ...formData.planetDiskDetails?.tasarim,
                        lamella: {
                          ...currentLamellaData,
                          lamellaAdet: autoCalculatedAdet,
                          camurPompasiAdet: autoCalculatedAdet, 
                          secilenModelAlan: secilenModel ? secilenModel.alan : 0,   
                          secilenModelHacim: secilenModel ? secilenModel.hacim : 0  
                        }
                      }
                    });
                  }}
                  title="Teorik Hesaplanan Adede Geri Dön"
                >
                  <i className="bi bi-arrow-counterclockwise text-dark" style={{ fontSize: "14px", fontWeight: "bold" }}></i>
                </button>
              )}
            </div>
          </div>

          <div className="mb-1">
            <label className="text-white-50 mb-1" style={{ fontSize: "11px" }}>Çamur Pompası Seçimi ve Adedi</label>
            <div className="d-flex gap-1 align-items-center">
              <select
                name="camurPompasi"
                value={isDebiChanged ? "" : currentCamurPompasiId}
                onChange={handleLocalChange}
                className="form-select form-select-sm text-warning fw-bold flex-grow-1 shadow-none"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.12)",
                  border: centrifugePumps.length > 0 && String(currentCamurPompasiId) !== String(centrifugePumps[0]?.id)
                    ? "1px solid #f59e0b"
                    : "1px solid #10b981",
                  borderRadius: "6px",
                  fontSize: "12px",
                  height: "36px"
                }}
                disabled={centrifugePumps.length === 0}
              >
                {centrifugePumps.length === 0 ? (
                  <option value="" style={{ backgroundColor: "#1e293b", color: "#fff" }}>Pompa bulunamadı...</option>
                ) : (
                  centrifugePumps.map((pump) => (
                    <option key={pump.id} value={pump.id} style={{ backgroundColor: "#1e293b", color: "#fff" }}>
                      {pump.name}
                    </option>
                  ))
                )}
              </select>

              <input
                type="number"
                name="camurPompasiAdet"
                min="0"
                value={isDebiChanged ? 0 : currentCamurPompasiAdet} 
                onChange={handleLocalChange}
                disabled={!activeModelId}
                className="form-control form-control-sm text-warning fw-bold bg-dark border-0 text-center shadow-none"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.12)",
                  border: currentCamurPompasiAdet !== resolvedLamellaAdet ? "1px solid #f59e0b" : "1px solid #10b981",
                  borderRadius: "6px",
                  fontSize: "12px",
                  height: "36px",
                  width: "65px"
                }}
              />
            </div>
          </div>

        </div>

        {secilenModel && !isDebiChanged && (
          <div className="p-2 rounded text-center mt-3" style={{ backgroundColor: "rgba(0, 135, 78, 0.1)", border: "1px solid rgba(0, 135, 78, 0.3)" }}>
            <div className="fs-4 fw-bold text-white">
              {resolvedLamellaAdet} <span style={{ fontSize: "14px" }}>Adet {secilenModel.name}</span>
            </div>
            <div className="text-white mt-1" style={{ fontSize: "10px" }}>
              Toplam Alan: {(resolvedLamellaAdet * secilenModel.alan).toFixed(2)} m² | Hacim: {(resolvedLamellaAdet * secilenModel.hacim).toFixed(2)} m³
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default LamellaParameters;