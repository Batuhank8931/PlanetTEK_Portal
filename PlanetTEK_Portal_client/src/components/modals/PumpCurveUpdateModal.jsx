import React, { useState, useEffect } from "react";
import API from "../../utils/utilRequest";
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
import ExcelGrid from "../FiyatlarComponents/ExcelGrid";
import AlertModal from "./AlertModal";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function PumpCurveUpdateModal({ show, onClose, pumpId, pumpName }) {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    const [alertConfig, setAlertConfig] = useState({
        show: false,
        title: "",
        message: "",
        type: "success",
        showCancel: false,
        action: null       
    });

    const headers = ["Debi (Q - m³/h)", "Basma Yüksekliği (H - mSS)"];
    const fields = ["flow_rate", "head_mss"];

    useEffect(() => {
        if (show && pumpId) {
            fetchCurveData();
        }
    }, [show, pumpId]);

    const fetchCurveData = async () => {
        try {
            setLoading(true);
            const response = await API.getPumpCurve(pumpId);
            const activePoints = (response.data || []).filter(p => !p.isDeleted);
            setPoints(activePoints);
        } catch (error) {
            console.error("Eğri verisi yüklenirken hata oluştu:", error);
            setAlertConfig({
                show: true,
                title: "Hata",
                message: "Eğri verileri yüklenirken sistemsel bir hata meydana geldi.",
                type: "error",
                showCancel: false,
                action: null
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGridDataChange = (newData) => {
        const resolvedData = typeof newData === "function" ? newData(points) : newData;
        if (!resolvedData || !Array.isArray(resolvedData)) return;
        setPoints([...resolvedData]);
    };

    const handleAddPoint = () => {
        const newRow = {
            id: `new_point_${Date.now()}`, 
            flow_rate: 0,
            head_mss: 0
        };
        setPoints(prev => [...prev, newRow]);
    };

    // 💾 VERİTABANINA KAYDETME
    const handleSave = async () => {
        const validPoints = points
            .filter(p => !p.isDeleted && p.flow_rate !== "" && p.head_mss !== "")
            .map(p => ({
                flow_rate: Number(p.flow_rate),
                head_mss: Number(p.head_mss)
            }));

        validPoints.sort((a, b) => a.flow_rate - b.flow_rate);

        try {
            setSubmitLoading(true);
            await API.updatePumpCurve(pumpId, { points: validPoints });
            
            // 🌟 BURASI DEĞİŞTİ: onClose() buradan kaldırıldı, action'a aktarıldı.
            setAlertConfig({
                show: true,
                title: "İşlem Tamamlandı",
                message: "Pompa eğrisi başarıyla güncellendi!",
                type: "success",
                showCancel: false,
                action: () => { onClose(); } // Alert kapatılınca ana modal da kapansın
            });
        } catch (error) {
            console.error("Eğri kaydedilirken hata oluştu:", error);
            setAlertConfig({
                show: true,
                title: "Hata",
                message: "Eğri verileri kaydedilirken bir hata oluştu.",
                type: "error",
                showCancel: false,
                action: null
            });
        } finally {
            setSubmitLoading(false);
        }
    };

    const getSortedChartData = () => {
        return [...points]
            .filter(p => !p.isDeleted && p.flow_rate !== "" && p.head_mss !== "")
            .sort((a, b) => Number(a.flow_rate) - Number(b.flow_rate));
    };

    const chartDataSorted = getSortedChartData();

    const chartData = {
        labels: chartDataSorted.map(p => `${p.flow_rate} m³/h`),
        datasets: [
            {
                label: "Pompa Eğrisi (Q/H)",
                data: chartDataSorted.map(p => Number(p.head_mss)),
                borderColor: "#22c55e",
                backgroundColor: "rgba(34, 197, 94, 0.2)",
                borderWidth: 2,
                tension: 0.3,
                pointBackgroundColor: "#ffffff",
                pointBorderColor: "#00874e",
                pointHoverRadius: 6,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `Basma Yüksekliği: ${context.raw} mSS`
                }
            }
        },
        scales: {
            x: {
                grid: { color: "#1e293b" },
                ticks: { color: "#94a3b8", font: { family: "Inter" } },
                title: { display: true, text: "Debi Q (m³/h)", color: "#94a3b8" }
            },
            y: {
                grid: { color: "#1e293b" },
                ticks: { color: "#94a3b8", font: { family: "Inter" } },
                title: { display: true, text: "Basma Yüksekliği H (mSS)", color: "#94a3b8" }
            }
        }
    };

    if (!show) return null;

    const visiblePoints = points.filter(p => !p.isDeleted);

    return (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(2,6,23,0.7)", backdropFilter: "blur(6px)" }}>
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content border-0 shadow-lg text-light" style={{ backgroundColor: "#0f172a", fontFamily: "Inter, sans-serif" }}>

                    {/* Header */}
                    <div className="modal-header py-3" style={{ borderBottom: "1px solid #1e293b", backgroundColor: "#020617" }}>
                        <h6 className="modal-title d-flex align-items-center" style={{ color: "#cbd5e1" }}>
                            <i className="bi bi-activity me-2 text-success fs-5"></i>
                            <span className="fw-bold fs-6">{pumpName}</span>
                        </h6>
                        <button type="button" className="btn-close btn-close-white shadow-none" onClick={onClose} disabled={submitLoading}></button>
                    </div>

                    {/* Body */}
                    <div className="modal-body p-4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                        {loading ? (
                            <div className="d-flex justify-content-center my-5 py-5">
                                <div className="spinner-border text-success" role="status">
                                    <span className="visually-hidden">Yükleniyor...</span>
                                </div>
                            </div>
                        ) : (
                            <div className="row g-4">
                                <div className="col-12 col-lg-5 d-flex flex-column">
                                    <div className="mb-2 text-secondary small fw-semibold d-flex align-items-center" style={{ fontSize: "11.5px" }}>
                                        <i className="bi bi-table me-2 text-secondary"></i> Veri Noktaları (Excel Modu)
                                    </div>
                                    <div className="flex-grow-1">
                                        <ExcelGrid
                                            headers={headers}
                                            data={visiblePoints}
                                            fields={fields}
                                            onDataChange={handleGridDataChange}
                                            isMainTable={true}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-sm w-100 mt-3 py-2 d-flex align-items-center justify-content-center shadow-none"
                                        onClick={handleAddPoint}
                                        style={{ border: "1px dashed #334155", color: "#38bdf8", backgroundColor: "transparent", fontSize: "11.5px" }}
                                    >
                                        <i className="bi bi-plus-lg me-1"></i> Yeni Nokta (Değer) Ekle
                                    </button>
                                </div>

                                <div className="col-12 col-lg-7 d-flex flex-column">
                                    <div className="mb-2 text-secondary small fw-semibold d-flex align-items-center" style={{ fontSize: "11.5px" }}>
                                        <i className="bi bi-graph-up-arrow me-2 text-success"></i> Canlı Performans Grafiği
                                    </div>
                                    <div className="flex-grow-1 p-3 rounded" style={{ backgroundColor: "#131c2e", border: "1px solid #1e293b", minHeight: "350px" }}>
                                        {chartDataSorted.length === 0 ? (
                                            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted small">
                                                <i className="bi bi-bezier2 fs-2 mb-2 text-secondary"></i>
                                                Grafiğin çizilmesi için geçerli noktalar girin.
                                            </div>
                                        ) : (
                                            <Line data={chartData} options={chartOptions} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="modal-footer py-2" style={{ borderTop: "1px solid #1e293b", backgroundColor: "#020617" }}>
                        <button type="button" className="btn btn-sm btn-outline-secondary text-secondary px-3 shadow-none border-secondary border-opacity-50" style={{ fontSize: "11.5px" }} onClick={onClose} disabled={submitLoading}>
                            İptal
                        </button>
                        <button type="button" className="btn btn-sm btn-success px-4 shadow-none" style={{ fontSize: "11.5px" }} onClick={handleSave} disabled={loading || submitLoading}>
                            {submitLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Kaydediliyor...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-cloud-arrow-up-fill me-1"></i> Değişiklikleri Kaydet
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </div>

            {/* 🌟 GÜNCELLEME: Tetiklenen ara onClose mekanizması */}
            <AlertModal
                show={alertConfig.show}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => {
                    setAlertConfig(prev => ({ ...prev, show: false }));
                    if (alertConfig.action) alertConfig.action();
                }}
            />
        </div>
    );
}

export default PumpCurveUpdateModal;