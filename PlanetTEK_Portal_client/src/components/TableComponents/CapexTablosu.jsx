import React, { useState, useEffect, useCallback } from "react";
import { useTeklifStore } from "../../utils/teklifStore";

function CapexTablosu() {
    const formData = useTeklifStore((state) => state.formData);
    const updateSection = useTeklifStore((state) => state.updateSection);

    // Store'dan gerekli modül ve proses seçimlerini çekiyoruz
    const modulesState = formData?.equipments?.modulesState;
    const onAritmaSecimleri = formData?.equipments?.onAritma;
    const feedPumpSecimleri = formData?.equipments?.feedPump;
    const ileriAritmaSecimleri = formData?.equipments?.ileriAritma;
    const filtrationSystem = formData?.equipments?.filtrationSystem;
    const sludgeDewatering = formData?.equipments?.sludgeDewatering;
    const planetDiskDetails = formData?.planetDiskDetails;

    // 1. MODÜL VE PROSES ŞARTLARI
    const isIleriAritmaAktif = modulesState?.ileriAritma?.checked;
    const isFiltrasyonAktif = modulesState?.filtrasyon?.checked;
    const isCamurAktif = modulesState?.sludgeDewatering?.checked;

    const izgaraTipi = onAritmaSecimleri?.izgaraTipi;
    const pompaAdeti = parseInt(feedPumpSecimleri?.pompaAdeti) || 0;
    const ToplamFeedpompaAdeti = pompaAdeti * 2;
    const hasDistribution = feedPumpSecimleri?.hasDistributionStructure;

    // 2. BİYOLOJİK ARITMA (RBC & LAMELLA) PARAMETRELERİ
    const rbcModeli = planetDiskDetails?.tasarim?.aritmaParametreleri?.RBCUnite || "MX";
    const yerlesimListesi = planetDiskDetails?.tasarim?.yerlesimSiralanisi || [];

    const toplamRbcAdeti = yerlesimListesi
        .filter(y => y.isLamella === false)
        .reduce((sum, curr) => sum + (parseInt(curr.adet) || 0), 0);

    const milBasinaDisk = yerlesimListesi.find(y => y.isLamella === false)?.milBasinaDisk || 0;

    const lamellaObjesi = yerlesimListesi.find(y => y.isLamella === true);
    const lamellaAdeti = parseInt(lamellaObjesi?.adet) || 0;
    const lamellaModeli = lamellaObjesi?.model || "LS 45";

    // 3. İLERİ ARITMA DİNAMİK VERİLERİ
    const mixerData = ileriAritmaSecimleri?.IleriAritmaTankMixerSelections;
    const dozajData = ileriAritmaSecimleri?.IleriAritmaDozajSelections;
    const ileriAritmaPompaData = ileriAritmaSecimleri?.IleriAritmaPumpSelections;

    const mikserAdeti = mixerData?.secilenMikserMetni ? parseInt(mixerData.secilenMikserMetni) || 1 : 1;
    const dozajPompaAdeti = parseInt(dozajData?.pompaAdedi) || 1;
    const resirkulasyonPompaAdeti = parseInt(ileriAritmaPompaData?.pompaAdeti) || 1;
    const ToplamresirkulasyonPompaAdeti = resirkulasyonPompaAdeti * 2;

    // 4. FİLTRASYON DİNAMİK VERİLERİ
    const sistemAdet = parseInt(filtrationSystem?.sistemAdet) || 1;
    const klorlamaData = filtrationSystem?.onKlorlama;
    const filtrePompalar = filtrationSystem?.pompalar;
    const secilenFiltreler = filtrationSystem?.SecilenFiltreler;

    // 5. ÇAMUR SUSUZLAŞTIRMA DİNAMİK VERİLERİ
    const secilenCamurEkipmanTipi = sludgeDewatering?.ekipmanTipi;

    // useCallback ile sarmalanmış Koşullu Filtreleme Motoru
    const applyDynamicFilters = useCallback((rawItems) => {
        return rawItems.filter(row => {
            if (row.belongsToIzgara && row.belongsToIzgara !== izgaraTipi) return false;
            if (row.isDistributionRow && !hasDistribution) return false;
            if (row.isIleriAritmaRow && !isIleriAritmaAktif) return false;
            if (row.isFiltrasyonRow && !isFiltrasyonAktif) return false;

            if (row.isCamurRow && !isCamurAktif) return false;
            if (row.id === "r18" && secilenCamurEkipmanTipi !== "Dekantör") return false;
            if (row.id === "r19" && secilenCamurEkipmanTipi !== "Filtrepress") return false;

            return true;
        });
    }, [izgaraTipi, hasDistribution, isIleriAritmaAktif, isFiltrasyonAktif, isCamurAktif, secilenCamurEkipmanTipi]);

    // Statik ham şablon verisi
    const getInitialRawRows = () => [
        { id: "h1", type: 0, label: "MEKANİK EKİPMANLAR" },
        { id: "s1", type: 1, label: "Fiziksel Arıtma Üniteleri (Birincil Arıtma)" },
        { id: "r1", type: 2, label: "Kaba ve İnce Izgara" },

        { id: "r1_1", type: 3, piece: 1, label: "Elle Temizlemeli Kaba Izgara", unitPrice: 866, discount: 8, belongsToIzgara: "Manuel Izgara" },
        { id: "r1_2", type: 3, piece: 1, label: "Elle Temizlemeli İnce Izgara", unitPrice: 910, discount: 8, belongsToIzgara: "Manuel Izgara" },
        { id: "r1_3", type: 3, piece: 1, label: "Otomatik Temizlemeli Kaba Izgara", unitPrice: 16070, discount: 8, belongsToIzgara: "Otomatik Mekanik Izgara" },
        { id: "r1_4", type: 3, piece: 1, label: "Otomatik Temizlemeli İnce Izgara", unitPrice: 16713, discount: 8, belongsToIzgara: "Otomatik Mekanik Izgara" },

        { id: "r2", type: 3, piece: 4, label: "Kum-Yağ Tutucu Plakaları", unitPrice: 107, discount: 8 },
        { id: "r3", type: 3, piece: ToplamFeedpompaAdeti, label: "Terfi Pompası", unitPrice: 486, discount: 8 },
        { id: "r4", type: 3, piece: 1, label: "Debi Dağıtım Yapısı", unitPrice: 5135, discount: 8, isDistributionRow: true },

        { id: "s2", type: 1, label: "Biyolojik Arıtma Üniteleri (İkincil Arıtma)" },

        { id: "r5", type: 3, piece: toplamRbcAdeti, label: "PlanetDISK® RBC Ünitesi", unitPrice: 28235, discount: 8 },
        { id: "r6", type: 3, piece: toplamRbcAdeti, label: "PlanetDISK® RBC Ünitesi Kapağı", unitPrice: 1390, discount: 8 },
        { id: "r7", type: 3, piece: lamellaAdeti, label: "Lamella Seperatör Son Çöktürme Tankı", unitPrice: 10415, discount: 8 },
        { id: "r8", type: 3, piece: 1, label: "Son Çöktürme Tankı Çamur Pompası", unitPrice: 547, discount: 8 },

        { id: "r9", type: 3, piece: ToplamresirkulasyonPompaAdeti, label: "Resürkilasyon Pompası", unitPrice: 486, discount: 8, isIleriAritmaRow: true },
        { id: "r10", type: 3, piece: mikserAdeti, label: "Denitrifikasyon Tankı Mikseri", unitPrice: 1250, discount: 8, isIleriAritmaRow: true },
        { id: "r11", type: 3, piece: dozajPompaAdeti, label: "FeCl3 Koagülant Dozaj Sistemi", unitPrice: 530, discount: 8, isIleriAritmaRow: true },

        { id: "s3", type: 1, label: "Filtrasyon ve Dezenfeksiyon Üniteleri (İleri Arıtma)" },
        { id: "r12", type: 3, piece: sistemAdet, label: "Ön Klorlama Sistemi", unitPrice: 530, discount: 8, isOptionalStyle: true, isFiltrasyonRow: true },
        { id: "r13", type: 3, piece: sistemAdet, label: "Filtrasyon Sistemi Besleme Pompası", unitPrice: 865, discount: 8, isOptionalStyle: true, isFiltrasyonRow: true },
        { id: "r14", type: 3, piece: sistemAdet, label: "Filtrasyon Sistemi Geri Yıkama Pompası", unitPrice: 909, discount: 8, isOptionalStyle: true, isFiltrasyonRow: true },
        { id: "r15", type: 3, piece: sistemAdet, label: "Tam Otomatik Kum Filtre Sistemi", unitPrice: 5750, discount: 8, isOptionalStyle: true, isFiltrasyonRow: true },
        { id: "r16", type: 3, piece: sistemAdet, label: "Tam Otomatik Aktif Karbon Filtre Sistemi", unitPrice: 6325, discount: 8, isOptionalStyle: true, isFiltrasyonRow: true },

        { id: "s4", type: 1, label: "Çamur Susuzlaştırma Ünitesi", isCamurRow: true },

        { id: "r17", type: 3, piece: 1, label: "Besleme Pompası", unitPrice: 1420, discount: 8, isCamurRow: true },
        { id: "r18", type: 3, piece: 1, label: "Dekantör", unitPrice: 40125, discount: 8, isCamurRow: true },
        { id: "r19", type: 3, piece: 1, label: "Filtrepress", unitPrice: 16125, discount: 8, isCamurRow: true },
        { id: "r20", type: 3, piece: 1, label: "Polimer Dozaj Ünitesi", unitPrice: 7550, discount: 8, isCamurRow: true },
        { id: "r21", type: 3, piece: 1, label: "Süzüntü Suyu Pompası", unitPrice: 650, discount: 8, isCamurRow: true },
        { id: "r22", type: 3, piece: 1, label: "Konveyör", unitPrice: 6876, discount: 8, isCamurRow: true },

        { id: "h2", type: 0, label: "İNŞAAT İŞLERİ" },
        { id: "c1", type: 3, label: "Izgara ve Kum-Yağ Tutucu Kanalı", isUrgent: true },
        { id: "c2", type: 3, label: "Anoksik Denitrifikasyon Tankı", isUrgent: true, isIleriAritmaRow: true },
        { id: "c3", type: 3, label: "Birinci Ön Çöktürme Tankı", isUrgent: true },
        { id: "c4", type: 3, label: "İkinci Ön Çöktürme Tankı", isUrgent: true },
        { id: "c5", type: 3, label: "Dengeleme Tankı", isUrgent: true },
        { id: "c6", type: 3, label: "Arıtılmış Su Tankı", isUrgent: true, isFiltrasyonRow: true },
        { id: "c7", type: 3, label: "Filtrelenmiş Su Tankı", isUrgent: true, isFiltrasyonRow: true },
        { id: "c8", type: 3, label: "Çamur Tankı", isUrgent: true, isCamurRow: true },

        { id: "h3", type: 0, label: "MONTAJ EKİPMANLARI" },
        { id: "m1", type: 3, piece: 1, label: "Bütün borulama ve elektrik tesisatı", unitPrice: 19637, discount: 8 },

        { id: "h4", type: 0, label: "ELEKTRİK İŞLERİ" },
        { id: "e1", type: 3, piece: 1, label: "PlanetDISK® Kontrol Panosu", unitPrice: 13027, discount: 8 },

        { id: "h5", type: 0, label: "NAKLİYE" },
        { id: "n1", type: 3, piece: 1, label: "Tır", unitPrice: 0, discount: 0, isShippingStyle: true },

        { id: "h6", type: 0, label: "PROJE, MONTAJ, DEVREYE ALMA, EĞİTİM ve MÜHENDİSLİK" },
        { id: "p1", type: 3, piece: 1, label: "Mühendislik Hizmetleri Genel Paketi", unitPrice: 0, discount: 8 },

        { id: "h7", type: 0, label: "POD HAZIRLANMASI ve ONAYININ ALINMASI-Harçlar Hariç" },
        { id: "po1", type: 3, piece: 1, label: "Resmi Onay Süreçleri Yönetimi", unitPrice: 2300, discount: 0 }
    ];

    // 1. ADIM: Initial State Kurulumu
    const [rows, setRows] = useState(() => {
        const savedData = formData?.tables?.capextablosu;
        if (savedData && Array.isArray(savedData) && savedData.length > 0) {
            return applyDynamicFilters(savedData);
        }
        return applyDynamicFilters(getInitialRawRows());
    });

    const [history, setHistory] = useState([]);

    // 2. ADIM: Reaktif Senkronizasyon ve Veri İşleme Bloğu
    useEffect(() => {
        setRows(prevRows => {
            const filteredTemplate = applyDynamicFilters(getInitialRawRows());

            return filteredTemplate.map(row => {
                if (row.id === "r2") {
                    row.label = `Kum-Yağ Tutucu Plakaları (${onAritmaSecimleri?.yagTutucuBoyut || 'Standart'})`;
                }
                if (row.id === "r3") {
                    row.piece = ToplamFeedpompaAdeti;
                    row.label = `Terfi Pompası (${pompaAdeti} asil + ${pompaAdeti} yedek) - ${feedPumpSecimleri?.secilenPompaMetni || ''}`;
                }
                if (row.id === "r4") {
                    const gAdet = feedPumpSecimleri?.distributionGirisAdet || 0;
                    const cAdet = feedPumpSecimleri?.distributionCikisAdet || 0;
                    if (gAdet > 0 || cAdet > 0) row.label = `Debi Dağıtım Yapısı (Giriş: ${gAdet}, Çıkış: ${cAdet})`;
                }
                if (row.id === "r5") {
                    row.piece = toplamRbcAdeti;
                    row.label = `PlanetDISK® ${rbcModeli} 1 DBD Ünitesi (Kapaksız) ;\n- Epoksi Boyalı AISI 1045 (C45) Karbon Çelik Dolu Mil\n- Islak Parçalar SS304 Kalite Paslanmaz ve Galvaniz Kaplı Çelik\n- Mil Başına ${milBasinaDisk} Adet Disk Yüzey Alanı / Ünite`;
                }
                if (row.id === "r6") {
                    row.piece = toplamRbcAdeti;
                    row.label = `PlanetDISK® ${rbcModeli} 1 DBD Ünitesi Kapağı`;
                }
                if (row.id === "r7") {
                    row.piece = lamellaAdeti;
                    row.label = `${lamellaModeli} Lamella Seperatör Son Çöktürme Tankı`;
                }

                // --- İLERİ ARITMA SENKRONİZASYONLARI ---
                if (row.id === "r9" && isIleriAritmaAktif) {
                    const rawPumpText = ileriAritmaSecimleri?.IleriAritmaPumpSelections?.geridevirPompasi || '';
                    const formattedPumpText = rawPumpText.replace(`${resirkulasyonPompaAdeti} Adet`, `${resirkulasyonPompaAdeti * 2} Adet`);
                    row.piece = ToplamresirkulasyonPompaAdeti;
                    row.label = `Resürkilasyon Pompası (${resirkulasyonPompaAdeti} asil + ${resirkulasyonPompaAdeti} yedek) - ${formattedPumpText}`;
                }
                if (row.id === "r10" && isIleriAritmaAktif) {
                    row.piece = mikserAdeti;
                    row.label = `Denitrifikasyon Tankı Mikseri ;\n- ${mixerData?.secilenTankMetni || ''}\n- ${mixerData?.secilenMikserMetni || ''}`;
                }
                if (row.id === "r11" && isIleriAritmaAktif) {
                    row.piece = dozajPompaAdeti;
                    row.label = `FeCl3 Koagülant Dozaj Sistemi ;\n- ${dozajData?.dozajPompasi || ''}\n- ${dozajData?.kimyasalTanki || ''}`;
                }

                // --- FİLTRASYON SENKRONİZASYONLARI ---
                if (row.id === "r12" && isFiltrasyonAktif) {
                    row.piece = sistemAdet;
                    row.label = `Ön Klorlama Sistemi (Dozaj: ${klorlamaData?.debiLH || '-'} L/h @ ${klorlamaData?.basincBar || '-'} Bar, Tank: ${klorlamaData?.tankLitre || '-'} Litre)`;
                }
                if (row.id === "r13" && isFiltrasyonAktif) {
                    row.piece = sistemAdet;
                    row.label = `Filtrasyon Sistemi Besleme Pompası (Kapasite: ${filtrePompalar?.besleme?.debiM3h || '-'} m³/h, Güç: ${filtrePompalar?.besleme?.kw || '-'} kW)`;
                }
                if (row.id === "r14" && isFiltrasyonAktif) {
                    row.piece = sistemAdet;
                    row.label = `Filtrasyon Sistemi Geri Yıkama Pompası (Kapasite: ${filtrePompalar?.geriYikama?.debiM3h || '-'} m³/h, Güç: ${filtrePompalar?.geriYikama?.kw || '-'} kW)`;
                }
                if (row.id === "r15" && isFiltrasyonAktif) {
                    row.piece = sistemAdet;
                    row.label = `Tam Otomatik ${secilenFiltreler?.kumFiltre?.isim || 'KUM FİLTRE SİSTEMİ'} (Kapasite: ${secilenFiltreler?.kumFiltre?.debiM3h || '-'} m³/h)`;
                }
                if (row.id === "r16" && isFiltrasyonAktif) {
                    row.piece = sistemAdet;
                    row.label = `Tam Otomatik ${secilenFiltreler?.aktifKarbonFiltre?.isim || 'AKTİF KARBON FİLTRE SİSTEMİ'} (Kapasite: ${secilenFiltreler?.aktifKarbonFiltre?.debiM3h || '-'} m³/h)`;
                }

                // --- ÇAMUR SUSUZLAŞTIRMA SENKRONİZASYONLARI ---
                if (row.id === "r17" && isCamurAktif) {
                    row.label = `Çamur Besleme Pompası (Kapasite/Güç: ${sludgeDewatering?.camurPompasi || '-'})`;
                }
                if (row.id === "r18" && isCamurAktif && secilenCamurEkipmanTipi === "Dekantör") {
                    row.label = `${sludgeDewatering?.ekipmanMetni || 'Dekantör'}`;
                }
                if (row.id === "r19" && isCamurAktif && secilenCamurEkipmanTipi === "Filtrepress") {
                    row.label = `${sludgeDewatering?.ekipmanMetni || 'Filtrepress'}`;
                }
                if (row.id === "r20" && isCamurAktif) {
                    row.label = `Polimer Hazırlama ve Dozaj Ünitesi (Kapasite/Güç: ${sludgeDewatering?.poliDozlama || '-'})`;
                }
                if (row.id === "r21" && isCamurAktif) {
                    row.label = `Süzüntü Suyu Pompası (Kapasite/Güç: ${sludgeDewatering?.suzuntuPompasi || '-'})`;
                }

                const existing = prevRows.find(p => p.id === row.id);
                if (existing) {
                    return {
                        ...row,
                        piece: ["r3", "r5", "r6", "r7", "r9", "r10", "r11", "r12", "r13", "r14", "r15", "r16"].includes(row.id) ? row.piece : existing.piece,
                        unitPrice: existing.unitPrice,
                        discount: existing.discount
                    };
                }
                return row;
            });
        });
    }, [izgaraTipi, onAritmaSecimleri?.yagTutucuBoyut, pompaAdeti, hasDistribution, feedPumpSecimleri?.distributionGirisAdet, feedPumpSecimleri?.distributionCikisAdet, rbcModeli, toplamRbcAdeti, milBasinaDisk, lamellaAdeti, lamellaModeli, lamellaObjesi?.hacim, lamellaObjesi?.alan, isIleriAritmaAktif, resirkulasyonPompaAdeti, mikserAdeti, dozajPompaAdeti, ileriAritmaPompaData?.geridevirPompasi, mixerData?.secilenTankMetni, mixerData?.secilenMikserMetni, dozajData?.dozajPompasi, dozajData?.kimyasalTanki, isFiltrasyonAktif, sistemAdet, klorlamaData?.debiLH, klorlamaData?.basincBar, klorlamaData?.tankLitre, filtrePompalar?.besleme?.debiM3h, filtrePompalar?.besleme?.kw, filtrePompalar?.geriYikama?.debiM3h, filtrePompalar?.geriYikama?.kw, secilenFiltreler?.kumFiltre?.isim, secilenFiltreler?.kumFiltre?.debiM3h, secilenFiltreler?.aktifKarbonFiltre?.isim, secilenFiltreler?.aktifKarbonFiltre?.debiM3h, isCamurAktif, secilenCamurEkipmanTipi, sludgeDewatering?.camurPompasi, sludgeDewatering?.ekipmanMetni, sludgeDewatering?.poliDozlama, sludgeDewatering?.suzuntuPompasi, applyDynamicFilters]);

    // 3. ADIM: Zustand Store Güncellemesi (Sadece render olan elemanları gönderir)
    useEffect(() => {
        const visibleRows = applyDynamicFilters(rows); // Store kaydından hemen önce süzgeçten geçiriyoruz
        updateSection("tables", {
            ...formData?.tables,
            capextablosu: visibleRows
        });
    }, [rows, applyDynamicFilters]);

    // OTOMATİK NUMARALANDIRMA MOTORU
    const generateNumbers = (items) => {
        let counts = [0, 0, 0, 0];
        return items.map((row) => {
            const t = row.type;
            counts[t]++;
            for (let i = t + 1; i < counts.length; i++) counts[i] = 0;

            let computedNo = "";
            for (let i = 0; i <= t; i++) {
                if (counts[i] > 0 || i === t) computedNo += `${counts[i]}.`;
            }
            return { ...row, computedNo };
        });
    };

    const numberedRows = generateNumbers(rows);

    const saveToHistory = (currentRows) => {
        setHistory([...history, JSON.stringify(currentRows)]);
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const previousState = JSON.parse(history[history.length - 1]);
        setRows(previousState);
        setHistory(history.slice(0, -1));
    };

    const handleCellChange = (id, field, val) => {
        saveToHistory(rows);
        setRows(rows.map(row => row.id === id ? { ...row, [field]: val } : row));
    };

    const insertAfterRow = (index, selectedType) => {
        saveToHistory(rows);
        const newId = `new_${Date.now()}`;
        let newRow = { id: newId, type: selectedType };

        if (selectedType === 0) newRow.label = "YENİ ANA BAŞLIK (TYPE 0)";
        else if (selectedType === 1) newRow.label = "Yeni Alt Başlık (Type 1)";
        else if (selectedType === 2) newRow.label = "Yeni Kırılım Seviyesi (Type 2)";
        else {
            newRow.label = "Araya Eklenen Yeni Kalem (Type 3)";
            newRow.piece = 1;
            newRow.unitPrice = 0;
            newRow.discount = 0;
        }

        const updatedRows = [...rows];
        updatedRows.splice(index + 1, 0, newRow);
        setRows(updatedRows);
    };

    const deleteRow = (id) => {
        saveToHistory(rows);
        setRows(rows.filter(row => row.id !== id));
    };

    const getRowBg = (row) => {
        if (row.type === 0) return "#0b1329";
        if (row.type === 1) return "#1e2d42";
        if (row.type === 2) return "#2a3a52";
        if (row.isUrgent) return "#1e2d42";
        if (row.piece === 0) return "#2d1f2d";
        return "#151f32";
    };

    return (
        <div className="d-flex flex-column gap-3 w-100">
            <style>{`
                .capex-row { border-bottom: 1px solid #334155; }
                .capex-row:last-child { border-bottom: none; }
                .capex-input:focus { outline: none; background-color: rgba(255, 255, 255, 0.05) !important; }
                .header-title-cell { font-size: 11px; font-weight: 800; color: #94a3b8; background-color: #090d16; text-transform: uppercase; letter-spacing: 0.6px; }
                .action-dropdown:hover .dropdown-menu-custom { display: block !important; }
                .dropdown-menu-custom { 
                    display: none; 
                    position: absolute; 
                    background-color: #1e293b; 
                    border: 1px solid #475569; 
                    border-radius: 6px; 
                    z-index: 100; 
                    right: 100%; 
                    top: 50%;
                    transform: translateY(-50%);
                    margin-right: 4px;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); 
                }
                .dropdown-item-custom { padding: 6px 12px; font-size: 11px; color: #cbd5e1; cursor: pointer; white-space: nowrap; text-align: left; }
                .dropdown-item-custom:hover { background-color: #334155; color: #fff; }
            `}</style>

            <div className="d-flex justify-content-end align-items-center mb-1">
                <button
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    className="btn btn-sm px-3 fw-semibold text-white d-flex align-items-center gap-1"
                    style={{
                        backgroundColor: history.length === 0 ? "#334155" : "#1e3a8a",
                        fontSize: "11px",
                        borderRadius: "6px",
                        transition: "0.2s",
                        opacity: history.length === 0 ? 0.4 : 1,
                        cursor: history.length === 0 ? "not-allowed" : "pointer"
                    }}
                >
                    <span style={{ fontSize: "12px" }}>↶</span> Son Değişikliği Geri Al ({history.length})
                </button>
            </div>

            <div className="d-flex flex-column rounded-3" style={{ border: "1px solid #334155", height: "auto", overflowX: "hidden" }}>
                <div className="d-flex align-items-stretch border-bottom" style={{ borderColor: "#334155" }}>
                    <div className="p-2 px-2 header-title-cell text-center" style={{ width: "7%" }}>No</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-3 header-title-cell" style={{ width: "36%" }}>Tanım</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-2 header-title-cell text-center" style={{ width: "7%" }}>Adet</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-2 header-title-cell text-end" style={{ width: "11%" }}>Birim Fiyat</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-2 header-title-cell text-end" style={{ width: "11%" }}>Toplam Fiyat</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-2 header-title-cell text-center" style={{ width: "10%" }}>İndirim Oranı</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 px-2 header-title-cell text-end" style={{ width: "12%" }}>İndirim Sonrası</div>
                    <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                    <div className="p-2 header-title-cell text-center" style={{ width: "6%" }}>Aksiyon</div>
                </div>

                {numberedRows.map((row, index) => {
                    const piece = parseFloat(row.piece) ?? 0;
                    const uPrice = parseFloat(row.unitPrice) ?? 0;
                    const disc = parseFloat(row.discount) ?? 0;
                    const rawTotal = piece * uPrice;
                    const netTotal = rawTotal * (1 - disc / 100);

                    let totalStr = `${rawTotal.toLocaleString()} €`;
                    let netStr = `${netTotal.toLocaleString()} €`;

                    if (row.isUrgent) { totalStr = "MÜŞTERİYE AİT"; netStr = "MÜŞTERİYE AİT"; }
                    else if (row.isOptionalStyle) { totalStr = "Seçime bağlı"; netStr = "Seçime bağlı"; }
                    else if (row.isShippingStyle) { totalStr = "-"; netStr = "Bilgi Amaçlı"; }
                    else if (uPrice === 0 && row.type === 3) { totalStr = "-"; netStr = "-"; }

                    return (
                        <div key={row.id} className="d-flex align-items-stretch capex-row" style={{ backgroundColor: getRowBg(row) }}>
                            <div className="p-2 px-2 d-flex align-items-center justify-content-center text-white-50 fw-bold" style={{ width: "7%", fontSize: "11px" }}>
                                {row.computedNo}
                            </div>
                            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                            <div className="p-2 px-3 d-flex align-items-center" style={{ width: "36%" }}>
                                {row.type < 3 ? (
                                    <input
                                        type="text"
                                        className="form-control form-control-sm text-start text-white bg-transparent border-0 fw-bold p-0 capex-input"
                                        style={{ fontSize: row.type === 0 ? "13px" : "12px", color: row.type === 0 ? "#60a5fa" : row.type === 1 ? "#cbd5e1" : "#94a3b8", boxShadow: "none", width: "100%" }}
                                        value={row.label}
                                        onChange={(e) => handleCellChange(row.id, "label", e.target.value)}
                                    />
                                ) : (
                                    <textarea
                                        rows={row.label.includes("\n") ? 3 : 1}
                                        className="form-control form-control-sm text-start text-white bg-transparent border-0 fw-medium p-0 capex-input rounded style-none"
                                        style={{ fontSize: "12px", boxShadow: "none", width: "100%", resize: "none" }}
                                        value={row.label}
                                        onChange={(e) => handleCellChange(row.id, "label", e.target.value)}
                                    />
                                )}
                            </div>
                            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                            <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "7%" }}>
                                {row.type < 3 || row.isUrgent ? null : (
                                    <input type="number" className="form-control form-control-sm text-center text-white bg-transparent border-0 p-0 capex-input fw-bold" style={{ fontSize: "12px", boxShadow: "none" }} value={row.piece} onChange={(e) => handleCellChange(row.id, "piece", e.target.value)} />
                                )}
                            </div>
                            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                            <div className="p-1 px-2 d-flex align-items-center justify-content-end" style={{ width: "11%" }}>
                                {row.type < 3 || row.isUrgent ? null : (
                                    <input type="number" className="form-control form-control-sm text-end text-white bg-transparent border-0 p-0 capex-input fw-bold" style={{ fontSize: "12px", boxShadow: "none" }} value={row.unitPrice} onChange={(e) => handleCellChange(row.id, "unitPrice", e.target.value)} />
                                )}
                                {(row.type === 3 && !row.isUrgent) && <span className="text-white-50 ms-1" style={{ fontSize: "11px" }}>€</span>}
                            </div>
                            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                            <div className="p-1 px-2 d-flex align-items-center justify-content-end text-white fw-bold" style={{ width: "11%", fontSize: "11.5px" }}>
                                {row.type < 3 ? null : totalStr}
                            </div>
                            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                            <div className="p-1 d-flex align-items-center justify-content-center" style={{ width: "10%" }}>
                                {row.type < 3 || row.isUrgent || row.isShippingStyle ? null : (
                                    <div className="d-flex align-items-center justify-content-center gap-1 w-100">
                                        <input type="number" className="form-control form-control-sm text-center text-white-50 bg-transparent border-0 p-0 capex-input" style={{ fontSize: "11.5px", boxShadow: "none", width: "45%" }} value={row.discount} onChange={(e) => handleCellChange(row.id, "discount", e.target.value)} />
                                        <span className="text-white-50" style={{ fontSize: "10px" }}>%</span>
                                    </div>
                                )}
                            </div>
                            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                            <div className="p-1 px-2 d-flex align-items-center justify-content-end fw-bold" style={{ width: "12%", fontSize: "12px", color: row.isUrgent ? "#ef4444" : row.piece === 0 ? "#94a3b8" : "#4ade80" }}>
                                {row.type < 3 ? null : netStr}
                            </div>
                            <div style={{ width: "1px", backgroundColor: "#334155" }}></div>
                            {/* AKSİYON PANELİ */}
                            <div className="p-1 d-flex align-items-center justify-content-center gap-2" style={{ width: "6%" }}>
                                <div className="position-relative action-dropdown d-flex align-items-center justify-content-center" style={{ width: "24px", height: "24px" }}>
                                    <button
                                        className="btn btn-sm p-0 border-0 text-success opacity-50 hover-opacity-100 fw-bold"
                                        style={{ fontSize: "16px", lineHeight: "1" }}
                                    >
                                        +
                                    </button>

                                    <div className="dropdown-menu-custom">
                                        <div className="dropdown-item-custom" onClick={() => insertAfterRow(index, 0)}>+ Ana Başlık</div>
                                        <div className="dropdown-item-custom" onClick={() => insertAfterRow(index, 1)}>+ Alt Başlık Lvl 1</div>
                                        <div className="dropdown-item-custom" onClick={() => insertAfterRow(index, 2)}>+ Alt Başlık Lvl 2</div>
                                        <div className="dropdown-item-custom" onClick={() => insertAfterRow(index, 3)}>+ Normal Satır</div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => deleteRow(row.id)}
                                    className="btn btn-sm p-0 border-0 text-danger opacity-40 hover-opacity-100"
                                    style={{ fontSize: "16px", lineHeight: "1" }}
                                    title="Bu Satırı Sil"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default CapexTablosu;