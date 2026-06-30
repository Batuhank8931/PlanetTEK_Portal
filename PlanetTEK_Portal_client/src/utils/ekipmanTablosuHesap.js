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
    const UniteTipi = planetDiskDetails.tarim?.aritmaParametreleri?.kasaTipi || "Kapaklı";
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
        }, {});


    const grupAnahtarlari = Object.keys(diskGruplari);

    // 3. Grup sayısına göre string'i oluştur
    const uniteBasinaDiskSayisi = grupAnahtarlari.length === 1
        ? (teklifDili === "Yabancı" ? `${grupAnahtarlari[0]} discs / unit` : `${grupAnahtarlari[0]} disk / ünite`)
        : grupAnahtarlari.map(disk =>
            teklifDili === "Yabancı"
                ? `${disk} discs / ${diskGruplari[disk]} units`
                : `${disk} disk / ${diskGruplari[disk]} ünite`
        ).join(" , ");

    const milBasinaDisk = (yerlesimListesi.find(y => y && y.isLamella === false))?.milBasinaDisk || 120;
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

    // 5.1 Modül Aktiflik Kontrolleri
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
    const ToplamFeedpompaAdeti = pompaAdeti * 2;
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

    const filtrebeslemePompasidebi = filtrationObj?.pompalar?.besleme?.debiM3h;
    const filtrebeslemePompasikw = filtrationObj?.pompalar?.besleme?.kw;

    const geriYikamaPompasidebi = filtrationObj?.pompalar?.geriYikama?.debiM3h;
    const geriYikamaPompasikw = filtrationObj?.pompalar?.geriYikama?.kw;

    const separatorFiltreDebi = filtrationObj?.SecilenFiltreler?.seperatorFiltre?.debiM3h;
    const kumFiltresiDebi = filtrationObj?.SecilenFiltreler?.kumFiltre?.debiM3h;
    const aktifKarbonFiltresiDebi = filtrationObj?.SecilenFiltreler?.aktifKarbonFiltre?.debiM3h;

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
        .filter(([key, value]) => value.secili === true)
        .flatMap(([key, value], index) => {
            const currentNumber = 23 + index;
            const mainId = `e${currentNumber}`;
            const specPrefix = `s${currentNumber}`;

            return [
                { id: mainId, type: "equip", label: key, isUrgent: false },
                { id: `${specPrefix}_1`, type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? `${value.adet || 1} Unit(s)` : `${value.adet || 1} Adet` },
                { id: `${specPrefix}_2`, type: "spec", label: teklifDili === "Yabancı" ? "Manufacturer" : "İmalatçı", value: teklifDili === "Yabancı" ? "TBD" : "yazılacak.." },
                { id: `${specPrefix}_3`, type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: teklifDili === "Yabancı" ? "TBD" : "yazılacak.." },
                { id: `${specPrefix}_4`, type: "spec", label: teklifDili === "Yabancı" ? "Motor" : "Motor", value: teklifDili === "Yabancı" ? "TBD" : "yazılacak.." }
            ];
        });

    const initialRows = [
        // Ana Başlık
        { id: "m1", type: "main", label: teklifDili === "Yabancı" ? "MECHANICAL EQUIPMENTS" : "MEKANİK EKİPMANLAR" },

        {
            id: "e1",
            type: "equip",
            label: izgaraTipi === "Manuel Izgara"
                ? (teklifDili === "Yabancı" ? "Manually Cleaned Coarse Screen" : "Elle Temizlemeli Kaba Izgara")
                : (teklifDili === "Yabancı" ? "Automatically Cleaned Coarse Screen" : "Otomatik Temizlemeli Kaba Izgara"),
            isUrgent: false
        },
        { id: "s1_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? "1 Unit" : "1 Adet" },
        { id: "s1_2", type: "spec", label: teklifDili === "Yabancı" ? "Bar Spacing" : "Elek Aralığı", value: "30 mm" },
        {
            id: "s1_3",
            type: "spec",
            label: teklifDili === "Yabancı" ? "Material" : "Malzeme",
            value: izgaraTipi === "Manuel Izgara"
                ? (teklifDili === "Yabancı" ? "Galvanized ST37 Carbon Steel" : "Galvaniz Kaplı ST37 Karbon Çelik")
                : "AISI 304 Stainless Steel"
        },
        { id: "s1_4", type: "spec", label: teklifDili === "Yabancı" ? "Type" : "tip", value: teklifDili === "Yabancı" ? "Bar or perforated type screen" : "Çubuk veya perfore tip ızgara" },

        {
            id: "e2",
            type: "equip",
            label: izgaraTipi === "Manuel Izgara"
                ? (teklifDili === "Yabancı" ? "Manually Cleaned Fine Screen" : "Elle Temizlemeli İnce Izgara")
                : (teklifDili === "Yabancı" ? "Automatically Cleaned Fine Screen" : "Otomatik Temizlemeli İnce Izgara"),
            isUrgent: false
        },
        { id: "s2_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? "1 Unit" : "1 Adet" },
        { id: "s2_2", type: "spec", label: teklifDili === "Yabancı" ? "Bar Spacing" : "Elek Aralığı", value: "10 mm" },
        {
            id: "s2_3",
            type: "spec",
            label: teklifDili === "Yabancı" ? "Material" : "Malzeme",
            value: izgaraTipi === "Manuel Izgara"
                ? (teklifDili === "Yabancı" ? "Galvanized ST37 Carbon Steel" : "Galvaniz Kaplı ST37 Karbon Çelik")
                : "AISI 304 Stainless Steel"
        },
        { id: "s2_4", type: "spec", label: teklifDili === "Yabancı" ? "Type" : "tip", value: teklifDili === "Yabancı" ? "Bar or perforated type screen" : "Çubuk veya perfore tip ızgara" },

        { id: "e3", type: "equip", label: teklifDili === "Yabancı" ? "Grit-Grease Trap Baffles" : "Kum-Yağ Tutucu Plakaları", isUrgent: false },
        { id: "s3_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? "4 Units" : "4 Adet" },
        { id: "s3_2", type: "spec", label: teklifDili === "Yabancı" ? "Material" : "Malzeme", value: teklifDili === "Yabancı" ? "Fiberglass (GRP) or Polypropylene or Composite" : "Fiber (CTP) veya Polipropilen veya Kompozit" },
        { id: "s3_3", type: "spec", label: teklifDili === "Yabancı" ? "Dimension" : "Boyut", value: yagTutucuBoyut },

        { id: "e4", type: "equip", label: teklifDili === "Yabancı" ? "Equalization Tank Feed Pumps" : "Dengeleme Tankı Terfi Pompaları", isUrgent: false },
        { id: "s4_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? `${pompaAdeti} Duty + ${pompaAdeti} Standby` : `${pompaAdeti}  asil + ${pompaAdeti} yedek` },
        { id: "s4_2", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: `${beslemePompasidebi} m³/hour @ ${beslemePompasimss} mSS` },
        { id: "s4_3", type: "spec", label: teklifDili === "Yabancı" ? "Motor" : "Motor", value: `${beslemePompasikw} kW` },
        { id: "s4_4", type: "spec", label: teklifDili === "Yabancı" ? "Type" : "Tip", value: teklifDili === "Yabancı" ? "Submersible" : "Dalgıç" },
        { id: "s4_5", type: "spec", label: teklifDili === "Yabancı" ? "Brand" : "Marka", value: `${beslemePompasiAdi}` },
        { id: "s4_6", type: "spec", label: teklifDili === "Yabancı" ? "Material" : "Malzeme", value: teklifDili === "Yabancı" ? "Cast Iron Body" : "Döküm Gövde" },
        ...(IsDebiDagitim ? [
            { id: "e4", type: "equip", label: teklifDili === "Yabancı" ? "Flow Distribution Structure" : "Debi Dağıtım Yapısı", isUrgent: false },
            { id: "s4_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? "1 Unit" : "1 Adet" },
            { id: "s4_2", type: "spec", label: teklifDili === "Yabancı" ? "Material" : "Malzeme", value: "Fiberglass (GRP)" },
            { id: "s4_3", type: "spec", label: teklifDili === "Yabancı" ? "Type" : "tip", value: teklifDili === "Yabancı" ? `With ${feedPumpObj.distributionCikisAdet} Outlets` : `${feedPumpObj.distributionCikisAdet} Çıkışlı` },
        ] : []),

        { id: `e5`, type: `equip`, label: `PlanetDISK® ${rbcModeli} DBD Unit - ${UniteTipi === "Kapaklı" && teklifDili === "Yabancı" ? "With Cover" : UniteTipi}`, isUrgent: false },
        { id: `s5_1`, type: `spec`, label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? `${toplamRbcAdeti} Unit(s)` : ` ${toplamRbcAdeti} Adet` },
        { id: `s5_2`, type: `spec`, label: teklifDili === "Yabancı" ? "Disc Diameter" : "Disk Çapı", value: `${rbcModeli === "MINI" ? "1,30" : "2,05"} m` },
        { id: `s5_3`, type: `spec`, label: teklifDili === "Yabancı" ? "Motor Power" : "Motor Gücü", value: `${toplamRbcAdeti} x 0.37 kW` },
        { id: `s5_4`, type: `spec`, label: teklifDili === "Yabancı" ? "Surface Area per Disc" : "Her bir Diskin Alanı", value: `${rbcModeli === "MINI" ? "2,60" : "6,60"} m² / disc` },
        { id: `s5_5`, type: `spec`, label: teklifDili === "Yabancı" ? "Number of Discs per Unit" : "Her bir Ünitedeki Disk Sayısı", value: `${uniteBasinaDiskSayisi} ` },
        { id: `s5_6`, type: `spec`, label: teklifDili === "Yabancı" ? "Minimum Total Disc Area" : "Minimum Toplam Disk Alanı", value: ` ${(projeToplamDisk * (rbcModeli === "MINI" ? 2.60 : 6.60)).toFixed(2)} m²` },
        { id: `s5_7`, type: `spec`, label: teklifDili === "Yabancı" ? "Rotation Speed" : "Devir", value: teklifDili === "Yabancı" ? "3 – 4 rpm" : "3 – 4 devir/dakika" },
        { id: `s5_8`, type: `spec`, label: teklifDili === "Yabancı" ? "Unit Dimensions [L x W x H]" : "Ünite Boyutları [Boy x En x Yük.]", value: `3.350 x 2.370 x 2.650 mm` },
        { id: `s5_9`, type: `spec`, label: teklifDili === "Yabancı" ? "Discs" : "Diskler", value: teklifDili === "Yabancı" ? "PP (Polypropylene), Virgin Material, Single Piece Disc, Thickness: 1.5 mm - 2 mm" : "PP (Polipropilen), Sıfır Malzeme, Tek Parça Disk, Kalınlık: 1.5 mm - 2 mm" },
        { id: `s5_10`, type: `spec`, label: teklifDili === "Yabancı" ? "Solid Shaft" : "Dolu Mil", value: teklifDili === "Yabancı" ? "Epoxy Painted AISI 1045 (C45) Carbon Steel, diameter: 85 mm" : "Epoksi Boyalı AISI 1045 (C45) Karbon Çelik, çap: 85 mm" },
        { id: `s5_11`, type: `spec`, label: teklifDili === "Yabancı" ? "Body" : "Gövde", value: "Fiberglass (GRP)" },
        { id: `s5_12`, type: `spec`, label: teklifDili === "Yabancı" ? "Chassis" : "Şase", value: teklifDili === "Yabancı" ? "Powder Coated Carbon Steel" : "Toz Boyalı Karbon Çelik" },
        { id: `s5_13`, type: `spec`, label: teklifDili === "Yabancı" ? "Wetted Parts" : "Suya Temas Eden Parçalar", value: "AISI 304 Stainless Steel" },
        { id: `s5_14`, type: `spec`, label: teklifDili === "Yabancı" ? "RBC Unit Manufacturer" : "RBC Ünitesi İmalatçısı", value: "PlanetTEK Environmental and Water Wastewater Treatment Technologies Inc." },
        { id: `s5_15`, type: `spec`, label: teklifDili === "Yabancı" ? "Motor Manufacturer" : "Motor İmalatçısı", value: teklifDili === "Yabancı" ? "WAT or equivalent" : "WAT veya muadili" },
        { id: `s5_16`, type: `spec`, label: teklifDili === "Yabancı" ? "Gearbox Manufacturer" : "Redüktör İmalatçısı", value: teklifDili === "Yabancı" ? "PGR or equivalent" : "PGR veya muadili" },

        { id: `e6`, type: `equip`, label: teklifDili === "Yabancı" ? `${lamellaModeli} Lamella Separator Final Clarifier Tank` : `${lamellaModeli} Lamella Seperatör Son Çöktürme Tankı`, isUrgent: false },
        { id: `s6_1`, type: `spec`, label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? `${lamellaAdet} Unit(s)` : ` ${lamellaAdet} Adet` },
        { id: `s6_2`, type: `spec`, label: teklifDili === "Yabancı" ? "Manufacturing Material" : "İmalat Malzemesi", value: teklifDili === "Yabancı" ? "GRP Body & Powder Coated Carbon Steel Chassis" : "Fiber Gövde & Toz Boyalı Karbon Çelik Şase" },
        { id: `s6_3`, type: `spec`, label: teklifDili === "Yabancı" ? "Lamella Plate Area" : "Lamella Plaka Alanı", value: `${lamellaAlani}  m²/tank` },
        { id: `s6_4`, type: `spec`, label: teklifDili === "Yabancı" ? "Tank Volume" : "Tank Hacmi", value: `${lamellaHacim} m³/tank` },
        { id: `s6_5`, type: `spec`, label: teklifDili === "Yabancı" ? "Manufacturer" : "İmalatçı", value: "PlanetTEK Inc." },
        {
            id: `s6_6`,
            type: `spec`,
            label: teklifDili === "Yabancı" ? "Cleaning" : "Temizleme",
            value: teklifDili === "Yabancı"
                ? "The sludge accumulated at the bottom is automatically discharged via the sludge pump. When necessary, lamella surfaces are manually washed with pressurized water."
                : "Alta biriken çamur otomatik olarak çamur pompası aracılığı ile çekilir. Gerektiğinde lamella yüzeyleri basınçlı su ile manuel olarak yıkanır."
        },

        { id: `e7`, type: `equip`, label: teklifDili === "Yabancı" ? "Final Clarifier Tank Sludge Pump" : "Son Çöktürme Tankı Çamur Pompası", isUrgent: false },
        { id: `s7_1`, type: `spec`, label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? `${lamellaAdet} Unit(s)` : ` ${lamellaAdet} Adet` },
        { id: `s7_2`, type: `spec`, label: teklifDili === "Yabancı" ? "Manufacturer" : "İmalatçı", value: teklifDili === "Yabancı" ? "Sumak or Equivalent" : "Sumak veya Muadili" },
        { id: `s7_3`, type: `spec`, label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: teklifDili === "Yabancı" ? "10 m³/hour @ 8.1 mSS" : "10 m3/saat @ 8,1 Mss" },
        { id: `s7_4`, type: `spec`, label: teklifDili === "Yabancı" ? "Motor" : "Motor", value: `${camurPompasikW}  kW` },
        { id: `s7_5`, type: `spec`, label: teklifDili === "Yabancı" ? "Type" : "Tip", value: teklifDili === "Yabancı" ? "Centrifugal Type" : "Santrifüj Tip" },

        ...(isIleriAritmaChecked ? [
            { id: "e8", type: "equip", label: teklifDili === "Yabancı" ? "Recirculation Pump" : "Resürkilasyon Pompası", isUrgent: false },
            { id: "s8_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? `${resirkulasyonPompaAdeti} Duty + ${resirkulasyonPompaAdeti} Standby` : `${resirkulasyonPompaAdeti}  asil + ${resirkulasyonPompaAdeti} yedek` },
            { id: "s8_2", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: `${resirkulasyonPompadebi} m³/hour @ ${resirkulasyonPompamss} mSS` },
            { id: "s8_3", type: "spec", label: teklifDili === "Yabancı" ? "Motor" : "Motor", value: `${resirkulasyonPompakw} kW` },
            { id: "s8_4", type: "spec", label: teklifDili === "Yabancı" ? "Type" : "Tip", value: teklifDili === "Yabancı" ? "Submersible" : "Dalgıç" },
            { id: "s8_5", type: "spec", label: teklifDili === "Yabancı" ? "Brand" : "Marka", value: `${resirkulasyonPompaAdi}` },
            { id: "s8_6", type: "spec", label: teklifDili === "Yabancı" ? "Material" : "Malzeme", value: teklifDili === "Yabancı" ? "Cast Iron Body" : "Döküm Gövde" },

            { id: "e9", type: "equip", label: teklifDili === "Yabancı" ? "Denitrification Tank Mixer" : "Denitrifikasyon Tankı Mikseri", isUrgent: false },
            { id: "s9_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? `${mikserAdeti} Unit(s)` : `${mikserAdeti} Adet` },
            { id: "s9_2", type: "spec", label: teklifDili === "Yabancı" ? "Motor" : "Motor", value: `${mikserkw} kW` },
            { id: "s9_3", type: "spec", label: teklifDili === "Yabancı" ? "Type" : "Tip", value: teklifDili === "Yabancı" ? "Submersible" : "Dalgıç" },
            { id: "s9_4", type: "spec", label: teklifDili === "Yabancı" ? "Brand" : "Marka", value: `...` },

            { id: "e10", type: "equip", label: teklifDili === "Yabancı" ? "FeCl3 Dosing Pump" : "FeCl3 Dozaj Pompası", isUrgent: false },
            { id: "s10_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? `${dozajPompaAdeti} Unit(s)` : `${dozajPompaAdeti} Adet` },
            { id: "s10_2", type: "spec", label: teklifDili === "Yabancı" ? "Solution" : "Solüsyon", value: teklifDili === "Yabancı" ? "Liquid Chlorine" : "Sıvı Klor" },
            { id: "s10_3", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: `${dozajPompaKapasite}` },

            { id: "e11", type: "equip", label: teklifDili === "Yabancı" ? "FeCl3 Solution Tank" : "FeCl3 Solüsyon Tankı", isUrgent: false },
            { id: "s11_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? `${mikserAdeti} Unit(s)` : `${mikserAdeti} Adet` },
            { id: "s11_2", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: `${dozajtankHacmi} lt` },
            { id: "s11_3", type: "spec", label: teklifDili === "Yabancı" ? "Material" : "Malzeme", value: teklifDili === "Yabancı" ? "Polyethylene" : "Polietilen" },
        ] : []),

        ...(isFiltrasyonChecked ? [
            { id: "e12", type: "equip", label: teklifDili === "Yabancı" ? "Pre-Chlorination Dosing Pump" : "Ön Klorlama Dozaj Pompası", isUrgent: false },
            { id: "s12_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? `${sistemAdet} Unit(s)` : `${sistemAdet}  Adet` },
            { id: "s12_2", type: "spec", label: teklifDili === "Yabancı" ? "Solution" : "Solüsyon", value: teklifDili === "Yabancı" ? "Liquid Chlorine" : "Sıvı Klor" },
            { id: "s12_3", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: `${klorlamakapasite}` },

            { id: "e13", type: "equip", label: teklifDili === "Yabancı" ? "Pre-Chlorination Solution Tank" : "Ön Klorlama Solüsyon Tankı", isUrgent: false },
            { id: "s13_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? `${sistemAdet} Unit(s)` : `${sistemAdet}  Adet` },
            { id: "s13_2", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: `${klorlamaTankkapasite} lt` },
            { id: "s13_3", type: "spec", label: teklifDili === "Yabancı" ? "Material" : "Malzeme", value: teklifDili === "Yabancı" ? "Polyethylene" : "Polietilen" },

            { id: "e14", type: "equip", label: teklifDili === "Yabancı" ? "Filtration System Feed Pump" : "Filtrasyon Sistemi Besleme Pompası", isUrgent: false },
            { id: "s14_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? `${sistemAdet} Duty + ${sistemAdet} Standby` : `${sistemAdet}  asil + ${sistemAdet} yedek` },
            { id: "s14_2", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: teklifDili === "Yabancı" ? `${filtrebeslemePompasidebi} m³/hour @ 20-30 mSS` : `${filtrebeslemePompasidebi} m³/saat @ 20-30 mSS` },
            { id: "s14_3", type: "spec", label: teklifDili === "Yabancı" ? "Motor" : "Motor", value: `${filtrebeslemePompasikw} kW` },
            { id: "s14_4", type: "spec", label: teklifDili === "Yabancı" ? "Pump Type" : "Pompa Tipi", value: teklifDili === "Yabancı" ? "Centrifugal" : "Santrifüj" },

            { id: "e15", type: "equip", label: teklifDili === "Yabancı" ? "Filtration System Backwash Pump" : "Filtrasyon Sistemi Geri Yıkama Pompası", isUrgent: false },
            { id: "s15_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? `${sistemAdet} Duty + ${sistemAdet} Standby` : `${sistemAdet}  asil + ${sistemAdet} yedek` },
            { id: "s15_2", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: teklifDili === "Yabancı" ? `${geriYikamaPompasidebi} m³/hour @ 20-30 mSS` : `${geriYikamaPompasidebi} m³/saat @ 20-30 mSS` },
            { id: "s15_3", type: "spec", label: teklifDili === "Yabancı" ? "Motor" : "Motor", value: `${geriYikamaPompasikw} kW` },
            { id: "s15_4", type: "spec", label: teklifDili === "Yabancı" ? "Pump Type" : "Pompa Tipi", value: teklifDili === "Yabancı" ? "Centrifugal" : "Santrifüj" },

            { id: "e16", type: "equip", label: teklifDili === "Yabancı" ? "Separator Filter" : "Seperatör Filtre", isUrgent: false },
            { id: "16_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? `${sistemAdet} Unit(s)` : `${sistemAdet}  Adet` },
            { id: "16_2", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: teklifDili === "Yabancı" ? `${separatorFiltreDebi} m³/hour` : `${separatorFiltreDebi} m³/saat ` },
            { id: "16_3", type: "spec", label: teklifDili === "Yabancı" ? "Filter Type" : "Filtre Türü", value: teklifDili === "Yabancı" ? "100 Microns" : "100 Mikron" },
            { id: "16_4", type: "spec", label: teklifDili === "Yabancı" ? "Material" : "Malzeme", value: "AISI 304 Stainless Steel" },

            { id: "e17", type: "equip", label: teklifDili === "Yabancı" ? "Fully Automatic Sand Filter System with Surface Piping" : "Tam Otomatik Yüzey Borulamalı Kum Filtre Sistemi", isUrgent: false },
            { id: "s17_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? `${sistemAdet} Unit(s)` : `${sistemAdet}  Adet` },
            { id: "s17_2", type: "spec", label: teklifDili === "Yabancı" ? "Flow Rate" : "Debi", value: teklifDili === "Yabancı" ? `${kumFiltresiDebi} m³/hour` : `${kumFiltresiDebi} m³/saat` },
            { id: "s17_3", type: "spec", label: teklifDili === "Yabancı" ? "Filtration Velocity" : "Filtrasyon Kesit Hızı", value: teklifDili === "Yabancı" ? "5-7 m/hour" : "5-7 m/saat" },
            { id: "s17_4", type: "spec", label: teklifDili === "Yabancı" ? "Valve Quantity" : "Vana Miktarı", value: teklifDili === "Yabancı" ? "5 units/tank" : "5 adet/tank" },
            { id: "s17_5", type: "spec", label: teklifDili === "Yabancı" ? "Valve Control" : "Vana Kontrolü", value: teklifDili === "Yabancı" ? "With Electric Actuator" : "Elektrik Aktüatörlü" },
            { id: "s17_6", type: "spec", label: teklifDili === "Yabancı" ? "Automation" : "Otomasyon", value: "Siemens Logo" },
            { id: "s17_7", type: "spec", label: teklifDili === "Yabancı" ? "Tank Material" : "Tank Malzemesi", value: teklifDili === "Yabancı" ? "Epoxy Painted ST37 Carbon Steel / FRP Tank" : "Epoksi Boyalı ST37 Karbon Çelik/FRP Tank" },
            { id: "s17_8", type: "spec", label: teklifDili === "Yabancı" ? "Piping Material" : "Borulama Malzemesi", value: "PVC" },
            { id: "s17_9", type: "spec", label: teklifDili === "Yabancı" ? "Backwash Flow Rate" : "Ters Yıkama Debisi", value: teklifDili === "Yabancı" ? `${geriYikamaPompasidebi} m³/hour` : `${geriYikamaPompasidebi} m³/saat` },
            { id: "s17_10", type: "spec", label: teklifDili === "Yabancı" ? "Test Pressure" : "Test Basıncı", value: "9 bar" },
            { id: "s17_11", type: "spec", label: teklifDili === "Yabancı" ? "Operating Pressure" : "Çalışma Basıncı", value: "2-6 bar" },

            { id: "e18", type: "equip", label: teklifDili === "Yabancı" ? "Fully Automatic Active Carbon Filter System with Surface Piping" : "Tam Otomatik Yüzey Borulamalı Aktif Karbon Filtre Sistemi", isUrgent: false },
            { id: "s18_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? `${sistemAdet} Unit(s)` : `${sistemAdet}  Adet` },
            { id: "s18_2", type: "spec", label: teklifDili === "Yabancı" ? "Flow Rate" : "Debi", value: teklifDili === "Yabancı" ? `${aktifKarbonFiltresiDebi} m³/hour` : `${aktifKarbonFiltresiDebi} m³/saat` },
            { id: "s18_3", type: "spec", label: teklifDili === "Yabancı" ? "Filtration Velocity" : "Filtrasyon Kesit Hızı", value: teklifDili === "Yabancı" ? "5-7 m/hour" : "5-7 m/saat" },
            { id: "s18_4", type: "spec", label: teklifDili === "Yabancı" ? "Valve Quantity" : "Vana Miktarı", value: teklifDili === "Yabancı" ? "5 units/tank" : "5 adet/tank" },
            { id: "s18_5", type: "spec", label: teklifDili === "Yabancı" ? "Valve Control" : "Vana Kontrolü", value: teklifDili === "Yabancı" ? "With Electric Actuator" : "Elektrik Aktüatörlü" },
            { id: "s18_6", type: "spec", label: teklifDili === "Yabancı" ? "Automation" : "Otomasyon", value: "Siemens Logo" },
            { id: "s18_7", type: "spec", label: teklifDili === "Yabancı" ? "Tank Material" : "Tank Malzemesi", value: teklifDili === "Yabancı" ? "Epoxy Painted ST37 Carbon Steel / FRP Tank" : "Epoksi Boyalı ST37 Karbon Çelik/FRP Tank" },
            { id: "s18_8", type: "spec", label: teklifDili === "Yabancı" ? "Piping Material" : "Borulama Malzemesi", value: "PVC" },
            { id: "s18_9", type: "spec", label: teklifDili === "Yabancı" ? "Backwash Flow Rate" : "Ters Yıkama Debisi", value: teklifDili === "Yabancı" ? `${geriYikamaPompasidebi} m³/hour` : `${geriYikamaPompasidebi} m³/saat` },
            { id: "s18_10", type: "spec", label: teklifDili === "Yabancı" ? "Test Pressure" : "Test Basıncı", value: "9 bar" },
            { id: "s18_11", type: "spec", label: teklifDili === "Yabancı" ? "Operating Pressure" : "Çalışma Basıncı", value: "2-6 bar" }
        ] : []),

        ...(isCamurAktif ? [
            {
                id: "e19",
                type: "equip",
                label: secilenCamurEkipmanTipi === "Dekantör"
                    ? (teklifDili === "Yabancı" ? "Decanter" : "Dekantör")
                    : (secilenCamurEkipmanTipi === "Filtrepres" ? (teklifDili === "Yabancı" ? "Filter Press" : "Filtrepres") : secilenCamurEkipmanTipi),
                isUrgent: false
            },
            { id: "s19_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? "1 Unit" : "1 Adet" },
            {
                id: "s19_2",
                type: "spec",
                label: teklifDili === "Yabancı" ? "Manufacturer" : "İmalatçı",
                value: secilenCamurEkipmanTipi === "Dekantör"
                    ? (teklifDili === "Yabancı" ? "Polat or Haus" : "Polat ya da Haus")
                    : (teklifDili === "Yabancı" ? "AES or Equivalent" : "AES ya da Muadili")
            },
            { id: "s19_3", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: `${secilenCamurEkipmanKapasite} ${secilenCamurEkipmanKapasitebirimi}` },
            ...(secilenCamurEkipmanTipi === "Filtrepres" ? [
                { id: "s19_4", type: "spec", label: teklifDili === "Yabancı" ? "Number of Plates" : "Plana Sayısı", value: `33` },
                { id: "s19_5", type: "spec", label: teklifDili === "Yabancı" ? "Operation Type" : "Çalışma Şekli", value: teklifDili === "Yabancı" ? "Electric Hydraulic" : "Elektrikli Hidrolik" }
            ] : []),
            { id: "s19_6", type: "spec", label: teklifDili === "Yabancı" ? "Motor" : "Motor", value: secilenCamurEkipmanTipi === "Dekantör" ? `7,5 kW + 4 kW` : "2,2 kW Gamak" },
            { id: "s19_7", type: "spec", label: teklifDili === "Yabancı" ? "Type" : "Tip", value: secilenCamurEkipmanTipi === "Dekantör" ? (teklifDili === "Yabancı" ? "Centrifugal" : "Santrifüj") : "Chamber" },

            { id: "e20", type: "equip", label: teklifDili === "Yabancı" ? "Sludge Feed Pump" : "Çamur Besleme Pompası", isUrgent: false },
            { id: "s20_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? "1 Unit" : "1 Adet" },
            { id: "s20_2", type: "spec", label: teklifDili === "Yabancı" ? "Manufacturer" : "İmalatçı", value: teklifDili === "Yabancı" ? "Allweiler or Equivalent" : "Allweiler veya Muadili" },
            { id: "s20_3", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: teklifDili === "Yabancı" ? `${camurBeslemePompasikapasite} m³/hour` : `${camurBeslemePompasikapasite} m³/saat` },
            { id: "s20_4", type: "spec", label: teklifDili === "Yabancı" ? "Motor" : "Motor", value: `1,5 kW` },
            { id: "s20_5", type: "spec", label: teklifDili === "Yabancı" ? "Pump Type" : "Pompa Tipi", value: teklifDili === "Yabancı" ? "Centrifugal" : "Santrifüj" },

            { id: "e21", type: "equip", label: teklifDili === "Yabancı" ? "Filtrate Water Pump" : "Süzüntü Suyu Pompası", isUrgent: false },
            { id: "s21_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? "1 Unit" : "1 Adet" },
            { id: "s21_2", type: "spec", label: teklifDili === "Yabancı" ? "Manufacturer" : "İmalatçı", value: teklifDili === "Yabancı" ? "City Pumps Ranger or equivalent" : "City Pumps Ranger ya da muadili" },
            { id: "s21_3", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: teklifDili === "Yabancı" ? `${camurSuzuntuBeslemePompasikapasite} m³/hour` : `${camurSuzuntuBeslemePompasikapasite} m³/saat` },
            { id: "s21_4", type: "spec", label: teklifDili === "Yabancı" ? "Motor" : "Motor", value: `0.75 kW` },
            { id: "s21_5", type: "spec", label: teklifDili === "Yabancı" ? "Pump Type" : "Pompa Tipi", value: teklifDili === "Yabancı" ? "Submersible" : "Dalgıç" },

            { id: "e22", type: "equip", label: teklifDili === "Yabancı" ? "Poly Dosing Unit" : "Poli Dozlama Ünitesi", isUrgent: false },
            { id: "s22_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? "1 Unit" : "1 Adet" },
            { id: "s22_2", type: "spec", label: teklifDili === "Yabancı" ? "Manufacturer" : "İmalatçı", value: `PlanetTEK` },
            { id: "s22_3", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: teklifDili === "Yabancı" ? "200 lt/h" : "200 lt/sa" },
            { id: "s22_4", type: "spec", label: teklifDili === "Yabancı" ? "Motor" : "Motor", value: `1.1 kW` },
            { id: "s22_5", type: "spec", label: teklifDili === "Yabancı" ? "Type" : "Tipi", value: teklifDili === "Yabancı" ? "Solution tank and dosing unit" : "Solüsyon tankı ve dozlama ünitesi" },

            ...seciliOpsiyonYapilari
        ] : []),

        // İnşaat İşleri Bölümü
        { id: "m2", type: "main", label: teklifDili === "Yabancı" ? "CIVIL WORKS" : "İNŞAAT İŞLERİ" },

        { id: "e01", type: "equip", label: teklifDili === "Yabancı" ? "Screen Channel" : "Izgara Kanalı", isUrgent: true },
        { id: "s01_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? "1 Unit" : "1 Adet" },
        { id: "s01_2", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: teklifDili === "Yabancı" ? `${(pikDebi / 2).toFixed(0)} m³ wet volume` : `${(pikDebi / 2).toFixed(0)} m³ ıslak hacim` },
        { id: "s01_3", type: "spec", label: teklifDili === "Yabancı" ? "Material" : "Malzeme", value: teklifDili === "Yabancı" ? "Reinforced Concrete" : "Betonarme" },
        { id: "s01_4", type: "spec", label: teklifDili === "Yabancı" ? "Retention Time" : "Bekleme Süresi", value: teklifDili === "Yabancı" ? `30 minutes at peak flow rate of ${pikDebi} m³/hour` : `${pikDebi} m³/saat pik debide 30 dakika` },

        ...(isIleriAritmaChecked ? [
            { id: "e02", type: "equip", label: teklifDili === "Yabancı" ? "Anoxic Denitrification Tank" : "Anoksik Denitrifikasyon Tankı", isUrgent: true },
            { id: "s02_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? "1 Unit" : "1 Adet" },
            { id: "s02_2", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: teklifDili === "Yabancı" ? `${(geriYikamaPompasidebi * 4).toFixed(0)} m³ wet volume` : `${(geriYikamaPompasidebi * 4).toFixed(0)} m³ ıslak hacim` },
            { id: "s02_3", type: "spec", label: teklifDili === "Yabancı" ? "Material" : "Malzeme", value: teklifDili === "Yabancı" ? "Reinforced Concrete" : "Betonarme" },
            { id: "s02_4", type: "spec", label: teklifDili === "Yabancı" ? "Retention Time" : "Bekleme Süresi", value: teklifDili === "Yabancı" ? `4 hours at flow rate of ${geriYikamaPompasidebi} m³/hour` : `${geriYikamaPompasidebi} m³/saat debide 4 saat` },
        ] : []),

        { id: "e03", type: "equip", label: teklifDili === "Yabancı" ? "Primary Clarifier Tank" : "Birinci Çöktürme Tankı", isUrgent: true },
        { id: "s03_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? "1 Unit" : "1 Adet" },
        { id: "s03_2", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: teklifDili === "Yabancı" ? `${(pikDebi * 2.5).toFixed(0)} m³ wet volume` : `${(pikDebi * 2.5).toFixed(0)} m³ ıslak hacim` },
        { id: "s03_3", type: "spec", label: teklifDili === "Yabancı" ? "Material" : "Malzeme", value: teklifDili === "Yabancı" ? "Reinforced Concrete" : "Betonarme" },
        { id: "s03_4", type: "spec", label: teklifDili === "Yabancı" ? "Retention Time" : "Bekleme Süresi", value: teklifDili === "Yabancı" ? `2.5 hours at peak flow rate of ${pikDebi} m³/hour` : `${pikDebi} m³/saat pik debide 2,5 saat` },

        { id: "e04", type: "equip", label: teklifDili === "Yabancı" ? "Secondary Clarifier Tank" : "İkinci Çöktürme Tankı", isUrgent: true },
        { id: "s04_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? "1 Unit" : "1 Adet" },
        { id: "s04_2", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: teklifDili === "Yabancı" ? `${(pikDebi * 2).toFixed(0)} m³ wet volume` : `${(pikDebi * 2).toFixed(0)} m³ ıslak hacim` },
        { id: "s04_3", type: "spec", label: teklifDili === "Yabancı" ? "Material" : "Malzeme", value: teklifDili === "Yabancı" ? "Reinforced Concrete" : "Betonarme" },
        { id: "s04_4", type: "spec", label: teklifDili === "Yabancı" ? "Retention Time" : "Bekleme Süresi", value: teklifDili === "Yabancı" ? `2 hours at peak flow rate of ${pikDebi} m³/hour` : `${pikDebi} m³/saat pik debide 2 saat` },

        { id: "e05", type: "equip", label: teklifDili === "Yabancı" ? "Equalization Tank" : "Dengeleme Tankı", isUrgent: true },
        { id: "s05_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? "1 Unit" : "1 Adet" },
        { id: "s05_2", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: teklifDili === "Yabancı" ? `${(pikDebi * 2).toFixed(0)} m³ wet volume` : `${(pikDebi * 2).toFixed(0)} m³ ıslak hacim` },
        { id: "s05_3", type: "spec", label: teklifDili === "Yabancı" ? "Material" : "Malzeme", value: teklifDili === "Yabancı" ? "Reinforced Concrete" : "Betonarme" },
        { id: "s05_4", type: "spec", label: teklifDili === "Yabancı" ? "Retention Time" : "Bekleme Süresi", value: teklifDili === "Yabancı" ? `2 hours at peak flow rate of ${pikDebi} m³/hour` : `${pikDebi} m³/saat pik debide 2 saat` },

        ...(isFiltrasyonChecked ? [
            { id: "e06", type: "equip", label: teklifDili === "Yabancı" ? "Treated Water Tank" : "Arıtılmış Su Tankı", isUrgent: true },
            { id: "s06_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? "1 Unit" : "1 Adet" },
            { id: "s06_2", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: teklifDili === "Yabancı" ? `${(pikDebi * 2).toFixed(0)} m³ wet volume` : `${(pikDebi * 2).toFixed(0)} m³ ıslak hacim` },
            { id: "s06_3", type: "spec", label: teklifDili === "Yabancı" ? "Material" : "Malzeme", value: teklifDili === "Yabancı" ? "Reinforced Concrete" : "Betonarme" },
            { id: "s06_4", type: "spec", label: teklifDili === "Yabancı" ? "Retention Time" : "Bekleme Süresi", value: teklifDili === "Yabancı" ? `1 hour at peak flow rate of ${pikDebi} m³/hour` : `${pikDebi} m³/saat pik debide 1 saat` },

            { id: "e07", type: "equip", label: teklifDili === "Yabancı" ? "Filtered Water Tank" : "Filtrelenmiş Su Tankı", isUrgent: true },
            { id: "s07_1", type: "spec", label: teklifDili === "Yabancı" ? "Quantity" : "Miktar", value: teklifDili === "Yabancı" ? "1 Unit" : "1 Adet" },
            { id: "s07_2", type: "spec", label: teklifDili === "Yabancı" ? "Capacity" : "Kapasite", value: teklifDili === "Yabancı" ? "Tank capacity will be selected according to customer request" : "Tank kapasitesi müşterini talebine göre seçilecektir" },
            { id: "s07_3", type: "spec", label: teklifDili === "Yabancı" ? "Material" : "Malzeme", value: teklifDili === "Yabancı" ? "Reinforced Concrete" : "Betonarme" },
            { id: "s07_4", type: "spec", label: teklifDili === "Yabancı" ? "Retention Time" : "Bekleme Süresi", value: teklifDili === "Yabancı" ? "It is recommended to choose a volume as much as the irrigation need" : "Sulama ihtiyacı kadar hacim seçilmesi tavsiye edilir" },
        ] : []),
    ];

    return initialRows.filter(Boolean);
};