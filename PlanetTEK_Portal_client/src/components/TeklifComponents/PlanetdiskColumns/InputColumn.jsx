import React, { useEffect } from "react";
import hesaplaDiskKatsayisiDetayli from "../../../utils/hesaplaDiskKatsayisiDetayli";

function InputColumn({ data, updateData }) {
  useEffect(() => {
    const updatedFields = {};

    if (data.cikisBoi === undefined) updatedFields.cikisBoi = 40;
    if (data.sicaklik === undefined) updatedFields.sicaklik = 19;
    if (data.maxDiskAdedi === undefined) updatedFields.maxDiskAdedi = 135;
    if (data.minDiskAdedi === undefined) updatedFields.minDiskAdedi = 100;
    if (data.giderimVerimi === undefined) updatedFields.giderimVerimi = 33;
    if (data.secilenDiskTipi === undefined) updatedFields.secilenDiskTipi = "MX";
    if (data.emperik === undefined) updatedFields.emperik = 22.00;
    if (!data.hesapYontemi) updatedFields.hesapYontemi = "hidrolik";
    if (!data.atiksutype) updatedFields.atiksutype = "evsel";
    if (data.girisBoi === undefined) updatedFields.girisBoi = 350;
    if (data.debi === undefined) updatedFields.debi = 70;

    if (!data.kaynaklar || data.kaynaklar.length === 0) {
      updatedFields.kaynaklar = [
        { id: Date.now(), ad: "1. KAYNAK", kisiSayisi: 3000, organikYuk: 60, hidrolikYuk: 200 }
      ];
    }

    if (Object.keys(updatedFields).length > 0) {
      updateData({ ...data, ...updatedFields });
    }
  }, []);

  const recalculateNihaiDegerler = (kaynaklarListesi) => {
    const toplamLitreGun = kaynaklarListesi.reduce((acc, k) => acc + (Number(k.kisiSayisi || 0) * Number(k.hidrolikYuk || 0)), 0);
    const nihaiDebi = toplamLitreGun / 1000;
    const toplamGramBoiGun = kaynaklarListesi.reduce((acc, k) => acc + (Number(k.kisiSayisi || 0) * Number(k.organikYuk || 0)), 0);
    const nihaiGirisBoi = nihaiDebi > 0 ? Math.round((toplamGramBoiGun / nihaiDebi)) : 0;
    return { nihaiDebi, nihaiGirisBoi };
  };

  const handleChange = (e) => {
    const rawValue = e.target.value;
    const val = rawValue === "" ? 0 : (!isNaN(Number(rawValue)) ? Number(rawValue) : rawValue);
    const name = e.target.name;

    const updatedData = {
      ...data,
      [name]: val
    };

    if (name === "sicaklik" || name === "cikisBoi") {
      const yeniEmperik = hesaplaDiskKatsayisiDetayli(
        Number(updatedData.sicaklik ?? 19),
        Number(updatedData.cikisBoi ?? 40)
      );
      updatedData.emperik = parseFloat(yeniEmperik) || 0;
    }

    updateData(updatedData);
  };

  const handleTypeToggle = (e) => {
    const selectedType = e.target.checked ? "endustriyel" : "evsel";
    updateData({ ...data, atiksutype: selectedType });
  };

  const handleYontemChange = (yontem) => {
    if (yontem === "hidrolik") {
      updateData({ ...data, hesapYontemi: yontem, debi: 70, girisBoi: 350 });
    } else {
      const { nihaiDebi, nihaiGirisBoi } = recalculateNihaiDegerler(data.kaynaklar || []);
      updateData({ ...data, hesapYontemi: yontem, debi: nihaiDebi, girisBoi: nihaiGirisBoi });
    }
  };

  const handleAddKaynak = () => {
    const yeniKaynakNo = (data.kaynaklar?.length || 0) + 1;
    const yeniKaynak = { id: Date.now(), ad: `${yeniKaynakNo}. KAYNAK`, kisiSayisi: 0, organikYuk: 20, hidrolikYuk: 50 };
    const yeniKaynaklar = [...(data.kaynaklar || []), yeniKaynak];
    const { nihaiDebi, nihaiGirisBoi } = recalculateNihaiDegerler(yeniKaynaklar);
    updateData({ ...data, kaynaklar: yeniKaynaklar, debi: nihaiDebi, girisBoi: nihaiGirisBoi });
  };

  const handleRemoveKaynak = (id) => {
    if (data.kaynaklar.length <= 1) return;
    const filtrelenmiş = data.kaynaklar.filter((k) => k.id !== id);
    const yeniKaynaklar = filtrelenmiş.map((k, index) => ({ ...k, ad: `${index + 1}. KAYNAK` }));
    const { nihaiDebi, nihaiGirisBoi } = recalculateNihaiDegerler(yeniKaynaklar);
    updateData({ ...data, kaynaklar: yeniKaynaklar, debi: nihaiDebi, border: "1px solid rgba(255,255,255,0.05)" });
  };

  const handleKaynakChange = (id, field, value) => {
    const yeniKaynaklar = data.kaynaklar.map((k) => {
      if (k.id === id) {
        const val = value === "" ? 0 : Number(value) || 0;
        return { ...k, [field]: val };
      }
      return k;
    });
    const { nihaiDebi, nihaiGirisBoi } = recalculateNihaiDegerler(yeniKaynaklar);
    updateData({ ...data, kaynaklar: yeniKaynaklar, debi: nihaiDebi, girisBoi: nihaiGirisBoi });
  };

  return (
    <div className="card border-0 text-white h-100" style={{ backgroundColor: "#1a1c1d", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
      {/* gap-3 eklenerek tüm elemanların alt alta sıralı ve dengeli durması sağlandı */}
      <div className="card-body p-4 d-flex flex-column gap-3">

        {/* 1. BAŞLIK BÖLÜMÜ */}
        <div className="d-flex align-items-center">
          <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
            1. Arıtma Parametreleri
          </span>
          <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
        </div>

        {/* 2. YÖNTEM SEÇİMİ */}
        <div>
          <div className="btn-group w-100" role="group" style={{ backgroundColor: "#1e293b", padding: "4px", borderRadius: "8px" }}>
            <button
              type="button"
              className="btn btn-sm border-0 py-1.5 fw-medium"
              style={{
                borderRadius: "6px",
                fontSize: "12px",
                backgroundColor: data.hesapYontemi === "hidrolik" ? "#ef4444" : "transparent",
                color: "#ffffff"
              }}
              onClick={() => handleYontemChange("hidrolik")}
            >
              <i className="bi bi-droplet-fill me-1.5"></i>Hidrolik Yük
            </button>
            <button
              type="button"
              className="btn btn-sm border-0 py-1.5 fw-medium"
              style={{
                borderRadius: "6px",
                fontSize: "12px",
                backgroundColor: data.hesapYontemi === "kisi" ? "#10b981" : "transparent",
                color: "#ffffff"
              }}
              onClick={() => handleYontemChange("kisi")}
            >
              <i className="bi bi-people-fill me-1.5"></i>Kişi Sayısı
            </button>
          </div>
        </div>

        {/* 3. DİNAMİK PANEL ALANI */}
        <div className="rounded p-2.5" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          {data.hesapYontemi === "hidrolik" ? (
            <div className="row g-2 p-1">
              <div className="col-6">
                <label className="text-white-50 mb-1" style={{ fontSize: "11px" }}>Giriş BOİ (mg/l)</label>
                <input
                  type="number"
                  name="girisBoi"
                  value={data.girisBoi === 0 ? "" : (data.girisBoi ?? "")}
                  onChange={handleChange}
                  className="form-control form-control-sm text-white fw-bold border-0 text-center"
                  style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", borderRadius: "6px" }}
                />
              </div>
              <div className="col-6">
                <label className="text-white-50 mb-1" style={{ fontSize: "11px" }}>Debi (m³/gün)</label>
                <input
                  type="number"
                  name="debi"
                  value={data.debi === 0 ? "" : (data.debi ?? "")}
                  onChange={handleChange}
                  className="form-control form-control-sm text-white fw-bold border-0 text-center"
                  style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", borderRadius: "6px" }}
                />
              </div>
            </div>
          ) : (
            <div className="p-1">
              <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                <span className="text-white-50 fw-medium" style={{ fontSize: "11px" }}>
                  <i className="bi bi-layers-half me-1"></i> Atıksu Kaynakları
                </span>
                <button type="button" onClick={handleAddKaynak} className="btn btn-sm py-0.5 px-2 fw-semibold text-white border-0" style={{ backgroundColor: "#059669", fontSize: "10px", borderRadius: "4px" }}>
                  + Kaynak Ekle
                </button>
              </div>
              <div style={{ maxHeight: "200px", overflowY: "auto", paddingRight: "2px" }}>
                {data.kaynaklar?.map((kaynak) => (
                  <div key={kaynak.id} className="p-2 mb-2 rounded border" style={{ backgroundColor: "#0f172a", borderColor: "#334155" }}>
                    <div className="d-flex justify-content-between align-items-center mb-1.5">
                      <span className="fw-bold text-success" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>{kaynak.ad}</span>
                      {data.kaynaklar.length > 1 && (
                        <button type="button" className="btn-close btn-close-white" style={{ transform: "scale(0.65)", padding: "0" }} onClick={() => handleRemoveKaynak(kaynak.id)}></button>
                      )}
                    </div>
                    <div className="row g-1">
                      <div className="col-4">
                        <label className="text-white-50 d-block text-center" style={{ fontSize: "9px" }}>Kişi</label>
                        <input type="number" value={kaynak.kisiSayisi === 0 ? "" : kaynak.kisiSayisi} onChange={(e) => handleKaynakChange(kaynak.id, "kisiSayisi", e.target.value)} className="form-control form-control-sm bg-dark text-white border-0 text-center py-0.5 fw-semibold" style={{ fontSize: "11px" }} />
                      </div>
                      <div className="col-4">
                        <label className="text-white-50 d-block text-center" style={{ fontSize: "9px" }}>Org (g/k/g)</label>
                        <input type="number" value={kaynak.organikYuk === 0 ? "" : kaynak.organikYuk} onChange={(e) => handleKaynakChange(kaynak.id, "organikYuk", e.target.value)} className="form-control form-control-sm bg-dark text-white border-0 text-center py-0.5 fw-semibold" style={{ fontSize: "11px" }} />
                      </div>
                      <div className="col-4">
                        <label className="text-white-50 d-block text-center" style={{ fontSize: "9px" }}>Hid (l/k/g)</label>
                        <input type="number" value={kaynak.hidrolikYuk === 0 ? "" : kaynak.hidrolikYuk} onChange={(e) => handleKaynakChange(kaynak.id, "hidrolikYuk", e.target.value)} className="form-control form-control-sm bg-dark text-white border-0 text-center py-0.5 fw-semibold" style={{ fontSize: "11px" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. 3 PARALEL PARAMETRE */}
        <div className="row g-1 pt-2" style={{ borderTop: "1px dashed #334155" }}>
          <div className="col-4">
            <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>Hedef BOİ</label>
            <input type="number" name="cikisBoi" value={data.cikisBoi === 0 ? "" : (data.cikisBoi ?? 40)} onChange={handleChange} className="form-control form-control-sm border-0 text-white text-center fw-bold" style={{ backgroundColor: "#1e293b", fontSize: "12px", borderBottom: "2px solid #38bdf8", borderRadius: "4px 4px 0 0" }} />
          </div>
          <div className="col-4">
            <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>Sıcaklık</label>
            <input type="number" name="sicaklik" value={data.sicaklik === 0 ? "" : (data.sicaklik ?? 19)} onChange={handleChange} className="form-control form-control-sm border-0 text-white text-center fw-bold" style={{ backgroundColor: "#1e293b", fontSize: "12px", borderBottom: "2px solid #38bdf8", borderRadius: "4px 4px 0 0" }} />
          </div>
          <div className="col-4">
            <label className="text-white-50 d-block text-center mb-1" style={{ fontSize: "10px" }}>Ön Arıtma Verim, (%)</label>
            <input type="number" name="giderimVerimi" value={data.giderimVerimi === 0 ? "" : (data.giderimVerimi ?? 33)} onChange={handleChange} className="form-control form-control-sm border-0 text-white text-center fw-bold" style={{ backgroundColor: "#1e293b", fontSize: "12px", borderBottom: "2px solid #38bdf8", borderRadius: "4px 4px 0 0" }} />
          </div>
        </div>

        {/* 5. ATİKSU TİPİ SWITCH SEÇİMİ */}
        <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="fw-medium text-white-50" style={{ fontSize: "12px" }}>
            {data.atiksutype === "endustriyel" ? (
              <span className="text-warning"><i className="bi bi-building-gear me-1.5"></i>Endüstriyel Atıksu</span>
            ) : (
              <span className="text-info"><i className="bi bi-house-door-fill me-1.5"></i>Evsel Atıksu</span>
            )}
          </span>
          <div className="form-check form-switch m-0 p-0 d-flex align-items-center">
            <input
              className="form-check-input cursor-pointer m-0"
              type="checkbox"
              role="switch"
              id="atiksutypeSwitch"
              style={{ width: "38px", height: "20px" }}
              checked={data.atiksutype === "endustriyel"}
              onChange={handleTypeToggle}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export default InputColumn;