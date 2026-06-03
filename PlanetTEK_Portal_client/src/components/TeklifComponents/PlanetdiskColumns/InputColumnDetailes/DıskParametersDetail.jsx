import React from "react";
import KademeDetail from "./KademeDetail";
import { useTeklifStore } from "../../../../utils/teklifStore"; // Store yolunu kontrol edin

const DISK_CONFIGS = {
    MX: { maxDiskAdedi: 135, minDiskAdedi: 100, diskcapi: 2.05, hacim: 4.5 },
    MINI: { maxDiskAdedi: 75, minDiskAdedi: 50, diskcapi: 1.35, hacim: 2.00 },
    DEFAULT: { maxDiskAdedi: 135, minDiskAdedi: 100, secilenDiskTipi: "MX" }
};

function DiskParameters() {
    // 1. Store'dan doğru alanları süzüyoruz: formData ve updateSection
    const formData = useTeklifStore((state) => state.formData);
    const updateSection = useTeklifStore((state) => state.updateSection);

    // Biz bu adımdaki her şeyi store'da "planetDiskDetails" key'i altında topluyoruz
    const planetDiskDetails = formData.planetDiskDetails || {};
    const currentDiskData = planetDiskDetails.tasarim?.diskParametreleri;

    // Controlled component fallback mekanizması
    const safeDiskData = {
        secilenDiskTipi: currentDiskData?.secilenDiskTipi || DISK_CONFIGS.DEFAULT.secilenDiskTipi,
        maxDiskAdedi: currentDiskData?.maxDiskAdedi !== undefined ? currentDiskData.maxDiskAdedi : DISK_CONFIGS.DEFAULT.maxDiskAdedi,
        minDiskAdedi: currentDiskData?.minDiskAdedi !== undefined ? currentDiskData.minDiskAdedi : DISK_CONFIGS.DEFAULT.minDiskAdedi
    };

    const handleLocalChange = (e) => {
        const { name, value, type } = e.target;
        let parsedValue = value;

        if (type === "number") {
            parsedValue = value === "" ? "" : Number(value);
        }

        // Yeni parametre setini oluşturuyoruz
        let updatedDiskParams = {
            ...safeDiskData,
            [name]: parsedValue
        };

        // Model/Tip değiştiğinde otomatik alt/üst limitleri atıyoruz
        if (name === "secilenDiskTipi") {
            const config = DISK_CONFIGS[value] || DISK_CONFIGS.DEFAULT;
            updatedDiskParams.maxDiskAdedi = config.maxDiskAdedi;
            updatedDiskParams.minDiskAdedi = config.minDiskAdedi;
        }

        // 2. DOĞRU GÜNCELLEME: updateSection kullanarak doğrudan "planetDiskDetails"ı güncelliyoruz
        updateSection("planetDiskDetails", {
            tasarim: {
                ...planetDiskDetails.tasarim,
                diskParametreleri: updatedDiskParams
            }
        });
    };

    return (
        <div className="card-body p-0 px-4">
            <div className="d-flex align-items-center mb-3">
                <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
                    2. PlanetDISK Seçimi ve Parametreleri
                </span>
                <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
            </div>

            <div className="p-3 rounded mb-3" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
                <div className="row g-2">
                    <div className="col-4">
                        <label className="text-white-50 mb-1 d-block text-truncate" style={{ fontSize: "11px" }}>Model / Tipi</label>
                        <select
                            name="secilenDiskTipi"
                            value={safeDiskData.secilenDiskTipi}
                            onChange={handleLocalChange}
                            className="form-select form-select-sm bg-dark text-white border-0"
                            style={{ fontSize: "12px", height: "31px" }}
                        >
                            <option value="MX">MX Serisi</option>
                            <option value="MINI">MINI Serisi</option>
                        </select>
                    </div>

                    <div className="col-4">
                        <label className="text-white-50 mb-1 d-block text-truncate" style={{ fontSize: "11px" }}>Max Disk Adedi</label>
                        <input
                            type="number"
                            name="maxDiskAdedi"
                            value={safeDiskData.maxDiskAdedi}
                            onChange={handleLocalChange}
                            className="form-control form-control-sm bg-dark text-white border-0 text-center fw-bold"
                            style={{ fontSize: "12px", height: "31px" }}
                            min="0"
                        />
                    </div>

                    <div className="col-4">
                        <label className="text-white-50 mb-1 d-block text-truncate" style={{ fontSize: "11px" }}>Min Disk Adedi</label>
                        <input
                            type="number"
                            name="minDiskAdedi"
                            value={safeDiskData.minDiskAdedi}
                            onChange={handleLocalChange}
                            className="form-control form-control-sm bg-dark text-white border-0 text-center fw-bold"
                            style={{ fontSize: "12px", height: "31px" }}
                            min="0"
                        />
                    </div>
                </div>
            </div>

            <KademeDetail />
        </div>
    );
}

export default DiskParameters;