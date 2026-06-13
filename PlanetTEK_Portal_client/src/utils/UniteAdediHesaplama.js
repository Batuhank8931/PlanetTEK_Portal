/**
 * Toplam gerekli disk alanına ve hidrolik bekleme süresi (HRT) kriterine göre
 * ideal ünite sayısını hesaplayan saf fonksiyon.
 * * @param {Object} params
 * @param {number} params.toplamGerekliDisk - Tüm kademeler için gereken toplam disk adedi
 * @param {number} params.maxDiskAdedi - Bir mildeki maksimum disk sınırı (örn: 135)
 * @param {number} params.minDiskAdedi - Bir mildeki minimum disk sınırı (örn: 100)
 * @param {number} params.Q - Toplam Giriş Debisi (m³/gün)
 * @param {number} params.hacim - Seçilen tek bir ünite hacmi (m³)
 * @param {number} params.minimumBeklemeSuresi - İstenen minimum HRT eşiği (saat, örn: 1.28)
 * @param {number} params.varsayilanSira - Paralel hat/sıra adedi (örn: 2)
 * @returns {number} Hesaplanan ideal ünite sayısı
 */
export function hesaplaIdealUniteAdedi({
    toplamGerekliDisk,
    maxDiskAdedi,
    minDiskAdedi,
    Q,
    hacim,
    minimumBeklemeSuresi = 1.28,
    varsayilanSira = 1
}) {
    // 0. Koruma: Disk adedi girilmemişse veya 0 ise hesaplamaya gerek yok
    if (!toplamGerekliDisk || toplamGerekliDisk === 0) return 1;

    // 1. Adım: Sadece disk alanına/sınırına göre gereken minimum ünite sayısı
    let idealUniteSayisi = Math.ceil(toplamGerekliDisk / maxDiskAdedi);

    // 2. Adım: HRT Kontrolü ve Dinamik Ünite Artırımı
    if (Q > 0 && hacim > 0 && varsayilanSira > 0) {
        let hrtKriteriSaglandi = false;
        
        // Güvenlik sınırı: Aşırı ünite artışını ve sonsuz döngüyü engellemek için
        const maxGuvenlikSiniri = Math.ceil(toplamGerekliDisk / minDiskAdedi) * 5; 

        while (!hrtKriteriSaglandi && idealUniteSayisi <= maxGuvenlikSiniri) {
            let kalanUniteSim = idealUniteSayisi;
            let enKucukSiraUniteAdedi = Infinity;

            // Mevcut ünite sayısını paralel sıralara dağıtıyoruz
            for (let s = 0; s < varsayilanSira; s++) {
                const siraPayi = Math.ceil(kalanUniteSim / (varsayilanSira - s));
                if (siraPayi < enKucukSiraUniteAdedi) {
                    enKucukSiraUniteAdedi = siraPayi;
                }
                kalanUniteSim -= siraPayi;
            }

            // --- HİDROLİK HESAPLAMA (KRİTİK NOKTA) ---
            // Toplam debi paralel sıralara eşit bölünür.
            const siraBasinaDebi = Q / varsayilanSira; 
            
            // En az üniteye sahip (en küçük hacimli) sıranın toplam hacmi
            const enKucukSiraHacmi = hacim * enKucukSiraUniteAdedi; 
            
            // HRT = (Hacim / Debi) * 24 (Saat cinsine çevirmek için)
            const simulasyonHRT = (enKucukSiraHacmi / siraBasinaDebi) * 24;

            // --- KONTROL VE ARTIRMA MANTIĞI ---
            // Eğer hesaplanan süre, istenen minimum bekleme süresinden KÜÇÜKSE (Su çok hızlı geçiyorsa)
            if (simulasyonHRT < minimumBeklemeSuresi) {
                idealUniteSayisi++; // Ünite sayısını artır ki hacim büyüsün, su yavaşlasın.
            } else {
                hrtKriteriSaglandi = true; // Süre kurtardı, döngüden çıkabiliriz.
            }
        }
    }

    return idealUniteSayisi;
}