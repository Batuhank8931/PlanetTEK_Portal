import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";
import AlertModal from "../modals/AlertModal";

function Filtration() {
    // --- 1. STATE YÖNETİMLERİ (4 Ayrı Tablo ve Katsayılar) ---
    const [activeTableId, setActiveTableId] = useState(null);
    const [equipments, setEquipments] = useState([]);
    const [feedPumps, setFeedPumps] = useState([]);
    const [backwashPumps, setBackwashPumps] = useState([]);
    const [onKlorlama, setOnKlorlama] = useState([]);
    const [sabitOranlar, setSabitOranlar] = useState([]);

    // Orijinal Veriler (Fark Ayrıştırma Altyapısı İçin)
    const [originals, setOriginals] = useState({
        equipments: [],
        feedPumps: [],
        backwashPumps: [],
        onKlorlama: [],
        oranData: []
    });

    // 🌟 AlertModal kontrolü için state
    const [alertConfig, setAlertConfig] = useState({
        show: false,
        title: "",
        message: "",
        type: "success",
        showCancel: false, // İptal butonu olsun mu?
        action: null       // "Evet" denirse ne çalışsın?
    });

    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [pendingChanges, setPendingChanges] = useState([]);

    // --- 2. GRID ŞEMALARI VE BAŞLIKLARI ---
    const oranHeaders = ["Yurt İçi Satış Oranı (Yİ)", "Yurt Dışı Satış Oranı (YD)"];
    const oranFields = ["yi_oran", "yd_oran"];

    // A. Filtrasyon Kalemleri (Seperatör, Kum, Karbon Gövdeleri)
    const equipHeaders = ["Sistem Debisi (m³/h)", "Ekipman Tipi", "Alış Fiyatı (€)", "Satış Yİ (€)", "Satış YD (€)"];
    const equipFields = ["debi", "ekipman_tipi", "alis_fiyat", "satis_yi", "satis_yd"];

    // B. Besleme Pompası
    const feedHeaders = ["Sistem Debisi (m³/h)", "Motor Gücü (kW)", "Alış Fiyatı (€)", "Satış Yİ (€)", "Satış YD (€)"];
    const feedFields = ["debi", "kw", "alis_fiyat", "satis_yi", "satis_yd"];

    // C. Geri Yıkama Pompası
    const backwashHeaders = ["Geri Yıkama Debisi (m³/h)", "Motor Gücü (kW)", "Alış Fiyatı (€)", "Satış Yİ (€)", "Satış YD (€)"];
    const backwashFields = ["geri_yikama_debi", "kw", "alis_fiyat", "satis_yi", "satis_yd"];

    // D. Ön Klorlama Sistemi
    const klorlamaHeaders = ["Ekipman Adı", "Ekipman Tipi", "Motor Gücü (kW)", "Alış Fiyatı (€)", "Satış Yİ (€)", "Satış YD (€)"];
    const klorlamaFields = ["ekipman_adi", "ekipman_tipi", "kw", "alis_fiyati", "yi_satis", "yd_satis"];

    // --- 3. DATA FETCH ---
    const fetchAllPriceData = async () => {
        try {
            setLoading(true);
            const response = await API.getFiltrationCosts();
            const { filtrationEquipments, feedPumps, backwashPumps, onKlorlamaEquipments } = response.data || {};

            setEquipments(JSON.parse(JSON.stringify(filtrationEquipments || [])));
            setFeedPumps(JSON.parse(JSON.stringify(feedPumps || [])));
            setBackwashPumps(JSON.parse(JSON.stringify(backwashPumps || [])));
            setOnKlorlama(JSON.parse(JSON.stringify(onKlorlamaEquipments || [])));

            const refRow = filtrationEquipments?.[0] || onKlorlamaEquipments?.[0] || {};
            const ilkOranlar = [{
                id: "sabit_katsayi",
                yi_oran: refRow.yi_oran || refRow.yi_katsayi,
                yd_oran: refRow.yd_oran || refRow.yd_katsayi
            }];
            setSabitOranlar(ilkOranlar);

            setOriginals({
                equipments: JSON.parse(JSON.stringify(filtrationEquipments || [])),
                feedPumps: JSON.parse(JSON.stringify(feedPumps || [])),
                backwashPumps: JSON.parse(JSON.stringify(backwashPumps || [])),
                onKlorlama: JSON.parse(JSON.stringify(onKlorlamaEquipments || [])),
                oranData: JSON.parse(JSON.stringify(ilkOranlar))
            });

        } catch (error) {
            console.error("Fiyat listeleri yüklenirken hata:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllPriceData();
    }, []);

    // --- 4. SİMÜLASYON MOTORLARI ---
    const recalculateRowSales = (item, yiOran, ydOran, isKlorlama = false) => {
        const alisKey = isKlorlama ? "alis_fiyati" : "alis_fiyat";
        const yiKey = isKlorlama ? "yi_satis" : "satis_yi";
        const ydKey = isKlorlama ? "yd_satis" : "satis_yd";

        const alis = Number(item[alisKey]) || 0;
        return {
            ...item,
            [yiKey]: (alis * yiOran).toFixed(2),
            [ydKey]: (alis * ydOran).toFixed(2)
        };
    };

    const handleEquipChange = (newData) => {
        const currentOran = sabitOranlar[0];
        const resolved = typeof newData === "function" ? newData(equipments) : newData;
        setEquipments(resolved.map(item => recalculateRowSales(item, Number(currentOran.yi_oran), Number(currentOran.yd_oran))));
    };

    const handleFeedChange = (newData) => {
        const currentOran = sabitOranlar[0];
        const resolved = typeof newData === "function" ? newData(feedPumps) : newData;
        setFeedPumps(resolved.map(item => recalculateRowSales(item, Number(currentOran.yi_oran), Number(currentOran.yd_oran))));
    };

    const handleBackwashChange = (newData) => {
        const currentOran = sabitOranlar[0];
        const resolved = typeof newData === "function" ? newData(backwashPumps) : newData;
        setBackwashPumps(resolved.map(item => recalculateRowSales(item, Number(currentOran.yi_oran), Number(currentOran.yd_oran))));
    };

    const handleKlorlamaChange = (newData) => {
        const currentOran = sabitOranlar[0];
        const resolved = typeof newData === "function" ? newData(onKlorlama) : newData;
        setOnKlorlama(resolved.map(item => recalculateRowSales(item, Number(currentOran.yi_oran), Number(currentOran.yd_oran), true)));
    };

    const handleOranDataChange = (newOranData) => {
        const resolved = typeof newOranData === "function" ? newOranData(sabitOranlar) : newOranData;
        setSabitOranlar(resolved);
        const yi = Number(resolved[0]?.yi_oran) || 1.30;
        const yd = Number(resolved[0]?.yd_oran) || 1.45;

        setEquipments(prev => prev.map(item => recalculateRowSales(item, yi, yd)));
        setFeedPumps(prev => prev.map(item => recalculateRowSales(item, yi, yd)));
        setBackwashPumps(prev => prev.map(item => recalculateRowSales(item, yi, yd)));
        setOnKlorlama(prev => prev.map(item => recalculateRowSales(item, yi, yd, true)));
    };

    // --- 5. SATIR EKLEME ACTIONLARI ---
    const addNewEquipmentRow = () => {
        setEquipments(p => [...p, { id: `new_eq_${Date.now()}`, debi: 0, ekipman_tipi: "Kum Filtresi", alis_fiyat: 0, satis_yi: 0, satis_yd: 0, isNew: true }]);
    };
    const addNewFeedRow = () => {
        setFeedPumps(p => [...p, { id: `new_fd_${Date.now()}`, debi: 0, kw: 0, alis_fiyat: 0, satis_yi: 0, satis_yd: 0, isNew: true }]);
    };
    const addNewBackwashRow = () => {
        setBackwashPumps(p => [...p, { id: `new_bw_${Date.now()}`, geri_yikama_debi: 0, kw: 0, alis_fiyat: 0, satis_yi: 0, satis_yd: 0, isNew: true }]);
    };
    const addNewKlorlamaRow = () => {
        setOnKlorlama(p => [...p, { id: `new_kl_${Date.now()}`, ekipman_adi: "", ekipman_tipi: "pompa", kw: 0, alis_fiyati: 0, yi_satis: 0, yd_satis: 0, isNew: true }]);
    };

    // --- 6. GÜVENLİ SAVE MOTORU ---
    // --- 6. GÜVENLİ SAVE MOTORU (Sanal Kolon Filtreli Hali) ---
    const checkTableChanges = (currentList, originalList, tableName, labelField, textFields) => {
        const changes = [];

        // 🌟 ES PAS GEÇİLECEK SANAL / GENERATED KOLONLAR LİSTESİ
        const sanalKolonlar = ["satis_yi", "satis_yd", "yi_satis", "yd_satis"];

        currentList.forEach(item => {
            // DELETE (Aynen kalıyor)
            if (item.isDeleted) {
                if (String(item.id).startsWith("new_")) return;
                changes.push({ type: "DELETE", tableName, id: item.id, columnName: "id", newValue: null, rowName: `${item[labelField]}`, oldValue: 0 });
                return;
            }

            // INSERT (Sanal kolonları temizleyerek ekliyoruz)
            if (String(item.id).startsWith("new_")) {
                const triggerField = textFields[0];
                const additional = { ...item };

                // Güvenlik: Yeni satır eklerken de sanal kolonları payload'dan ayıklıyoruz
                delete additional.id; delete additional.isNew; delete additional.isDeleted;
                delete additional[triggerField];
                sanalKolonlar.forEach(sk => delete additional[sk]);

                changes.push({
                    type: "INSERT", tableName, id: undefined, columnName: triggerField, newValue: textFields.includes(triggerField) ? item[triggerField] : Number(item[triggerField]),
                    rowName: `${item[labelField]}`, oldValue: 0, additionalData: additional
                });
                return;
            }

            // UPDATE
            const orig = originalList.find(o => String(o.id) === String(item.id));
            if (orig) {
                Object.keys(item).forEach(field => {
                    if (field === "id" || field === "isNew" || field === "isDeleted" || field === "created_at" || field === "updated_at") return;

                    // 🌟 KRİTİK FİLTRE: Eğer alan sanal bir kolonsa fark takibine sokma, pas geç!
                    if (sanalKolonlar.includes(field)) return;

                    const isText = textFields.includes(field);
                    const esitMi = isText ? String(orig[field] || "").trim() === String(item[field] || "").trim() : Number(orig[field] || 0) === Number(item[field] || 0);

                    if (!esitMi) {
                        changes.push({ type: "UPDATE", tableName, id: orig.id, columnName: field, newValue: isText ? item[field] : Number(item[field]), rowName: `${item[labelField]}`, oldValue: orig[field] || 0 });
                    }
                });
            }
        });
        return changes;
    };

    const handleSaveClick = () => {
        let allChanges = [];

        allChanges = allChanges.concat(checkTableChanges(equipments, originals.equipments, "filtration_equipments", "debi", ["ekipman_tipi"]));
        allChanges = allChanges.concat(checkTableChanges(feedPumps, originals.feedPumps, "filtration_feed_pumps", "debi", []));
        allChanges = allChanges.concat(checkTableChanges(backwashPumps, originals.backwashPumps, "filtration_backwash_pumps", "geri_yikama_debi", []));
        allChanges = allChanges.concat(checkTableChanges(onKlorlama, originals.onKlorlama, "on_klorlama_ekipmanlari", "ekipman_adi", ["ekipman_adi", "ekipman_tipi"]));

        // Oran kontrolü (Global katsayı değişim takibi)
        const currentOran = sabitOranlar[0] || {};
        const origOran = originals.oranData[0] || {};
        const targets = [
            { field: "yi_oran", dbCol: "yi_oran", label: "Yurt İçi Oranı", tName: "filtration_equipments" },
            { field: "yd_oran", dbCol: "yd_oran", label: "Yurt Dışı Oranı", tName: "filtration_equipments" }
        ];

        targets.forEach(t => {
            if (parseFloat(currentOran[t.field] || 0).toFixed(2) !== parseFloat(origOran[t.field] || 0).toFixed(2)) {
                allChanges.push({ type: "UPDATE", tableName: t.tName, id: equipments[0]?.id || 1, columnName: t.dbCol, newValue: Number(currentOran[t.field]), rowName: `Global Ayar (${t.label})`, oldValue: Number(origOran[t.field]) });
            }
        });

        if (allChanges.length === 0) {
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
        setPendingChanges(allChanges);
        setShowModal(true);
    };

    const handleConfirmSave = async () => {
        setShowModal(false);
        setLoading(true);
        try {
            if (pendingChanges.length === 0) return;

            // Değişiklikleri tablolara göre gruplayarak paralel API.updatePriceData çağrıları yapıyoruz
            const tableGroups = pendingChanges.reduce((acc, change) => {
                if (!acc[change.tableName]) acc[change.tableName] = [];
                acc[change.tableName].push({
                    id: change.id,
                    columnName: change.columnName,
                    newValue: change.newValue,
                    additionalData: change.additionalData || undefined
                });
                return acc;
            }, {});

            await Promise.all(
                Object.entries(tableGroups).map(([tName, updatesPayload]) =>
                    API.updatePriceData({ tableName: tName, updates: updatesPayload })
                )
            );

            await fetchAllPriceData();
            setPendingChanges([]);
        } catch (err) {
            console.error(err);
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
                <div className="spinner-border text-success" role="status"><span className="visually-hidden">Yükleniyor...</span></div>
            </div>
        );
    }

    return (
        <div>
            {/* ÜST PANEL */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center" style={{ color: "#94a3b8" }}>
                    <i className="bi bi-gear-fill me-2 text-success" style={{ fontSize: "18px" }}></i>
                    <span className="fw-semibold small fs-6">Filtrasyon & Klorlama Sistemleri Fiyat Yönetimi</span>
                </div>

                <button className="btn btn-success btn-sm px-4" onClick={handleSaveClick}>
                    <i className="bi bi-file-earmark-excel me-2"></i>Değişiklikleri Kaydet
                </button>
            </div>

            {/* ORAN KATTSAYILARI */}
            <div className="mb-4">
                <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
                    <i className="bi bi-sliders me-2 text-success"></i>
                    <span className="fw-semibold small">Oran Katsayıları</span>
                </div>
                <div className="row">
                    <div className="col-12 col-md-5">
                        <ExcelGrid
                            tableId="filtrationoranHeaders"
                            activeTableId={activeTableId}
                            setActiveTableId={setActiveTableId}
                            headers={oranHeaders} data={sabitOranlar} fields={oranFields} onDataChange={handleOranDataChange} />
                    </div>
                </div>
            </div>

            {/* 📊 TABLO 1: FİLTRASYON GÖVDE KALEMLERİ */}
            <div className="mb-4">
                <div className="mb-2 d-flex align-items-center justify-content-between w-100" style={{ color: "#94a3b8" }}>
                    <div className="d-flex align-items-center fw-bold small text-primary">
                        <i className="bi bi-droplet-half me-2"></i>
                        <span>1. Filtrasyon Gövde Kalemleri (Seperatör / Kum / Karbon)</span>
                    </div>
                    <button className="btn btn-outline-primary btn-xs px-2 py-0.5" style={{ fontSize: '10px' }} onClick={addNewEquipmentRow}>
                        + Data Ekle
                    </button>
                </div>
                <ExcelGrid
                    tableId="filtrationequipments"
                    activeTableId={activeTableId}
                    setActiveTableId={setActiveTableId}
                    headers={equipHeaders} data={equipments.filter(i => !i.isDeleted)} fields={equipFields} onDataChange={handleEquipChange} isMainTable={true} />
            </div>

            {/* 📊 TABLO 2: BESLEME POMPALARI */}
            <div className="mb-4">
                <div className="mb-2 d-flex align-items-center justify-content-between w-100" style={{ color: "#94a3b8" }}>
                    <div className="d-flex align-items-center fw-bold small text-success">
                        <i className="bi bi-lightning-charge me-2"></i>
                        <span>2. Hidrofor / Besleme Pompaları</span>
                    </div>
                    <button className="btn btn-outline-success btn-xs px-2 py-0.5" style={{ fontSize: '10px' }} onClick={addNewFeedRow}>
                        + Data Ekle
                    </button>
                </div>
                <ExcelGrid
                    tableId="filtrationfeedPumps"
                    activeTableId={activeTableId}
                    setActiveTableId={setActiveTableId}
                    headers={feedHeaders} data={feedPumps.filter(i => !i.isDeleted)} fields={feedFields} onDataChange={handleFeedChange} isMainTable={true} />
            </div>

            {/* 📊 TABLO 3: GERİ YIKAMA POMPALARI */}
            <div className="mb-4">
                <div className="mb-2 d-flex align-items-center justify-content-between w-100" style={{ color: "#94a3b8" }}>
                    <div className="d-flex align-items-center fw-bold small text-info">
                        <i className="bi bi-arrow-left-right me-2"></i>
                        <span>3. Geri Yıkama Pompaları</span>
                    </div>
                    <button className="btn btn-outline-info btn-xs px-2 py-0.5" style={{ fontSize: '10px' }} onClick={addNewBackwashRow}>
                        + Data Ekle
                    </button>
                </div>
                <ExcelGrid
                    tableId="filtrationbackwashPumps"
                    activeTableId={activeTableId}
                    setActiveTableId={setActiveTableId}

                    headers={backwashHeaders} data={backwashPumps.filter(i => !i.isDeleted)} fields={backwashFields} onDataChange={handleBackwashChange} isMainTable={true} />
            </div>

            {/* 📊 TABLO 4: ÖN KLORLAMA SİSTEMİ */}
            <div className="mb-4">
                <div className="mb-2 d-flex align-items-center justify-content-between w-100" style={{ color: "#94a3b8" }}>
                    <div className="d-flex align-items-center fw-bold small text-warning">
                        <i className="bi bi-shield-check me-2 " style={{ color: "#ffc107" }}></i>
                        <span style={{ color: "#ffc107" }}>4. Ön Klorlama & Dozaj Sistemleri</span>
                    </div>
                    <button className="btn btn-outline-warning btn-xs px-2 py-0.5" style={{ fontSize: '10px' }} onClick={addNewKlorlamaRow}>
                        + Data Ekle
                    </button>
                </div>
                <ExcelGrid
                    tableId="filtrationonKlorlama"
                    activeTableId={activeTableId}
                    setActiveTableId={setActiveTableId}
                    headers={klorlamaHeaders} data={onKlorlama.filter(i => !i.isDeleted)} fields={klorlamaFields} onDataChange={handleKlorlamaChange} isMainTable={true} />
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

export default Filtration;