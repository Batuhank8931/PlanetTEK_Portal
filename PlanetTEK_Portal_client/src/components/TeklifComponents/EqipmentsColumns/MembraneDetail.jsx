import React, { useEffect, useMemo, useState } from "react";
import { useTeklifStore } from "../../../utils/teklifStore";
import API from "../../../utils/utilRequest";

function MembranDetail() {
    // 🚀 API'den tek seferde gelecek Membran veri setleri için state
    const [membraneData, setMembraneData] = useState({
        membraneCassettes: [],
        feedPumps: [],
        recirculationPumps: [],
        naoclDosingPumps: [],
        naoclDosingTanks: [],
        citricDosingPumps: [],
        citricDosingTanks: [],
        blowers: []
    });
    const [isLoading, setIsLoading] = useState(true);

    const formData = useTeklifStore((state) => state.formData);
    const updateSection = useTeklifStore((state) => state.updateSection);

    // Global store'daki ana günlük debi ve membran bölümü önbelleği
    const globalAnaGunlukDebi = parseFloat(formData.planetDiskDetails?.debi) || 0;
    const equipmentsCache = formData.equipments || {};
    const storeMembrane = equipmentsCache.membraneSystem || {};

    // Kullanıcının arayüzden yapacağı anlık manuel debi değişikliklerini izlemek için yerel durum
    const [yerelDebi, setYerelDebi] = useState(() => {
        return storeMembrane.calculatedMainDebi !== undefined
            ? parseFloat(storeMembrane.calculatedMainDebi)
            : globalAnaGunlukDebi;
    });

    // Dışarıdaki global debi değişirse yerel debiyi de eşitle
    useEffect(() => {
        if (globalAnaGunlukDebi !== yerelDebi && storeMembrane.calculatedMainDebi === undefined) {
            setYerelDebi(globalAnaGunlukDebi);
        }
    }, [globalAnaGunlukDebi]);

    // Debi değişim kontrolü: Farklı bir debi girilirse eski manuel dropdown seçimleri temizlenir
    const lastCalculatedMainDebi = storeMembrane.calculatedMainDebi !== undefined ? storeMembrane.calculatedMainDebi : null;
    const isMainDebiChanged = lastCalculatedMainDebi !== null && lastCalculatedMainDebi !== yerelDebi;

    // Hafızadaki (Store) seçili ID'leri takip ediyoruz
    const selectedCassetteId = !isMainDebiChanged ? storeMembrane.membraneCassettes?.id : null;
    const selectedFeedPumpId = !isMainDebiChanged ? storeMembrane.feedPumps?.id : null;
    const selectedRecircPumpId = !isMainDebiChanged ? storeMembrane.recirculationPumps?.id : null;
    const selectedNaoclPumpId = !isMainDebiChanged ? storeMembrane.naoclDosingPumps?.id : null;
    const selectedNaoclTankId = !isMainDebiChanged ? storeMembrane.naoclDosingTanks?.id : null;
    const selectedCitricPumpId = !isMainDebiChanged ? storeMembrane.citricDosingPumps?.id : null;
    const selectedCitricTankId = !isMainDebiChanged ? storeMembrane.citricDosingTanks?.id : null;
    const selectedBlowerId = !isMainDebiChanged ? storeMembrane.blowers?.id : null;

    // 🚀 Bileşen yüklendiğinde membran maliyet matrisini çek
    useEffect(() => {
        const fetchMembraneData = async () => {
            try {
                setIsLoading(true);
                const response = await API.getMembraneCosts();
                if (response?.data) {
                    setMembraneData({
                        membraneCassettes: response.data.membraneCassettes || [],
                        feedPumps: response.data.feedPumps || [],
                        recirculationPumps: response.data.recirculationPumps || [],
                        naoclDosingPumps: response.data.naoclDosingPumps || [],
                        naoclDosingTanks: response.data.naoclDosingTanks || [],
                        citricDosingPumps: response.data.citricDosingPumps || [],
                        citricDosingTanks: response.data.citricDosingTanks || [],
                        blowers: response.data.blowers || []
                    });
                }
            } catch (error) {
                console.error("Membran teknik matrisi yüklenirken hata:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMembraneData();
    }, []);

    // --- 1. OTOMATİK İDEAL KAPASİTE BULUCU ---
    const idealSecimler = useMemo(() => {
        const findIdeal = (arr) => {
            if (!arr || arr.length === 0) return null;
            const sorted = [...arr].sort((a, b) => a.general_capacity - b.general_capacity);
            return sorted.find(item => item.general_capacity >= yerelDebi) || sorted[sorted.length - 1];
        };

        return {
            cassette: findIdeal(membraneData.membraneCassettes),
            feedPump: findIdeal(membraneData.feedPumps),
            recirculationPump: findIdeal(membraneData.recirculationPumps),
            naoclPump: findIdeal(membraneData.naoclDosingPumps),
            naoclTank: findIdeal(membraneData.naoclDosingTanks),
            citricPump: findIdeal(membraneData.citricDosingPumps),
            citricTank: findIdeal(membraneData.citricDosingTanks),
            blower: findIdeal(membraneData.blowers)
        };
    }, [yerelDebi, membraneData]);

    // --- 2. AKTİF SEÇİLEN KOMBİNASYONLAR (MANUEL DEĞİŞİKLİK DESTEKLİ) ---
    const aktifSecimler = useMemo(() => {
        const getActiveItem = (arr, selectedId, idealItem) => {
            if (!arr || arr.length === 0) return null;
            if (selectedId) {
                const found = arr.find(item => item.id === parseInt(selectedId));
                if (found) return found;
            }
            return idealItem;
        };

        return {
            cassette: getActiveItem(membraneData.membraneCassettes, selectedCassetteId, idealSecimler.cassette),
            feedPump: getActiveItem(membraneData.feedPumps, selectedFeedPumpId, idealSecimler.feedPump),
            recirculationPump: getActiveItem(membraneData.recirculationPumps, selectedRecircPumpId, idealSecimler.recirculationPump),
            naoclPump: getActiveItem(membraneData.naoclDosingPumps, selectedNaoclPumpId, idealSecimler.naoclPump),
            naoclTank: getActiveItem(membraneData.naoclDosingTanks, selectedNaoclTankId, idealSecimler.naoclTank),
            citricPump: getActiveItem(membraneData.citricDosingPumps, selectedCitricPumpId, idealSecimler.citricPump),
            citricTank: getActiveItem(membraneData.citricDosingTanks, selectedCitricTankId, idealSecimler.citricTank),
            blower: getActiveItem(membraneData.blowers, selectedBlowerId, idealSecimler.blower)
        };
    }, [idealSecimler, selectedCassetteId, selectedFeedPumpId, selectedRecircPumpId, selectedNaoclPumpId, selectedNaoclTankId, selectedCitricPumpId, selectedCitricTankId, selectedBlowerId, membraneData]);

    // --- 3. STORE EŞZAMANLAMA (GLOBAL STATE UPDATE) ---
    useEffect(() => {
        if (yerelDebi === 0 || !aktifSecimler.cassette) return;

        const membranOzeti = {
            calculatedMainDebi: yerelDebi,
            membraneCassettes: aktifSecimler.cassette,
            feedPumps: aktifSecimler.feedPump,
            recirculationPumps: aktifSecimler.recirculationPump,
            naoclDosingPumps: aktifSecimler.naoclPump,
            naoclDosingTanks: aktifSecimler.naoclTank,
            citricDosingPumps: aktifSecimler.citricPump,
            citricDosingTanks: aktifSecimler.citricTank,
            blowers: aktifSecimler.blower
        };

        updateSection("equipments", {
            ...equipmentsCache,
            membraneSystem: membranOzeti
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [yerelDebi, aktifSecimler]);

    // Manuel debi input değişim tetikleyicisi
    const handleDebiInputChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        setYerelDebi(value);
        updateSection("equipments", {
            ...equipmentsCache,
            membraneSystem: {
                calculatedMainDebi: value
            }
        });
    };

    // Dropdown manuel seçim tetikleyicisi
    const handleDropdownUpdate = (key, idValue) => {
        const itemArray = membraneData[key];
        const selectedObj = itemArray.find(i => i.id === parseInt(idValue));

        updateSection("equipments", {
            ...equipmentsCache,
            membraneSystem: {
                ...storeMembrane,
                calculatedMainDebi: yerelDebi,
                [key]: selectedObj
            }
        });
    };

    // Yenile / İdeal Duruma Döndür Butonu
    const handleResetClick = () => {
        setYerelDebi(globalAnaGunlukDebi);
        updateSection("equipments", {
            ...equipmentsCache,
            membraneSystem: {
                calculatedMainDebi: globalAnaGunlukDebi
            }
        });
    };

    if (isLoading || membraneData.membraneCassettes.length === 0) {
        return (
            <div className="d-flex flex-column gap-2 p-3 justify-content-center align-items-center" style={{ minHeight: "150px" }}>
                <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                <span className="text-white-50" style={{ fontSize: "11px" }}>Membran Teknik Matrisi Senkronize Ediliyor...</span>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column gap-3 text-white">

            {/* BAŞLIK VE RESET PANELİ */}
            <div className="d-flex align-items-center justify-content-between">
                <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
                    Membran Sistemi Ekipman Tasarımı
                </span>
                <div className="d-flex align-items-center flex-grow-1 gap-2">
                    <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
                    <button
                        onClick={handleResetClick}
                        className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
                        style={{ backgroundColor: "#d97706", fontSize: "11px", borderRadius: "6px" }}
                        title="İdeal Hesaplanan Kapasitelere Sıfırla"
                    >
                        🔄 Yenile
                    </button>
                </div>
            </div>

            {/* SADELEŞTİRİLMİŞ MANUEL DEBİ PANELİ */}
            <div className="p-3 rounded" style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
                <div className="row align-items-center">
                    <div className="col-6">
                        <span className="text-warning fw-semibold d-block" style={{ fontSize: "11px" }}>
                            Günlük Tasarım Debisi (m³/gün)
                        </span>
                    </div>
                    <div className="col-6">
                        <input
                            type="number"
                            min="0"
                            step="any"
                            className="form-control form-control-sm text-white fw-bold border-0 text-center"
                            style={{
                                backgroundColor: "rgba(245, 158, 11, 0.15)",
                                border: "1px solid #f59e0b !important",
                                borderRadius: "6px",
                                fontSize: "12px",
                                height: "32px"
                            }}
                            value={yerelDebi === 0 ? "" : yerelDebi}
                            onChange={handleDebiInputChange}
                        />
                    </div>
                </div>
            </div>

            {/* --- 8 ADET EŞLEŞEN VE SEÇİLEBİLİR DROPDOWN ELEMANI --- */}
            <div className="d-flex flex-column gap-2">

                {/* 1. Membran Kasetleri */}
                <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}>
                    <span className="text-white-50" style={{ fontSize: "11px" }}>Membran Kasetleri (Alan / Adet / Boyut):</span>
                    <select
                        className="bg-transparent border-0 fw-bold text-white text-end cursor-pointer p-0 focus-none"
                        style={{ fontSize: "11px", outline: "none", width: "60%" }}
                        value={aktifSecimler.cassette?.id || ""}
                        onChange={(e) => handleDropdownUpdate("membraneCassettes", e.target.value)}
                    >
                        {membraneData.membraneCassettes.map(item => (
                            <option key={item.id} value={item.id} className="bg-slate">
                                Kapasite: {item.general_capacity} m³ ({item.alan} m² - {item.adet} Adet - {item.boyutlar})
                            </option>
                        ))}
                    </select>
                </div>

                {/* 2. MBR Emiş / Besleme Pompaları */}
                <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #ef4444" }}>
                    <span className="text-white-50" style={{ fontSize: "11px" }}>MBR Emiş / Besleme Pompaları:</span>
                    <select
                        className="bg-transparent border-0 fw-bold text-danger text-end cursor-pointer p-0 focus-none"
                        style={{ fontSize: "11px", outline: "none", width: "60%" }}
                        value={aktifSecimler.feedPump?.id || ""}
                        onChange={(e) => handleDropdownUpdate("feedPumps", e.target.value)}
                    >
                        {membraneData.feedPumps.map(item => (
                            <option key={item.id} value={item.id} className="bg-slate">
                                Kapasite: {item.general_capacity} m³ (Debi: {item.debi} m³/h - {item.kw} kW)
                            </option>
                        ))}
                    </select>
                </div>

                {/* 3. Geri Devir Pompaları */}
                <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #a855f7" }}>
                    <span className="text-white-50" style={{ fontSize: "11px" }}>Geri Devir Pompaları (Membran - Hav.):</span>
                    <select
                        className="bg-transparent border-0 fw-bold text-end cursor-pointer p-0 focus-none"
                        style={{ fontSize: "11px", color: "#c084fc", outline: "none", width: "60%" }}
                        value={aktifSecimler.recirculationPump?.id || ""}
                        onChange={(e) => handleDropdownUpdate("recirculationPumps", e.target.value)}
                    >
                        {membraneData.recirculationPumps.map(item => (
                            <option key={item.id} value={item.id} className="bg-slate">
                                Kapasite: {item.general_capacity} m³ (Debi: {item.debi} m³/h - {item.kw} kW)
                            </option>
                        ))}
                    </select>
                </div>

                {/* 4. NaOCl Dozaj Pompaları */}
                <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #38bdf8" }}>
                    <span className="text-white-50" style={{ fontSize: "11px" }}>NaOCl Dozaj Pompaları:</span>
                    <select
                        className="bg-transparent border-0 fw-bold text-info text-end cursor-pointer p-0 focus-none"
                        style={{ fontSize: "11px", outline: "none", width: "60%" }}
                        value={aktifSecimler.naoclPump?.id || ""}
                        onChange={(e) => handleDropdownUpdate("naoclDosingPumps", e.target.value)}
                    >
                        {membraneData.naoclDosingPumps.map(item => (
                            <option key={item.id} value={item.id} className="bg-slate">
                                Kapasite: {item.general_capacity} m³ (Debi: {item.debi} L/h - {item.kw} kW)
                            </option>
                        ))}
                    </select>
                </div>

                {/* 5. NaOCl Kimyasal Dozaj Tankları */}
                <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #0ea5e9" }}>
                    <span className="text-white-50" style={{ fontSize: "11px" }}>NaOCl Kimyasal Dozaj Tankları:</span>
                    <select
                        className="bg-transparent border-0 fw-bold text-info text-end cursor-pointer p-0 focus-none"
                        style={{ fontSize: "11px", outline: "none", width: "60%" }}
                        value={aktifSecimler.naoclTank?.id || ""}
                        onChange={(e) => handleDropdownUpdate("naoclDosingTanks", e.target.value)}
                    >
                        {membraneData.naoclDosingTanks.map(item => (
                            <option key={item.id} value={item.id} className="bg-slate">
                                Kapasite: {item.general_capacity} m³ (Hacim: {item.kapasite} lt - Malzeme: {item.malzeme})
                            </option>
                        ))}
                    </select>
                </div>

                {/* 6. Sitrik Asit Dozaj Pompaları */}
                <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #f59e0b" }}>
                    <span className="text-white-50" style={{ fontSize: "11px" }}>Sitrik Asit Dozaj Pompaları:</span>
                    <select
                        className="bg-transparent border-0 fw-bold text-warning text-end cursor-pointer p-0 focus-none"
                        style={{ fontSize: "11px", outline: "none", width: "60%" }}
                        value={aktifSecimler.citricPump?.id || ""}
                        onChange={(e) => handleDropdownUpdate("citricDosingPumps", e.target.value)}
                    >
                        {membraneData.citricDosingPumps.map(item => (
                            <option key={item.id} value={item.id} className="bg-slate">
                                Kapasite: {item.general_capacity} m³ (Debi: {item.debi} L/h - {item.kw} kW)
                            </option>
                        ))}
                    </select>
                </div>

                {/* 7. Sitrik Asit Kimyasal Dozaj Tankları */}
                <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #d97706" }}>
                    <span className="text-white-50" style={{ fontSize: "11px" }}>Sitrik Asit Kimyasal Dozaj Tankları:</span>
                    <select
                        className="bg-transparent border-0 fw-bold text-warning text-end cursor-pointer p-0 focus-none"
                        style={{ fontSize: "11px", outline: "none", width: "60%" }}
                        value={aktifSecimler.citricTank?.id || ""}
                        onChange={(e) => handleDropdownUpdate("citricDosingTanks", e.target.value)}
                    >
                        {membraneData.citricDosingTanks.map(item => (
                            <option key={item.id} value={item.id} className="bg-slate">
                                Kapasite: {item.general_capacity} m³ (Hacim: {item.kapasite} lt - Malzeme: {item.malzeme})
                            </option>
                        ))}
                    </select>
                </div>

                {/* 8. Membran Tarama Blowerları */}
                <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#1e293b", border: "1px solid #10b981" }}>
                    <span className="text-white-50" style={{ fontSize: "11px" }}>Blower:</span>
                    <select
                        className="bg-transparent border-0 fw-bold text-success text-end cursor-pointer p-0 focus-none"
                        style={{ fontSize: "11px", outline: "none", width: "60%" }}
                        value={aktifSecimler.blower?.id || ""}
                        onChange={(e) => handleDropdownUpdate("blowers", e.target.value)}
                    >
                        {membraneData.blowers.map(item => (
                            <option key={item.id} value={item.id} className="bg-slate">
                                Kapasite: {item.general_capacity} m³ ({item.kapasite_nm3h} Nm³/h - {item.kw} kW)
                            </option>
                        ))}
                    </select>
                </div>

            </div>
        </div>
    );
}

export default MembranDetail;