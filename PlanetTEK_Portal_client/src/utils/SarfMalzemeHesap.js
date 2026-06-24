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
    const ileriAritmaPompaAdet = ileriAritmaObj?.IleriAritmaPumpSelections.pompaAdeti || 0;
    const ileriAritmaPompakw = ileriAritmaObj?.IleriAritmaPumpSelections.pumpkW || 0;
    const ileriAritmaMikserkw = ileriAritmaObj?.IleriAritmaTankMixerSelections.gerekliGucKw || 0;
    const ileriAritmaDozajAdedi = ileriAritmaObj?.IleriAritmaDozajSelections.pompaAdedi || 0;
    const gerekliFeCl3 = ileriAritmaObj?.IleriAritmaDozajSelections.gerekliFeCl3 || 0;

    const filtrasyonObj = equipmentsObject?.filtrationSystem || {};
    const filtrsayonAdedi = filtrasyonObj?.sistemAdet || 0;
    const FiltrasyonBeslemekw = filtrasyonObj?.pompalar?.besleme?.kw || 0;
    const FiltrasyonYikamakw = filtrasyonObj?.pompalar?.geriYikama?.kw || 0;


    const CamurObj = equipmentsObject?.sludgeDewatering || {};
    const CamurEkipman = CamurObj.ekipmanTipi || "Filtrepres";

    const initialRows = [
        // Ana Başlık Her Zaman Render Edilir
        { id: "h1", label: "SARF MALZEME VE BAKIM GİDERLERİ", isHeader: true },

        { id: "s1", label: "Biyolojik Arıtma Üniteleri (İkincil Arıtma)", isSubHeader: true },
        { id: "s1_sub", label: "PlanetDISK® MX 1 DBD Ünitesi", isSubHeader: true, isLight: true },
        { id: "r1", label: "Rulman Gres Yağı", qty: toplamRbcAdedi * 2, qtyUnit: "rulman", consumption: 0.5, consumptionUnit: "kg/yıl.rulman", unitPrice: 6, priceUnit: "€/kg" },
        { id: "r2", label: "Redüktör Yağı", qty: toplamRbcAdedi, qtyUnit: "redüktör", consumption: 7.4, consumptionUnit: "lt/yıl.redüktör", unitPrice: 4, priceUnit: "€/lt" },
        ...(isIleriAritmaChecked ? [
            { id: "r3", label: "Demir Üç Klorür (FeCl3)", qty: 1, qtyUnit: "Dozaj Ün.", consumption: ((gerekliFeCl3 * 365) / 1000).toFixed(2), consumptionUnit: "ton/yıl", unitPrice: 200, priceUnit: "€/ton" },
        ] : []),

        ...(isFiltrasyonChecked ? [
            { id: "s2", label: "Filtrasyon ve Dezenfeksiyon Üniteleri (İleri Arıtma)", isSubHeader: true },
            { id: "s2_sub", label: "Ön Klorlama Dozaj Pompası", isSubHeader: true, isLight: true },
            { id: "r4", label: "Sıvı Klor", qty: 1, qtyUnit: "Dozaj Ün.", consumption: 1.34, consumptionUnit: "ton/yıl", unitPrice: 0.38, priceUnit: "€/kg" },
        ] : []),

        ...(isCamurAktif ? [
            { id: "s3", label: "Çamur Susuzlaştırma Ünitesi", isSubHeader: true },
            { id: "r5", label: "Katyonik Polielektrolit", qty: 1, qtyUnit: "Dozaj Ün.", consumption: 91, consumptionUnit: "kg/yıl", unitPrice: 26, priceUnit: "€/kg" }
        ] : []),
    ];

    // Array içerisindeki boş spread durumlarını (false elemanları) filtrele
    return initialRows.filter(Boolean);
}