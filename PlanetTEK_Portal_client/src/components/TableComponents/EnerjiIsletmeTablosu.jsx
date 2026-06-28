import React, { useState, useEffect } from "react";
import enerjiIsletmeHesapFonksiyonu from "../../utils/EnerjiIsletmeHesap";
import { useTeklifStore } from "../../utils/teklifStore";

function EnerjiIsletmeTablosu() {
    const formData = useTeklifStore((state) => state.formData);
    const updateSection = useTeklifStore((state) => state.updateSection);

    const teklifDili = formData?.customerInfo?.teklifDili;

    // storeTabloVerisi'ni güvenli bir şekilde dizi kısmından okuyoruz
    const storeTabloVerisi = formData?.tables?.enerjiisletmettablosu?.rows || formData?.tables?.enerjiisletmettablosu || [];
    const storeDebi = formData?.planetDiskDetails?.tasarim?.aritmaParametreleri?.debi || 0;

    const [params, setParams] = useState({
        hydraulicLoad: storeDebi,
        energyPrice: 13,
    });

    // 1. KURAL: İlk açılışta sadece store'a bak. Varsa direkt render et, yoksa boş dizi başla.
    const [rows, setRows] = useState(() => {
        if (storeTabloVerisi && storeTabloVerisi.length > 0) {
            return storeTabloVerisi;
        }
        return [];
    });

    const [history, setHistory] = useState([]);
    const [activeMenuId, setActiveMenuId] = useState(null);

    const calculateRowConsumption = (row) => {
        if (row.isHeader || row.isSubHeader) return 0;
        const q = parseFloat(row.qty) || 0;
        const p = parseFloat(row.power) || 0;
        const c = (parseFloat(row.consumed) || 0) / 100;
        const h = parseFloat(row.hours) || 0;
        return q * p * c * h;
    };

    // Hesaplama değişkenleri
    const totalKwhDay = rows.reduce((sum, row) => sum + calculateRowConsumption(row), 0);
    const dailyFlowM3 = (parseFloat(params.hydraulicLoad) || 0) * 24;
    const consumptionPerM3 = dailyFlowM3 > 0 ? totalKwhDay / dailyFlowM3 : 0;
    const costPerM3Cent = consumptionPerM3 * (parseFloat(params.energyPrice) || 0);
    const dailyCostEuro = totalKwhDay * ((parseFloat(params.energyPrice) || 0) / 100);
    const yearlyCostEuro = dailyCostEuro * 365;

    // 2. KURAL: Eğer store'da veri yoksa (ilk kez açılıyorsa) fonksiyonu çalıştır ve store'a kaydet.
    useEffect(() => {
        if (!storeTabloVerisi || storeTabloVerisi.length === 0) {
            async function loadFromEngine() {
                try {
                    const freshRows = await enerjiIsletmeHesapFonksiyonu(formData);
                    setRows(freshRows);

                    // İlk yüklemede maliyeti de hesaplayıp obje halinde kaydediyoruz
                    const freshTotalKwhDay = freshRows.reduce((sum, row) => sum + calculateRowConsumption(row), 0);
                    const freshDailyCostEuro = freshTotalKwhDay * ((params.energyPrice || 13) / 100);
                    const freshYearlyCostEuro = freshDailyCostEuro * 365;

                    updateSection("tables", {
                        ...formData?.tables,
                        enerjiisletmettablosu: {
                            rows: freshRows,
                            yearlyCostEuro: freshYearlyCostEuro
                        }
                    });
                } catch (e) {
                    console.error("Asenkron motor çalışırken hata:", e);
                }
            }
            loadFromEngine();
        }
    }, []);

    // Üst panel debi input'unu store ile senkronize tutalım
    useEffect(() => {
        setParams((prev) => ({ ...prev, hydraulicLoad: storeDebi }));
    }, [storeDebi]);

    // Parametreler değiştikçe yıllık maliyet key'ini store'da güncel tutmak için useEffect ekliyoruz
    useEffect(() => {
        if (rows && rows.length > 0) {
            updateSection("tables", {
                ...formData?.tables,
                enerjiisletmettablosu: {
                    rows: [...rows],
                    yearlyCostEuro: yearlyCostEuro
                }
            });
        }
    }, [params.energyPrice, params.hydraulicLoad]);

    // 3. KURAL: Kullanıcı manuel bir değişiklik yaparsa store'u update et.
    const updateStoreWithNewRows = (newRows) => {
        setRows(newRows);

        // Yeni satırlara göre dinamik maliyeti anlık hesapla ve ek key ile kaydet
        const currentTotalKwhDay = newRows.reduce((sum, row) => sum + calculateRowConsumption(row), 0);
        const currentDailyCostEuro = currentTotalKwhDay * ((parseFloat(params.energyPrice) || 0) / 100);
        const currentYearlyCostEuro = currentDailyCostEuro * 365;

        updateSection("tables", {
            ...formData?.tables,
            enerjiisletmettablosu: {
                rows: [...newRows],
                yearlyCostEuro: currentYearlyCostEuro
            }
        });
    };

    // 4. KURAL: REFRESH BUTONU - Her şeyi sil, motoru çalıştır, render et ve store'a kaydet.
    const handleRefresh = async () => {
        setHistory([]);
        try {
            const freshRows = await enerjiIsletmeHesapFonksiyonu(formData);
            setRows(freshRows);

            const freshTotalKwhDay = freshRows.reduce((sum, row) => sum + calculateRowConsumption(row), 0);
            const freshDailyCostEuro = freshTotalKwhDay * ((parseFloat(params.energyPrice) || 0) / 100);
            const freshYearlyCostEuro = freshDailyCostEuro * 365;

            updateSection("tables", {
                ...formData?.tables,
                enerjiisletmettablosu: {
                    rows: freshRows,
                    yearlyCostEuro: freshYearlyCostEuro
                }
            });
        } catch (error) {
            console.error("Tablo yenilenirken hata oluştu:", error);
        }
    };

    const saveToHistory = (currentRows) => {
        setHistory([...history, JSON.stringify(currentRows)]);
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const previousRows = JSON.parse(history[history.length - 1]);
        updateStoreWithNewRows(previousRows);
        setHistory(history.slice(0, -1));
    };

    const handleCellChange = (id, field, val) => {
        saveToHistory(rows);
        const updatedRows = rows.map(row => row.id === id ? { ...row, [field]: val } : row);
        updateStoreWithNewRows(updatedRows);
    };

    const insertAfterRow = (index, type) => {
        saveToHistory(rows);
        const newId = `new_${Date.now()}`;
        let newRow = { id: newId, label: "" };

        if (type === 0) {
            newRow = { ...newRow, label: "YENİ ANA BAŞLIK", isHeader: true };
        } else if (type === 1) {
            newRow = { ...newRow, label: "Yeni Alt Başlık", isSubHeader: true };
        } else {
            newRow = { ...newRow, label: "Yeni Mekanik Ekipman", qty: 1, power: 0, consumed: 90, hours: 24 };
        }

        const updatedRows = [...rows];
        updatedRows.splice(index + 1, 0, newRow);
        updateStoreWithNewRows(updatedRows);
    };

    const deleteRow = (id) => {
        saveToHistory(rows);
        const updatedRows = rows.filter(row => row.id !== id);
        updateStoreWithNewRows(updatedRows);
    };

    const getRowBg = (row) => {
        if (row.isHeader) return "#0b1329";
        if (row.isSubHeader) return row.isLight ? "#2a3a52" : "#1e2d42";
        if (!row.isHeader && !row.isSubHeader && (parseFloat(row.qty) === 0)) return "#2a1515";
        return "#151f32";
    };

    return (
        <div className="d-flex flex-column w-100" onClick={() => setActiveMenuId(null)}>
            <style>{`
            .table-row-energy { border-bottom: 1px solid #334155; transition: background-color 0.15s ease; position: relative; }
            .table-row-energy:last-child { border-bottom: none; }
            .energy-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.05) !important; }
            .header-cell { font-size: 11px; font-weight: 700; color: #94a3b8; background-color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; text-align: center; }
            .param-input-top { background-color: #0f172a; border: 1px solid #475569; color: white; border-radius: 6px; padding: 3px 8px; font-size: 12px; width: 80px; text-align: right; font-weight: bold; }
            .opacity-hover:hover { opacity: 1 !important; }
            
            .dropdown-menu-custom {
                position: absolute;
                right: 4%;
                top: 80%;
                background-color: #0f172a;
                border: 1px solid #475569;
                border-radius: 6px;
                z-index: 100;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                padding: 4px 0;
                min-width: 130px;
            }
            .dropdown-item-custom {
                color: #cbd5e1;
                padding: 6px 12px;
                font-size: 11.5px;
                cursor: pointer;
                text-align: left;
                font-weight: 500;
            }
            .dropdown-item-custom:hover {
                background-color: #1e293b;
                color: white;
            }
        `}</style>

            <div className="d-flex flex-column rounded-3 overflow-x-auto" style={{ border: "1px solid #334155", width: "100%" }}>
                <div style={{ minWidth: "900px" }}>

                    {/* ÜST PANEL */}
                    <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
                        <div className="d-flex align-items-center gap-4">
                            <div className="fw-semibold text-white" style={{ fontSize: "14px" }}>
                                {teklifDili === "Yabancı" ? "Energy Operation Cost Table" : "Enerji İşletme Maliyeti Tablosu"}
                            </div>

                            <div className="d-flex align-items-center gap-3 border-start ps-4" style={{ borderColor: "#475569 !important" }}>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-white-50" style={{ fontSize: "12px" }}>
                                        {teklifDili === "Yabancı" ? "Total Hydraulic Load:" : "Hidrolik Yük:"}
                                    </span>
                                    <input type="number" className="param-input-top" value={params.hydraulicLoad} onChange={(e) => setParams({ ...params, hydraulicLoad: e.target.value })} />
                                    <span className="text-white-50" style={{ fontSize: "11px" }}>
                                        {teklifDili === "Yabancı" ? "m³/hour" : "m³/saat"}
                                    </span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-white-50" style={{ fontSize: "12px" }}>
                                        {teklifDili === "Yabancı" ? "Energy Price for 1 kW.hour:" : "Enerji Fiyatı:"}
                                    </span>
                                    <input type="number" className="param-input-top text-warning" value={params.energyPrice} onChange={(e) => setParams({ ...params, energyPrice: e.target.value })} />
                                    <span className="text-white-50" style={{ fontSize: "11px" }}>€ cent/kWh</span>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
                                style={{ backgroundColor: "#d97706", fontSize: "11px", borderRadius: "6px" }}
                                title={teklifDili === "Yabancı" ? "Reset Table to Initial Settings" : "Tabloyu İlk Ayarlarına Döndür"}
                            >
                                🔄 {teklifDili === "Yabancı" ? "Refresh" : "Yenile"}
                            </button>

                            <button
                                onClick={handleUndo}
                                disabled={history.length === 0}
                                className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
                                style={{
                                    backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a",
                                    fontSize: "11px",
                                    borderRadius: "6px",
                                    opacity: history.length === 0 ? 0.4 : 1,
                                    cursor: history.length === 0 ? "not-allowed" : "pointer"
                                }}
                            >
                                ↶
                            </button>
                        </div>
                    </div>

                    {/* TABLO BAŞLIKLARI */}
                    <div className="d-flex align-items-stretch border-bottom" style={{ borderColor: "#334155" }}>
                        <div className="p-2 px-3 header-cell text-start justify-content-start" style={{ width: "32%" }}>
                            {teklifDili === "Yabancı" ? "Mechanical Equipments / Units" : "Mekanik Ekipmanlar / Üniteler"}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-cell" style={{ width: "6%" }}>
                            {teklifDili === "Yabancı" ? "Unit" : "Adet"}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-cell" style={{ width: "10%" }}>
                            {teklifDili === "Yabancı" ? <>Unit Installed<br />Power (kW)</> : <>Birim Güç<br />(kW)</>}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-cell" style={{ width: "10%" }}>
                            {teklifDili === "Yabancı" ? <>Total Installed<br />Power (kW)</> : <>Toplam Güç<br />(kW)</>}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-cell" style={{ width: "9%" }}>
                            {teklifDili === "Yabancı" ? <>Power<br />Consumed (%)</> : <>Tüketim<br />(%)</>}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-cell" style={{ width: "10%" }}>
                            {teklifDili === "Yabancı" ? <>Daily Working<br />(hour)</> : <>Çalışma<br />(saat/gün)</>}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-cell text-end justify-content-end px-3" style={{ width: "18%" }}>
                            {teklifDili === "Yabancı" ? <>Electricity Consumption<br />(kW.hour/day)</> : <>Elektrik Tüketimi<br />(kWh/gün)</>}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-cell" style={{ width: "5%" }}>
                            {teklifDili === "Yabancı" ? "Action" : "Aksiyon"}
                        </div>
                    </div>

                    {/* TABLO SATIRLARI */}
                    <div>
                        {rows.map((row, index) => {
                            const isHeading = row.isHeader || row.isSubHeader;
                            const q = parseFloat(row.qty) || 0;
                            const p = parseFloat(row.power) || 0;
                            const totalPower = q * p;
                            const consumption = calculateRowConsumption(row);

                            return (
                                <div key={row.id} className="d-flex align-items-stretch table-row-energy" style={{ backgroundColor: getRowBg(row) }}>
                                    <div className="p-1 px-3 d-flex align-items-center" style={{ width: "32%" }}>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm text-start bg-transparent border-0 p-1 param-input rounded"
                                            style={{
                                                fontSize: isHeading ? "12.5px" : "12px",
                                                boxShadow: "none",
                                                width: "100%",
                                                fontWeight: isHeading ? "bold" : "500",
                                                color: row.isHeader ? "#60a5fa" : row.isSubHeader ? "#cbd5e1" : "white"
                                            }}
                                            value={row.label}
                                            onChange={(e) => handleCellChange(row.id, "label", e.target.value)}
                                        />
                                    </div>
                                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                    <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "6%" }}>
                                        {!isHeading && (
                                            <input
                                                type="number"
                                                className="form-control form-control-sm text-center bg-transparent border-0 energy-input fw-bold text-white"
                                                style={{ fontSize: "12px", boxShadow: "none" }}
                                                value={row.qty}
                                                onChange={(e) => handleCellChange(row.id, "qty", e.target.value)}
                                            />
                                        )}
                                    </div>
                                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                    <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "10%" }}>
                                        {!isHeading && (
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

                                    <div className="p-1 d-flex align-items-center justify-content-center fw-bold text-white" style={{ width: "10%", fontSize: "12px" }}>
                                        {!isHeading && totalPower.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                    </div>
                                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                    <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "9%" }}>
                                        {!isHeading && (
                                            <div className="d-flex align-items-center justify-content-center w-100">
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm text-center text-white bg-transparent border-0 energy-input"
                                                    style={{ fontSize: "12px", boxShadow: "none", width: "65%" }}
                                                    value={row.consumed}
                                                    onChange={(e) => handleCellChange(row.id, "consumed", e.target.value)}
                                                />
                                                <span className="text-white-50" style={{ fontSize: "10px" }}>%</span>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                    <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "10%" }}>
                                        {!isHeading && (
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

                                    <div className="p-1 px-3 d-flex align-items-center justify-content-end fw-bold" style={{ width: "18%", fontSize: "12px", color: "#4ade80" }}>
                                        {!isHeading && consumption.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                                    </div>
                                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                    <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "5%" }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === row.id ? null : row.id); }}
                                            className="btn btn-sm p-0 border-0 text-success opacity-50 opacity-hover fw-bold"
                                            style={{ fontSize: "16px", lineHeight: "1" }}
                                            title={teklifDili === "Yabancı" ? "Add Row" : "Satır Ekle"}
                                            type="button"
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => deleteRow(row.id)}
                                            className="btn btn-sm p-0 border-0 text-danger opacity-50 opacity-hover"
                                            style={{ fontSize: "16px", lineHeight: "1" }}
                                            title={teklifDili === "Yabancı" ? "Delete Row" : "Satırı Sil"}
                                            type="button"
                                        >
                                            &times;
                                        </button>

                                        {activeMenuId === row.id && (
                                            <div className="dropdown-menu-custom" onClick={(e) => e.stopPropagation()}>
                                                <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 0); setActiveMenuId(null); }}>
                                                    {teklifDili === "Yabancı" ? "+ Main Header" : "+ Ana Başlık"}
                                                </div>
                                                <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 1); setActiveMenuId(null); }}>
                                                    {teklifDili === "Yabancı" ? "+ Sub Header" : "+ Alt Başlık"}
                                                </div>
                                                <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 3); setActiveMenuId(null); }}>
                                                    {teklifDili === "Yabancı" ? "+ Normal Row" : "+ Normal Satır"}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ÖZET VE MALİYET PANELİ */}
                    <div className="d-flex flex-column overflow-hidden border-top" style={{ borderColor: "#475569", backgroundColor: "#0f172a" }}>
                        <div className="d-flex align-items-center p-2 px-3 border-bottom" style={{ borderColor: "#334155" }}>
                            <div className="fw-bold text-end text-white-50" style={{ width: "75%", fontSize: "12px" }}>
                                {teklifDili === "Yabancı" ? "TOTAL ELECTRICITY CONSUMPTION" : "TOPLAM ELEKTRİK TÜKETİMİ"}
                            </div>
                            <div className="fw-bold text-end text-white" style={{ width: "15%", fontSize: "13px" }}>{totalKwhDay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className="text-white-50 ms-2" style={{ fontSize: "11px" }}>
                                {teklifDili === "Yabancı" ? "kW.hour/day" : "kWh/gün"}
                            </div>
                        </div>

                        <div className="d-flex align-items-center p-2 px-3 border-bottom" style={{ borderColor: "#334155" }}>
                            <div className="fw-bold text-end text-white-50" style={{ width: "75%", fontSize: "12px" }}>
                                {teklifDili === "Yabancı" ? "ELECTRICITY CONSUMPTION PER 1 m³ WASTEWATER" : "1 m³ ATIKSU BAŞINA ELEKTRİK TÜKETİMİ"}
                            </div>
                            <div className="fw-bold text-end text-white" style={{ width: "15%", fontSize: "13px" }}>{consumptionPerM3.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className="text-white-50 ms-2" style={{ fontSize: "11px" }}>
                                {teklifDili === "Yabancı" ? "kW.hour / m³" : "kWh/m³"}
                            </div>
                        </div>

                        <div className="d-flex align-items-center p-2 px-3 border-bottom" style={{ borderColor: "#334155" }}>
                            <div className="fw-bold text-end text-white-50" style={{ width: "75%", fontSize: "12px" }}>
                                {teklifDili === "Yabancı" ? "ELECTRICITY COST PER 1 m³ WASTEWATER" : "1 m³ ATIKSU BAŞINA ELEKTRİK MALİYETİ"}
                            </div>
                            <div className="fw-bold text-end text-white" style={{ width: "15%", fontSize: "13px" }}>{costPerM3Cent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className="text-white-50 ms-2" style={{ fontSize: "11px" }}>
                                {teklifDili === "Yabancı" ? "cent / m³" : "cent/m³"}
                            </div>
                        </div>

                        <div className="d-flex align-items-center p-2 px-3 border-bottom" style={{ borderColor: "#334155" }}>
                            <div className="fw-bold text-end text-white-50" style={{ width: "75%", fontSize: "12px" }}>
                                {teklifDili === "Yabancı" ? "ELECTRICITY CONSUMPTION COST" : "ELEKTRİK TÜKETİM MALİYETİ (GÜNLÜK)"}
                            </div>
                            <div className="fw-bold text-end text-warning" style={{ width: "15%", fontSize: "14px" }}>{dailyCostEuro.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className="text-warning ms-2" style={{ fontSize: "11px" }}>
                                {teklifDili === "Yabancı" ? "€ / day" : "€ / gün"}
                            </div>
                        </div>

                        <div className="d-flex align-items-center p-2 px-3" style={{ backgroundColor: "#1e293b" }}>
                            <div className="fw-bold text-end text-white" style={{ width: "75%", fontSize: "12px" }}>
                                {teklifDili === "Yabancı" ? "ELECTRICITY CONSUMPTION COST" : "ELEKTRİK TÜKETİM MALİYETİ (YILLIK)"}
                            </div>
                            <div className="fw-bold text-end text-success" style={{ width: "15%", fontSize: "15px" }}>{yearlyCostEuro.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                            <div className="text-success ms-2" style={{ fontSize: "11px" }}>
                                {teklifDili === "Yabancı" ? "€ / year" : "€ / yıl"}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default EnerjiIsletmeTablosu;