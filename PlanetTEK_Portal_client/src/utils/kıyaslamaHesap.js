// Piyasada yaygın olarak bulunan standart motor güçleri listesi (büyükten küçüğe sıralı)
const STANDART_BLOWERLAR = [55.0, 45.0, 37.0, 30.0, 22.0, 18.5, 15.0, 11.0, 7.5, 5.5, 4.0, 3.0, 2.2, 1.5];
const STANDART_POMPALAR = [15.0, 11.0, 7.5, 5.5, 4.0, 3.0, 2.2, 1.5, 1.1, 0.75, 0.55, 0.37];

/**
 * Hedeflenen toplam gücü karşılamak için standart ekipman listesinden 
 * en mantıklı adet ve kW kombinasyonunu seçer.
 */
const enUygunEkipmaniSec = (hedefToplamKw, standartList) => {
    // 1. Alternatif: Tek bir motor kurtarıyorsa, hedef güce en yakın olan büyük motoru seç
    const tekMotorUyan = [...standartList].reverse().find(kw => kw >= hedefToplamKw);
    if (tekMotorUyan) {
        return { qty: 1, power: tekMotorUyan };
    }

    // 2. Alternatif: Hedef güç en büyük motordan bile büyükse, en büyük motoru baz alıp adet arttır
    const enBuyukMotor = standartList[0];
    const adet = Math.ceil(hedefToplamKw / enBuyukMotor);
    return { qty: adet, power: enBuyukMotor };
};

/**
 * PlanetDISK gücüne göre seçilen alternatif sistemin (Aktif Çamur: 6x, MBBR: 5x) 
 * gerçekçi ekipman parametrelerini simüle eder.
 */
export const hesaplaKlasikSistemEkipmanlari = (planetData, selectedSystem = "aktif_camur") => {
    // PlanetDISK'in günlük net kWh tüketimi
    const planetTotalPower = planetData.qty * planetData.power;
    const planetActualPower = planetTotalPower * (planetData.consumptionFactor / 100);
    const planetDailyKwh = planetActualPower * planetData.dailyHours;

    // Kriterimize göre çarpan kat sayısını belirliyoruz: Aktif çamur ise 6 katı, MBBR ise 5 katı
    const carpan = selectedSystem === "aktif_camur" ? 6 : 5;

    // Hedeflenen alternatif sistem günlük tüketimi
    const hedefKlasikDailyKwh = planetDailyKwh * carpan;

    // Alternatif sistem tüketim kırılımı: %85 Blower, %15 Çamur Pompası
    const blowerHedefKwh = hedefKlasikDailyKwh * 0.85;
    const pompaHedefKwh = hedefKlasikDailyKwh * 0.15;

    // Blower (24 saat) ve Pompa (4 saat) için gerekli net kurulu güç hedefleri
    const gerekenBlowerToplamKuruluKw = (blowerHedefKwh / 24) / 0.90;
    const gerekenPompaToplamKuruluKw = (pompaHedefKwh / 4) / 0.90;

    // Standart array'lerden gerçekçi adet ve güç seçimi yapılıyor
    const secilenBlower = enUygunEkipmaniSec(gerekenBlowerToplamKuruluKw, STANDART_BLOWERLAR);
    const secilenPompa = enUygunEkipmaniSec(gerekenPompaToplamKuruluKw, STANDART_POMPALAR);

    return {
        blower: {
            qty: secilenBlower.qty,
            power: secilenBlower.power,
            consumptionFactor: 90,
            price: planetData.price,
            dailyHours: 24,
            yearlyDays: 365
        },
        pump: {
            qty: secilenPompa.qty,
            power: secilenPompa.power,
            consumptionFactor: 90,
            price: planetData.price,
            dailyHours: 4,
            yearlyDays: 365
        }
    };
};