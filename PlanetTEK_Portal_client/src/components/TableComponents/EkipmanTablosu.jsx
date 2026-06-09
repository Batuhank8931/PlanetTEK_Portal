import React from "react";

function EkipmanTablosu() {


    return (
        <div className="d-flex flex-column gap-2">
            <div className="p-3 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
                <span className="text-white-50" style={{ fontSize: "12px" }}>Ana Ekipman Tipi:</span>
                <input
                    type="text"
                    className="form-control form-control-sm text-end fw-bold text-white p-0 bg-transparent border-0"
                    style={{ fontSize: "12px", width: "50%", boxShadow: "none" }}
                    placeholder="Pompa, Mikser vb..."
                />
            </div>
        </div>
    );
}

export default EkipmanTablosu;