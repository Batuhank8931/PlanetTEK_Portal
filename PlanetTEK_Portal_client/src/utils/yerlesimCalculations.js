// utils/yerlesimCalculations.js

/**
 * Kademe kartlarının verisini hazırlar (Kademe ve Nitrifikasyon isimlendirmesi)
 */
export const calculateKademeKartlari = (finalMetrekare, tekDiskAlani) => {
    if (!finalMetrekare || finalMetrekare.length === 0) return [];

    let realKademeCounter = 0;
    return finalMetrekare.map((kademeObj, index) => {
        const alanSayi = Number(kademeObj.alan) || 0;
        const toplamGerekliDisk = Math.ceil(alanSayi / tekDiskAlani);

        let dinamikGörünenAd = "";
        if (kademeObj.isNitrifikasyon || kademeObj.kademeAdi === "Nitrifikasyon") {
            dinamikGörünenAd = "Nitrifikasyon";
        } else {
            realKademeCounter++;
            dinamikGörünenAd = `${realKademeCounter}. Kademe`;
        }

        return {
            index: index + 1,
            realIndex: index,
            görünenAd: dinamikGörünenAd,
            isNitrifikasyon: !!kademeObj.isNitrifikasyon,
            gerekliAlan: alanSayi,
            rawKademeVerisi: kademeObj,
            toplamGerekliDisk
        };
    });
};

/**
 * Küresel sistem özetini (toplam alan ve disk) hesaplar
 */
export const calculateGlobalSistemOzet = (finalMetrekare, tekDiskAlani) => {
    if (!finalMetrekare || finalMetrekare.length === 0) {
        return { toplamAlan: 0, toplamGerekliDisk: 0 };
    }
    const toplamAlan = finalMetrekare.reduce((sum, k) => sum + (Number(k.alan) || 0), 0);
    const toplamGerekliDisk = Math.ceil(toplamAlan / tekDiskAlani);

    return { toplamAlan, toplamGerekliDisk };
};

// utils/yerlesimCalculations.js içindeki ilgili fonksiyonu güncelliyoruz:

export const calculateSistemHesabi = ({
    globalSistemOzet,
    maxDiskAdedi,
    minDiskAdedi,
    secilenUnite,
    secilenSira,
    yerlesimDuzeni,
    manuelSiraDiskleri // Yeni: [115, null] gibi her sıranın özel disk adetlerini tutan array
}) => {
    const { toplamAlan, toplamGerekliDisk } = globalSistemOzet;
    if (toplamGerekliDisk === 0) return null;

    // 1. Ünite dağılım hesabı (Mevcut mantık)
    const minUniteSayisi = Math.ceil(toplamGerekliDisk / maxDiskAdedi);
    const maxUniteSayisi = Math.ceil(toplamGerekliDisk / minDiskAdedi);

    const alternatifUniteler = [];
    const dinamikMaxUnite = Math.max(maxUniteSayisi, secilenUnite + 5);
    for (let i = minUniteSayisi; i <= dinamikMaxUnite; i++) {
        alternatifUniteler.push(i);
    }

    const mevcutUniteSecimi = secilenUnite >= minUniteSayisi ? secilenUnite : minUniteSayisi;

    let dagilim = [];
    if (yerlesimDuzeni && yerlesimDuzeni.length === secilenSira) {
        dagilim = yerlesimDuzeni;
    } else {
        let kalanUnite = mevcutUniteSecimi;
        for (let s = 0; s < secilenSira; s++) {
            const siraPayi = Math.ceil(kalanUnite / (secilenSira - s));
            dagilim.push(siraPayi);
            kalanUnite -= siraPayi;
        }
    }

    // 2. YENİ: SIRA BAZLI DİNAMİK DİSK DAĞILIMI
    // Önce toplam disk yükünü ve otomatik hesaplanacak sıraları bulalım
    let kalanGerekliDisk = toplamGerekliDisk;
    let otomatikHesaplanacakSiraSayisi = secilenSira;
    const kesinSiraDiskleri = Array(secilenSira).fill(null);

    // Kullanıcının el ile kilitlediği (inputtan değiştirdiği) sıraları yerleştirelim
    if (manuelSiraDiskleri && manuelSiraDiskleri.length === secilenSira) {
        manuelSiraDiskleri.forEach((diskAdedi, sIdx) => {
            if (diskAdedi !== null && diskAdedi > 0) {
                // Bu sıradaki toplam disk = (ünite sayısı) * (mil başına disk)
                const siraUniteAdedi = dagilim[sIdx] || 1;
                const toplamSiraDiski = diskAdedi * siraUniteAdedi;

                kesinSiraDiskleri[sIdx] = diskAdedi;
                kalanGerekliDisk -= toplamSiraDiski;
                otomatikHesaplanacakSiraSayisi--;
            }
        });
    }

    // Kalan diski, el değmemiş diğer sıralara ünite sayılarına oranla bölüştürelim
    // (Senin senaryonda: 2 sıra var, 1. sıra 115 olunca kalan disk 2. sıranın ünitesine bölünüp otomatik artacak)
    const sonMilDiskleri = kesinSiraDiskleri.map((kesinDisk, sIdx) => {
        if (kesinDisk !== null) return kesinDisk; // Zaten elle girilmiş

        const siraUniteAdedi = dagilim[sIdx] || 1;
        if (otomatikHesaplanacakSiraSayisi <= 0 || kalanGerekliDisk <= 0) {
            // Eğer disk bittiyse veya bölünecek sıra kalmadıysa default mil değerini bas
            return Math.ceil(toplamGerekliDisk / mevcutUniteSecimi);
        }

        // Kalan diski bu sıranın ünite payına göre kabaca oranla
        // Basitçe: Kalan toplam diski, kalan otomatik sıraların toplam ünitesine bölüyoruz
        const kalanOtomatikUnitelerinToplami = dagilim.reduce((sum, u, idx) => {
            return sum + (kesinSiraDiskleri[idx] === null ? u : 0);
        }, 0);

        const milDisk = Math.ceil(kalanGerekliDisk / (kalanOtomatikUnitelerinToplami || 1));
        return Math.min(milDisk, maxDiskAdedi); // Üst limiti aşmasın
    });

    return {
        toplamAlan,
        toplamGerekliDisk,
        alternatifUniteler,
        mevcutUniteSecimi,
        siraSayisi: secilenSira,
        dagilim,
        sonMilDiskleri // ARTIK HER SIRANIN KENDİ DİSK DEĞERİ VAR (Tek bir milBasinaDisk yerine)
    };
};

/**
 * Sürüklenebilir sıralar şeması (sonMilDiskleri'ni kullanacak şekilde güncellendi)
 */
export const calculateTumSiralar = ({ sistemHesabi, Q, hacim, lamellaData }) => {
    const siralar = [];
    let genelSiraNo = 1;

    if (!sistemHesabi) return siralar;

    sistemHesabi.dagilim.forEach((siraAdet, sIdx) => {
        const HRT = Q > 0 ? (((hacim * siraAdet) / Q) * 24).toFixed(2) : 0;
        // Ortak değer yerine hesaplanan dinamik sıra diskini alıyoruz
        const milBasinaDisk = sistemHesabi.sonMilDiskleri[sIdx];

        siralar.push({
            isLamella: false,
            genelSiraNo: genelSiraNo++,
            siraTipi: sIdx,
            adet: siraAdet,
            milBasinaDisk: milBasinaDisk,
            beklemeSuresi: Number(HRT),
            color: "#15803d",
            borderColor: "#16a34a",
            textColor: "#4ade80"
        });
    });

    if (lamellaData && lamellaData.lamellaAdet && Number(lamellaData.lamellaAdet) > 0) {
        siralar.push({
            isLamella: true,
            genelSiraNo: genelSiraNo++,
            kademeNo: "Çökeltim",
            adet: Number(lamellaData.lamellaAdet),
            model: lamellaData.secilenLamellaModeli || "Bilinmiyor",
            alan: lamellaData.gerekliLamellaAlani || 0,
            hacim: lamellaData.gerekliLamellaHacmi || 0,
            color: "#0f766e",
            borderColor: "#14b8a6",
            textColor: "#2dd4bf"
        });
    }

    return siralar;
};