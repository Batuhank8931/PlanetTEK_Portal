// capexLabels.js

export const CAPEX_LABELS = {
    TR: {
        // Ana Başlıklar (Type 0)
        ana_mekanik: "MEKANİK EKİPMANLAR",
        ana_insaat: "İNŞAAT İŞLERİ",
        ana_montaj: "MONTAJ EKİPMANLARI",
        ana_elektrik: "ELEKTRİK İŞLERİ",
        ana_nakliye: "NAKLİYE",
        ana_muhendislik: "PROJE, MONTAJ, DEVREYE ALMA, EĞİTİM ve MÜHENDİSLİK",
        ana_pod: "POD HAZIRLANMASI ve ONAYININ ALINMASI-Harçlar Hariç",

        // Alt Başlıklar (Type 1 & 2)
        alt_fiziksel: "Fiziksel Arıtma Üniteleri (Birincil Arıtma)",
        alt_izgara: "Kaba ve İnce Izgara Seçenekleri",
        alt_biyolojik: "Biyolojik Arıtma Üniteleri (İkincil Arıtma)",
        alt_filtrasyon: "Filtrasyon ve Dezenfeksiyon Üniteleri (İleri Arıtma)",
        alt_camur: "Çamur Susuzlaştırma Ünitesi",

        // Kalemler (Type 3)
        izgara_kaba_manuel: "Elle Temizlemeli Kaba Izgara",
        izgara_ince_manuel: "Elle Temizlemeli İnce Izgara",
        izgara_kaba_oto: "Otomatik Temizlemeli Kaba Izgara",
        izgara_ince_oto: "Otomatik Temizlemeli İnce Izgara",
        plaka_kum_yag: (boyut) => `Kum-Yağ Tutucu Plakaları`,
        pompa_terfi: (adet) => `Terfi Pompası (${adet} asil + ${adet} yedek)`,
        yapi_dagitim: (giris, cikis) => `Debi Dağıtım Yapısı (Giriş: ${giris}, Çıkış: ${cikis})`,

        rbc_kapakli: (rbcModeli, uniteBasinaDiskSayisi, uniteBasinaDiskAlani) => `PlanetDISK® ${rbcModeli} 1 DBD Ünitesi;\n- Epoksi Boyalı AISI 1045 (C45) Karbon Çelik Dolu Mil,\n- Islak Parçalar SS304 Paslanmaz ve Galvaniz Kaplı Çelik,\n- Mil Başına ${uniteBasinaDiskSayisi},\n- Disk Yüzey Alanı ${uniteBasinaDiskAlani}`,
        rbc_sase_kapakli: (rbcModeli, uniteBasinaDiskSayisi, uniteBasinaDiskAlani) => `PlanetDISK® ${rbcModeli} 1 DBD Rotor;\n- Epoksi Boyalı AISI 1045 (C45) Karbon Çelik Dolu Mil,\n- Islak Parçalar SS304 Paslanmaz ve Galvaniz Kaplı Çelik,\n- Mil Başına ${uniteBasinaDiskSayisi},\n- Disk Yüzey Alanı ${uniteBasinaDiskAlani}`,
        rbc_sase_kapaksiz: (rbcModeli, uniteBasinaDiskSayisi, uniteBasinaDiskAlani) => `PlanetDISK® ${rbcModeli} 1 DBD Rotor(Kapaksız);\n- Epoksi Boyalı AISI 1045 (C45) Karbon Çelik Dolu Mil,\n- Islak Parçalar SS304 Paslanmaz ve Galvaniz Kaplı Çelik,\n- Mil Başına ${uniteBasinaDiskSayisi},\n- Disk Yüzey Alanı ${uniteBasinaDiskAlani}`,
        rbc_kapaksiz: (rbcModeli, uniteBasinaDiskSayisi, uniteBasinaDiskAlani) => `PlanetDISK® ${rbcModeli} 1 DBD Ünitesi(Kapaksız);\n- Epoksi Boyalı AISI 1045 (C45) Karbon Çelik Dolu Mil,\n- Islak Parçalar SS304 Paslanmaz ve Galvaniz Kaplı Çelik,\n- Mil Başına ${uniteBasinaDiskSayisi},\n- Disk Yüzey Alanı ${uniteBasinaDiskAlani}`,
        rbc_kapak: (rbcModeli) => `PlanetDISK® ${rbcModeli} 1 DBD Ünitesi Kapağı`,
        rbc_blower: (rbcModeli) => `Blower`,

        lamella_seperator: (lamellaModeli) => `${lamellaModeli} Lamella Seperatör Son Çöktürme Tankı`,
        pompa_camur_son_cokturme: (lamellaPomapasiModeli) => `${lamellaPomapasiModeli} Son Çöktürme Tankı Çamur Pompası`,

        pompa_resirkulasyon: (resirkulasyonPompaAdeti) => `Resürkilasyon Pompası (${resirkulasyonPompaAdeti} asil + ${resirkulasyonPompaAdeti} yedek)`,
        mikser_denitrifikasyon: "Denitrifikasyon Tankı Mikseri",
        dozaj_fecl3: "FeCl3 Koagülant Dozaj Sistemi",

        klorlama_on: "Ön Klorlama Sistemi",
        pompa_filtrasyon_besleme: `Filtrasyon Sistemi Besleme Pompası`,
        pompa_filtrasyon_geriyikama: `Filtrasyon Sistemi Geri Yıkama Pompası`,
        filtre_separator: `Seperatör Filtre `,
        filtre_kum_oto: `Tam Otomatik Kum Filtresi Sistemi `,
        filtre_karbon_oto: `Tam Otomatik Aktif Karbon Filtresi Sistemi`,

        pompa_camur_besleme: `Çamur Besleme Pompası`,
        dekantor: `Dekantör`,
        filtrepress: `Filtrepress`,
        polimer_unitesi: "Polimer Hazırlama ve Dozaj Ünitesi",
        pompa_suzuntu_suyu: `Süzüntü Suyu Pompas`,

        membrane_header: `Membrane Sistemi`,
        membrane_system: `Planet Membran Sistemi \n(Bütün ekipmanları dahil)`,

        insaat_kanal_izgara: "Izgara ve Kum-Yağ Tutucu Kanalı",
        insaat_tank_anoksik: "Anoksik Denitrifikasyon Tankı",
        insaat_tank_oncokturme_1: "Birinci Ön Çöktürme Tankı",
        insaat_tank_oncokturme_2: "İkinci Ön Çöktürme Tankı",
        insaat_tank_dengeleme: "Dengeleme Tankı",
        insaat_tank_aritilmis_su: "Arıtılmış Su Tankı",
        insaat_tank_filtrelenmis_su: "Filtrelenmiş Su Tankı",
        insaat_tank_camur: "Çamur Tankı",
        insaat_isleri: "TÜM İNŞAAT İŞLERİ İŞVEREN TARAFINDAN YAPILACAKTIR.",

        montaj_borulama_tesisat: "Bütün borulama ve elektrik tesisatı",
        elektrik_kontrol_panosu: "PlanetDISK® Kontrol Panosu",
        konteyner: "40' HC konteyner",
        nakliye_tir: "Tır",
        muhendislik_genel_paket: "Mühendislik Hizmetleri Genel Paketi",
        pod_resmi_onay_yonetimi: "Resmi Onay Süreçleri Yönetimi",
        inserted_new_parameter: "Araya Eklenen Yeni Parametre"
    },
    EN: {
        // Ana Başlıklar (Type 0 - Görseldeki birebir başlıklar)
        ana_mekanik: "MECHANICAL EQUIPMENT",
        ana_insaat: "CIVIL WORKS",
        ana_montaj: "INSTALLATION MATERIAL",
        ana_elektrik: "ELECTRICAL WORKS",
        ana_nakliye: "TRANSPORTATION",
        ana_muhendislik: "PROJECT, INSTALLATION, COMMISSIONING, TRAINING and ENGINEERING",
        ana_pod: "PREPARATION AND APPROVAL OF POD - Excluding Fees",

        // Alt Başlıklar (Type 1 & 2)
        alt_fiziksel: "Physical Treatment Units (Primary Treatment)",
        alt_izgara: "Coarse and Fine Screen Options",
        alt_biyolojik: "Biological Treatment Units (Secondary Treatment)",
        alt_filtrasyon: "Filtration and Disinfection Units (Advanced Treatment)",
        alt_camur: "Sludge Dewatering Unit",

        // Kalemler (Type 3 - Tablo terimlerine sadık kalınarak)
        izgara_kaba_manuel: "Manually Cleaned Coarse Screen",
        izgara_ince_manuel: "Manually Cleaned Fine Screen",
        izgara_kaba_oto: "Automatically Cleaned Coarse Screen",
        izgara_ince_oto: "Automatically Cleaned Fine Screen",
        plaka_kum_yag: (boyut) => `Grit-Oil Trap Plates`,
        pompa_terfi: (adet) => `Feeding Pump (${adet} duty + ${adet} standby)`,
        yapi_dagitim: (giris, cikis) => `Flow Distribution Structure (Influent: ${giris}, Effluent: ${cikis})`,

        rbc_kapakli: (rbcModeli, uniteBasinaDiskSayisi, uniteBasinaDiskAlani) => `PlanetDISK® ${rbcModeli} 1 RBC Unit;\n- Epoxy Painted AISI 1045 (C45) Carbon Steel Solid Shaft,\n- Wet Parts SS304 Stainless and Galvanized Coated Steel,\n- ${uniteBasinaDiskSayisi} per Shaft,\n- Disk Surface Area ${uniteBasinaDiskAlani}`,
        rbc_sase_kapakli: (rbcModeli, uniteBasinaDiskSayisi, uniteBasinaDiskAlani) => `PlanetDISK® ${rbcModeli} 1 RBC Rotor;\n- Epoxy Painted AISI 1045 (C45) Carbon Steel Solid Shaft,\n- Wet Parts SS304 Stainless and Galvanized Coated Steel,\n- ${uniteBasinaDiskSayisi} per Shaft,\n- Disk Surface Area ${uniteBasinaDiskAlani}`,
        rbc_sase_kapaksiz: (rbcModeli, uniteBasinaDiskSayisi, uniteBasinaDiskAlani) => `PlanetDISK® ${rbcModeli} 1 RBC Rotor (Without Lid);\n- Epoxy Painted AISI 1045 (C45) Carbon Steel Solid Shaft,\n- Wet Parts SS304 Stainless and Galvanized Coated Steel,\n- ${uniteBasinaDiskSayisi} per Shaft,\n- Disk Surface Area ${uniteBasinaDiskAlani}`,
        rbc_kapaksiz: (rbcModeli, uniteBasinaDiskSayisi, uniteBasinaDiskAlani) => `PlanetDISK® ${rbcModeli} 1 RBC Unit (Without Lid);\n- Epoxy Painted AISI 1045 (C45) Carbon Steel Solid Shaft,\n- Wet Parts SS304 Stainless and Galvanized Coated Steel,\n- ${uniteBasinaDiskSayisi} per Shaft,\n- Disk Surface Area ${uniteBasinaDiskAlani}`,
        rbc_kapak: (rbcModeli) => `PlanetDISK® ${rbcModeli} 1 RBC Unit Lid`,
        rbc_blower: (rbcModeli) => `Blower`,

        lamella_seperator: (lamellaModeli) => `${lamellaModeli} Lamella Separator Final Clarifier Tank`,
        pompa_camur_son_cokturme: (lamellaPomapasiModeli) => `${lamellaPomapasiModeli} Final Clarifier Tank Sludge Pump`,

        pompa_resirkulasyon: (resirkulasyonPompaAdeti) => `Recirculation Pump (${resirkulasyonPompaAdeti} duty + ${resirkulasyonPompaAdeti} standby)`,
        mikser_denitrifikasyon: "Denitrifikasyon Tank Mixer",
        dozaj_fecl3: "FeCl3 Coagulant Dosing System",

        klorlama_on: "Pre-Chlorination System",
        pompa_filtrasyon_besleme: `Filtration System Feeding Pump`,
        pompa_filtrasyon_geriyikama: `Filtrasyon System Backwash Pump)`,
        filtre_separator: `Separator Filter`,
        filtre_kum_oto: `Fully Automatic Multimedia Filtration System`,
        filtre_karbon_oto: `Fully Automatic Activated Carbon Filtration System `,

        pompa_camur_besleme: `Sludge Feed Pump `,
        dekantor: `Decanter `,
        filtrepress: `Filterpress `,
        polimer_unitesi: "Polymer Preparation and Dosing Unit",
        pompa_suzuntu_suyu: `Filtrate Water Pump `,

        membrane_header: `Membrane System`,
        membrane_system: `Planet Membrane System \n(Including all equipments and instruments) `,

        insaat_kanal_izgara: "Screen and Grit-Oil Trap Channel",
        insaat_tank_anoksik: "Anoxic Denitrification Tank",
        insaat_tank_oncokturme_1: "First Primary Sedimentation Tank",
        insaat_tank_oncokturme_2: "Second Primary Sedimentation Tank",
        insaat_tank_dengeleme: "Equalization Tank",
        insaat_tank_aritilmis_su: "Treated Water Tank",
        insaat_tank_filtrelenmis_su: "Filtered Water Tank",
        insaat_tank_camur: "Sludge Tank",
        insaat_isleri: "ALL CIVIL WORKS WILL BE DONE BY CLIENT",

        montaj_borulama_tesisat: "All piping and electrical installation works",
        elektrik_kontrol_panosu: "PlanetDISK® Control Panel",
        konteyner: "40' HC Container",
        nakliye_tir: "Truck",
        muhendislik_genel_paket: "Engineering Services General Package",
        pod_resmi_onay_yonetimi: "Official Approval Processes Management",
        inserted_new_parameter: "Inserted New Parameter"
    }
};