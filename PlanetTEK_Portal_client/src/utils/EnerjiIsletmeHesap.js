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
    const isMembraneAktif = modulesState.membrane?.checked || false;

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



    const membraneObj = equipmentsObject?.membraneSystem || {};

    // 2. İstediğin formata uygun olarak kW değerlerini parametrelere atıyoruz
    const membranefeedPumpKw = (membraneObj.feedPumps?.kw || 0);
    const membranerecirculationPumpKw = (membraneObj.recirculationPumps?.kw || 0);
    const membranenaoclDosingPumpKw = (membraneObj.naoclDosingPumps?.kw || 0);
    const membranecitricDosingPumpKw = (membraneObj.citricDosingPumps?.kw || 0);
    const membraneblowerKw = (membraneObj.blowers?.kw || 0);


    const filtrasyonObj = equipmentsObject?.filtrationSystem || {};
    const filtrsayonAdedi = filtrasyonObj?.sistemAdet || 0;
    const FiltrasyonBeslemekw = filtrasyonObj?.pompalar?.besleme?.kw || 0;
    const FiltrasyonYikamakw = filtrasyonObj?.pompalar?.geriYikama?.kw || 0;


    const CamurObj = equipmentsObject?.sludgeDewatering || {};
    const CamurEkipman = CamurObj.ekipmanTipi || "Filtrepres";

    const initialRows = [
        // Ana Başlık Her Zaman Render Edilir
        {
            id: "h1",
            label: teklifDili === "Yabancı" ? "MECHANICAL EQUIPMENTS" : "MEKANİK EKİPMANLAR",
            isHeader: true
        },

        // 1. ÖN ARITMA MODÜLÜ (isOnAritmaChecked)
        ...(isOnAritmaChecked ? [
            {
                id: "s1",
                label: teklifDili === "Yabancı" ? "Physical Treatment Units (Primary Treatment)" : "Fiziksel Arıtma Üniteleri (Birincil Arıtma)",
                isSubHeader: true
            },
            ...(otomatikIsgaraGoster ? [
                {
                    id: "r1",
                    label: teklifDili === "Yabancı" ? "Automatically Cleaned Coarse Screen" : "Otomatik Temizlemeli Kaba Izgara",
                    qty: 1, power: 0.55, consumed: 90, hours: 4
                },
                {
                    id: "r2",
                    label: teklifDili === "Yabancı" ? "Automatically Cleaned Fine Screen" : "Otomatik Temizlemeli İnce Izgara",
                    qty: 1, power: 0.55, consumed: 90, hours: 4
                }
            ] : [])
        ] : []),

        // 2. TERFİ POMPASI MODÜLÜ (isFeedPumpChecked)
        ...(isFeedPumpChecked ? [
            {
                id: "r3",
                label: teklifDili === "Yabancı" ? "Equalization Tank Feed Pump" : "Dengeleme Tankı Terfi Pompası",
                qty: FeedPumpamount,
                power: FeedPumpkw,
                consumed: 90,
                hours: 24
            }
        ] : []),

        // 3. BİYOLOJİK ARITMA (RBC üniteleri her zaman listelenir)
        {
            id: "s2",
            label: teklifDili === "Yabancı" ? "Biological Treatment Units (Secondary Treatment)" : "Biyolojik Arıtma Üniteleri (İkincil Arıtma)",
            isSubHeader: true
        },
        {
            id: "r4",
            label: teklifDili === "Yabancı" ? `PlanetDISK® ${RBCUnite} RBC Unit` : `PlanetDISK® ${RBCUnite} RBC Ünitesi`,
            qty: toplamRbcAdedi, power: RBCUnite === "MX" ? 0.37 : 0.25, consumed: 90, hours: 24
        },
        ...(atiksuType === "endustriyel" ? [
            {
                id: "r5",
                label: teklifDili === "Yabancı" ? "Blower" : "Blower",
                qty: toplamRbcAdedi, power: 1.6, consumed: 90, hours: 24
            },
        ] : []),
        {
            id: "r6",
            label: teklifDili === "Yabancı" ? "Secondary Clarifier Sludge Pump" : "Son Çöktürme Tankı Çamur Pompası",
            qty: camurPompasiAdet, power: camurPompasikW, consumed: 90, hours: 1
        },

        // 4. İLERİ ARITMA - AZOT/FOSFOR GİDERİMİ MODÜLÜ (isIleriAritmaChecked)
        ...(isIleriAritmaChecked ? [
            {
                id: "r7",
                label: teklifDili === "Yabancı" ? "Recirculation Pumps" : "Resürkilasyon Pompaları",
                qty: ileriAritmaPompaAdet, power: ileriAritmaPompakw, consumed: 90, hours: 24
            },
            {
                id: "r8",
                label: teklifDili === "Yabancı" ? "Anoxic Tank Mixer" : "Anoksik Tank Mikseri",
                qty: 1, power: ileriAritmaMikserkw, consumed: 90, hours: 24
            },
            {
                id: "r9",
                label: teklifDili === "Yabancı" ? "FeCl3 Dosing Pump" : "FeCl3 Dozaj Pompası",
                qty: ileriAritmaDozajAdedi, power: 0.09, consumed: 90, hours: 24
            }
        ] : []),

        // 5. FİLTRASYON VE DEZENFEKSİYON MODÜLÜ (isFiltrasyonChecked)
        ...(isFiltrasyonChecked ? [
            {
                id: "s3",
                label: teklifDili === "Yabancı" ? "Filtration and Disinfection Units (Advanced Treatment)" : "Filtrasyon ve Dezenfeksiyon Üniteleri (İleri Arıtma)",
                isSubHeader: true
            },
            {
                id: "r10",
                label: teklifDili === "Yabancı" ? "Pre-Chlorination Unit" : "Ön Klorlama Ünitesi",
                qty: filtrsayonAdedi, power: 0.09, consumed: 90, hours: 22
            },
            {
                id: "r11",
                label: teklifDili === "Yabancı" ? "Filtration System Feed Pump" : "Filtrasyon Sistemi Besleme Pompası",
                qty: filtrsayonAdedi, power: FiltrasyonBeslemekw, consumed: 90, hours: 22
            },
            {
                id: "r12",
                label: teklifDili === "Yabancı" ? "Filtration System Backwash Pump" : "Filtrasyon Sistemi Geri Yıkama Pompası",
                qty: filtrsayonAdedi, power: FiltrasyonYikamakw, consumed: 90, hours: 2
            }
        ] : []),

        // 7. ÇAMUR SUSUZLAŞTIRMA MODÜLÜ (isCamurAktif)
        ...(isCamurAktif ? [
            {
                id: "s5",
                label: teklifDili === "Yabancı" ? "Sludge Dewatering Unit" : "Çamur Susuzlaştırma Ünitesi",
                isSubHeader: true
            },
            {
                id: "r13",
                label: teklifDili === "Yabancı" ? "Sludge Feed Pump" : "Çamur Besleme Pompası",
                qty: 1, power: 1.5, consumed: 90, hours: 8
            },
            {
                id: "r14",
                label: teklifDili === "Yabancı"
                    ? (CamurEkipman === "Dekantör" ? "Decanter" : "Filter Press")
                    : CamurEkipman,
                qty: 1, power: CamurEkipman === "Dekantör" ? 11.5 : 2.2, consumed: 90, hours: 8
            },
            {
                id: "r15",
                label: teklifDili === "Yabancı" ? "Filtrate Water Pump" : "Süzüntü Suyu Pompası",
                qty: 1, power: 0.75, consumed: 90, hours: 8
            },
            {
                id: "r16",
                label: teklifDili === "Yabancı" ? "Polymer Dosing Unit" : "Polimer Dozaj Ünitesi",
                qty: 1, power: 1.10, consumed: 90, hours: 8
            }
        ] : []),

        // 7. ÇAMUR SUSUZLAŞTIRMA MODÜLÜ (isCamurAktif)
        ...(isMembraneAktif ? [
            {
                id: "s6",
                label: teklifDili === "Yabancı" ? "Planet Membran System" : "Planet Membran Sistemi",
                isSubHeader: true
            },
            {
                id: "r17",
                label: teklifDili === "Yabancı" ? "Membrane Feeding Pump" : "Mebran Besleme Pompası",
                qty: 1,
                power: membranefeedPumpKw,
                consumed: 90,
                hours: 8
            },
            {
                id: "r18",
                label: teklifDili === "Yabancı" ? "Membrane Recirculation Pump" : " Membran Geri Devir Pompası",
                qty: 1,
                power: membranerecirculationPumpKw,
                consumed: 90,
                hours: 8
            },
            {
                id: "r19",
                label: teklifDili === "Yabancı" ? "NaOCl Dosing Pump" : "NaOCl Dozaj Pompası",
                qty: 1,
                power: membranenaoclDosingPumpKw,
                consumed: 90,
                hours: 4
            },
            {
                id: "r20",
                label: teklifDili === "Yabancı" ? "Citric Acid Dosing Pump" : "Sitrik Asit Dozaj Pompası",
                qty: 1,
                power: membranecitricDosingPumpKw,
                consumed: 90,
                hours: 4
            },
            {
                id: "r21",
                label: teklifDili === "Yabancı" ? "Blower" : " Blower",
                qty: 1,
                power: membraneblowerKw,
                consumed: 90,
                hours: 8
            }
        ] : []),
    ];

    // Array içerisindeki boş spread durumlarını (false elemanları) filtrele
    return initialRows.filter(Boolean);
}