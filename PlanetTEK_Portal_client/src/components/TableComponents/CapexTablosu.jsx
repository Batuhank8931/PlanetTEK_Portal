import React, { useState } from "react";

function CapexTablosu() {
    const [rows, setRows] = useState([
        { id: "h1", no: "1.", label: "MEKANİK EKİPMANLAR", isHeader: true },

        { id: "s1", no: "1.1.", label: "Fiziksel Arıtma Üniteleri (Birincil Arıtma)", isSubHeader: true },
        { id: "r1", no: "1.1.1.", label: "Kaba ve İnce Izgara", isSubHeader: true, isLight: true },
        { id: "r1_1", no: "1.1.1.1.", piece: 1, label: "Elle Temizlemeli Kaba Izgara", unitPrice: 866, discount: 8 },
        { id: "r1_2", no: "1.1.1.2.", piece: 0, label: "Elle Temizlemeli İnce Izgara", unitPrice: 910, discount: 8 },
        { id: "r1_3", no: "1.1.1.1.", piece: 1, label: "Otomatik Temizlemeli Kaba Izgara", unitPrice: 16070, discount: 8 },
        { id: "r1_4", no: "1.1.1.2.", piece: 1, label: "Otomatik Temizlemeli İnce Izgara", unitPrice: 16713, discount: 8 },
        { id: "r2", no: "1.1.2.", piece: 4, label: "Kum-Yağ Tutucu Plakaları", unitPrice: 107, discount: 8 },
        { id: "r3", no: "1.1.3.", piece: 2, label: "Terfi Pompası ( 1 asil + 1 yedek)", unitPrice: 486, discount: 8 },
        { id: "r4", no: "1.1.4.", piece: 1, label: "Debi Dağıtım Yapısı", unitPrice: 5135, discount: 8 },

        { id: "s2", no: "1.2.", label: "Biyolojik Arıtma Üniteleri (İkincil Arıtma)", isSubHeader: true },
        { id: "r5", no: "1.2.1.", piece: 8, label: "PlanetDISK® MX 1 DBD Ünitesi (Kapaksız) ;\n- Epoksi Boyalı AISI 1045 (C45) Karbon Çelik Dolu Mil\n- Islak Parçalar SS304 Kalite Paslanmaz ve Galvaniz Kaplı Çelik\n- 0 m² Disk Yüzey Alanı / Ünite", unitPrice: 28235, discount: 8 },
        { id: "r6", no: "1.2.2.", piece: 8, label: "PlanetDISK® MX 1 DBD Ünitesi Kapağı", unitPrice: 1390, discount: 8 },
        { id: "r7", no: "1.2.3.", piece: 1, label: "LS 45 Lamella Seperatör Son Çöktürme Tankı", unitPrice: 10415, discount: 8 },
        { id: "r8", no: "1.2.4.", piece: 1, label: "Son Çöktürme Tankı Çamur Pompası", unitPrice: 547, discount: 8 },
        { id: "r9", no: "1.2.5.", piece: 0, label: "Resürkilasyon Pompası (0 asil + 0 yedek)", unitPrice: 486, discount: 8 },
        { id: "r10", no: "1.2.6.", piece: 0, label: "Denitrifikasyon Tankı Mikseri", unitPrice: 0, discount: 8 },
        { id: "r11", no: "1.2.7.", piece: 0, label: "FeCl3 Koagülant Dozaj Sistemi", unitPrice: 530, discount: 8 },

        { id: "s3", no: "1.3.", label: "Filtrasyon ve Dezenfeksiyon Üniteleri (İleri Arıtma)", isSubHeader: true },
        { id: "r12", no: "1.3.1.", piece: 0, label: "Ön Klorlama Sistemi", unitPrice: 530, discount: 8, isOptionalStyle: true },
        { id: "r13", no: "1.3.2.", piece: 0, label: "Filtrasyon Sistemi Besleme Pompası", unitPrice: 865, discount: 8, isOptionalStyle: true },
        { id: "r14", no: "1.3.3.", piece: 0, label: "Filtrasyon Sistemi Geri Yıkama Pompası", unitPrice: 909, discount: 8, isOptionalStyle: true },
        { id: "r15", no: "1.3.4.", piece: 0, label: "Tam Otomatik Kum Filtre Sistemi", unitPrice: 5750, discount: 8, isOptionalStyle: true },
        { id: "r16", no: "1.3.5.", piece: 0, label: "Tam Otomatik Aktif Karbon Filtre Sistemi", unitPrice: 6325, discount: 8, isOptionalStyle: true },

        { id: "s4", no: "1.4.", label: "Çamur Susuzlaştırma Ünesi", isSubHeader: true },
        { id: "r17", no: "1.4.1.", piece: 1, label: "Besleme Pompası", unitPrice: 1420, discount: 8 },
        { id: "r18", no: "1.4.2.", piece: 0, label: "Dekantör", unitPrice: 40125, discount: 8 },
        { id: "r19", no: "1.4.3.", piece: 1, label: "Filtrepress", unitPrice: 16125, discount: 8 },
        { id: "r20", no: "1.4.4.", piece: 1, label: "Polimer Dozaj Ünitesi", unitPrice: 7550, discount: 8 },
        { id: "r21", no: "1.4.5.", piece: 1, label: "Drenaj Pompası", unitPrice: 650, discount: 8 },
        { id: "r22", no: "1.4.5.", piece: 1, label: "Konveyör", unitPrice: 6876, discount: 8 },

        { id: "h2", no: "2.", label: "İNŞAAT İŞLERİ", isHeader: true },
        { id: "c1", no: "2.1.", label: "Izgara ve Kum-Yağ Tutucu Kanalı", isUrgent: true },
        { id: "c2", no: "2.2.", label: "Anoksik Denitrifikasyon Tankı", isUrgent: true },
        { id: "c3", no: "2.3.", label: "Birinci Ön Çöktürme Tankı", isUrgent: true },
        { id: "c4", no: "2.3.", label: "İkinci Ön Çöktürme Tankı", isUrgent: true },
        { id: "c5", no: "2.4.", label: "Dengeleme Tankı", isUrgent: true },
        { id: "c6", no: "2.5.", label: "Arıtılmış Su Tankı", isUrgent: true },
        { id: "c7", no: "2.6.", label: "Filtrelenmiş Su Tankı", isUrgent: true },
        { id: "c8", no: "2.7.", label: "Çamur Tankı", isUrgent: true },

        { id: "h3", no: "3.", label: "MONTAJ EKİPMANLARI", isHeader: true },
        { id: "m1", no: "3.1.", piece: 1, label: "Bütün borulama ve elektrik tesisatı", unitPrice: 19637, discount: 8 },

        { id: "h4", no: "4.", label: "ELEKTRİK İŞLERİ", isHeader: true },
        { id: "e1", no: "4.1.", piece: 1, label: "PlanetDISK® Kontrol Panosu", unitPrice: 13027, discount: 8 },

        { id: "h5", no: "5.", label: "NAKLİYE", isHeader: true },
        { id: "n1", no: "5.1.", piece: 1, label: "Tır", unitPrice: 0, discount: 0, isShippingStyle: true },

        { id: "h6", no: "6.", label: "PROJE, MONTAJ, DEVREYE ALMA, EĞİTİM ve MÜHENDİSLİK", isHeader: true },
        { id: "p1", no: "5.1.", piece: 1, label: "Mühendislik Hizmetleri Genel Paketi", unitPrice: 0, discount: 8 },

        { id: "h7", no: "7.", label: "POD HAZIRLANMASI ve ONAYININ ALINMASI-Harçlar Hariç", isHeader: true },
        { id: "po1", no: "1.", piece: 1, label: "Resmi Onay Süreçleri Yönetimi", unitPrice: 2300, discount: 0 }
    ]);

    const [history, setHistory] = useState([]);

    const saveToHistory = (currentRows) => {
        setHistory([...history, JSON.stringify(currentRows)]);
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const previousState = JSON.parse(history[history.length - 1]);
        setRows(previousState);
        setHistory(history.slice(0, -1));
    };

    const handleCellChange = (id, field, val) => {
        saveToHistory(rows);
        setRows(rows.map(row => row.id === id ? { ...row, [field]: val } : row));
    };

    // Tıklanan satırın hemen altına yeni satır ekleyen fonksiyon
    const insertAfterRow = (index) => {
        saveToHistory(rows);
        const newId = `new_${Date.now()}`;
        const newRow = { id: newId, no: "1.x.x.", label: "Araya Eklenen Yeni Kalem", piece: 1, unitPrice: 0, discount: 0 };

        const updatedRows = [...rows];
        updatedRows.splice(index + 1, 0, newRow); // JavaScript splice ile araya kaynak yapıyoruz
        setRows(updatedRows);
    };


    const deleteRow = (id) => {
        saveToHistory(rows);
        setRows(rows.filter(row => row.id !== id));
    };

    const getRowBg = (row) => {
        if (row.isHeader) return "#0b1329";
        if (row.isSubHeader) return row.isLight ? "#2a3a52" : "#1e2d42";
        if (row.isUrgent) return "#801919";
        if (row.piece === 0) return "#2d1f2d";
        return "#151f32";
    };

    return (
        <div className="d-flex flex-column gap-3 w-100">

            <style>{`
        .capex-row {
          border-bottom: 1px solid #334155;
        }
        .capex-row:last-child {
          border-bottom: none;
        }
        .capex-input:focus {
          outline: none;
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        .header-title-cell {
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
          background-color: #090d16;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
      `}</style>

            {/* ÜST KONTROL PANELİ */}
            <div className="d-flex justify-content-end align-items-center mb-1">
                <button
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1"
                    style={{
                        backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a",
                        fontSize: "11px",
                        borderRadius: "6px",
                        transition: "0.2s",
                        opacity: history.length === 0 ? 0.4 : 1,
                        cursor: history.length === 0 ? "not-allowed" : "pointer"
                    }}
                >
                    <span style={{ fontSize: "12px" }}>↶</span> Son Değişikliği Geri Al ({history.length})
                </button>
            </div>

            {/* Büyük Dinamik Tablo Yapısı */}
            <div className="d-flex flex-column rounded-3" style={{ border: "1px solid #334155", height: "auto", overflowX: "hidden" }}>
                {/* TABLO ANA SÜTUN BAŞLIKLARI */}
                <div className="d-flex align-items-stretch border-bottom" style={{ borderColor: "#334155" }}>
                    <div className="p-2 px-2 header-title-cell text-center" style={{ width: "7%" }}>No</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-3 header-title-cell" style={{ width: "36%" }}>Tanım</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-2 header-title-cell text-center" style={{ width: "7%" }}>Adet</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-2 header-title-cell text-end" style={{ width: "11%" }}>Birim Fiyat</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-2 header-title-cell text-end" style={{ width: "11%" }}>Toplam Fiyat</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-2 header-title-cell text-center" style={{ width: "10%" }}>İndirim Oranı</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-2 header-title-cell text-end" style={{ width: "12%" }}>İndirim Sonrası</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 header-title-cell text-center" style={{ width: "6%" }}>Aksiyon</div>
                </div>

                {/* SATIRLARIN DÖNÜŞÜM ALANI */}
                {rows.map((row, index) => {
                    const piece = parseFloat(row.piece) ?? 0;
                    const uPrice = parseFloat(row.unitPrice) ?? 0;
                    const disc = parseFloat(row.discount) ?? 0;

                    const rawTotal = piece * uPrice;
                    const netTotal = rawTotal * (1 - disc / 100);

                    let totalStr = `${rawTotal.toLocaleString()} €`;
                    let netStr = `${netTotal.toLocaleString()} €`;

                    if (row.isUrgent) {
                        totalStr = "MÜŞTERİYE AİT";
                        netStr = "MÜŞTERİYE AİT";
                    } else if (row.isOptionalStyle) {
                        totalStr = "Seçime bağlı";
                        netStr = "Seçime bağlı";
                    } else if (row.isShippingStyle) {
                        totalStr = "-";
                        netStr = "Bilgi Amaçlı";
                    } else if (uPrice === 0 && !row.isHeader && !row.isSubHeader) {
                        totalStr = "-";
                        netStr = "-";
                    }

                    return (
                        <div key={row.id} className="d-flex align-items-stretch capex-row" style={{ backgroundColor: getRowBg(row) }}>
                            {/* SIRA NUMARASI */}
                            <div className="p-2 px-2 d-flex align-items-center justify-content-center text-white-50 fw-bold" style={{ width: "7%", fontSize: "11px" }}>
                                {row.no}
                            </div>

                            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                            {/* TANIM SÜTUNU */}
                            <div className="p-2 px-3 d-flex align-items-center" style={{ width: "36%" }}>
                                {row.isHeader || row.isSubHeader ? (
                                    <input
                                        type="text"
                                        className="form-control form-control-sm text-start text-white bg-transparent border-0 fw-bold p-0 capex-input"
                                        style={{
                                            fontSize: row.isHeader ? "13px" : "12px",
                                            color: row.isHeader ? "#60a5fa" : "#cbd5e1",
                                            boxShadow: "none", width: "100%"
                                        }}
                                        value={row.label}
                                        onChange={(e) => handleCellChange(row.id, "label", e.target.value)}
                                    />
                                ) : (
                                    <textarea
                                        rows={row.label.includes("\n") ? 3 : 1}
                                        className="form-control form-control-sm text-start text-white bg-transparent border-0 fw-medium p-0 capex-input rounded style-none"
                                        style={{ fontSize: "12px", boxShadow: "none", width: "100%", resize: "none" }}
                                        value={row.label}
                                        onChange={(e) => handleCellChange(row.id, "label", e.target.value)}
                                    />
                                )}
                            </div>

                            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                            {/* ADET */}
                            <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "7%" }}>
                                {row.isHeader || row.isSubHeader || row.isUrgent ? null : (
                                    <input
                                        type="number"
                                        className="form-control form-control-sm text-center text-white bg-transparent border-0 p-0 capex-input fw-bold"
                                        style={{ fontSize: "12px", boxShadow: "none" }}
                                        value={row.piece}
                                        onChange={(e) => handleCellChange(row.id, "piece", e.target.value)}
                                    />
                                )}
                            </div>

                            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                            {/* BİRİM FİYAT */}
                            <div className="p-1 px-2 d-flex align-items-center justify-content-end" style={{ width: "11%" }}>
                                {row.isHeader || row.isSubHeader || row.isUrgent ? null : (
                                    <input
                                        type="number"
                                        className="form-control form-control-sm text-end text-white bg-transparent border-0 p-0 capex-input fw-bold"
                                        style={{ fontSize: "12px", boxShadow: "none" }}
                                        value={row.unitPrice}
                                        onChange={(e) => handleCellChange(row.id, "unitPrice", e.target.value)}
                                    />
                                )}
                                {(!row.isHeader && !row.isSubHeader && !row.isUrgent) && <span className="text-white-50 ms-1" style={{ fontSize: "11px" }}>€</span>}
                            </div>

                            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                            {/* TOPLAM FİYAT */}
                            <div className="p-1 px-2 d-flex align-items-center justify-content-end text-white fw-bold" style={{ width: "11%", fontSize: "11.5px" }}>
                                {row.isHeader || row.isSubHeader ? null : totalStr}
                            </div>

                            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                            {/* İNDİRİM ORANI */}
                            <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "10%" }}>
                                {row.isHeader || row.isSubHeader || row.isUrgent || row.isShippingStyle ? null : (
                                    <div className="d-flex align-items-center justify-content-center gap-1 w-100">
                                        <input
                                            type="number"
                                            className="form-control form-control-sm text-center text-white-50 bg-transparent border-0 p-0 capex-input"
                                            style={{ fontSize: "11.5px", boxShadow: "none", width: "45%" }}
                                            value={row.discount}
                                            onChange={(e) => handleCellChange(row.id, "discount", e.target.value)}
                                        />
                                        <span className="text-white-50" style={{ fontSize: "10px" }}>%</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                            {/* İNDİRİM SONRASI NET TUTAR */}
                            <div className="p-1 px-2 d-flex align-items-center justify-content-end fw-bold" style={{ width: "12%", fontSize: "12px", color: row.isUrgent ? "#ef4444" : row.piece === 0 ? "#94a3b8" : "#4ade80" }}>
                                {row.isHeader || row.isSubHeader ? null : netStr}
                            </div>

                            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>

                            {/* AKSİYON PANELİ (Hem Silme Hem Araya Ekleme) */}
                            <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "6%" }}>
                                {/* Araya Satır Ekle Butonu */}
                                <button
                                    onClick={() => insertAfterRow(index)}
                                    className="btn btn-sm p-0 border-0 text-success opacity-50 hover-opacity-100 fw-bold"
                                    style={{ fontSize: "16px", lineHeight: "1" }}
                                    title="Altına Yeni Satır Ekle"
                                >
                                    +
                                </button>
                                {/* Satır Silme Butonu */}
                                <button
                                    onClick={() => deleteRow(row.id)}
                                    className="btn btn-sm p-0 border-0 text-danger opacity-40 hover-opacity-100"
                                    style={{ fontSize: "16px", lineHeight: "1" }}
                                    title="Bu Satırı Sil"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
}

export default CapexTablosu;