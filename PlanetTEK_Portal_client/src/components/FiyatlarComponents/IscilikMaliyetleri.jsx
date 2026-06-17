import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";

function IscilikMaliyetleri() {
    const [sadeceUnite, setSadeceUnite] = useState([]);
    const [uniteFiltrasyon, setUniteFiltrasyon] = useState([]);
    const [uniteFiltrasyonCamur, setUniteFiltrasyonCamur] = useState([]);
    const [uniteCamur, setUniteCamur] = useState([]);

    // Değişiklik kontrolü için veritabanından gelen saf veri kopyası
    const [originalData, setOriginalData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State Yönetimi
    const [showModal, setShowModal] = useState(false);
    const [pendingChanges, setPendingChanges] = useState([]);

    const headers = [
        "Kombinasyon Adı",
        "Mekanik Kişi Sayısı", "Mekanik Gün Sayısı",
        "Elektrik Kişi Sayısı", "Elektrik Gün Sayısı",
        "Günlük İşçilik Maliyet (€)", "Günlük Yemek-Konaklama (€)", "Diğer Günlük Maliyet (€)",
        "Toplam İşçilik Maliyet (€)"
    ];

    const fields = ["mekKisi", "mekGun", "elkKisi", "elkGun", "gunlikMekMaliyet", "gunlukYemek", "digerGunluk", "toplamMaliyet"];

    // 🔍 Bileşen yüklendiğinde tek tablodan tüm verileri çek ve grupla
    useEffect(() => {
        const fetchIscilikMaliyetleri = async () => {
            try {
                setLoading(true);
                const response = await API.getUnitLaborCosts();
                const allData = response.data;

                // Değişiklik analizi için ana kopyayı sakla
                setOriginalData(JSON.parse(JSON.stringify(allData)));

                // Veritabanı enum yapılarına göre filtreleyip state'leri besliyoruz
                // Not: Eğer 'Filtrasyon' grubunda ünite+filtrasyon kastediliyorsa şemana göre grupluyoruz.
                // Veritabanı enum değerlerine göre aşağıdaki filtreleri kontrol edebilirsin:
                setSadeceUnite(allData.filter(item => !item.ad.includes('+')));
                setUniteFiltrasyon(allData.filter(item => item.ad.includes('filtrasyon') && !item.ad.includes('çamur')));
                setUniteFiltrasyonCamur(allData.filter(item => item.ad.includes('filtrasyon') && item.ad.includes('çamur')));
                setUniteCamur(allData.filter(item => !item.ad.includes('filtrasyon') && item.ad.includes('çamur')));

            } catch (error) {
                console.error("İşçilik maliyetleri yüklenirken hata oluştu:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchIscilikMaliyetleri();
    }, []);

    // 🔍 4 Farklı grid üzerindeki tüm değişiklikleri tek seferde analiz et
    const handleSaveClick = () => {
        const changes = [];
        // Tüm state içeriklerini tek bir kontrol array'inde birleştiriyoruz
        const currentDataPool = [...sadeceUnite, ...uniteFiltrasyon, ...uniteFiltrasyonCamur, ...uniteCamur];

        currentDataPool.forEach((item) => {
            const originalItem = originalData.find((o) => o.id === item.id);

            if (originalItem) {
                fields.forEach((field) => {
                    if (Number(originalItem[field]) !== Number(item[field])) {
                        changes.push({
                            tableName: "unit_labor_costs",
                            id: item.id,
                            columnName: field,
                            newValue: Number(item[field]),
                            rowName: item.ad, // Kombinasyon adı (Örn: "3 ünite + filtrasyon")
                            oldValue: Number(originalItem[field])
                        });
                    }
                });
            }
        });

        if (changes.length === 0) {
            console.log("Değişen bir işçilik verisi bulunamadı.");
            return;
        }

        setPendingChanges(changes);
        setShowModal(true);
    };

    // ✅ Onay verilince tüm işçilik değişikliklerini tek bir toplu istekte gönder
    const handleConfirmSave = async () => {
        setShowModal(false);
        setLoading(true);

        try {
            // Eğer kaydedilecek bir değişiklik yoksa işlemi durdur
            if (pendingChanges.length === 0) return;

            // İlk elemandan tablonun adını güvenle alıyoruz ("unit_labor_costs")
            const targetTableName = pendingChanges[0].tableName;

            // Backend'in beklediği yeni sadeleştirilmiş bulk array formatı
            const updatesPayload = pendingChanges.map((change) => ({
                id: change.id,
                columnName: change.columnName,
                newValue: change.newValue
            }));

            // 🚀 Tek istek, tek transaction!
            await API.updatePriceData({
                tableName: targetTableName,
                updates: updatesPayload
            });

            // Başarılıysa, ekrandaki 4 farklı state'in güncel halini bir havuzda birleştirip orijinal veri olarak mühürle
            const currentDataPool = [...sadeceUnite, ...uniteFiltrasyon, ...uniteFiltrasyonCamur, ...uniteCamur];
            setOriginalData(JSON.parse(JSON.stringify(currentDataPool)));

            setPendingChanges([]); // Bekleyen değişiklikleri temizle
        } catch (error) {
            console.error("İşçilik verileri veritabanına yazılırken hata:", error);
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

    return (
        <div>
            {/* ÜST BAR VE KAYDET BUTONU */}
            <div className="d-flex justify-content-end align-items-center mb-3">
                <button className="btn btn-success btn-sm px-4" onClick={handleSaveClick}>
                    <i className="bi bi-file-earmark-excel me-2"></i>Kaydet
                </button>
            </div>

            <div className="d-flex flex-column gap-5">
                {/* TABLO 1: SADECE ÜNİTE */}
                <div>
                    <div className="p-2 mb-2 rounded bg-dark fw-bold text-info border-bottom" style={{ borderColor: "#334155", fontSize: "13px" }}>
                        1. Standart Ünite İşçilik Parametreleri (1 - 20 Ünite)
                    </div>
                    <ExcelGrid headers={headers} data={sadeceUnite} fields={fields} onDataChange={setSadeceUnite} />
                </div>

                {/* TABLO 2: ÜNİTE + FİLTRASYON */}
                <div>
                    <div className="p-2 mb-2 rounded bg-dark fw-bold text-info border-bottom" style={{ borderColor: "#334155", fontSize: "13px" }}>
                        2. Ünite + Filtrasyon Kombinasyonu (1 - 10 Ünite)
                    </div>
                    <ExcelGrid headers={headers} data={uniteFiltrasyon} fields={fields} onDataChange={setUniteFiltrasyon} />
                </div>

                {/* TABLO 3: ÜNİTE + FİLTRASYON + ÇAMUR SUSUZLAŞTIRMA */}
                <div>
                    <div className="p-2 mb-2 rounded bg-dark fw-bold text-info border-bottom" style={{ borderColor: "#334155", fontSize: "13px" }}>
                        3. Ünite + Filtrasyon + Çamur Susuzlaştırma Kombinasyonu (1 - 10 Ünite)
                    </div>
                    <ExcelGrid headers={headers} data={uniteFiltrasyonCamur} fields={fields} onDataChange={setUniteFiltrasyonCamur} />
                </div>

                {/* TABLO 4: ÜNİTE + ÇAMUR SUSUZLAŞTIRMA */}
                <div>
                    <div className="p-2 mb-2 rounded bg-dark fw-bold text-info border-bottom" style={{ borderColor: "#334155", fontSize: "13px" }}>
                        4. Ünite + Çamur Susuzlaştırma Kombinasyonu (1 - 10 Ünite)
                    </div>
                    <ExcelGrid headers={headers} data={uniteCamur} fields={fields} onDataChange={setUniteCamur} />
                </div>
            </div>

            {/* Antrasit Tasarımlı Onay Modalı */}
            <PriceChangeUpdateConfirmationModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleConfirmSave}
                changesList={pendingChanges}
            />
        </div>
    );
}

export default IscilikMaliyetleri;