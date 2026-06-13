import React, { useState, useMemo, useEffect, useCallback } from "react";
import GiderimDetail from "./GiderimDetail";
import { useTeklifStore } from "../../../../utils/teklifStore";
import { hesaplaIdealUniteAdedi } from "../../../../utils/UniteAdediHesaplama";

// Yeni eklediğimiz utils ve parçalanmış componentleri import ediyoruz
import {
    calculateKademeKartlari,
    calculateGlobalSistemOzet,
    calculateSistemHesabi,
    calculateTumSiralar
} from "../../../../utils/yerlesimCalculations";

import KademeKartlari from "./YerleşimObjects/KademeKartlari";
import SistemKontrolPaneli from "./YerleşimObjects/SistemKontrolPaneli";
import SistemSemasi from "./YerleşimObjects/SistemSemasi";

function YerlesimDetail() {
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

    const kaydedilenUnite = aritmaParametreleri?.RBCUnite ?? "MX"
    const kaydedilenMaxDisk = aritmaParametreleri?.maxDisk ?? 130
    const kaydedilenMinDisk = aritmaParametreleri?.minDisk ?? 100

    const diskcapi = kaydedilenUnite === "MX" ? 2.05 : 1.35;
    const hacim = kaydedilenUnite === "MX" ? 4.5 : 2.00;
    const maxDiskAdedi = kaydedilenMaxDisk;
    const minDiskAdedi = kaydedilenMinDisk;

    const tekDiskAlani = useMemo(() => 2 * (Math.PI * Math.pow(diskcapi, 2) / 4), [diskcapi]);

    // LOCAL STATELER
    const [secilenUnite, setSecilenUnite] = useState(kaydedilmisTasarim.secilenUnite || 1);
    const [secilenSira, setSecilenSira] = useState(kaydedilmisTasarim.secilenSira || 1);
    const [yerlesimDuzeni, setYerlesimDuzeni] = useState(kaydedilmisTasarim.yerlesimDuzeni || []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedKademeData, setSelectedKademeData] = useState(null);
    const [hrtInputStr, setHrtInputStr] = useState(minimumBeklemeSuresi.toString());

    const [manuelSiraDiskleri, setManuelSiraDiskleri] = useState([]);

    useEffect(() => {
        if (minimumBeklemeSuresi !== "" && parseFloat(hrtInputStr) !== minimumBeklemeSuresi) {
            setHrtInputStr(minimumBeklemeSuresi.toString());
        }
    }, [minimumBeklemeSuresi]);

    useEffect(() => {
        setManuelSiraDiskleri(Array(secilenSira).fill(null));
    }, [secilenSira]);

    // HESAPLAMA UTILS KULLANIMLARI (Temiz useMemo'lar)
    const kademeKartlariVerisi = useMemo(() =>
        calculateKademeKartlari(finalMetrekare, tekDiskAlani),
        [finalMetrekare, tekDiskAlani]
    );

    const globalSistemOzet = useMemo(() =>
        calculateGlobalSistemOzet(finalMetrekare, tekDiskAlani),
        [finalMetrekare, tekDiskAlani]
    );

    // İdeal ünite adedi tetikleyicisi
    useEffect(() => {
        if (globalSistemOzet.toplamGerekliDisk === 0) return;

        const idealUniteSayisi = hesaplaIdealUniteAdedi({
            toplamGerekliDisk: globalSistemOzet.toplamGerekliDisk,
            maxDiskAdedi, minDiskAdedi, Q, hacim, minimumBeklemeSuresi, varsayilanSira: 1
        });

        setSecilenUnite(idealUniteSayisi);
        setSecilenSira(1);
        setYerlesimDuzeni([]);
    }, [globalSistemOzet.toplamGerekliDisk, maxDiskAdedi, minDiskAdedi, Q, hacim, minimumBeklemeSuresi]);

    // 2. useMemo hesaplamasına parametre olarak ulaştır:
    const sistemHesabi = useMemo(() =>
        calculateSistemHesabi({
            globalSistemOzet,
            maxDiskAdedi,
            minDiskAdedi,
            secilenUnite,
            secilenSira,
            yerlesimDuzeni,
            manuelSiraDiskleri // Yeni eklenen state
        }),
        [globalSistemOzet, minDiskAdedi, maxDiskAdedi, secilenUnite, secilenSira, yerlesimDuzeni, manuelSiraDiskleri]
    );

    const tumSiralar = useMemo(() =>
        calculateTumSiralar({ sistemHesabi, Q, hacim, lamellaData }),
        [sistemHesabi, hacim, Q, lamellaData]
    );

    // 3. Sıradaki input değiştikçe tetiklenecek handler fonksiyonu:
    const handleMilDiskChange = useCallback((siraTipi, yeniDeger) => {
        setManuelSiraDiskleri(prev => {
            const yeniArray = [...prev];
            const sayi = parseInt(yeniDeger, 10);

            // Eğer input temizlendiyse (boşsa) o sıranın kilidini kaldır (null yap) otomatik hesaplasın
            yeniArray[siraTipi] = isNaN(sayi) ? null : sayi;
            return yeniArray;
        });
    }, []);

    // STORE SENKRONİZASYONU
    useEffect(() => {
        if (!tumSiralar || tumSiralar.length === 0) return;

        const guncelTasarimState = {
            ...useTeklifStore.getState().formData?.planetDiskDetails?.tasarim,
            secilenUnite, secilenSira, yerlesimDuzeni, yerlesimSiralanisi: tumSiralar, minimumBeklemeSuresi
        };

        if (JSON.stringify(useTeklifStore.getState().formData?.planetDiskDetails?.tasarim) === JSON.stringify(guncelTasarimState)) return;

        updateSection("planetDiskDetails", { tasarim: guncelTasarimState });
    }, [tumSiralar, secilenUnite, secilenSira, yerlesimDuzeni, minimumBeklemeSuresi, updateSection]);

    // HANDLERS (useCallback ile optimize edildi, alt componentlere güvenle geçilebilir)
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

    // DRAG & DROP HANDLERS
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

    if (!sistemHesabi) {
        return <div className="text-white p-3 text-center">Tasarım verisi hesaplanamadı veya eksik.</div>;
    }

    return (
        <div className="p-1 rounded" style={{ backgroundColor: "#1e293b", display: "flex", flexDirection: "column" }}>

            {/* ÜST KISIM: KADEME KARTLARI */}
            <KademeKartlari
                kademeKartlariVerisi={kademeKartlariVerisi}
                openDetailModal={openDetailModal}
            />

            {/* ORTA KISIM: KONTROL PANELİ */}
            <SistemKontrolPaneli
                sistemHesabi={sistemHesabi}
                hrtInputStr={hrtInputStr}
                handleUniteChange={handleUniteChange}
                handleSiraChange={handleSiraChange}
                handleBeklemeSuresiChange={handleBeklemeSuresiChange}
            />

            {/* ALT KISIM: SÜRÜKLENEBİLİR ŞEMA */}
            <SistemSemasi
                tumSiralar={tumSiralar}
                minimumBeklemeSuresi={minimumBeklemeSuresi}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                handleMilDiskChange={handleMilDiskChange} // Yeni prop
                maxDiskAdedi={maxDiskAdedi}
                minDiskAdedi={minDiskAdedi}
            />

            {/* DETAY MODALI */}
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