import React, { useState, useEffect, useMemo, useCallback } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";

function IleriAritmaEquipments() {
    const [pumpsData, setPumpsData] = useState([]);
    const [sabitOranlar, setSabitOranlar] = useState([]);

    const [originalData, setOriginalData] = useState([]);
    const [originalOranData, setOriginalOranData] = useState([]);

    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [pendingChanges, setPendingChanges] = useState([]);

    const headers = ["Ekipman Modeli", "Ekipman Tipi", "kW", "Alış Fiyatı (€)", "Yurt İçi Satış Yİ (€)", "Yurt Dışı Satış YD (€)"];
    const fields = ["ekipman_adi", "ekipman_tipi", "kw", "alis_fiyati", "yi_satis", "yd_satis"];

    // 🚀 DÜZELTME 1: Çift tetiklemeyi önlemek için ekipman_adi'ni tek bir döngüde yöneteceğiz
    const duzenlenebilirFields = ["ekipman_adi", "alis_fiyati", "ekipman_tipi", "kw"];

    const oranHeaders = ["Yurt İçi Satış Oranı (Yİ)", "Yurt Dışı Satış Oranı (YD)"];
    const oranFields = ["yi_katsayi", "yd_katsayi"];

    const fetchPumpsData = async () => {
        try {
            setLoading(true);
            const response = await API.getIlerAritmaEquipmentsCosts();

            const formatted = (response.data || []).map(item => ({
                ...item,
                name: item.ekipman_adi
            }));

            setPumpsData(JSON.parse(JSON.stringify(formatted)));
            setOriginalData(JSON.parse(JSON.stringify(formatted)));

            const referans = formatted[0] || {};
            const ilkOranlar = [
                {
                    id: "sabit_katsayi",
                    name: "Global Katsayılar",
                    yi_katsayi: referans.yi_katsayi || 1.30,
                    yd_katsayi: referans.yd_katsayi || 1.45
                }
            ];

            setSabitOranlar(JSON.parse(JSON.stringify(ilkOranlar)));
            setOriginalOranData(JSON.parse(JSON.stringify(ilkOranlar)));

        } catch (error) {
            console.error("Ekipman verileri yüklenirken hata oluştu:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPumpsData();
    }, []);

    const handleAddNewRow = () => {
        const newRow = {
            id: `new_${Date.now()}`,
            ekipman_adi: "Yeni Ekipman Modeli",
            name: "Yeni Ekipman Modeli",
            ekipman_tipi: "-",
            kw: 0,
            alis_fiyati: 0,
            yi_satis: 0,
            yd_satis: 0,
            isNew: true
        };
        setPumpsData(prev => [...prev, newRow]);
    };

    const handleGridDataChange = (newData) => {
        const resolvedData = typeof newData === "function" ? newData(pumpsData) : newData;
        if (!resolvedData || !Array.isArray(resolvedData)) return;

        const currentOran = {
            yi_katsayi: sabitOranlar[0]?.yi_katsayi || 1.30,
            yd_katsayi: sabitOranlar[0]?.yd_katsayi || 1.45
        };

        const recalculated = resolvedData.map(item => {
            if (item.isDeleted) return item;

            const alis = Number(item.alis_fiyati) || 0;
            const guncelAd = item.ekipman_adi !== undefined ? String(item.ekipman_adi).trim() : item.name;

            return {
                ...item,
                ekipman_adi: guncelAd,
                name: guncelAd,
                ekipman_tipi: item.ekipman_tipi || "-",
                kw: item.kw,
                alis_fiyati: alis,
                yi_satis: (alis * Number(currentOran.yi_katsayi)).toFixed(2),
                yd_satis: (alis * Number(currentOran.yd_katsayi)).toFixed(2)
            };
        });

        setPumpsData([...recalculated]);
    };

    const handleSaveClick = () => {
        const changes = [];
        const guncelOranRow = sabitOranlar[0] || {};
        const eskiOranRow = originalOranData[0] || {};
        
        // 🚀 DÜZELTME 2: Hedef tablo ismi doğru set edildi
        const DB_TABLE = "ileri_aritma_ekipmanlari";

        pumpsData.forEach((item) => {
            if (item.isDeleted) {
                if (String(item.id).startsWith("new_")) return;

                changes.push({
                    type: "DELETE",
                    tableName: DB_TABLE,
                    id: item.id,
                    columnName: "Tümü",
                    newValue: null,
                    rowName: item.ekipman_adi,
                    oldValue: item.alis_fiyati
                });
                return;
            }

            // Yeni Kayıt Mantığı
            if (String(item.id).startsWith("new_")) {
                changes.push({
                    type: "INSERT",
                    tableName: DB_TABLE,
                    id: undefined,
                    columnName: "ekipman_adi",
                    newValue: item.ekipman_adi,
                    rowName: item.ekipman_adi,
                    oldValue: "",
                    additionalData: {
                        alis_fiyati: Number(item.alis_fiyati) || 0,
                        ekipman_tipi: item.ekipman_tipi,
                        kw: Number(item.kw) || 0
                    }
                });
                return;
            }

            const originalItem = originalData.find((o) => String(o.id) === String(item.id));

            if (originalItem) {
                // 🚀 DÜZELTME 3: Çift log basmayı engellemek için tüm kontrolleri bu döngü devraldı
                duzenlenebilirFields.forEach((field) => {
                    const eskiDeger = originalItem[field];
                    const yeniDeger = item[field];

                    if (field === "alis_fiyati") {
                        const eskiFloat = parseFloat(eskiDeger || 0).toFixed(2);
                        const yeniFloat = parseFloat(yeniDeger || 0).toFixed(2);
                        if (eskiFloat !== yeniFloat) {
                            changes.push({
                                type: "UPDATE",
                                tableName: DB_TABLE,
                                id: originalItem.id,
                                columnName: field,
                                newValue: Number(yeniFloat),
                                rowName: originalItem.ekipman_adi,
                                oldValue: Number(eskiFloat)
                            });
                        }
                    } else if (field === "kw") {
                        const eskiKw = parseFloat(eskiDeger || 0).toFixed(2);
                        const yeniKw = parseFloat(yeniDeger || 0).toFixed(2);
                        if (eskiKw !== yeniKw) {
                            changes.push({
                                type: "UPDATE",
                                tableName: DB_TABLE,
                                id: originalItem.id,
                                columnName: field,
                                newValue: Number(yeniKw),
                                rowName: originalItem.ekipman_adi,
                                oldValue: Number(eskiKw)
                            });
                        }
                    } else {
                        if (eskiDeger !== yeniDeger) {
                            changes.push({
                                type: "UPDATE",
                                tableName: DB_TABLE,
                                id: originalItem.id,
                                columnName: field,
                                newValue: yeniDeger,
                                rowName: originalItem.ekipman_adi,
                                oldValue: eskiDeger
                            });
                        }
                    }
                });
            }
        });

        oranFields.forEach((oranField) => {
            const eskiOran = parseFloat(eskiOranRow[oranField] || 0).toFixed(2);
            const guncelOran = parseFloat(guncelOranRow[oranField] || 0).toFixed(2);

            if (eskiOran !== guncelOran) {
                const friendlyName = oranField === "yi_katsayi" ? "Yurt İçi Oranı" : "Yurt Dışı Oranı";
                const firstPumpId = originalData[0]?.id || 1;

                changes.push({
                    type: "UPDATE",
                    tableName: DB_TABLE,
                    id: firstPumpId,
                    columnName: oranField,
                    newValue: Number(guncelOran),
                    rowName: `Global Ayar (${friendlyName})`,
                    oldValue: Number(eskiOran)
                });
            }
        });

        if (changes.length === 0) {
            alert("Değişen bir veri bulunamadı.");
            return;
        }

        setPendingChanges(changes);
        setShowModal(true);
    };

    const handleOranDataChange = (newOranData) => {
        const resolvedArray = typeof newOranData === "function" ? newOranData(sabitOranlar) : newOranData;
        if (!resolvedArray || !Array.isArray(resolvedArray)) return;

        setSabitOranlar([...resolvedArray]);

        const currentOran = resolvedArray[0] || { yi_katsayi: 1.30, yd_katsayi: 1.45 };
        const eskiOranlar = originalOranData[0] || { yi_katsayi: 1.30, yd_katsayi: 1.45 };

        const yiKatsayi = currentOran.yi_katsayi !== undefined && currentOran.yi_katsayi !== "" ? Number(currentOran.yi_katsayi) : Number(eskiOranlar.yi_katsayi);
        const ydKatsayi = currentOran.yd_katsayi !== undefined && currentOran.yd_katsayi !== "" ? Number(currentOran.yd_katsayi) : Number(eskiOranlar.yd_katsayi);

        setPumpsData((prevPumps) => {
            return originalData.map(item => {
                const anlikItem = prevPumps.find(p => p.id === item.id) || item;
                if (anlikItem.isDeleted) return anlikItem;

                const alis = Number(anlikItem.alis_fiyati) || 0;
                return {
                    ...anlikItem,
                    yi_satis: (alis * yiKatsayi).toFixed(2),
                    yd_satis: (alis * ydKatsayi).toFixed(2)
                };
            });
        });
    };

    const handleConfirmSave = async () => {
        setShowModal(false);
        setLoading(true);

        try {
            if (pendingChanges.length === 0) {
                setLoading(false);
                return;
            }

            const targetTableName = pendingChanges[0].tableName;

            const updatesPayload = pendingChanges.map((change) => ({
                id: change.id,
                columnName: change.columnName,
                newValue: change.newValue,
                additionalData: change.additionalData || undefined
            }));

            await API.updatePriceData({
                tableName: targetTableName,
                updates: updatesPayload
            });

            // 🚀 DÜZELTME 4: Kayıttan sonra yanlış tablo (Submersible) yerine İleri Arıtma tablosu çekiliyor.
            const response = await API.getIlerAritmaEquipmentsCosts();
            const freshData = (response.data || []).map(item => ({
                ...item,
                name: item.ekipman_adi
            }));

            setPumpsData(JSON.parse(JSON.stringify(freshData)));
            setOriginalData(JSON.parse(JSON.stringify(freshData)));

            const referans = freshData[0] || {};
            const yeniOranlar = [
                {
                    id: "sabit_katsayi",
                    name: "Global Katsayılar",
                    yi_katsayi: referans.yi_katsayi || 1.30,
                    yd_katsayi: referans.yd_katsayi || 1.45
                }
            ];

            setSabitOranlar(JSON.parse(JSON.stringify(yeniOranlar)));
            setOriginalOranData(JSON.parse(JSON.stringify(yeniOranlar)));
            setPendingChanges([]);

        } catch (error) {
            console.error("Ekipman fiyatları güncellenirken teknik hata:", error);
            alert("Veriler kaydedilirken bir hata meydana geldi.");
        } finally {
            setLoading(false);
        }
    };

    const visiblePumpsData = useMemo(() => pumpsData.filter(p => !p.isDeleted), [pumpsData]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center my-5">
                <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">İşlem Yapılıyor...</span>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
                    <i className="bi bi-gear-fill me-2 text-success"></i>
                    <span className="fw-semibold small">İleri Arıtma Ekipman Yönetimi</span>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm px-3" onClick={handleAddNewRow}>
                        <i className="bi bi-plus-circle me-2"></i>Yeni Satır Ekle
                    </button>
                    <button className="btn btn-success btn-sm px-4" onClick={handleSaveClick}>
                        <i className="bi bi-file-earmark-excel me-2"></i>Kaydet
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
                    <i className="bi bi-sliders me-2 text-success"></i>
                    <span className="fw-semibold small">Oran Katsayıları</span>
                </div>
                <div className="row">
                    <div className="col-12 col-md-5">
                        <ExcelGrid
                            headers={oranHeaders}
                            data={sabitOranlar}
                            fields={oranFields}
                            onDataChange={handleOranDataChange}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
                    <i className="bi bi-table me-2 text-secondary"></i>
                    <span className="fw-semibold small">Ekipman Fiyat Listesi</span>
                </div>
                <ExcelGrid
                    headers={headers}
                    data={visiblePumpsData}
                    fields={fields}
                    onDataChange={handleGridDataChange}
                    isMainTable={true}
                />
            </div>

            <PriceChangeUpdateConfirmationModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleConfirmSave}
                changesList={pendingChanges}
            />
        </div>
    );
}

export default IleriAritmaEquipments;