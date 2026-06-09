import React from "react";

function EnerjiIsletmeTablosu() {


    return (
        <div className="d-flex flex-column gap-2">
            <div className="p-3 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
                <span className="text-white-50" style={{ fontSize: "12px" }}>Toplam Enerji Tüketimi:</span>
                <div className="d-flex align-items-center justify-content-end gap-2" style={{ width: "40%" }}>
                    <input
                        type="number"
                        className="form-control form-control-sm text-end fw-bold text-white p-0 bg-transparent border-0"
                        style={{ fontSize: "12px", boxShadow: "none" }}
                        placeholder="0.00"
                    />
                    <span className="text-white-50" style={{ fontSize: "11px" }}>kWh/gün</span>
                </div>
            </div>
        </div>
    );
}

export default EnerjiIsletmeTablosu;