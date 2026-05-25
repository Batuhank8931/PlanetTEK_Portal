import React, { useEffect, useMemo } from "react";
import YerlesimDetail from "./DiskColumnDetailes/YerlesimDetail";

function DiskDetail({ data = {}, updateData }) {
	// 1. DERİN VERİ MİMARİSİNDEN GÜVENLİ OKUMA YAPILMASI
	const aritmaParametreleri = data?.tasarim?.aritmaParametreleri || {};
	const kademeParametreleri = data?.tasarim?.kademeParametreleri || {};

	const Q = Number(data?.debi) || 0; // Debi global kökten geliyor
	const girisBoi = Number(aritmaParametreleri.girisBoi) || 0;
	const cikisBoi = Number(aritmaParametreleri.cikisBoi) || 0;
	const giderimVerimi = parseFloat(String(aritmaParametreleri.giderimVerimi || 0).replace(',', '.'));
	const genelEmperik = parseFloat(String(aritmaParametreleri.emperik || 0).replace(',', '.'));

	const kademelerListesi = kademeParametreleri.kademeler || [];

	// 2. HESAPLAMA MANTIĞININ MEMOIZE EDİLMESİ
	// Her render'da gereksiz array referansı üretmemek ve useEffect'i tetiklememek için useMemo kullanıyoruz
	const finalMetrekare = useMemo(() => {
		let sonuclar = [];

		if (kademelerListesi.length === 0) {
			const toplamHidrolikYük = (girisBoi * Q) / 1000;

			if (!isNaN(giderimVerimi) && !isNaN(genelEmperik) && genelEmperik !== 0) {
				const hesaplananDeger = Number((((toplamHidrolikYük * (1 - (giderimVerimi / 100))) * 1000) / genelEmperik).toFixed(2));

				sonuclar.push({
					alan: String(hesaplananDeger),
					girisBoi: String(girisBoi),
					cikisBoi: String(cikisBoi || ""),
					emperik: String(genelEmperik)
				});
			} else {
				console.error("Hesaplama başarısız: Girdi değerleri geçersiz veya katsayı 0.");
			}
		} else {
			let kumulatifToplam = 0;

			kademelerListesi.forEach((kademe, index) => {
				let kademeSonucu = 0;

				if (index === 0) {
					const toplamHidrolikYük = (girisBoi * Q) / 1000;
					const emperikKatsayi = parseFloat(String(kademe.emperik || 0).replace(',', '.'));

					if (!isNaN(giderimVerimi) && !isNaN(emperikKatsayi) && emperikKatsayi !== 0) {
						kademeSonucu = ((toplamHidrolikYük * (1 - (giderimVerimi / 100))) * 1000) / emperikKatsayi;

						sonuclar.push({
							alan: kademeSonucu.toFixed(2),
							girisBoi: String(girisBoi),
							cikisBoi: String(kademe.boi),
							emperik: String(kademe.emperik)
						});
					} else {
						console.error("Hesaplama başarısız: Girdi değerleri geçersiz veya katsayı 0.");
					}
				} else {
					const oncekiKademeBoi = kademelerListesi[index - 1].boi;
					const toplamHidrolikYük = (Number(oncekiKademeBoi) * Q) / 1000;
					const emperikKatsayi = parseFloat(String(kademe.emperik || 0).replace(',', '.'));

					if (!isNaN(emperikKatsayi) && emperikKatsayi !== 0) {
						kademeSonucu = (toplamHidrolikYük * 1000) / emperikKatsayi;

						sonuclar.push({
							alan: kademeSonucu.toFixed(2),
							girisBoi: String(oncekiKademeBoi),
							cikisBoi: String(kademe.boi),
							emperik: String(kademe.emperik)
						});
					} else {
						console.error("Hesaplama başarısız: Girdi değerleri geçersiz veya katsayı 0.");
					}
				}
			});

			// Döngü sonrası son bir hesaplama
			const sonKademeIndex = kademelerListesi.length - 1;
			const sonKademeBoi = kademelerListesi[sonKademeIndex].boi;
			const toplamHidrolikYük = (Number(sonKademeBoi) * Q) / 1000;

			if (!isNaN(genelEmperik) && genelEmperik !== 0) {
				const döngüSonrasıSonuc = (toplamHidrolikYük * 1000) / genelEmperik;
				kumulatifToplam += döngüSonrasıSonuc;

				sonuclar.push({
					alan: döngüSonrasıSonuc.toFixed(2),
					girisBoi: String(sonKademeBoi),
					cikisBoi: String(cikisBoi || ""),
					emperik: String(genelEmperik)
				});
			} else {
				console.error("Hesaplama başarısız: Girdi değerleri geçersiz veya katsayı 0.");
			}
		}

		return sonuclar;
	}, [kademelerListesi, girisBoi, cikisBoi, Q, giderimVerimi, genelEmperik]);

	// 3. EFFECT İLE DEEP STATE GÜNCELLEMESİ (data.tasarim.kademeParametreleri.diskAlanlari)
	// DiskDetail.jsx içerisindeki ilgili Effect

	useEffect(() => {
		const mevcutAlanlarStr = JSON.stringify(data?.tasarim?.kademeParametreleri?.diskAlanlari || []);
		const yeniAlanlarStr = JSON.stringify(finalMetrekare);

		if (mevcutAlanlarStr !== yeniAlanlarStr && updateData) { // <-- Büyük D
			updateData({ // <-- Büyük D
				...data,
				tasarim: {
					...(data?.tasarim || {}),
					kademeParametreleri: {
						...(data?.tasarim?.kademeParametreleri || {}),
						diskAlanlari: finalMetrekare
					}
				}
			});
		}
	}, [finalMetrekare, data?.tasarim?.kademeParametreleri?.diskAlanlari, updateData]); // <-- Büyük D

	return (
		<div className="card border-0 text-white h-100" style={{ backgroundColor: "#1a1c1d", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
			<div className="card-body p-4 d-flex flex-column gap-3">

				{/* 1. BAŞLIK BÖLÜMÜ */}
				<div className="d-flex align-items-center">
					<span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
						4. PlanetDISK Yerleşim
					</span>
					<div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
				</div>

				{/* 2. YERLEŞİM DETAY PANELİ */}
				<div className="p-2 rounded mb-3" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff" }}>
					<YerlesimDetail
						data={data}
						finalMetrekare={finalMetrekare}
						updatedata={updateData}
					/>
				</div>

			</div>
		</div>
	);
}

export default DiskDetail;