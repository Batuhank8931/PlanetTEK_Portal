import React, { useState } from "react";

function EnerjiIsletmeTablosu() {
    const [params, setParams] = useState({
        hydraulicLoad: 2.92,
        energyPrice: 13,
    });

    const [rows, setRows] = useState([
        { id: "h1", label: "MEKANİK EKİPMANLAR", isHeader: true },
        { id: "s1", label: "Fiziksel Arıtma Üniteleri (Birincil Arıtma)", isSubHeader: true },
        { id: "r1", label: "Otomatik Temizlemeli Kaba Izgara", qty: 0, power: 0.55, consumed: 90, hours: 4 },
        { id: "r2", label: "Otomatik Temizlemeli İnce Izgara", qty: 0, power: 0.55, consumed: 90, hours: 4 },
        { id: "r3", label: "Dengeleme Tankı Terfi Pompası", qty: 1, power: 0.75, consumed: 90, hours: 24 },
        { id: "s2", label: "Biyolojik Arıtma Üniteleri (İkincil Arıtma)", isSubHeader: true },
        { id: "r4", label: "PlanetDISK® MX 1 RBC Ünitesi", qty: 8, power: 0.37, consumed: 90, hours: 24 },
        { id: "r5", label: "PlanetDISK® MX 1 RBC Ünitesi (2. ve 3. kademe)", qty: 0, power: 0.37, consumed: 90, hours: 24 },
        { id: "r6", label: "Son Çöktürme Tankı Çamur Pompası", qty: 1, power: 0.75, consumed: 90, hours: 1 },
        { id: "r7", label: "Resürkilasyon Pompaları", qty: 0, power: 0.75, consumed: 90, hours: 24 },
        { id: "r8", label: "Anoksik Tank Mikseri", qty: 0, power: 0, consumed: 90, hours: 24 },
        { id: "r9", label: "FeCl3 Dozaj Pompası", qty: 0, power: 0.09, consumed: 90, hours: 24 },
        { id: "s3", label: "Filtrasyon ve Dezenfeksiyon Üniteleri (İleri Arıtma)", isSubHeader: true },
        { id: "r10", label: "Ön Klorlama Ünitesi", qty: 0, power: 0.09, consumed: 90, hours: 22 },
        { id: "r11", label: "Filtrasyon Sistemi Besleme Pompası", qty: 0, power: 1.5, consumed: 90, hours: 22 },
        { id: "r12", label: "Filtrasyon Sistemi Geri Yıkama Pompası", qty: 0, power: 2.2, consumed: 90, hours: 2 },
        { id: "s4", label: "Planet Membran Ünitesi (İleri Arıtma)", isSubHeader: true },
        { id: "r13", label: "Blower", qty: 0, power: 1.6, consumed: 90, hours: 24 },
        { id: "r14", label: "Filtrasyon Pompası", qty: 0, power: 0.55, consumed: 90, hours: 23 },
        { id: "r15", label: "Geri Yıkama Pompası", qty: 0, power: 0.55, consumed: 90, hours: 1 },
        { id: "r16", label: "Klor ve Asit Dozaj Pompası", qty: 0, power: 0.18, consumed: 90, hours: 1 },
        { id: "s5", label: "Çamur Susuzlaştırma Ünitesi", isSubHeader: true },
        { id: "r17", label: "Çamur Besleme Pompası", qty: 0, power: 1.5, consumed: 90, hours: 8 },
        { id: "r18", label: "Dekantör", qty: 0, power: 11.5, consumed: 90, hours: 20 },
        { id: "r19", label: "Süzüntü Suyu Pompası", qty: 0, power: 1.1, consumed: 90, hours: 8 },
        { id: "r20", label: "Filtrepress", qty: 0, power: 2.2, consumed: 90, hours: 8 },
        { id: "r21", label: "Polimer Dozaj Ünitesi", qty: 0, power: 0.09, consumed: 90, hours: 8 },
    ]);

    const [history, setHistory] = useState([]);

    const calculateRowConsumption = (row) => {
        if (row.isHeader || row.isSubHeader) return 0;
        const q = parseFloat(row.qty) || 0;
        const p = parseFloat(row.power) || 0;
        const c = (parseFloat(row.consumed) || 0) / 100;
        const h = parseFloat(row.hours) || 0;
        return q * p * c * h;
    };

    const totalKwhDay = rows.reduce((sum, row) => sum + calculateRowConsumption(row), 0);
    const dailyFlowM3 = (parseFloat(params.hydraulicLoad) || 0) * 24;
    const consumptionPerM3 = dailyFlowM3 > 0 ? totalKwhDay / dailyFlowM3 : 0;
    const costPerM3Cent = consumptionPerM3 * (parseFloat(params.energyPrice) || 0);
    const dailyCostEuro = totalKwhDay * ((parseFloat(params.energyPrice) || 0) / 100);
    const yearlyCostEuro = dailyCostEuro * 365;

    const saveToHistory = (currentRows) => {
        setHistory([...history, JSON.stringify(currentRows)]);
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        setRows(JSON.parse(history[history.length - 1]));
        setHistory(history.slice(0, -1));
    };

    const handleCellChange = (id, field, val) => {
        saveToHistory(rows);
        setRows(rows.map(row => row.id === id ? { ...row, [field]: val } : row));
    };

    const insertAfterRow = (index) => {
        saveToHistory(rows);
        const newId = `new_${Date.now()}`;
        const newRow = { id: newId, label: "Yeni Ekipman", qty: 1, power: 0, consumed: 90, hours: 24 };
        const updatedRows = [...rows];
        updatedRows.splice(index + 1, 0, newRow);
        setRows(updatedRows);
    };

    const deleteRow = (id) => {
        saveToHistory(rows);
        setRows(rows.filter(row => row.id !== id));
    };

    const getRowBg = (row) => {
        if (row.isHeader) return "#0b1329";
        if (row.isSubHeader) return "#1e2d42";
        if (!row.isHeader && !row.isSubHeader && (parseFloat(row.qty) === 0)) return "#2a1515";
        return "#151f32";
    };

    return (
        <div className="d-flex flex-column gap-3 w-100">
            <style>{`
                .energy-row { border-bottom: 1px solid #334155; }
                .energy-row:last-child { border-bottom: none; }
                .energy-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.05) !important; }
                .header-title-cell { font-size: 10px; font-weight: 800; color: #94a3b8; background-color: #090d16; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; text-align: center; }
                .param-input { background-color: #1e293b; border: 1px solid #475569; color: white; border-radius: 4px; padding: 2px 6px; }
            `}</style>

            <div className="d-flex justify-content-between align-items-end mb-2">
                <div className="d-flex flex-column gap-2">
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-white-50 fw-semibold" style={{ fontSize: "12px", width: "160px" }}>Toplam Hidrolik Yük:</span>
                        <input type="number" className="param-input text-end fw-bold" style={{ width: "80px", fontSize: "12px" }} value={params.hydraulicLoad} onChange={(e) => setParams({ ...params, hydraulicLoad: e.target.value })} />
                        <span className="text-white-50" style={{ fontSize: "12px" }}>m³/saat</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-white-50 fw-semibold" style={{ fontSize: "12px", width: "160px" }}>1 kWh Enerji Fiyatı:</span>
                        <input type="number" className="param-input text-end fw-bold text-warning" style={{ width: "80px", fontSize: "12px" }} value={params.energyPrice} onChange={(e) => setParams({ ...params, energyPrice: e.target.value })} />
                        <span className="text-white-50" style={{ fontSize: "12px" }}>€ cent</span>
                    </div>
                </div>

                <button
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1"
                    style={{ backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a", fontSize: "11px", borderRadius: "6px", opacity: history.length === 0 ? 0.4 : 1 }}
                >
                    <span style={{ fontSize: "12px" }}>↶</span>
                </button>
            </div>

            <div className="w-100" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <div className="d-flex flex-column rounded-3" style={{ border: "1px solid #334155", height: "auto", minWidth: "1050px" }}>
                    <div className="d-flex align-items-stretch border-bottom" style={{ borderColor: "#334155" }}>
                        <div className="p-2 px-3 header-title-cell justify-content-start" style={{ width: "34%" }}>MEKANİK EKİPMANLAR</div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-title-cell" style={{ width: "7%" }}>Adet</div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-title-cell" style={{ width: "10%" }}>Birim Kurulu<br />Güç (kW)</div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-title-cell" style={{ width: "10%" }}>Toplam Kurulu<br />Güç (kW)</div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-title-cell" style={{ width: "10%" }}>Tüketilen<br />Güç (%)</div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-title-cell" style={{ width: "10%" }}>Günlük<br />Çalışma (saat)</div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-title-cell" style={{ width: "13%" }}>Elektrik Tüketimi<br />(kWh/gün)</div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-title-cell" style={{ width: "6%" }}></div>
                    </div>

                    {rows.map((row, index) => {
                        const q = parseFloat(row.qty) || 0;
                        const p = parseFloat(row.power) || 0;
                        const totalPower = q * p;
                        const consumption = calculateRowConsumption(row);
                        const isZero = q === 0;
                        const numColor = isZero ? "#ef4444" : "white";

                        return (
                            <div key={row.id} className="d-flex align-items-stretch energy-row" style={{ backgroundColor: getRowBg(row) }}>
                                <div className="p-1 px-3 d-flex align-items-center" style={{ width: "34%" }}>
                                    {row.isHeader || row.isSubHeader ? (
                                        <span className="text-white fw-bold" style={{ fontSize: row.isHeader ? "13px" : "11.5px", color: row.isHeader ? "#60a5fa" : "#cbd5e1" }}>
                                            {row.label}
                                        </span>
                                    ) : (
                                        <input
                                            type="text"
                                            className="form-control form-control-sm text-start text-white bg-transparent border-0 fw-medium p-1 energy-input"
                                            style={{ fontSize: "11.5px", boxShadow: "none", width: "100%" }}
                                            value={row.label}
                                            onChange={(e) => handleCellChange(row.id, "label", e.target.value)}
                                        />
                                    )}
                                </div>
                                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "7%" }}>
                                    {!row.isHeader && !row.isSubHeader && (
                                        <input
                                            type="number"
                                            className="form-control form-control-sm text-center bg-transparent border-0 energy-input fw-bold"
                                            style={{ fontSize: "12px", boxShadow: "none", color: numColor }}
                                            value={row.qty}
                                            onChange={(e) => handleCellChange(row.id, "qty", e.target.value)}
                                        />
                                    )}
                                </div>
                                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "10%" }}>
                                    {!row.isHeader && !row.isSubHeader && (
                                        <input
                                            type="number"
                                            className="form-control form-control-sm text-center text-white bg-transparent border-0 energy-input"
                                            style={{ fontSize: "12px", boxShadow: "none" }}
                                            value={row.power}
                                            onChange={(e) => handleCellChange(row.id, "power", e.target.value)}
                                        />
                                    )}
                                </div>
                                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                <div className="p-1 d-flex align-items-center justify-content-center fw-bold" style={{ width: "10%", fontSize: "11.5px", color: numColor }}>
                                    {!row.isHeader && !row.isSubHeader && totalPower.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                </div>
                                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "10%" }}>
                                    {!row.isHeader && !row.isSubHeader && (
                                        <div className="d-flex align-items-center justify-content-center w-100">
                                            <input
                                                type="number"
                                                className="form-control form-control-sm text-center text-white bg-transparent border-0 energy-input"
                                                style={{ fontSize: "12px", boxShadow: "none", width: "60%" }}
                                                value={row.consumed}
                                                onChange={(e) => handleCellChange(row.id, "consumed", e.target.value)}
                                            />
                                            <span className="text-white-50" style={{ fontSize: "10px" }}>%</span>
                                        </div>
                                    )}
                                </div>
                                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "10%" }}>
                                    {!row.isHeader && !row.isSubHeader && (
                                        <input
                                            type="number"
                                            className="form-control form-control-sm text-center text-white bg-transparent border-0 energy-input"
                                            style={{ fontSize: "12px", boxShadow: "none" }}
                                            value={row.hours}
                                            onChange={(e) => handleCellChange(row.id, "hours", e.target.value)}
                                        />
                                    )}
                                </div>
                                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                <div className="p-1 px-2 d-flex align-items-center justify-content-end fw-bold" style={{ width: "13%", fontSize: "12px", color: isZero ? "#ef4444" : "#4ade80" }}>
                                    {!row.isHeader && !row.isSubHeader && consumption.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                                </div>
                                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "6%" }}>
                                    <button onClick={() => insertAfterRow(index)} className="btn btn-sm p-0 border-0 text-success opacity-50 hover-opacity-100 fw-bold" style={{ fontSize: "15px", lineHeight: "1" }} title="Altına Satır Ekle">+</button>
                                    <button onClick={() => deleteRow(row.id)} className="btn btn-sm p-0 border-0 text-danger opacity-40 hover-opacity-100" style={{ fontSize: "16px", lineHeight: "1" }} title="Satırı Sil">&times;</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-2 d-flex flex-column rounded-3 overflow-hidden border" style={{ borderColor: "#475569", backgroundColor: "#0f172a" }}>
                <div className="d-flex align-items-center p-2 px-3 border-bottom" style={{ borderColor: "#334155" }}>
                    <div className="fw-bold text-end text-white-50" style={{ width: "75%", fontSize: "12px" }}>TOPLAM ELEKTRİK TÜKETİMİ</div>
                    <div className="fw-bold text-end text-white" style={{ width: "15%", fontSize: "13px" }}>{totalKwhDay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-white-50 ms-2" style={{ fontSize: "11px" }}>kWh/gün</div>
                </div>

                <div className="d-flex align-items-center p-2 px-3 border-bottom" style={{ borderColor: "#334155" }}>
                    <div className="fw-bold text-end text-white-50" style={{ width: "75%", fontSize: "12px" }}>1 m³ atıksu başına elektrik tüketimi</div>
                    <div className="fw-bold text-end text-white" style={{ width: "15%", fontSize: "13px" }}>{consumptionPerM3.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-white-50 ms-2" style={{ fontSize: "11px" }}>kWh/m³</div>
                </div>

                <div className="d-flex align-items-center p-2 px-3 border-bottom" style={{ borderColor: "#334155" }}>
                    <div className="fw-bold text-end text-white-50" style={{ width: "75%", fontSize: "12px" }}>1 m³ atıksu başına elektrik maliyeti</div>
                    <div className="fw-bold text-end text-white" style={{ width: "15%", fontSize: "13px" }}>{costPerM3Cent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-white-50 ms-2" style={{ fontSize: "11px" }}>cent/m³</div>
                </div>

                <div className="d-flex flex-column p-2 px-3" style={{ backgroundColor: "#1e293b" }}>
                    <div className="d-flex align-items-center mb-1">
                        <div className="fw-bold text-end text-white" style={{ width: "75%", fontSize: "13px" }}>Elektrik Tüketim Maliyeti (Günlük)</div>
                        <div className="fw-bold text-end text-warning" style={{ width: "15%", fontSize: "14px" }}>{dailyCostEuro.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-warning ms-2" style={{ fontSize: "11px" }}>€ / gün</div>
                    </div>
                    <div className="d-flex align-items-center">
                        <div className="fw-bold text-end text-white" style={{ width: "75%", fontSize: "13px" }}>Elektrik Tüketim Maliyeti (Yıllık)</div>
                        <div className="fw-bold text-end text-success" style={{ width: "15%", fontSize: "15px" }}>{yearlyCostEuro.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                        <div className="text-success ms-2" style={{ fontSize: "11px" }}>€ / yıl</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EnerjiIsletmeTablosu;