// utils/ekipmanTablosuHesap.js

export const ekipmanTabloHesap = (formData) => {
    // 1. İndirimler ve Genel Bilgiler
    const customerInfo = formData?.customerInfo;
    const teklifDili = formData?.customerInfo?.teklifDili || "Yabancı";

    // 2. Input Detayları
    const planetDiskDetails = formData.planetDiskDetails || {};
    const aritmaParametreleriObjesi = formData.planetDiskDetails?.tasarim?.aritmaParametreleri || {};
    const debiM3 = planetDiskDetails.debi || 0;
    const pikDebi = ((debiM3 / 24) * 2).toFixed(2) || 0;
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
    // 1. Sadece disk olanları filtrele ve milBasinaDisk değerlerine göre grupla

    const projeToplamDisk = yerlesimListesi
        .filter(y => y.isLamella === false)
        .reduce((sum, curr) => {
            const adet = parseInt(curr.adet) || 0;
            const milBasinaDisk = parseInt(curr.milBasinaDisk) || 0;

            return sum + (adet * milBasinaDisk);
        }, 0);
    // 2. Oluşan grupların anahtarlarını (disk sayılarını) al

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
        ? `${grupAnahtarlari[0]} disk / ünite` // Tek tip disk varsa
        : grupAnahtarlari.map(disk => `${disk} disk / ${diskGruplari[disk]} ünite`).join(" , "); // Farklı tip diskler varsa

    const milBasinaDisk = yerlesimListesi.find(y => y.isLamella === false)?.milBasinaDisk || 120;
    const rbcSiralari = yerlesimListesi.filter(y => !y.isLamella);
    const toplamMilAdet = rbcSiralari.reduce((sum, item) => sum + (parseInt(item.adet) || 0), 0);
    const toplamDiskSayisi = toplamMilAdet * milBasinaDisk;
    const beklemeSuresi = parseFloat(rbcSiralari[0]?.beklemeSuresi) || 0;

    // 4. Lamella detayları
    const lamellaObj = formData?.planetDiskDetails?.tasarim?.lamella || {};
    const lamellaAdet = parseInt(lamellaObj.lamellaAdet) || 0;
    const lamellaAlani = parseFloat(lamellaObj.secilenModelAlan) || 0;
    const lamellaHacim = parseFloat(lamellaObj.secilenModelHacim) || 0;
    const lamellaModeli = (lamellaObj.secilenLamellaModeli || "LS_45").replace("_", " ");

    const camurPompasiModel = lamellaObj.camurPompasi?.name;
    const camurPompasikW = lamellaObj.camurPompasi?.kw;
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
    const beslemePompasidebi = feedPumpObj.manualHourlyFlow;
    const beslemePompasimss = feedPumpObj.manualMinMss;
    const beslemePompasikw = feedPumpObj.pumpkW;
    const beslemePompasiAdi = feedPumpObj.secilenPompaMetni;
    const IsDebiDagitim = feedPumpObj.hasDistributionStructure;

    // 5.5. ileriAritmaObj Hesaplamaları
    const mixerData = ileriAritmaObj?.IleriAritmaTankMixerSelections;
    const dozajData = ileriAritmaObj?.IleriAritmaDozajSelections;
    const ileriAritmaPompaData = ileriAritmaObj?.IleriAritmaPumpSelections;

    const mikserAdeti = mixerData?.secilenMikserMetni ? parseInt(mixerData.secilenMikserMetni) || 1 : 1;
    const mikserkw = mixerData?.gerekliGucKw;
    const dozajPompaAdeti = parseInt(dozajData?.pompaAdedi) || 1;
    const dozajPompaKapasite = dozajData?.dozajPompasiKapasitesi;
    const dozajtankHacmi = dozajData?.kimyasalTankKapasitesi;
    const resirkulasyonPompaAdeti = parseInt(ileriAritmaPompaData?.pompaAdeti) || 1;
    const resirkulasyonPompaAdi = (ileriAritmaPompaData?.geridevirPompasi);
    const resirkulasyonPompakw = (ileriAritmaPompaData?.pumpkW);
    const resirkulasyonPompadebi = (ileriAritmaPompaData?.hesaplananDebi);
    const resirkulasyonPompamss = (ileriAritmaPompaData?.manualMinMss);
    const ToplamresirkulasyonPompaAdeti = resirkulasyonPompaAdeti * 2;

    // 5.6. filtrationObj Hesaplamaları
    const sistemAdet = parseInt(filtrationObj?.sistemAdet) || 1;
    const klorlama = filtrationObj?.onKlorlama || {};
    const klorlamakapasite = klorlama?.dozajPompasiKapasitesi
    const klorlamaTankkapasite = klorlama?.kimyasalTankKapasitesi

    const filtrebeslemePompasidebi = filtrationObj?.pompalar?.besleme?.debiM3h; // m3h oldu
    const filtrebeslemePompasikw = filtrationObj?.pompalar?.besleme?.kw;

    const geriYikamaPompasidebi = filtrationObj?.pompalar?.geriYikama?.debiM3h; // m3h oldu
    const geriYikamaPompasikw = filtrationObj?.pompalar?.geriYikama?.kw;

    const separatorFiltreDebi = filtrationObj?.SecilenFiltreler?.seperatorFiltre?.debiM3h; // m3h oldu
    const kumFiltresiDebi = filtrationObj?.SecilenFiltreler?.kumFiltre?.debiM3h; // m3h oldu
    const aktifKarbonFiltresiDebi = filtrationObj?.SecilenFiltreler?.aktifKarbonFiltre?.debiM3h; // m3h oldu

    // 5.7. camurOpsiyonlari Hesaplamaları
    const secilenCamurEkipmanTipi = sludgeObj?.ekipmanTipi;
    const secilenCamurEkipmanKapasite = sludgeObj?.anaEkipman?.kapasite_degeri || 0;
    const secilenCamurEkipmanKapasitebirimi = sludgeObj?.anaEkipman?.kapasite_birimi || 0;
    const camurBeslemePompasikapasite = sludgeObj?.beslemePompasi?.kapasite_degeri || 0;
    const camurSuzuntuBeslemePompasikapasite = sludgeObj?.suzuntuPompasi?.kapasite_degeri || 0;
    const polimerUnitesiObjesi = sludgeObj.polimerUnitesi || {};
    const polimerAdet = polimerUnitesiObjesi.adet || 0;
    const opsiyonlar = sludgeObj.opsiyonlar || {};

    const seciliOpsiyonYapilari = Object.entries(opsiyonlar)
        .filter(([key, value]) => value.secili === true) // Sadece true olanları filtrele
        .flatMap(([key, value], index) => {
            // İlk seçili öge için index 0 olacak, 23 ekleyerek "e23" yapıyoruz.
            // İkinci seçili öge için index 1 olacak, "e24" yapıyoruz.
            const currentNumber = 23 + index;
            const mainId = `e${currentNumber}`;
            const specPrefix = `s${currentNumber}`;

            return [
                { id: mainId, type: "equip", label: key, isUrgent: false },
                { id: `${specPrefix}_1`, type: "spec", label: "Miktar", value: `${value.adet || 1} Adet` },
                { id: `${specPrefix}_2`, type: "spec", label: "İmalatçı", value: "yazılacak.." },
                { id: `${specPrefix}_3`, type: "spec", label: "Kapasite", value: "yazılacak.." },
                { id: `${specPrefix}_4`, type: "spec", label: "Motor", value: "yazılacak.." }
            ];
        });

    const initialRows = [
        // Ana Başlık Her Zaman Render Edilir
        { id: "m1", type: "main", label: "MEKANİK EKİPMANLAR" },

        { id: "e1", type: "equip", label: izgaraTipi === "Manuel Izgara" ? "Elle Temizlemeli Kaba Izgara" : "Otomatik Temizlemeli Kaba Izgara", isUrgent: false },
        { id: "s1_1", type: "spec", label: "Miktar", value: "1 Adet" },
        { id: "s1_2", type: "spec", label: "Elek Aralığı", value: "30 mm" },
        { id: "s1_3", type: "spec", label: "Malzeme", value: izgaraTipi === "Manuel Izgara" ? "Galvaniz Kaplı ST37 Karbon Çelik" : "AISI 304 Paslanmaz Çelik" },
        { id: "s1_4", type: "spec", label: "tip", value: "Çubuk veya perfore tip ızgara" },

        { id: "e2", type: "equip", label: izgaraTipi === "Manuel Izgara" ? "Elle Temizlemeli İnce Izgara" : "Otomatik Temizlemeli İnce Izgara", isUrgent: false },
        { id: "s2_1", type: "spec", label: "Miktar", value: "1 Adet" },
        { id: "s2_2", type: "spec", label: "Elek Aralığı", value: "10 mm" },
        { id: "s2_3", type: "spec", label: "Malzeme", value: izgaraTipi === "Manuel Izgara" ? "Galvaniz Kaplı ST37 Karbon Çelik" : "AISI 304 Paslanmaz Çelik" },
        { id: "s2_4", type: "spec", label: "tip", value: "Çubuk veya perfore tip ızgara" },


        { id: "e3", type: "equip", label: "Kum-Yağ Tutucu Plakaları", isUrgent: false },
        { id: "s3_1", type: "spec", label: "Miktar", value: "4 Adet" },
        { id: "s3_2", type: "spec", label: "Malzeme", value: "Fiber (CTP) veya Polipropilen veya Kompozit" },
        { id: "s3_3", type: "spec", label: "Boyut", value: yagTutucuBoyut },

        { id: "e4", type: "equip", label: "Dengeleme Tankı Terfi Pompaları", isUrgent: false },
        { id: "s4_1", type: "spec", label: "Miktar", value: `${pompaAdeti}  asil + ${pompaAdeti} yedek` },
        { id: "s4_2", type: "spec", label: "Kapasite", value: `${beslemePompasidebi} m³/saat @ ${beslemePompasimss} mSS` },
        { id: "s4_3", type: "spec", label: "Motor", value: `${beslemePompasikw} kW` },
        { id: "s4_4", type: "spec", label: "Tip", value: `Dalgıç` },
        { id: "s4_5", type: "spec", label: "Marka", value: `${beslemePompasiAdi}` },
        { id: "s4_6", type: "spec", label: "Malzeme", value: "Döküm Gövde" },
        ...(IsDebiDagitim ? [
            { id: "e4", type: "equip", label: "Debi Dağıtım Yapısı", isUrgent: false },
            { id: "s4_1", type: "spec", label: "Miktar", value: "1 Adet" },
            { id: "s4_2", type: "spec", label: "Malzeme", value: "Fiber (CTP)" },
            { id: "s4_3", type: "spec", label: "tip", value: `${feedPumpObj.distributionCikisAdet} Çıkışlı` },
        ] : []),


        { id: `e5`, type: `equip`, label: `PlanetDISK® ${rbcModeli} DBD  Ünitesi - ${UniteTipi}`, isUrgent: false },
        { id: `s5_1`, type: `spec`, label: `Miktar`, value: ` ${toplamRbcAdeti} Adet` },
        { id: `s5_2`, type: `spec`, label: `Disk Çapı`, value: `${rbcModeli === "MINI" ? "1,30" : "2,05"} m` },
        { id: `s5_3`, type: `spec`, label: `Motor Gücü`, value: `${toplamRbcAdeti} x 0.37 kW` },
        { id: `s5_4`, type: `spec`, label: `Her bir Diskin Alanı`, value: `${rbcModeli === "MINI" ? "2,60" : "6,60"} m² / disk` },
        { id: `s5_5`, type: `spec`, label: `Her bir Ünitedeki Disk Sayısı`, value: `${uniteBasinaDiskSayisi} ` },
        { id: `s5_6`, type: `spec`, label: `Minimum Toplam Disk Alanı`, value: ` ${(projeToplamDisk * (rbcModeli === "MINI" ? 2.60 : 6.60)).toFixed(2)} m²` },
        { id: `s5_7`, type: `spec`, label: `Devir`, value: `3 – 4 devir/dakika` },
        { id: `s5_8`, type: `spec`, label: `Ünite Boyutları [Boy x En x Yük.]`, value: `3.350 x 2.370 x 2.650 mm` },
        { id: `s5_9`, type: `spec`, label: `Diskler`, value: `PP (Polipropilen), Sıfır Malzeme, Tek Parça Disk, Kalınlık: 1.5 mm - 2 mm` },
        { id: `s5_10`, type: `spec`, label: `Dolu Mil`, value: `Epoksi Boyalı AISI 1045 (C45) Karbon Çelik, çap: 85 mm` },
        { id: `s5_11`, type: `spec`, label: `Gövde`, value: `Fiberglass (CTP)` },
        { id: `s5_12`, type: `spec`, label: `Şase`, value: `Toz Boyalı Karbon Çelik` },
        { id: `s5_13`, type: `spec`, label: `Suya Temas Eden Parçalar`, value: `304 Kalite Paslanmaz Çelik` },
        { id: `s5_14`, type: `spec`, label: `RBC Ünitesi İmalatçısı`, value: `PlanetTEK Çevre ve Arıtma Teknolojileri A.Ş.` },
        { id: `s5_15`, type: `spec`, label: `Motor İmalatçısı`, value: `WAT veya muadili` },
        { id: `s5_16`, type: `spec`, label: `Redüktör İmalatçısı`, value: `PGR veya muadili` },

        { id: `e6`, type: `equip`, label: `${lamellaModeli} Lamella Seperatör Son Çöktürme Tankı`, isUrgent: false },
        { id: `s6_1`, type: `spec`, label: `Miktar`, value: ` ${lamellaAdet} Adet` },
        { id: `s6_2`, type: `spec`, label: `İmalat Malzemesi`, value: `Fiber Gövde & Toz Boyalı Karbon Çelik Şase` },
        { id: `s6_3`, type: `spec`, label: `Lamella Plaka Alanı`, value: `${lamellaAlani}  m²/tank` },
        { id: `s6_4`, type: `spec`, label: `Tank Hacmi`, value: `${lamellaHacim} m³/tank` },
        { id: `s6_5`, type: `spec`, label: `İmalatçı`, value: `PlanetTEK Çevre ve Arıtma Teknolojileri A.Ş` },
        { id: `s6_6`, type: `spec`, label: `Temizleme`, value: `Alta biriken çamur otomatik olarak çamur pompası aracılığı ile çekilir. Gerektiğinde lamella yüzeyleri basınçlı su ile manuel olarak yıkanır.` },

        { id: `e7`, type: `equip`, label: `Son Çöktürme Tankı Çamur Pompası`, isUrgent: false },
        { id: `s7_1`, type: `spec`, label: `Miktar`, value: ` ${lamellaAdet} Adet` },
        { id: `s7_2`, type: `spec`, label: `İmalatçı`, value: `Sumak veya Muadili` },
        { id: `s7_3`, type: `spec`, label: `Kapasite`, value: `10 m3/saat @ 8,1 Mss` },
        { id: `s7_4`, type: `spec`, label: `Motor`, value: `${camurPompasikW}  kw` },
        { id: `s7_5`, type: `spec`, label: `Tip`, value: `Santrifüj Tip` },


        ...(isIleriAritmaChecked ? [
            { id: "e8", type: "equip", label: "Resürkilasyon Pompası", isUrgent: false },
            { id: "s8_1", type: "spec", label: "Miktar", value: `${resirkulasyonPompaAdeti}  asil + ${resirkulasyonPompaAdeti} yedek` },
            { id: "s8_2", type: "spec", label: "Kapasite", value: `${resirkulasyonPompadebi} m³/saat @ ${resirkulasyonPompamss} mSS` },
            { id: "s8_3", type: "spec", label: "Motor", value: `${resirkulasyonPompakw} kW` },
            { id: "s8_4", type: "spec", label: "Tip", value: `Dalgıç` },
            { id: "s8_5", type: "spec", label: "Marka", value: `${resirkulasyonPompaAdi}` },
            { id: "s8_6", type: "spec", label: "Malzeme", value: "Döküm Gövde" },

            { id: "e9", type: "equip", label: "Denitrifikasyon Tankı Mikseri", isUrgent: false },
            { id: "s9_1", type: "spec", label: "Miktar", value: `${mikserAdeti} Adet` },
            { id: "s9_2", type: "spec", label: "Motor", value: `${mikserkw} kW` },
            { id: "s9_3", type: "spec", label: "Tip", value: `Dalgıç` },
            { id: "s9_4", type: "spec", label: "Marka", value: `...` },

            { id: "e10", type: "equip", label: "FeCl3 Dozaj Pompası", isUrgent: false },
            { id: "s10_1", type: "spec", label: "Miktar", value: `${dozajPompaAdeti} Adet` },
            { id: "s10_2", type: "spec", label: "Solüsyon", value: `Sıvı Klor` },
            { id: "s10_3", type: "spec", label: "Kapasite", value: `${dozajPompaKapasite}` },

            { id: "e11", type: "equip", label: "FeCl3 Solüsyon Tankı", isUrgent: false },
            { id: "s11_1", type: "spec", label: "Miktar", value: `${mikserAdeti} Adet` },
            { id: "s11_2", type: "spec", label: "Kapasite", value: `${dozajtankHacmi} lt` },
            { id: "s11_3", type: "spec", label: "Malzeme", value: `Polietilen` },

        ] : []),

        ...(isFiltrasyonChecked ? [
            { id: "e12", type: "equip", label: "Ön Klorlama Dozaj Pompası", isUrgent: false },
            { id: "s12_1", type: "spec", label: "Miktar", value: `${sistemAdet}  Adet` },
            { id: "s12_2", type: "spec", label: "Solüsyon", value: `Sıvı Klor` },
            { id: "s12_3", type: "spec", label: "Kapasite", value: `${klorlamakapasite}` },

            { id: "e13", type: "equip", label: "Ön Klorlama Solüsyon Tankı", isUrgent: false },
            { id: "s13_1", type: "spec", label: "Miktar", value: `${sistemAdet}  Adet` },
            { id: "s13_2", type: "spec", label: "Kapasite", value: `${klorlamaTankkapasite} lt` },
            { id: "s13_3", type: "spec", label: "Malzeme", value: `Polietilen` },

            { id: "e14", type: "equip", label: "Filtrasyon Sistemi Besleme", isUrgent: false },
            { id: "s14_1", type: "spec", label: "Miktar", value: `${sistemAdet}  asil + ${sistemAdet} yedek` },
            { id: "s14_2", type: "spec", label: "Kapasite", value: `${filtrebeslemePompasidebi} m³/saat @ 20-30 mSS` },
            { id: "s14_3", type: "spec", label: "Motor", value: `${filtrebeslemePompasikw} kW` },
            { id: "s14_4", type: "spec", label: "Pompa Tipi", value: "Santrifüj" },

            { id: "e15", type: "equip", label: "Filtrasyon Sistemi Geri Yıkama Pompası", isUrgent: false },
            { id: "s15_1", type: "spec", label: "Miktar", value: `${sistemAdet}  asil + ${sistemAdet} yedek` },
            { id: "s15_2", type: "spec", label: "Kapasite", value: `${geriYikamaPompasidebi} m³/saat @ 20-30 mSS` },
            { id: "s15_3", type: "spec", label: "Motor", value: `${geriYikamaPompasikw} kW` },
            { id: "s15_4", type: "spec", label: "Pompa Tipi", value: "Santrifüj" },

            { id: "e16", type: "equip", label: "Seperatör Filtre", isUrgent: false },
            { id: "16_1", type: "spec", label: "Miktar", value: `${sistemAdet}  Adet` },
            { id: "16_2", type: "spec", label: "Kapasite", value: `${separatorFiltreDebi} m³/saat ` },
            { id: "16_3", type: "spec", label: "Filtre Türü", value: `100 Mikron` },
            { id: "16_4", type: "spec", label: "Malzeme", value: `AISI 304 Paslanmaz Çelik` },

            { id: "e17", type: "equip", label: "Tam Otomatik Yüzey Borulamalı Kum Filtre Sistemi", isUrgent: false },
            { id: "s17_1", type: "spec", label: "Miktar", value: `${sistemAdet}  Adet` },
            { id: "s17_2", type: "spec", label: "Debi", value: `${kumFiltresiDebi} m³/saat` },
            { id: "s17_3", type: "spec", label: "Filtrasyon Kesit Hızı", value: "5-7 m/saat" },
            { id: "s17_4", type: "spec", label: "Vana Miktarı", value: "5 adet/tank" },
            { id: "s17_5", type: "spec", label: "Vana Kontrolü", value: "Elektrik Aktüatörlü" },
            { id: "s17_6", type: "spec", label: "Otomasyon", value: "Siemens Logo" },
            { id: "s17_7", type: "spec", label: "Tank Malzemesi", value: "Epoksi Boyalı ST37 Karbon Çelik/FRP Tank" },
            { id: "s17_8", type: "spec", label: "Borulama Malzemesi", value: "PVC" },
            { id: "s17_9", type: "spec", label: "Ters Yıkama Debisi", value: `${geriYikamaPompasidebi} m³/saat` },
            { id: "s17_10", type: "spec", label: "Test Basıncı", value: "9 bar" },
            { id: "s17_11", type: "spec", label: "Çalışma Basıncı", value: "2-6 bar" },

            { id: "e18", type: "equip", label: "Tam Otomatik Yüzey Borulamalı Aktif Karbon Filtre Sistemi", isUrgent: false },
            { id: "s18_1", type: "spec", label: "Miktar", value: `${sistemAdet}  Adet` },
            { id: "s18_2", type: "spec", label: "Debi", value: `${aktifKarbonFiltresiDebi} m³/saat` },
            { id: "s18_3", type: "spec", label: "Filtrasyon Kesit Hızı", value: "5-7 m/saat" },
            { id: "s18_4", type: "spec", label: "Vana Miktarı", value: "5 adet/tank" },
            { id: "s18_5", type: "spec", label: "Vana Kontrolü", value: "Elektrik Aktüatörlü" },
            { id: "s18_6", type: "spec", label: "Otomasyon", value: "Siemens Logo" },
            { id: "s18_7", type: "spec", label: "Tank Malzemesi", value: "Epoksi Boyalı ST37 Karbon Çelik/FRP Tank" },
            { id: "s18_8", type: "spec", label: "Borulama Malzemesi", value: "PVC" },
            { id: "s18_9", type: "spec", label: "Ters Yıkama Debisi", value: `${geriYikamaPompasidebi} m³/saat` },
            { id: "s18_10", type: "spec", label: "Test Basıncı", value: "9 bar" },
            { id: "s18_11", type: "spec", label: "Çalışma Basıncı", value: "2-6 bar" }


        ] : []),

        ...(isCamurAktif ? [

            { id: "e19", type: "equip", label: `${secilenCamurEkipmanTipi}`, isUrgent: false },
            { id: "s19_1", type: "spec", label: "Miktar", value: `1 Adet` },
            { id: "s19_2", type: "spec", label: "İmalatçı", value: secilenCamurEkipmanTipi === "Dekantör" ? `Polat ya da Haus` : "AES ya da Muadili" },
            { id: "s19_3", type: "spec", label: "Kapasite", value: `${secilenCamurEkipmanKapasite} ${secilenCamurEkipmanKapasitebirimi}` },
            ...(secilenCamurEkipmanTipi === "Filtrepres" ? [
                { id: "s19_4", type: "spec", label: "Plana Sayısı", value: `33` },
                { id: "s19_5", type: "spec", label: "Çalışma Şekli", value: `Elektrikli Hidrolik` }
            ] : []),
            { id: "s19_6", type: "spec", label: "Motor", value: secilenCamurEkipmanTipi === "Dekantör" ? `7,5 kW + 4 kW` : "2,2 kW Gamak" },
            { id: "s19_7", type: "spec", label: "Tip", value: secilenCamurEkipmanTipi === "Dekantör" ? `Santrifüj` : "Chamber" },

            { id: "e20", type: "equip", label: "Çamur Besleme Pompası", isUrgent: false },
            { id: "s20_1", type: "spec", label: "Miktar", value: `1 Adet` },
            { id: "s20_2", type: "spec", label: "İmalatçı", value: "Allweiler veya Muadili" },
            { id: "s20_3", type: "spec", label: "Kapasite", value: `${camurBeslemePompasikapasite} m³/saat` },
            { id: "s20_4", type: "spec", label: "Motor", value: `1,5 kW` },
            { id: "s20_5", type: "spec", label: "Pompa Tipi", value: "Santrifüj" },

            { id: "e21", type: "equip", label: "Süzüntü Suyu Pompası", isUrgent: false },
            { id: "s21_1", type: "spec", label: "Miktar", value: `1 Adet` },
            { id: "s11_2", type: "spec", label: "İmalatçı", value: "City Pumps Ranger ya da muadili" },
            { id: "s21_2", type: "spec", label: "Kapasite", value: `${camurSuzuntuBeslemePompasikapasite} m³/saat` },
            { id: "s21_3", type: "spec", label: "Motor", value: `0.75 kW` },
            { id: "s21_4", type: "spec", label: "Pompa Tipi", value: "Dalgıç" },

            { id: "e22", type: "equip", label: "Poli Dozlama Ünitesi", isUrgent: false },
            { id: "s22_1", type: "spec", label: "Miktar", value: `1 Adet` },
            { id: "s22_2", type: "spec", label: "İmalatçı", value: `PlanetTEK` },
            { id: "s22_3", type: "spec", label: "Kapasite", value: `200 lt/sa` },
            { id: "s22_4", type: "spec", label: "Motor", value: `1.1 kW` },
            { id: "s21_5", type: "spec", label: "Tipi", value: "Solüsyon tankı ve dozlama ünitesi" },

            ...seciliOpsiyonYapilari
        ] : []),


        { id: "m2", type: "main", label: "İNŞAAT İŞLERİ" },

        { id: "e01", type: "equip", label: "Izgara Kanalı", isUrgent: true },
        { id: "s01_1", type: "spec", label: "Miktar", value: "1 Adet" },
        { id: "s01_2", type: "spec", label: "Kapasite", value: `${(pikDebi / 2).toFixed(0)} m³ ıslak hacim` },
        { id: "s01_3", type: "spec", label: "Malzeme", value: "Betonarme" },
        { id: "s01_4", type: "spec", label: "Bekleme Süresi", value: `${pikDebi} m³/saat pik debide 30 dakika` },

        ...(isIleriAritmaChecked ? [
            { id: "e02", type: "equip", label: "Anoksik Denitrifikasyon Tankı", isUrgent: true },
            { id: "s02_1", type: "spec", label: "Miktar", value: "1 Adet" },
            { id: "s02_2", type: "spec", label: "Kapasite", value: `${(geriYikamaPompasidebi * 4).toFixed(0)} m³ ıslak hacim` },
            { id: "s02_3", type: "spec", label: "Malzeme", value: "Betonarme" },
            { id: "s02_4", type: "spec", label: "Bekleme Süresi", value: `${geriYikamaPompasidebi} m³/saat debide 4 saat` },

        ] : []),


        { id: "e03", type: "equip", label: "Birinci Çöktürme Tankı", isUrgent: true },
        { id: "s03_1", type: "spec", label: "Miktar", value: "1 Adet" },
        { id: "s03_2", type: "spec", label: "Kapasite", value: `${(pikDebi * 2.5).toFixed(0)} m³ ıslak hacim` },
        { id: "s03_3", type: "spec", label: "Malzeme", value: "Betonarme" },
        { id: "s03_4", type: "spec", label: "Bekleme Süresi", value: `${pikDebi} m³/saat pik debide 2,5 saat` },

        { id: "e04", type: "equip", label: "İkinci Çöktürme Tankı", isUrgent: true },
        { id: "s04_1", type: "spec", label: "Miktar", value: "1 Adet" },
        { id: "s04_2", type: "spec", label: "Kapasite", value: `${(pikDebi * 2).toFixed(0)} m³ ıslak hacim` },
        { id: "s04_3", type: "spec", label: "Malzeme", value: "Betonarme" },
        { id: "s04_4", type: "spec", label: "Bekleme Süresi", value: `${pikDebi} m³/saat pik debide 2 saat` },

        { id: "e05", type: "equip", label: "Dengeleme Tankı", isUrgent: true },
        { id: "s05_1", type: "spec", label: "Miktar", value: "1 Adet" },
        { id: "s05_2", type: "spec", label: "Kapasite", value: `${(pikDebi * 2).toFixed(0)} m³ ıslak hacim` },
        { id: "s05_3", type: "spec", label: "Malzeme", value: "Betonarme" },
        { id: "s05_4", type: "spec", label: "Bekleme Süresi", value: `${pikDebi} m³/saat pik debide 2 saat` },

        ...(isFiltrasyonChecked ? [
            { id: "e06", type: "equip", label: "Arıtılmış Su Tankı", isUrgent: true },
            { id: "s06_1", type: "spec", label: "Miktar", value: "1 Adet" },
            { id: "s06_2", type: "spec", label: "Kapasite", value: `${pikDebi} m³ ıslak hacim` },
            { id: "s06_3", type: "spec", label: "Malzeme", value: "Betonarme" },
            { id: "s06_4", type: "spec", label: "Bekleme Süresi", value: `${pikDebi} m³/saat pik debide 1 saat` },

            { id: "e07", type: "equip", label: "Filtrelenmiş Su Tankı", isUrgent: true },
            { id: "s07_1", type: "spec", label: "Miktar", value: "1 Adet" },
            { id: "s07_2", type: "spec", label: "Kapasite", value: `Tank kapasitesi müşterini talebine göre seçilecektir` },
            { id: "s07_3", type: "spec", label: "Malzeme", value: "Betonarme" },
            { id: "s07_4", type: "spec", label: "Bekleme Süresi", value: `Sulama ihtiyacı kadar hacim seçilmesi tavsiye edilir` },

        ] : []),


    ];

    return initialRows.filter(Boolean);
}; 