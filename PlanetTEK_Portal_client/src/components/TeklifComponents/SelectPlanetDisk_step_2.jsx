import React from "react";
import InputColumn from "./PlanetdiskColumns/InputColumn";
import DiskColumn from "./PlanetdiskColumns/DiskColumn";
import LamellaColumn from "./PlanetdiskColumns/LamellaColumn";

function SelectPlanetDisk({ data, updateData }) {
  // Kişi sayısı yöntemi seçildiğinde bilgi amaçlı toplam kişi sayısını da alalım
  const getToplamKisi = () => {
    if (data.hesapYontemi === "kisi" && data.kaynaklar) {
      return data.kaynaklar.reduce((acc, k) => acc + (Number(k.kisiSayisi) || 0), 0);
    }
    return 0;
  };

  return (
    <div className="container-fluid p-0" style={{ minHeight: "100vh" }}>

      {/* ÜST SATIR: 3'LÜ MODÜLER KOLON YAPISI */}
      <div className="row g-3 mb-4">
        <div className="col-xl-4 col-lg-6">
          <InputColumn data={data} updateData={updateData} />
        </div>
        <div className="col-xl-4 col-lg-6">
          <DiskColumn data={data} updateData={updateData} />
        </div>
        <div className="col-xl-4 col-lg-12">
          <LamellaColumn data={data} updateData={updateData} />
        </div>
      </div>

      {/* ALT SATIR: TEK BÜYÜK GENİŞ ÖZET PANELİ */}
      <div className="row">
        <div className="col-12">
          <div
            className="p-4 rounded border text-white"
            style={{
              backgroundColor: "#00874e",
              borderColor: "#1e293b",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
            }}
          >
            {/* Özet Başlığı */}
            <div className="d-flex align-items-center mb-3">
              <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "12px", letterSpacing: "1px" }}>
                <i className="bi bi-file-earmark-text me-2"></i>Sistem Konfigürasyon Özeti
              </span>
              <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
            </div>

            {/* Özet İçerik Alanı */}
            <div className="row g-3">

              {/* 1. Bölüm: Tasarıma Esas Giriş Parametreleri Özeti */}
              <div className="col-md-4 border-end border-white border-opacity-25">
                <h6 className="text-white text-opacity-75 small text-uppercase fw-bold mb-2">1. Tasarıma Esas Yükler</h6>
                <div className="small">

                  {/* Giriş Tipi ve Atıksu Tipi İkonlu Rozetleri */}
                  <div className="d-flex flex-wrap gap-1 mb-2">
                    <span className="badge bg-dark text-white fw-semibold">
                      {data.hesapYontemi === "hidrolik" ? "Doğrudan Hidrolik" : "Nüfus Eşdeğeri"}
                    </span>

                    {/* atiksutype durumuna göre dinamik Bootstrap ikonu ve renk alan rozet */}
                    <span className={`badge ${data.atiksutype === "endustriyel" ? "bg-warning text-dark" : "bg-info text-dark"} fw-bold d-inline-flex align-items-center`}>
                      {data.atiksutype === "endustriyel" ? (
                        <>
                          <i className="bi bi-building-gear me-1"></i>Endüstriyel
                        </>
                      ) : (
                        <>
                          <i className="bi bi-house-door-fill me-1"></i>Evsel
                        </>
                      )}
                    </span>
                  </div>

                  {/* Hangi yöntem seçilirse seçilsin, sistem motoruna giden asıl final dataları basıyoruz */}
                  <div className="bg-black bg-opacity-25 p-2 rounded mb-2">
                    <div>Nihai Debi: <strong className="fs-6 text-warning">{data.debi ?? 0} m³/gün</strong></div>
                    <div>Giriş BOİ: <strong className="fs-6 text-warning">{data.girisBoi ?? 0} mg/l</strong></div>
                  </div>

                  {data.hesapYontemi === "kisi" && (
                    <div className="text-white-50 mb-2" style={{ fontSize: "11px" }}>
                      Hesaplanan Toplam Nüfus: <strong>{getToplamKisi()} Kişi</strong>
                    </div>
                  )}

                  <div className="text-white-50 pt-1 border-top border-white border-opacity-10" style={{ fontSize: "11px" }}>
                    Sıcaklık: <strong>{data.sicaklik ?? "--"}°C</strong> | Çıkış BOİ Hedefi: <strong>{data.cikisBoi ?? "--"} mg/l</strong>
                  </div>
                </div>
              </div>

              {/* 2. Bölüm: PlanetDISK Özeti */}
              <div className="col-md-4 border-end border-white border-opacity-25">
                <h6 className="text-white text-opacity-75 small text-uppercase fw-bold mb-2">2. PlanetDISK Detayı</h6>
                <div className="small">
                  {data.secilenDiskTipi ? (
                    <div>
                      <div>Model: <strong>{data.secilenDiskTipi}</strong></div>
                      <div>Adet: <strong>{data.diskAdet || 0} Ünite</strong></div>
                    </div>
                  ) : (
                    <span className="text-white text-opacity-50 font-monospace" style={{ fontSize: "11px" }}>[ Disk seçimi henüz yapılmadı ]</span>
                  )}
                </div>
              </div>

              {/* 3. Bölüm: Lamella Özeti */}
              <div className="col-md-4">
                <h6 className="text-white text-opacity-75 small text-uppercase fw-bold mb-2">3. Lamella Detayı</h6>
                <div className="small">
                  {data.secilenLamellaModeli ? (
                    <div>
                      <div>Model: <strong>{data.secilenLamellaModeli}</strong></div>
                      <div>Yüzey Alanı: <strong>{data.lamellaAlan || 0} m²</strong></div>
                    </div>
                  ) : (
                    <span className="text-white text-opacity-50 font-monospace" style={{ fontSize: "11px" }}>[ Lamella seçimi henüz yapılmadı ]</span>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

    </div>
  );
}

export default SelectPlanetDisk;