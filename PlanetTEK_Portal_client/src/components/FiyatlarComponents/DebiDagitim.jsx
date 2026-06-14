import React, { useState } from "react";

function DebiDagitim() {
  const [debiDagitimData, setDebiDagitimData] = useState([
    { id: 3, ad: "3 Çıkış", yd: 4715, yi: 4244 },
    { id: 4, ad: "4 Çıkış", yd: 5187, yi: 4668 },
    { id: 5, ad: "5 Çıkış", yd: 5705, yi: 5135 },
    { id: 6, ad: "6 Çıkış", yd: 6276, yi: 5648 },
    { id: 7, ad: "7 Çıkış", yd: 6903, yi: 6213 },
    { id: 8, ad: "8 Çıkış", yd: 7594, yi: 6834 },
    { id: 9, ad: "9 Çıkış", yd: 8353, yi: 7518 },
    { id: 10, ad: "10 Çıkış", yd: 9188, yi: 8269 },
    { id: 11, ad: "11 Çıkış", yd: 10107, yi: 9096 },
    { id: 12, ad: "12 Çıkış", yd: 11118, yi: 10006 },
    { id: 13, ad: "13 Çıkış", yd: 12229, yi: 11007 },
    { id: 14, ad: "14 Çıkış", yd: 13452, yi: 12107 },
    { id: 15, ad: "15 Çıkış", yd: 14798, yi: 13318 },
    { id: 16, ad: "16 Çıkış", yd: 16277, yi: 14650 },
    { id: 17, ad: "2. Sırada Ekstra Çıkış", yd: 5187, yi: 4668 }
  ]);

  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return "";
    return new Intl.NumberFormat("tr-TR").format(num);
  };

  const parseNumber = (str) => {
    const cleanStr = str.replace(/\./g, "");
    return cleanStr === "" ? 0 : Number(cleanStr);
  };

  const handleUpdate = (id, field, rawStringValue) => {
    const numericValue = parseNumber(rawStringValue);
    setDebiDagitimData(prev => prev.map(item => item.id === id ? { ...item, [field]: numericValue } : item));
  };

  const handleSave = () => {
    alert("Debi Dağıtım (Çıkışlar) matrisi başarıyla güncellendi.");
    console.log("Kaydedilen Debi Dağıtım Verisi:", debiDagitimData);
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
          <i className="bi bi-save me-2"></i>Çıkışları Güncelle
        </button>
      </div>
      <div className="row justify-content-start">
        <div className="col-12 col-md-8">
          <div className="card shadow border-0" style={{ borderRadius: "8px", overflow: "hidden", backgroundColor: "#1e293b" }}>
            <table className="table table-dark table-hover align-middle mb-0">
              <thead style={{ backgroundColor: "#0f172a" }}>
                <tr>
                  <th className="py-3 px-4 text-muted">Çıkış Grubu Kademesi</th>
                  <th className="py-3 text-center text-info">Yurt Dışı Fiyat (€)</th>
                  <th className="py-3 text-center text-info">Yurt İçi Fiyat (€)</th>
                </tr>
              </thead>
              <tbody>
                {debiDagitimData.map((d) => (
                  <tr key={d.id} style={{ borderColor: "#334155" }}>
                    <td className="px-4 py-2 text-white fw-medium">{d.ad}</td>
                    <td><input type="text" style={cellInputStyle} value={formatNumber(d.yd)} onChange={(e) => handleUpdate(d.id, "yd", e.target.value)} /></td>
                    <td><input type="text" style={cellInputStyle} value={formatNumber(d.yi)} onChange={(e) => handleUpdate(d.id, "yi", e.target.value)} /></td>
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

export default DebiDagitim;