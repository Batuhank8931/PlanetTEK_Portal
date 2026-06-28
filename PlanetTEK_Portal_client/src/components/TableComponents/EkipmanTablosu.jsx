import React, { useState, useEffect } from "react";
import { useTeklifStore } from "../../utils/teklifStore";
import { ekipmanTabloHesap } from "../../utils/ekipmanTablosuHesap";

function EkipmanTablosu() {
  const formData = useTeklifStore((state) => state.formData);
  const updateSection = useTeklifStore((state) => state.updateSection);

  const teklifDili = formData?.customerInfo?.teklifDili || "Yabancı";

  // Store içindeki tablo verisini güvenli oku
  const storeEkipmanTablosuVerisi = formData?.tables?.ekipantablosu;

  // KURAL 1: Store'da data varsa oradan başlat, yoksa şablondan üret
  const [rows, setRows] = useState(() => {
    if (storeEkipmanTablosuVerisi && storeEkipmanTablosuVerisi.content) {
      return storeEkipmanTablosuVerisi.content;
    }
    return ekipmanTabloHesap(formData);
  });

  const [loading, setLoading] = useState(!storeEkipmanTablosuVerisi);
  const [history, setHistory] = useState([]);

  // KURAL 2: İlk yüklemede store boşsa ve formData geldiyse datayı üret
  useEffect(() => {
    if (!storeEkipmanTablosuVerisi && formData && Object.keys(formData).length > 0) {
      const generated = ekipmanTabloHesap(formData);
      setRows(generated);
      setLoading(false);
    } else if (storeEkipmanTablosuVerisi) {
      setLoading(false);
    }
  }, [storeEkipmanTablosuVerisi, formData]);

  // KURAL 3: Satırlar her değiştiğinde Store'u günceller
  useEffect(() => {
    if (loading) return;
    updateSection("tables", {
      ...formData?.tables,
      ekipantablosu: { content: rows }
    });
  }, [rows, loading]);

  // --- ACTIONS ---

  // 🔄 REFRESH (Yenileme) Fonksiyonu
  const handleRefresh = () => {
    setHistory([]);
    const freshRows = ekipmanTabloHesap(formData);
    setRows(freshRows);
  };

  const saveToHistory = (currentRows) => {
    setHistory([...history, JSON.stringify(currentRows)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setRows(JSON.parse(history[history.length - 1]));
    setHistory(history.slice(0, -1));
  };

  const handleChange = (id, field, value) => {
    saveToHistory(rows);

    // 1. Önce mevcut satırı güncelleyelim
    let updatedRows = rows.map((row) =>
      row.id === id ? { ...row, [field]: value } : row
    );

    // 2. Özel dinamik inşaat hacmi hesaplama (Sadece s0 ile başlayan ve Retention Time olan satırlar için)
    if (id.startsWith("s0") && field === "value" && id.endsWith("_4")) {
      const currentText = value;

      // Metindeki tüm sayıları (ondalıklar dahil) diziye al (Örn: [2, 5.83] veya [5.83, 2])
      const numbers = (currentText.match(/\d+([.,]\d+)?/g) || []).map((num) =>
        parseFloat(num.replace(",", "."))
      );

      let newHour = null;
      let flowRate = null;
      const isEnglish = teklifDili === "Yabancı";

      // 3. Teklif diline göre sayıların index konumları sabittir, doğrudan eşleştirelim
      if (isEnglish) {
        // Format: "[Hour] hours at peak flow rate of [Flow] m³/hour"
        if (numbers.length >= 2) {
          newHour = numbers[0];
          flowRate = numbers[1];
        }
      } else {
        // Format: "[Flow] m³/saat pik debide [Hour] saat" veya "[Flow] m³/saat pik debide [Hour] dakika"
        if (numbers.length >= 2) {
          flowRate = numbers[0];
          newHour = numbers[1];
        }
      }

      // 4. Eğer sayılar başarıyla ayıklandıysa yeni kapasiteyi hesapla
      if (newHour !== null && flowRate !== null && !isNaN(newHour) && !isNaN(flowRate)) {

        // Ekstra Güvenlik: Eğer kullanıcı metni "dakika" veya "minutes" yaparsa saati 60'a bölmeliyiz
        const isMinute = currentText.toLowerCase().includes("dakika") || currentText.toLowerCase().includes("minute");
        const hourMultiplier = isMinute ? (newHour / 60) : newHour;

        // Kapasite = Debi * Saat (Yuvarlanmış tam sayı)
        const calculatedCapacity = (flowRate * hourMultiplier).toFixed(0);

        // Kapasite satırının ID'sini bul (_4 -> _2 yapıyoruz)
        const capacityRowId = id.replace("_4", "_2");

        // Tablo state'i üzerinde kapasite hücresini dille uyumlu güncelle
        updatedRows = updatedRows.map((row) => {
          if (row.id === capacityRowId) {
            const capacityValue = isEnglish
              ? `${calculatedCapacity} m³ wet volume`
              : `${calculatedCapacity} m³ ıslak hacim`;
            return { ...row, value: capacityValue };
          }
          return row;
        });
      }
    }

    // State'i güncelle
    setRows(updatedRows);
  };

  const deleteRow = (id) => {
    saveToHistory(rows);
    setRows(rows.filter(row => row.id !== id));
  };

  const addNewEquipment = () => {
    saveToHistory(rows);
    const timestamp = Date.now();
    setRows([
      ...rows,
      { id: `equip_${timestamp}`, type: "equip", label: "Yeni Ekipman / Ünite Adı" },
      { id: `spec_${timestamp}_1`, type: "spec", label: "Adet", value: "1 Adet" }
    ]);
  };

  const insertSpecAfter = (index) => {
    saveToHistory(rows);
    const newId = `spec_${Date.now()}`;
    const newSpec = { id: newId, type: "spec", label: "Yeni Özellik", value: "Değer giriniz..." };

    const updatedRows = [...rows];
    updatedRows.splice(index + 1, 0, newSpec);
    setRows(updatedRows);
  };

  const getRowBg = (row) => {
    if (row.type === "main") return "#0b1329";
    if (row.type === "equip") return "#1e293b";
    return "#151f32";
  };

  return (
    <div className="d-flex flex-column w-100 text-white">
      <style>{`
        .equip-row { border-bottom: 1px solid #334155; transition: background-color 0.15s ease; }
        .equip-row:last-child { border-bottom: none; }
        .equip-input { font-size: 12px; background: transparent; border: none; color: white; width: 100%; resize: none; }
        .equip-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.05); border-radius: 4px; }
        .main-title-input { font-size: 14px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
        .equip-title-input { font-size: 13px; font-weight: 700; color: white; }
      `}</style>

      {/* ÜST KONTROL PANELİ */}
      <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
        <div className="fw-semibold text-white" style={{ fontSize: "14px" }}>
          Ekipman Listesi
        </div>

        <div className="d-flex gap-2">
          {/* 🔄 YENİLE BUTONU */}
          <button
            onClick={handleRefresh}
            className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1 border-0"
            style={{ backgroundColor: "#d97706", fontSize: "11px", borderRadius: "6px" }}
            title="Tabloyu İlk Hesaplanan Ayarlarına Döndür"
          >
            🔄 Yenile
          </button>

          {/* ↶ GERİ AL BUTONU */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1"
            style={{
              backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a",
              fontSize: "11px",
              borderRadius: "6px",
              opacity: history.length === 0 ? 0.4 : 1
            }}
          >
            ↶
          </button>
        </div>
      </div>


      {/* TABLO ALANI */}
      <div className="w-100" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div className="d-flex flex-column rounded-3 overflow-hidden" style={{ border: "1px solid #334155", minWidth: "800px" }}>
          {rows.map((row, index) => {
            if (row.type === "main") {
              return (
                <div key={row.id} className="d-flex align-items-stretch equip-row" style={{ backgroundColor: getRowBg(row) }}>
                  <div className="p-2 px-3 d-flex align-items-center" style={{ width: "94%" }}>
                    <input
                      type="text"
                      className="equip-input main-title-input text-center"
                      value={row.label}
                      onChange={(e) => handleChange(row.id, "label", e.target.value)}
                    />
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                  <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "6%" }}>
                    <button onClick={() => deleteRow(row.id)} className="btn btn-sm p-0 border-0 text-danger" style={{ fontSize: "16px" }}>&times;</button>
                  </div>
                </div>
              );
            }

            if (row.type === "equip") {
              return (
                <div key={row.id} className="d-flex align-items-stretch equip-row" style={{ backgroundColor: getRowBg(row) }}>
                  <div className="p-2 px-3 d-flex align-items-center" style={{ width: "94%" }}>
                    <input
                      type="text"
                      className="equip-input equip-title-input"
                      value={row.label}
                      onChange={(e) => handleChange(row.id, "label", e.target.value)}
                    />
                  </div>
                  <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                  <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "6%" }}>
                    <button onClick={() => insertSpecAfter(index)} className="btn btn-sm p-0 border-0 text-success fw-bold" style={{ fontSize: "16px", lineHeight: "1" }} title="Özellik Ekle">+</button>
                    <button onClick={() => deleteRow(row.id)} className="btn btn-sm p-0 border-0 text-danger" style={{ fontSize: "16px", lineHeight: "1" }} title="Ekipmanı Sil">&times;</button>
                  </div>
                </div>
              );
            }

            // Spec Tipi Satırlar (Özellikler)
            return (
              <div key={row.id} className="d-flex align-items-stretch equip-row" style={{ backgroundColor: getRowBg(row) }}>
                <div className="p-2 px-4 d-flex align-items-start border-end" style={{ width: "30%", borderColor: "#334155" }}>
                  <textarea
                    rows={1}
                    className="equip-input fw-medium text-white-50"
                    value={row.label}
                    onChange={(e) => handleChange(row.id, "label", e.target.value)}
                  />
                </div>

                <div className="p-2 px-3 d-flex align-items-start" style={{ width: "64%" }}>
                  <textarea
                    rows={row.value && row.value.length > 50 ? 2 : 1}
                    className="equip-input fw-bold"
                    value={row.value || ""}
                    onChange={(e) => handleChange(row.id, "value", e.target.value)}
                  />
                </div>

                <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "6%" }}>
                  <button onClick={() => insertSpecAfter(index)} className="btn btn-sm p-0 border-0 text-success fw-bold" style={{ fontSize: "15px", lineHeight: "1" }} title="Altına Özellik Ekle">+</button>
                  <button onClick={() => deleteRow(row.id)} className="btn btn-sm p-0 border-0 text-danger" style={{ fontSize: "16px", lineHeight: "1" }} title="Özelliği Sil">&times;</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ALT EKLEME BUTONLARI */}
      <div className="d-flex justify-content-start gap-2 mt-2">
        <button
          onClick={addNewEquipment}
          className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1"
          style={{ backgroundColor: "#2e7d32", fontSize: "11px", borderRadius: "6px" }}
        >
          <span style={{ fontSize: "14px" }}>+</span> Yeni Ekipman Grubu Ekle
        </button>

        <button
          onClick={() => {
            saveToHistory(rows);
            setRows([...rows, { id: `main_${Date.now()}`, type: "main", label: "YENİ ANA KATEGORİ" }]);
          }}
          className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1"
          style={{ backgroundColor: "#0f172a", border: "1px solid #334155", fontSize: "11px", borderRadius: "6px" }}
        >
          <span style={{ fontSize: "14px" }}>+</span> Yeni Ana Başlık Ekle
        </button>
      </div>
    </div>
  );
}

export default EkipmanTablosu;