import React, { useMemo, useEffect } from "react";
import YerlesimDetail from "./DiskColumnDetailes/YerlesimDetail";
import { useTeklifStore } from "../../../utils/teklifStore";

function DiskDetail() {
    // 1. ZUSTAND STORE ENTEGRASYONU
    const formData = useTeklifStore((state) => state.formData);
    const updateSection = useTeklifStore((state) => state.updateSection);

    const diskDetails = formData.planetDiskDetails || {};
    const aritmaParametreleri = diskDetails.tasarim?.aritmaParametreleri || {};
    const kademeParametreleri = diskDetails.tasarim?.kademeParametreleri || {};

    // Mevcut Değişkenler
    const Q = Number(diskDetails.debi) || 0;
    const girisBoi = Number(aritmaParametreleri.girisBoi) || 0;
    const cikisBoi = Number(aritmaParametreleri.cikisBoi) || 0;
    const giderimVerimi = parseFloat(String(aritmaParametreleri.giderimVerimi || 0).replace(',', '.'));
    const genelEmperik = parseFloat(String(aritmaParametreleri.emperik || 0).replace(',', '.'));

    // --- YENİ: NİTRİFİKASYON PARAMETRELERİ ---
    const nitrifikasyonDurumu = aritmaParametreleri.nitrifikasyon; // "nitrifikasyonVar" vb.
    const girisAmonyum = Number(aritmaParametreleri.girisAmonyum) || 0;
    const cikisAmonyum = Number(aritmaParametreleri.cikisAmonyum) || 0;
    const nitrifikasyonEmperik = parseFloat(String(aritmaParametreleri.nitrifikasyonEmperik || 0).replace(',', '.'));

    const kademelerListesi = kademeParametreleri.kademeler || [];

    const finalMetrekare = useMemo(() => {
        let sonuclar = [];

        // --- 1. ADIM: BOİ TABANLI HESAPLAMALAR (Mevcut Akış) ---
        if (kademelerListesi.length === 0) {
            const toplamHidrolikYük = (girisBoi * Q) / 1000;

            if (!isNaN(giderimVerimi) && !isNaN(genelEmperik) && genelEmperik !== 0) {
                const hesaplananDeger = Number((((toplamHidrolikYük * (1 - (giderimVerimi / 100))) * 1000) / genelEmperik).toFixed(2));

                sonuclar.push({
                    kademeAdi: "Genel Kademe",
                    alan: String(hesaplananDeger),
                    girisBoi: String(girisBoi),
                    cikisBoi: String(cikisBoi || ""),
                    emperik: String(genelEmperik)
                });
            }
        } else {
            kademelerListesi.forEach((kademe, index) => {
                let kademeSonucu = 0;

                if (index === 0) {
                    const toplamHidrolikYük = (girisBoi * Q) / 1000;
                    const emperikKatsayi = parseFloat(String(kademe.emperik || 0).replace(',', '.'));

                    if (!isNaN(giderimVerimi) && !isNaN(emperikKatsayi) && emperikKatsayi !== 0) {
                        kademeSonucu = ((toplamHidrolikYük * (1 - (giderimVerimi / 100))) * 1000) / emperikKatsayi;

                        sonuclar.push({
                            kademeAdi: `${index + 1}. Kademe`,
                            alan: kademeSonucu.toFixed(2),
                            girisBoi: String(girisBoi),
                            cikisBoi: String(kademe.boi),
                            emperik: String(kademe.emperik)
                        });
                    }
                } else {
                    const oncekiKademeBoi = kademelerListesi[index - 1].boi;
                    const toplamHidrolikYük = (Number(oncekiKademeBoi) * Q) / 1000;
                    const emperikKatsayi = parseFloat(String(kademe.emperik || 0).replace(',', '.'));

                    if (!isNaN(emperikKatsayi) && emperikKatsayi !== 0) {
                        kademeSonucu = (toplamHidrolikYük * 1000) / emperikKatsayi;

                        sonuclar.push({
                            kademeAdi: `${index + 1}. Kademe`,
                            alan: kademeSonucu.toFixed(2),
                            girisBoi: String(oncekiKademeBoi),
                            cikisBoi: String(kademe.boi),
                            emperik: String(kademe.emperik)
                        });
                    }
                }
            });

            // Döngü sonrası son kademe hesaplaması
            const sonKademeIndex = kademelerListesi.length - 1;
            const sonKademeBoi = kademelerListesi[sonKademeIndex].boi;
            const toplamHidrolikYük = (Number(sonKademeBoi) * Q) / 1000;

            if (!isNaN(genelEmperik) && genelEmperik !== 0) {
                const döngüSonrasıSonuc = (toplamHidrolikYük * 1000) / genelEmperik;

                sonuclar.push({
                    kademeAdi: "Son BOİ Kademesi",
                    alan: döngüSonrasıSonuc.toFixed(2),
                    girisBoi: String(sonKademeBoi),
                    cikisBoi: String(cikisBoi || ""),
                    emperik: String(genelEmperik)
                });
            }
        }

        // --- 2. ADIM: YENİ NİTRİFİKASYON HESABI (Eğer Varsa En Sona Ekle) ---
        if (nitrifikasyonDurumu === "nitrifikasyonVar") {
            // Nitrifikasyon Yükü = Giderilecek Toplam Amonyum Miktarı (kg/gün)
            // Formül: ((Giriş Amonyum - Çıkış Amonyum) * Q) / 1000
            const giderilenAmonyum = girisAmonyum - cikisAmonyum;

            if (giderilenAmonyum > 0 && !isNaN(nitrifikasyonEmperik) && nitrifikasyonEmperik !== 0) {
                const amonyumYükü = (giderilenAmonyum * Q) / 1000; // kg/gün
                
                // Gerekli Alan = (Amonyum Yükü * 1000) / Nitrifikasyon Empirik Katsayısı
                const nitrifikasyonAlani = (amonyumYükü * 1000) / nitrifikasyonEmperik;

                sonuclar.push({
                    kademeAdi: "Nitrifikasyon",
                    alan: nitrifikasyonAlani.toFixed(2),
                    girisAmonyum: String(girisAmonyum),
                    cikisAmonyum: String(cikisAmonyum),
                    emperik: String(nitrifikasyonEmperik),
                    isNitrifikasyon: true // İleride arayüzde ayırt etmek istersen diye flag
                });
            }
        }

        return sonuclar;
    }, [
        kademelerListesi, girisBoi, cikisBoi, Q, giderimVerimi, genelEmperik,
        nitrifikasyonDurumu, girisAmonyum, cikisAmonyum, nitrifikasyonEmperik
    ]);

    // FIX: Optimized useEffect preventing deep update loops
    useEffect(() => {
        if (!finalMetrekare || finalMetrekare.length === 0) return;

        const currentFinalMetrekare = diskDetails.tasarim?.finalMetrekare;
        if (JSON.stringify(currentFinalMetrekare) === JSON.stringify(finalMetrekare)) return;

        updateSection("planetDiskDetails", {
            tasarim: {
                ...diskDetails.tasarim,
                finalMetrekare: finalMetrekare 
            }
        });
    }, [finalMetrekare, updateSection]); 

    return (
        <div className="card border-0 text-white h-100" style={{ backgroundColor: "#1a1c1d", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
            <div className="card-body p-4 d-flex flex-column gap-3">
                <div className="d-flex align-items-center">
                    <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
                        PlanetDISK Yerleşim
                    </span>
                    <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
                </div>

                <div className="p-2 rounded mb-3" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff" }}>
                    <YerlesimDetail />
                </div>
            </div>
        </div>
    );
}

export default DiskDetail;