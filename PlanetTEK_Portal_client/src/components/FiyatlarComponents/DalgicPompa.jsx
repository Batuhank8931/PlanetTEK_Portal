import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";
import PumpCurveUpdateModal from "../modals/PumpCurveUpdateModal.jsx";
import AlertModal from "../modals/AlertModal.jsx";

function DalgicPompa() {
    const [pumpsData, setPumpsData] = useState([]);
    const [sabitOranlar, setSabitOranlar] = useState([]);

    const [originalData, setOriginalData] = useState([]);
    const [originalOranData, setOriginalOranData] = useState([]);

    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [pendingChanges, setPendingChanges] = useState([]);

    const [curveModalOpen, setCurveModalOpen] = useState(false);
    const [selectedPumpId, setSelectedPumpId] = useState(null);
    const [selectedPumpName, setSelectedPumpName] = useState("");
    // 🌟 AlertModal kontrolü için state
    const [alertConfig, setAlertConfig] = useState({
        show: false,
        title: "",
        message: "",
        type: "success"
    });

    const headers = ["@", "Pompa Modeli", "Pompa Tipi", "kW", "Alış Fiyatı (€)", "Yurt İçi Satış Yİ (€)", "Yurt Dışı Satış YD (€)"];
    const fields = ["curve_action", "pompa_adi", "pompa_tipi", "kw", "alis_fiyati", "yi_satis", "yd_satis"];

    const duzenlenebilirFields = ["alis_fiyati", "pompa_adi", "pompa_tipi", "kw"];

    const oranHeaders = ["Yurt İçi Satış Oranı (Yİ)", "Yurt Dışı Satış Oranı (YD)"];
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

    const handleOpenCurveModal = (pumpId, pumpName) => {
        const isNewPump = String(pumpId).startsWith("new_");
        if (isNewPump) {
            // Oski alert satırını sil, yerine bunu ekle:
            setAlertConfig({
                show: true,
                title: "İnfo",
                message: "Eğri yüklemek/düzenlemek için önce pompayı kaydetmelisiniz",
                type: "info"
            });
            return;
        }
        setSelectedPumpId(pumpId);
        setSelectedPumpName(pumpName);
        setCurveModalOpen(true);
    };

    const handleAddNewRow = () => {
        const newRow = {
            id: `new_${Date.now()}`,
            pompa_adi: "Yeni Pompa Modeli",
            name: "Yeni Pompa Modeli",
            pompa_tipi: "submersible",
            kw: 0, // 🚀 1. DÜZELTME: kW -> kw yapıldı ve güvenli sayısal başlangıç değeri (0) verildi.
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

        const currentOran = sabitOranlar[0] || { yi_katsayi: 1.30, yd_katsayi: 1.45 };

        const recalculated = resolvedData.map(item => {
            if (item.isDeleted) return item;

            const alis = Number(item.alis_fiyati) || 0;
            const guncelAd = item.pompa_adi !== undefined ? String(item.pompa_adi).trim() : item.name;

            return {
                ...item,
                pompa_adi: guncelAd,
                name: guncelAd,
                pompa_tipi: item.pompa_tipi || "submersible",
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

        pumpsData.forEach((item) => {
            if (item.isDeleted) {
                if (String(item.id).startsWith("new_")) return;

                changes.push({
                    type: "DELETE",
                    tableName: "submersible_pumps",
                    id: item.id,
                    columnName: "Tümü",
                    newValue: null,
                    rowName: item.pompa_adi,
                    oldValue: item.alis_fiyati
                });
                return;
            }

            // Yeni Kayıt Mantığı
            if (String(item.id).startsWith("new_")) {
                changes.push({
                    type: "INSERT",
                    tableName: "submersible_pumps",
                    id: undefined,
                    columnName: "pompa_adi",
                    newValue: item.pompa_adi,
                    rowName: item.pompa_adi,
                    oldValue: "",
                    additionalData: {
                        alis_fiyati: Number(item.alis_fiyati) || 0,
                        pompa_tipi: item.pompa_tipi,
                        kw: Number(item.kw) || 0 // 🚀 2. DÜZELTME: Yeni satır kaydında kw parametresi additionalData'ya eklendi.
                    }
                });
                return;
            }

            const originalItem = originalData.find((o) => String(o.id) === String(item.id));

            if (originalItem) {
                if (originalItem.pompa_adi !== item.pompa_adi) {
                    changes.push({
                        type: "UPDATE",
                        tableName: "submersible_pumps",
                        id: originalItem.id,
                        columnName: "pompa_adi",
                        newValue: item.pompa_adi,
                        rowName: originalItem.pompa_adi,
                        oldValue: originalItem.pompa_adi
                    });
                }

                duzenlenebilirFields.forEach((field) => {
                    const eskiDeger = originalItem[field];
                    const yeniDeger = item[field];

                    if (field === "alis_fiyati") {
                        const eskiFloat = parseFloat(eskiDeger || 0).toFixed(2);
                        const yeniFloat = parseFloat(yeniDeger || 0).toFixed(2);
                        if (eskiFloat !== yeniFloat) {
                            changes.push({
                                type: "UPDATE",
                                tableName: "submersible_pumps",
                                id: originalItem.id,
                                columnName: field,
                                newValue: Number(yeniFloat),
                                rowName: originalItem.pompa_adi,
                                oldValue: Number(eskiFloat)
                            });
                        }
                    } else if (field === "kw") {
                        // 🚀 3. DÜZELTME: kw sayısal bir değer olduğundan float hassasiyetiyle karşılaştırıldı
                        const eskiKw = parseFloat(eskiDeger || 0).toFixed(2);
                        const yeniKw = parseFloat(yeniDeger || 0).toFixed(2);
                        if (eskiKw !== yeniKw) {
                            changes.push({
                                type: "UPDATE",
                                tableName: "submersible_pumps",
                                id: originalItem.id,
                                columnName: field,
                                newValue: Number(yeniKw),
                                rowName: originalItem.pompa_adi,
                                oldValue: Number(eskiKw)
                            });
                        }
                    } else {
                        if (eskiDeger !== yeniDeger) {
                            changes.push({
                                type: "UPDATE",
                                tableName: "submersible_pumps",
                                id: originalItem.id,
                                columnName: field,
                                newValue: yeniDeger,
                                rowName: originalItem.pompa_adi,
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
            setAlertConfig({
                show: true,
                title: "Uyarı",
                message: "Değişen bir veri bulunamadı.",
                type: "warning"
            });
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
            const recalculated = originalData.map(item => {
                const anlikItem = prevPumps.find(p => p.id === item.id) || item;
                if (anlikItem.isDeleted) return anlikItem;

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
                newValue: change.newValue,
                additionalData: change.additionalData || undefined
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
            setAlertConfig({
                show: true,
                title: "Veriler kaydedilirken sistemsel bir hata meydana geldi",
                message: error,
                type: "error"
            });
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

    const visiblePumpsData = pumpsData.filter(p => !p.isDeleted);

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
                    <i className="bi bi-gear-fill me-2 text-success"></i>
                    <span className="fw-semibold small">Pompa Yönetimi</span>
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
                <ExcelGrid
                    headers={oranHeaders}
                    data={sabitOranlar}
                    fields={oranFields}
                    onDataChange={handleOranDataChange}
                />
            </div>

            <div className="mt-4">
                <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
                    <i className="bi bi-table me-2 text-secondary"></i>
                    <span className="fw-semibold small">Pompa Fiyat Listesi</span>
                </div>
                <ExcelGrid
                    headers={headers}
                    data={visiblePumpsData}
                    fields={fields}
                    onDataChange={handleGridDataChange}
                    isMainTable={true}
                    onActionClick={(row) => handleOpenCurveModal(row.id, row.pompa_adi)}
                />
            </div>

            <PriceChangeUpdateConfirmationModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleConfirmSave}
                changesList={pendingChanges}
            />

            <PumpCurveUpdateModal
                show={curveModalOpen}
                onClose={() => {
                    setCurveModalOpen(false);
                    setSelectedPumpId(null);
                    setSelectedPumpName("");
                }}
                pumpId={selectedPumpId}
                pumpName={selectedPumpName}
            />
            <AlertModal
                show={alertConfig.show}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(prev => ({ ...prev, show: false }))}
            />
        </div>
    );
}

export default DalgicPompa;