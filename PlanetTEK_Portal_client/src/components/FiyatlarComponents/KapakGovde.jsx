import React, { useState } from "react";

function KapakGovde() {
  const [paslanmazData, setPaslanmazData] = useState([
    { id: "ss304_mil", ad: "SS304 MİL", fiyat: 3690 },
    { id: "ss304_ayna", ad: "SS304 AYNA / ROTOR", fiyat: 0 },
    { id: "ss304_sase", ad: "SS304 ŞASE", fiyat: 0 }
  ]);

  const [kapakGovdeData, setKapakGovdeData] = useState([
    { id: "yi_kapak", grup: "Yurt İçi (Yİ)", ad: "KAPAK", fiyat: 1390 },
    { id: "yi_sase", grup: "Yurt İçi (Yİ)", ad: "GÖVDE-ŞASE", fiyat: 5393 },
    { id: "yi_mini", grup: "Yurt İçi (Yİ)", ad: "MİNİ KAPAK", fiyat: 688 },
    { id: "yd_kapak", grup: "Yurt Dışı (YD)", ad: "KAPAK", fiyat: 1390 },
    { id: "yd_sase", grup: "Yurt Dışı (YD)", ad: "GÖVDE-ŞASE", fiyat: 5954 },
    { id: "yd_mini", grup: "Yurt Dışı (YD)", ad: "MİNİ KAPAK", fiyat: 757 }
  ]);

  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return "";
    return new Intl.NumberFormat("tr-TR").format(num);
  };

  const parseNumber = (str) => {
    const cleanStr = str.replace(/\./g, "");
    return cleanStr === "" ? 0 : Number(cleanStr);
  };

  const handleUpdatePaslanmaz = (id, rawStringValue) => {
    const numericValue = parseNumber(rawStringValue);
    setPaslanmazData(prev => prev.map(item => item.id === id ? { ...item, fiyat: numericValue } : item));
  };

  const handleUpdateKapakGovde = (id, rawStringValue) => {
    const numericValue = parseNumber(rawStringValue);
    setKapakGovdeData(prev => prev.map(item => item.id === id ? { ...item, fiyat: numericValue } : item));
  };

  const handleSave = () => {
    alert("Paslanmaz & Kapak-Gövde opsiyonları başarıyla güncellendi.");
    console.log("Kaydedilen Veriler:", { paslanmazData, kapakGovdeData });
  };

  const cellInputStyle = {
    backgroundColor: "#0f172a",
    border: "1px solid #475569",
    color: "#38bdf8",
    fontSize: "12px",
    padding: "3px 6px",
    borderRadius: "4px",
    width: "100%",
    textAlign: "right",
    fontWeight: "500"
  };

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-success btn-sm px-4" onClick={handleSave} style={{ backgroundColor: "#10b981", border: "none" }}>
          <i className="bi bi-save me-2"></i>Paslanmaz &amp; Kapak Güncelle
        </button>
      </div>
      <div className="row g-4">
        <div className="col-12 col-md-6">
          <div className="card shadow border-0" style={{ borderRadius: "8px", overflow: "hidden", backgroundColor: "#1e293b" }}>
            <div className="p-3 bg-dark fw-bold text-muted border-bottom" style={{ borderColor: "#334155" }}>Paslanmaz Değişimi Modülü</div>
            <table className="table table-dark mb-0">
              <tbody>
                {paslanmazData.map((p) => (
                  <tr key={p.id} style={{ borderColor: "#334155" }}>
                    <td className="px-4 py-2 text-white">{p.ad}</td>
                    <td className="px-4" style={{ width: "160px" }}>
                      <input type="text" style={cellInputStyle} value={formatNumber(p.fiyat)} onChange={(e) => handleUpdatePaslanmaz(p.id, e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card shadow border-0" style={{ borderRadius: "8px", overflow: "hidden", backgroundColor: "#1e293b" }}>
            <div className="p-3 bg-dark fw-bold text-muted border-bottom" style={{ borderColor: "#334155" }}>Kapak &amp; Gövde Opsiyonları</div>
            <table className="table table-dark mb-0">
              <tbody>
                {kapakGovdeData.map((k) => (
                  <tr key={k.id} style={{ borderColor: "#334155" }}>
                    <td className="px-4 py-2 text-white">
                      <span className="badge bg-secondary me-2">{k.grup}</span> {k.ad}
                    </td>
                    <td className="px-4" style={{ width: "160px" }}>
                      <input type="text" style={cellInputStyle} value={formatNumber(k.fiyat)} onChange={(e) => handleUpdateKapakGovde(k.id, e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KapakGovde;