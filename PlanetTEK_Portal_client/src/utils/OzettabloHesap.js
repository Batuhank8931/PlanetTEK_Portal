// utils/OzettabloHesap.js

export const ozetTabloHesap = (formData) => {
    // 1. İndirimler ve Genel Bilgiler
    const customerInfo = formData?.customerInfo;
    const teklifDili = formData?.customerInfo?.teklifDili || "Yabancı";

    const teklifNo = formData.customerInfo.teklifNo;
    const refNO = formData.customerInfo.offer_number;

    // 2. Input Detayları
    const planetDiskDetails = formData.planetDiskDetails || {};
    const aritmaParametreleriObjesi = formData.planetDiskDetails?.tasarim?.aritmaParametreleri || {};
    const debiM3 = planetDiskDetails.debi || 0;
    const girisBoi = aritmaParametreleriObjesi.girisBoi || 0;
    const sicaklik = aritmaParametreleriObjesi.sicaklik || 0;
    const organikYukKg = ((debiM3 * girisBoi) / 1000).toFixed(0);
    const atiksuType = aritmaParametreleriObjesi.atiksutype || "evsel";

    // 3. Toplam RBC adet hesabı
    const rbcModeli = planetDiskDetails?.tasarim?.aritmaParametreleri?.RBCUnite || "MX";
    const UniteTipi = planetDiskDetails.tasarim?.aritmaParametreleri?.kasaTipi || "Kapaklı";
    const yerlesimListesi = planetDiskDetails?.tasarim?.yerlesimSiralanisi || [];
    const toplamRbcAdeti = yerlesimListesi
        .filter(y => y.isLamella === false)
        .reduce((sum, curr) => sum + (parseInt(curr.adet) || 0), 0);
    const milBasinaDisk = yerlesimListesi.find(y => y.isLamella === false)?.milBasinaDisk || 120;
    const rbcSiralari = yerlesimListesi.filter(y => !y.isLamella);
    const toplamMilAdet = rbcSiralari.reduce((sum, item) => sum + (parseInt(item.adet) || 0), 0);
    const toplamDiskSayisi = toplamMilAdet * milBasinaDisk;
    const beklemeSuresi = parseFloat(rbcSiralari[0]?.beklemeSuresi) || 0;

    const projeToplamDisk = yerlesimListesi
        .filter(y => y.isLamella === false)
        .reduce((sum, curr) => {
            const adet = parseInt(curr.adet) || 0;
            const milBasinaDisk = parseInt(curr.milBasinaDisk) || 0;

            return sum + (adet * milBasinaDisk);
        }, 0);


    const diskGruplari = yerlesimListesi
        .filter(y => y.isLamella === false)
        .reduce((acc, curr) => {
            const diskSayisi = parseInt(curr.milBasinaDisk) || 0;
            const adet = parseInt(curr.adet) || 0;

            if (diskSayisi > 0) {
                acc[diskSayisi] = (acc[diskSayisi] || 0) + adet;
            }
            return acc;
        }, {}); // Örn çıktı: { "100": 2 } veya { "100": 5, "110": 6 }


    const grupAnahtarlari = Object.keys(diskGruplari);

    // 3. Grup sayısına göre string'i oluştur
    const uniteBasinaDiskSayisi = grupAnahtarlari.length === 1
        ? `${grupAnahtarlari[0]}` // Tek tip disk varsa
        : grupAnahtarlari.map(disk => `${disk} disk / ${diskGruplari[disk]} ünite`).join(" , "); // Farklı tip diskler varsa

    const uniteBasinaDiskAlani = grupAnahtarlari.length === 1
        ? `${(grupAnahtarlari[0] * (rbcModeli === "MINI" ? 2.6 : 6.6)).toFixed(2)}` // Tek tip disk varsa
        : grupAnahtarlari.map(disk => `${disk * (rbcModeli === "MINI" ? 2.6 : 6.6)} m² / ${diskGruplari[disk]} ünite`).join(" , "); // Farklı tip diskler varsa


    // 4. Lamella detayları
    const lamellaObj = formData?.planetDiskDetails?.tasarim?.lamella || {};
    const lamellaAdet = parseInt(lamellaObj.lamellaAdet) || 0;
    const lamellaAlani = parseFloat(lamellaObj.secilenModelAlan) || 0;
    const lamellaModeli = (lamellaObj.secilenLamellaModeli || "LS_45").replace("_", " ");

    // 5. Ekipman detayları

    const equipmentsObject = formData.equipments || {};
    const { modulesState = {} } = equipmentsObject;

    // 5.1 Modül Aktiflik Kontrolleri (Checkbox durumları)
    const isOnAritmaChecked = modulesState.onAritma?.checked || false;
    const isFeedPumpChecked = modulesState.feedPump?.checked || false;
    const isIleriAritmaChecked = modulesState.ileriAritma?.checked || false;
    const isFiltrasyonChecked = modulesState.filtrasyon?.checked || false;
    const isCamurAktif = modulesState.sludgeDewatering?.checked || false;

    // 5.2. Alt Ekipman Alt Nesneleri
    const onAritmaObj = equipmentsObject.onAritma || {};
    const feedPumpObj = equipmentsObject.feedPump || {};
    const ileriAritmaObj = equipmentsObject.ileriAritma || {};
    const filtrationObj = equipmentsObject.filtrationSystem || {};
    const sludgeObj = equipmentsObject.sludgeDewatering || {};
    const camurOpsiyonlari = sludgeObj.opsiyonlar || {};

    // 5.3. onAritmaObj Hesaplamaları
    const izgaraTipi = onAritmaObj.izgaraTipi || "";
    const yagTutucuBoyut = onAritmaObj.yagTutucuBoyut || "";

    // 5.4. feedPumpObj Hesaplamaları
    const pompaAdeti = parseInt(feedPumpObj.pompaAdeti) || 0;
    const ToplamFeedpompaAdeti = pompaAdeti * 2; // Asil + Yedek mantığı

    // 5.5. ileriAritmaObj Hesaplamaları
    const mixerData = ileriAritmaObj?.IleriAritmaTankMixerSelections;
    const dozajData = ileriAritmaObj?.IleriAritmaDozajSelections;
    const ileriAritmaPompaData = ileriAritmaObj?.IleriAritmaPumpSelections;

    const mikserAdeti = mixerData?.secilenMikserMetni ? parseInt(mixerData.secilenMikserMetni) || 1 : 1;
    const dozajPompaAdeti = parseInt(dozajData?.pompaAdedi) || 1;
    const resirkulasyonPompaAdeti = parseInt(ileriAritmaPompaData?.pompaAdeti) || 1;
    const ToplamresirkulasyonPompaAdeti = resirkulasyonPompaAdeti * 2;

    // 5.6. filtrationObj Hesaplamaları
    const sistemAdet = parseInt(filtrationObj?.sistemAdet) || 1;
    const klorlama = filtrationObj?.onKlorlama || {};
    const beslemePompasi = filtrationObj?.pompalar?.besleme || {};
    const geriYikamaPompasi = filtrationObj?.pompalar?.geriYikama || {};
    const separatorFiltre = filtrationObj?.SecilenFiltreler?.seperatorFiltre || {};
    const kumFiltresi = filtrationObj?.SecilenFiltreler?.kumFiltre || {};
    const aktifKarbonFiltresi = filtrationObj?.SecilenFiltreler?.aktifKarbonFiltre || {};

    // 5.7. camurOpsiyonlari Hesaplamaları
    const secilenCamurEkipmanTipi = sludgeObj?.ekipmanTipi;
    const polimerUnitesiObjesi = sludgeObj.polimerUnitesi || {};
    const polimerAdet = polimerUnitesiObjesi.adet || 0;
    const opsiyonlar = sludgeObj.opsiyonlar || {};

    const formatDate = () => {
        return new Intl.DateTimeFormat('tr-TR', {
            year: 'numeric'
        }).format(new Date()).replace(/\./g, ' ');
        // Intl.DateTimeFormat her zaman sistemin o anki taze yılını (örn: 2026) dinamik olarak alır.
    };

    const initialGeneralInfo = {
        offerNo: `${formatDate()} / ${teklifNo} `,
        refNo: refNO,
        clientName: customerInfo?.ticariUnvan || "-",
    };

    const initialParams = [
        { id: 1, label: "- Atıksu Kaynağı", value: "Yalnızca kişisel kullanımdan kaynaklanan evsel atıksulara göre tasarım yapılmış olup, hayvanlardan kaynaklanan atıksular, klorlu havuz suları ve yağmur suları hesaba dahil edilmemiştir.", unit: "", isLongText: true },
        { id: 2, label: "- Nihai Kullanım Amacı", value: filtrationObj ? "Sulama/Geri Kazanım" : "Deşarj", unit: "" },
        { id: 3, label: "- Hidrolik Yük", value: debiM3.toFixed(2), unit: "m³/gün" },
        { id: 4, label: "- Saatlik Debi", value: (debiM3 / 24).toFixed(2), unit: "m³/saat" },
        { id: 5, label: "- Pik Debi", value: ((debiM3 / 24) * 2).toFixed(2), unit: "m³/saat" },
        { id: 6, label: "- Organik Yük", value: organikYukKg, unit: "kg/gün" },
        { id: 7, label: "- Atıksu Sıcaklığı", value: String(sicaklik || "19"), unit: "°C" },
        { id: 8, label: "- PlanetDISK® Ünitesi Alıkonma Süresi", value: beklemeSuresi.toFixed(2), unit: "saat" },
        { id: 9, label: `- PlanetDISK® ${rbcModeli || 'MX'} 1 DBD Ünitesi Sayısı`, value: String(toplamMilAdet), unit: "adet" },
        { id: 10, label: "- Disk Adedi", value: uniteBasinaDiskSayisi, unit: "adet/ünite" },
        { id: 11, label: "- Disk Çapı", value: rbcModeli === "MINI" ? "1,30" : "2,05", unit: "m" },
        { id: 12, label: "- 1 Diskin Yüzey Alanı", value: rbcModeli === "MINI" ? "2,60" : "6,60", unit: "m²/disk" },
        { id: 13, label: `- PlanetDISK® ${rbcModeli || 'MX'} 1 DBD Ünitesi Yüzey Alanı`, value: uniteBasinaDiskAlani, unit: "m²/ünite" },
        { id: 14, label: "- Bu Projedeki Toplam Disk Yüzey Alanı", value: (projeToplamDisk * (rbcModeli === "MINI" ? 2.6 : 6.6)).toFixed(2), unit: "m²" },
        { id: 15, label: `- Lamella Seperatör ${lamellaModeli} Son Çöktürme Tankı`, value: String(lamellaAdet), unit: "adet" },
        { id: 16, label: `- 1 Adet Lamella Seperatör ${lamellaModeli} Son Çöktürme Tankı`, value: lamellaAlani.toFixed(0), unit: "m²/ünite" },
        { id: 17, label: `- Lamella Seperatör ${lamellaModeli} Son Çöktürme Tankı Toplam Yüzey Alanı`, value: (lamellaAlani * lamellaAdet).toFixed(0), unit: "m²" }
    ];

    const initialContent = [
        { id: 1, isChecked: modulesState.onAritma?.checked || false, qty: "1", unit: "set", desc: izgaraTipi === "Manuel Izgara" ? "Elle Temizlemeli Kaba Izgara" : "Otomatik Temizlemeli Kaba Izgara" },
        { id: 2, isChecked: modulesState.onAritma?.checked || false, qty: "1", unit: "set", desc: izgaraTipi === "Manuel Izgara" ? "Elle Temizlemeli İnce Izgara" : "Otomatik Temizlemeli İnce Izgara" },
        { id: 3, isChecked: modulesState.onAritma?.checked || false, qty: "4", unit: "adet", desc: "Kum-Yağ Tutucu Plakaları" },
        { id: 4, isChecked: modulesState.feedPump?.checked || false, qty: ToplamFeedpompaAdeti, unit: "adet", desc: "Dengeleme Tankı Terfi Pompaları" },
        { id: 5, isChecked: true, qty: String(toplamMilAdet), unit: "adet", desc: `PlanetDISK® ${rbcModeli || 'MX'} 1 DBD Ünitesi` },
        { id: 6, isChecked: true, qty: String(toplamMilAdet), unit: "adet", desc: `PlanetDISK® ${rbcModeli || 'MX'} 1 DBD Ünitesi Kapağı` },
        { id: 7, isChecked: lamellaAdet > 0, qty: String(lamellaAdet), unit: "adet", desc: `${lamellaModeli} Lamella Seperatör Son Çöktürme Tankı` },
        { id: 8, isChecked: lamellaAdet > 0, qty: String(lamellaAdet), unit: "adet", desc: `${lamellaModeli} Lamella Seperatör Son Çöktürme Tankı Çamur Pompası` },
        ...(isIleriAritmaChecked ? [
            { id: 9, isChecked: true, qty: dozajPompaAdeti, unit: "set", desc: "FeCl3 Koagülant Dozaj Sistemi" },
            { id: 10, isChecked: true, qty: ToplamresirkulasyonPompaAdeti, unit: "adet", desc: "Resürkilasyon Pompası " },
            { id: 11, isChecked: true, qty: mikserAdeti, unit: "adet", desc: "Denitrifikasyon Tankı Mikseri " },
        ] : []),
        ...(isFiltrasyonChecked ? [
            { id: 11, isChecked: true, qty: sistemAdet, unit: "set", desc: "Ön Klorlama Sistemi" },
            { id: 12, isChecked: true, qty: sistemAdet, unit: "adet", desc: "Filtrasyon Besleme Pompası" },
            { id: 13, isChecked: true, qty: sistemAdet, unit: "adet", desc: "Geri Yıkama Pompası" },
            { id: 14, isChecked: true, qty: sistemAdet, unit: "adet", desc: "Seperatör Filtre" },
            { id: 15, isChecked: true, qty: sistemAdet, unit: "adet", desc: "Tam Otomatik Multimedia Filtrasyon Sistemi" },
            { id: 16, isChecked: true, qty: sistemAdet, unit: "adet", desc: "Tam Otomatik Aktif Karbon Filtrasyon Sistemi" },
        ] : []),
        ...(isCamurAktif ? [
            // Sabit olan çamur ekipmanları
            { id: 17, isChecked: true, qty: "1", unit: "adet", desc: secilenCamurEkipmanTipi },
            { id: 18, isChecked: true, qty: polimerAdet, unit: "set", desc: "Polimer Ünitesi" },
            { id: 19, isChecked: true, qty: "1", unit: "adet", desc: "Çamur Besleme Pompası" },
            { id: 20, isChecked: true, qty: "1", unit: "adet", desc: "Süzüntü Suyu Pompası" },

            // Dinamik ve çakışmayan ID'li opsiyonlar
            ...Object.entries(opsiyonlar || {})
                .filter(([key, value]) => value.secili === true)
                .map(([key, value], index) => ({
                    // index 0'dan başlar; 0 ise 20.1, 1 ise 20.2 olur
                    id: `20.${index + 1}`,
                    isChecked: true,
                    qty: String(value.adet || 1),
                    unit: "adet",
                    desc: key
                }))
        ] : []),

        { id: 21, isChecked: false, qty: "", unit: "", desc: "İnşaat İşleri – idare tarafından yapılacaktır", isHeaderStyle: true },
        { id: 22, isChecked: true, qty: "1", unit: "set", desc: "Borulama & Elektrik İşleri" },
        { id: 23, isChecked: true, qty: "1", unit: "adet", desc: "PlanetDISK® Kontrol Panosu" },
        ...(teklifDili === "yerli" ? [
            { id: 24, isChecked: true, qty: "1", unit: "set", desc: "Proje Onay Dosyasının Hazırlanması ve Onayının Alınması (Harçlar Hariç)" },
        ] : []),
        { id: 25, isChecked: true, qty: "", unit: "-", desc: "Proje ve Mühendislik, Devreye Alma ve Eğitim Verilmesi" }
    ];

    return { generalInfo: initialGeneralInfo, params: initialParams, content: initialContent };
};