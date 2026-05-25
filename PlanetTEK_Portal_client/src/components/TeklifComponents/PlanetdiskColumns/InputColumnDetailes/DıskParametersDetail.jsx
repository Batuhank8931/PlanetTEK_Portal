import React, { useEffect } from "react";
import KademeDetail from "./KademeDetail";

function DiskParameters({ data = {}, updateData }) {
    // Verileri artık kendine ait temiz diskParametreleri düğümünden okuyoruz
    const currentDiskData = data?.tasarim?.diskParametreleri;

    // İlk kurulumda diskParametreleri objesini varsayılan değerlerle açıyoruz
    useEffect(() => {
        if (updateData && data?.tasarim && !data.tasarim.diskParametreleri) {
            updateData({
                ...data,
                tasarim: {
                    ...(data?.tasarim || {}),
                    diskParametreleri: {
                        secilenDiskTipi: "MX",
                        maxDiskAdedi: 135,
                        minDiskAdedi: 100
                    }
                }
            });
        }
    }, [data, updateData]);

    const handleLocalChange = (e) => {
        if (!updateData) return;

        const { name, value, type } = e.target;
        let parsedValue = value;
        if (type === "number") {
            parsedValue = value === "" ? "" : Number(value);
        }

        updateData({
            ...data,
            tasarim: {
                ...(data?.tasarim || {}),
                // Doğrudan diskParametreleri altına kilitledik
                diskParametreleri: {
                    ...(data?.tasarim?.diskParametreleri || {}),
                    [name]: parsedValue
                }
            }
        });
    };

    const safeDiskData = currentDiskData || { secilenDiskTipi: "MX", maxDiskAdedi: 135, minDiskAdedi: 100 };

    return (
        <div className="card-body p-0 px-4">
            {/* Başlık Bölümü */}
            <div className="d-flex align-items-center mb-3">
                <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
                    2. PlanetDISK Seçimi
                </span>
                <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
            </div>

            {/* Seçim Alanları */}
            <div className="p-2 rounded mb-3" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
                <div className="row g-2">
                    <div className="col-4">
                        <label className="text-white-50 mb-1 d-block text-truncate" style={{ fontSize: "11px" }}>Model / Tipi</label>
                        <select
                            name="secilenDiskTipi"
                            value={safeDiskData.secilenDiskTipi}
                            onChange={handleLocalChange}
                            className="form-select form-select-sm bg-dark text-white border-0"
                            style={{ fontSize: "12px" }}
                        >
                            <option value="">Seçiniz...</option>
                            <option value="MX">MX</option>
                            <option value="MINI">MINI</option>
                        </select>
                    </div>

                    <div className="col-4">
                        <label className="text-white-50 mb-1 d-block text-truncate" style={{ fontSize: "11px" }}>Max Disk Adedi</label>
                        <input
                            type="number"
                            name="maxDiskAdedi"
                            value={safeDiskData.maxDiskAdedi !== undefined ? safeDiskData.maxDiskAdedi : ""}
                            onChange={handleLocalChange}
                            className="form-control form-control-sm bg-dark text-white border-0 text-center fw-bold"
                            style={{ fontSize: "12px" }}
                        />
                    </div>

                    <div className="col-4">
                        <label className="text-white-50 mb-1 d-block text-truncate" style={{ fontSize: "11px" }}>Min Disk Adedi</label>
                        <input
                            type="number"
                            name="minDiskAdedi"
                            value={safeDiskData.minDiskAdedi !== undefined ? safeDiskData.minDiskAdedi : ""}
                            onChange={handleLocalChange}
                            className="form-control form-control-sm bg-dark text-white border-0 text-center fw-bold"
                            style={{ fontSize: "12px" }}
                        />
                    </div>
                </div>
            </div>

            {/* Arıtma Kademeleri Paneli */}
            <KademeDetail
                data={data}
                updateData={updateData}
            />
        </div>
    );
}

export default DiskParameters;