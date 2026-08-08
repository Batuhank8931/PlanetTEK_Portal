import React, { useState, useEffect } from "react";
import enerjiIsletmeHesapFonksiyonu from "../../utils/EnerjiIsletmeHesap";
import { useTeklifStore } from "../../utils/teklifStore";

function EnerjiIsletmeTablosu() {
    const formData = useTeklifStore((state) => state.formData);
    const updateSection = useTeklifStore((state) => state.updateSection);

    const teklifDili = formData?.customerInfo?.teklifDili;
    const currency = formData?.customerInfo?.currency || "EUR";
    const unitSystem = formData?.customerInfo?.unitSystem || "Metric";
    const exchangeRate = parseFloat(formData?.customerInfo?.exchangeRate) || 1.0000;

    const storeTabloVerisi = formData?.tables?.enerjiisletmettablosu?.rows || formData?.tables?.enerjiisletmettablosu || [];
    const displayDailyFlow = formData?.planetDiskDetails?.tasarim?.aritmaParametreleri?.debi || 0;
    const storeDebi = unitSystem === "US" ? displayDailyFlow * 264.172 : displayDailyFlow;

    // 🌟 Lokasyon bazlı format seçimi
    const isForeign = teklifDili === "Yabancı";
    const activeLocale = isForeign ? "en-US" : "tr-TR";

    // Sayı Formatlama Fonksiyonu (Düz Metin Hücreleri İçin)
    const formatNumber = (value, minFraction = 0, maxFraction = 2) => {
        if (isNaN(value)) return "0";
        return value.toLocaleString(activeLocale, {
            minimumFractionDigits: minFraction,
            maximumFractionDigits: maxFraction
        });
    };

    // 🌟 Input Alanlarında Formatlı Gösterim İçin Yardımcı Fonksiyon
    const formatInputValue = (val) => {
        if (val === undefined || val === null || val === "") return "";
        const num = parseFloat(val);
        if (isNaN(num)) return val;

        return num.toLocaleString(activeLocale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    };

    // 🌟 Formatlanmış string değerini temiz JS float'ına çevirir
    const parseInputValue = (val) => {
        if (!val) return 0;

        let cleanVal = val.toString();
        if (isForeign) {
            cleanVal = cleanVal.replace(/,/g, "");
        } else {
            cleanVal = cleanVal.replace(/\./g, "").replace(",", ".");
        }
        return parseFloat(cleanVal) || 0;
    };
    
    const [params, setParams] = useState({
        hydraulicLoad: storeDebi,
        energyPrice: 13,
    });

    // İnputların anlık string değerlerini tutacak local stateler
    const [inputHydraulic, setInputHydraulic] = useState(formatInputValue(storeDebi));
    const [inputEnergyPrice, setInputEnergyPrice] = useState(formatInputValue((13 * exchangeRate).toFixed(2)));

    const [rows, setRows] = useState(() => {
        if (storeTabloVerisi && storeTabloVerisi.length > 0) return storeTabloVerisi;
        return [];
    });

    const [history, setHistory] = useState([]);
    const [activeMenuId, setActiveMenuId] = useState(null);

    // Sync input values when params or exchangeRate changes
    useEffect(() => {
        setInputHydraulic(formatInputValue(params.hydraulicLoad));
    }, [params.hydraulicLoad]);

    useEffect(() => {
        setInputEnergyPrice(formatInputValue((params.energyPrice * exchangeRate).toFixed(2)));
    }, [params.energyPrice, exchangeRate]);

    const getCurrencySymbol = () => {
        if (currency === "USD") return "$";
        if (currency === "TRY") return "₺";
        return "€";
    };

    const getCentSymbol = () => {
        if (currency === "USD") return "¢";
        if (currency === "TRY") return "krş";
        return "ct";
    };

    const getFlowUnitLabel = () => {
        if (unitSystem === "US") return "GPD";
        return isForeign ? "m³/day" : "m³/gün";
    };

    const calculateRowConsumption = (row) => {
        if (row.isHeader || row.isSubHeader) return 0;
        const q = parseFloat(row.qty) || 0;
        const p = parseFloat(row.power) || 0;
        const c = (parseFloat(row.consumed) || 0) / 100;
        const h = parseFloat(row.hours) || 0;
        return q * p * c * h;
    };

    // 🌟 ÖZET HESAPLAMA FONKSİYONU (Dışarıdan verilen rows array'i üzerinden anlık hesaplar)
    const getSummaryPayload = (targetRows = rows, currentParams = params) => {
        const totalKwhDayVal = (targetRows || []).reduce((sum, row) => sum + calculateRowConsumption(row), 0);

        const dailyFlowM3Val = unitSystem === "US"
            ? (parseFloat(currentParams.hydraulicLoad) || 0) / 264.172
            : (parseFloat(currentParams.hydraulicLoad) || 0);

        const consumptionPerM3Val = dailyFlowM3Val > 0 ? totalKwhDayVal / dailyFlowM3Val : 0;
        const costPerM3CentVal = consumptionPerM3Val * (parseFloat(currentParams.energyPrice) || 0) * exchangeRate;

        const dailyCostConvertedVal = totalKwhDayVal * ((parseFloat(currentParams.energyPrice) || 0) / 100) * exchangeRate;
        const yearlyCostConvertedVal = dailyCostConvertedVal * 365;

        const consumptionPerUnitVal = unitSystem === "US" ? consumptionPerM3Val / 264.172 : consumptionPerM3Val;
        const costPerUnitCentVal = unitSystem === "US" ? costPerM3CentVal / 264.172 : costPerM3CentVal;

        const volumeUnit = unitSystem === "US" ? "gal" : "m³";
        const kwhUnit = isForeign ? "kW.hour/day" : "kWh/gün";
        const unitConsumptionLabel = unitSystem === "US" ? "kWh/gal" : "kWh/m³";
        const unitCostLabel = `${getCentSymbol()}/${volumeUnit}`;
        const dailyCostLabel = `${getCurrencySymbol()} / ${isForeign ? "day" : "gün"}`;
        const yearlyCostLabel = `${getCurrencySymbol()} / ${isForeign ? "year" : "yıl"}`;

        return {
            summary: {
                totalElectricityConsumption: {
                    value: totalKwhDayVal,
                    formatted: formatNumber(totalKwhDayVal, 2, 2),
                    unit: kwhUnit
                },
                consumptionPerUnitWastewater: {
                    value: consumptionPerUnitVal,
                    formatted: formatNumber(consumptionPerUnitVal, 4, 6),
                    unit: unitConsumptionLabel
                },
                costPerUnitWastewater: {
                    value: costPerUnitCentVal,
                    formatted: formatNumber(costPerUnitCentVal, 4, 6),
                    unit: unitCostLabel
                },
                dailyElectricityCost: {
                    value: dailyCostConvertedVal,
                    formatted: formatNumber(dailyCostConvertedVal, 2, 2),
                    unit: dailyCostLabel
                },
                yearlyElectricityCost: {
                    value: yearlyCostConvertedVal,
                    formatted: formatNumber(yearlyCostConvertedVal, 0, 0),
                    unit: yearlyCostLabel
                }
            }
        };
    };

    // Render hesaplamaları (UI için)
    const summaryData = getSummaryPayload(rows, params).summary;

    useEffect(() => {
        if (!storeTabloVerisi || storeTabloVerisi.length === 0) {
            async function loadFromEngine() {
                try {
                    const freshRows = await enerjiIsletmeHesapFonksiyonu(formData);
                    setRows(freshRows);
                    const freshTotalKwhDay = freshRows.reduce((sum, row) => sum + calculateRowConsumption(row), 0);
                    const freshDailyCostEuro = freshTotalKwhDay * ((params.energyPrice || 13) / 100);
                    const freshYearlyCostEuro = freshDailyCostEuro * 365;

                    updateSection("tables", {
                        ...formData?.tables,
                        enerjiisletmettablosu: { 
                            rows: freshRows, 
                            yearlyCostEuro: freshYearlyCostEuro,
                            inputEnergyPrice,
                            inputHydraulic,
                            energyPrice: params.energyPrice,
                            hydraulicLoad: params.hydraulicLoad,
                            ...getSummaryPayload(freshRows, params)
                        }
                    });
                } catch (e) {
                    console.error(e);
                }
            }
            loadFromEngine();
        }
    }, []);

    useEffect(() => {
        setParams((prev) => ({ ...prev, hydraulicLoad: storeDebi }));
    }, [storeDebi]);

    // 🌟 Metrikler veya parametreler değiştiğinde store'a yansıtma
    useEffect(() => {
        if (rows && rows.length > 0) {
            const currentTableState = formData?.tables?.enerjiisletmettablosu;
            const summaryPayload = getSummaryPayload(rows, params);
            
            if (
                currentTableState?.inputEnergyPrice !== inputEnergyPrice ||
                currentTableState?.inputHydraulic !== inputHydraulic ||
                currentTableState?.energyPrice !== params.energyPrice ||
                currentTableState?.hydraulicLoad !== params.hydraulicLoad ||
                currentTableState?.summary?.totalElectricityConsumption?.value !== summaryPayload.summary.totalElectricityConsumption.value
            ) {
                const totalKwhDayVal = summaryPayload.summary.totalElectricityConsumption.value;
                const rawDaily = totalKwhDayVal * ((parseFloat(params.energyPrice) || 0) / 100);
                
                updateSection("tables", {
                    ...formData?.tables,
                    enerjiisletmettablosu: { 
                        ...currentTableState,
                        rows: [...rows], 
                        yearlyCostEuro: rawDaily * 365,
                        inputEnergyPrice,
                        inputHydraulic,
                        energyPrice: params.energyPrice,
                        hydraulicLoad: params.hydraulicLoad,
                        ...summaryPayload
                    }
                });
            }
        }
    }, [params.energyPrice, params.hydraulicLoad, inputEnergyPrice, inputHydraulic, rows]);

    const updateStoreWithNewRows = (newRows) => {
        setRows(newRows);
        const summaryPayload = getSummaryPayload(newRows, params);
        const totalKwhDayVal = summaryPayload.summary.totalElectricityConsumption.value;
        const currentDailyCostEuro = totalKwhDayVal * ((parseFloat(params.energyPrice) || 0) / 100);

        updateSection("tables", {
            ...formData?.tables,
            enerjiisletmettablosu: { 
                ...formData?.tables?.enerjiisletmettablosu,
                rows: [...newRows], 
                yearlyCostEuro: currentDailyCostEuro * 365,
                inputEnergyPrice,
                inputHydraulic,
                energyPrice: params.energyPrice,
                hydraulicLoad: params.hydraulicLoad,
                ...summaryPayload
            }
        });
    };

    const handleRefresh = async () => {
        setHistory([]);
        try {
            const freshRows = await enerjiIsletmeHesapFonksiyonu(formData);
            setRows(freshRows);
            const summaryPayload = getSummaryPayload(freshRows, params);
            const totalKwhDayVal = summaryPayload.summary.totalElectricityConsumption.value;
            const freshDailyCostEuro = totalKwhDayVal * ((parseFloat(params.energyPrice) || 0) / 100);

            updateSection("tables", {
                ...formData?.tables,
                enerjiisletmettablosu: { 
                    rows: freshRows, 
                    yearlyCostEuro: freshDailyCostEuro * 365,
                    inputEnergyPrice,
                    inputHydraulic,
                    energyPrice: params.energyPrice,
                    hydraulicLoad: params.hydraulicLoad,
                    ...summaryPayload
                }
            });
        } catch (error) {
            console.error(error);
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
        const parsedVal = parseInputValue(val);
        const updatedRows = rows.map(row => row.id === id ? { ...row, [field]: parsedVal } : row);
        updateStoreWithNewRows(updatedRows);
    };

    const insertAfterRow = (index, type) => {
        saveToHistory(rows);
        const newId = `new_${Date.now()}`;
        let newRow = { id: newId, label: "" };

        if (type === 0) newRow = { ...newRow, label: "YENİ ANA BAŞLIK", isHeader: true };
        else if (type === 1) newRow = { ...newRow, label: "Yeni Alt Başlık", isSubHeader: true };
        else newRow = { ...newRow, label: "Yeni Mekanik Ekipman", qty: 1, power: 0, consumed: 90, hours: 24 };

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
                .param-input-top { background-color: #0f172a; border: 1px solid #475569; color: white; border-radius: 6px; padding: 5px 10px; font-size: 13px; width: 120px; text-align: right; font-weight: bold; }
                .opacity-hover:hover { opacity: 1 !important; }
                .dropdown-menu-custom { position: absolute; right: 4%; top: 80%; background-color: #0f172a; border: 1px solid #475569; border-radius: 6px; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.5); padding: 4px 0; min-width: 130px; }
                .dropdown-item-custom { color: #cbd5e1; padding: 6px 12px; font-size: 11.5px; cursor: pointer; text-align: left; font-weight: 500; }
                .dropdown-item-custom:hover { background-color: #1e293b; color: white; }
            `}</style>

            <div className="d-flex flex-column rounded-3 overflow-x-auto" style={{ border: "1px solid #334155", width: "100%" }}>
                <div style={{ minWidth: "900px" }}>

                    {/* ÜST PANEL */}
                    <div className="p-3" style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
                        <div className="row align-items-center g-3">

                            <div className="col-md-3">
                                <div className="fw-bold text-white" style={{ fontSize: "15px", letterSpacing: "0.5px" }}>
                                    {isForeign ? "Energy Operation Cost Table" : "Enerji İşletme Maliyeti Tablosu"}
                                </div>
                            </div>

                            <div className="col-md-5 border-start border-end" style={{ borderColor: "#475569" }}>
                                <div className="row g-2 px-3">
                                    {/* Hidrolik Yük Girişi */}
                                    <div className="col-6 d-flex flex-column gap-1">
                                        <label className="text-white-50" style={{ fontSize: "11px", fontWeight: "600" }}>
                                            {isForeign ? "TOTAL HYDRAULIC LOAD" : "TOPLAM HİDROLİK YÜK"}
                                        </label>
                                        <div className="d-flex align-items-center gap-2">
                                            <input
                                                type="text"
                                                className="param-input-top"
                                                value={inputHydraulic}
                                                onChange={(e) => setInputHydraulic(e.target.value)}
                                                onBlur={(e) => {
                                                    const parsed = parseInputValue(e.target.value);
                                                    setParams({ ...params, hydraulicLoad: parsed });
                                                    setInputHydraulic(formatInputValue(parsed));
                                                }}
                                            />
                                            <span className="text-white fw-semibold" style={{ fontSize: "12px" }}>{getFlowUnitLabel()}</span>
                                        </div>
                                    </div>

                                    {/* Enerji Fiyat Girişi */}
                                    <div className="col-6 d-flex flex-column gap-1">
                                        <label className="text-white-50" style={{ fontSize: "11px", fontWeight: "600" }}>
                                            {isForeign ? "ENERGY PRICE FOR 1 kWh" : "1 kWh ENERJİ FİYATI"}
                                        </label>
                                        <div className="d-flex align-items-center gap-2">
                                            <input
                                                type="text"
                                                className="param-input-top text-warning"
                                                value={inputEnergyPrice}
                                                onChange={(e) => setInputEnergyPrice(e.target.value)}
                                                onBlur={(e) => {
                                                    const displayVal = parseInputValue(e.target.value);
                                                    const targetBasePrice = displayVal / exchangeRate;
                                                    setParams({ ...params, energyPrice: targetBasePrice });
                                                    setInputEnergyPrice(formatInputValue((targetBasePrice * exchangeRate).toFixed(2)));
                                                }}
                                            />
                                            <span className="text-warning fw-semibold" style={{ fontSize: "12px" }}>{getCentSymbol()}/kWh</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4 d-flex align-items-center justify-content-end gap-3">
                                <div className="d-flex flex-column gap-1 text-end">
                                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                        {isForeign ? "Currency:" : "Para Birimi:"}{" "}
                                        <span className="fw-bold text-warning">{currency}</span>
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                        {isForeign ? "Unit System:" : "Birim Sistemi:"}{" "}
                                        <span className="fw-bold text-info">{unitSystem}</span>
                                    </div>
                                </div>

                                <div style={{ width: "1px", height: "30px", backgroundColor: "#475569" }}></div>

                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        onClick={handleRefresh}
                                        className="btn btn-sm px-3 py-2 fw-semibold text-white d-flex align-items-center gap-1 border-0"
                                        style={{ backgroundColor: "#d97706", fontSize: "12px", borderRadius: "6px" }}
                                        title={isForeign ? "Reset Table to Initial Settings" : "Tabloyu İlk Ayarlarına Döndür"}
                                    >
                                        🔄 {isForeign ? "Refresh" : "Yenile"}
                                    </button>
                                    <button
                                        onClick={handleUndo}
                                        disabled={history.length === 0}
                                        className="btn btn-sm px-3 py-2 fw-semibold text-white d-flex align-items-center justify-content-center border-0"
                                        style={{
                                            backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a",
                                            fontSize: "12px",
                                            borderRadius: "6px",
                                            opacity: history.length === 0 ? 0.4 : 1,
                                            cursor: history.length === 0 ? "not-allowed" : "pointer"
                                        }}
                                    >
                                        ↶
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* TABLO BAŞLIKLARI */}
                    <div className="d-flex align-items-stretch border-bottom" style={{ borderColor: "#334155" }}>
                        <div className="p-2 px-3 header-cell text-start justify-content-start" style={{ width: "32%" }}>
                            {isForeign ? "Mechanical Equipments / Units" : "Mekanik Ekipmanlar / Üniteler"}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-cell" style={{ width: "6%" }}>
                            {isForeign ? "Unit" : "Adet"}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-cell" style={{ width: "10%" }}>
                            {isForeign ? <>Unit Installed<br />Power (kW)</> : <>Birim Güç<br />(kW)</>}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-cell" style={{ width: "10%" }}>
                            {isForeign ? <>Total Installed<br />Power (kW)</> : <>Toplam Güç<br />(kW)</>}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-cell" style={{ width: "9%" }}>
                            {isForeign ? <>Power<br />Consumed (%)</> : <>Tüketim<br />(%)</>}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-cell" style={{ width: "10%" }}>
                            {isForeign ? <>Daily Working<br />(hour)</> : <>Çalışma<br />(saat/gün)</>}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-cell text-end justify-content-end px-3" style={{ width: "18%" }}>
                            {isForeign ? <>Electricity Consumption<br />(kW.hour/day)</> : <>Elektrik Tüketimi<br />(kWh/gün)</>}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                        <div className="p-2 header-cell" style={{ width: "5%" }}>
                            {isForeign ? "Action" : "Aksiyon"}
                        </div>
                    </div>

                    {/* TABLO GÖVDESİ */}
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
                                                type="text"
                                                className="form-control form-control-sm text-center bg-transparent border-0 energy-input fw-bold text-white"
                                                style={{ fontSize: "12px", boxShadow: "none" }}
                                                value={formatInputValue(row.qty)}
                                                onChange={(e) => handleCellChange(row.id, "qty", e.target.value)}
                                            />
                                        )}
                                    </div>
                                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                    <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "10%" }}>
                                        {!isHeading && (
                                            <input
                                                type="text"
                                                className="form-control form-control-sm text-center text-white bg-transparent border-0 energy-input"
                                                style={{ fontSize: "12px", boxShadow: "none" }}
                                                value={formatInputValue(row.power)}
                                                onChange={(e) => handleCellChange(row.id, "power", e.target.value)}
                                            />
                                        )}
                                    </div>
                                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                    <div className="p-1 d-flex align-items-center justify-content-center fw-bold text-white" style={{ width: "10%", fontSize: "12px" }}>
                                        {!isHeading && formatNumber(totalPower, 0, 2)}
                                    </div>
                                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                    <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "9%" }}>
                                        {!isHeading && (
                                            <div className="d-flex align-items-center justify-content-center w-100">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm text-center text-white bg-transparent border-0 energy-input"
                                                    style={{ fontSize: "12px", boxShadow: "none", width: "65%" }}
                                                    value={formatInputValue(row.consumed)}
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
                                                type="text"
                                                className="form-control form-control-sm text-center text-white bg-transparent border-0 energy-input"
                                                style={{ fontSize: "12px", boxShadow: "none" }}
                                                value={formatInputValue(row.hours)}
                                                onChange={(e) => handleCellChange(row.id, "hours", e.target.value)}
                                            />
                                        )}
                                    </div>
                                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                    <div className="p-1 px-3 d-flex align-items-center justify-content-end fw-bold" style={{ width: "18%", fontSize: "12px", color: "#4ade80" }}>
                                        {!isHeading && formatNumber(consumption, 0, 3)}
                                    </div>
                                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                                    <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "5%" }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === row.id ? null : row.id); }}
                                            className="btn btn-sm p-0 border-0 text-success opacity-50 opacity-hover fw-bold"
                                            style={{ fontSize: "16px", lineHeight: "1" }}
                                            title={isForeign ? "Add Row" : "Satır Ekle"}
                                            type="button"
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => deleteRow(row.id)}
                                            className="btn btn-sm p-0 border-0 text-danger opacity-50 opacity-hover"
                                            style={{ fontSize: "16px", lineHeight: "1" }}
                                            title={isForeign ? "Delete Row" : "Satırı Sil"}
                                            type="button"
                                        >
                                            &times;
                                        </button>

                                        {activeMenuId === row.id && (
                                            <div className="dropdown-menu-custom" onClick={(e) => e.stopPropagation()}>
                                                <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 0); setActiveMenuId(null); }}>
                                                    {isForeign ? "+ Main Header" : "+ Ana Başlık"}
                                                </div>
                                                <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 1); setActiveMenuId(null); }}>
                                                    {isForeign ? "+ Sub Header" : "+ Alt Başlık"}
                                                </div>
                                                <div className="dropdown-item-custom" onClick={() => { insertAfterRow(index, 3); setActiveMenuId(null); }}>
                                                    {isForeign ? "+ Normal Row" : "+ Normal Satır"}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ÖZET PANELİ */}
                    <div className="d-flex flex-column overflow-hidden border-top" style={{ borderColor: "#475569", backgroundColor: "#0f172a" }}>
                        <div className="d-flex align-items-center p-2 px-3 border-bottom" style={{ borderColor: "#334155" }}>
                            <div className="fw-bold text-end text-white-50" style={{ width: "75%", fontSize: "12px" }}>
                                {isForeign ? "TOTAL ELECTRICITY CONSUMPTION" : "TOPLAM ELEKTRİK TÜKETİMİ"}
                            </div>
                            <div className="fw-bold text-end text-white" style={{ width: "15%", fontSize: "13px" }}>
                                {summaryData.totalElectricityConsumption.formatted}
                            </div>
                            <div className="text-white-50 ms-2" style={{ fontSize: "11px" }}>
                                {summaryData.totalElectricityConsumption.unit}
                            </div>
                        </div>

                        <div className="d-flex align-items-center p-2 px-3 border-bottom" style={{ borderColor: "#334155" }}>
                            <div className="fw-bold text-end text-white-50" style={{ width: "75%", fontSize: "12px" }}>
                                {unitSystem === "US"
                                    ? (isForeign ? "ELECTRICITY CONSUMPTION PER 1 GALLON WASTEWATER" : "1 GALLON ATIKSU BAŞINA ELEKTRİK TÜKETİMİ")
                                    : (isForeign ? "ELECTRICITY CONSUMPTION PER 1 m³ WASTEWATER" : "1 m³ ATIKSU BAŞINA ELEKTRİK TÜKETİMİ")
                                }
                            </div>
                            <div className="fw-bold text-end text-white" style={{ width: "15%", fontSize: "13px" }}>
                                {summaryData.consumptionPerUnitWastewater.formatted}
                            </div>
                            <div className="text-white-50 ms-2" style={{ fontSize: "11px" }}>
                                {summaryData.consumptionPerUnitWastewater.unit}
                            </div>
                        </div>

                        <div className="d-flex align-items-center p-2 px-3 border-bottom" style={{ borderColor: "#334155" }}>
                            <div className="fw-bold text-end text-white-50" style={{ width: "75%", fontSize: "12px" }}>
                                {unitSystem === "US"
                                    ? (isForeign ? "ELECTRICITY COST PER 1 GALLON WASTEWATER" : "1 GALLON ATIKSU BAŞINA ELEKTRİK MALİYETİ")
                                    : (isForeign ? "ELECTRICITY COST PER 1 m³ WASTEWATER" : "1 m³ ATIKSU BAŞINA ELEKTRİK MALİYETİ")
                                }
                            </div>
                            <div className="fw-bold text-end text-white" style={{ width: "15%", fontSize: "13px" }}>
                                {summaryData.costPerUnitWastewater.formatted}
                            </div>
                            <div className="text-white-50 ms-2" style={{ fontSize: "11px" }}>
                                {summaryData.costPerUnitWastewater.unit}
                            </div>
                        </div>

                        <div className="d-flex align-items-center p-2 px-3 border-bottom" style={{ borderColor: "#334155" }}>
                            <div className="fw-bold text-end text-white-50" style={{ width: "75%", fontSize: "12px" }}>
                                {isForeign ? "ELECTRICITY CONSUMPTION COST" : "ELEKTRİK TÜKETİM MALİYETİ (GÜNLÜK)"}
                            </div>
                            <div className="fw-bold text-end text-warning" style={{ width: "15%", fontSize: "14px" }}>
                                {summaryData.dailyElectricityCost.formatted}
                            </div>
                            <div className="text-warning ms-2" style={{ fontSize: "11px" }}>
                                {summaryData.dailyElectricityCost.unit}
                            </div>
                        </div>

                        <div className="d-flex align-items-center p-2 px-3" style={{ backgroundColor: "#1e293b" }}>
                            <div className="fw-bold text-end text-white" style={{ width: "75%", fontSize: "12px" }}>
                                {isForeign ? "ELECTRICITY CONSUMPTION COST" : "ELEKTRİK TÜKETİM MALİYETİ (YILLIK)"}
                            </div>
                            <div className="fw-bold text-end text-success" style={{ width: "15%", fontSize: "15px" }}>
                                {summaryData.yearlyElectricityCost.formatted}
                            </div>
                            <div className="text-success ms-2" style={{ fontSize: "11px" }}>
                                {summaryData.yearlyElectricityCost.unit}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default EnerjiIsletmeTablosu;