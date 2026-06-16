import React, { useState } from "react";
import ExcelGrid from "./ExcelGrid";

function IscilikMaliyetleri() {
    // --- GRUP 1: SADECE ÜNİTE (1-20 Ünite Tam Liste) ---
    const [sadeceUnite, setSadeceUnite] = useState([
        { id: 1, ad: "1 ünite", mekKisi: 2, mekGun: 5, elkKisi: 1, elkGun: 2, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 1200 },
        { id: 2, ad: "2 ünite", mekKisi: 2, mekGun: 7, elkKisi: 1, elkGun: 2, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 1600 },
        { id: 3, ad: "3 ünite", mekKisi: 4, mekGun: 7, elkKisi: 2, elkGun: 4, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 3600 },
        { id: 4, ad: "4 ünite", mekKisi: 4, mekGun: 9, elkKisi: 2, elkGun: 4, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 4400 },
        { id: 5, ad: "5 ünite", mekKisi: 4, mekGun: 11, elkKisi: 2, elkGun: 5, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 5400 },
        { id: 6, ad: "6 ünite", mekKisi: 4, mekGun: 13, elkKisi: 2, elkGun: 6, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 6400 },
        { id: 7, ad: "7 ünite", mekKisi: 4, mekGun: 15, elkKisi: 2, elkGun: 7, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 7400 },
        { id: 8, ad: "8 ünite", mekKisi: 4, mekGun: 17, elkKisi: 2, elkGun: 8, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 8400 },
        { id: 9, ad: "9 ünite", mekKisi: 4, mekGun: 19, elkKisi: 2, elkGun: 9, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 9400 },
        { id: 10, ad: "10 ünite", mekKisi: 4, mekGun: 21, elkKisi: 2, elkGun: 10, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 10400 },
        { id: 11, ad: "11 ünite", mekKisi: 5, mekGun: 23, elkKisi: 1, elkGun: 12, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 12700 },
        { id: 12, ad: "12 ünite", mekKisi: 5, mekGun: 25, elkKisi: 1, elkGun: 14, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 13900 },
        { id: 13, ad: "13 ünite", mekKisi: 5, mekGun: 27, elkKisi: 2, elkGun: 16, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 16700 },
        { id: 14, ad: "14 ünite", mekKisi: 5, mekGun: 29, elkKisi: 2, elkGun: 18, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 18100 },
        { id: 15, ad: "15 ünite", mekKisi: 5, mekGun: 31, elkKisi: 2, elkGun: 20, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 19500 },
        { id: 16, ad: "16 ünite", mekKisi: 5, mekGun: 33, elkKisi: 2, elkGun: 21, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 20700 },
        { id: 17, ad: "17 ünite", mekKisi: 5, mekGun: 35, elkKisi: 2, elkGun: 22, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 21900 },
        { id: 18, ad: "18 ünite", mekKisi: 5, mekGun: 37, elkKisi: 2, elkGun: 23, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 23100 },
        { id: 19, ad: "19 ünite", mekKisi: 5, mekGun: 39, elkKisi: 2, elkGun: 24, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 24300 },
        { id: 20, ad: "20 ünite", mekKisi: 5, mekGun: 41, elkKisi: 2, elkGun: 25, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 25500 }
    ]);

    // --- GRUP 2: ÜNİTE + FİLTRASYON (1-10 Ünite Tam Liste) ---
    const [uniteFiltrasyon, setUniteFiltrasyon] = useState([
        { id: 1, ad: "1 ünite + filtrasyon", mekKisi: 2, mekGun: 7, elkKisi: 1, elkGun: 3, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 1700 },
        { id: 2, ad: "2 ünite + filtrasyon", mekKisi: 2, mekGun: 9, elkKisi: 1, elkGun: 3, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 2100 },
        { id: 3, ad: "3 ünite + filtrasyon", mekKisi: 4, mekGun: 11, elkKisi: 2, elkGun: 6, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 5600 },
        { id: 4, ad: "4 ünite + filtrasyon", mekKisi: 4, mekGun: 13, elkKisi: 2, elkGun: 6, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 6400 },
        { id: 5, ad: "5 ünite + filtrasyon", mekKisi: 4, mekGun: 15, elkKisi: 2, elkGun: 7, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 7400 },
        { id: 6, ad: "6 ünite + filtrasyon", mekKisi: 4, mekGun: 17, elkKisi: 2, elkGun: 8, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 8400 },
        { id: 7, ad: "7 ünite + filtrasyon", mekKisi: 4, mekGun: 19, elkKisi: 2, elkGun: 9, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 9400 },
        { id: 8, ad: "8 ünite + filtrasyon", mekKisi: 4, mekGun: 21, elkKisi: 2, elkGun: 10, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 10400 },
        { id: 9, ad: "9 ünite + filtrasyon", mekKisi: 4, mekGun: 23, elkKisi: 2, elkGun: 11, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 11400 },
        { id: 10, ad: "10 ünite + filtrasyon", mekKisi: 4, mekGun: 25, elkKisi: 2, elkGun: 12, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 12400 }
    ]);

    // --- GRUP 3: ÜNİTE + FİLTRASYON + ÇAMUR SUSUZLAŞTIRMA (1-10 Ünite Tam Liste) ---
    const [uniteFiltrasyonCamur, setUniteFiltrasyonCamur] = useState([
        { id: 1, ad: "1 ünite + filtrasyon + çamur susuzlaştırma", mekKisi: 2, mekGun: 7, elkKisi: 1, elkGun: 3, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 1700 },
        { id: 2, ad: "2 ünite + filtrasyon + çamur susuzlaştırma", mekKisi: 2, mekGun: 9, elkKisi: 1, elkGun: 3, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 2100 },
        { id: 3, ad: "3 ünite + filtrasyon + çamur susuzlaştırma", mekKisi: 4, mekGun: 11, elkKisi: 2, elkGun: 6, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 5600 },
        { id: 4, ad: "4 ünite + filtrasyon + çamur susuzlaştırma", mekKisi: 4, mekGun: 18, elkKisi: 2, elkGun: 6, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 8400 },
        { id: 5, ad: "5 ünite + filtrasyon + çamur susuzlaştırma", mekKisi: 4, mekGun: 20, elkKisi: 2, elkGun: 7, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 9400 },
        { id: 6, ad: "6 ünite + filtrasyon + çamur susuzlaştırma", mekKisi: 4, mekGun: 22, elkKisi: 2, elkGun: 8, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 10400 },
        { id: 7, ad: "7 ünite + filtrasyon + çamur susuzlaştırma", mekKisi: 4, mekGun: 24, elkKisi: 2, elkGun: 9, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 11400 },
        { id: 8, ad: "8 ünite + filtrasyon + çamur susuzlaştırma", mekKisi: 4, mekGun: 26, elkKisi: 2, elkGun: 10, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 12400 },
        { id: 9, ad: "9 ünite + filtrasyon + çamur susuzlaştırma", mekKisi: 4, mekGun: 28, elkKisi: 2, elkGun: 11, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 13400 },
        { id: 10, ad: "10 ünite + filtrasyon + çamur susuzlaştırma", mekKisi: 4, mekGun: 30, elkKisi: 2, elkGun: 12, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 14400 }
    ]);

    // --- GRUP 4: ÜNİTE + ÇAMUR SUSUZLAŞTIRMA (1-10 Ünite Tam Liste) ---
    const [uniteCamur, setUniteCamur] = useState([
        { id: 1, ad: "1 ünite + çamur susuzlaştırma", mekKisi: 2, mekGun: 7, elkKisi: 1, elkGun: 3, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 1700 },
        { id: 2, ad: "2 ünite + çamur susuzlaştırma", mekKisi: 2, mekGun: 9, elkKisi: 1, elkGun: 3, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 2100 },
        { id: 3, ad: "3 ünite + çamur susuzlaştırma", mekKisi: 4, mekGun: 11, elkKisi: 2, elkGun: 4, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 5200 },
        { id: 4, ad: "4 ünite + çamur susuzlaştırma", mekKisi: 4, mekGun: 15, elkKisi: 2, elkGun: 4, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 6800 },
        { id: 5, ad: "5 ünite + çamur susuzlaştırma", mekKisi: 4, mekGun: 17, elkKisi: 2, elkGun: 5, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 7800 },
        { id: 6, ad: "6 ünite + çamur susuzlaştırma", mekKisi: 4, mekGun: 19, elkKisi: 2, elkGun: 6, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 8800 },
        { id: 7, ad: "7 ünite + çamur susuzlaştırma", mekKisi: 4, mekGun: 21, elkKisi: 2, elkGun: 7, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 9800 },
        { id: 8, ad: "8 ünite + çamur susuzlaştırma", mekKisi: 4, mekGun: 23, elkKisi: 2, elkGun: 8, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 10800 },
        { id: 9, ad: "9 ünite + çamur susuzlaştırma", mekKisi: 4, mekGun: 25, elkKisi: 2, elkGun: 9, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 11800 },
        { id: 10, ad: "10 ünite + çamur susuzlaştırma", mekKisi: 4, mekGun: 27, elkKisi: 2, elkGun: 10, gunlikMekMaliyet: 55, gunlukYemek: 35, digerGunluk: 10, toplamMaliyet: 12800 }
    ]);

    // ExcelGrid Sütun Konfigürasyonları (En sağa Toplam İşçilik Fiyatı sütunu eklendi)
    const headers = [
        "Kombinasyon Adı",
        "Mekanik Kişi Sayısı", "Mekanik Gün Sayısı",
        "Elektrik Kişi Sayısı", "Elektrik Gün Sayısı",
        "Günlük İşçilik Maliyet (€)", "Günlük Yemek-Konaklama (€)", "Diğer Günlük Maliyet (€)",
        "Toplam İşçilik Maliyet (€)"
    ];

    const fields = ["mekKisi", "mekGun", "elkKisi", "elkGun", "gunlikMekMaliyet", "gunlukYemek", "digerGunluk", "toplamMaliyet"];

    const handleSave = () => {
        alert("Tüm İşçilik Maliyetleri matrisi başarıyla veritabanına kaydedildi.");
        console.log("Kaydedilen İşçilik Kümesi:", { sadeceUnite, uniteFiltrasyon, uniteFiltrasyonCamur, uniteCamur });
    };

    return (
        <div>
            {/* ÜST BAR VE KAYDET BUTONU */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <button className="btn btn-success btn-sm px-4" onClick={handleSave}>
                    <i className="bi bi-save me-2"></i>Kaydet
                </button>
            </div>a

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
        </div>
    );
}

export default IscilikMaliyetleri;