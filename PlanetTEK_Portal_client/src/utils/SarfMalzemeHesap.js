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
    const unitSystem = formData?.customerInfo?.unitSystem || "Metric"; // 'Metric' veya 'US'
    const isUS = unitSystem === "US";

    // Dönüşüm Katsayıları
    const kgToLbs = 2.20462;
    const ltToGal = 0.264172;
    const tonToUsTon = 1.10231;

    // Sayıları virgülden sonra 2 haneli olacak şekilde yuvarlamak için yardımcı fonksiyon
    const formatNum = (num) => Number(Number(num).toFixed(2));

    // Ekipman Nesnesi Yapılandırması
    const equipmentsObject = formData.equipments || {};
    const { modulesState = {} } = equipmentsObject;
    const planetDiskDetails = formData.planetDiskDetails || {};

    // Modül Aktiflik Kontrolleri (Checkbox durumları)
    const isOnAritmaChecked = modulesState.onAritma?.checked || false;
    const isFeedPumpChecked = modulesState.feedPump?.checked || false;
    const isIleriAritmaChecked = modulesState.ileriAritma?.checked || false;
    const isFiltrasyonChecked = modulesState.filtrasyon?.checked || false;
    const isCamurAktif = modulesState.sludgeDewatering?.checked || false;
    const isMembraneAktif = modulesState.membrane?.checked || false;

    // Izgara Tipi Özelliği
    const izgaraTipi = equipmentsObject.onAritma?.izgaraTipi;
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

    const membraneObj = equipmentsObject?.membraneSystem || {};

    // 2. İstediğin formata uygun olarak kW değerlerini parametrelere atıyoruz
    const membranefeedPumpKw = (membraneObj.feedPumps?.kw || 0);
    const membranerecirculationPumpKw = (membraneObj.recirculationPumps?.kw || 0);
    const membranenaoclDosingPumpKw = (membraneObj.naoclDosingPumps?.kw || 0);
    const membranecitricDosingPumpKw = (membraneObj.citricDosingPumps?.kw || 0);
    const membraneblowerKw = (membraneObj.blowers?.kw || 0);

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
            consumption: isUS ? formatNum(0.5 * kgToLbs) : 0.5,
            consumptionUnit: isUS 
                ? (teklifDili === "Yabancı" ? "lbs/year.bearing" : "lbs/yıl.rulman") 
                : (teklifDili === "Yabancı" ? "kg/year.bearing" : "kg/yıl.rulman"),
            unitPrice: isUS ? formatNum(6 / kgToLbs) : 6,
            priceUnit: isUS ? "€/lbs" : "€/kg"
        },
        {
            id: "r2",
            label: teklifDili === "Yabancı" ? "Gearbox Oil" : "Redüktör Yağı",
            qty: toplamRbcAdedi,
            qtyUnit: teklifDili === "Yabancı" ? "gearbox" : "redüktör",
            consumption: isUS ? formatNum(7.4 * ltToGal) : 7.4,
            consumptionUnit: isUS 
                ? (teklifDili === "Yabancı" ? "gal/year.gearbox" : "gal/yıl.redüktör") 
                : (teklifDili === "Yabancı" ? "lt/year.gearbox" : "lt/yıl.redüktör"),
            unitPrice: isUS ? formatNum(4 / ltToGal) : 4,
            priceUnit: isUS ? "€/gal" : "€/lt"
        },
        ...(isIleriAritmaChecked ? [
            {
                id: "r3",
                label: teklifDili === "Yabancı" ? "Ferric Chloride (FeCl3)" : "Demir Üç Klorür (FeCl3)",
                qty: 1,
                qtyUnit: teklifDili === "Yabancı" ? "Dosing Unit" : "Dozaj Ün.",
                consumption: isUS 
                    ? formatNum(((gerekliFeCl3 * 365) / 1000) * tonToUsTon) 
                    : formatNum((gerekliFeCl3 * 365) / 1000),
                consumptionUnit: isUS 
                    ? (teklifDili === "Yabancı" ? "ton/year" : "ton/yıl") 
                    : (teklifDili === "Yabancı" ? "ton/year" : "ton/yıl"),
                unitPrice: isUS ? formatNum(200 / tonToUsTon) : 200,
                priceUnit: isUS ? "€/ton" : "€/ton"
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
                consumption: isUS ? formatNum(1.34 * tonToUsTon) : 1.34,
                consumptionUnit: isUS 
                    ? (teklifDili === "Yabancı" ? "ton/year" : "ton/yıl") 
                    : (teklifDili === "Yabancı" ? "ton/year" : "ton/yıl"),
                unitPrice: isUS ? formatNum(0.38 / kgToLbs) : 0.38,
                priceUnit: isUS ? "€/lbs" : "€/kg" 
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
                consumption: isUS ? formatNum(91 * kgToLbs) : 91,
                consumptionUnit: isUS 
                    ? (teklifDili === "Yabancı" ? "lbs/year" : "lbs/yıl") 
                    : (teklifDili === "Yabancı" ? "kg/year" : "kg/yıl"),
                unitPrice: isUS ? formatNum(26 / kgToLbs) : 26,
                priceUnit: isUS ? "€/lbs" : "€/kg"
            }
        ] : []),

        // Membran Sistemi Başlıkları
        ...(isMembraneAktif ? [
            {
                id: "s4",
                label: teklifDili === "Yabancı" ? "Planet Membran System" : "Planet Membran Sistemi",
                isSubHeader: true
            },
            {
                id: "r6",
                label: teklifDili === "Yabancı" ? "NaOCl" : "NaOCl",
                qty: 1,
                qtyUnit: teklifDili === "Yabancı" ? "Dosing Unit" : "Dozaj Ün.",
                consumption: isUS ? formatNum(91 * kgToLbs) : 91,
                consumptionUnit: isUS 
                    ? (teklifDili === "Yabancı" ? "lbs/year" : "lbs/yıl") 
                    : (teklifDili === "Yabancı" ? "kg/year" : "kg/yıl"),
                unitPrice: isUS ? formatNum(26 / kgToLbs) : 26,
                priceUnit: isUS ? "€/lbs" : "€/kg"
            },
            {
                id: "r7",
                label: teklifDili === "Yabancı" ? "Citric Acid" : "Sitrik Asit",
                qty: 1,
                qtyUnit: teklifDili === "Yabancı" ? "Dosing Unit" : "Dozaj Ün.",
                consumption: isUS ? formatNum(91 * kgToLbs) : 91,
                consumptionUnit: isUS 
                    ? (teklifDili === "Yabancı" ? "lbs/year" : "lbs/yıl") 
                    : (teklifDili === "Yabancı" ? "kg/year" : "kg/yıl"),
                unitPrice: isUS ? formatNum(26 / kgToLbs) : 26,
                priceUnit: isUS ? "€/lbs" : "€/kg"
            }
        ] : []),
    ];

    // Array içerisindeki boş spread durumlarını (false elemanları) filtrele
    return initialRows.filter(Boolean);
}