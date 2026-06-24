/**
 * Form verilerini ve dinamik API fiyatlarını alarak 
 * hiyerarşik işletme maliyeti tablosunu hesaplayan ve numaralandıran ana motor.
 * ASENKRON SÜRÜM (async)
 */
export default async function enerjiIsletmeHesapFonksiyonu(formData) {
    // Güvenlik Kontrolleri
    if (!formData) {
        return [];
    }

    // Ekipman Nesnesi Yapılandırması
    const equipmentsObject = formData.equipments || {};
    const { modulesState = {} } = equipmentsObject;

    const planetDiskDetails = formData.planetDiskDetails || {};

    // Modül Aktiflik Kontrolleri (Checkbox durumları)
    const isOnAritmaChecked = modulesState.onAritma?.checked || false;
    const isFeedPumpChecked = modulesState.feedPump?.checked || false;
    const isIleriAritmaChecked = modulesState.ileriAritma?.checked || false;
    const isFiltrasyonChecked = modulesState.filtrasyon?.checked || false;
    const isCamurAktif = modulesState.sludgeDewatering?.checked || false

    // Izgara Tipi Özelliği
    const izgaraTipi = equipmentsObject.onAritma.izgaraTipi;
    const otomatikIsgaraGoster = izgaraTipi === "Otomatik Mekanik Izgara";

    const FeedPumpkw = equipmentsObject.feedPump?.pumpkW || "0";
    const FeedPumpamount = equipmentsObject.feedPump?.pompaAdeti || "0";

    const yerlesimArray = planetDiskDetails?.tasarim?.yerlesimSiralanisi || [];
    const RBCUnite = planetDiskDetails?.tasarim?.aritmaParametreleri?.RBCUnite || "MX";
    const atiksuType = planetDiskDetails?.tasarim?.aritmaParametreleri?.atiksutype || "evsel";


    // 1. isLamella değeri false (RBC) olan nesnelerin adetlerini topluyoruz
    const toplamRbcAdedi = yerlesimArray
        .filter(item => item && item.isLamella === false)
        .reduce((sum, item) => sum + (parseInt(item.adet) || 0), 0);


    const camurPompasiAdet = planetDiskDetails?.tasarim?.lamella?.camurPompasiAdet || 0;
    const camurPompasikW = planetDiskDetails?.tasarim?.lamella?.camurPompasi?.kw || 0;

    const ileriAritmaObj = equipmentsObject?.ileriAritma || {};
    const ileriAritmaPompaAdet = ileriAritmaObj?.IleriAritmaPumpSelections?.pompaAdeti || 0;
    const ileriAritmaPompakw = ileriAritmaObj?.IleriAritmaPumpSelections?.pumpkW || 0;
    const ileriAritmaMikserkw = ileriAritmaObj?.IleriAritmaTankMixerSelections?.gerekliGucKw || 0;
    const ileriAritmaDozajAdedi = ileriAritmaObj?.IleriAritmaDozajSelections?.pompaAdedi || 0;


    const filtrasyonObj = equipmentsObject?.filtrationSystem || {};
    const filtrsayonAdedi = filtrasyonObj?.sistemAdet || 0;
    const FiltrasyonBeslemekw = filtrasyonObj?.pompalar?.besleme?.kw || 0;
    const FiltrasyonYikamakw = filtrasyonObj?.pompalar?.geriYikama?.kw || 0;


    const CamurObj = equipmentsObject?.sludgeDewatering || {};
    const CamurEkipman = CamurObj.ekipmanTipi || "Filtrepres";

    const initialRows = [
        // Ana Başlık Her Zaman Render Edilir
        { id: "h1", label: "MEKANİK EKİPMANLAR", isHeader: true },

        // 1. ÖN ARITMA MODÜLÜ (isOnAritmaChecked)
        ...(isOnAritmaChecked ? [
            { id: "s1", label: "Fiziksel Arıtma Üniteleri (Birincil Arıtma)", isSubHeader: true },
            ...(otomatikIsgaraGoster ? [
                { id: "r1", label: "Otomatik Temizlemeli Kaba Izgara", qty: 1, power: 0.55, consumed: 90, hours: 4 },
                { id: "r2", label: "Otomatik Temizlemeli İnce Izgara", qty: 1, power: 0.55, consumed: 90, hours: 4 }
            ] : [])
        ] : []),

        // 2. TERFİ POMPASI MODÜLÜ (isFeedPumpChecked)
        ...(isFeedPumpChecked ? [
            {
                id: "r3", // Sabit tek bir ID
                label: "Dengeleme Tankı Terfi Pompası",
                qty: FeedPumpamount,  // Pompa adedi buraya çarpan (Adet) olarak geliyor
                power: FeedPumpkw,    // Güç değeri
                consumed: 90,
                hours: 24
            }
        ] : []),

        // 3. BİYOLOJİK ARITMA (RBC üniteleri her zaman listelenir)
        { id: "s2", label: "Biyolojik Arıtma Üniteleri (İkincil Arıtma)", isSubHeader: true },
        { id: "r4", label: `PlanetDISK® ${RBCUnite} RBC Ünitesi`, qty: toplamRbcAdedi, power: RBCUnite === "MX" ? 0.37 : 0.25, consumed: 90, hours: 24 },
        ...(atiksuType === "endustriyel" ? [
            { id: "r5", label: "Blower", qty: toplamRbcAdedi, power: 1.6, consumed: 90, hours: 24 },
        ] : []),
        { id: "r6", label: "Son Çöktürme Tankı Çamur Pompası", qty: camurPompasiAdet, power: camurPompasikW, consumed: 90, hours: 1 },

        // 4. İLERİ ARITMA - AZOT/FOSFOR GİDERİMİ MODÜLÜ (isIleriAritmaChecked)
        ...(isIleriAritmaChecked ? [
            { id: "r7", label: "Resürkilasyon Pompaları", qty: ileriAritmaPompaAdet, power: ileriAritmaPompakw, consumed: 90, hours: 24 },
            { id: "r8", label: "Anoksik Tank Mikseri", qty: 1, power: ileriAritmaMikserkw, consumed: 90, hours: 24 },
            { id: "r9", label: "FeCl3 Dozaj Pompası", qty: ileriAritmaDozajAdedi, power: 0.09, consumed: 90, hours: 24 }
        ] : []),

        // 5. FİLTRASYON VE DEZENFEKSİYON MODÜLÜ (isFiltrasyonChecked)
        ...(isFiltrasyonChecked ? [
            { id: "s3", label: "Filtrasyon ve Dezenfeksiyon Üniteleri (İleri Arıtma)", isSubHeader: true },
            { id: "r10", label: "Ön Klorlama Ünitesi", qty: filtrsayonAdedi, power: 0.09, consumed: 90, hours: 22 },
            { id: "r11", label: "Filtrasyon Sistemi Besleme Pompası", qty: filtrsayonAdedi, power: FiltrasyonBeslemekw, consumed: 90, hours: 22 },
            { id: "r12", label: "Filtrasyon Sistemi Geri Yıkama Pompası", qty: filtrsayonAdedi, power: FiltrasyonYikamakw, consumed: 90, hours: 2 }
        ] : []),

        // 7. ÇAMUR SUSUZLAŞTIRMA MODÜLÜ (isCamurAktif)
        ...(isCamurAktif ? [
            { id: "s5", label: "Çamur Susuzlaştırma Ünitesi", isSubHeader: true },
            { id: "r13", label: "Çamur Besleme Pompası", qty: 1, power: 2.2, consumed: 90, hours: 8 },
            { id: "r14", label: `${CamurEkipman}`, qty: 1, power: CamurEkipman === "Dekantör" ? 11.5 : 2.2, consumed: 90, hours: 8 },
            { id: "r15", label: "Süzüntü Suyu Pompası", qty: 1, power: 2.2, consumed: 90, hours: 8 },
            { id: "r16", label: "Polimer Dozaj Ünitesi", qty: 1, power: 0.09, consumed: 90, hours: 8 }
        ] : []),
    ];

    // Array içerisindeki boş spread durumlarını (false elemanları) filtrele
    return initialRows.filter(Boolean);
}