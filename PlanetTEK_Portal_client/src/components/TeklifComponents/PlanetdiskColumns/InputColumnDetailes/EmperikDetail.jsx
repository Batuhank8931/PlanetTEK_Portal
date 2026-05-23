import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

// Chart.js bileşenlerini kaydediyoruz
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Kılavuz Çizgileri Çizen Özel Eklenti (Plugin)
const kilavuzCizgisiPlugin = {
  id: "kilavuzCizgisi",
  afterDatasetsDraw(chart) {
    const { ctx, scales: { x, y }, data } = chart;

    // "Mevcut Durumunuz" dataset'ini buluyoruz (Genellikle son dataset)
    const mevcutDurumDatasetIndex = data.datasets.findIndex(
      (ds) => ds.label === "Mevcut Durumunuz"
    );

    if (mevcutDurumDatasetIndex === -1) return;

    const meta = chart.getDatasetMeta(mevcutDurumDatasetIndex);
    // Nokta gizliyse veya çizilemiyorsa işlem yapma
    if (!meta.data || meta.data.length === 0 || meta.hidden) return;

    const nokta = meta.data[0];
    const xPos = nokta.x;
    const yPos = nokta.y;

    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(239, 68, 68, 0.7)"; // Kırmızı noktanın renginde (opaklığı biraz azaltılmış)
    ctx.setLineDash([4, 4]); // Kesikli çizgi efekti [çizgi boyu, boşluk boyu]

    // X eksenine inen dikey çizgi (Noktadan aşağıya, X ekseninin başladığı yere kadar)
    ctx.moveTo(xPos, yPos);
    ctx.lineTo(xPos, y.bottom);

    // Y eksenine uzanan yatay çizgi (Noktadan sola, Y ekseninin başladığı yere kadar)
    ctx.moveTo(xPos, yPos);
    ctx.lineTo(x.left, yPos);

    ctx.stroke();
    ctx.restore();
  }
};

function EmperikDetail({ isOpen, onClose, data, activeKademeId }) {
  if (!isOpen) return null;



  // Gelen verileri alıyoruz ve sayıya dönüştürüyoruz
  const sicaklik = Number(data?.sicaklik) || 0;
  let cikisBoi = 0

  if (activeKademeId === "cikis") {
    cikisBoi = Number(data?.cikisBoi) || 0;
  } else {
    const hedefKademe = data?.kademeler?.find(kademe => String(kademe.id) === String(activeKademeId));
    cikisBoi = hedefKademe ? hedefKademe.boi : 0;
  }


  // 1. GRAFİK VERİLERİ (Görseldeki eğrilerin koordinat haritası)
  const hatlar = {
    15: [{ x: 4, y: 12 }, { x: 10, y: 22 }, { x: 15, y: 32 }],
    20: [{ x: 7, y: 12 }, { x: 16, y: 22 }, { x: 20, y: 32 }],
    25: [{ x: 10, y: 12 }, { x: 20, y: 22 }, { x: 30, y: 32 }],
    30: [{ x: 12, y: 12 }, { x: 24, y: 22 }, { x: 36, y: 32 }],
    40: [{ x: 16, y: 12 }, { x: 29, y: 22 }, { x: 39, y: 32 }],
    45: [{ x: 20, y: 12 }, { x: 34, y: 22 }, { x: 44, y: 32 }],
  };

  // 2. KULLANICININ NOKTASINI HESAPLAMA (Enterpolasyon)
  const hesaplaKullaniciX = (temp, boi) => {
    const boiAnahtarlari = [15, 20, 25, 30, 40, 45];

    let altBoi = boiAnahtarlari[0];
    let ustBoi = boiAnahtarlari[boiAnahtarlari.length - 1];

    for (let i = 0; i < boiAnahtarlari.length - 1; i++) {
      if (boi >= boiAnahtarlari[i] && boi <= boiAnahtarlari[i + 1]) {
        altBoi = boiAnahtarlari[i];
        ustBoi = boiAnahtarlari[i + 1];
        break;
      }
    }

    const egrideXBul = (hatEgrisi, t) => {
      if (t <= 12) return hatEgrisi[0].x;
      if (t >= 32) return hatEgrisi[2].x;
      const p1 = t <= 22 ? hatEgrisi[0] : hatEgrisi[1];
      const p2 = t <= 22 ? hatEgrisi[1] : hatEgrisi[2];
      return p1.x + ((t - p1.y) * (p2.x - p1.x)) / (p2.y - p1.y);
    };

    const altX = egrideXBul(hatlar[altBoi], temp);
    const ustX = egrideXBul(hatlar[ustBoi], temp);

    if (ustBoi === altBoi) return altX;
    const oran = (boi - altBoi) / (ustBoi - altBoi);
    return altX + oran * (ustX - altX);
  };

  const kullaniciX = hesaplaKullaniciX(sicaklik, cikisBoi);

  // 3. CHART.JS DATASET YAPILANDIRMASI
  const chartData = {
    datasets: [
      { label: "15 mg/L", data: hatlar[15], borderColor: "#a855f7", borderWidth: 2, pointRadius: 3, tension: 0.1 },
      { label: "20 mg/L", data: hatlar[20], borderColor: "#22c55e", borderWidth: 2, pointRadius: 3, tension: 0.1 },
      { label: "25 mg/L", data: hatlar[25], borderColor: "#eab308", borderWidth: 2, pointRadius: 3, tension: 0.1 },
      { label: "30 mg/L", data: hatlar[30], borderColor: "#06b6d4", borderWidth: 2, pointRadius: 3, tension: 0.1 },
      { label: "40 mg/L", data: hatlar[40], borderColor: "#ec4899", borderWidth: 2, pointRadius: 3, tension: 0.1 },
      { label: "45 mg/L", data: hatlar[45], borderColor: "#3b82f6", borderWidth: 2, pointRadius: 3, tension: 0.1 },
      {
        label: "Mevcut Durumunuz",
        data: [{ x: kullaniciX, y: sicaklik }],
        borderColor: "#ef4444",
        backgroundColor: "#ef4444",
        pointRadius: 8,
        pointHoverRadius: 10,
        showLine: false,
      },
    ],
  };

  // 4. CHART.JS GRAFİK AYARLARI
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        title: { display: true, text: "Yükleme Oranı (gr/m²/gün)", color: "#94a3b8", font: { size: 11 } },
        min: 0,
        max: 46,
        ticks: { stepSize: 2, color: "#94a3b8" },
        grid: { color: "rgba(51, 65, 85, 0.4)" },
      },
      y: {
        title: { display: true, text: "Sıcaklık (°C)", color: "#94a3b8", font: { size: 11 } },
        min: 0,
        max: 40,
        ticks: { stepSize: 5, color: "#94a3b8" },
        grid: { color: "rgba(51, 65, 85, 0.4)" },
      },
    },
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#f8fafc", boxWidth: 12, font: { size: 10 } },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (context.dataset.label === "Mevcut Durumunuz") {
              return `Konumunuz: ${context.raw.x.toFixed(2)} gr/m²/gün, ${context.raw.y}°C`;
            }
            return `${context.dataset.label}: ${context.raw.x} gr/m²/gün`;
          },
        },
      },
    },
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)", zIndex: 1050, backdropFilter: "blur(4px)" }}
    >
      <div
        className="card text-white border-0"
        style={{
          backgroundColor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "16px",
          width: "95%",
          maxWidth: "750px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.7)"
        }}
      >
        {/* Başlık */}
        <div className="card-header border-0 d-flex justify-content-between align-items-center pt-3 px-4 pb-0 bg-transparent">
          <span className="fw-bold text-uppercase" style={{ fontSize: "13px", letterSpacing: "0.5px", color: "#38bdf8" }}>
            Emperik Katsayı Hesaplama Grafiği
          </span>
          <button
            type="button"
            className="btn-close btn-close-white p-0 m-0"
            style={{ fontSize: "12px", boxShadow: "none" }}
            onClick={onClose}
          ></button>
        </div>

        <hr className="my-2 opacity-10" />

        {/* İçerik Alanı */}
        <div className="card-body px-4 py-2" style={{ fontSize: "13px" }}>

          {/* Üst Bilgi Kartları */}
          <div className="row g-2 mb-3">
            <div className="col-6">
              <div className="p-2 rounded bg-dark bg-opacity-30 border border-secondary border-opacity-10 text-center">
                <span className="text-white-50 d-block small">Girdi Sıcaklık:</span>
                <span className="fw-bold text-info fs-5">{sicaklik} °C</span>
              </div>
            </div>
            <div className="col-6">
              <div className="p-2 rounded bg-dark bg-opacity-30 border border-secondary border-opacity-10 text-center">
                <span className="text-white-50 d-block small">Çıkış BOİ:</span>
                <span className="fw-bold text-success fs-5">{cikisBoi} mg/L</span>
              </div>
            </div>
          </div>

          {/* Grafik Alanı */}
          <div className="p-3 rounded bg-dark bg-opacity-20 border border-secondary border-opacity-10" style={{ height: "320px", position: "relative" }}>
            {/* plugins dizisine yazdığımız eklentiyi paslıyoruz */}
            <Line data={chartData} options={chartOptions} plugins={[kilavuzCizgisiPlugin]} />
          </div>

          {/* Dinamik Sonuç Özeti */}
          <div className="mt-3 p-2 rounded text-center" style={{ backgroundColor: "rgba(56, 189, 248, 0.08)", border: "1px dashed rgba(56, 189, 248, 0.3)", fontSize: "12px" }}>
            <span className="text-white-50">Grafikten Okunan Disk Yükleme Oranı: </span>
            <strong className="text-warning">{kullaniciX.toFixed(2)} gr/m²/gün</strong>
          </div>
        </div>

        {/* Alt Kısım */}
        <div className="card-footer border-0 d-flex justify-content-end px-4 pb-3 pt-2 bg-transparent">
          <button
            type="button"
            className="btn btn-sm px-4 text-white border-0"
            style={{ backgroundColor: "#475569", fontSize: "12px", borderRadius: "6px" }}
            onClick={onClose}
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
}

export default EmperikDetail;