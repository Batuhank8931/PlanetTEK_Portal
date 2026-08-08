import React, { useState, useMemo, useEffect, useCallback } from "react";
import GiderimDetail from "./GiderimDetail";
import { useTeklifStore } from "../../../../utils/teklifStore";
import { hesaplaIdealUniteAdedi } from "../../../../utils/UniteAdediHesaplama";
import API from "../../../../utils/utilRequest";

// Utils ve parçalanmış componentler
import {
    calculateKademeKartlari,
    calculateGlobalSistemOzet,
    calculateSistemHesabi,
    calculateTumSiralar
} from "../../../../utils/yerlesimCalculations";

import KademeKartlari from "./YerlesimObjects/KademeKartlari";
import SistemKontrolPaneli from "./YerlesimObjects/SistemKontrolPaneli";
import SistemSemasi from "./YerlesimObjects/SistemSemasi";

function YerlesimDetail() {
    // 1. Akışı kilitlemek için loading state'i ekliyoruz
    const [loading, setLoading] = useState(true);
    const [uniteHacimCap, setUniteHacimCap] = useState({});

    const updateSection = useTeklifStore((state) => state.updateSection);

    // ZUSTAND STORE SEÇİCİLERİ
    const diskDetailsRaw = useTeklifStore((state) => state.formData?.planetDiskDetails);
    const aritmaParametreleri = useTeklifStore((state) => state.formData?.planetDiskDetails?.tasarim?.aritmaParametreleri);
    const finalMetrekareRaw = useTeklifStore((state) => state.formData?.planetDiskDetails?.tasarim?.finalMetrekare);
    const kaydedilmisTasarimRaw = useTeklifStore((state) => state.formData?.planetDiskDetails?.tasarim);

    const diskDetails = diskDetailsRaw || {};
    const finalMetrekare = finalMetrekareRaw || [];
    const kaydedilmisTasarim = kaydedilmisTasarimRaw || {};

    const minimumBeklemeSuresi = kaydedilmisTasarim.minimumBeklemeSuresi ?? 1.28;
    const lamellaData = diskDetails.tasarim?.lamella || {};
    const Q = Number(diskDetails.debi) || 0;

    const kaydedilenUnite = aritmaParametreleri?.RBCUnite;
    const maxDiskAdedi = aritmaParametreleri?.maxDisk;
    const minDiskAdedi = aritmaParametreleri?.minDisk;

    // LOCAL STATELER (Eğer store'da daha önce kaydedilmiş el ile girişler varsa ilk değer olarak onları alıyoruz)
    const [secilenUnite, setSecilenUnite] = useState(kaydedilmisTasarim.secilenUnite || 1);
    const [secilenSira, setSecilenSira] = useState(kaydedilmisTasarim.secilenSira || 1);
    const [yerlesimDuzeni, setYerlesimDuzeni] = useState(kaydedilmisTasarim.yerlesimDuzeni || []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedKademeData, setSelectedKademeData] = useState(null);
    const [hrtInputStr, setHrtInputStr] = useState(minimumBeklemeSuresi.toString());

    // Manuel disk adetlerini store'dan veya başlangıçta boş arrayden besliyoruz
    const [manuelSiraDiskleri, setManuelSiraDiskleri] = useState(() => {
        if (kaydedilmisTasarim.yerlesimSiralanisi && kaydedilmisTasarim.yerlesimSiralanisi.length > 0) {
            return kaydedilmisTasarim.yerlesimSiralanisi.map(sira => sira.milBasinaDisk);
        }
        return [];
    });

    // API Verilerini Çekme ve Sıralı Akış Başlatma
    useEffect(() => {
        const fetchParameters = async () => {
            try {
                const response = await API.getParamteters();
                const data = response.data || [];
                const paramMap = {};
                data.forEach(item => {
                    paramMap[item.parametre_key] = parseFloat(item.deger);
                });

                setUniteHacimCap({
                    MX: {
                        Hacim: paramMap["mx1Hacim"],
                        Cap: paramMap["mx1Cap"]
                    },
                    MINI: {
                        Hacim: paramMap["miniHacim"],
                        Cap: paramMap["miniCap"]
                    }
                });

                setLoading(false);
            } catch (error) {
                console.error("Parametre verileri yüklenirken hata oldu:", error);
                setLoading(false);
            }
        };
        fetchParameters();
    }, []);

    // Gelen API datasına göre güvenli değer okuma (loading bittiğinde kesinlikle API'den beslenir)
    const diskcapi = kaydedilenUnite === "MX" ? (uniteHacimCap.MX?.Cap ?? 2.02) : (uniteHacimCap.MINI?.Cap ?? 1.45);
    const hacim = kaydedilenUnite === "MX" ? (uniteHacimCap.MX?.Hacim ?? 4.5) : (uniteHacimCap.MINI?.Hacim ?? 2.5);

    const tekDiskAlani = useMemo(() => 2 * (Math.PI * Math.pow(diskcapi, 2) / 4), [diskcapi]);

    useEffect(() => {
        if (minimumBeklemeSuresi !== "" && parseFloat(hrtInputStr) !== minimumBeklemeSuresi) {
            setHrtInputStr(minimumBeklemeSuresi.toString());
        }
    }, [minimumBeklemeSuresi]);

    // Sıra sayısı el ile değiştiğinde array boyutunu koru/güncelle
    useEffect(() => {
        setManuelSiraDiskleri(prev => {
            const yeniArray = Array(secilenSira).fill(null);
            prev.forEach((val, idx) => {
                if (idx < secilenSira) yeniArray[idx] = val;
            });
            return yeniArray;
        });
    }, [secilenSira]);

    // HESAPLAMA UTILS KULLANIMLARI
    const kademeKartlariVerisi = useMemo(() =>
        calculateKademeKartlari(finalMetrekare, tekDiskAlani),
        [finalMetrekare, tekDiskAlani]
    );

    const globalSistemOzet = useMemo(() =>
        calculateGlobalSistemOzet(finalMetrekare, tekDiskAlani),
        [finalMetrekare, tekDiskAlani]
    );

    // KİRİTİK DEĞİŞİKLİK: İdeal ünite adedi tetikleyicisi kontrolü
    useEffect(() => {
        if (loading || globalSistemOzet.toplamGerekliDisk === 0) return;

        // EĞER finalMetrekare daha önceden hesaplananla AYNIYSA ve store'da zaten bir yerleşim varsa HESAPLAMA YAPMA!
        // `lastCalculatedFinalMetrekare` kontrolü ile elindeki yerleşimSiralanisi'nı koru.
        const eskiFinalMetrekare = kaydedilmisTasarim.lastCalculatedFinalMetrekare;
        const yeniFinalMetrekareStr = JSON.stringify(finalMetrekare);
        const eskiFinalMetrekareStr = JSON.stringify(eskiFinalMetrekare);

        if (yeniFinalMetrekareStr === eskiFinalMetrekareStr && kaydedilmisTasarim.yerlesimSiralanisi?.length > 0) {
            // Parametreler değişmedi, kullanıcının elindeki sıralama ve disk sayıları birebir doğrudur.
            return;
        }

        // Eğer ilk defa yükleniyorsa veya finalMetrekare değiştiyse ideal adetleri baştan hesapla
        const idealUniteSayisi = hesaplaIdealUniteAdedi({
            toplamGerekliDisk: globalSistemOzet.toplamGerekliDisk,
            maxDiskAdedi, minDiskAdedi, Q, hacim, minimumBeklemeSuresi, varsayilanSira: 1
        });

        setSecilenUnite(idealUniteSayisi);
        setSecilenSira(1);
        setYerlesimDuzeni([]);
        setManuelSiraDiskleri(Array(1).fill(null));
    }, [globalSistemOzet.toplamGerekliDisk, maxDiskAdedi, minDiskAdedi, Q, hacim, minimumBeklemeSuresi, loading, finalMetrekare]);

    const sistemHesabi = useMemo(() => {
        if (loading) return null;
        return calculateSistemHesabi({
            globalSistemOzet,
            maxDiskAdedi,
            minDiskAdedi,
            secilenUnite,
            secilenSira,
            yerlesimDuzeni,
            manuelSiraDiskleri
        });
    }, [globalSistemOzet, minDiskAdedi, maxDiskAdedi, secilenUnite, secilenSira, yerlesimDuzeni, manuelSiraDiskleri, loading]);

    const tumSiralar = useMemo(() => {
        if (loading || !sistemHesabi) return [];
        return calculateTumSiralar({ sistemHesabi, Q, hacim, lamellaData });
    }, [sistemHesabi, hacim, Q, lamellaData, loading]);

    const handleMilDiskChange = useCallback((siraTipi, yeniDeger) => {
        setManuelSiraDiskleri(prev => {
            const yeniArray = [...prev];
            const sayi = parseInt(yeniDeger, 10);
            yeniArray[siraTipi] = isNaN(sayi) ? null : sayi;
            return yeniArray;
        });
    }, []);

    // YENİLEME / RESET FONKSİYONU
    const handleResetYerlesim = useCallback(() => {
        if (globalSistemOzet.toplamGerekliDisk === 0) return;

        // İdeal ünite sayısını inputlara ve default değerlere göre tekrar hesapla
        const idealUniteSayisi = hesaplaIdealUniteAdedi({
            toplamGerekliDisk: globalSistemOzet.toplamGerekliDisk,
            maxDiskAdedi,
            minDiskAdedi,
            Q,
            hacim,
            minimumBeklemeSuresi,
            varsayilanSira: 1
        });

        // State'leri default hale getirerek yeniden hesaplamayı tetikliyoruz
        setSecilenUnite(idealUniteSayisi);
        setSecilenSira(1);
        setYerlesimDuzeni([]);
        setManuelSiraDiskleri(Array(1).fill(null));

        // Store'daki eski yerleşimi de anında temizlemek için:
        const temizTasarimState = {
            ...useTeklifStore.getState().formData?.planetDiskDetails?.tasarim,
            secilenUnite: idealUniteSayisi,
            secilenSira: 1,
            yerlesimDuzeni: [],
            yerlesimSiralanisi: [], // geçici sıfırlama, alttaki useEffect ile hemen günceli dolacaktır
            lastCalculatedFinalMetrekare: null // useEffect'in koruma mekanizmasını bypass etmek için null yapıyoruz
        };
        updateSection("planetDiskDetails", { tasarim: temizTasarimState });

    }, [globalSistemOzet.toplamGerekliDisk, maxDiskAdedi, minDiskAdedi, Q, hacim, minimumBeklemeSuresi, updateSection]);

    // STORE SENKRONİZASYONU
    useEffect(() => {
        if (loading || !tumSiralar || tumSiralar.length === 0) return;

        const guncelTasarimState = {
            ...useTeklifStore.getState().formData?.planetDiskDetails?.tasarim,
            secilenUnite,
            secilenSira,
            yerlesimDuzeni,
            yerlesimSiralanisi: tumSiralar,
            minimumBeklemeSuresi,
            lastCalculatedFinalMetrekare: finalMetrekare // Bir sonraki renderda karşılaştırmak için buraya kaydediyoruz!
        };

        if (JSON.stringify(useTeklifStore.getState().formData?.planetDiskDetails?.tasarim) === JSON.stringify(guncelTasarimState)) return;

        updateSection("planetDiskDetails", { tasarim: guncelTasarimState });
    }, [tumSiralar, secilenUnite, secilenSira, yerlesimDuzeni, minimumBeklemeSuresi, updateSection, loading, finalMetrekare]);

    const handleUniteChange = useCallback((adet) => {
        setSecilenUnite(parseInt(adet, 10));
        setYerlesimDuzeni([]);
    }, []);

    const handleSiraChange = useCallback((siraAdedi) => {
        setSecilenSira(parseInt(siraAdedi, 10));
        setYerlesimDuzeni([]);
    }, []);

    const handleBeklemeSuresiChange = useCallback((val) => {
        setHrtInputStr(val);
        if (val === "") {
            updateSection("planetDiskDetails", {
                tasarim: { ...useTeklifStore.getState().formData?.planetDiskDetails?.tasarim, minimumBeklemeSuresi: "" }
            });
            return;
        }
        if (val.endsWith(".") || val.endsWith(",")) return;

        const normalizedVal = val.replace(",", ".");
        let nVal = parseFloat(normalizedVal);

        if (!isNaN(nVal)) {
            if (nVal < 0) nVal = 0;
            updateSection("planetDiskDetails", {
                tasarim: { ...useTeklifStore.getState().formData?.planetDiskDetails?.tasarim, minimumBeklemeSuresi: nVal }
            });
        }
    }, [updateSection]);

    const openDetailModal = useCallback((kademeVerisi, kademeAdi) => {
        setSelectedKademeData({ ...kademeVerisi, kademeNo: kademeAdi });
        setIsModalOpen(true);
    }, []);

    const handleDragStart = useCallback((e, kaynakSiraTipi) => {
        e.dataTransfer.setData("kaynakSiraTipi", kaynakSiraTipi);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    const handleDrop = useCallback((e, hedefeBasildi, hedefSiraTipi) => {
        e.preventDefault();
        if (hedefeBasildi || !sistemHesabi) return;

        const kaynakSiraTipi = parseInt(e.dataTransfer.getData("kaynakSiraTipi"), 10);
        if (kaynakSiraTipi === hedefSiraTipi) return;

        const yeniDagilim = [...sistemHesabi.dagilim];
        if (yeniDagilim[kaynakSiraTipi] > 0) {
            yeniDagilim[kaynakSiraTipi] -= 1;
            yeniDagilim[hedefSiraTipi] += 1;
        }
        setYerlesimDuzeni(yeniDagilim);
    }, [sistemHesabi]);

    // 2. ASENKRON SÜREÇ BİTENE KADAR UI VE HESAPLAMALARI KORU
    if (loading) {
        return <div className="text-white p-4 text-center">Yerleşim parametreleri yükleniyor...</div>;
    }

    if (!sistemHesabi) {
        return <div className="text-white p-3 text-center">Tasarım verisi hesaplanamadı veya eksik.</div>;
    }

    return (
        <div className="p-1 rounded" style={{ backgroundColor: "#1e293b", display: "flex", flexDirection: "column" }}>

            <KademeKartlari
                kademeKartlariVerisi={kademeKartlariVerisi}
                openDetailModal={openDetailModal}
            />

            <SistemKontrolPaneli
                sistemHesabi={sistemHesabi}
                hrtInputStr={hrtInputStr}
                handleUniteChange={handleUniteChange}
                handleSiraChange={handleSiraChange}
                handleBeklemeSuresiChange={handleBeklemeSuresiChange}
                onReset={handleResetYerlesim} // <--- Bu satırı eklemiş olduk
            />

            <SistemSemasi
                tumSiralar={tumSiralar}
                minimumBeklemeSuresi={minimumBeklemeSuresi}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                handleMilDiskChange={handleMilDiskChange}
                maxDiskAdedi={maxDiskAdedi}
                minDiskAdedi={minDiskAdedi}
            />

            {isModalOpen && (
                <GiderimDetail
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    kademeData={selectedKademeData}
                    genelVeri={diskDetails}
                />
            )}
        </div>
    );
}

export default YerlesimDetail;