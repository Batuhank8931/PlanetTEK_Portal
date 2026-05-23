import React, { useEffect } from "react";
import YerlesimDetail from "./DiskColumnDetailes/YerlesimDetail";


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

			// Obje olarak ekliyoruz
			finalMetrekare.push({
				alan: String(hesaplananDeger),
				girisBoi: String(data.girisBoi),
				cikisBoi: String(data.cikisBoi || ""), // Eğer datada hedef çıkış boi varsa buraya gelebilir
				emperik: String(data.emperik)
			});
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

					finalMetrekare.push({
						alan: kademeSonucu.toFixed(2),
						girisBoi: String(data.girisBoi),   // İlk kademenin girişi ana giriş BOİ'dir
						cikisBoi: String(kademe.boi),      // İlk kademenin çıkışı kendi BOİ değeridir
						emperik: String(kademe.emperik)
					});
				} else {
					console.error("Hesaplama başarısız: Girdi değerleri geçersiz veya katsayı 0.");
				}
			} else {
				const oncekiKademeBoi = data.kademeler[index - 1].boi;
				const toplamHidrolikYük = (Number(oncekiKademeBoi) * Number(data.debi)) / 1000;
				const emperikKatsayi = parseFloat(String(kademe.emperik).replace(',', '.'));

				if (!isNaN(emperikKatsayi) && emperikKatsayi !== 0) {
					kademeSonucu = (toplamHidrolikYük * 1000) / emperikKatsayi;

					finalMetrekare.push({
						alan: kademeSonucu.toFixed(2),
						girisBoi: String(oncekiKademeBoi), // Bu kademenin girişi, bir önceki kademenin çıkışıdır
						cikisBoi: String(kademe.boi),      // Çıkışı ise kendi BOİ değeridir
						emperik: String(kademe.emperik)
					});
				} else {
					console.error("Hesaplama başarısız: Girdi değerleri geçersiz veya katsayı 0.");
				}
			}
		});

		// Döngü sonrası son bir hesaplama yapıyordunuz, onu da objeye çevirelim:
		const sonKademeIndex = data.kademeler.length - 1;
		const sonKademeBoi = data.kademeler[sonKademeIndex].boi;
		const toplamHidrolikYük = (Number(sonKademeBoi) * Number(data.debi)) / 1000;
		const emperikKatsayi = parseFloat(String(data.emperik).replace(',', '.'));

		if (!isNaN(emperikKatsayi) && emperikKatsayi !== 0) {
			const döngüSonrasıSonuc = (toplamHidrolikYük * 1000) / emperikKatsayi;
			kumulatifToplam += döngüSonrasıSonuc;

			finalMetrekare.push({
				alan: döngüSonrasıSonuc.toFixed(2),
				girisBoi: String(sonKademeBoi),
				cikisBoi: String(data.cikisBoi || ""), // Genel çıkış BOİ hedefiniz varsa
				emperik: String(data.emperik)
			});
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
		<div className="card border-0 text-white h-100" style={{ backgroundColor: "#1a1c1d", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
			<div className="card-body p-4 d-flex flex-column gap-3">
				{/* 1. BAŞLIK BÖLÜMÜ */}
				<div className="d-flex align-items-center">
					<span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
						4. PlanetDISK Yerleşim
					</span>
					<div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
				</div>
				<div className="p-2 rounded mb-3" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff" }}>
					<YerlesimDetail
						data={data}
						finalMetrekare={finalMetrekare}
						updatedata={updatedata} />
				</div>
			</div>
		</div>
	);
}

export default DiskDetail;