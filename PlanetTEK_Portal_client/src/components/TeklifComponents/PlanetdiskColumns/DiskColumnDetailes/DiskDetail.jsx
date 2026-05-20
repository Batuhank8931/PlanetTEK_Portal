import React, { useEffect } from "react";
import YerlesimDetail from "./YerlesimDetail";


function hesaplaRBCYerlesim(gerekliAlanlar, maxDisk, minDisk, diskTipi) {
	// 1. Disk Çapı ve Çift Yüzey Alanı Hesaplama (m²)
	const cap = diskTipi === "MX" ? 2.05 : 1.35;
	const r = cap / 2;
	// Disklerin ön ve arka yüzü suya temas ettiği için x2 yapıyoruz
	const birDiskAlani = 2 * Math.PI * Math.pow(r, 2);

	// Her aşamanın sonuçlarını tutacağımız array
	const kademeler = [];

	gerekliAlanlar.forEach((alanStr, index) => {
		const hedefAlan = parseFloat(alanStr);
		// Bu aşama için toplam kaç adet disk gerekiyor?
		const toplamGerekliDisk = Math.ceil(hedefalan / birDiskAlani);

		// Bu diskleri taşımak için minimum kaç şaft (makine) lazım?
		let saftSayisi = Math.ceil(toplamGerekliDisk / maxDisk);

		// Eğer gereken disk sayısı minDisk'ten azsa, yine de 1 şaft olmalı ve minDisk kadar konmalı
		if (saftSayisi === 0) saftSayisi = 1;

		// Şaft başına düşen diskleri dengeli dağıtalım
		let kalanDisk = Math.max(toplamGerekliDisk, saftSayisi * minDisk);
		const saftlar = [];

		for (let i = 0; i < saftSayisi; i++) {
			// Kalan diskleri şaftlara eşit bölüştür
			const safttakiDisk = Math.ceil(kalanDisk / (saftSayisi - i));
			saftlar.push({
				makineNo: i + 1,
				diskAdedi: safttakiDisk,
				saglananAlan: parseFloat((safttakiDisk * birDiskAlani).toFixed(2))
			});
			kalanDisk -= safttakiDisk;
		}

		const kademeToplamAlan = saftlar.reduce((sum, s) => sum + s.saglananAlan, 0);

		kademeler.push({
			asamaNo: index + 1,
			hedefAlan: hedefAlan,
			toplamAlan: parseFloat(kademeToplamAlan.toFixed(2)),
			toplamDisk: saftlar.reduce((sum, s) => sum + s.diskAdedi, 0),
			saftlar: saftlar
		});
	});

	return kademeler;
}

function DiskDetail({ data, updatedata }) {
	// Hesaplama mantığını useEffect içinde kontrol etmek için değişkeni burada tanımlıyoruz
	let finalMetrekare = [];

	if (!data.kademeler || data.kademeler.length === 0) {
		finalMetrekare = [];
		const toplamHidrolikYük = (Number(data.girisBoi) * Number(data.debi)) / 1000;
		const giderimVerimi = parseFloat(String(data.giderimVerimi).replace(',', '.'));
		const emperikKatsayi = parseFloat(String(data.emperik).replace(',', '.'));

		if (!isNaN(giderimVerimi) && !isNaN(emperikKatsayi) && emperikKatsayi !== 0) {
			const hesaplananDeger = Number((((toplamHidrolikYük * (1 - (giderimVerimi / 100))) * 1000) / emperikKatsayi).toFixed(2));
			finalMetrekare.push(hesaplananDeger);
		} else {
			console.error("Hesaplama başarısız: Girdi değerleri geçersiz veya katsayı 0.");
		}
	} else {
		finalMetrekare = [];
		let kumulatifToplam = 0;

		data.kademeler.forEach((kademe, index) => {
			let kademeSonucu = 0;

			if (index === 0) {
				const toplamHidrolikYük = (Number(data.girisBoi) * Number(data.debi)) / 1000;
				const giderimVerimi = parseFloat(String(data.giderimVerimi).replace(',', '.'));
				const emperikKatsayi = parseFloat(String(kademe.emperik).replace(',', '.'));

				if (!isNaN(giderimVerimi) && !isNaN(emperikKatsayi) && emperikKatsayi !== 0) {
					kademeSonucu = ((toplamHidrolikYük * (1 - (giderimVerimi / 100))) * 1000) / emperikKatsayi;
				} else {
					console.error("Hesaplama başarısız: Girdi değerleri geçersiz veya katsayı 0.");
				}
				finalMetrekare.push(Number(kademeSonucu.toFixed(2)));
			} else {
				const girisBoi = data.kademeler[index - 1].boi;
				const toplamHidrolikYük = (Number(girisBoi) * Number(data.debi)) / 1000;
				const emperikKatsayi = parseFloat(String(kademe.emperik).replace(',', '.'));

				if (!isNaN(emperikKatsayi) && emperikKatsayi !== 0) {
					kademeSonucu = (toplamHidrolikYük * 1000) / emperikKatsayi;
				} else {
					console.error("Hesaplama başarısız: Girdi değerleri geçersiz veya katsayı 0.");
				}
				finalMetrekare.push(Number(kademeSonucu.toFixed(2)));
			}
		});

		const sonKademeIndex = data.kademeler.length - 1;
		const girisBoi = data.kademeler[sonKademeIndex].boi;
		const toplamHidrolikYük = (Number(girisBoi) * Number(data.debi)) / 1000;
		const emperikKatsayi = parseFloat(String(data.emperik).replace(',', '.'));

		if (!isNaN(emperikKatsayi) && emperikKatsayi !== 0) {
			const döngüSonrasıSonuc = (toplamHidrolikYük * 1000) / emperikKatsayi;
			kumulatifToplam += döngüSonrasıSonuc;
			finalMetrekare.push(Number(döngüSonrasıSonuc.toFixed(2)));
		} else {
			console.error("Hesaplama başarısız: Girdi değerleri geçersiz veya katsayı 0.");
		}
	}

	useEffect(() => {
		const mevcutAlanlarStr = JSON.stringify(data.diskAlanlari);
		const yeniAlanlarStr = JSON.stringify(finalMetrekare);

		if (mevcutAlanlarStr !== yeniAlanlarStr && updatedata) {
			updatedata({
				...data,
				diskAlanlari: finalMetrekare
			});
		}
	}, [finalMetrekare, data, updatedata]);

	return (
		<div className="my-3 p-2 rounded mb-3" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff" }}>
			<YerlesimDetail
				data={data}
				finalMetrekare={finalMetrekare} />
		</div>
	);
}

export default DiskDetail;