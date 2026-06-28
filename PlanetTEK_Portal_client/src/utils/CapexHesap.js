// CapexHesap.js
import {
    resolveScreenPrices,
    resolveTerfiPompasiPrices,
    resolveDebiDagitimPrices,
    resolveRBCPrices,
    resolveLamellaPrices,
    resolveLamellaPumpPrices,
    resolveIleriAritmaPrices,
    resolveFiltrationPrices,
    resolveSusuzlastirmaPrices,
    resolveOthersPrices,
    resolveMontajPrices
} from "./equipmentPriceResolvers";
import { CAPEX_LABELS } from "./capexLabels"; // Yeni eklenen dil paketi sabitleri

/**
 * Form verilerini ve dinamik API fiyatlarını alarak 
 * hiyerarşik CAPEX tablosunu hesaplayan ve numaralandıran ana motor.
 * ASENKRON SÜRÜM (async)
 */
export default async function capexHesapFonksiyonu(formData, priceData) {
    // Güvenlik Kontrolleri
    if (!formData || !priceData) return [];

    const teklifDili = formData?.customerInfo?.teklifDili || "Yabancı";
    // Dil anahtarı belirleme (Yerli değilse her koşulda EN setini çağırır)
    const lang = teklifDili === "Yerli" ? "TR" : "EN";
    const dict = CAPEX_LABELS[lang];

    // 1. İndirimler ve Genel Bilgiler
    const customerInfo = formData?.customerInfo;
    const planetTekIndirim = parseFloat(customerInfo?.planetTekIndirim) ?? 5;
    const ekipmanIndirim = parseFloat(customerInfo?.ekipmanIndirim) ?? 10;

    const equipmentsObject = formData.equipments || {};
    const { modulesState = {} } = equipmentsObject;

    // Modül Aktiflik Kontrolleri (Checkbox durumları)
    const isOnAritmaChecked = modulesState.onAritma?.checked || false;
    const isFeedPumpChecked = modulesState.feedPump?.checked || false;
    const isIleriAritmaChecked = modulesState.ileriAritma?.checked || false;
    const isFiltrasyonChecked = modulesState.filtrasyon?.checked || false;
    const isCamurAktif = modulesState.sludgeDewatering?.checked || false;

    // 2. Alt Ekipman Alt Nesneleri
    const onAritmaObj = equipmentsObject.onAritma || {};
    const feedPumpObj = equipmentsObject.feedPump || {};
    const ileriAritmaObj = equipmentsObject.ileriAritma || {};
    const filtrationObj = equipmentsObject.filtrationSystem || {};
    const sludgeObj = equipmentsObject.sludgeDewatering || {};
    const camurOpsiyonlari = sludgeObj.opsiyonlar || {};

    // 3. Modüllerden Metrik ve Model Hesaplamaları
    const izgaraTipi = onAritmaObj.izgaraTipi;
    const pompaAdeti = parseInt(feedPumpObj.pompaAdeti) || 0;
    const ToplamFeedpompaAdeti = pompaAdeti * 2; // Asil + Yedek mantığı

    const planetDiskDetails = formData.planetDiskDetails || {};
    const rbcModeli = planetDiskDetails?.tasarim?.aritmaParametreleri?.RBCUnite || "MX";
    const atiksuType = planetDiskDetails?.tasarim?.aritmaParametreleri?.atiksutype || "evsel";
    const UniteTipi = planetDiskDetails.tasarim?.aritmaParametreleri?.kasaTipi || "Kapaklı";
    const yerlesimListesi = planetDiskDetails?.tasarim?.yerlesimSiralanisi || [];
    const lamellaDetaylar = planetDiskDetails?.tasarim?.lamella || [];

    // Toplam RBC adet hesabı
    const toplamRbcAdeti = yerlesimListesi
        .filter(y => y.isLamella === false)
        .reduce((sum, curr) => sum + (parseInt(curr.adet) || 0), 0);
    const milBasinaDisk = yerlesimListesi.find(y => y.isLamella === false)?.milBasinaDisk || 120;
    const rbcSiralari = yerlesimListesi.filter(y => !y.isLamella);
    const toplamMilAdet = rbcSiralari.reduce((sum, item) => sum + (parseInt(item.adet) || 0), 0);
    const toplamDiskSayisi = toplamMilAdet * milBasinaDisk;
    const beklemeSuresi = parseFloat(rbcSiralari[0]?.beklemeSuresi) || 0;

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

    // Dil bazlı dinamik ek metinler için küçük bir iç kontrol (rotor / unit kavramı)
    const unitText = lang === "TR"
        ? (UniteTipi === "Şase" ? "rotor" : "ünite")
        : (UniteTipi === "Şase" ? "rotor" : "unit");

    const uniteBasinaDiskSayisi = grupAnahtarlari.length === 1
        ? `${grupAnahtarlari[0]} disk / ${unitText} `
        : grupAnahtarlari.map(disk => `${disk} disk / ${diskGruplari[disk]} ${unitText}`).join(" , ");

    const uniteBasinaDiskAlani = grupAnahtarlari.length === 1
        ? `${(grupAnahtarlari[0] * (UniteTipi === "MINI" ? 2.6 : 6.6)).toFixed(2)} m² / ${unitText}`
        : grupAnahtarlari.map(disk => `${(disk * (UniteTipi === "MINI" ? 2.6 : 6.6)).toFixed(2)} m² / ${diskGruplari[disk]} ${unitText}`).join(" , ");

    const lamellaAdeti = parseInt(lamellaDetaylar?.lamellaAdet) || 0;
    const lamellaModeli = lamellaDetaylar?.secilenLamellaModeli || "LS 45";
    const lamellaPomapasiAdet = parseInt(lamellaDetaylar?.camurPompasiAdet) || 0;
    const lamellaPomapasiModeli = lamellaDetaylar?.camurPompasi?.name || "smt 100A";

    // İleri Arıtma Metrikleri
    const mixerData = ileriAritmaObj?.IleriAritmaTankMixerSelections;
    const dozajData = ileriAritmaObj?.IleriAritmaDozajSelections;
    const ileriAritmaPompaData = ileriAritmaObj?.IleriAritmaPumpSelections;

    const mikserAdeti = mixerData?.secilenMikserMetni ? parseInt(mixerData.secilenMikserMetni) || 1 : 1;
    const dozajPompaAdeti = parseInt(dozajData?.pompaAdedi) || 1;
    const resirkulasyonPompaAdeti = parseInt(ileriAritmaPompaData?.pompaAdeti) || 1;
    const ToplamresirkulasyonPompaAdeti = resirkulasyonPompaAdeti * 2;

    // Filtrasyon Metrikleri
    const sistemAdet = parseInt(filtrationObj?.sistemAdet) || 1;

    const klorlama = filtrationObj?.onKlorlama;
    const beslemePompasi = filtrationObj?.pompalar?.besleme;
    const geriYikamaPompasi = filtrationObj?.pompalar?.geriYikama;
    const separatorFiltre = filtrationObj?.SecilenFiltreler?.seperatorFiltre;
    const kumFiltresi = filtrationObj?.SecilenFiltreler?.kumFiltre;
    const aktifKarbonFiltresi = filtrationObj?.SecilenFiltreler?.aktifKarbonFiltre;

    // Çamur Metrikleri
    const secilenCamurEkipmanTipi = sludgeObj?.ekipmanTipi;

    // 4. Dinamik Fiyat Resolver'ları Paralel Olarak Await Ediyoruz
    const [
        screenPrices,
        terfiPrices,
        debidagitimPrices,
        rbcPrices,
        lamellaPrices,
        lamellaPumpPrices,
        ileriAritmaPrices,
        filtrationPrices,
        susuzlastirmaPrices,
        othersPrices,
        montajPrices
    ] = await Promise.all([
        resolveScreenPrices(onAritmaObj, priceData),
        resolveTerfiPompasiPrices(feedPumpObj, priceData),
        resolveDebiDagitimPrices(feedPumpObj, priceData),
        resolveRBCPrices(planetDiskDetails, priceData, UniteTipi),
        resolveLamellaPrices(planetDiskDetails, priceData),
        resolveLamellaPumpPrices(lamellaPomapasiModeli, priceData),
        resolveIleriAritmaPrices(ileriAritmaObj, priceData),
        resolveFiltrationPrices(filtrationObj, priceData),
        resolveSusuzlastirmaPrices(sludgeObj, priceData),
        resolveOthersPrices(formData, priceData),
        resolveMontajPrices(formData, priceData)
    ]);

    const dinamikOpsiyonKalemleri = Object.entries(camurOpsiyonlari)
        .filter(([key, value]) => isCamurAktif && value?.secili === true)
        .map(([key, value]) => {
            const safeIdKey = key.toLowerCase().replace(/\s+/g, '_');
            // Çamur opsiyonel alt kalem isimlerinin de İngilizceye dönüştürülmesi gerekirse diye güvenli fallback yapısı:
            let displayLabel = key;
            if (lang === "EN") {
                if (key.includes("Burgu Konveyor") || key.includes("Konveyör")) displayLabel = "Screw Conveyor";
                else if (key.includes("Platform")) displayLabel = "Platform / Walkway";
            }

            return {
                id: `5_${safeIdKey}`,
                type: 3,
                piece: value.adet || 1,
                label: displayLabel,
                unitPrice: susuzlastirmaPrices[key] || 0,
                discount: ekipmanIndirim
            };
        });

    // 5. Temiz ve Dile Duyarlı Şablon Tanımı
    const baseTemplate = [
        { id: "1_ana_mekanik", type: 0, label: dict.ana_mekanik },
        { id: "1_alt_fiziksel", type: 1, label: dict.alt_fiziksel },
        { id: "1_alt_izgara", type: 2, label: dict.alt_izgara },
        {
            id: "1_izgara_kaba_manuel",
            type: 3,
            piece: isOnAritmaChecked && izgaraTipi === "Manuel Izgara" ? 1 : 0,
            label: dict.izgara_kaba_manuel,
            unitPrice: screenPrices.mKaba,
            discount: ekipmanIndirim
        },
        {
            id: "1_izgara_ince_manuel",
            type: 3,
            piece: isOnAritmaChecked && izgaraTipi === "Manuel Izgara" ? 1 : 0,
            label: dict.izgara_ince_manuel,
            unitPrice: screenPrices.mInce,
            discount: ekipmanIndirim
        },
        {
            id: "1_izgara_kaba_oto",
            type: 3,
            piece: isOnAritmaChecked && izgaraTipi === "Otomatik Mekanik Izgara" ? 1 : 0,
            label: dict.izgara_kaba_oto,
            unitPrice: screenPrices.oKaba,
            discount: ekipmanIndirim
        },
        {
            id: "1_izgara_ince_oto",
            type: 3,
            piece: isOnAritmaChecked && izgaraTipi === "Otomatik Mekanik Izgara" ? 1 : 0,
            label: dict.izgara_ince_oto,
            unitPrice: screenPrices.oInce,
            discount: ekipmanIndirim
        },
        {
            id: "1_plaka_kum_yag",
            type: 3,
            piece: isOnAritmaChecked ? 4 : 0,
            label: dict.plaka_kum_yag(onAritmaObj.yagTutucuBoyut || "Standart"),
            unitPrice: screenPrices.plaka,
            discount: ekipmanIndirim
        },
        {
            id: "1_pompa_terfi",
            type: 3,
            piece: isFeedPumpChecked ? ToplamFeedpompaAdeti : 0,
            label: dict.pompa_terfi(pompaAdeti, feedPumpObj.secilenPompaMetni),
            unitPrice: terfiPrices.terfiPompasi,
            discount: ekipmanIndirim
        },
        {
            id: "1_yapi_dağıtım",
            type: 3,
            piece: isFeedPumpChecked && feedPumpObj.hasDistributionStructure ? 1 : 0,
            label: dict.yapi_dagitim(feedPumpObj.distributionGirisAdet || 1, feedPumpObj.distributionCikisAdet || 2),
            unitPrice: debidagitimPrices.dagitimYapisi,
            discount: ekipmanIndirim
        },

        { id: "1_alt_biyolojik", type: 1, label: dict.alt_biyolojik },
        {
            id: "2_rbc_kapakli",
            type: 3,
            piece: UniteTipi === "Kapaklı" ? toplamRbcAdeti : 0,
            label: dict.rbc_kapakli(rbcModeli, uniteBasinaDiskSayisi, uniteBasinaDiskAlani),
            unitPrice: rbcPrices.kapakli,
            discount: planetTekIndirim
        },
        {
            id: "2_rbc_sase",
            type: 3,
            piece: UniteTipi === "Şase" ? toplamRbcAdeti : 0,
            label: dict.rbc_sase(rbcModeli, uniteBasinaDiskSayisi, uniteBasinaDiskAlani),
            unitPrice: rbcPrices.sase,
            discount: planetTekIndirim
        },
        {
            id: "2_rbc_kapaksiz",
            type: 3,
            piece: UniteTipi === "Kapaksız" ? toplamRbcAdeti : 0,
            label: dict.rbc_kapaksiz(rbcModeli, uniteBasinaDiskSayisi, uniteBasinaDiskAlani),
            unitPrice: rbcPrices.kapaksizUnite,
            discount: planetTekIndirim
        },
        {
            id: "2_rbc_kapak",
            type: 3,
            piece: UniteTipi === "Kapaksız" ? toplamRbcAdeti : 0,
            label: dict.rbc_kapak(rbcModeli),
            unitPrice: rbcPrices.kapak,
            discount: planetTekIndirim,
            isOptional: true
        },
        {
            id: "2_rbc_blower",
            type: 3,
            piece: atiksuType === "endustriyel" ? toplamRbcAdeti : 0,
            label: dict.rbc_blower(rbcModeli),
            unitPrice: 1000,
            discount: ekipmanIndirim,
            isOptional: true
        },
        {
            id: "2_lamella_seperator",
            type: 3,
            piece: lamellaAdeti,
            label: dict.lamella_seperator(lamellaModeli),
            unitPrice: lamellaPrices.lamellaSeperator,
            discount: planetTekIndirim
        },
        {
            id: "2_pompa_camur_son_cokturme",
            type: 3,
            piece: lamellaPomapasiAdet,
            label: dict.pompa_camur_son_cokturme(lamellaPomapasiModeli),
            unitPrice: lamellaPumpPrices.camurPompasi,
            discount: ekipmanIndirim
        },

        {
            id: "3_pompa_resirkulasyon",
            type: 3,
            piece: isIleriAritmaChecked ? ToplamresirkulasyonPompaAdeti : 0,
            label: dict.pompa_resirkulasyon(resirkulasyonPompaAdeti, ileriAritmaPompaData?.geridevirPompasi),
            unitPrice: ileriAritmaPrices.resirkulasyon,
            discount: ekipmanIndirim
        },
        {
            id: "3_mikser_denitrifikasyon",
            type: 3,
            piece: isIleriAritmaChecked ? mikserAdeti : 0,
            label: dict.mikser_denitrifikasyon,
            unitPrice: ileriAritmaPrices.mikser,
            discount: ekipmanIndirim
        },
        {
            id: "3_dozaj_fecl3",
            type: 3,
            piece: isIleriAritmaChecked ? dozajPompaAdeti : 0,
            label: dict.dozaj_fecl3,
            unitPrice: ileriAritmaPrices.dozajFeCl3,
            discount: ekipmanIndirim
        },

        { id: "1_alt_filtrasyon", type: 1, label: dict.alt_filtrasyon },
        {
            id: "4_klorlama_on",
            type: 3,
            piece: isFiltrasyonChecked && klorlama ? sistemAdet : 0,
            label: dict.klorlama_on,
            unitPrice: filtrationPrices.onKlorlama || filtrationPrices.klorlama,
            discount: ekipmanIndirim
        },
        {
            id: "4_pompa_filtrasyon_besleme",
            type: 3,
            piece: isFiltrasyonChecked && beslemePompasi ? sistemAdet : 0,
            label: dict.pompa_filtrasyon_besleme(beslemePompasi?.debiM3h, beslemePompasi?.kw),
            unitPrice: filtrationPrices.beslemePompasi,
            discount: ekipmanIndirim
        },
        {
            id: "4_pompa_filtrasyon_geriyikama",
            type: 3,
            piece: isFiltrasyonChecked && geriYikamaPompasi ? sistemAdet : 0,
            label: dict.pompa_filtrasyon_geriyikama(geriYikamaPompasi?.debiM3h, geriYikamaPompasi?.kw),
            unitPrice: filtrationPrices.geriYikamaPompasi || filtrationPrices.geriyikamaPompasi,
            discount: ekipmanIndirim
        },
        {
            id: "4_filtre_separator",
            type: 3,
            piece: isFiltrasyonChecked && separatorFiltre ? sistemAdet : 0,
            label: dict.filtre_separator(separatorFiltre?.isim, separatorFiltre?.debiM3h),
            unitPrice: filtrationPrices.separatorFiltre,
            discount: ekipmanIndirim
        },
        {
            id: "4_filtre_kum_oto",
            type: 3,
            piece: isFiltrasyonChecked && kumFiltresi ? sistemAdet : 0,
            label: dict.filtre_kum_oto(kumFiltresi?.isim, kumFiltresi?.debiM3h),
            unitPrice: filtrationPrices.kumFiltresi || filtrationPrices.kumFiltreOto,
            discount: ekipmanIndirim
        },
        {
            id: "4_filtre_karbon_oto",
            type: 3,
            piece: isFiltrasyonChecked && aktifKarbonFiltresi ? sistemAdet : 0,
            label: dict.filtre_karbon_oto(aktifKarbonFiltresi?.isim, aktifKarbonFiltresi?.debiM3h),
            unitPrice: filtrationPrices.aktifKarbonFiltresi || filtrationPrices.karbonFiltreOto,
            discount: ekipmanIndirim
        },

        { id: "1_alt_camur", type: 1, label: dict.alt_camur },
        {
            id: "5_pompa_camur_besleme",
            type: 3,
            piece: isCamurAktif && sludgeObj.beslemePompasi ? 1 : 0,
            label: dict.pompa_camur_besleme(sludgeObj.beslemePompasi?.kapasite_degeri, sludgeObj.beslemePompasi?.kapasite_birimi),
            unitPrice: susuzlastirmaPrices.camurBeslemePompa,
            discount: ekipmanIndirim
        },
        {
            id: "5_dekantor",
            type: 3,
            piece: isCamurAktif && secilenCamurEkipmanTipi === "Dekantör" ? 1 : 0,
            label: dict.dekantor(sludgeObj.anaEkipman?.kapasite_degeri, sludgeObj.anaEkipman?.kapasite_birimi),
            unitPrice: susuzlastirmaPrices.dekantor,
            discount: ekipmanIndirim
        },
        {
            id: "5_filtrepress",
            type: 3,
            piece: isCamurAktif && secilenCamurEkipmanTipi === "Filtrepress" ? 1 : 0,
            label: dict.filtrepress(sludgeObj.anaEkipman?.kapasite_degeri, sludgeObj.anaEkipman?.kapasite_birimi),
            unitPrice: susuzlastirmaPrices.filtrepress,
            discount: ekipmanIndirim
        },
        {
            id: "5_polimer_unitesi",
            type: 3,
            piece: isCamurAktif && (sludgeObj.polimerUnitesi?.adet || 1) ? 1 : 0,
            label: dict.polimer_unitesi,
            unitPrice: susuzlastirmaPrices.polimerUnitesi,
            discount: ekipmanIndirim
        },
        {
            id: "5_pompa_suzuntu_suyu",
            type: 3,
            piece: isCamurAktif && sludgeObj.suzuntuPompasi ? 1 : 0,
            label: dict.pompa_suzuntu_suyu(sludgeObj.suzuntuPompasi?.kapasite_degeri, sludgeObj.suzuntuPompasi?.kapasite_birimi),
            unitPrice: susuzlastirmaPrices.suzuntuSuyuPompa,
            discount: ekipmanIndirim
        },
        ...dinamikOpsiyonKalemleri,

        { id: "1_ana_insaat", type: 0, label: dict.ana_insaat },
        { id: "6_insaat_kanal_izgara", type: 3, piece: isOnAritmaChecked ? 1 : 0, label: dict.insaat_kanal_izgara, unitPrice: 0, discount: 0, isUrgent: true },
        { id: "6_insaat_tank_anoksik", type: 3, piece: isIleriAritmaChecked ? 1 : 0, label: dict.insaat_tank_anoksik, unitPrice: 0, discount: 0, isUrgent: true },
        { id: "6_insaat_tank_oncokturme_1", type: 3, piece: 1, label: dict.insaat_tank_oncokturme_1, unitPrice: 0, discount: 0, isUrgent: true },
        { id: "6_insaat_tank_oncokturme_2", type: 3, piece: 1, label: dict.insaat_tank_oncokturme_2, unitPrice: 0, discount: 0, isUrgent: true },
        { id: "6_insaat_tank_dengeleme", type: 3, piece: 1, label: dict.insaat_tank_dengeleme, unitPrice: 0, discount: 0, isUrgent: true },
        { id: "6_insaat_tank_aritilmis_su", type: 3, piece: isFiltrasyonChecked ? 1 : 0, label: dict.insaat_tank_aritilmis_su, unitPrice: 0, discount: 0, isUrgent: true },
        { id: "6_insaat_tank_filtrelenmis_su", type: 3, piece: isFiltrasyonChecked ? 1 : 0, label: dict.insaat_tank_filtrelenmis_su, unitPrice: 0, discount: 0, isUrgent: true },
        { id: "6_insaat_tank_camur", type: 3, piece: isCamurAktif ? 1 : 0, label: dict.insaat_tank_camur, unitPrice: 0, discount: 0, isUrgent: true },

        { id: "1_ana_montaj", type: 0, label: dict.ana_montaj },
        { id: "7_montaj_borulama_tesisat", type: 3, piece: 1, label: dict.montaj_borulama_tesisat, unitPrice: rbcPrices.tesisat, discount: ekipmanIndirim },

        { id: "1_ana_elektrik", type: 0, label: dict.ana_elektrik },
        { id: "7_elektrik_kontrol_panosu", type: 3, piece: 1, label: dict.elektrik_kontrol_panosu, unitPrice: rbcPrices.pano, discount: ekipmanIndirim },

        { id: "1_ana_nakliye", type: 0, label: dict.ana_nakliye },
        { id: "7_konteyner", type: 3, piece: 1, label: dict.konteyner, unitPrice: othersPrices.konteyner, discount: 0, isOptional: true },
        { id: "7_nakliye_tir", type: 3, piece: 1, label: dict.nakliye_tir, unitPrice: othersPrices.nakliyeTir, discount: 0, isOptional: true },

        ...(teklifDili === "Yerli" ? [
            { id: "1_ana_muhendislik", type: 0, label: dict.ana_muhendislik },
            { id: "7_muhendislik_genel_paket", type: 3, piece: 1, label: dict.muhendislik_genel_paket, unitPrice: montajPrices.montajBedeli, discount: ekipmanIndirim },
            { id: "1_ana_pod", type: 0, label: dict.ana_pod },
            { id: "7_pod_resmi_onay_yonetimi", type: 3, piece: 1, label: dict.pod_resmi_onay_yonetimi, unitPrice: 2300, discount: 0 }
        ] : []),
    ];

    // 6. Matematiksel Hesaplama Motoru
    const processedRows = baseTemplate
        .map(row => {
            if (row.type < 3) {
                return { ...row, piece: 0, unitPrice: 0, discount: 0, rawTotal: 0, netTotal: 0 };
            }
            const piece = parseFloat(row.piece) || 0;
            const unitPrice = parseFloat(row.unitPrice) || 0;
            const discount = parseFloat(row.discount) || 0;

            const rawTotal = piece * unitPrice;
            const netTotal = rawTotal * (1 - discount / 100);

            return {
                ...row,
                piece,
                unitPrice,
                discount,
                rawTotal: parseFloat(rawTotal.toFixed(2)),
                netTotal: parseFloat(netTotal.toFixed(2))
            };
        })
        .filter(row => row.type < 3 || row.piece > 0);

    // 7. Yenilenen Kusursuz Temizleme Algoritması
    const filteredRows = [];
    let activeForType2 = false;
    let activeForType1 = false;
    let activeForType0 = false;

    for (let i = processedRows.length - 1; i >= 0; i--) {
        const row = processedRows[i];

        if (row.type === 3) {
            filteredRows.unshift(row);
            activeForType2 = true;
            activeForType1 = true;
            activeForType0 = true;
        }
        else if (row.type === 2) {
            if (activeForType2) filteredRows.unshift(row);
            activeForType2 = false;
        }
        else if (row.type === 1) {
            if (activeForType1) filteredRows.unshift(row);
            activeForType1 = false;
            activeForType2 = false;
        }
        else if (row.type === 0) {
            if (activeForType0) filteredRows.unshift(row);
            activeForType0 = false;
            activeForType1 = false;
            activeForType2 = false;
        }
    }

    // 8. Hiyerarşik Numaralandırma Motoru
    let i0 = 0; let i1 = 0; let i2 = 0; let i3 = 0;
    return filteredRows.map(row => {
        let noStr = "";
        if (row.type === 0) {
            i0++; i1 = 0; i2 = 0; i3 = 0;
            noStr = `${i0}.`;
        }
        else if (row.type === 1) {
            i1++; i2 = 0; i3 = 0;
            noStr = `${i0}.${i1}.`;
        }
        else if (row.type === 2) {
            i2++; i3 = 0;
            noStr = `${i0}.${i1}.${i2}.`;
        }
        else if (row.type === 3) {
            i3++;
            if (i2 > 0) noStr = `${i0}.${i1}.${i2}.${i3}.`;
            else if (i1 > 0) noStr = `${i0}.${i1}.${i3}.`;
            else noStr = `${i0}.${i3}.`;
        }
        return { ...row, no: noStr };
    });
}