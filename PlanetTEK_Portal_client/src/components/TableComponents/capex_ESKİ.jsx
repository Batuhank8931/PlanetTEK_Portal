import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTeklifStore } from "../../utils/teklifStore";
import CapexTableView from "./CapexTableView";

function CapexTablosu() {
    const formData = useTeklifStore((state) => state.formData);
    const updateSection = useTeklifStore((state) => state.updateSection);

    // Müşteri ve İndirim Bilgileri
    const customerInfo = formData?.customerInfo;
    const teklifDili = customerInfo?.teklifDili || "Yerli"; 
    const planetTekIndirim = parseFloat(customerInfo?.planetTekIndirim) ?? 0;
    const ekipmanIndirim = parseFloat(customerInfo?.ekipmanIndirim) ?? 0;

    // Store Girdileri
    const modulesState = formData?.equipments?.modulesState;
    const onAritmaSecimleri = formData?.equipments?.onAritma;
    const feedPumpSecimleri = formData?.equipments?.feedPump;
    const ileriAritmaSecimleri = formData?.equipments?.ileriAritma;
    const filtrationSystem = formData?.equipments?.filtrationSystem;
    const sludgeDewatering = formData?.equipments?.sludgeDewatering;
    const planetDiskDetails = formData?.planetDiskDetails;

    // Koşullar
    const isIleriAritmaAktif = modulesState?.ileriAritma?.checked;
    const isFiltrasyonAktif = modulesState?.filtrasyon?.checked;
    const isCamurAktif = modulesState?.sludgeDewatering?.checked;

    const izgaraTipi = onAritmaSecimleri?.izgaraTipi;
    const pompaAdeti = parseInt(feedPumpSecimleri?.pompaAdeti) || 0;
    const ToplamFeedpompaAdeti = pompaAdeti * 2;
    const hasDistribution = feedPumpSecimleri?.hasDistributionStructure;

    const rbcModeli = planetDiskDetails?.tasarim?.aritmaParametreleri?.RBCUnite || "MX";
    const yerlesimListesi = planetDiskDetails?.tasarim?.yerlesimSiralanisi || [];

    const toplamRbcAdeti = yerlesimListesi
        .filter(y => y.isLamella === false)
        .reduce((sum, curr) => sum + (parseInt(curr.adet) || 0), 0);

    const milBasinaDisk = yerlesimListesi.find(y => y.isLamella === false)?.milBasinaDisk || 0;

    const lamellaObjesi = yerlesimListesi.find(y => y.isLamella === true);
    const lamellaAdeti = parseInt(lamellaObjesi?.adet) || 0;
    const lamellaModeli = lamellaObjesi?.model || "LS 45";

    const mixerData = ileriAritmaSecimleri?.IleriAritmaTankMixerSelections;
    const dozajData = ileriAritmaSecimleri?.IleriAritmaDozajSelections;
    const ileriAritmaPompaData = ileriAritmaSecimleri?.IleriAritmaPumpSelections;

    const mikserAdeti = mixerData?.secilenMikserMetni ? parseInt(mixerData.secilenMikserMetni) || 1 : 1;
    const dozajPompaAdeti = parseInt(dozajData?.pompaAdedi) || 1;
    const resirkulasyonPompaAdeti = parseInt(ileriAritmaPompaData?.pompaAdeti) || 1;
    const ToplamresirkulasyonPompaAdeti = resirkulasyonPompaAdeti * 2;

    const sistemAdet = parseInt(filtrationSystem?.sistemAdet) || 1;
    const klorlamaData = filtrationSystem?.onKlorlama;
    const filtrePompalar = filtrationSystem?.pompalar;
    const secilenFiltreler = filtrationSystem?.SecilenFiltreler;

    const secilenCamurEkipmanTipi = sludgeDewatering?.ekipmanTipi;
    const camurOpsiyonlari = sludgeDewatering?.opsiyonlar || {};

    // Eklentiler ve Değişiklikler için State Yönetimi
    const [manualRows, setManualRows] = useState([]);
    const [userOverrides, setUserOverrides] = useState({});
    const [history, setHistory] = useState([]);

    // Koşullu Filtreleme Motoru
    const applyDynamicFilters = useCallback((rawItems) => {
        return rawItems.filter(row => {
            if (row.belongsToIzgara && row.belongsToIzgara !== izgaraTipi) return false;
            if (row.isDistributionRow && !hasDistribution) return false;
            if (row.isIleriAritmaRow && !isIleriAritmaAktif) return false;
            if (row.isFiltrasyonRow && !isFiltrasyonAktif) return false;
            if (row.isCamurRow && !isCamurAktif) return false;
            if (row.id === "r18" && secilenCamurEkipmanTipi !== "Dekantör") return false;
            if (row.id === "r19" && secilenCamurEkipmanTipi !== "Filtrepress") return false;

            if (row.isCamurOptional) {
                const optKey = row.optionalKey;
                if (camurOpsiyonlari[optKey] && camurOpsiyonlari[optKey].secili === false) return false;
            }
            return true;
        });
    }, [izgaraTipi, hasDistribution, isIleriAritmaAktif, isFiltrasyonAktif, isCamurAktif, secilenCamurEkipmanTipi, camurOpsiyonlari]);

    // Şablon Girdileri Üretimi ve Birleştirme Motoru
    const processedRows = useMemo(() => {
        const baseRows = [
            { id: "h1", type: 0, label: "MEKANİK EKİPMANLAR" },
            { id: "s1", type: 1, label: "Fiziksel Arıtma Üniteleri (Birincil Arıtma)" },
            { id: "r1", type: 2, label: "Kaba ve İnce Izgara" },
            { id: "r1_1", type: 3, piece: 1, label: "Elle Temizlemeli Kaba Izgara", unitPrice: 866, discount: ekipmanIndirim, belongsToIzgara: "Manuel Izgara" },
            { id: "r1_2", type: 3, piece: 1, label: "Elle Temizlemeli İnce Izgara", unitPrice: 910, discount: ekipmanIndirim, belongsToIzgara: "Manuel Izgara" },
            { id: "r1_3", type: 3, piece: 1, label: "Otomatik Temizlemeli Kaba Izgara", unitPrice: 16070, discount: ekipmanIndirim, belongsToIzgara: "Otomatik Mekanik Izgara" },
            { id: "r1_4", type: 3, piece: 1, label: "Otomatik Temizlemeli İnce Izgara", unitPrice: 16713, discount: ekipmanIndirim, belongsToIzgara: "Otomatik Mekanik Izgara" },
            { id: "r2", type: 3, piece: 4, label: `Kum-Yağ Tutucu Plakaları (${onAritmaSecimleri?.yagTutucuBoyut || 'Standart'})`, unitPrice: 107, discount: ekipmanIndirim },
            { id: "r3", type: 3, piece: ToplamFeedpompaAdeti, label: `Terfi Pompası (${pompaAdeti} asil + ${pompaAdeti} yedek) - ${feedPumpSecimleri?.secilenPompaMetni || ''}`, unitPrice: 486, discount: ekipmanIndirim },
            { id: "r4", type: 3, piece: 1, label: `Debi Dağıtım Yapısı${(feedPumpSecimleri?.distributionGirisAdet > 0 || feedPumpSecimleri?.distributionCikisAdet > 0) ? ` (Giriş: ${feedPumpSecimleri.distributionGirisAdet}, Çıkış: ${feedPumpSecimleri.distributionCikisAdet})` : ''}`, unitPrice: 5135, discount: ekipmanIndirim, isDistributionRow: true },
            { id: "s2", type: 1, label: "Biyolojik Arıtma Üniteleri (İkincil Arıtma)" },
            { id: "r5", type: 3, piece: toplamRbcAdeti, label: `PlanetDISK® ${rbcModeli} 1 DBD Ünitesi (Kapaksız) ;\n- Epoksi Boyalı AISI 1045 (C45) Karbon Çelik Dolu Mil\n- Islak Parçalar SS304 Kalite Paslanmaz ve Galvaniz Kaplı Çelik\n- Mil Başına ${milBasinaDisk} Adet Disk Yüzey Alanı / Ünite`, unitPrice: 28235, discount: planetTekIndirim },
            { id: "r6", type: 3, piece: toplamRbcAdeti, label: `PlanetDISK® ${rbcModeli} 1 DBD Ünitesi Kapağı`, unitPrice: 1390, discount: planetTekIndirim },
            { id: "r7", type: 3, piece: lamellaAdeti, label: `${lamellaModeli} Lamella Seperatör Son Çöktürme Tankı`, unitPrice: 10415, discount: planetTekIndirim },
            { id: "r8", type: 3, piece: 1, label: "Son Çöktürme Tankı Çamur Pompası", unitPrice: 547, discount: ekipmanIndirim },
            { id: "r9", type: 3, piece: ToplamresirkulasyonPompaAdeti, label: `Resürkilasyon Pompası (${resirkulasyonPompaAdeti} asil + ${resirkulasyonPompaAdeti} yedek) - ${(ileriAritmaSecimleri?.IleriAritmaPumpSelections?.geridevirPompasi || '').replace(`${resirkulasyonPompaAdeti} Adet`, `${resirkulasyonPompaAdeti * 2} Adet`)}`, unitPrice: 486, discount: ekipmanIndirim, isIleriAritmaRow: true },
            { id: "r10", type: 3, piece: mikserAdeti, label: `Denitrifikasyon Tankı Mikseri ;\n- ${mixerData?.secilenTankMetni || ''}\n- ${mixerData?.secilenMikserMetni || ''}`, unitPrice: 1250, discount: ekipmanIndirim, isIleriAritmaRow: true },
            { id: "r11", type: 3, piece: dozajPompaAdeti, label: `FeCl3 Koagülant Dozaj Sistemi ;\n- ${dozajData?.dozajPompasi || ''}\n- ${dozajData?.kimyasalTanki || ''}`, unitPrice: 530, discount: ekipmanIndirim, isIleriAritmaRow: true },
            { id: "s3", type: 1, label: "Filtrasyon ve Dezenfeksiyon Üniteleri (İleri Arıtma)" },
            { id: "r12", type: 3, piece: sistemAdet, label: `Ön Klorlama Sistemi (Dozaj: ${klorlamaData?.debiLH || '-'} L/h @ ${klorlamaData?.basincBar || '-'} Bar, Tank: ${klorlamaData?.tankLitre || '-'} Litre)`, unitPrice: 530, discount: ekipmanIndirim, isOptionalStyle: true, isFiltrasyonRow: true },
            { id: "r13", type: 3, piece: sistemAdet, label: `Filtrasyon Sistemi Besleme Pompası (Kapasite: ${filtrePompalar?.besleme?.debiM3h || '-'} m³/h, Güç: ${filtrePompalar?.besleme?.kw || '-'} kW)`, unitPrice: 865, discount: ekipmanIndirim, isOptionalStyle: true, isFiltrasyonRow: true },
            { id: "r14", type: 3, piece: sistemAdet, label: `Filtrasyon Sistemi Geri Yıkama Pompası (Kapasite: ${filtrePompalar?.geriYikama?.debiM3h || '-'} m³/h, Güç: ${filtrePompalar?.geriYikama?.kw || '-'} kW)`, unitPrice: 909, discount: ekipmanIndirim, isOptionalStyle: true, isFiltrasyonRow: true },
            { id: "r15", type: 3, piece: sistemAdet, label: `Tam Otomatik ${secilenFiltreler?.kumFiltre?.isim || 'KUM FİLTRE SİSTEMİ'} (Kapasite: ${secilenFiltreler?.kumFiltre?.debiM3h || '-'} m³/h)`, unitPrice: 5750, discount: ekipmanIndirim, isOptionalStyle: true, isFiltrasyonRow: true },
            { id: "r16", type: 3, piece: sistemAdet, label: `Tam Otomatik ${secilenFiltreler?.aktifKarbonFiltre?.isim || 'AKTİF KARBON FİLTRE SİSTEMİ'} (Kapasite: ${secilenFiltreler?.aktifKarbonFiltre?.debiM3h || '-'} m³/h)`, unitPrice: 6325, discount: ekipmanIndirim, isOptionalStyle: true, isFiltrasyonRow: true },
            { id: "s4", type: 1, label: "Çamur Susuzlaştırma Ünitesi", isCamurRow: true },
            { id: "r17", type: 3, piece: 1, label: `Çamur Besleme Pompası (Kapasite/Güç: ${sludgeDewatering?.beslemePompasi?.kapasite_degeri || '1.00'} ${sludgeDewatering?.beslemePompasi?.kapasite_birimi || 'm3/saat'})`, unitPrice: 1420, discount: ekipmanIndirim, isCamurRow: true },
            { id: "r18", type: 3, piece: 1, label: `Dekantör (Kapasite/Güç: ${sludgeDewatering?.anaEkipman?.kapasite_degeri || '1.00'} ${sludgeDewatering?.anaEkipman?.kapasite_birimi || 'm3/gun'})`, unitPrice: 40125, discount: ekipmanIndirim, isCamurRow: true },
            { id: "r19", type: 3, piece: 1, label: `Filtrepress (Kapasite/Güç: ${sludgeDewatering?.anaEkipman?.kapasite_degeri || '1.00'} ${sludgeDewatering?.anaEkipman?.kapasite_birimi || 'm3/gun'})`, unitPrice: 16125, discount: ekipmanIndirim, isCamurRow: true },
            { id: "r20", type: 3, piece: camurOpsiyonlari["polimer_unitesi"]?.adet ? parseInt(camurOpsiyonlari["polimer_unitesi"].adet) : 1, label: `Polimer Hazırlama ve Dozaj Ünitesi`, unitPrice: 7550, discount: ekipmanIndirim, isCamurRow: true },
            { id: "r21", type: 3, piece: 1, label: `Süzüntü Suyu Pompası (Kapasite/Güç: ${sludgeDewatering?.suzuntuPompasi?.kapasite_degeri || '1.00'} ${sludgeDewatering?.suzuntuPompasi?.kapasite_birimi || 'm3/saat'})`, unitPrice: 650, discount: ekipmanIndirim, isCamurRow: true },
            { id: "r22", type: 3, piece: camurOpsiyonlari["konveyor"]?.adet ? parseInt(camurOpsiyonlari["konveyor"].adet) : 1, label: "Konveyör", unitPrice: 6876, discount: ekipmanIndirim, isCamurRow: true, isCamurOptional: true, optionalKey: "konveyor" },
            { id: "r23", type: 3, piece: camurOpsiyonlari["Burgu Konveyor"]?.adet ? parseInt(camurOpsiyonlari["Burgu Konveyor"].adet) : 1, label: "Burgu Konveyör", unitPrice: 7200, discount: ekipmanIndirim, isCamurRow: true, isCamurOptional: true, optionalKey: "Burgu Konveyor" },
            { id: "h2", type: 0, label: "İNŞAAT İŞLERİ" },
            { id: "c1", type: 3, label: "Izgara ve Kum-Yağ Tutucu Kanalı", isUrgent: true, discount: 0 },
            { id: "c2", type: 3, label: "Anoksik Denitrifikasyon Tankı", isUrgent: true, isIleriAritmaRow: true, discount: 0 },
            { id: "c3", type: 3, label: "Birinci Ön Çöktürme Tankı", isUrgent: true, discount: 0 },
            { id: "c4", type: 3, label: "İkinci Ön Çöktürme Tankı", isUrgent: true, discount: 0 },
            { id: "c5", type: 3, label: "Dengeleme Tankı", isUrgent: true, discount: 0 },
            { id: "c6", type: 3, label: "Arıtılmış Su Tankı", isUrgent: true, isFiltrasyonRow: true, discount: 0 },
            { id: "c7", type: 3, label: "Filtrelenmiş Su Tankı", isUrgent: true, isFiltrasyonRow: true, discount: 0 },
            { id: "c8", type: 3, label: "Çamur Tankı", isUrgent: true, isCamurRow: true, discount: 0 },
            { id: "h3", type: 0, label: "MONTAJ EKİPMANLARI" },
            { id: "m1", type: 3, piece: 1, label: "Bütün borulama ve elektrik tesisatı", unitPrice: 19637, discount: ekipmanIndirim },
            { id: "h4", type: 0, label: "ELEKTRİK İŞLERİ" },
            { id: "e1", type: 3, piece: 1, label: "PlanetDISK® Kontrol Panosu", unitPrice: 13027, discount: ekipmanIndirim },
            { id: "h5", type: 0, label: "NAKLİYE" },
            { id: "n1", type: 3, piece: 1, label: "Tır", unitPrice: 0, discount: 0, isShippingStyle: true },
            { id: "h6", type: 0, label: "PROJE, MONTAJ, DEVREYE ALMA, EĞİTİM ve MÜHENDİSLİK" },
            { id: "p1", type: 3, piece: 1, label: "Mühendislik Hizmetleri Genel Paketi", unitPrice: 0, discount: ekipmanIndirim },
            { id: "h7", type: 0, label: "POD HAZIRLANMASI ve ONAYININ ALINMASI-Harçlar Hariç" },
            { id: "po1", type: 3, piece: 1, label: "Resmi Onay Süreçleri Yönetimi", unitPrice: 2300, discount: 0 }
        ];

        const filtered = applyDynamicFilters(baseRows);
        let combined = [...filtered, ...manualRows];

        return combined.map(row => {
            const override = userOverrides[row.id] || {};
            return {
                ...row,
                label: override.label !== undefined ? override.label : row.label,
                piece: override.piece !== undefined ? override.piece : row.piece,
                unitPrice: override.unitPrice !== undefined ? override.unitPrice : row.unitPrice,
                discount: override.discount !== undefined ? override.discount : row.discount
            };
        });
    }, [applyDynamicFilters, manualRows, userOverrides, planetTekIndirim, ekipmanIndirim, ToplamFeedpompaAdeti, pompaAdeti, feedPumpSecimleri, toplamRbcAdeti, rbcModeli, milBasinaDisk, lamellaAdeti, lamellaModeli, ToplamresirkulasyonPompaAdeti, resirkulasyonPompaAdeti, ileriAritmaSecimleri, mikserAdeti, mixerData, dozajPompaAdeti, dozajData, sistemAdet, klorlamaData, filtrePompalar, secilenFiltreler, secilenCamurEkipmanTipi, camurOpsiyonlari, isIleriAritmaAktif, isFiltrasyonAktif, isCamurAktif, onAritmaSecimleri]);

    // Zustand Store Güncellemesi
    useEffect(() => {
        updateSection("tables", {
            ...formData?.tables,
            capextablosu: processedRows
        });
    }, [processedRows]);

    // Otomatik Numaralandırma Motoru
    const numberedRows = useMemo(() => {
        let counts = [0, 0, 0, 0];
        return processedRows.map((row) => {
            const t = row.type;
            counts[t]++;
            for (let i = t + 1; i < counts.length; i++) counts[i] = 0;

            let computedNo = "";
            for (let i = 0; i <= t; i++) {
                if (counts[i] > 0 || i === t) computedNo += `${counts[i]}.`;
            }
            return { ...row, computedNo };
        });
    }, [processedRows]);

    // Geri Al (Undo) Mekanizması
    const handleUndo = () => {
        if (history.length === 0) return;
        const previousState = JSON.parse(history[history.length - 1]);
        setManualRows(previousState.manualRows);
        setUserOverrides(previousState.userOverrides);
        setHistory(prev => prev.slice(0, -1));
    };

    const handleCellChange = (id, field, val) => {
        // En güncel durumu callback ile geçmiş havuzuna itiyoruz
        setHistory(prev => [...prev, JSON.stringify({ manualRows, userOverrides })]);
        setUserOverrides(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: val
            }
        }));
    };

    const insertAfterRow = (index, selectedType) => {
        setHistory(prev => [...prev, JSON.stringify({ manualRows, userOverrides })]);
        const newId = `new_${Date.now()}`;
        let newRow = { id: newId, type: selectedType };

        if (selectedType === 0) newRow.label = "YENİ ANA BAŞLIK (TYPE 0)";
        else if (selectedType === 1) newRow.label = "Yeni Alt Başlık (Type 1)";
        else if (selectedType === 2) newRow.label = "Yeni Kırılım Seviyesi (Type 2)";
        else {
            newRow.label = "Araya Eklenen Yeni Kalem (Type 3)";
            newRow.piece = 1;
            newRow.unitPrice = 0;
            newRow.discount = ekipmanIndirim;
        }

        setManualRows(prev => [...prev, newRow]);
    };

    const deleteRow = (id) => {
        // Silme işleminden hemen önce anlık durumu geçmişe taahhüt ediyoruz
        setHistory(prev => [...prev, JSON.stringify({ manualRows, userOverrides })]);
        
        if (id.toString().startsWith("new_")) {
            setManualRows(prev => prev.filter(row => row.id !== id));
        } else {
            setUserOverrides(prev => ({
                ...prev,
                [id]: { ...prev[id], _deleted: true }
            }));
        }
    };

    // Silinmiş (_deleted: true) işaretli satırları süzme alanı
    const finalVisibleRows = useMemo(() => {
        return numberedRows.filter(row => !userOverrides[row.id]?._deleted);
    }, [numberedRows, userOverrides]);

    return (
        <CapexTableView 
            numberedRows={finalVisibleRows}
            historyLength={history.length}
            handleUndo={handleUndo}
            handleCellChange={handleCellChange}
            insertAfterRow={insertAfterRow}
            deleteRow={deleteRow}
            teklifDili={teklifDili}
        />
    );
}

export default CapexTablosu;