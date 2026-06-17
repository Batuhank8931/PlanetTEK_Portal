import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";

function Filtration() {
    const [filtrationData, setFiltrationData] = useState([]);
    const [sabitOranlar, setSabitOranlar] = useState([]);

    // 🛡️ Referans zincirlerini koparmak ve hesaplamaları her zaman saf kaynaktan beslemek için tutulan kopyalar
    const [originalData, setOriginalData] = useState([]);
    const [originalOranData, setOriginalOranData] = useState([]);

    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [pendingChanges, setPendingChanges] = useState([]);

    // 1. Ön Yüz Başlıkları (Toplam 19 Başlık)
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

    // 2. Başlıklarla Birebir Eşleşen Veri Alanları (ExcelGrid ilk kolonu isim/name kabul eder)
    const fields = [
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

    const oranHeaders = ["Ayar Tipi", "Yurt İçi Satış Oranı (Yİ)", "Yurt Dışı Satış Oranı (YD)"];
    const oranFields = ["yi_oran", "yd_oran"];

    const fetchFiltrationData = async () => {
        try {
            setLoading(true);
            const response = await API.getFiltrationCosts();

            const formatted = response.data.map(item => ({
                ...item,
                name: `${item.debi} m³/h`
            }));

            setFiltrationData(JSON.parse(JSON.stringify(formatted)));
            setOriginalData(JSON.parse(JSON.stringify(formatted)));

            const referans = formatted[0] || {};
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

    // 🛠️ Alış fiyatlarından biri elle değiştiğinde anlık satış simülasyonu
    // 🛠️ Alış fiyatlarından biri elle değiştiğinde anlık satış simülasyonu (DÜZELTİLDİ)
    const handleGridDataChange = (newData) => {
        const resolvedData = typeof newData === "function" ? newData(filtrationData) : newData;
        if (!resolvedData || !Array.isArray(resolvedData)) return;

        const currentOran = sabitOranlar[0] || { yi_oran: 1.30, yd_oran: 1.45 };

        const recalculated = resolvedData.map(item => {
            const spAlis = Number(item.sp_alis) || 0;
            const kfAlis = Number(item.kf_alis) || 0;
            const akfAlis = Number(item.akf_alis) || 0;
            const bpAlis = Number(item.besleme_pompa_alis) || 0;
            const gyAlis = Number(item.geri_yikama_alis) || 0;

            const yiOran = Number(currentOran.yi_oran) || 1.30;
            const ydOran = Number(currentOran.yd_oran) || 1.45;

            return {
                ...item,
                sp_alis: spAlis,
                kf_alis: kfAlis,
                akf_alis: akfAlis,
                besleme_pompa_alis: bpAlis,
                geri_yikama_alis: gyAlis,

                // 🚀 Satış anahtarları fields dizisiyle tam olarak eşitlendi
                sp_satis_yi: (spAlis * yiOran).toFixed(2),
                kf_satis_yi: (kfAlis * yiOran).toFixed(2),
                akf_satis_yi: (akfAlis * yiOran).toFixed(2),
                besleme_pompa_satis_yi: (bpAlis * yiOran).toFixed(2),
                geri_yikama_satis_yi: (gyAlis * yiOran).toFixed(2), // _pompa_ kelimesi temizlendi

                sp_satis_yd: (spAlis * ydOran).toFixed(2),
                kf_satis_yd: (kfAlis * ydOran).toFixed(2),
                akf_satis_yd: (akfAlis * ydOran).toFixed(2),
                besleme_pompa_satis_yd: (bpAlis * ydOran).toFixed(2),
                geri_yikama_satis_yd: (gyAlis * ydOran).toFixed(2)  // _pompa_ kelimesi temizlendi
            };
        });

        setFiltrationData([...recalculated]);
    };

    // 🛠️ Katsayı kutucuğu değiştiğinde alt tabloyu tetikleyen zırhlı fonksiyon (DÜZELTİLDİ)
    const handleOranDataChange = (newOranData) => {
        const resolvedArray = typeof newOranData === "function"
            ? newOranData(sabitOranlar)
            : newOranData;

        if (!resolvedArray || !Array.isArray(resolvedArray)) return;

        setSabitOranlar([...resolvedArray]);

        const currentOran = resolvedArray[0] || {};
        const eskiOranlar = originalOranData[0] || { yi_oran: 1.30, yd_oran: 1.45 };

        const yiOran = currentOran.yi_oran !== undefined && currentOran.yi_oran !== ""
            ? Number(currentOran.yi_oran)
            : Number(eskiOranlar.yi_oran);

        const ydOran = currentOran.yd_oran !== undefined && currentOran.yd_oran !== ""
            ? Number(currentOran.yd_oran)
            : Number(eskiOranlar.yd_oran);

        setFiltrationData((prevData) => {
            const recalculated = originalData.map(item => {
                const anlikItem = prevData.find(p => String(p.id) === String(item.id)) || item;

                const spAlis = Number(anlikItem.sp_alis) || 0;
                const kfAlis = Number(anlikItem.kf_alis) || 0;
                const akfAlis = Number(anlikItem.akf_alis) || 0;
                const bpAlis = Number(anlikItem.besleme_pompa_alis) || 0;
                const gyAlis = Number(anlikItem.geri_yikama_alis) || 0;

                return {
                    ...anlikItem,
                    // 🚀 Satış anahtarları fields dizisiyle tam olarak eşitlendi
                    sp_satis_yi: (spAlis * yiOran).toFixed(2),
                    kf_satis_yi: (kfAlis * yiOran).toFixed(2),
                    akf_satis_yi: (akfAlis * yiOran).toFixed(2),
                    besleme_pompa_satis_yi: (bpAlis * yiOran).toFixed(2),
                    geri_yikama_satis_yi: (gyAlis * yiOran).toFixed(2), // _pompa_ kelimesi temizlendi

                    sp_satis_yd: (spAlis * ydOran).toFixed(2),
                    kf_satis_yd: (kfAlis * ydOran).toFixed(2),
                    akf_satis_yd: (akfAlis * ydOran).toFixed(2),
                    besleme_pompa_satis_yd: (bpAlis * ydOran).toFixed(2),
                    geri_yikama_satis_yd: (gyAlis * ydOran).toFixed(2)  // _pompa_ kelimesi temizlendi
                };
            });
            return [...recalculated];
        });
    };



    // 🛠️ Değişiklik Kontrolü ve Modal Tetikleyici (Gevşek Tip Uyuşmazlıkları ve Küsurat Zırhlı)
    const handleSaveClick = () => {
        const changes = [];
        const guncelOranRow = sabitOranlar[0] || {};
        const eskiOranRow = originalOranData[0] || {};

        // --- 1. ANA TABLO DEĞİŞİKLİK KONTROLÜ ---
        const tumAnaAlanlar = ["debi", ...dudenlenebilirFields];

        filtrationData.forEach((item) => {
            const originalItem = originalData.find((o) => String(o.id) === String(item.id));
            if (originalItem) {
                tumAnaAlanlar.forEach((field) => {
                    const eskiDeger = parseFloat(originalItem[field] || 0).toFixed(2);
                    const yeniDeger = parseFloat(item[field] || 0).toFixed(2);

                    if (eskiDeger !== yeniDeger) {
                        changes.push({
                            tableName: "filtration_systems",
                            id: originalItem.id,
                            columnName: field,
                            newValue: Number(yeniDeger),
                            rowName: `${originalItem.name || item.name} Sistem`,
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
            alert("Değişen bir ver bulunamadı.");
            return;
        }

        setPendingChanges(changes);
        setShowModal(true);
    };

    // ✅ Sakin Adım Adım Senkronizasyon Ekranı
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

            // Taze verileri çek ve mühürle
            const response = await API.getFiltrationCosts();
            const freshData = response.data.map(item => ({
                ...item,
                name: `${item.debi} m³/h`
            }));

            setFiltrationData(JSON.parse(JSON.stringify(freshData)));
            setOriginalData(JSON.parse(JSON.stringify(freshData)));

            const referans = freshData[0] || {};
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

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
                    <i className="bi bi-gear-fill me-2 text-success"></i>
                    <span className="fw-semibold small">Filtrasyon Sistemleri Yönetimi</span>
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
                    <span className="fw-semibold small">Sistem Maliyet ve Satış Fiyat Listesi</span>
                </div>
                <ExcelGrid
                    headers={headers}
                    data={filtrationData}
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

export default Filtration;