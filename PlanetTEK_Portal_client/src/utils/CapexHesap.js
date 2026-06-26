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

/**
 * Form verilerini ve dinamik API fiyatlarını alarak 
 * hiyerarşik CAPEX tablosunu hesaplayan ve numaralandıran ana motor.
 * ASENKRON SÜRÜM (async)
 */
export default async function capexHesapFonksiyonu(formData, priceData) {
    // Güvenlik Kontrolleri
    if (!formData || !priceData) return [];

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

    const lamellaAdeti = parseInt(lamellaDetaylar?.lamellaAdet) || 0;
    const lamellaModeli = lamellaDetaylar?.secilenLamellaModeli || "LS 45";
    const lamellaPomapasiAdedi = parseInt(lamellaDetaylar?.camurPompasiAdet) || 0;
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

    const teklifDili = formData?.customerInfo?.teklifDili || "Yabancı";

    const klorlama = filtrationObj?.onKlorlama;
    const beslemePompasi = filtrationObj?.pompalar?.besleme;
    const geriYikamaPompasi = filtrationObj?.pompalar?.geriYikama;
    const separatorFiltre = filtrationObj?.SecilenFiltreler?.seperatorFiltre;
    const kumFiltresi = filtrationObj?.SecilenFiltreler?.kumFiltre;
    const aktifKarbonFiltresi = filtrationObj?.SecilenFiltreler?.aktifKarbonFiltre;

    // Çamur Metrikleri
    const secilenCamurEkipmanTipi = sludgeObj?.ekipmanTipi;

    // 4. CRITICAL CHANGE: Dinamik Fiyat Resolver'larını Paralel Olarak Await Ediyoruz
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
        .filter(([key, value]) => isCamurAktif && value?.secili === true) // Aktif ve seçiliyse al
        .map(([key, value]) => {
            // "Burgu Konveyor" gibi boşluklu isimleri id'de güvenle kullanmak için snake_case veya lowercase yapabilirsin
            const safeIdKey = key.toLowerCase().replace(/\s+/g, '_');

            return {
                id: `5_${safeIdKey}`,
                type: 3,
                piece: value.adet || 1,
                label: key, // "Konveyör" veya "Burgu Konveyör" orijinal adı korur
                unitPrice: susuzlastirmaPrices[key] || 0, // Fiyat nesnesinden dinamik key ile oku
                discount: ekipmanIndirim
            };
        });

    // 5. Ana Şablon Tanımı (baseTemplate)
    const baseTemplate = [
        { id: "1_ana_mekanik", type: 0, label: "MEKANİK EKİPMANLAR" },
        { id: "1_alt_fiziksel", type: 1, label: "Fiziksel Arıtma Üniteleri (Birincil Arıtma)" },
        { id: "1_alt_izgara", type: 2, label: "Kaba ve İnce Izgara Seçenekleri" },
        {
            id: "1_izgara_kaba_manuel",
            type: 3,
            piece: isOnAritmaChecked && izgaraTipi === "Manuel Izgara" ? 1 : 0,
            label: `Elle Temizlemeli Kaba Izgara`,
            unitPrice: screenPrices.mKaba,
            discount: ekipmanIndirim
        },
        {
            id: "1_izgara_ince_manuel",
            type: 3,
            piece: isOnAritmaChecked && izgaraTipi === "Manuel Izgara" ? 1 : 0,
            label: "Elle Temizlemeli İnce Izgara",
            unitPrice: screenPrices.mInce,
            discount: ekipmanIndirim
        },
        {
            id: "1_izgara_kaba_oto",
            type: 3,
            piece: isOnAritmaChecked && izgaraTipi === "Otomatik Mekanik Izgara" ? 1 : 0,
            label: "Otomatik Temizlemeli Kaba Izgara",
            unitPrice: screenPrices.oKaba,
            discount: ekipmanIndirim
        },
        {
            id: "1_izgara_ince_oto",
            type: 3,
            piece: isOnAritmaChecked && izgaraTipi === "Otomatik Mekanik Izgara" ? 1 : 0,
            label: "Otomatik Temizlemeli İnce Izgara",
            unitPrice: screenPrices.oInce,
            discount: ekipmanIndirim
        },
        {
            id: "1_plaka_kum_yag",
            type: 3,
            piece: isOnAritmaChecked ? 4 : 0,
            label: `Kum-Yağ Tutucu Plakaları (Boyut: ${onAritmaObj.yagTutucuBoyut || "Standart"})`,
            unitPrice: screenPrices.plaka,
            discount: ekipmanIndirim
        },
        {
            id: "1_pompa_terfi",
            type: 3,
            piece: isFeedPumpChecked ? ToplamFeedpompaAdeti : 0,
            label: isFeedPumpChecked && feedPumpObj.secilenPompaMetni ? `Terfi Pompası (${pompaAdeti} asil + ${pompaAdeti} yedek) - ${feedPumpObj.secilenPompaMetni}` : "Terfi Pompası",
            unitPrice: terfiPrices.terfiPompasi,
            discount: ekipmanIndirim
        },
        {
            id: "1_yapi_dağıtım",
            type: 3,
            piece: isFeedPumpChecked && feedPumpObj.hasDistributionStructure ? 1 : 0,
            label: `Debi Dağıtım Yapısı (Giriş: ${feedPumpObj.distributionGirisAdet || 1}, Çıkış: ${feedPumpObj.distributionCikisAdet || 2})`,
            unitPrice: debidagitimPrices.dagitimYapisi,
            discount: ekipmanIndirim
        },

        { id: "1_alt_biyolojik", type: 1, label: "Biyolojik Arıtma Üniteleri (İkincil Arıtma)" },
        {
            id: "2_rbc_kapakli",
            type: 3,
            piece: UniteTipi === "Kapaklı" ? toplamRbcAdeti : 0,
            label: `PlanetDISK® ${rbcModeli} 1 DBD Ünitesi;\n- Epoksi Boyalı AISI 1045 (C45) Karbon Çelik Dolu Mil\n- Islak Parçalar SS304 Paslanmaz ve Galvaniz Kaplı Çelik\n- Mil Başına ${milBasinaDisk} Adet Disk Yüzey Alanı / Ünite`,
            unitPrice: rbcPrices.kapakli,
            discount: planetTekIndirim
        },
        {
            id: "2_rbc_sase",
            type: 3,
            piece: UniteTipi === "Şase" ? toplamRbcAdeti : 0,
            label: `PlanetDISK® ${rbcModeli} 1 DBD Rotor;\n- Epoksi Boyalı AISI 1045 (C45) Karbon Çelik Dolu Mil\n- Islak Parçalar SS304 Paslanmaz ve Galvaniz Kaplı Çelik\n- Mil Başına ${milBasinaDisk} Adet Disk Yüzey Alanı / Rotor`,
            unitPrice: rbcPrices.sase,
            discount: planetTekIndirim
        },
        {
            id: "2_rbc_kapaksiz",
            type: 3,
            piece: UniteTipi === "Kapaksız" ? toplamRbcAdeti : 0,
            label: `PlanetDISK® ${rbcModeli} 1 DBD Ünitesi (Kapaksız) ;\n- Epoksi Boyalı AISI 1045 (C45) Karbon Çelik Dolu Mil\n- Islak Parçalar SS304 Paslanmaz ve Galvaniz Kaplı Çelik\n- Mil Başına ${milBasinaDisk} Adet Disk Yüzey Alanı / Ünite`,
            unitPrice: rbcPrices.kapaksizUnite,
            discount: planetTekIndirim
        },
        {
            id: "2_rbc_kapak",
            type: 3,
            // Sadece UniteTipi "Kapaksız" ise adet alacak, aksi halde 0 olacak ve render edilmeyecek
            piece: UniteTipi === "Kapaksız" ? toplamRbcAdeti : 0,
            label: `PlanetDISK® ${rbcModeli} 1 DBD Ünitesi Kapağı`,
            unitPrice: rbcPrices.kapak,
            discount: planetTekIndirim,
            isOptional: true
        },
        {
            id: "2_rbc_blower",
            type: 3,
            // Sadece UniteTipi "Kapaksız" ise adet alacak, aksi halde 0 olacak ve render edilmeyecek
            piece: atiksuType === "endustriyel" ? toplamRbcAdeti : 0,
            label: `PlanetDISK® ${rbcModeli} Blower`,
            unitPrice: 1000,
            discount: ekipmanIndirim,
            isOptional: true
        },
        {
            id: "2_lamella_seperator",
            type: 3,
            piece: lamellaAdeti,
            label: `${lamellaModeli} Lamella Seperatör Son Çöktürme Tankı`,
            unitPrice: lamellaPrices.lamellaSeperator,
            discount: planetTekIndirim
        },
        {
            id: "2_pompa_camur_son_cokturme",
            type: 3,
            piece: lamellaPomapasiAdedi,
            label: `${lamellaPomapasiModeli} Son Çöktürme Tankı Çamur Pompası`,
            unitPrice: lamellaPumpPrices.camurPompasi,
            discount: ekipmanIndirim
        },

        {
            id: "3_pompa_resirkulasyon",
            type: 3,
            piece: isIleriAritmaChecked ? ToplamresirkulasyonPompaAdeti : 0,
            label: isIleriAritmaChecked && ileriAritmaPompaData?.geridevirPompasi ? `Resürkilasyon Pompası (${resirkulasyonPompaAdeti} asil + ${resirkulasyonPompaAdeti} yedek) - ${(ileriAritmaPompaData.geridevirPompasi || '').replace(`${resirkulasyonPompaAdeti} Adet`, `${resirkulasyonPompaAdeti * 2} Adet`)}` : "Resürkilasyon Pompası",
            unitPrice: ileriAritmaPrices.resirkulasyon,
            discount: ekipmanIndirim
        },
        {
            id: "3_mikser_denitrifikasyon",
            type: 3,
            piece: isIleriAritmaChecked ? mikserAdeti : 0,
            label: isIleriAritmaChecked && mixerData?.secilenMikserMetni ? `Denitrifikasyon Tankı Mikseri ;\n- ${mixerData.secilenTankMetni || ''}\n- ${mixerData.secilenMikserMetni || ''}` : "Denitrifikasyon Tankı Mikseri",
            unitPrice: ileriAritmaPrices.mikser,
            discount: ekipmanIndirim
        },
        {
            id: "3_dozaj_fecl3",
            type: 3,
            piece: isIleriAritmaChecked ? dozajPompaAdeti : 0,
            label: isIleriAritmaChecked && dozajData?.dozajPompasi ? `FeCl3 Koagülant Dozaj Sistemi ;\n- ${dozajData.dozajPompasi || ''}\n- ${dozajData.kimyasalTanki || ''}` : "FeCl3 Koagülant Dozaj Sistemi",
            unitPrice: ileriAritmaPrices.dozajFeCl3,
            discount: ekipmanIndirim
        },

        { id: "1_alt_filtrasyon", type: 1, label: "Filtrasyon ve Dezenfeksiyon Üniteleri (İleri Arıtma)" },
        {
            id: "4_klorlama_on",
            type: 3,
            piece: isFiltrasyonChecked && klorlama ? sistemAdet : 0,
            label: isFiltrasyonChecked && klorlama
                ? `Ön Klorlama Sistemi (${klorlama.pompaAdi || '-'} & ${klorlama.tankAdi || '-'})`
                : "Ön Klorlama Sistemi",
            unitPrice: filtrationPrices.onKlorlama || filtrationPrices.klorlama,
            discount: ekipmanIndirim
        },
        {
            id: "4_pompa_filtrasyon_besleme",
            type: 3,
            piece: isFiltrasyonChecked && beslemePompasi ? sistemAdet : 0,
            label: isFiltrasyonChecked && beslemePompasi
                ? `Filtrasyon Sistemi Besleme Pompası (Kapasite: ${beslemePompasi.debiM3h || '-'} m³/h - ${beslemePompasi.kw || '-'} kW)`
                : "Filtrasyon Sistemi Besleme Pompası",
            unitPrice: filtrationPrices.beslemePompasi,
            discount: ekipmanIndirim
        },
        {
            id: "4_pompa_filtrasyon_geriyikama",
            type: 3,
            piece: isFiltrasyonChecked && geriYikamaPompasi ? sistemAdet : 0,
            label: isFiltrasyonChecked && geriYikamaPompasi
                ? `Filtrasyon Sistemi Geri Yıkama Pompası (Kapasite: ${geriYikamaPompasi.debiM3h || '-'} m³/h - ${geriYikamaPompasi.kw || '-'} kW)`
                : "Filtrasyon Sistemi Geri Yıkama Pompası",
            unitPrice: filtrationPrices.geriYikamaPompasi || filtrationPrices.geriyikamaPompasi,
            discount: ekipmanIndirim
        },
        {
            id: "4_filtre_separator",
            type: 3,
            piece: isFiltrasyonChecked && separatorFiltre ? sistemAdet : 0,
            label: isFiltrasyonChecked && separatorFiltre
                ? `${separatorFiltre.isim || 'SEPERATÖR FİLTRE'} (Kapasite: ${separatorFiltre.debiM3h || '-'} m³/h)`
                : "Seperatör Filtre",
            unitPrice: filtrationPrices.separatorFiltre,
            discount: ekipmanIndirim
        },
        {
            id: "4_filtre_kum_oto",
            type: 3,
            piece: isFiltrasyonChecked && kumFiltresi ? sistemAdet : 0,
            label: isFiltrasyonChecked && kumFiltresi
                ? `Tam Otomatik ${kumFiltresi.isim || 'KUM FİLTRE SİSTEMİ'} (Kapasite: ${kumFiltresi.debiM3h || '-'} m³/h)`
                : "Tam Otomatik Kum Filtre Sistemi",
            unitPrice: filtrationPrices.kumFiltresi || filtrationPrices.kumFiltreOto,
            discount: ekipmanIndirim
        },
        {
            id: "4_filtre_karbon_oto",
            type: 3,
            piece: isFiltrasyonChecked && aktifKarbonFiltresi ? sistemAdet : 0,
            label: isFiltrasyonChecked && aktifKarbonFiltresi
                ? `Tam Otomatik ${aktifKarbonFiltresi.isim || 'AKTİF KARBON FİLTRE SİSTEMİ'} (Kapasite: ${aktifKarbonFiltresi.debiM3h || '-'} m³/h)`
                : "Tam Otomatik Aktif Karbon Filtre Sistemi",
            unitPrice: filtrationPrices.aktifKarbonFiltresi || filtrationPrices.karbonFiltreOto,
            discount: ekipmanIndirim
        },

        { id: "1_alt_camur", type: 1, label: "Çamur Susuzlaştırma Ünitesi" },
        {
            id: "5_pompa_camur_besleme",
            type: 3,
            piece: isCamurAktif && sludgeObj.beslemePompasi ? 1 : 0,
            label: isCamurAktif && sludgeObj.beslemePompasi ? `Çamur Besleme Pompası (${sludgeObj.beslemePompasi.kapasite_degeri || '1.00'} ${sludgeObj.beslemePompasi.kapasite_birimi || 'm3/saat'})` : "Çamur Besleme Pompası",
            unitPrice: susuzlastirmaPrices.camurBeslemePompa,
            discount: ekipmanIndirim
        },
        {
            id: "5_dekantor",
            type: 3,
            piece: isCamurAktif && secilenCamurEkipmanTipi === "Dekantör" ? 1 : 0,
            label: isCamurAktif && sludgeObj.anaEkipman ? `Dekantör (${sludgeObj.anaEkipman.kapasite_degeri || '1.00'} ${sludgeObj.anaEkipman.kapasite_birimi || 'm3/gun'})` : "Dekantör",
            unitPrice: susuzlastirmaPrices.dekantor,
            discount: ekipmanIndirim
        },
        {
            id: "5_filtrepress",
            type: 3,
            piece: isCamurAktif && secilenCamurEkipmanTipi === "Filtrepress" ? 1 : 0,
            label: isCamurAktif && sludgeObj.anaEkipman ? `Filtrepress (${sludgeObj.anaEkipman.kapasite_degeri || '1.00'} ${sludgeObj.anaEkipman.kapasite_birimi || 'm3/gun'})` : "Filtrepress",
            unitPrice: susuzlastirmaPrices.filtrepress,
            discount: ekipmanIndirim
        },
        {
            id: "5_polimer_unitesi",
            type: 3,
            piece: isCamurAktif && (sludgeObj.polimerUnitesi.adet || 1),
            label: "Polimer Hazırlama ve Dozaj Ünitesi",
            unitPrice: susuzlastirmaPrices.polimerUnitesi,
            discount: ekipmanIndirim
        },
        {
            id: "5_pompa_suzuntu_suyu",
            type: 3,
            piece: isCamurAktif && sludgeObj.suzuntuPompasi ? 1 : 0,
            label: isCamurAktif && sludgeObj.suzuntuPompasi ? `Süzüntü Suyu Pompası (${sludgeObj.suzuntuPompasi.kapasite_degeri || '1.00'} ${sludgeObj.suzuntuPompasi.kapasite_birimi || 'm3/saat'})` : "Süzüntü Suyu Pompası",
            unitPrice: susuzlastirmaPrices.suzuntuSuyuPompa,
            discount: ekipmanIndirim
        },
        ...dinamikOpsiyonKalemleri,

        { id: "1_ana_insaat", type: 0, label: "İNŞAAT İŞLERİ" },
        { id: "6_insaat_kanal_izgara", type: 3, piece: isOnAritmaChecked ? 1 : 0, label: "Izgara ve Kum-Yağ Tutucu Kanalı", unitPrice: 0, discount: 0, isUrgent: true },
        { id: "6_insaat_tank_anoksik", type: 3, piece: isIleriAritmaChecked ? 1 : 0, label: "Anoksik Denitrifikasyon Tankı", unitPrice: 0, discount: 0, isUrgent: true },
        { id: "6_insaat_tank_oncokturme_1", type: 3, piece: 1, label: "Birinci Ön Çöktürme Tankı", unitPrice: 0, discount: 0, isUrgent: true },
        { id: "6_insaat_tank_oncokturme_2", type: 3, piece: 1, label: "İkinci Ön Çöktürme Tankı", unitPrice: 0, discount: 0, isUrgent: true },
        { id: "6_insaat_tank_dengeleme", type: 3, piece: 1, label: "Dengeleme Tankı", unitPrice: 0, discount: 0, isUrgent: true },
        { id: "6_insaat_tank_aritilmis_su", type: 3, piece: isFiltrasyonChecked ? 1 : 0, label: "Arıtılmış Su Tankı", unitPrice: 0, discount: 0, isUrgent: true },
        { id: "6_insaat_tank_filtrelenmis_su", type: 3, piece: isFiltrasyonChecked ? 1 : 0, label: "Filtrelenmiş Su Tankı", unitPrice: 0, discount: 0, isUrgent: true },
        { id: "6_insaat_tank_camur", type: 3, piece: isCamurAktif ? 1 : 0, label: "Çamur Tankı", unitPrice: 0, discount: 0, isUrgent: true },

        { id: "1_ana_montaj", type: 0, label: "MONTAJ EKİPMANLARI" },
        { id: "7_montaj_borulama_tesisat", type: 3, piece: 1, label: "Bütün borulama ve elektrik tesisatı", unitPrice: rbcPrices.tesisat, discount: ekipmanIndirim },

        { id: "1_ana_elektrik", type: 0, label: "ELEKTRİK İŞLERİ" },
        { id: "7_elektrik_kontrol_panosu", type: 3, piece: 1, label: "PlanetDISK® Kontrol Panosu", unitPrice: rbcPrices.pano, discount: ekipmanIndirim },

        { id: "1_ana_nakliye", type: 0, label: "NAKLİYE" },
        { id: "7_konteyner", type: 3, piece: 1, label: "40' HC konteyner", unitPrice: othersPrices.konteyner, discount: 0, isOptional: true },
        { id: "7_nakliye_tir", type: 3, piece: 1, label: "Tır", unitPrice: othersPrices.nakliyeTir, discount: 0, isOptional: true },

        ...(teklifDili === "Yerli" ? [
            { id: "1_ana_muhendislik", type: 0, label: "PROJE, MONTAJ, DEVREYE ALMA, EĞİTİM ve MÜHENDİSLİK" },
            { id: "7_muhendislik_genel_paket", type: 3, piece: 1, label: "Mühendislik Hizmetleri Genel Paketi", unitPrice: montajPrices.montajBedeli, discount: ekipmanIndirim },
            { id: "1_ana_pod", type: 0, label: "POD HAZIRLANMASI ve ONAYININ ALINMASI-Harçlar Hariç" },
            { id: "7_pod_resmi_onay_yonetimi", type: 3, piece: 1, label: "Resmi Onay Süreçleri Yönetimi", unitPrice: 2300, discount: 0 }


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