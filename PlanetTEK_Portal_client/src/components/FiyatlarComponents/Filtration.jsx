import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";

function Filtration() {
    const [filtrationData, setFiltrationData] = useState([]);
    const [sabitOranlar, setSabitOranlar] = useState([]);

    const [originalData, setOriginalData] = useState([]);
    const [originalOranData, setOriginalOranData] = useState([]);

    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [pendingChanges, setPendingChanges] = useState([]);

    // 1. Ön Yüz Başlıkları (Tam 19 adet başlık)
    const headers = [
        "Sistem Debisi (m³/h)",
        "S.P. Alış (€)",
        "K.F. Alış (€)",
        "A.K.F. Alış (€)",
        "Besleme Pompa Alış (€)",
        "Geri Yıkama Alış (€)",
        "S.P. Satış Yİ (€)",
        "K.F. Satış Yİ (€)",
        "A.K.F. Satış Yİ (€)",
        "Besleme Pompa Satış Yİ (€)",
        "Geri Yıkama Satış Yİ (€)",
        "S.P. Satış YD (€)",
        "K.F. Satış YD (€)",
        "A.K.F. Satış YD (€)",
        "Besleme Pompa Satış YD (€)",
        "Geri Yıkama Satış YD (€)",
        "Besleme kW",
        "Geri Yıkama Debisi",
        "Geri Yıkama kW"
    ];

    // 2. Başlıklarla Birebir Eşleşen Veri Alanları (Tam 19 adet field)
    const fields = [
        "debi",
        "sp_alis",
        "kf_alis",
        "akf_alis",
        "besleme_pompa_alis",
        "geri_yikama_alis",
        "sp_satis_yi",
        "kf_satis_yi",
        "akf_satis_yi",
        "besleme_pompa_satis_yi",
        "geri_yikama_satis_yi",
        "sp_satis_yd",
        "kf_satis_yd",
        "akf_satis_yd",
        "besleme_pompa_satis_yd",
        "geri_yikama_satis_yd",
        "besleme_kw",
        "geri_yikama_debi",
        "geri_yikama_kw"
    ];

    const dudenlenebilirFields = [
        "sp_alis",
        "kf_alis",
        "akf_alis",
        "besleme_pompa_alis",
        "geri_yikama_alis",
        "besleme_kw",
        "geri_yikama_debi",
        "geri_yikama_kw"
    ];

    const oranHeaders = ["Yurt İçi Satış Oranı (Yİ)", "Yurt Dışı Satış Oranı (YD)"];
    const oranFields = ["yi_oran", "yd_oran"];

    const fetchFiltrationData = async () => {
        try {
            setLoading(true);
            const response = await API.getFiltrationCosts();

            setFiltrationData(JSON.parse(JSON.stringify(response.data)));
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
            console.error("Filtrasyon verileri yüklenirken hata oluştu:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiltrationData();
    }, []);

    // ➕ Yeni Boş Filtrasyon Satırı Ekleme Fonksiyonu
    const handleAddNewRow = () => {
        const nextDebi = (filtrationData.length + 1) * 5; // Simülatif bir sonraki debi değeri (Örn: 5, 10, 15...)
        
        const newRow = {
            id: `new_${Date.now()}`, // Benzersiz geçici ID
            debi: nextDebi,
            sp_alis: 0, kf_alis: 0, akf_alis: 0, besleme_pompa_alis: 0, geri_yikama_alis: 0,
            sp_satis_yi: 0, kf_satis_yi: 0, akf_satis_yi: 0, besleme_pompa_satis_yi: 0, geri_yikama_satis_yi: 0,
            sp_satis_yd: 0, kf_satis_yd: 0, akf_satis_yd: 0, besleme_pompa_satis_yd: 0, geri_yikama_satis_yd: 0,
            besleme_kw: 0, geri_yikama_debi: 0, geri_yikama_kw: 0,
            isNew: true
        };
        setFiltrationData(prev => [...prev, newRow]);
    };

    // 🛠️ Alış fiyatlarından biri elle değiştiğinde anlık satış simülasyonu
    const handleGridDataChange = (newData) => {
        const resolvedData = typeof newData === "function" ? newData(filtrationData) : newData;
        if (!resolvedData || !Array.isArray(resolvedData)) return;

        const currentOran = sabitOranlar[0] || { yi_oran: 1.30, yd_oran: 1.45 };

        const recalculated = resolvedData.map(item => {
            if (item.isDeleted) return item;

            const debiValue = item.debi !== undefined ? Number(item.debi) : 0;
            const spAlis = Number(item.sp_alis) || 0;
            const kfAlis = Number(item.kf_alis) || 0;
            const akfAlis = Number(item.akf_alis) || 0;
            const bpAlis = Number(item.besleme_pompa_alis) || 0;
            const gyAlis = Number(item.geri_yikama_alis) || 0;

            const yiOran = Number(currentOran.yi_oran) || 1.30;
            const ydOran = Number(currentOran.yd_oran) || 1.45;

            return {
                ...item,
                debi: debiValue,
                sp_alis: spAlis,
                kf_alis: kfAlis,
                akf_alis: akfAlis,
                besleme_pompa_alis: bpAlis,
                geri_yikama_alis: gyAlis,

                sp_satis_yi: (spAlis * yiOran).toFixed(2),
                kf_satis_yi: (kfAlis * yiOran).toFixed(2),
                akf_satis_yi: (akfAlis * yiOran).toFixed(2),
                besleme_pompa_satis_yi: (bpAlis * yiOran).toFixed(2),
                geri_yikama_satis_yi: (gyAlis * yiOran).toFixed(2),

                sp_satis_yd: (spAlis * ydOran).toFixed(2),
                kf_satis_yd: (kfAlis * ydOran).toFixed(2),
                akf_satis_yd: (akfAlis * ydOran).toFixed(2),
                besleme_pompa_satis_yd: (bpAlis * ydOran).toFixed(2),
                geri_yikama_satis_yd: (gyAlis * ydOran).toFixed(2)
            };
        });

        setFiltrationData([...recalculated]);
    };

    // 🛠️ Katsayı kutucuğu değiştiğinde alt tabloyu tetikleyen fonksiyon
    const handleOranDataChange = (newOranData) => {
        const resolvedArray = typeof newOranData === "function" ? newOranData(sabitOranlar) : newOranData;
        if (!resolvedArray || !Array.isArray(resolvedArray)) return;

        setSabitOranlar([...resolvedArray]);

        const currentOran = resolvedArray[0] || {};
        const eskiOranlar = originalOranData[0] || { yi_oran: 1.30, yd_oran: 1.45 };

        const yiOran = currentOran.yi_oran !== undefined && currentOran.yi_oran !== "" ? Number(currentOran.yi_oran) : Number(eskiOranlar.yi_oran);
        const ydOran = currentOran.yd_oran !== undefined && currentOran.yd_oran !== "" ? Number(currentOran.yd_oran) : Number(eskiOranlar.yd_oran);

        setFiltrationData((prevData) => {
            return prevData.map(item => {
                if (item.isDeleted) return item;

                const spAlis = Number(item.sp_alis) || 0;
                const kfAlis = Number(item.kf_alis) || 0;
                const akfAlis = Number(item.akf_alis) || 0;
                const bpAlis = Number(item.besleme_pompa_alis) || 0;
                const gyAlis = Number(item.geri_yikama_alis) || 0;

                return {
                    ...item,
                    sp_satis_yi: (spAlis * yiOran).toFixed(2),
                    kf_satis_yi: (kfAlis * yiOran).toFixed(2),
                    akf_satis_yi: (akfAlis * yiOran).toFixed(2),
                    besleme_pompa_satis_yi: (bpAlis * yiOran).toFixed(2),
                    geri_yikama_satis_yi: (gyAlis * yiOran).toFixed(2),

                    sp_satis_yd: (spAlis * ydOran).toFixed(2),
                    kf_satis_yd: (kfAlis * ydOran).toFixed(2),
                    akf_satis_yd: (akfAlis * ydOran).toFixed(2),
                    besleme_pompa_satis_yd: (bpAlis * ydOran).toFixed(2),
                    geri_yikama_satis_yd: (gyAlis * ydOran).toFixed(2)
                };
            });
        });
    };

    // 🛠️ KAYDET BUTONU: Ekleme, Silme ve Güncelleme Fark Algılama Altyapısı
    const handleSaveClick = () => {
        const changes = [];
        const guncelOranRow = sabitOranlar[0] || {};
        const eskiOranRow = originalOranData[0] || {};

        filtrationData.forEach((item) => {
            // ❌ DURUM A: Satır Silinmiş mi? (DELETE)
            if (item.isDeleted) {
                if (String(item.id).startsWith("new_")) return;

                changes.push({
                    type: "DELETE",
                    tableName: "filtration_systems",
                    id: item.id,
                    columnName: "debi", // Güvenlik listesi için placeholder tetikleyici kolon
                    newValue: null,
                    rowName: `${item.debi} m³/h Sistem`,
                    oldValue: 0
                });
                return;
            }

            // ➕ DURUM B: Yeni Satır mı? (INSERT)
            if (String(item.id).startsWith("new_")) {
                changes.push({
                    type: "INSERT",
                    tableName: "filtration_systems",
                    id: undefined,
                    columnName: "debi", // İlk zorunlu ana kolonumuz
                    newValue: Number(item.debi) || 0,
                    rowName: `${item.debi} m³/h Yeni Sistem`,
                    oldValue: 0,
                    additionalData: {
                        sp_alis: Number(item.sp_alis) || 0,
                        kf_alis: Number(item.kf_alis) || 0,
                        akf_alis: Number(item.akf_alis) || 0,
                        besleme_pompa_alis: Number(item.besleme_pompa_alis) || 0,
                        geri_yikama_alis: Number(item.geri_yikama_alis) || 0,
                        besleme_kw: Number(item.besleme_kw) || 0,
                        geri_yikama_debi: Number(item.geri_yikama_debi) || 0,
                        geri_yikama_kw: Number(item.geri_yikama_kw) || 0
                    }
                });
                return;
            }

            // 🔄 DURUM C: Mevcut Satır Güncelleme mi? (UPDATE)
            const originalItem = originalData.find((o) => String(o.id) === String(item.id));
            if (originalItem) {
                const tumGuncellenecekSutunlar = ["debi", ...dudenlenebilirFields];

                tumGuncellenecekSutunlar.forEach((field) => {
                    const eskiDeger = parseFloat(originalItem[field] || 0).toFixed(2);
                    const yeniDeger = parseFloat(item[field] || 0).toFixed(2);

                    if (eskiDeger !== yeniDeger) {
                        changes.push({
                            type: "UPDATE",
                            tableName: "filtration_systems",
                            id: originalItem.id,
                            columnName: field,
                            newValue: Number(yeniDeger),
                            rowName: `${originalItem.debi} m³/h Sistem`,
                            oldValue: Number(eskiDeger)
                        });
                    }
                });
            }
        });

        // --- 2. ÜST ORAN TABLOSU DEĞİŞİKLİK KONTROLÜ ---
        oranFields.forEach((oranField) => {
            const eskiOran = parseFloat(eskiOranRow[oranField] || 0).toFixed(2);
            const guncelOran = parseFloat(guncelOranRow[oranField] || 0).toFixed(2);

            if (eskiOran !== guncelOran) {
                const friendlyName = oranField === "yi_oran" ? "Yurt İçi Oranı" : "Yurt Dışı Oranı";
                const firstId = originalData[0]?.id || 1;

                changes.push({
                    type: "UPDATE",
                    tableName: "filtration_systems",
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

            const response = await API.getFiltrationCosts();
            setFiltrationData(JSON.parse(JSON.stringify(response.data)));
            setOriginalData(JSON.parse(JSON.stringify(response.data)));

            const referans = response.data[0] || {};
            const yeniOranlar = [
                {
                    id: "sabit_katsayi",
                    name: "Global Katsayılar",
                    yi_oran: referans.yi_oran || 1.30,
                    yd_oran: referans.yd_oran || 1.45
                }
            ];

            setSabitOranlar(JSON.parse(JSON.stringify(yeniOranlar)));
            setOriginalOranData(JSON.parse(JSON.stringify(yeniOranlar)));
            setPendingChanges([]);

        } catch (error) {
            console.error("Kaydetme esnasında teknik hata:", error);
            alert("Veriler kaydedilirken teknik bir hata meydana geldi.");
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

    const visibleFiltrationData = filtrationData.filter(d => !d.isDeleted);

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
                    <i className="bi bi-gear-fill me-2 text-success"></i>
                    <span className="fw-semibold small">Filtrasyon Sistemleri Yönetimi</span>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm px-3" onClick={handleAddNewRow}>
                        <i className="bi bi-plus-circle me-2"></i>Yeni Sistem Ekle
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
                    <span className="fw-semibold small">Sistem Maliyet ve Satış Fiyat Listesi</span>
                </div>
                <ExcelGrid
                    headers={headers}
                    data={visibleFiltrationData}
                    fields={fields}
                    onDataChange={handleGridDataChange}
                    isMainTable={true} // Aksiyon silme butonu aktif
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

export default Filtration;