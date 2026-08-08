// Piyasada yaygın olarak bulunan standart motor güçleri listesi (büyükten küçüğe sıralı)
const STANDART_BLOWERLAR = [55.0, 45.0, 37.0, 30.0, 22.0, 18.5, 15.0, 11.0, 7.5, 5.5, 4.0, 3.0, 2.2, 2.0, 1.8, 1.5, 0.5];
const STANDART_POMPALAR = [15.0, 11.0, 7.5, 5.5, 4.0, 3.0, 2.2, 1.5, 1.1, 0.75, 0.55, 0.37];

/**
 * Hedeflenen toplam gücü karşılamak için standart ekipman listesinden 
 * en mantıklı adet ve kW kombinasyonunu seçer.
 * Eşit kapasiteli paralel motor mantığına göre optimize edilmiştir.
 */
const enUygunEkipmaniSec = (hedefToplamKw, standartList) => {
    // Küçükten büyüğe sıralı bir kopya alalım (arama kolaylığı için)
    const siraliList = [...standartList].sort((a, b) => a - b);

    // 1. Alternatif: Tek bir motor kurtarıyorsa, hedef gücü karşılayan en küçük standart motoru seç
    const tekMotorUyan = siraliList.find(kw => kw >= hedefToplamKw);
    if (tekMotorUyan) {
        return { qty: 1, power: tekMotorUyan };
    }

    // 2. Alternatif: Hedef güç en büyük tek motoru aşıyorsa, minimum adet ve en optimum gücü bulalım.
    // Örn: Aynı güçte 2'li veya 3'lü motor kombinasyonlarından hedefi kurtaran en yakın toplam gücü arar.
    let enIyiKombinasyon = { qty: Math.ceil(hedefToplamKw / siraliList[siraliList.length - 1]), power: siraliList[siraliList.length - 1] };
    let minimumFazlalik = (enIyiKombinasyon.qty * enIyiKombinasyon.power) - hedefToplamKw;

    // Maksimum 4 adet paralel motora kadar (genelde blower odalarında 2-3-4'lü kombinasyonlar olur) tarama yapalım
    for (let adet = 2; adet <= 4; adet++) {
        // Bu adet için gereken minimum tekil motor gücü
        const gerekenTekilKw = hedefToplamKw / adet;
        // Bu gücü kurtaran en yakın standart motor
        const uygunMotor = siraliList.find(kw => kw >= gerekenTekilKw);

        if (uygunMotor) {
            const toplamKapasite = uygunMotor * adet;
            const fazlalik = toplamKapasite - hedefToplamKw;

            // Eğer bu kombinasyon hedefi kurtarıyor ve mevcut en iyi kombinasyondan daha az güç israf ediyorsa seç
            if (fazlalik >= 0 && fazlalik < minimumFazlalik) {
                minimumFazlalik = fazlalik;
                enIyiKombinasyon = { qty: adet, power: uygunMotor };
            }
        }
    }

    return enIyiKombinasyon;
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

    // input güvenliği için küçük harfe çeviriyoruz
    const systemKey = selectedSystem.toLowerCase();

    // Eğer "mbbr" ise 5, değilse (veya aktif_camur ise) 6
    const carpan = systemKey === "mbbr" ? 5 : 6;

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