// equipmentPriceResolvers.js
import API from "./utilRequest";

export async function resolveScreenPrices(onAritmaObj, priceData) {
    const isYurtIci = priceData?.teklifDili === "Yerli" || priceData?.isYurtIci === true;

    // Teklifte seçilen kapasiteyi sayıya çeviriyoruz (Örn: 200)
    const secilenKapasiteSayi = parseInt(onAritmaObj?.onAritmaKapasite) || 0;

    // Kullanıcının seçtiği ızgara tipi: "Otomatik Mekanik Izgara" veya "Manuel Izgara"
    // DB'deki "Manuel" / "Otomatik" metinleriyle eşleştirmek için normalize ediyoruz
    const secilenIzgaraTipiStr = onAritmaObj?.izgaraTipi || "";
    const dbTipiTarget = secilenIzgaraTipiStr.includes("Otomatik") ? "Otomatik" : "Manuel";

    // Fallback objesi (Hata veya eşleşmeme durumunda sıfır dönsün)
    const defaultPrices = { mKaba: 0, mInce: 0, oKaba: 0, oInce: 0, plaka: 0, activeIzgaraFiyat: 0 };

    try {
        const response = await API.getScreenData();
        // 🌟 Yeni şemadan 3 tabloyu destrucuring ile alıyoruz
        const { greaseTrap = [], coarseScreen = [], fineScreen = [] } = response?.data || {};

        // 1️⃣ Yardımcı Fonksiyon: Kapasite ve Tip'e göre fiyata gitme (Izgaralar için)
        const findScreenPrice = (screenArray, targetKapasite, targetType) => {
            const row = screenArray.find(item => {
                const dbKapasite = parseInt(String(item.kapasite).replace(/[^0-9]/g, "")) || 0;
                const dbType = String(item.tipi).trim();
                return dbKapasite === targetKapasite && dbType === targetType;
            });
            if (!row) return 0;
            return isYurtIci ? parseFloat(row.yi_fiyat) : parseFloat(row.yd_fiyat);
        };

        // 2️⃣ Yardımcı Fonksiyon: Sadece Kapasiteye göre fiyata gitme (Yağ Tutucu için)
        const findGreasePrice = (greaseArray, targetKapasite) => {
            const row = greaseArray.find(item => {
                const dbKapasite = parseInt(String(item.kapasite).replace(/[^0-9]/g, "")) || 0;
                return dbKapasite === targetKapasite;
            });
            if (!row) return 0;
            return isYurtIci ? parseFloat(row.yi_fiyat) : parseFloat(row.yd_fiyat);
        };

        // Fiyatları tek tek dikey tablolardan süzüyoruz
        const mKabaPrice = findScreenPrice(coarseScreen, secilenKapasiteSayi, "Manuel");
        const oKabaPrice = findScreenPrice(coarseScreen, secilenKapasiteSayi, "Otomatik");
        const mIncePrice = findScreenPrice(fineScreen, secilenKapasiteSayi, "Manuel");
        const oIncePrice = findScreenPrice(fineScreen, secilenKapasiteSayi, "Otomatik");
        const plakaPrice = findGreasePrice(greaseTrap, secilenKapasiteSayi);

        // Teklif motorunda o an aktif olan/seçilen ızgara fiyatını kolayca basabilmek için dinamik seçelim:
        const activeIzgaraFiyat = dbTipiTarget === "Otomatik" ? oKabaPrice : mKabaPrice;
        // Not: Eğer kaba/ince ayrımını başka bir alan belirliyorsa activeIzgaraFiyat'ı ona göre genişletebilirsin.

        return {
            mKaba: mKabaPrice,
            oKaba: oKabaPrice,
            mInce: mIncePrice,
            oInce: oIncePrice,
            plaka: plakaPrice,
            activeIzgaraFiyat: activeIzgaraFiyat // Teklif hesaplamasında hayat kurtarır
        };

    } catch (error) {
        console.error("resolveScreenPrices maliyet hesaplama hatası:", error);
        return defaultPrices;
    }
}

export async function resolveTerfiPompasiPrices(feedPumpObj, priceData) {

    const isYurtIci = priceData?.teklifDili === "Yerli" || priceData?.isYurtIci === true;
    const secilenPompa = String(feedPumpObj?.secilenPompaMetni || "").trim();

    try {
        // API'den dalgıç/terfi pompası maliyetlerini çekiyoruz
        const response = await API.getSubmersibleCosts();
        const pumps = response?.data?.data || response?.data || [];

        if (pumps.length > 0 && secilenPompa) {
            // Kullanıcının seçtiği pompa metni ile DB'deki pompa_adi kolonunu eşleştiriyoruz
            const pompaSatiri = pumps.find(
                item => String(item.pompa_adi || "").trim().toLowerCase() === secilenPompa.toLowerCase()
            );

            if (pompaSatiri) {
                return {
                    terfiPompasi: isYurtIci ? parseFloat(pompaSatiri.yi_satis) : parseFloat(pompaSatiri.yd_satis)
                };
            }
            console.warn(`Seçilen pompa (${secilenPompa}) ile DB satırı eşleşmedi.`);
        }
    } catch (error) {
        console.error("Terfi Pompası API'den veri çekilirken hata oluştu:", error);
    }

    return {}; // API patlarsa veya eşleşme olmazsa boş nesne dönüyoruz
}
/**
 * 3. Debi Dağıtım Yapısı Fiyatları
 */
/**
 * 3. Debi Dağıtım Yapısı Fiyatları (Dinamik DB Sürümü)
 * priceData: { teklifDili: "Yerli" } veya { isYurtIci: true }
 */
export async function resolveDebiDagitimPrices(feedPumpObj, priceData) {

    // Eğer dağıtım yapısı seçilmediyse hiç istek atmadan boş dönüyoruz
    if (!feedPumpObj?.hasDistributionStructure) {
        return {};
    }

    const isYurtIci = priceData?.teklifDili === "Yerli" || priceData?.isYurtIci === true;
    const secilenCikisAdedi = String(feedPumpObj?.distributionCikisAdet || "").trim();

    try {
        const response = await API.getFlowDistribution();
        const distributions = response?.data?.data || response?.data || [];

        if (distributions.length > 0 && secilenCikisAdedi) {
            // Formdan gelen çıkış adedi ile DB'deki 'ad' kolonunu eşleştiriyoruz
            const dagitimSatiri = distributions.find(
                item => String(item.ad || "").trim() === secilenCikisAdedi
            );

            if (dagitimSatiri) {
                return {
                    dagitimYapisi: isYurtIci ? parseFloat(dagitimSatiri.yi) : parseFloat(dagitimSatiri.yd)
                };
            }
            console.warn(`Seçilen çıkış adedi (${secilenCikisAdedi}) ile DB satırı eşleşmedi.`);
        }
    } catch (error) {
        console.error("Debi Dağıtım API'den veri çekilirken hata oluştu:", error);
    }

    return {};
}

/**
 * 4. RBC (PlanetDISK Ünitesi ve Kapağı) Fiyatları
 */
/**
 * 4. RBC (PlanetDISK ve Kapak) Fiyatları (Dinamik DB Sürümü)
 * priceData: { teklifDili: "Yerli" } veya { isYurtIci: true }
 */
export async function resolveRBCPrices(planetDiskDetails, priceData, UniteTipi) {

    const isYurtIci = priceData?.teklifDili === "Yerli" || priceData?.isYurtIci === true;

    // Yerleşim sıralanışı array'ini güvenle alıyoruz
    const yerlesimArray = planetDiskDetails?.tasarim?.yerlesimSiralanisi || [];

    // 1. isLamella değeri false (RBC) olan nesnelerin adetlerini topluyoruz
    const toplamRbcAdedi = yerlesimArray
        .filter(item => item && item.isLamella === false)
        .reduce((sum, item) => sum + (parseInt(item.adet) || 0), 0);

    // Eğer RBC ünitesi yoksa istek atmadan sıfır dönelim
    if (toplamRbcAdedi === 0) {
        return { kapaksizUnite: 0, kapak: 0 };
    }

    try {
        const response = await API.getMainUnits();
        const mainUnits = response?.data?.data || response?.data || [];


        if (mainUnits.length > 0) {
            // Toplam adedi 'sale_amount' kolonu ile eşleştiriyoruz (Varsayılan model: MX1)
            const rbcSatiri = mainUnits.find(
                item => parseInt(item.sale_amount) === toplamRbcAdedi && String(item.model).toUpperCase() === "MX1"
            );


            if (rbcSatiri) {
                return {
                    kapaksizUnite: isYurtIci ? parseFloat(rbcSatiri.yi_kapaksiz) : parseFloat(rbcSatiri.yd_kapaksiz),
                    kapak: isYurtIci ? parseFloat(rbcSatiri.kapak_fiyati_yi) : parseFloat(rbcSatiri.kapak_fiyati_yd),
                    kapakli: ((isYurtIci ? parseFloat(rbcSatiri.yi_kapaksiz) : parseFloat(rbcSatiri.yd_kapaksiz)) + (isYurtIci ? parseFloat(rbcSatiri.kapak_fiyati_yi) : parseFloat(rbcSatiri.kapak_fiyati_yd))),
                    pano: isYurtIci ? parseFloat(rbcSatiri.pYi) : parseFloat(rbcSatiri.pYd),
                    tesisat: isYurtIci ? parseFloat(rbcSatiri.tYi) : parseFloat(rbcSatiri.tYd),
                    sase: isYurtIci ? parseFloat(rbcSatiri.sase_fiyati_yi) : parseFloat(rbcSatiri.sase_fiyati_yd),

                };
            }
            console.warn(`Toplam adet (${toplamRbcAdedi}) ile eşleşen sale_amount DB satırı bulunamadı.`);
        }
    } catch (error) {
        console.error("Main Units (RBC) API'den veri çekilirken hata oluştu:", error);
    }

    return {};
}

/**
 * 5. Lamella Seperatör Fiyatları
 */
/**
 * 5. Lamella Seperatör Fiyatları (Dinamik DB Sürümü)
 * priceData: { teklifDili: "Yerli" } veya { isYurtIci: true }
 */
export async function resolveLamellaPrices(planetDiskDetails, priceData) {

    const isYurtIci = priceData?.teklifDili === "Yerli" || priceData?.isYurtIci === true;
    const yerlesimArray = planetDiskDetails?.tasarim?.yerlesimSiralanisi || [];

    // 1. isLamella değeri true olan ilk objeyi bulup içindeki modeli alıyoruz
    const lamellaObj = yerlesimArray.find(item => item && item.isLamella === true);

    // Model metnini temizliyoruz (Örn: "LS_15" -> "LS15")
    const secilenLamellaModeli = String(lamellaObj?.model || "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();

    // Eğer lamella yapısı yoksa hiç istek atmadan sıfır dönelim
    if (!lamellaObj || !secilenLamellaModeli) {
        return { lamellaSeperator: 0 };
    }

    try {
        const response = await API.getLamellaData();
        const lamellaData = response?.data?.data || response?.data || [];

        if (lamellaData.length > 0) {
            // Veritabanındaki 'tipi' kolonunu da temizleyerek eşleştiriyoruz (Örn: "LS 15" -> "LS15")
            const lamellaSatiri = lamellaData.find(item => {
                const dbTipi = String(item.tipi || "")
                    .replace(/[^a-zA-Z0-9]/g, "")
                    .toUpperCase();
                return dbTipi === secilenLamellaModeli;
            });

            if (lamellaSatiri) {
                return {
                    lamellaSeperator: isYurtIci ? parseFloat(lamellaSatiri.yi_fiyat) : parseFloat(lamellaSatiri.yd_fiyat)
                };
            }
            console.warn(`Seçilen Lamella Modeli (${lamellaObj?.model}) ile DB satırı eşleşmedi.`);
        }
    } catch (error) {
        console.error("Lamella API'den veri çekilirken hata oluştu:", error);
    }

    return {};
}

/**
 * 6. Son Çöktürme Çamur Pompası Fiyatları
 */

export async function resolveLamellaPumpPrices(lamellaPomapasiModeli, priceData) {
    const isYurtIci = priceData?.teklifDili === "Yerli" || priceData?.isYurtIci === true;

    try {
        // API'den dalgıç/terfi pompası maliyetlerini çekiyoruz
        const response = await API.getSubmersibleCosts();
        const pumps = response?.data?.data || response?.data || [];

        if (pumps.length > 0 && lamellaPomapasiModeli) {
            // Kullanıcının seçtiği pompa metni ile DB'deki pompa_adi kolonunu eşleştiriyoruz
            const pompaSatiri = pumps.find(
                item => String(item.pompa_adi || "").trim().toLowerCase() === lamellaPomapasiModeli.toLowerCase()
            );

            if (pompaSatiri) {
                return {
                    camurPompasi: isYurtIci ? parseFloat(pompaSatiri.yi_satis) : parseFloat(pompaSatiri.yd_satis)
                };
            }
            console.warn(`Seçilen pompa (${lamellaPomapasiModeli}) ile DB satırı eşleşmedi.`);
        }
    } catch (error) {
        console.error("Terfi Pompası API'den veri çekilirken hata oluştu:", error);
    }

    return {}; // API patlarsa veya eşleşme olmazsa boş nesne dönüyoruz
}

/**
 * 7. İleri Arıtma Fiyatları (Resirkülasyon, Mikser, FeCl3 Dozaj)
 */
/**
 * 6. İleri Arıtma Ekipman Fiyatları (Dinamik DB Sürümü)
 * priceData: { teklifDili: "Yerli" } veya { isYurtIci: true }
 */
export async function resolveIleriAritmaPrices(ileriAritmaObj, priceData) {

    const isYurtIci = priceData?.teklifDili === "Yerli" || priceData?.isYurtIci === true;

    // Alt kırılımları güvenle çekiyoruz
    const pumpSel = ileriAritmaObj?.IleriAritmaPumpSelections || {};
    const mixerSel = ileriAritmaObj?.IleriAritmaTankMixerSelections || {};
    const dozajSel = ileriAritmaObj?.IleriAritmaDozajSelections || {};

    // Eşleştirme anahtarları
    const secilenGeridevirPompasi = String(pumpSel.geridevirPompasi || "").trim();
    const secilenMikserId = String(mixerSel.secilenMikserId || "").trim();
    const secilenDozajPompaId = String(dozajSel.secilenPompaId || "").trim();
    const secilenDozajTankId = String(dozajSel.secilenTankId || "").trim();

    // Döneceğimiz nihai fiyat objesi (Varsayılan olarak sıfır)
    const results = {
        resirkulasyon: 0,
        mikser: 0,
        dozajFeCl3: 0
    };

    try {
        // --- 1. Resirkülasyon (Geri Devir) Pompası Fiyatı ---
        if (secilenGeridevirPompasi) {
            const subResponse = await API.getSubmersibleCosts();
            const subPumps = subResponse?.data?.data || subResponse?.data || [];

            const pompaSatiri = subPumps.find(
                item => String(item.pompa_adi || "").trim().toLowerCase() === secilenGeridevirPompasi.toLowerCase()
            );
            if (pompaSatiri) {
                results.resirkulasyon = isYurtIci ? parseFloat(pompaSatiri.yi_satis) : parseFloat(pompaSatiri.yd_satis);
            } else {
                console.warn(`Resirkülasyon pompası (${secilenGeridevirPompasi}) DB'de bulunamadı.`);
            }
        }

        // --- 2. Mikser ve Dozaj Ekipmanları Fiyatı (İleri Arıtma Tablosu) ---
        if (secilenMikserId || secilenDozajPompaId || secilenDozajTankId) {
            const ieResponse = await API.getIlerAritmaEquipmentsCosts();
            const ieEquipments = ieResponse?.data?.data || ieResponse?.data || [];

            // Mikser Eşleştirmesi
            if (secilenMikserId) {
                const mikserSatiri = ieEquipments.find(item => String(item.id) === secilenMikserId);
                if (mikserSatiri) {
                    results.mikser = isYurtIci ? parseFloat(mikserSatiri.yi_satis) : parseFloat(mikserSatiri.yd_satis);
                }
            }

            // Dozaj Kompleks Fiyatlandırması (Pompa + Kimyasal Çözelti Tankı)
            let dozajPompaFiyati = 0;
            let dozajTankFiyati = 0;

            if (secilenDozajPompaId) {
                const dPompaSatiri = ieEquipments.find(item => String(item.id) === secilenDozajPompaId);
                if (dPompaSatiri) {
                    dozajPompaFiyati = isYurtIci ? parseFloat(dPompaSatiri.yi_satis) : parseFloat(dPompaSatiri.yd_satis);
                }
            }

            if (secilenDozajTankId) {
                const dTankSatiri = ieEquipments.find(item => String(item.id) === secilenDozajTankId);
                if (dTankSatiri) {
                    dozajTankFiyati = isYurtIci ? parseFloat(dTankSatiri.yi_satis) : parseFloat(dTankSatiri.yd_satis);
                }
            }

            // Dozaj toplamı = Dozaj Pompası + Çözelti Tankı
            results.dozajFeCl3 = dozajPompaFiyati + dozajTankFiyati;
        }

    } catch (error) {
        console.error("İleri Arıtma fiyatları DB'den çözülürken hata oluştu:", error);
    }

    return results;
}



/**
 * 8. Filtrasyon ve Dezenfeksiyon Fiyatları
 */
/**
 * 7. Filtrasyon Ekipman Fiyatları (Dinamik DB Sürümü)
 * priceData: { teklifDili: "Yerli" } veya { isYurtIci: true }
 */
/**
 * 7. Filtrasyon Ekipman Fiyatları (Özel Filtrasyon DB Yapısı)
 * priceData: { teklifDili: "Yerli" } veya { isYurtIci: true }
 */
export async function resolveFiltrationPrices(filtrationObj, priceData) {


    const isYurtIci = priceData?.teklifDili === "Yerli" || priceData?.isYurtIci === true;

    // Form alt kırılımlarını alalım
    const onKlorlamaSel = filtrationObj?.onKlorlama || {};
    const pompalarSel = filtrationObj?.pompalar || {};
    const filtrelerSel = filtrationObj?.SecilenFiltreler || {};

    const results = {
        onKlorlama: 0,
        beslemePompasi: 0,
        geriyikamaPompasi: 0,
        separatorFiltre: 0,
        kumFiltreOto: 0,
        karbonFiltreOto: 0
    };

    try {
        // Tek bir endpoint'ten tüm filtrasyon kırılımları destructure edilerek geliyor
        const response = await API.getFiltrationCosts();
        const {
            filtrationEquipments = [],
            feedPumps = [],
            backwashPumps = [],
            onKlorlamaEquipments = []
        } = response.data || {};

        // 1. Ön Klorlama Hesaplaması (on_klorlama_ekipmanlari)
        const klorPompaId = String(onKlorlamaSel.pompaId || "").trim();
        const klorTankId = String(onKlorlamaSel.tankId || "").trim();

        let klorPompaFiyati = 0;
        let klorTankFiyati = 0;

        if (klorPompaId && onKlorlamaEquipments.length > 0) {
            const kpSatiri = onKlorlamaEquipments.find(item => String(item.id) === klorPompaId);
            if (kpSatiri) klorPompaFiyati = isYurtIci ? parseFloat(kpSatiri.yi_satis) : parseFloat(kpSatiri.yd_satis);
        }
        if (klorTankId && onKlorlamaEquipments.length > 0) {
            const ktSatiri = onKlorlamaEquipments.find(item => String(item.id) === klorTankId);
            if (ktSatiri) klorTankFiyati = isYurtIci ? parseFloat(ktSatiri.yi_satis) : parseFloat(ktSatiri.yd_satis);
        }
        results.onKlorlama = klorPompaFiyati + klorTankFiyati;

        // 2. Besleme Pompası Hesaplaması (filtration_feed_pumps -> debi eşleşmesi)
        const formBeslemeDebi = parseFloat(pompalarSel.besleme?.debiM3h);
        if (!isNaN(formBeslemeDebi) && feedPumps.length > 0) {
            const bPompaSatiri = feedPumps.find(item => parseFloat(item.debi) === formBeslemeDebi);
            if (bPompaSatiri) {
                results.beslemePompasi = isYurtIci ? parseFloat(bPompaSatiri.satis_yi) : parseFloat(bPompaSatiri.satis_yd);
            }
        }

        // 3. Geri Yıkama Pompası Hesaplaması (filtration_backwash_pumps -> geri_yikama_debi eşleşmesi)
        const formGeriYikamaDebi = parseFloat(pompalarSel.geriYikama?.debiM3h);
        if (!isNaN(formGeriYikamaDebi) && backwashPumps.length > 0) {
            const gPompaSatiri = backwashPumps.find(item => parseFloat(item.geri_yikama_debi) === formGeriYikamaDebi);
            if (gPompaSatiri) {
                results.geriyikamaPompasi = isYurtIci ? parseFloat(gPompaSatiri.satis_yi) : parseFloat(gPompaSatiri.satis_yd);
            }
        }

        // 4. Filtrasyon Ekipmanları Hesaplaması (filtration_equipments -> debi ve ekipman_tipi eşleşmesi)
        if (filtrationEquipments.length > 0) {
            // Seperatör Filtre
            const formSepDebi = parseFloat(filtrelerSel.seperatorFiltre?.debiM3h);
            if (!isNaN(formSepDebi)) {
                const fSatiri = filtrationEquipments.find(item => parseFloat(item.debi) === formSepDebi && item.ekipman_tipi === "Seperatör");
                if (fSatiri) results.separatorFiltre = isYurtIci ? parseFloat(fSatiri.satis_yi) : parseFloat(fSatiri.satis_yd);
            }

            // Kum Filtresi
            const formKumDebi = parseFloat(filtrelerSel.kumFiltre?.debiM3h);
            if (!isNaN(formKumDebi)) {
                const fSatiri = filtrationEquipments.find(item => parseFloat(item.debi) === formKumDebi && item.ekipman_tipi === "Kum Filtresi");
                if (fSatiri) results.kumFiltreOto = isYurtIci ? parseFloat(fSatiri.satis_yi) : parseFloat(fSatiri.satis_yd);
            }

            // Aktif Karbon Filtresi
            const formKarbonDebi = parseFloat(filtrelerSel.aktifKarbonFiltre?.debiM3h);
            if (!isNaN(formKarbonDebi)) {
                const fSatiri = filtrationEquipments.find(item => parseFloat(item.debi) === formKarbonDebi && item.ekipman_tipi === "Aktif Karbon Filtresi");
                if (fSatiri) results.karbonFiltreOto = isYurtIci ? parseFloat(fSatiri.satis_yi) : parseFloat(fSatiri.satis_yd);
            }
        }

    } catch (error) {
        console.error("Filtrasyon özel maliyetleri DB'den çözülürken hata oluştu:", error);
    }

    return results;
}
/**
 * 9. Çamur Susuzlaştırma Ünitesi Fiyatları
 */
/**
 * 9. Çamur Susuzlaştırma Ünitesi Fiyatları (Dinamik DB Sürümü)
 * priceData: { teklifDili: "Yerli" } veya { isYurtIci: true }
 */
export async function resolveSusuzlastirmaPrices(sludgeObj, priceData) {
    const isYurtIci = priceData?.teklifDili === "Yerli" || priceData?.isYurtIci === true;

    // Temel ana ekipmanlar yine sabit kalabilir
    const results = {
        camurBeslemePompa: 0,
        dekantor: 0,
        filtrepress: 0,
        polimerUnitesi: 0,
        suzuntuSuyuPompa: 0
    };

    try {
        const response = await API.getSludgeDewateringCosts();
        const dbRows = response?.data?.data || response?.data || [];

        if (dbRows.length > 0) {
            const getPrice = (type, capacity = null) => {
                const found = dbRows.find(item => {
                    const typeMatch = String(item.ekipman_tipi).trim().toLowerCase() === type.toLowerCase();
                    if (capacity !== null) {
                        return typeMatch && parseFloat(item.kapasite_degeri) === parseFloat(capacity);
                    }
                    return typeMatch;
                });
                if (found) {
                    return isYurtIci ? parseFloat(found.satis_yi) : parseFloat(found.satis_yd);
                }
                return 0;
            };

            // 1. Ana Ekipman Çözümleme
            const secilenTip = String(sludgeObj?.ekipmanTipi || "").trim().toLowerCase();
            const anaKapasite = sludgeObj?.anaEkipman?.kapasite_degeri;

            if (secilenTip === "dekantör" || secilenTip === "dekantor") {
                results.dekantor = getPrice("dekantor", anaKapasite);
            } else if (secilenTip === "filtrepress" || secilenTip === "filtrepres") {
                results.filtrepress = getPrice("filtrepres", anaKapasite);
            }

            // 2. Çamur Besleme Pompası
            if (sludgeObj?.beslemePompasi?.kapasite_degeri) {
                results.camurBeslemePompa = getPrice("besleme_pompasi", sludgeObj.beslemePompasi.kapasite_degeri);
            }

            // 3. Süzüntü Suyu Pompası
            if (sludgeObj?.suzuntuPompasi?.kapasite_degeri) {
                results.suzuntuSuyuPompa = getPrice("suzuntu_pompasi", sludgeObj.suzuntuPompasi.kapasite_degeri);
            }

            // 4. Sabit/Global Opsiyon Kalemleri
            results.polimerUnitesi = getPrice("polimer_unitesi");

            // --- DİNAMİK OPSİYON ÇÖZÜMLEME KISMI ---
            // sludgeObj.opsiyonlar altındaki tüm key'leri ("konveyor", "Burgu Konveyor" vb.) dönüyoruz
            const opsiyonlar = sludgeObj?.opsiyonlar || {};
            Object.keys(opsiyonlar).forEach(opsiyonKey => {
                // DB'deki ekipman_tipi ile eşleştirip fiyatını doğrudan results objesine ekliyoruz
                results[opsiyonKey] = getPrice(opsiyonKey);
            });
        }

    } catch (error) {
        console.error("Çamur susuzlaştırma fiyatları DB'den çözülürken hata oluştu:", error);
    }

    return results;
}

export async function resolveMembranePrices(membraneObj, priceData) {
    const isYurtIci = priceData?.teklifDili === "Yerli" || priceData?.isYurtIci === true;

    // membraneObj doğrudan membraneSystem olabilir veya onu sarmalayan üst nesne olabilir
    const system = membraneObj?.membraneSystem || membraneObj;

    // Fiyat anahtarını yurt içi/yurt dışı durumuna göre seçiyoruz
    const priceKey = isYurtIci ? "satis_yi" : "satis_yd";

    // Ekipman listesi (kaset adet çarpanına sahip olduğu için onu ayrı hesaplayacağız)
    const singleEquipments = [
        "feedPumps",
        "recirculationPumps",
        "naoclDosingPumps",
        "naoclDosingTanks",
        "citricDosingPumps",
        "citricDosingTanks",
        "blowers"
    ];

    let toplamFiyat = 0;

    if (system) {
        // 1. Membran Kasetleri Hesabı (Adet çarpanı ile birlikte)
        if (system.membraneCassettes?.[priceKey]) {
            const kasetFiyati = parseFloat(system.membraneCassettes[priceKey]) || 0;
            const adet = parseInt(system.membraneCassettes.adet) || 1;
            toplamFiyat += kasetFiyati * adet;
        }

        // 2. Diğer Sabit Ekipmanların Hesabı
        for (const eq of singleEquipments) {
            if (system[eq]?.[priceKey]) {
                toplamFiyat += parseFloat(system[eq][priceKey]) || 0;
            }
        }
    }

    return {
        membransistemininTamami: Number(toplamFiyat.toFixed(2)),
    };
}

/**
 * 10. Diğer İşler Fiyatları (Montaj, Elektrik, Nakliye, Mühendislik, POD)
 */
export function resolveOthersPrices(formData, priceData) {
    return {
        konteyner: 13027,
        nakliyeTir: 0,
    };
}


export async function resolveMontajPrices(formData, priceData) {
    try {
        // 1️⃣ Ünite Adedini Hesapla (isLamella === false olan RBC adetleri)
        const yerlesimArray = formData?.planetDiskDetails?.tasarim?.yerlesimSiralanisi || [];
        const toplamRbcAdedi = yerlesimArray
            .filter(item => item && item.isLamella === false)
            .reduce((sum, item) => sum + (parseInt(item.adet) || 0), 0);

        // 2️⃣ Modül Durumlarını Kontrol Et (Filtrasyon ve Çamur)
        const modulesState = formData?.equipments?.modulesState || {};
        const isFiltrasyonChecked = modulesState.filtrasyon?.checked || false;
        const isCamurAktif = modulesState.sludgeDewatering?.checked || false;

        // 3️⃣ Koşullara Göre `grup_tipi` Belirle
        let hedefGrupTipi = "Standart";
        if (isFiltrasyonChecked && isCamurAktif) {
            hedefGrupTipi = "Filtrasyon_Camur";
        } else if (isFiltrasyonChecked) {
            hedefGrupTipi = "Filtrasyon";
        } else if (isCamurAktif) {
            hedefGrupTipi = "Camur";
        }

        // 4️⃣ Veritabanından taze işçilik maliyetlerini doğrudan burada çekiyoruz
        const response = await API.getUnitLaborCosts();
        const laborCostsData = response?.data || [];

        // 5️⃣ İlgili Gruba Ait Satırları Filtrele
        const grupSatirlari = laborCostsData.filter(
            (row) => row.grup_tipi === hedefGrupTipi
        );

        // Eğer o gruba ait veri yoksa fallback olarak 0 dönsün
        if (grupSatirlari.length === 0) {
            console.warn(`Veritabanında ${hedefGrupTipi} grubuna ait işçilik maliyeti bulunamadı.`);
            return { montajBedeli: 0 };
        }

        // 6️⃣ Tam Eşleşen Ünite Sayısını Ara
        let secilenSatir = grupSatirlari.find(
            (row) => Number(row.unite_sayisi) === toplamRbcAdedi
        );

        // 7️⃣ FALLBACK: Eğer tam ünite sayısı yoksa, o grubun EN BÜYÜK ünite sayılı satırını seç
        if (!secilenSatir) {
            secilenSatir = grupSatirlari.reduce((maxRow, currentSpec) => {
                return Number(currentSpec.unite_sayisi) > Number(maxRow.unite_sayisi) ? currentSpec : maxRow;
            }, grupSatirlari[0]);
            console.log(`Tam ünite sayısı (${toplamRbcAdedi}) bulunamadı. Maksimum ünite satırı seçildi.`);
        }

        // 8️⃣ Toplam Maliyeti Dönüştür ve Gönder
        const montajBedeli = secilenSatir ? Number(secilenSatir.toplamMaliyet) : 0;

        return {
            montajBedeli: montajBedeli
        };

    } catch (error) {
        console.error("resolveMontajPrices içerisinde hata oluştu, fallback değer dönüyor:", error);
        // API isteği veya herhangi bir şey patlarsa sistem tıkanmasın diye güvenli varsayılan değer
        return { montajBedeli: 0 };
    }
}