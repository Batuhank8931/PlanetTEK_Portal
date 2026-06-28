/**
 * Form verilerini ve dinamik API fiyatlarını alarak 
 * hiyerarşik işletme maliyeti tablosunu hesaplayan ve numaralandıran ana motor.
 * ASENKRON SÜRÜM (async)
 */
export default async function sarfMalsemeHesapFonksiyonu(formData) {
    // Güvenlik Kontrolleri
    if (!formData) {
        return [];
    }

    const teklifDili = formData?.customerInfo?.teklifDili;

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
    const gerekliFeCl3 = ileriAritmaObj?.IleriAritmaDozajSelections?.gerekliFeCl3 || 0;

    const filtrasyonObj = equipmentsObject?.filtrationSystem || {};
    const filtrsayonAdedi = filtrasyonObj?.sistemAdet || 0;
    const FiltrasyonBeslemekw = filtrasyonObj?.pompalar?.besleme?.kw || 0;
    const FiltrasyonYikamakw = filtrasyonObj?.pompalar?.geriYikama?.kw || 0;


    const CamurObj = equipmentsObject?.sludgeDewatering || {};
    const CamurEkipman = CamurObj.ekipmanTipi || "Filtrepres";

    const initialRows = [
        // Ana Başlık
        {
            id: "h1",
            label: teklifDili === "Yabancı" ? "CONSUMABLES AND MAINTENANCE EXPENSES" : "SARF MALZEME VE BAKIM GİDERLERİ",
            isHeader: true
        },

        // Biyolojik Arıtma Başlıkları
        {
            id: "s1",
            label: teklifDili === "Yabancı" ? "Biological Treatment Units (Secondary Treatment)" : "Biyolojik Arıtma Üniteleri (İkincil Arıtma)",
            isSubHeader: true
        },
        {
            id: "s1_sub",
            label: teklifDili === "Yabancı" ? `PlanetDISK® ${RBCUnite} DBD Unit` : `PlanetDISK® ${RBCUnite} DBD Ünitesi`,
            isSubHeader: true,
            isLight: true
        },
        {
            id: "r1",
            label: teklifDili === "Yabancı" ? "Bearing Grease" : "Rulman Gres Yağı",
            qty: toplamRbcAdedi * 2,
            qtyUnit: teklifDili === "Yabancı" ? "bearing" : "rulman",
            consumption: 0.5,
            consumptionUnit: teklifDili === "Yabancı" ? "kg/year.bearing" : "kg/yıl.rulman",
            unitPrice: 6,
            priceUnit: "€/kg"
        },
        {
            id: "r2",
            label: teklifDili === "Yabancı" ? "Gearbox Oil" : "Redüktör Yağı",
            qty: toplamRbcAdedi,
            qtyUnit: teklifDili === "Yabancı" ? "gearbox" : "redüktör",
            consumption: 7.4,
            consumptionUnit: teklifDili === "Yabancı" ? "lt/year.gearbox" : "lt/yıl.redüktör",
            unitPrice: 4,
            priceUnit: "€/lt"
        },
        ...(isIleriAritmaChecked ? [
            {
                id: "r3",
                label: teklifDili === "Yabancı" ? "Ferric Chloride (FeCl3)" : "Demir Üç Klorür (FeCl3)",
                qty: 1,
                qtyUnit: teklifDili === "Yabancı" ? "Dosing Unit" : "Dozaj Ün.",
                consumption: ((gerekliFeCl3 * 365) / 1000).toFixed(2),
                consumptionUnit: teklifDili === "Yabancı" ? "ton/year" : "ton/yıl",
                unitPrice: 200,
                priceUnit: "€/ton"
            },
        ] : []),

        // Filtrasyon ve Dezenfeksiyon Başlıkları
        ...(isFiltrasyonChecked ? [
            {
                id: "s2",
                label: teklifDili === "Yabancı" ? "Filtration and Disinfection Units (Advanced Treatment)" : "Filtrasyon ve Dezenfeksiyon Üniteleri (İleri Arıtma)",
                isSubHeader: true
            },
            {
                id: "s2_sub",
                label: teklifDili === "Yabancı" ? "Pre-Chlorination Dosing Pump" : "Ön Klorlama Dozaj Pompası",
                isSubHeader: true,
                isLight: true
            },
            {
                id: "r4",
                label: teklifDili === "Yabancı" ? "Liquid Chlorine" : "Sıvı Klor",
                qty: 1,
                qtyUnit: teklifDili === "Yabancı" ? "Dosing Unit" : "Dozaj Ün.",
                consumption: 1.34,
                consumptionUnit: teklifDili === "Yabancı" ? "ton/year" : "ton/yıl",
                unitPrice: 0.38,
                priceUnit: "€/kg"
            },
        ] : []),

        // Çamur Susuzlaştırma Başlıkları
        ...(isCamurAktif ? [
            {
                id: "s3",
                label: teklifDili === "Yabancı" ? "Sludge Dewatering Unit" : "Çamur Susuzlaştırma Ünitesi",
                isSubHeader: true
            },
            {
                id: "r5",
                label: teklifDili === "Yabancı" ? "Cationic Polyelectrolyte" : "Katyonik Polielektrolit",
                qty: 1,
                qtyUnit: teklifDili === "Yabancı" ? "Dosing Unit" : "Dozaj Ün.",
                consumption: 91,
                consumptionUnit: teklifDili === "Yabancı" ? "kg/year" : "kg/yıl",
                unitPrice: 26,
                priceUnit: "€/kg"
            }
        ] : []),
    ];

    // Array içerisindeki boş spread durumlarını (false elemanları) filtrele
    return initialRows.filter(Boolean);
}