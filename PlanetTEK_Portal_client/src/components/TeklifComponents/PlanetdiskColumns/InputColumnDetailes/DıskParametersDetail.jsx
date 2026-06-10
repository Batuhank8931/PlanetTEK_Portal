import React from "react";
import KademeDetail from "./KademeDetail";
import { useTeklifStore } from "../../../../utils/teklifStore";

const DISK_SINIRLARI_MATRISI = {
    MX: {
        evsel: { minDisk: 100, maxDisk: 140 },
        endustriyel: { minDisk: 90, maxDisk: 100 }
    },
    MINI: {
        evsel: { minDisk: 50, maxDisk: 75 },
        endustriyel: { minDisk: 45, maxDisk: 65 }
    }
};

function DiskParameters() {
    const formData = useTeklifStore((state) => state.formData);
    const updateSection = useTeklifStore((state) => state.updateSection);

    const storePlanetDisk = formData.planetDiskDetails || {};
    const aritmaParametreleri = storePlanetDisk.tasarim?.aritmaParametreleri || {};

    const currentRBCUnite = aritmaParametreleri.RBCUnite || "MX";
    const currentAtiksutype = aritmaParametreleri.atiksutype || "evsel";

    const getDiskSinirlari = (uniteType, wastewaterType) => {
        const uniteSınırları = DISK_SINIRLARI_MATRISI[uniteType] || DISK_SINIRLARI_MATRISI["MX"];
        return uniteSınırları[wastewaterType] || uniteSınırları["evsel"];
    };

    const varsayilanSinirlar = getDiskSinirlari(currentRBCUnite, currentAtiksutype);

    // Eğer store'da hiç değer yoksa varsayılan sınırları atıyoruz (Böylece ilk açılışta 0 kalmıyor)
    const safeDiskData = {
        RBCUnite: currentRBCUnite,
        maxDisk: aritmaParametreleri.maxDisk !== undefined ? aritmaParametreleri.maxDisk : varsayilanSinirlar.maxDisk,
        minDisk: aritmaParametreleri.minDisk !== undefined ? aritmaParametreleri.minDisk : varsayilanSinirlar.minDisk,
    };

    const updateStore = (updatedParamData) => {
        updateSection("planetDiskDetails", {
            ...storePlanetDisk,
            tasarim: {
                ...storePlanetDisk.tasarim,
                aritmaParametreleri: updatedParamData
            }
        });
    };

    // Değişim yönetimini tek bir merkezden ve güvenli sınırlarla yapıyoruz
    const handleStepChange = (name, type) => {
        let min = safeDiskData.minDisk;
        let max = safeDiskData.maxDisk;

        if (name === "minDisk") {
            if (type === "increment" && min < 150) min += 1;
            if (type === "decrement" && min > 50) min -= 1;
            
            // Çelişki kontrolü: Min artarken Max'ı geçerse Max'ı da beraberinde yukarı itsin
            if (min > max) max = min;
        }

        if (name === "maxDisk") {
            if (type === "increment" && max < 150) max += 1;
            if (type === "decrement" && max > 50) max -= 1;

            // Çelişki kontrolü: Max azalırken Min'in altına düşerse Min'i de aşağı çeksin
            if (max < min) min = max;
        }

        updateStore({
            ...aritmaParametreleri,
            minDisk: min,
            maxDisk: max
        });
    };

    // Dropdown değiştiğinde tetiklenen fonksiyon
    const handleModelChange = (e) => {
        const { value } = e.target;
        const yeniSinirlar = getDiskSinirlari(value, currentAtiksutype);

        updateStore({
            ...aritmaParametreleri,
            RBCUnite: value,
            minDisk: yeniSinirlar.minDisk,
            maxDisk: yeniSinirlar.maxDisk
        });
    };

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
                    <div className="col-4">
                        <label className="text-white-50 mb-1 d-block text-truncate" style={{ fontSize: "11px" }}>Model / Tipi</label>
                        <select
                            name="RBCUnite"
                            value={safeDiskData.RBCUnite}
                            onChange={handleModelChange}
                            className="form-select form-select-sm bg-dark text-white border-0"
                            style={{ fontSize: "12px", height: "31px" }}
                        >
                            <option value="MX">MX Serisi</option>
                            <option value="MINI">MINI Serisi</option>
                        </select>
                    </div>

                    {/* Max Disk Adedi */}
                    <div className="col-4">
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
                    <div className="col-4">
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