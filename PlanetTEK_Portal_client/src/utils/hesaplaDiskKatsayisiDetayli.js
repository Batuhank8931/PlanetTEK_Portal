/**
 * Tablodaki Gerçek Katsayılar ve İnterpolasyon ile 
 * Dönen Biyolojik Disk Yüzey Yükü Hesaplama Fonksiyonu
 * (Maksimum 22 sınırı eklenmiştir)
 */
export default function hesaplaDiskKatsayisiDetayli(sicaklik, hedefBoi, maxemperik) {
    const katsayilar = {
        15: [{ a: 1.67270000, b: 5.39959839 }, { a: 1.98652158, b: 2.26104418 }],
        20: [{ a: 1.12247379, b: 4.20883534 }, { a: 2.48608563, b: -17.30722892 }],
        25: [{ a: 1.00914580, b: 1.95481928 }, { a: 0.99943616, b: 2.14859438 }],
        30: [{ a: 0.83492370, b: 2.04518072 }],
        40: [{ a: 0.77540176, b: -0.32831325 }, { a: 0.99873549, b: -6.79919679 }],
        45: [{ a: 0.72827917, b: -2.49297189 }, { a: 0.66399836, b: -11.65060241 }]
    };

    function getXForBoi(boi, temp) {
        const egriler = katsayilar[boi];
        if (egriler.length === 1) {
            return (temp - egriler[0].b) / egriler[0].a;
        } else {
            const x1 = (temp - egriler[0].b) / egriler[0].a;
            const x2 = (temp - egriler[1].b) / egriler[1].a;
            return (x1 + x2) / 2;
        }
    }

    const mevcutBoiler = Object.keys(katsayilar).map(Number).sort((a, b) => a - b);

    let sonucX;

    if (hedefBoi <= mevcutBoiler[0]) {
        sonucX = getXForBoi(mevcutBoiler[0], sicaklik);
    } else if (hedefBoi >= mevcutBoiler[mevcutBoiler.length - 1]) {
        sonucX = getXForBoi(mevcutBoiler[mevcutBoiler.length - 1], sicaklik);
    } else {
        let altBoi = mevcutBoiler[0];
        let ustBoi = mevcutBoiler[mevcutBoiler.length - 1];

        for (let i = 0; i < mevcutBoiler.length - 1; i++) {
            if (hedefBoi >= mevcutBoiler[i] && hedefBoi <= mevcutBoiler[i + 1]) {
                altBoi = mevcutBoiler[i];
                ustBoi = mevcutBoiler[i + 1];
                break;
            }
        }

        const altX = getXForBoi(altBoi, sicaklik);
        const ustX = getXForBoi(ustBoi, sicaklik);
        const oran = (hedefBoi - altBoi) / (ustBoi - altBoi);
        sonucX = altX + oran * (ustX - altX);

        sonucX = parseFloat(sonucX.toFixed(2));
    }

    // Maksimum 22 çiti (22'den büyükse direkt 22 döndürür)
    if (sonucX > maxemperik) {
        return maxemperik;
    }

    return parseFloat(sonucX.toFixed(4));
}