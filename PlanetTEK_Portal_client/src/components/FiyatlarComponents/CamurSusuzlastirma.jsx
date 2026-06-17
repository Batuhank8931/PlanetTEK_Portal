import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";

function CamurSusuzlastirma() {
    const [dewateringData, setDewateringData] = useState([]);
    const [sabitOranlar, setSabitOranlar] = useState([]);

    const [originalData, setOriginalData] = useState([]);
    const [originalOranData, setOriginalOranData] = useState([]);

    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [pendingChanges, setPendingChanges] = useState([]);

    // 📊 Kolon Yapısı: Tam 1:1 Eşleşme sağlandı!
    const headers = [
        "Ekipman Tipi",
        "Kapasite Değeri",
        "Kapasite Birimi",
        "Alış Fiyatı (€)",
        "Yurt İçi Oranı",
        "Yurt Dışı Oranı",
        "Yurt İçi Satış (€)",
        "Yurt Dışı Satış (€)"
    ];

    const fields = [
        "ekipman_tipi",
        "kapasite_degeri",
        "kapasite_birimi",
        "alis_fiyati",
        "yi_oran",
        "yd_oran",
        "satis_yi",
        "satis_yd"
    ];

    // Sadece grid üzerinde el ile müdahale edilebilecek alanlar
    const duzenlenebilirFields = [
        "ekipman_tipi",
        "kapasite_degeri",
        "kapasite_birimi",
        "alis_fiyati"
    ];

    const oranHeaders = ["Global Yurt İçi Katsayısı", "Global Yurt Dışı Katsayısı"];
    const oranFields = ["yi_oran", "yd_oran"];

    const fetchDewateringData = async () => {
        try {
            setLoading(true);
            const response = await API.getSludgeDewateringCosts(); // Sizin servis API fonksiyonunuz

            setDewateringData(JSON.parse(JSON.stringify(response.data)));
            setOriginalData(JSON.parse(JSON.stringify(response.data)));

            const referans = response.data[0] || {};
            const ilkOranlar = [
                {
                    id: "sabit_katsayi",
                    name: "Global Katsayılar",
                    yi_oran: referans.yi_oran || 1.30,
                    yd_oran: referans.yd_oran || 1.45
                }
            ];

            setSabitOranlar(JSON.parse(JSON.stringify(ilkOranlar)));
            setOriginalOranData(JSON.parse(JSON.stringify(ilkOranlar)));

        } catch (error) {
            console.error("Çamur susuzlaştırma verileri yüklenirken hata oluştu:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDewateringData();
    }, []);

    // ➕ Yeni Boş Satır Ekleme Fonksiyonu
    const handleAddNewRow = () => {
        const currentOran = sabitOranlar[0] || { yi_oran: 1.30, yd_oran: 1.45 };
        
        const newRow = {
            id: `new_${Date.now()}`,
            ekipman_tipi: "dekantor",
            kapasite_degeri: 1.00,
            kapasite_birimi: "m3/gun",
            alis_fiyati: 0,
            yi_oran: Number(currentOran.yi_oran),
            yd_oran: Number(currentOran.yd_oran),
            satis_yi: 0,
            satis_yd: 0,
            isNew: true
        };
        setDewateringData(prev => [...prev, newRow]);
    };

    // 🛠️ Alış fiyatı veya çarpanlar el ile değiştiğinde anlık satış simülasyonu
    const handleGridDataChange = (newData) => {
        const resolvedData = typeof newData === "function" ? newData(dewateringData) : newData;
        if (!resolvedData || !Array.isArray(resolvedData)) return;

        const recalculated = resolvedData.map(item => {
            if (item.isDeleted) return item;

            const alis = Number(item.alis_fiyati) || 0;
            const yiOran = Number(item.yi_oran) || 1.30;
            const ydOran = Number(item.yd_oran) || 1.45;

            return {
                ...item,
                ekipman_tipi: item.ekipman_tipi ? String(item.ekipman_tipi).trim() : "dekantor",
                kapasite_degeri: item.kapasite_degeri !== undefined ? Number(item.kapasite_degeri) : 0,
                kapasite_birimi: item.kapasite_birimi ? String(item.kapasite_birimi).trim() : "m3/gun",
                alis_fiyati: alis,
                satis_yi: (alis * yiOran).toFixed(2),
                satis_yd: (alis * ydOran).toFixed(2)
            };
        });

        setDewateringData([...recalculated]);
    };

    // 🛠️ Üst katsayı değiştiğinde alt tablodaki tüm satırları çarpan fonksiyonu
    const handleOranDataChange = (newOranData) => {
        const resolvedArray = typeof newOranData === "function" ? newOranData(sabitOranlar) : newOranData;
        if (!resolvedArray || !Array.isArray(resolvedArray)) return;

        setSabitOranlar([...resolvedArray]);

        const currentOran = resolvedArray[0] || {};
        const eskiOranlar = originalOranData[0] || { yi_oran: 1.30, yd_oran: 1.45 };

        const yiOran = currentOran.yi_oran !== undefined && currentOran.yi_oran !== "" ? Number(currentOran.yi_oran) : Number(eskiOranlar.yi_oran);
        const ydOran = currentOran.yd_oran !== undefined && currentOran.yd_oran !== "" ? Number(currentOran.yd_oran) : Number(eskiOranlar.yd_oran);

        setDewateringData((prevData) => {
            return prevData.map(item => {
                if (item.isDeleted) return item;

                const alis = Number(item.alis_fiyati) || 0;
                return {
                    ...item,
                    yi_oran: yiOran,
                    yd_oran: ydOran,
                    satis_yi: (alis * yiOran).toFixed(2),
                    satis_yd: (alis * ydOran).toFixed(2)
                };
            });
        });
    };

    // 🛠️ KAYDET BUTONU: Diferansiyel Fark Algılama Altyapısı
    const handleSaveClick = () => {
        const changes = [];
        const guncelOranRow = sabitOranlar[0] || {};
        const eskiOranRow = originalOranData[0] || {};

        dewateringData.forEach((item) => {
            // ❌ DURUM A: Satır Silinmiş mi? (DELETE)
            if (item.isDeleted) {
                if (String(item.id).startsWith("new_")) return;

                changes.push({
                    type: "DELETE",
                    tableName: "sludge_dewatering_costs",
                    id: item.id,
                    columnName: "ekipman_tipi",
                    newValue: null,
                    rowName: `${item.ekipman_tipi} (${item.kapasite_degeri} ${item.kapasite_birimi})`,
                    oldValue: 0
                });
                return;
            }

            // ➕ DURUM B: Yeni Satır mı? (INSERT)
            if (String(item.id).startsWith("new_")) {
                changes.push({
                    type: "INSERT",
                    tableName: "sludge_dewatering_costs",
                    id: undefined,
                    columnName: "ekipman_tipi",
                    newValue: item.ekipman_tipi,
                    rowName: `${item.ekipman_tipi} Yeni Kayıt`,
                    oldValue: 0,
                    additionalData: {
                        kapasite_degeri: Number(item.kapasite_degeri) || 0,
                        kapasite_birimi: item.kapasite_birimi,
                        alis_fiyati: Number(item.alis_fiyati) || 0,
                        yi_oran: Number(item.yi_oran) || 1.30,
                        yd_oran: Number(item.yd_oran) || 1.45
                    }
                });
                return;
            }

            // 🔄 DURUM C: Mevcut Satır Güncelleme mi? (UPDATE)
            const originalItem = originalData.find((o) => String(o.id) === String(item.id));
            if (originalItem) {
                const tumTaramaKolonlari = ["ekipman_tipi", "kapasite_degeri", "kapasite_birimi", "alis_fiyati"];

                tumTaramaKolonlari.forEach((field) => {
                    const esitMi = ["ekipman_tipi", "kapasite_birimi"].includes(field)
                        ? String(originalItem[field]).trim() === String(item[field]).trim()
                        : Number(originalItem[field] || 0) === Number(item[field] || 0);

                    if (!esitMi) {
                        changes.push({
                            type: "UPDATE",
                            tableName: "sludge_dewatering_costs",
                            id: originalItem.id,
                            columnName: field,
                            newValue: ["ekipman_tipi", "kapasite_birimi"].includes(field) ? item[field] : Number(item[field]),
                            rowName: `${originalItem.ekipman_tipi} (${originalItem.kapasite_degeri} ${originalItem.kapasite_birimi})`,
                            oldValue: originalItem[field]
                        });
                    }
                });
            }
        });

        // --- 2. GLOBAL KATSAYILAR KONTROLÜ ---
        oranFields.forEach((oranField) => {
            const eskiOran = parseFloat(eskiOranRow[oranField] || 0).toFixed(2);
            const guncelOran = parseFloat(guncelOranRow[oranField] || 0).toFixed(2);

            if (eskiOran !== guncelOran) {
                const friendlyName = oranField === "yi_oran" ? "Yurt İçi Oranı" : "Yurt Dışı Oranı";
                const firstId = originalData[0]?.id || 1;

                changes.push({
                    type: "UPDATE",
                    tableName: "sludge_dewatering_costs",
                    id: firstId,
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

            await fetchDewateringData();
            setPendingChanges([]);

        } catch (error) {
            console.error("Kaydetme esnasında teknik hata:", error);
            alert("Veriler kaydedilirken sistemsel bir hata meydana geldi.");
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

    const visibleDewateringData = dewateringData.filter(d => !d.isDeleted);

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
                    <i className="bi bi-water me-2 text-success"></i>
                    <span className="fw-semibold small">Çamur Susuzlaştırma Maliyet Yönetimi</span>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm px-3" onClick={handleAddNewRow}>
                        <i className="bi bi-plus-circle me-2"></i>Yeni Kademe Ekle
                    </button>
                    <button className="btn btn-success btn-sm px-4" onClick={handleSaveClick}>
                        <i className="bi bi-file-earmark-excel me-2"></i>Kaydet
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
                    <i className="bi bi-sliders me-2 text-success"></i>
                    <span className="fw-semibold small">Katsayı Oranları</span>
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
                    <span className="fw-semibold small">Ekipman Maliyet ve Çarpan Listesi</span>
                </div>
                <ExcelGrid
                    headers={headers}
                    data={visibleDewateringData}
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

export default CamurSusuzlastirma;