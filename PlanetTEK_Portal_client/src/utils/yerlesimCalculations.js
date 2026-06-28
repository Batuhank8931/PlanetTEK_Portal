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

// utils/yerlesimCalculations.js

/**
 * Küresel sistem hesabını ve sıra bazlı disk dağılımlarını hesaplar.
 * Orijinal (önerilen) disk adetlerini de hafızada tutar.
 */
// utils/yerlesimCalculations.js

export const calculateSistemHesabi = ({
    globalSistemOzet,
    maxDiskAdedi,
    minDiskAdedi,
    secilenUnite,
    secilenSira,
    yerlesimDuzeni,
    manuelSiraDiskleri
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

    // =========================================================================
    // A) DÜZELTİLEN KISIM: %100 SAF ORİJİNAL DİSK ADEDİ HESAPLAMA
    // Kullanıcının manuel kilitlediği disk adetlerini tamamen görmezden gelir.
    // Sadece güncel ünite adedine (mevcutUniteSecimi) ve sıra dağılımına bakar.
    // =========================================================================
    let kalanOrijinalDisk = toplamGerekliDisk;
    const orijinalMilDiskleri = Array(secilenSira).fill(null).map((_, sIdx) => {
        const siraUniteAdedi = dagilim[sIdx] || 1;

        if (kalanOrijinalDisk <= 0) {
            return Math.ceil(toplamGerekliDisk / mevcutUniteSecimi);
        }

        // Bu sıra dahil, kalan sıraların toplam ünite adedi
        const kalanUnitelerinToplami = dagilim.slice(sIdx).reduce((sum, u) => sum + u, 0);

        // Kalan diski, kalan ünite payına göre bölüyoruz
        const milDisk = Math.ceil(kalanOrijinalDisk / (kalanUnitelerinToplami || 1));
        const nihaiDisk = Math.min(milDisk, maxDiskAdedi);

        kalanOrijinalDisk -= (nihaiDisk * siraUniteAdedi);
        return nihaiDisk;
    });

    // =========================================================================
    // B) MANUEL DİSK DAĞILIMI (Kullanıcının inputlarına göre şekillenen dinamik kısım)
    // =========================================================================
    let kalanGerekliDisk = toplamGerekliDisk;
    let otomatikHesaplanacakSiraSayisi = secilenSira;
    const kesinSiraDiskleri = Array(secilenSira).fill(null);

    if (manuelSiraDiskleri && manuelSiraDiskleri.length === secilenSira) {
        manuelSiraDiskleri.forEach((diskAdedi, sIdx) => {
            if (diskAdedi !== null && diskAdedi > 0) {
                const siraUniteAdedi = dagilim[sIdx] || 1;
                const toplamSiraDiski = diskAdedi * siraUniteAdedi;

                kesinSiraDiskleri[sIdx] = diskAdedi;
                kalanGerekliDisk -= toplamSiraDiski;
                otomatikHesaplanacakSiraSayisi--;
            }
        });
    }

    const sonMilDiskleri = kesinSiraDiskleri.map((kesinDisk, sIdx) => {
        if (kesinDisk !== null) return kesinDisk; // Kullanıcı bu sırayı kilitlediyse onu koru

        const siraUniteAdedi = dagilim[sIdx] || 1;

        // Eğer kullanıcı el ile çok büyük değerler girdiyse ve kalan disk bittiyse/eksiye düştüyse,
        // o sıranın yeni güncel orijinal ideal değerini fallback olarak basıyoruz.
        if (otomatikHesaplanacakSiraSayisi <= 0 || kalanGerekliDisk <= 0) {
            return orijinalMilDiskleri[sIdx];
        }

        // Kalan otomatik sıraların toplam ünitesini bul
        const kalanOtomatikUnitelerinToplami = dagilim.reduce((sum, u, idx) => {
            return sum + (kesinSiraDiskleri[idx] === null ? u : 0);
        }, 0);

        const milDisk = Math.ceil(kalanGerekliDisk / (kalanOtomatikUnitelerinToplami || 1));
        return Math.min(milDisk, maxDiskAdedi);
    });

    return {
        toplamAlan,
        toplamGerekliDisk,
        alternatifUniteler,
        mevcutUniteSecimi,
        siraSayisi: secilenSira,
        dagilim,
        sonMilDiskleri,      // Kullanıcının girdilerine göre değişen milBasinaDisk dizisi
        orijinalMilDiskleri  // Sadece seçilen ünite/sıraya göre değişen OrginalDiskAdedi dizisi
    };
};

/**
 * Sürüklenebilir sıralar şeması (OrginalDiskAdedi parametresi eklendi)
 */
export const calculateTumSiralar = ({ sistemHesabi, Q, hacim, lamellaData }) => {
    const siralar = [];
    let genelSiraNo = 1;

    if (!sistemHesabi) return siralar;

    sistemHesabi.dagilim.forEach((siraAdet, sIdx) => {
        const HRT = Q > 0 ? (((hacim * siraAdet) / Q) * 24).toFixed(2) : 0;

        const milBasinaDisk = sistemHesabi.sonMilDiskleri[sIdx];
        const orginalDiskAdedi = sistemHesabi.orijinalMilDiskleri[sIdx]; // Buradan okuyoruz

        siralar.push({
            isLamella: false,
            genelSiraNo: genelSiraNo++,
            siraTipi: sIdx,
            adet: siraAdet,
            milBasinaDisk: milBasinaDisk,
            OrginalDiskAdedi: orginalDiskAdedi, // <--- İstediğin parametre buraya eklendi
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