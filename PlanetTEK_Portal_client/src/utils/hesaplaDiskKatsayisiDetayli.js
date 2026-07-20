/**
 * Tablodaki Gerçek Katsayılar ve İnterpolasyon ile 
 * Dönen Biyolojik Disk Yüzey Yükü Hesaplama Fonksiyonu
 */
export default function hesaplaDiskKatsayisiDetayli(sicaklik, hedefBoi, maxemperik) {
    // Grafikteki eğrilerin tam koordinat haritası
    // X: Yükleme Oranı (gr/m²/gün), Y: Sıcaklık (°C)
    const hatlar = {
        15: [{ x: 4, y: 12 }, { x: 10, y: 22 }, { x: 15, y: 32 }],
        20: [{ x: 7, y: 12 }, { x: 16, y: 22 }, { x: 20, y: 32 }],
        25: [{ x: 10, y: 12 }, { x: 20, y: 22 }, { x: 30, y: 32 }],
        30: [{ x: 12, y: 12 }, { x: 24, y: 22 }, { x: 36, y: 32 }],
        40: [{ x: 16, y: 12 }, { x: 29, y: 22 }, { x: 39, y: 32 }],
        45: [{ x: 20, y: 12 }, { x: 34, y: 22 }, { x: 44, y: 32 }],
    };

    const boiAnahtarlari = Object.keys(hatlar).map(Number).sort((a, b) => a - b);

    // 1. BOİ sınır kontrolü ve alt/üst sınır tespiti
    let altBoi = boiAnahtarlari[0];
    let ustBoi = boiAnahtarlari[boiAnahtarlari.length - 1];

    if (hedefBoi <= altBoi) {
        altBoi = ustBoi = altBoi;
    } else if (hedefBoi >= ustBoi) {
        altBoi = ustBoi = ustBoi;
    } else {
        for (let i = 0; i < boiAnahtarlari.length - 1; i++) {
            if (hedefBoi >= boiAnahtarlari[i] && hedefBoi <= boiAnahtarlari[i + 1]) {
                altBoi = boiAnahtarlari[i];
                ustBoi = boiAnahtarlari[i + 1];
                break;
            }
        }
    }

    // 2. Belirli bir eğri üzerinde sıcaklığa göre X (Yükleme Oranı) bulma fonksiyonu
    function egrideXBul(hatEgrisi, t) {
        // Sıcaklık alt ve üst sınır kontrolleri
        if (t <= 12) return hatEgrisi[0].x;
        if (t >= 32) return hatEgrisi[2].x;
        
        // Sıcaklığın hangi aralıkta olduğunu bulup doğrusal interpolasyon yapıyoruz
        const p1 = t <= 22 ? hatEgrisi[0] : hatEgrisi[1];
        const p2 = t <= 22 ? hatEgrisi[1] : hatEgrisi[2];
        
        return p1.x + ((t - p1.y) * (p2.x - p1.x)) / (p2.y - p1.y);
    }

    // 3. Alt ve Üst BOİ eğrilerinden sıcaklığa karşılık gelen X değerlerini alıyoruz
    const altX = egrideXBul(hatlar[altBoi], sicaklik);
    const ustX = egrideXBul(hatlar[ustBoi], sicaklik);

    // 4. İki BOİ eğrisi arasında hedef BOİ'ye göre interpolasyon yapıyoruz
    let sonucX;
    if (ustBoi === altBoi) {
        sonucX = altX;
    } else {
        const oran = (hedefBoi - altBoi) / (ustBoi - altBoi);
        sonucX = altX + oran * (ustX - altX);
    }

    // Maksimum emperik çit kontrolü
    if (sonucX > maxemperik) {
        return maxemperik;
    }

    return parseFloat(sonucX.toFixed(4));
}