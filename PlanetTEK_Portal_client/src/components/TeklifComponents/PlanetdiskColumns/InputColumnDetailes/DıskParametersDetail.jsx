import React, { useEffect, useState } from "react";
import KademeDetail from "./KademeDetail";
import { useTeklifStore } from "../../../../utils/teklifStore";
import API from "../../../../utils/utilRequest";

function DiskParameters() {
    const [loading, setLoading] = useState(true);
    const [diskSinirlariMatrisi, setDiskSinirlariMatrisi] = useState({});

    const formData = useTeklifStore((state) => state.formData);
    const updateSection = useTeklifStore((state) => state.updateSection);

    const storePlanetDisk = formData.planetDiskDetails || {};
    const aritmaParametreleri = storePlanetDisk.tasarim?.aritmaParametreleri || {};

    const currentRBCUnite = aritmaParametreleri.RBCUnite || "MX";
    const currentAtiksutype = aritmaParametreleri.atiksutype || "evsel";
    const currentKapakSecimi = aritmaParametreleri.kapakSecimi || "Kapaklı";
    const currentRotorSecimi = aritmaParametreleri.rotorSecimi || false; // Rotor kontrolü burada

    // Arayüzdeki dropdown'ın o an hangi seçenekte duracağını belirleyen fonksiyon
    const getUIAktifModel = () => {
        if (currentRotorSecimi) return "MX_ROTOR";
        return currentRBCUnite; // "MX" veya "MINI" döndürür
    };

    const getDiskSinirlari = (uniteType, wastewaterType, matris) => {
        const aktifMatris = matris || diskSinirlariMatrisi;
        if (!aktifMatris || Object.keys(aktifMatris).length === 0) {
            return { minDisk: 0, maxDisk: 0 };
        }
        const uniteSinirlari = aktifMatris[uniteType] || aktifMatris["MX"];
        if (!uniteSinirlari) return { minDisk: 0, maxDisk: 0 };
        return uniteSinirlari[wastewaterType] || uniteSinirlari["evsel"];
    };

    // 1. API Çağrısı ve Store İlk Kurulumu
    useEffect(() => {
        const fetchAndInitParameters = async () => {
            try {
                const response = await API.getParamteters();
                const data = response.data || [];
                const paramMap = {};
                data.forEach(item => {
                    paramMap[item.parametre_key] = parseFloat(item.deger);
                });

                const matris = {
                    MX: {
                        evsel: { minDisk: paramMap["MX_evsel_min"], maxDisk: paramMap["MX_evsel_max"] },
                        endustriyel: { minDisk: paramMap["MX_endustriyel_min"], maxDisk: paramMap["MX_endustriyel_max"] }
                    },
                    MINI: {
                        evsel: { minDisk: paramMap["MINI_evsel_min"], maxDisk: paramMap["MINI_evsel_max"] },
                        endustriyel: { minDisk: paramMap["MINI_endustriyel_min"], maxDisk: paramMap["MINI_endustriyel_max"] }
                    }
                };

                setDiskSinirlariMatrisi(matris);

                const currentStore = useTeklifStore.getState().formData.planetDiskDetails || {};
                const currentParams = currentStore.tasarim?.aritmaParametreleri || {};

                if (currentParams.maxDisk === undefined || currentParams.minDisk === undefined) {
                    const sinirlar = getDiskSinirlari(currentRBCUnite, currentAtiksutype, matris);
                    
                    updateSection("planetDiskDetails", {
                        ...currentStore,
                        tasarim: {
                            ...currentStore?.tasarim,
                            aritmaParametreleri: {
                                ...currentParams,
                                RBCUnite: currentRBCUnite,
                                minDisk: sinirlar.minDisk,
                                maxDisk: sinirlar.maxDisk,
                                isDiskCountsManual: false,
                                kapakSecimi: currentRBCUnite === "MX" && !currentRotorSecimi ? "Kapaklı" : undefined,
                                rotorSecimi: currentRotorSecimi
                            }
                        }
                    });
                }

                setLoading(false);
            } catch (error) {
                console.error("Parametre verileri yüklenirken hata oldu:", error);
                setLoading(false);
            }
        };

        fetchAndInitParameters();
    }, []);

    // 2. Takip Efekti
    useEffect(() => {
        if (loading || !diskSinirlariMatrisi || Object.keys(diskSinirlariMatrisi).length === 0) return;
        if (aritmaParametreleri.isDiskCountsManual === true) return;

        const sinirlar = getDiskSinirlari(currentRBCUnite, currentAtiksutype);
        
        if (aritmaParametreleri.minDisk !== sinirlar.minDisk || aritmaParametreleri.maxDisk !== sinirlar.maxDisk) {
            updateSection("planetDiskDetails", {
                ...storePlanetDisk,
                tasarim: {
                    ...storePlanetDisk?.tasarim,
                    aritmaParametreleri: {
                        ...useTeklifStore.getState().formData.planetDiskDetails?.tasarim?.aritmaParametreleri,
                        minDisk: sinirlar.minDisk,
                        maxDisk: sinirlar.maxDisk
                    }
                }
            });
        }
    }, [currentRBCUnite, currentAtiksutype, loading, aritmaParametreleri.isDiskCountsManual]);

    const varsayilanSinirlar = getDiskSinirlari(currentRBCUnite, currentAtiksutype);
    const safeDiskData = {
        RBCUnite: currentRBCUnite,
        maxDisk: aritmaParametreleri.maxDisk !== undefined ? aritmaParametreleri.maxDisk : varsayilanSinirlar.maxDisk,
        minDisk: aritmaParametreleri.minDisk !== undefined ? aritmaParametreleri.minDisk : varsayilanSinirlar.minDisk,
    };

    if (loading) {
        return <div className="p-4 text-center text-white-50">Disk parametreleri yükleniyor...</div>;
    }

    const updateStore = (updatedParamData) => {
        updateSection("planetDiskDetails", {
            ...storePlanetDisk,
            tasarim: {
                ...storePlanetDisk.tasarim,
                aritmaParametreleri: updatedParamData
            }
        });
    };

    const handleStepChange = (name, type) => {
        let min = safeDiskData.minDisk;
        let max = safeDiskData.maxDisk;

        if (name === "minDisk") {
            if (type === "increment" && min < 150) min += 1;
            if (type === "decrement" && min > 50) min -= 1;
            if (min > max) max = min;
        }

        if (name === "maxDisk") {
            if (type === "increment" && max < 150) max += 1;
            if (type === "decrement" && max > 50) max -= 1;
            if (max < min) min = max;
        }

        updateStore({
            ...aritmaParametreleri,
            minDisk: min,
            maxDisk: max,
            isDiskCountsManual: true 
        });
    };

    const handleModelChange = (e) => {
        const { value } = e.target;
        
        // Eğer MX_ROTOR seçildiyse arka planda RBCUnite "MX" olmalı
        const gercekRBCUnite = value === "MX_ROTOR" ? "MX" : value;
        const isRotor = value === "MX_ROTOR";

        const yeniSinirlar = getDiskSinirlari(gercekRBCUnite, currentAtiksutype);

        updateStore({
            ...aritmaParametreleri,
            RBCUnite: gercekRBCUnite,
            minDisk: yeniSinirlar.minDisk,
            maxDisk: yeniSinirlar.maxDisk,
            isDiskCountsManual: false,
            rotorSecimi: isRotor, // İstediğin true/false flag ataması
            // MX Rotor ise kapakSecimi temizleniyor, MX veya MINI serisiyse varsayılan Kapaklı atanıyor
            kapakSecimi: isRotor ? undefined : "Kapaklı"
        });
    };

    const handleKapakSecimiChange = (e) => {
        const { value } = e.target;
        updateStore({
            ...aritmaParametreleri,
            kapakSecimi: value
        });
    };

    // UI Görünüm Koşulları
    const uiAktifModel = getUIAktifModel();
    const showKapakDropdown = uiAktifModel !== "MX_ROTOR"; // MX Rotor seçilirse Kapak Seçimi Gizlenir
    const columnClass = showKapakDropdown ? "col-3" : "col-4";

    return (
        <div className="card-body p-0 px-4">
            <div className="d-flex align-items-center mb-3">
                <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
                    PlanetDISK Seçimi ve Parametreleri
                </span>
                <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
            </div>

            <div className="p-3 rounded mb-3" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
                <div className="row g-2">
                    {/* Model / Tipi */}
                    <div className={columnClass}>
                        <label className="text-white-50 mb-1 d-block text-truncate" style={{ fontSize: "11px" }}>Model / Tipi</label>
                        <select
                            name="RBCUnite"
                            value={uiAktifModel}
                            onChange={handleModelChange}
                            className="form-select form-select-sm bg-dark text-white border-0"
                            style={{ fontSize: "12px", height: "31px" }}
                        >
                            <option value="MX">MX Serisi</option>
                            <option value="MINI">MINI Serisi</option>
                            <option value="MX_ROTOR">MX Rotor</option>
                        </select>
                    </div>

                    {/* Koşullu Kapak Seçimi Dropdown */}
                    {showKapakDropdown && (
                        <div className={columnClass}>
                            <label className="text-white-50 mb-1 d-block text-truncate" style={{ fontSize: "11px" }}>Kapak Seçimi</label>
                            <select
                                name="kapakSecimi"
                                value={currentKapakSecimi}
                                onChange={handleKapakSecimiChange}
                                className="form-select form-select-sm bg-dark text-white border-0"
                                style={{ fontSize: "12px", height: "31px" }}
                            >
                                <option value="Kapaklı">Kapaklı</option>
                                <option value="Kapaksız">Kapaksız</option>
                            </select>
                        </div>
                    )}

                    {/* Max Disk Adedi */}
                    <div className={columnClass}>
                        <label className="text-white-50 mb-1 d-block text-truncate" style={{ fontSize: "11px" }}>Max Disk Adedi</label>
                        <div className="d-flex align-items-center bg-dark rounded" style={{ height: "31px", overflow: "hidden" }}>
                            <button
                                type="button"
                                onClick={() => handleStepChange("maxDisk", "decrement")}
                                className="btn btn-sm text-white-50 border-0 px-2 h-100"
                                style={{ fontSize: "14px", backgroundColor: "rgba(255,255,255,0.05)" }}
                            >
                                −
                            </button>
                            <span className="flex-grow-1 text-white text-center fw-bold" style={{ fontSize: "12px", userSelect: "none" }}>
                                {safeDiskData.maxDisk}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleStepChange("maxDisk", "increment")}
                                className="btn btn-sm text-white-50 border-0 px-2 h-100"
                                style={{ fontSize: "14px", backgroundColor: "rgba(255,255,255,0.05)" }}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Min Disk Adedi */}
                    <div className={columnClass}>
                        <label className="text-white-50 mb-1 d-block text-truncate" style={{ fontSize: "11px" }}>Min Disk Adedi</label>
                        <div className="d-flex align-items-center bg-dark rounded" style={{ height: "31px", overflow: "hidden" }}>
                            <button
                                type="button"
                                onClick={() => handleStepChange("minDisk", "decrement")}
                                className="btn btn-sm text-white-50 border-0 px-2 h-100"
                                style={{ fontSize: "14px", backgroundColor: "rgba(255,255,255,0.05)" }}
                            >
                                −
                            </button>
                            <span className="flex-grow-1 text-white text-center fw-bold" style={{ fontSize: "12px", userSelect: "none" }}>
                                {safeDiskData.minDisk}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleStepChange("minDisk", "increment")}
                                className="btn btn-sm text-white-50 border-0 px-2 h-100"
                                style={{ fontSize: "14px", backgroundColor: "rgba(255,255,255,0.05)" }}
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <KademeDetail />
        </div>
    );
}

export default DiskParameters;