import React, { useState, useEffect } from "react";
import ExcelGrid from "./ExcelGrid";
import API from "../../utils/utilRequest";
import PriceChangeUpdateConfirmationModal from "../modals/PriceChangeUpdateConfirmationModal";
import AlertModal from "../modals/AlertModal";

function Membran() {
  const [activeTableId, setActiveTableId] = useState(null);
  // --- 1. STATE YÖNETİMLERİ (8 Ayrı Membran Tablosu ve Katsayılar) ---
  const [cassettes, setCassettes] = useState([]);
  const [feedPumps, setFeedPumps] = useState([]);
  const [recircPumps, setRecircPumps] = useState([]);
  const [naoclPumps, setNaoclPumps] = useState([]);
  const [naoclTanks, setNaoclTanks] = useState([]);
  const [citricPumps, setCitricPumps] = useState([]);
  const [citricTanks, setCitricTanks] = useState([]);
  const [blowers, setBlowers] = useState([]);
  const [sabitOranlar, setSabitOranlar] = useState([]);

  // Orijinal Veriler (Fark Ayrıştırma Altyapısı İçin)
  const [originals, setOriginals] = useState({
    cassettes: [],
    feedPumps: [],
    recircPumps: [],
    naoclPumps: [],
    naoclTanks: [],
    citricPumps: [],
    citricTanks: [],
    blowers: [],
    oranData: []
  });

  // Modal ve Alert Durumları
  const [alertConfig, setAlertConfig] = useState({ show: false, title: "", message: "", type: "success" });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);

  // --- 2. GRID ŞEMALARI VE BAŞLIKLARI ---
  const oranHeaders = ["Yurt İçi Satış Oranı (Yİ)", "Yurt Dışı Satış Oranı (YD)"];
  const oranFields = ["yi_oran", "yd_oran"];

  // A. Membran Kasetleri
  const cassetteHeaders = ["Genel Kapasite (m³/gün)", "Membran Alanı (m²)", "Kaset Adedi", "Kaset Boyutları (WxLxH)", "Alış Fiyatı ($)", "Satış Yİ ($)", "Satış YD ($)"];
  const cassetteFields = ["general_capacity", "alan", "adet", "boyutlar", "alis_fiyat", "satis_yi", "satis_yd"];

  // B. Besleme Pompaları
  const feedHeaders = ["Genel Kapasite (m³/gün)", "Pompa Debisi (m³/h)", "Motor Gücü (kW)", "Alış Fiyatı (€)", "Satış Yİ (€)", "Satış YD (€)"];
  const feedFields = ["general_capacity", "debi", "kw", "alis_fiyat", "satis_yi", "satis_yd"];

  // C. Geri Devir Pompaları
  const recircHeaders = ["Genel Kapasite (m³/gün)", "Geri Devir Debisi (m³/h)", "Motor Gücü (kW)", "Alış Fiyatı (€)", "Satış Yİ (€)", "Satış YD (€)"];
  const recircFields = ["general_capacity", "debi", "kw", "alis_fiyat", "satis_yi", "satis_yd"];

  // D. NaOCl Dozaj Pompaları
  const naoclPumpHeaders = ["Genel Kapasite (m³/gün)", "Dozaj Debisi (L/h)", "Motor Gücü (kW)", "Alış Fiyatı (€)", "Satış Yİ (€)", "Satış YD (€)"];
  const naoclPumpFields = ["general_capacity", "debi", "kw", "alis_fiyat", "satis_yi", "satis_yd"];

  // E. NaOCl Dozaj Tankları
  const naoclTankHeaders = ["Genel Kapasite (m³/gün)", "Tank Kapasitesi (L)", "Malzeme", "Alış Fiyatı (€)", "Satış Yİ (€)", "Satış YD (€)"];
  const naoclTankFields = ["general_capacity", "kapasite", "malzeme", "alis_fiyat", "satis_yi", "satis_yd"];

  // F. Sitrik Asit Dozaj Pompaları
  const citricPumpHeaders = ["Genel Kapasite (m³/gün)", "Dozaj Debisi (L/h)", "Motor Gücü (kW)", "Alış Fiyatı (€)", "Satış Yİ (€)", "Satış YD (€)"];
  const citricPumpFields = ["general_capacity", "debi", "kw", "alis_fiyat", "satis_yi", "satis_yd"];

  // G. Sitrik Asit Dozaj Tankları
  const citricTankHeaders = ["Genel Kapasite (m³/gün)", "Tank Kapasitesi (L)", "Malzeme", "Alış Fiyatı (€)", "Satış Yİ (€)", "Satış YD (€)"];
  const citricTankFields = ["general_capacity", "kapasite", "malzeme", "alis_fiyat", "satis_yi", "satis_yd"];

  // H. Blowerlar
  const blowerHeaders = ["Genel Kapasite (m³/gün)", "Blower Debisi (Nm³/h)", "Motor Gücü (kW)", "Alış Fiyatı (€)", "Satış Yİ (€)", "Satış YD (€)"];
  const blowerFields = ["general_capacity", "kapasite_nm3h", "kw", "alis_fiyat", "satis_yi", "satis_yd"];

  // --- 3. DATA FETCH ---
  const fetchAllMembraneData = async () => {
    try {
      setLoading(true);
      const response = await API.getMembraneCosts();
      const {
        membraneCassettes, feedPumps, recirculationPumps,
        naoclDosingPumps, naoclDosingTanks, citricDosingPumps,
        citricDosingTanks, blowers
      } = response.data || {};

      setCassettes(JSON.parse(JSON.stringify(membraneCassettes || [])));
      setFeedPumps(JSON.parse(JSON.stringify(feedPumps || [])));
      setRecircPumps(JSON.parse(JSON.stringify(recirculationPumps || [])));
      setNaoclPumps(JSON.parse(JSON.stringify(naoclDosingPumps || [])));
      setNaoclTanks(JSON.parse(JSON.stringify(naoclDosingTanks || [])));
      setCitricPumps(JSON.parse(JSON.stringify(citricDosingPumps || [])));
      setCitricTanks(JSON.parse(JSON.stringify(citricDosingTanks || [])));
      setBlowers(JSON.parse(JSON.stringify(blowers || [])));

      // Oran referans satırını yakala
      const refRow = membraneCassettes?.[0] || feedPumps?.[0] || {};
      const ilkOranlar = [{
        id: "sabit_katsayi",
        yi_oran: refRow.yi_oran || 1.30,
        yd_oran: refRow.yd_oran || 1.45
      }];
      setSabitOranlar(ilkOranlar);

      setOriginals({
        cassettes: JSON.parse(JSON.stringify(membraneCassettes || [])),
        feedPumps: JSON.parse(JSON.stringify(feedPumps || [])),
        recircPumps: JSON.parse(JSON.stringify(recirculationPumps || [])),
        naoclPumps: JSON.parse(JSON.stringify(naoclDosingPumps || [])),
        naoclTanks: JSON.parse(JSON.stringify(naoclDosingTanks || [])),
        citricPumps: JSON.parse(JSON.stringify(citricDosingPumps || [])),
        citricTanks: JSON.parse(JSON.stringify(citricDosingTanks || [])),
        blowers: JSON.parse(JSON.stringify(blowers || [])),
        oranData: JSON.parse(JSON.stringify(ilkOranlar))
      });

    } catch (error) {
      console.error("Membran fiyat listeleri yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMembraneData();
  }, []);

  // --- 4. SİMÜLASYON MOTORLARI ---
  const recalculateRowSales = (item, yiOran, ydOran) => {
    const alis = Number(item.alis_fiyat) || 0;
    return {
      ...item,
      satis_yi: (alis * yiOran).toFixed(2),
      satis_yd: (alis * ydOran).toFixed(2)
    };
  };

  const handleCassetteChange = (newData) => {
    const currentOran = sabitOranlar[0];
    const resolved = typeof newData === "function" ? newData(cassettes) : newData;
    setCassettes(resolved.map(item => recalculateRowSales(item, Number(currentOran.yi_oran), Number(currentOran.yd_oran))));
  };

  const handleFeedChange = (newData) => {
    const currentOran = sabitOranlar[0];
    const resolved = typeof newData === "function" ? newData(feedPumps) : newData;
    setFeedPumps(resolved.map(item => recalculateRowSales(item, Number(currentOran.yi_oran), Number(currentOran.yd_oran))));
  };

  const handleRecircChange = (newData) => {
    const currentOran = sabitOranlar[0];
    const resolved = typeof newData === "function" ? newData(recircPumps) : newData;
    setRecircPumps(resolved.map(item => recalculateRowSales(item, Number(currentOran.yi_oran), Number(currentOran.yd_oran))));
  };

  const handleNaoclPumpChange = (newData) => {
    const currentOran = sabitOranlar[0];
    const resolved = typeof newData === "function" ? newData(naoclPumps) : newData;
    setNaoclPumps(resolved.map(item => recalculateRowSales(item, Number(currentOran.yi_oran), Number(currentOran.yd_oran))));
  };

  const handleNaoclTankChange = (newData) => {
    const currentOran = sabitOranlar[0];
    const resolved = typeof newData === "function" ? newData(naoclTanks) : newData;
    setNaoclTanks(resolved.map(item => recalculateRowSales(item, Number(currentOran.yi_oran), Number(currentOran.yd_oran))));
  };

  const handleCitricPumpChange = (newData) => {
    const currentOran = sabitOranlar[0];
    const resolved = typeof newData === "function" ? newData(citricPumps) : newData;
    setCitricPumps(resolved.map(item => recalculateRowSales(item, Number(currentOran.yi_oran), Number(currentOran.yd_oran))));
  };

  const handleCitricTankChange = (newData) => {
    const currentOran = sabitOranlar[0];
    const resolved = typeof newData === "function" ? newData(citricTanks) : newData;
    setCitricTanks(resolved.map(item => recalculateRowSales(item, Number(currentOran.yi_oran), Number(currentOran.yd_oran))));
  };

  const handleBlowerChange = (newData) => {
    const currentOran = sabitOranlar[0];
    const resolved = typeof newData === "function" ? newData(blowers) : newData;
    setBlowers(resolved.map(item => recalculateRowSales(item, Number(currentOran.yi_oran), Number(currentOran.yd_oran))));
  };

  const handleOranDataChange = (newOranData) => {
    const resolved = typeof newOranData === "function" ? newOranData(sabitOranlar) : newOranData;
    setSabitOranlar(resolved);
    const yi = Number(resolved[0]?.yi_oran) || 1.30;
    const yd = Number(resolved[0]?.yd_oran) || 1.45;

    setCassettes(prev => prev.map(item => recalculateRowSales(item, yi, yd)));
    setFeedPumps(prev => prev.map(item => recalculateRowSales(item, yi, yd)));
    setRecircPumps(prev => prev.map(item => recalculateRowSales(item, yi, yd)));
    setNaoclPumps(prev => prev.map(item => recalculateRowSales(item, yi, yd)));
    setNaoclTanks(prev => prev.map(item => recalculateRowSales(item, yi, yd)));
    setCitricPumps(prev => prev.map(item => recalculateRowSales(item, yi, yd)));
    setCitricTanks(prev => prev.map(item => recalculateRowSales(item, yi, yd)));
    setBlowers(prev => prev.map(item => recalculateRowSales(item, yi, yd)));
  };

  // --- 5. SATIR EKLEME ACTIONLARI ---
  const addNewCassetteRow = () => setCassettes(p => [...p, { id: `new_cs_${Date.now()}`, general_capacity: 0, alan: 0, adet: 1, boyutlar: "", alis_fiyat: 0, satis_yi: 0, satis_yd: 0, isNew: true }]);
  const addNewFeedRow = () => setFeedPumps(p => [...p, { id: `new_fd_${Date.now()}`, general_capacity: 0, debi: 0, kw: 0, alis_fiyat: 0, satis_yi: 0, satis_yd: 0, isNew: true }]);
  const addNewRecircRow = () => setRecircPumps(p => [...p, { id: `new_rc_${Date.now()}`, general_capacity: 0, debi: 0, kw: 0, alis_fiyat: 0, satis_yi: 0, satis_yd: 0, isNew: true }]);
  const addNewNaoclPumpRow = () => setNaoclPumps(p => [...p, { id: `new_np_${Date.now()}`, general_capacity: 0, debi: 0, kw: 0, alis_fiyat: 0, satis_yi: 0, satis_yd: 0, isNew: true }]);
  const addNewNaoclTankRow = () => setNaoclTanks(p => [...p, { id: `new_nt_${Date.now()}`, general_capacity: 0, kapasite: 0, malzeme: "PE", alis_fiyat: 0, satis_yi: 0, satis_yd: 0, isNew: true }]);
  const addNewCitricPumpRow = () => setCitricPumps(p => [...p, { id: `new_cp_${Date.now()}`, general_capacity: 0, debi: 0, kw: 0, alis_fiyat: 0, satis_yi: 0, satis_yd: 0, isNew: true }]);
  const addNewCitricTankRow = () => setCitricTanks(p => [...p, { id: `new_ct_${Date.now()}`, general_capacity: 0, kapasite: 0, malzeme: "PE", alis_fiyat: 0, satis_yi: 0, satis_yd: 0, isNew: true }]);
  const addNewBlowerRow = () => setBlowers(p => [...p, { id: `new_bl_${Date.now()}`, general_capacity: 0, kapasite_nm3h: 0, kw: 0, alis_fiyat: 0, satis_yi: 0, satis_yd: 0, isNew: true }]);

  // --- 6. GÜVENLİ SAVE MOTORU ---
  const checkTableChanges = (currentList, originalList, tableName, labelField, textFields) => {
    const changes = [];
    const sanalKolonlar = ["satis_yi", "satis_yd"];

    currentList.forEach(item => {
      // SİLME
      if (item.isDeleted) {
        if (String(item.id).startsWith("new_")) return;
        changes.push({ type: "DELETE", tableName, id: item.id, columnName: "id", newValue: null, rowName: `Kapasite: ${item.general_capacity}m³ - ${item[labelField] || 'Ekipman'}`, oldValue: 0 });
        return;
      }

      // EKLEME
      if (String(item.id).startsWith("new_")) {
        const triggerField = textFields[0] || "general_capacity";
        const additional = { ...item };

        delete additional.id; delete additional.isNew; delete additional.isDeleted;
        delete additional[triggerField];
        sanalKolonlar.forEach(sk => delete additional[sk]);

        changes.push({
          type: "INSERT", tableName, id: undefined, columnName: triggerField, newValue: textFields.includes(triggerField) ? item[triggerField] : Number(item[triggerField]),
          rowName: `Kapasite: ${item.general_capacity}m³`, oldValue: 0, additionalData: additional
        });
        return;
      }

      // GÜNCELLEME
      const orig = originalList.find(o => String(o.id) === String(item.id));
      if (orig) {
        Object.keys(item).forEach(field => {
          if (field === "id" || field === "isNew" || field === "isDeleted" || field === "created_at" || field === "updated_at") return;
          if (sanalKolonlar.includes(field)) return;

          const isText = textFields.includes(field);
          const esitMi = isText ? String(orig[field] || "").trim() === String(item[field] || "").trim() : Number(orig[field] || 0) === Number(item[field] || 0);

          if (!esitMi) {
            changes.push({ type: "UPDATE", tableName, id: orig.id, columnName: field, newValue: isText ? item[field] : Number(item[field]), rowName: `Kapasite: ${item.general_capacity}m³ (${field})`, oldValue: orig[field] || 0 });
          }
        });
      }
    });
    return changes;
  };

  const handleSaveClick = () => {
    let allChanges = [];

    allChanges = allChanges.concat(checkTableChanges(cassettes, originals.cassettes, "membrane_cassettes", "alan", ["boyutlar"]));
    allChanges = allChanges.concat(checkTableChanges(feedPumps, originals.feedPumps, "membrane_feed_pumps", "debi", []));
    allChanges = allChanges.concat(checkTableChanges(recircPumps, originals.recircPumps, "membrane_recirculation_pumps", "debi", []));
    allChanges = allChanges.concat(checkTableChanges(naoclPumps, originals.naoclPumps, "membrane_naocl_dosing_pumps", "debi", []));
    allChanges = allChanges.concat(checkTableChanges(naoclTanks, originals.naoclTanks, "membrane_naocl_dosing_tanks", "kapasite", ["malzeme"]));
    allChanges = allChanges.concat(checkTableChanges(citricPumps, originals.citricPumps, "membrane_citric_dosing_pumps", "debi", []));
    allChanges = allChanges.concat(checkTableChanges(citricTanks, originals.citricTanks, "membrane_citric_dosing_tanks", "kapasite", ["malzeme"]));
    allChanges = allChanges.concat(checkTableChanges(blowers, originals.blowers, "membrane_blowers", "kapasite_nm3h", []));

    // Global Oran Fark Takibi
    const currentOran = sabitOranlar[0] || {};
    const origOran = originals.oranData[0] || {};
    if (parseFloat(currentOran.yi_oran || 0).toFixed(2) !== parseFloat(origOran.yi_oran || 0).toFixed(2)) {
      allChanges.push({ type: "UPDATE", tableName: "membrane_cassettes", id: cassettes[0]?.id || 1, columnName: "yi_oran", newValue: Number(currentOran.yi_oran), rowName: "Global Ayar (Yurt İçi Oranı)", oldValue: Number(origOran.yi_oran) });
    }
    if (parseFloat(currentOran.yd_oran || 0).toFixed(2) !== parseFloat(origOran.yd_oran || 0).toFixed(2)) {
      allChanges.push({ type: "UPDATE", tableName: "membrane_cassettes", id: cassettes[0]?.id || 1, columnName: "yd_oran", newValue: Number(currentOran.yd_oran), rowName: "Global Ayar (Yurt Dışı Oranı)", oldValue: Number(origOran.yd_oran) });
    }

    if (allChanges.length === 0) {
      setAlertConfig({ show: true, title: "Uyarı", message: "Değişen bir veri bulunamadı.", type: "warning" });
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

      await fetchAllMembraneData();
      setPendingChanges([]);
    } catch (err) {
      console.error(err);
      setAlertConfig({ show: true, title: "Hata", message: "Veriler kaydedilirken teknik bir hata meydana geldi.", type: "error" });
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
        <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
          <i className="bi bi-layers-half me-2 text-success"></i>
          <span className="fw-semibold small fs-6">MBR Sistem Ekipman Fiyat Yönetimi</span>
        </div>
        <button className="btn btn-success btn-sm px-4" onClick={handleSaveClick}>
          <i className="bi bi-file-earmark-excel me-2"></i>Değişiklikleri Kaydet
        </button>
      </div>

      {/* ORAN KATSAYILARI */}
      <div className="mb-4">
        <div className="mb-2 d-flex align-items-center" style={{ color: "#94a3b8" }}>
          <i className="bi bi-sliders me-2 text-success"></i>
          <span className="fw-semibold small">Global Oran Katsayıları</span>
        </div>
        <div className="row">
          <div className="col-12 col-md-5">
            <ExcelGrid
              tableId="global_oran"
              activeTableId={activeTableId}
              setActiveTableId={setActiveTableId}
              headers={oranHeaders}
              data={sabitOranlar}
              fields={oranFields}
              onDataChange={handleOranDataChange}
            />
          </div>
        </div>
      </div>

      {/* 📊 TABLO 1: MEMBRAN KASETLERİ */}
      <div className="mb-4">
        <div className="mb-2 d-flex align-items-center justify-content-between w-100" style={{ color: "#94a3b8" }}>
          <div className="d-flex align-items-center fw-bold small text-primary">
            <i className="bi bi-layers-half me-2"></i>
            <span>1. Membran Kasetleri (Kaset Modül Listesi)</span>
          </div>
          <button className="btn btn-outline-primary btn-xs px-2 py-0.5" style={{ fontSize: '10px' }} onClick={addNewCassetteRow}>
            + Data Ekle
          </button>
        </div>
        <ExcelGrid
          tableId="cassettes"
          activeTableId={activeTableId}
          setActiveTableId={setActiveTableId}
          headers={cassetteHeaders}
          data={cassettes.filter(i => !i.isDeleted)}
          fields={cassetteFields}
          onDataChange={handleCassetteChange}
          isMainTable={true}
        />
      </div>

      {/* 📊 TABLO 2: BESLEME POMPALARI */}
      <div className="mb-4">
        <div className="mb-2 d-flex align-items-center justify-content-between w-100" style={{ color: "#94a3b8" }}>
          <div className="d-flex align-items-center fw-bold small text-success">
            <i className="bi bi-box-arrow-in-right me-2"></i>
            <span>2. MBR Emiş / Besleme Pompaları</span>
          </div>
          <button className="btn btn-outline-success btn-xs px-2 py-0.5" style={{ fontSize: '10px' }} onClick={addNewFeedRow}>
            + Data Ekle
          </button>
        </div>
        <ExcelGrid
          tableId="feedPumps"
          activeTableId={activeTableId}
          setActiveTableId={setActiveTableId}
          headers={feedHeaders}
          data={feedPumps.filter(i => !i.isDeleted)}
          fields={feedFields}
          onDataChange={handleFeedChange}
          isMainTable={true}
        />
      </div>

      {/* 📊 TABLO 3: GERI DEVİR POMPALARI */}
      <div className="mb-4">
        <div className="mb-2 d-flex align-items-center justify-content-between w-100" style={{ color: "#94a3b8" }}>
          <div className="d-flex align-items-center fw-bold small text-info">
            <i className="bi bi-arrow-repeat me-2"></i>
            <span>3. Geri Devir Pompaları (Membran - Havalandırma)</span>
          </div>
          <button className="btn btn-outline-info btn-xs px-2 py-0.5" style={{ fontSize: '10px' }} onClick={addNewRecircRow}>
            + Data Ekle
          </button>
        </div>
        <ExcelGrid
          tableId="recircPumps"
          activeTableId={activeTableId}
          setActiveTableId={setActiveTableId}
          headers={recircHeaders} data={recircPumps.filter(i => !i.isDeleted)} fields={recircFields} onDataChange={handleRecircChange} isMainTable={true} />
      </div>

      {/* 📊 TABLO 4: NaOCl DOZAJ POMPALARI */}
      <div className="mb-4">
        <div className="mb-2 d-flex align-items-center justify-content-between w-100" style={{ color: "#94a3b8" }}>
          <div className="d-flex align-items-center fw-bold small text-warning">
            <i className="bi bi-droplet-fill me-2" style={{ color: "#ffc107" }}></i>
            <span style={{ color: "#ffc107" }}>4. NaOCl Dozaj Pompaları</span>
          </div>
          <button className="btn btn-outline-warning btn-xs px-2 py-0.5" style={{ fontSize: '10px' }} onClick={addNewNaoclPumpRow}>
            + Data Ekle
          </button>
        </div>
        <ExcelGrid
          tableId="naoclPumps"
          activeTableId={activeTableId}
          setActiveTableId={setActiveTableId}
          headers={naoclPumpHeaders} data={naoclPumps.filter(i => !i.isDeleted)} fields={naoclPumpFields} onDataChange={handleNaoclPumpChange} isMainTable={true} />
      </div>

      {/* 📊 TABLO 5: NaOCl DOZAJ TANKLARI */}
      <div className="mb-4">
        <div className="mb-2 d-flex align-items-center justify-content-between w-100" style={{ color: "#94a3b8" }}>
          <div className="d-flex align-items-center fw-bold small" style={{ color: "#fd7e14" }}>
            <i className="bi bi-moisture me-2"></i>
            <span>5. NaOCl Kimyasal Dozaj Tankları</span>
          </div>
          <button className="btn btn-outline-secondary btn-xs px-2 py-0.5" style={{ fontSize: '10px', color: "#fd7e14", borderColor: "#fd7e14" }} onClick={addNewNaoclTankRow}>
            + Data Ekle
          </button>
        </div>
        <ExcelGrid
          tableId="naoclTanks"
          activeTableId={activeTableId}
          setActiveTableId={setActiveTableId}

          headers={naoclTankHeaders} data={naoclTanks.filter(i => !i.isDeleted)} fields={naoclTankFields} onDataChange={handleNaoclTankChange} isMainTable={true} />
      </div>

      {/* 📊 TABLO 6: SİTRİK ASİT DOZAJ POMPALARI */}
      <div className="mb-4">
        <div className="mb-2 d-flex align-items-center justify-content-between w-100" style={{ color: "#94a3b8" }}>
          <div className="d-flex align-items-center fw-bold small text-danger">
            <i className="bi bi-eyedropper me-2"></i>
            <span>6. Sitrik Asit Dozaj Pompaları</span>
          </div>
          <button className="btn btn-outline-danger btn-xs px-2 py-0.5" style={{ fontSize: '10px' }} onClick={addNewCitricPumpRow}>
            + Data Ekle
          </button>
        </div>
        <ExcelGrid
          tableId="citricPumps"
          activeTableId={activeTableId}
          setActiveTableId={setActiveTableId}

          headers={citricPumpHeaders} data={citricPumps.filter(i => !i.isDeleted)} fields={citricPumpFields} onDataChange={handleCitricPumpChange} isMainTable={true} />
      </div>

      {/* 📊 TABLO 7: SİTRİK ASİT DOZAJ TANKLARI */}
      <div className="mb-4">
        <div className="mb-2 d-flex align-items-center justify-content-between w-100" style={{ color: "#94a3b8" }}>
          <div className="d-flex align-items-center fw-bold small" style={{ color: "#6f42c1" }}>
            <i className="bi bi-bucket-fill me-2"></i>
            <span>7. Sitrik Asit Kimyasal Dozaj Tankları</span>
          </div>
          <button className="btn btn-outline-secondary btn-xs px-2 py-0.5" style={{ fontSize: '10px', color: "#6f42c1", borderColor: "#6f42c1" }} onClick={addNewCitricTankRow}>
            + Data Ekle
          </button>
        </div>
        <ExcelGrid headers={citricTankHeaders} data={citricTanks.filter(i => !i.isDeleted)} fields={citricTankFields} onDataChange={handleCitricTankChange} isMainTable={true} />
      </div>

      {/* 📊 TABLO 8: BLOWERLAR */}
      <div className="mb-4">
        <div className="mb-2 d-flex align-items-center justify-content-between w-100" style={{ color: "#94a3b8" }}>
          <div className="d-flex align-items-center fw-bold small text-white">
            <i className="bi bi-wind me-2 text-success"></i>
            <span>8. Membran Tarama Blowerları (Scouring Blower)</span>
          </div>
          <button className="btn btn-outline-dark btn-xs px-2 py-0.5" style={{ fontSize: '10px' }} onClick={addNewBlowerRow}>
            + Data Ekle
          </button>
        </div>
        <ExcelGrid
          tableId="blowers"
          activeTableId={activeTableId}
          setActiveTableId={setActiveTableId}
          headers={blowerHeaders} data={blowers.filter(i => !i.isDeleted)} fields={blowerFields} onDataChange={handleBlowerChange} isMainTable={true} />
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

export default Membran;