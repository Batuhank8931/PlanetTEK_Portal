import React, { useState } from "react";

function Izgara() {
  const [izgaraData, setIzgaraData] = useState([
    { id: 1, kapasite: "-", plakaYd: 126, plakaYi: 107, mKabaYd: 912, mKabaYi: 866, mInceYd: 958, mInceYi: 910, oKabaYd: 15224, oKabaYi: 14463, oInceYd: 15833, oInceYi: 15042 },
    { id: 2, kapasite: "100 m³/gün", plakaYd: 126, plakaYi: 107, mKabaYd: 912, mKabaYi: 866, mInceYd: 958, mInceYi: 910, oKabaYd: 16916, oKabaYi: 16070, oInceYd: 17593, oInceYi: 16713 },
    { id: 3, kapasite: "200 m³/gün", plakaYd: 186, plakaYi: 158, mKabaYd: 912, mKabaYi: 866, mInceYd: 958, mInceYi: 910, oKabaYd: 18796, oKabaYi: 17856, oInceYd: 19547, oInceYi: 18570 },
    { id: 4, kapasite: "300 m³/gün (A)", plakaYd: 186, plakaYi: 158, mKabaYd: 1635, mKabaYi: 1553, mInceYd: 1717, mInceYi: 1631, oKabaYd: 20884, oKabaYi: 19840, oInceYd: 21719, oInceYi: 20633 },
    { id: 5, kapasite: "300 m³/gün (B)", plakaYd: 186, plakaYi: 158, mKabaYd: 1635, mKabaYi: 1553, mInceYd: 1717, mInceYi: 1631, oKabaYd: 20884, oKabaYi: 19840, oInceYd: 21719, oInceYi: 20633 },
    { id: 6, kapasite: "400 m³/gün (A)", plakaYd: 272, plakaYi: 231, mKabaYd: 1635, mKabaYi: 1553, mInceYd: 1717, mInceYi: 1631, oKabaYd: 20884, oKabaYi: 19840, oInceYd: 21719, oInceYi: 20633 },
    { id: 7, kapasite: "400 m³/gün (B)", plakaYd: 272, plakaYi: 231, mKabaYd: 1635, mKabaYi: 1553, mInceYd: 1717, mInceYi: 1631, oKabaYd: 20884, oKabaYi: 19840, oInceYd: 21719, oInceYi: 20633 },
    { id: 8, kapasite: "500 m³/gün", plakaYd: 372, plakaYi: 316, mKabaYd: 2204, mKabaYi: 2094, mInceYd: 2314, mInceYi: 2198, oKabaYd: 26412, oKabaYi: 25091, oInceYd: 27468, oInceYi: 26095 },
    { id: 9, kapasite: "600 m³/gün (A)", plakaYd: 372, plakaYi: 316, mKabaYd: 2204, mKabaYi: 2094, mInceYd: 2314, mInceYi: 2198, oKabaYd: 26412, oKabaYi: 25091, oInceYd: 27468, oInceYi: 26095 },
    { id: 10, kapasite: "600 m³/gün (B)", plakaYd: 480, plakaYi: 408, mKabaYd: 2204, mKabaYi: 2094, mInceYd: 2314, mInceYi: 2198, oKabaYd: 26412, oKabaYi: 25091, oInceYd: 27468, oInceYi: 26095 },
    { id: 11, kapasite: "700 m³/gün", plakaYd: 480, plakaYi: 408, mKabaYd: 2204, mKabaYi: 2094, mInceYd: 2314, mInceYi: 2198, oKabaYd: 26412, oKabaYi: 25091, oInceYd: 27468, oInceYi: 26095 },
    { id: 12, kapasite: "800 m³/gün", plakaYd: 560, plakaYi: 476, mKabaYd: 4150, mKabaYi: 3943, mInceYd: 4358, mInceYi: 4140, oKabaYd: 33410, oKabaYi: 31740, oInceYd: 34746, oInceYi: 33009 },
    { id: 13, kapasite: "900 m³/gün", plakaYd: 560, plakaYi: 476, mKabaYd: 4150, mKabaYi: 3943, mInceYd: 4358, mInceYi: 4140, oKabaYd: 33410, oKabaYi: 31740, oInceYd: 34746, oInceYi: 33009 },
    { id: 14, kapasite: "Özel Kapasite", plakaYd: 176, plakaYi: 129, mKabaYd: 4150, mKabaYi: 3943, mInceYd: 4358, mInceYi: 4140, oKabaYd: 33410, oKabaYi: 31740, oInceYd: 34746, oInceYi: 33009 },
    { id: 15, kapasite: "Alternatif Kademe", plakaYd: 372, plakaYi: 316, mKabaYd: 2204, mKabaYi: 2094, mInceYd: 2314, mInceYi: 2198, oKabaYd: 26412, oKabaYi: 25091, oInceYd: 27468, oInceYi: 26095 }
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
    setIzgaraData(prev => prev.map(item => item.id === id ? { ...item, [field]: numericValue } : item));
  };

  const handleSave = () => {
    alert("Kapasite & Izgara matrisi başarıyla güncellendi.");
    console.log("Kaydedilen Izgara Verisi:", izgaraData);
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
          <i className="bi bi-save me-2"></i>Izgaraları Güncelle
        </button>
      </div>
      <div className="card shadow border-0" style={{ borderRadius: "8px", overflow: "hidden", backgroundColor: "#1e293b" }}>
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0" style={{ fontSize: "11px", minWidth: "1200px" }}>
            <thead style={{ backgroundColor: "#0f172a" }}>
              <tr>
                <th className="py-3 px-3 text-uppercase text-muted">Kapasite</th>
                <th className="py-3 text-center">Yağ Tutucu YD</th>
                <th className="py-3 text-center">Yağ Tutucu YI</th>
                <th className="py-3 text-center text-warning">M. Kaba YD</th>
                <th className="py-3 text-center text-warning">M. Kaba YI</th>
                <th className="py-3 text-center text-warning">M. İnce YD</th>
                <th className="py-3 text-center text-warning">M. İnce YI</th>
                <th className="py-3 text-center text-danger">Oto Kaba YD</th>
                <th className="py-3 text-center text-danger">Oto Kaba YI</th>
                <th className="py-3 text-center text-danger">Oto İnce YD</th>
                <th className="py-3 text-center text-danger">Oto İnce YI</th>
              </tr>
            </thead>
            <tbody>
              {izgaraData.map((iz) => (
                <tr key={iz.id} style={{ borderColor: "#334155" }}>
                  <td className="px-3 py-2 fw-bold text-white">{iz.kapasite}</td>
                  <td><input type="text" style={cellInputStyle} value={formatNumber(iz.plakaYd)} onChange={(e) => handleUpdate(iz.id, "plakaYd", e.target.value)} /></td>
                  <td><input type="text" style={cellInputStyle} value={formatNumber(iz.plakaYi)} onChange={(e) => handleUpdate(iz.id, "plakaYi", e.target.value)} /></td>
                  <td><input type="text" style={cellInputStyle} value={formatNumber(iz.mKabaYd)} onChange={(e) => handleUpdate(iz.id, "mKabaYd", e.target.value)} /></td>
                  <td><input type="text" style={cellInputStyle} value={formatNumber(iz.mKabaYi)} onChange={(e) => handleUpdate(iz.id, "mKabaYi", e.target.value)} /></td>
                  <td><input type="text" style={cellInputStyle} value={formatNumber(iz.mInceYd)} onChange={(e) => handleUpdate(iz.id, "mInceYd", e.target.value)} /></td>
                  <td><input type="text" style={cellInputStyle} value={formatNumber(iz.mInceYi)} onChange={(e) => handleUpdate(iz.id, "mInceYi", e.target.value)} /></td>
                  <td><input type="text" style={cellInputStyle} value={formatNumber(iz.oKabaYd)} onChange={(e) => handleUpdate(iz.id, "oKabaYd", e.target.value)} /></td>
                  <td><input type="text" style={cellInputStyle} value={formatNumber(iz.oKabaYi)} onChange={(e) => handleUpdate(iz.id, "oKabaYi", e.target.value)} /></td>
                  <td><input type="text" style={cellInputStyle} value={formatNumber(iz.oInceYd)} onChange={(e) => handleUpdate(iz.id, "oInceYd", e.target.value)} /></td>
                  <td><input type="text" style={cellInputStyle} value={formatNumber(iz.oInceYi)} onChange={(e) => handleUpdate(iz.id, "oInceYi", e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Izgara;