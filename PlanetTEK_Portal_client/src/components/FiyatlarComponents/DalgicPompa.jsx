import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";

function DalgicPompa() {
    const [pumpsData, setPumpsData] = useState([]);
    const [sabitOranlar, setSabitOranlar] = useState([]);

    const [originalData, setOriginalData] = useState([]);
    const [originalOranData, setOriginalOranData] = useState([]);

    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [pendingChanges, setPendingChanges] = useState([]);

    const headers = ["Pompa Modeli", "Alış Fiyatı (€)", "Yurt İçi Satış Yİ (€)", "Yurt Dışı Satış YD (€)"];
    const fields = ["alis_fiyati", "yi_satis", "yd_satis"];
    const duzenlenebilirFields = ["alis_fiyati"];

    // 📊 Sütun sıralamasına kusursuz hiza: Yİ başta, YD sonda!
    const oranHeaders = ["Ayar Tipi", "Yurt İçi Satış Oranı (Yİ)", "Yurt Dışı Satış Oranı (YD)"];
    const oranFields = ["yi_katsayi", "yd_katsayi"];

    const fetchPumpsData = async () => {
        try {
            setLoading(true);
            const response = await API.getSubmersibleCosts();

            const formatted = response.data.map(item => ({
                ...item,
                name: item.pompa_adi
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
            console.error("Dalgıç pompa verileri yüklenirken hata oluştu:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPumpsData();
    }, []);

    // 🛠️ Alış fiyatı elle değiştiğinde anlık satış simülasyonu
    // 🛠️ Alış fiyatı elle değiştiğinde anlık satış simülasyonu (DÜZELTİLDİ)
    const handleGridDataChange = (newData) => {
        // ExcelGrid bir functional update callback'i gönderebileceği için güvenle çözüyoruz
        const resolvedData = typeof newData === "function" ? newData(pumpsData) : newData;
        if (!resolvedData || !Array.isArray(resolvedData)) return;

        const currentOran = sabitOranlar[0] || { yi_katsayi: 1.30, yd_katsayi: 1.45 };

        const recalculated = resolvedData.map(item => {
            const alis = Number(item.alis_fiyati) || 0;
            return {
                ...item,
                alis_fiyati: alis, // Sayı formatında kalmasını garanti et
                yi_satis: (alis * Number(currentOran.yi_katsayi)).toFixed(2),
                yd_satis: (alis * Number(currentOran.yd_katsayi)).toFixed(2)
            };
        });

        setPumpsData([...recalculated]);
    };

    // 🛠️ handleSaveClick İçindeki Karşılaştırma Mantığı (ZIRHLANDI)
    const handleSaveClick = () => {
        const changes = [];
        const guncelOranRow = sabitOranlar[0] || {};
        const eskiOranRow = originalOranData[0] || {};

        // --- 1. Ana Tablo Kontrolü ---
        pumpsData.forEach((item) => {
            // İki tarafta da ID'leri string'e zorlayarak gevşek referans uyuşmazlığını kökten çözüyoruz
            const originalItem = originalData.find((o) => String(o.id) === String(item.id));

            if (originalItem) {
                duzenlenebilirFields.forEach((field) => {
                    const eskiDeger = parseFloat(originalItem[field] || 0).toFixed(2);
                    const yeniDeger = parseFloat(item[field] || 0).toFixed(2);

                    if (eskiDeger !== yeniDeger) {
                        changes.push({
                            tableName: "submersible_pumps",
                            id: originalItem.id, // Güvenli orijinal ID
                            columnName: field,
                            newValue: Number(yeniDeger),
                            rowName: originalItem.name || item.name,
                            oldValue: Number(eskiDeger)
                        });
                    }
                });
            }
        });

        // --- 2. Katsayı Tablosu Kontrolü ---
        oranFields.forEach((oranField) => {
            const eskiOran = parseFloat(eskiOranRow[oranField] || 0).toFixed(2);
            const guncelOran = parseFloat(guncelOranRow[oranField] || 0).toFixed(2);

            if (eskiOran !== guncelOran) {
                const friendlyName = oranField === "yi_katsayi" ? "Yurt İçi Oranı" : "Yurt Dışı Oranı";
                const firstPumpId = originalData[0]?.id || 1;

                changes.push({
                    tableName: "submersible_pumps",
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

    // 🛠️ Katsayı kutucuğu değiştiğinde hem ExcelGrid'den gelen callback yapısını çözer hem alt tabloyu tetikler
    const handleOranDataChange = (newOranData) => {
        // 🚀 ExcelGrid'den bir functional update tetikleyicisi (prev => ...) gelebileceği için güvenle resolve ediyoruz
        const resolvedArray = typeof newOranData === "function"
            ? newOranData(sabitOranlar)
            : newOranData;

        if (!resolvedArray || !Array.isArray(resolvedArray)) return;

        // Üst katsayıyı yeni array referansıyla setle
        setSabitOranlar([...resolvedArray]);

        const currentOran = resolvedArray[0] || {};
        const eskiOranlar = originalOranData[0] || { yi_katsayi: 1.30, yd_katsayi: 1.45 };

        const yiKatsayi = currentOran.yi_katsayi !== undefined && currentOran.yi_katsayi !== ""
            ? Number(currentOran.yi_katsayi)
            : Number(eskiOranlar.yi_katsayi);

        const ydKatsayi = currentOran.yd_katsayi !== undefined && currentOran.yd_katsayi !== ""
            ? Number(currentOran.yd_katsayi)
            : Number(eskiOranlar.yd_katsayi);

        // 🚀 `pumpsData` asenkron kilidini kırmak için functional state (`prevPumps`) kullanıyoruz!
        setPumpsData((prevPumps) => {
            const recalculated = originalData.map(item => {
                const anlikItem = prevPumps.find(p => p.id === item.id) || item;
                const alis = Number(anlikItem.alis_fiyati) || 0;

                return {
                    ...anlikItem,
                    yi_satis: (alis * yiKatsayi).toFixed(2),
                    yd_satis: (alis * ydKatsayi).toFixed(2)
                };
            });
            return [...recalculated];
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
                newValue: change.newValue
            }));

            await API.updatePriceData({
                tableName: targetTableName,
                updates: updatesPayload
            });

            const response = await API.getSubmersibleCosts();
            const freshData = response.data.map(item => ({
                ...item,
                name: item.pompa_adi
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
            console.error("Dalgıç pompa fiyatları güncellenirken teknik hata:", error);
            alert("Veriler kaydedilirken bir hata meydana geldi.");
        } finally {
            setLoading(false);
        }
    };

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
                    <span className="fw-semibold small">Dalgıç Pompa Yönetimi</span>
                </div>
                <button className="btn btn-success btn-sm px-4" onClick={handleSaveClick}>
                    <i className="bi bi-file-earmark-excel me-2"></i>Kaydet
                </button>
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
                    <span className="fw-semibold small">Pompa Fiyat Listesi</span>
                </div>
                <ExcelGrid
                    headers={headers}
                    data={pumpsData}
                    fields={fields}
                    onDataChange={handleGridDataChange}
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

export default DalgicPompa;