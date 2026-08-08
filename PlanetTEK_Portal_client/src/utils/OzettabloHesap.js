// utils/OzettabloHesap.js

export const ozetTabloHesap = (formData) => {
    // 1. İndirimler ve Genel Bilgiler
    const customerInfo = formData?.customerInfo;
    const teklifDili = formData?.customerInfo?.teklifDili || "Yabancı";
    const isForeign = teklifDili === "Yabancı";

    const teklifNo = formData?.customerInfo?.teklifNo;
    const refNO = formData?.customerInfo?.offer_number;

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
    const UniteTipi = planetDiskDetails.tasarim?.aritmaParametreleri?.kapakSecimi || "Kapaklı";
    const yerlesimListesi = planetDiskDetails?.tasarim?.yerlesimSiralanisi || [];
    const toplamRbcAdeti = yerlesimListesi
        .filter(y => y.isLamella === false)
        .reduce((sum, curr) => sum + (parseInt(curr.adet) || 0), 0);
    const milBasinaDisk = yerlesimListesi.find(y => y.isLamella === false)?.milBasinaDisk || 120;
    const rbcSiralari = yerlesimListesi.filter(y => !y.isLamella);
    const toplamMilAdet = rbcSiralari.reduce((sum, item) => sum + (parseInt(item.adet) || 0), 0);
    const toplamDiskSayisi = toplamMilAdet * milBasinaDisk;
    const beklemeSuresi = parseFloat(rbcSiralari[0]?.beklemeSuresi) || 0;

    const interstateDiskAlaniDegeri = rbcModeli === "MINI" ? 2.6 : 6.6;

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
        }, {});

    const grupAnahtarlari = Object.keys(diskGruplari);

    // 3. Grup sayısına göre string'i oluştur
    const uniteBasinaDiskSayisi = grupAnahtarlari.length === 1
        ? `${grupAnahtarlari[0]}`
        : grupAnahtarlari.map(disk => `${disk} disk / ${diskGruplari[disk]} ${isForeign ? "units" : "ünite"}`).join(" , ");

    const uniteBasinaDiskAlani = grupAnahtarlari.length === 1
        ? `${(grupAnahtarlari[0] * interstateDiskAlaniDegeri).toFixed(2)}`
        : grupAnahtarlari.map(disk => `${(disk * interstateDiskAlaniDegeri).toFixed(1)} m² / ${diskGruplari[disk]} ${isForeign ? "units" : "ünite"}`).join(" , ");

    // 4. Lamella detayları
    const lamellaObj = formData?.planetDiskDetails?.tasarim?.lamella || {};
    const lamellaAdet = parseInt(lamellaObj.lamellaAdet) || 0;
    const lamellaAlani = parseFloat(lamellaObj.secilenModelAlan) || 0;
    const lamellaModeli = (lamellaObj.secilenLamellaModeli || "LS_45").replace("_", " ");

    // 5. Ekipman detayları
    const equipmentsObject = formData.equipments || {};
    const { modulesState = {} } = equipmentsObject;

    // 5.1 Modül Aktiflik Kontrolleri
    const isOnAritmaChecked = modulesState.onAritma?.checked || false;
    const isFeedPumpChecked = modulesState.feedPump?.checked || false;
    const isIleriAritmaChecked = modulesState.ileriAritma?.checked || false;
    const isFiltrasyonChecked = modulesState.filtrasyon?.checked || false;
    const isCamurAktif = modulesState.sludgeDewatering?.checked || false;
    const isMembraneAktif = modulesState.membrane?.checked || false;

    // 5.2. Alt Ekipman Alt Nesneleri
    const onAritmaObj = equipmentsObject.onAritma || {};
    const feedPumpObj = equipmentsObject.feedPump || {};
    const ileriAritmaObj = equipmentsObject.ileriAritma || {};
    const filtrationObj = equipmentsObject.filtrationSystem || {};
    const sludgeObj = equipmentsObject.sludgeDewatering || {};

    // 5.3. onAritmaObj Hesaplamaları
    const izgaraTipi = onAritmaObj.izgaraTipi || "";

    // 5.4. feedPumpObj Hesaplamaları
    const pompaAdeti = parseInt(feedPumpObj.pompaAdeti) || 0;
    const ToplamFeedpompaAdeti = pompaAdeti * 2;

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

    // 5.7. camurOpsiyonlari Hesaplamaları
    const secilenCamurEkipmanTipi = sludgeObj?.ekipmanTipi;
    const polimerUnitesiObjesi = sludgeObj.polimerUnitesi || {};
    const polimerAdet = polimerUnitesiObjesi.adet || 0;
    const opsiyonlar = sludgeObj.opsiyonlar || {};

    const formatDate = () => {
        return new Intl.DateTimeFormat('tr-TR', {
            year: 'numeric'
        }).format(new Date()).replace(/\./g, ' ');
    };

    const initialGeneralInfo = {
        offerNo: `${formatDate()} / ${teklifNo} `,
        refNo: refNO,
        clientName: customerInfo?.ticari_unvan || "-",
    };

    const initialParams = [
        {
            id: 1,
            label: isForeign ? "- Wastewater Source" : "- Atıksu Kaynağı",
            value: isForeign
                ? "Only domestic wastewater from toilets, sinks, shower, dishwash and laundry."
                : "Yalnızca kişisel kullanımdan kaynaklanan evsel atıksulara göre tasarım yapılmış olup, hayvanlardan kaynaklanan atıksular, klorlu havuz suları ve yağmur suları hesaba dahil edilmemiştir.",
            unit: "",
            isLongText: true
        },
        {
            id: 2,
            label: isForeign ? "- Final Destination of Treated Water" : "- Nihai Kullanım Amacı",
            value: isFiltrasyonChecked
                ? (isForeign ? "Irrigation / Reuse" : "Sulama/Geri Kazanım")
                : (isForeign ? "Discharge to Nature" : "Deşarj"),
            unit: ""
        },
        {
            id: 3,
            label: isForeign ? "- Hydraulic Load" : "- Hidrolik Yük",
            value: debiM3.toFixed(2),
            unit: isForeign ? "m³/day" : "m³/gün"
        },
        {
            id: 4,
            label: isForeign ? "- Hourly Flow Rate" : "- Saatlik Debi",
            value: (debiM3 / 24).toFixed(2),
            unit: isForeign ? "m³/hour" : "m³/saat"
        },
        {
            id: 5,
            label: isForeign ? "- Peak Flow Rate" : "- Pik Debi",
            value: ((debiM3 / 24) * 2).toFixed(2),
            unit: isForeign ? "m³/hour" : "m³/saat"
        },
        {
            id: 6,
            label: isForeign ? "- Organic Load (BOD)" : "- Organik Yük",
            value: organikYukKg,
            unit: isForeign ? "kg/day" : "kg/gün"
        },
        {
            id: 7,
            label: isForeign ? "- Wastewater Temperature" : "- Atıksu Sıcaklığı",
            value: String(sicaklik || "19"),
            unit: "°C"
        },
        {
            id: 8,
            label: isForeign ? "- Wastewater Retention Time in PlanetDISK® RBC Unit" : "- PlanetDISK® Ünitesi Alıkonma Süresi",
            value: beklemeSuresi.toFixed(2),
            unit: isForeign ? "hours" : "saat"
        },
        {
            id: 9,
            label: isForeign ? `- Number of PlanetDISK® ${rbcModeli || 'MX'} 1 RBC Units` : `- PlanetDISK® ${rbcModeli || 'MX'} 1 DBD Ünitesi Sayısı`,
            value: String(toplamMilAdet),
            unit: isForeign ? "units" : "adet"
        },
        {
            id: 10,
            label: isForeign ? "- Number of Disks" : "- Disk Adedi",
            value: uniteBasinaDiskSayisi,
            unit: isForeign ? "disks/unit" : "adet/ünite"
        },
        {
            id: 11,
            label: isForeign ? "- Disk Diameter" : "- Disk Çapı",
            value: rbcModeli === "MINI" ? "1.30" : "2.05",
            unit: "m"
        },
        {
            id: 12,
            label: isForeign ? "- Surface Area of 1 Disk" : "- 1 Diskin Yüzey Alanı",
            value: rbcModeli === "MINI" ? "2.60" : "6.60",
            unit: isForeign ? "m²/disk" : "m²/disk"
        },
        {
            id: 13,
            label: isForeign ? `- Surface Area of PlanetDISK® ${rbcModeli || 'MX'} 1 RBC Unit` : `- PlanetDISK® ${rbcModeli || 'MX'} 1 DBD Ünitesi Yüzey Alanı`,
            value: uniteBasinaDiskAlani,
            unit: isForeign ? "m²/unit" : "m²/ünite"
        },
        {
            id: 14,
            label: isForeign ? "- Total Disk Surface Area in this Project" : "- Bu Projedeki Toplam Disk Yüzey Alanı",
            value: (projeToplamDisk * interstateDiskAlaniDegeri).toFixed(2),
            unit: "m²"
        },
        {
            id: 15,
            label: isForeign ? `- Final Sedimentation Tank with Lamella Separator ${lamellaModeli}` : `- Lamella Seperatör ${lamellaModeli} Son Çöktürme Tankı`,
            value: String(lamellaAdet),
            unit: isForeign ? "units" : "adet"
        },
        {
            id: 16,
            label: isForeign ? `- 1 Unit Lamella Separator Final Sedimentation Tank ${lamellaModeli}` : `- 1 Adet Lamella Seperatör ${lamellaModeli} Son Çöktürme Tankı`,
            value: lamellaAlani.toFixed(0),
            unit: isForeign ? "m²/unit" : "m²/ünite"
        },
        {
            id: 17,
            label: isForeign ? `- Total Lamella Surface Area in Final Sedimentation Tank ${lamellaModeli}` : `- Lamella Seperatör ${lamellaModeli} Son Çöktürme Tankı Toplam Yüzey Alanı`,
            value: (lamellaAlani * lamellaAdet).toFixed(0),
            unit: "m²"
        }
    ];

    const initialContent = [
        {
            id: 1,
            isChecked: isOnAritmaChecked,
            qty: "1",
            unit: isForeign ? "set" : "set",
            desc: izgaraTipi === "Manuel Izgara"
                ? (isForeign ? "Manually Cleaned Coarse Screen" : "Elle Temizlemeli Kaba Izgara")
                : (isForeign ? "Automatically Cleaned Coarse Screen" : "Otomatik Temizlemeli Kaba Izgara")
        },
        {
            id: 2,
            isChecked: isOnAritmaChecked,
            qty: "1",
            unit: isForeign ? "set" : "set",
            desc: izgaraTipi === "Manuel Izgara"
                ? (isForeign ? "Manually Cleaned Fine Screen" : "Elle Temizlemeli İnce Izgara")
                : (isForeign ? "Automatically Cleaned Fine Screen" : "Otomatik Temizlemeli İnce Izgara")
        },
        {
            id: 3,
            isChecked: isOnAritmaChecked,
            qty: "4",
            unit: isForeign ? "units" : "adet",
            desc: isForeign ? "Sand-Oil Trap Plates" : "Kum-Yağ Tutucu Plakaları"
        },
        {
            id: 4,
            isChecked: isFeedPumpChecked,
            qty: ToplamFeedpompaAdeti,
            unit: isForeign ? "units" : "adet",
            desc: isForeign ? "Equalization Tank Feed Pumps" : "Dengeleme Tankı Terfi Pompaları"
        },
        {
            id: 5,
            isChecked: true,
            qty: String(toplamMilAdet),
            unit: isForeign ? "units" : "adet",
            desc: isForeign ? `PlanetDISK® ${rbcModeli || 'MX'} 1 RBC Unit` : `PlanetDISK® ${rbcModeli || 'MX'} 1 DBD Ünitesi`
        },
        {
            id: 6,
            isChecked: true,
            qty: String(toplamMilAdet),
            unit: isForeign ? "units" : "adet",
            desc: isForeign ? `PlanetDISK® ${rbcModeli || 'MX'} 1 RBC Unit Cover (Fiberglass)` : `PlanetDISK® ${rbcModeli || 'MX'} 1 DBD Ünitesi Kapağı`
        },
        {
            id: 7,
            isChecked: lamellaAdet > 0,
            qty: String(lamellaAdet),
            unit: isForeign ? "units" : "adet",
            desc: isForeign ? `${lamellaModeli} Lamella Separator Final Sedimentation Tank` : `${lamellaModeli} Lamella Seperatör Son Çöktürme Tankı`
        },
        {
            id: 8,
            isChecked: lamellaAdet > 0,
            qty: String(lamellaAdet),
            unit: isForeign ? "units" : "adet",
            desc: isForeign ? `${lamellaModeli} Lamella Separator Final Sedimentation Tank Sludge Pump` : `${lamellaModeli} Lamella Seperatör Son Çöktürme Tankı Çamur Pompası`
        },
        ...(isIleriAritmaChecked ? [
            { id: 9, isChecked: true, qty: dozajPompaAdeti, unit: isForeign ? "set" : "set", desc: isForeign ? "FeCl3 Coagulant Dosing System" : "FeCl3 Koagülant Dozaj Sistemi" },
            { id: 10, isChecked: true, qty: ToplamresirkulasyonPompaAdeti, unit: isForeign ? "units" : "adet", desc: isForeign ? "Recirculation Pump" : "Resürkilasyon Pompası " },
            { id: 11, isChecked: true, qty: mikserAdeti, unit: isForeign ? "units" : "adet", desc: isForeign ? "Denitrifikasyon Tank Mixer" : "Denitrifikasyon Tankı Mikseri " },
        ] : []),
        ...(isFiltrasyonChecked ? [
            { id: 11, isChecked: true, qty: sistemAdet, unit: isForeign ? "set" : "set", desc: isForeign ? "Pre-Chlorination Dosing System" : "Ön Klorlama Sistemi" },
            { id: 12, isChecked: true, qty: sistemAdet, unit: isForeign ? "units" : "adet", desc: isForeign ? "Filtration Feed Pump" : "Filtrasyon Besleme Pompası" },
            { id: 13, isChecked: true, qty: sistemAdet, unit: isForeign ? "units" : "adet", desc: isForeign ? "Backwash Pump" : "Geri Yıkama Pompası" },
            { id: 14, isChecked: true, qty: sistemAdet, unit: isForeign ? "units" : "adet", desc: isForeign ? "Separator Filter" : "Seperatör Filtre" },
            { id: 15, isChecked: true, qty: sistemAdet, unit: isForeign ? "set" : "adet", desc: isForeign ? "Fully Automatic Multimedia Filtration System" : "Tam Otomatik Multimedia Filtrasyon Sistemi" },
            { id: 16, isChecked: true, qty: sistemAdet, unit: isForeign ? "set" : "adet", desc: isForeign ? "Fully Automatic Activated Carbon Filtration System" : "Tam Otomatik Aktif Karbon Filtrasyon Sistemi" },
        ] : []),
        ...(isCamurAktif ? [
            { id: 17, isChecked: true, qty: "1", unit: isForeign ? "unit" : "adet", desc: secilenCamurEkipmanTipi },
            { id: 18, isChecked: true, qty: polimerAdet, unit: isForeign ? "set" : "set", desc: isForeign ? "Polymer Unit" : "Polimer Ünitesi" },
            { id: 19, isChecked: true, qty: "1", unit: isForeign ? "unit" : "adet", desc: isForeign ? "Sludge Feed Pump" : "Çamur Besleme Pompası" },
            { id: 20, isChecked: true, qty: "1", unit: isForeign ? "unit" : "adet", desc: isForeign ? "Filtrate Water Pump" : "Süzüntü Suyu Pompası" },

            ...Object.entries(opsiyonlar || {})
                .filter(([key, value]) => value.secili === true)
                .map(([key, value], index) => ({
                    id: `20.${index + 1}`,
                    isChecked: true,
                    qty: String(value.adet || 1),
                    unit: isForeign ? "units" : "adet",
                    desc: key
                }))
        ] : []),
        ...(isMembraneAktif ? [
            { id: 21, isChecked: true, qty: 1, unit: isForeign ? "set" : "set", desc: isForeign ? "Planet Membran System" : "Planet Membran Sistemi" },
        ] : []),
        { id: 22, isChecked: false, qty: "", unit: "", desc: isForeign ? "Civil & Construction Works – by Client" : "İnşaat İşleri – idare tarafından yapılacaktır", isHeaderStyle: true },
        { id: 23, isChecked: true, qty: "1", unit: isForeign ? "set" : "set", desc: isForeign ? "Piping & Electrical Works" : "Borulama & Elektrik İşleri" },
        { id: 24, isChecked: true, qty: "1", unit: isForeign ? "unit" : "adet", desc: isForeign ? "PlanetDISK® Control Panel" : "PlanetDISK® Kontrol Panosu" },
        ...(!isForeign ? [
            { id: 25, isChecked: true, qty: "1", unit: "set", desc: "Proje Onay Dosyasının Hazırlanması ve Onayının Alınması (Harçlar Hariç)" },
        ] : []),
        { id: 26, isChecked: true, qty: "", unit: "-", desc: isForeign ? "Supervision, Engineering, Commissioning & Training" : "Proje ve Mühendislik, Devreye Alma ve Eğitim Verilmesi" }
    ];

    return { generalInfo: initialGeneralInfo, params: initialParams, content: initialContent };
};