import React, { useState } from "react";

function Lamella() {
  const [lamellaData, setLamellaData] = useState([
    { id: "yi_ls8", tipi: "Yurt İçi - LS 8", fiyat: 5100 },
    { id: "yi_ls15", tipi: "Yurt İçi - LS 15", fiyat: 6570 },
    { id: "yi_ls30", tipi: "Yurt İçi - LS 30", fiyat: 8015 },
    { id: "yi_ls45", tipi: "Yurt İçi - LS 45", fiyat: 10415 },
    { id: "yd_ls8", tipi: "Yurt Dışı - LS 8", fiyat: 5610 },
    { id: "yd_ls15", tipi: "Yurt Dışı - LS 15", fiyat: 7227 },
    { id: "yd_ls30", tipi: "Yurt Dışı - LS 30", fiyat: 8817 },
    { id: "yd_ls45", tipi: "Yurt Dışı - LS 45", fiyat: 11457 }
  ]);

  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return "";
    return new Intl.NumberFormat("tr-TR").format(num);
  };

  const parseNumber = (str) => {
    const cleanStr = str.replace(/\./g, "");
    return cleanStr === "" ? 0 : Number(cleanStr);
  };

  const handleUpdate = (id, rawStringValue) => {
    const numericValue = parseNumber(rawStringValue);
    setLamellaData(prev => prev.map(item => item.id === id ? { ...item, fiyat: numericValue } : item));
  };

  const handleSave = () => {
    alert("Lamella fiyatları başarıyla güncellendi.");
    console.log("Kaydedilen Lamella Verisi:", lamellaData);
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
          <i className="bi bi-save me-2"></i>Lamellaları Güncelle
        </button>
      </div>
      <div className="row justify-content-start">
        <div className="col-12 col-md-6">
          <div className="card shadow border-0" style={{ borderRadius: "8px", overflow: "hidden", backgroundColor: "#1e293b" }}>
            <table className="table table-dark table-hover align-middle mb-0">
              <thead style={{ backgroundColor: "#0f172a" }}>
                <tr>
                  <th className="py-3 px-4 text-muted">Lamella Tipi Seçeneği</th>
                  <th className="py-3 text-end px-4" style={{ width: "160px" }}>Birim Fiyat (€)</th>
                </tr>
              </thead>
              <tbody>
                {lamellaData.map((lam) => (
                  <tr key={lam.id} style={{ borderColor: "#334155" }}>
                    <td className="px-4 py-2 text-white">{lam.tipi}</td>
                    <td className="px-4">
                      <input type="text" style={cellInputStyle} value={formatNumber(lam.fiyat)} onChange={(e) => handleUpdate(lam.id, e.target.value)} />
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

export default Lamella;