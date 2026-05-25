import React, { useEffect } from "react";

function IleriAritmaInputSelections({ data = {}, updateData }) {
    // İlgili alt kırılımdaki veriye daha rahat erişmek için bir kısa yol tanımlayalım
    const currentSelectionData = data?.ileriAritma?.IleriAritmaInputSelections || {};

    // 1. DEFAULT DEĞERLERİN OTOMATİK OLARAK AYARLANMASI
    useEffect(() => {
        const defaultValues = {
            girisToplamAzot: 60,
            cikisToplamAzot: 10,
            girisToplamFosfor: 10,
            cikisToplamFosfor: 3,
            gerekliFeKatsayisi: 2.7,
        };

        // Eğer alt nesne içinde bu key'lerden biri eksikse güncellenmesi gerekir
        const eksikVeriVarMi = Object.keys(defaultValues).some(
            (key) => currentSelectionData[key] === undefined || currentSelectionData[key] === null
        );

        if (eksikVeriVarMi) {
            updateData({
                ...data, // Mevcut ana data yapısını koru (varsa başka modüllerin verileri gitmesin)
                ileriAritma: {
                    ...data?.ileriAritma, // Varsa ileriAritma altındaki diğer verileri koru
                    IleriAritmaInputSelections: {
                        ...defaultValues,        // Önce default değerleri koyuyoruz
                        ...currentSelectionData, // Kullanıcının girdikleri ezilmesin diye üstüne yazıyoruz
                    }
                }
            });
        }
    }, [data, currentSelectionData, updateData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        updateData({
            ...data, // Ana objeyi koru
            ileriAritma: {
                ...data?.ileriAritma, // ileriAritma objesini koru
                IleriAritmaInputSelections: {
                    ...currentSelectionData, // Mevcut input değerlerini koru
                    [name]: value === "" ? "" : Number(value), // Yeni değeri yaz
                }
            }
        });
    };

    // Kalın Sağa Bakan Ok SVG Bileşeni
    const RightArrow = () => (
        <div className="col-auto d-flex align-items-center justify-content-center px-1" style={{ height: "38px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" style={{ width: "35px", height: "auto" }}>
                <rect x="10" y="22" width="110" height="16" fill="#10b981" rx="2" />
                <path d="M115 10 L145 30 L115 50 Z" fill="#10b981" />
                <path d="M142 10 L154 10 L174 30 L154 50 L142 50 L162 30 Z" fill="#10b981" />
            </svg>
        </div>
    );

    return (
        <div className="card-body d-flex flex-column gap-3" style={{ position: "relative", color: "#fff" }}>

            {/* BAŞLIK BÖLÜMÜ */}
            <div className="d-flex align-items-center">
                <span className="fw-bold text-uppercase pe-2" style={{ fontSize: "11px", letterSpacing: "0.7px", color: "#00874e" }}>
                    1. İleri Arıtma Parametreleri
                </span>
                <div className="flex-grow-1 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1)" }}></div>
            </div>

            {/* ANA PANEL KAPSAYICISI */}
            <div className="p-3 rounded" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>

                {/* 1. SATIR: TÜM BAŞLIKLAR */}
                <div className="row g-2 text-center mb-1 align-items-end">
                    <div className="col"><span className="text-white-50 d-block text-truncate" style={{ fontSize: "10px" }}>Giriş T. Azot (mg/l)</span></div>
                    <div className="col-auto" style={{ width: "35px" }}></div>
                    <div className="col"><span className="text-white-50 d-block text-truncate" style={{ fontSize: "10px" }}>Çıkış T. Azot (mg/l)</span></div>

                    <div className="col-auto px-2"></div>

                    <div className="col"><span className="text-white-50 d-block text-truncate" style={{ fontSize: "10px" }}>Giriş T. Fosfor (mg/l)</span></div>
                    <div className="col-auto" style={{ width: "35px" }}></div>
                    <div className="col"><span className="text-white-50 d-block text-truncate" style={{ fontSize: "10px" }}>Çıkış T. Fosfor (mg/l)</span></div>

                    <div className="col-auto px-2"></div>

                    <div className="col">
                        <span className="text-warning d-block text-truncate fw-medium" style={{ fontSize: "10px" }}>
                            Fe Katsayısı <span style={{ fontSize: "9px" }}>(kg Fe/P)</span>
                        </span>
                    </div>
                </div>

                {/* 2. SATIR: TÜM INPUTLAR VE OKLAR */}
                <div className="row g-2 align-items-center text-center">
                    {/* Azot Giriş */}
                    <div className="col">
                        <input
                            type="number"
                            name="girisToplamAzot"
                            value={currentSelectionData.girisToplamAzot ?? ""}
                            onChange={handleChange}
                            className="form-control form-control-sm text-white fw-bold border-0 text-center"
                            style={{ backgroundColor: "rgba(0, 135, 78, 0.2)", borderRadius: "6px", fontSize: "12px", height: "25px" }}
                        />
                    </div>

                    <RightArrow />

                    {/* Azot Çıkış */}
                    <div className="col">
                        <input
                            type="number"
                            name="cikisToplamAzot"
                            value={currentSelectionData.cikisToplamAzot ?? ""}
                            onChange={handleChange}
                            className="form-control form-control-sm text-white fw-bold border-0 text-center"
                            style={{ backgroundColor: "rgba(0, 135, 78, 0.2)", borderRadius: "6px", fontSize: "12px", height: "25px" }}
                        />
                    </div>

                    <div className="col-auto px-2">
                        <div style={{ width: "1px", height: "25px", backgroundColor: "rgba(255,255,255,0.1)" }}></div>
                    </div>

                    {/* Fosfor Giriş */}
                    <div className="col">
                        <input
                            type="number"
                            name="girisToplamFosfor"
                            value={currentSelectionData.girisToplamFosfor ?? ""}
                            onChange={handleChange}
                            className="form-control form-control-sm text-white fw-bold border-0 text-center"
                            style={{ backgroundColor: "rgba(0, 135, 78, 0.2)", borderRadius: "6px", fontSize: "12px", height: "25px" }}
                        />
                    </div>

                    <RightArrow />

                    {/* Fosfor Çıkış */}
                    <div className="col">
                        <input
                            type="number"
                            name="cikisToplamFosfor"
                            value={currentSelectionData.cikisToplamFosfor ?? ""}
                            onChange={handleChange}
                            className="form-control form-control-sm text-white fw-bold border-0 text-center"
                            style={{ backgroundColor: "rgba(0, 135, 78, 0.2)", borderRadius: "6px", fontSize: "12px", height: "25px" }}
                        />
                    </div>

                    <div className="col-auto px-2">
                        <div style={{ width: "1px", height: "25px", backgroundColor: "rgba(255,255,255,0.1)" }}></div>
                    </div>

                    {/* Fe Gerekli Katsayı */}
                    <div className="col">
                        <input
                            type="number"
                            name="gerekliFeKatsayisi"
                            step="0.1"
                            value={currentSelectionData.gerekliFeKatsayisi ?? ""}
                            onChange={handleChange}
                            className="form-control form-control-sm text-warning fw-bold border-0 text-center"
                            style={{ backgroundColor: "rgba(255, 193, 7, 0.15)", borderRadius: "6px", fontSize: "12px", height: "25px" }}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}

export default IleriAritmaInputSelections;