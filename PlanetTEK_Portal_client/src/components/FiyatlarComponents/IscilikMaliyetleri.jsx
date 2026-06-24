import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";
import AlertModal from "../modals/AlertModal";

function IscilikMaliyetleri() {
    const [laborCostsData, setLaborCostsData] = useState([]);
    const [originalData, setOriginalData] = useState([]); // Değişiklik kontrolü için saf veri kopyası
    const [loading, setLoading] = useState(true);

    // Modal State Yönetimi
    const [showModal, setShowModal] = useState(false);
    const [pendingChanges, setPendingChanges] = useState([]);
    const [alertConfig, setAlertConfig] = useState({
        show: false,
        title: "",
        message: "",
        type: "success",
        showCancel: false, // İptal butonu olsun mu?
        action: null       // "Evet" denirse ne çalışsın?
    });

    // 📊 Kolon Yapısı: 9 Başlık ve 9 Field tam 1:1 senkronize edildi, hiçbir alan hidden değil!
    const headers = [
        "Kombinasyon Adı",
        "Mekanik Kişi Sayısı", "Mekanik Gün Sayısı",
        "Elektrik Kişi Sayısı", "Elektrik Gün Sayısı",
        "Günlük İşçilik Maliyet (€)", "Günlük Yemek-Konaklama (€)", "Diğer Günlük Maliyet (€)",
        "Toplam İşçilik Maliyet (€)"
    ];

    // Kombinasyon adını ('ad' kolonu) fields dizisinin en başına çektik
    const fields = [
        "ad",
        "mekKisi", "mekGun",
        "elkKisi", "elkGun",
        "gunlikMekMaliyet", "gunlukYemek", "digerGunluk",
        "toplamMaliyet"
    ];

    const fetchIscilikMaliyetleri = async () => {
        try {
            setLoading(true);
            const response = await API.getUnitLaborCosts();

            // Tüm datayı tek bir state havuzunda topluyoruz
            setLaborCostsData(JSON.parse(JSON.stringify(response.data)));
            setOriginalData(JSON.parse(JSON.stringify(response.data)));
        } catch (error) {
            console.error("İşçilik maliyetleri yüklenirken hata oldu:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIscilikMaliyetleri();
    }, []);

    // ➕ Yeni Boş İşçilik Kombinasyonu Ekleme Fonksiyonu
    const handleAddNewRow = () => {
        const nextNum = laborCostsData.length + 1;
        const defaultName = `${nextNum} Ünite Kombinasyonu`;

        const newRow = {
            id: `new_${Date.now()}`, // Benzersiz geçici ID
            ad: defaultName,         // ExcelGrid ilk hücrede bunu görecek ve düzenletecek
            mekKisi: 0, mekGun: 0,
            elkKisi: 0, elkGun: 0,
            gunlikMekMaliyet: 0, gunlukYemek: 0, digerGunluk: 0,
            toplamMaliyet: 0,
            isNew: true
        };
        setLaborCostsData(prev => [...prev, newRow]);
    };

    // 🛠️ Grid üzerinde herhangi bir veri (ad veya sayısal veri) değiştiğinde anlık formül hesabı yapar
    const handleGridDataChange = (newData) => {
        const resolvedData = typeof newData === "function" ? newData(laborCostsData) : newData;
        if (!resolvedData || !Array.isArray(resolvedData)) return;

        // Formülü tüm satırlara anlık olarak uyguluyoruz
        const calculatedData = resolvedData.map(item => {
            const mekKisi = Number(item.mekKisi) || 0;
            const mekGun = Number(item.mekGun) || 0;
            const elkKisi = Number(item.elkKisi) || 0;
            const elkGun = Number(item.elkGun) || 0;

            const gunlikMekMaliyet = Number(item.gunlikMekMaliyet) || 0;
            const gunlukYemek = Number(item.gunlukYemek) || 0;
            const digerGunluk = Number(item.digerGunluk) || 0;

            // Veritabanındaki GENERATED ALWAYS AS formül simülasyonu
            const hesaplananToplam = ((mekKisi * mekGun) + (elkKisi * elkGun)) * (gunlikMekMaliyet + gunlukYemek + digerGunluk);

            return {
                ...item,
                toplamMaliyet: parseFloat(hesaplananToplam.toFixed(2)) // decimal(12,2) uyumluluğu için yuvarlama
            };
        });

        setLaborCostsData(calculatedData);
    };

    // 🔍 Değişiklikleri tek bir havuz üzerinden tarayan fonksiyon
    const handleSaveClick = () => {
        const changes = [];

        laborCostsData.forEach((item) => {
            // ❌ DURUM A: Satır Silinmiş mi? (DELETE)
            if (item.isDeleted) {
                if (String(item.id).startsWith("new_")) return;

                changes.push({
                    type: "DELETE",
                    tableName: "unit_labor_costs",
                    id: item.id,
                    columnName: "ad", // Güvenlik duvarı placeholder'ı
                    newValue: null,
                    rowName: item.ad,
                    oldValue: 0
                });
                return;
            }

            // ➕ DURUM B: Yeni Satır mı? (INSERT)
            if (String(item.id).startsWith("new_")) {
                changes.push({
                    type: "INSERT",
                    tableName: "unit_labor_costs",
                    id: undefined,
                    columnName: "ad", // Tetikleyici ana kolon
                    newValue: item.ad,
                    rowName: item.ad,
                    oldValue: 0,
                    additionalData: {
                        mekKisi: Number(item.mekKisi) || 0, mekGun: Number(item.mekGun) || 0,
                        elkKisi: Number(item.elkKisi) || 0, elkGun: Number(item.elkGun) || 0,
                        gunlikMekMaliyet: Number(item.gunlikMekMaliyet) || 0,
                        gunlukYemek: Number(item.gunlukYemek) || 0,
                        digerGunluk: Number(item.digerGunluk) || 0
                        // NOT: Veritabanında toplamMaliyet GENERATED ALWAYS AS olduğundan INSERT payload'una eklemiyoruz. DB otomatik hesaplayacak.
                    }
                });
                return;
            }

            // 🔄 DURUM C: Mevcut Satır Güncelleme mi? (UPDATE)
            const originalItem = originalData.find((o) => String(o.id) === String(item.id));

            if (originalItem) {
                fields.forEach((field) => {
                    // KORUMA: toplamMaliyet sanal kolon olduğundan veritabanına UPDATE isteği olarak gönderilemez.
                    if (field === "toplamMaliyet") return;

                    const esitMi = field === "ad"
                        ? String(originalItem[field]).trim() === String(item[field]).trim()
                        : Number(originalItem[field] || 0) === Number(item[field] || 0);

                    if (!esitMi) {
                        changes.push({
                            type: "UPDATE",
                            tableName: "unit_labor_costs",
                            id: originalItem.id,
                            columnName: field,
                            newValue: field === "ad" ? item[field] : Number(item[field]),
                            rowName: item.ad,
                            oldValue: originalItem[field] || 0
                        });
                    }
                });
            }
        });

        if (changes.length === 0) {
            setAlertConfig({
                show: true,
                title: "Uyarı",
                message: "Değişen bir veri bulunamadı.",
                type: "warning",
                showCancel: false,
                action: null
            });
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

            // Taptaze verileri DB'den tek bir havuz olarak yeniden çek
            await fetchIscilikMaliyetleri();
            setPendingChanges([]);
        } catch (error) {
            console.error("İşçilik verileri kaydedilirken hata oluştu:", error);
            setAlertConfig({
                show: true,
                title: "Veriler kaydedilirken sistemsel bir hata meydana geldi",
                message: error,
                type: "error",
                showCancel: false,
                action: null
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center my-5">
                <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                </div>
            </div>
        );
    }

    const visibleLaborCostsData = laborCostsData.filter(d => !d.isDeleted);

    return (
        <div>
            {/* ÜST BAR, PANEL BAŞLIĞI VE BUTONLAR */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
                    <i className="bi bi-people-fill me-2 text-success"></i>
                    <span className="fw-semibold small">İşçilik ve Kombinasyon Maliyet Yönetimi</span>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm px-3" onClick={handleAddNewRow}>
                        <i className="bi bi-plus-circle me-2"></i>Yeni Kombinasyon Ekle
                    </button>
                    <button className="btn btn-success btn-sm px-4" onClick={handleSaveClick}>
                        <i className="bi bi-file-earmark-excel me-2"></i>Kaydet
                    </button>
                </div>
            </div>

            {/* TEK VE SAĞLAM HAVUZ TABLOSU */}
            <div className="mb-4">
                <ExcelGrid
                    headers={headers}
                    data={visibleLaborCostsData}
                    fields={fields}
                    onDataChange={handleGridDataChange}
                    isMainTable={true} // Aksiyon (Silme) butonu aktif
                />
            </div>

            <PriceChangeUpdateConfirmationModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleConfirmSave}
                changesList={pendingChanges}
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

export default IscilikMaliyetleri;