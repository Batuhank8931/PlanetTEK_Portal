// CapexTablosu.js
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useTeklifStore } from "../../utils/teklifStore";
import CapexTableView from "./CapexTableView";
import capexHesapFonksiyonu from "../../utils/CapexHesap";
import SmallLoading from "../modals/smallLoading";

const generateWBSNumbers = (rowsArray) => {
    let level0 = 0; let level1 = 0; let level2 = 0; let level3 = 0;

    return rowsArray.map((row) => {
        let computedNo = "";
        if (row.type === 0) {
            level0++; level1 = 0; level2 = 0; level3 = 0;
            computedNo = `${level0}.`;
        } else if (row.type === 1) {
            level1++; level2 = 0; level3 = 0;
            computedNo = `${level0}.${level1}.`;
        } else if (row.type === 2) {
            level2++; level3 = 0;
            computedNo = `${level0}.${level1}.${level2}.`;
        } else if (row.type === 3) {
            level3++;
            computedNo = `${level0}.${level1}.${level2}.${level3}.`
                .replace(/\.0/g, "")
                .replace(/^\./, "");
        }
        return { ...row, computedNo };
    });
};

function CapexTablosu() {
    const formData = useTeklifStore((state) => state.formData);
    const updateSection = useTeklifStore((state) => state.updateSection);

    const customerInfo = formData?.customerInfo;
    const teklifNo = formData.customerInfo.teklifNo;
    const refNO = formData.customerInfo.offer_number;

    const formatDate = () => {
        return new Intl.DateTimeFormat('tr-TR', {
            year: 'numeric'
        }).format(new Date()).replace(/\./g, ' ');
        // Intl.DateTimeFormat her zaman sistemin o anki taze yılını (örn: 2026) dinamik olarak alır.
    };

    const initialGeneralInfo = {
        offerNo: `${formatDate()} / ${teklifNo} `,
        refNo: refNO,
        clientName: customerInfo?.ticariUnvan || "-",
    };


    const teklifDili = formData?.customerInfo?.teklifDili || "Yerli";

    // Güvenli okuma yapısı: store'daki nesneden rows dizisini veya eski yapıyı desteklemesi için yedekli okuma
    const storeCapexObj = formData?.tables?.capextablosu;
    const storeCapexRows = storeCapexObj?.rows || (Array.isArray(storeCapexObj) ? storeCapexObj : []);

    const [loading, setLoading] = useState(false);
    const [localRows, setLocalRows] = useState([]);
    const [history, setHistory] = useState([]);

    const priceData = useMemo(() => {
        return {
            screens: [],
            pumps: [],
            isYurtIci: teklifDili === "Yerli"
        };
    }, [teklifDili]);

    // Net toplamı hesaplayan yardımcı fonksiyon
    const calculateTotalNetPrice = (rowsArray) => {
        return rowsArray.reduce((sum, row) => {
            if (row.type === 3 && !row.isUrgent && !row.isOptional && row.piece > 0) {
                return sum + (row.netTotal || 0);
            }
            return sum;
        }, 0);
    };

    // Store ve yerel state'i senkronize eden fonksiyon
    const updateStore = useCallback((updatedRows) => {
        const finalRowsWithNumbers = generateWBSNumbers(updatedRows);
        setLocalRows(finalRowsWithNumbers);

        const currentNetTotal = calculateTotalNetPrice(finalRowsWithNumbers);

        updateSection("tables", {
            ...formData?.tables,
            capextablosu: {
                rows: finalRowsWithNumbers,
                totalNetPrice: currentNetTotal
            }
        });
    }, [formData?.tables, updateSection]);

    // ↶ Geri Al fonksiyonu
    const handleUndo = useCallback(() => {
        if (history.length === 0) return;

        const previousState = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));

        setLocalRows(previousState);
        const currentNetTotal = calculateTotalNetPrice(previousState);

        updateSection("tables", {
            ...formData?.tables,
            capextablosu: {
                rows: previousState,
                totalNetPrice: currentNetTotal
            }
        });
    }, [history, formData?.tables, updateSection]);

    const saveToHistory = useCallback(() => {
        const activeRows = storeCapexRows.length > 0 ? storeCapexRows : localRows;
        setHistory(prev => [...prev, JSON.parse(JSON.stringify(activeRows))]);
    }, [storeCapexRows, localRows]);

    useEffect(() => {
        if (storeCapexRows && storeCapexRows.length > 0) {
            setLocalRows(storeCapexRows);
            return;
        }

        async function fetchAndCalculateCapex() {
            setLoading(true);
            try {
                const rawInitialData = await capexHesapFonksiyonu(formData, priceData);
                const initialDataWithNo = generateWBSNumbers(rawInitialData);

                setLocalRows(initialDataWithNo);
                const currentNetTotal = calculateTotalNetPrice(initialDataWithNo);

                updateSection("tables", {
                    ...formData?.tables,
                    capextablosu: {
                        rows: initialDataWithNo,
                        totalNetPrice: currentNetTotal
                    }
                });
            } catch (error) {
                console.error("CAPEX tablosu hesaplanırken hata oluştu:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAndCalculateCapex();
    }, [storeCapexRows, priceData]);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const rawFreshData = await capexHesapFonksiyonu(formData, priceData);
            const freshDataWithNo = generateWBSNumbers(rawFreshData);

            saveToHistory();

            const currentNetTotal = calculateTotalNetPrice(freshDataWithNo);

            updateSection("tables", {
                ...formData?.tables,
                capextablosu: {
                    rows: freshDataWithNo,
                    totalNetPrice: currentNetTotal
                }
            });
            setLocalRows(freshDataWithNo);
        } catch (error) {
            console.error("Yenileme sırasında hata:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCellChange = (id, field, val) => {
        saveToHistory();

        const activeRows = storeCapexRows.length > 0 ? storeCapexRows : localRows;
        const updated = activeRows.map(row => {
            if (row.id === id) {
                const updatedRow = { ...row, [field]: val };
                if (field === "piece" || field === "unitPrice" || field === "discount" || field === "isOptional") {
                    const piece = parseFloat(updatedRow.piece) || 0;
                    const unitPrice = parseFloat(updatedRow.unitPrice) || 0;
                    const discount = parseFloat(updatedRow.discount) || 0;
                    updatedRow.rawTotal = parseFloat((piece * unitPrice).toFixed(2));
                    updatedRow.netTotal = parseFloat((updatedRow.rawTotal * (1 - discount / 100)).toFixed(2));
                }
                return updatedRow;
            }
            return row;
        });
        updateStore(updated);
    };

    const insertAfterRow = (index, selectedType) => {
        saveToHistory();

        const activeRows = storeCapexRows.length > 0 ? storeCapexRows : localRows;
        const newRow = {
            id: "_" + Math.random().toString(36).substr(2, 9),
            type: selectedType,
            label: selectedType === 3 ? "Yeni Ekipman Kalemi" : `Yeni Başlık Lvl ${selectedType + 1}`,
            piece: selectedType === 3 ? 1 : 1,
            unitPrice: 0,
            discount: 0,
            rawTotal: 0,
            netTotal: 0,
            computedNo: ""
        };

        const updated = [...activeRows];
        updated.splice(index + 1, 0, newRow);
        updateStore(updated);
    };

    const deleteRow = (id) => {
        saveToHistory();

        const activeRows = storeCapexRows.length > 0 ? storeCapexRows : localRows;
        const updated = activeRows.filter(row => String(row.id) !== String(id));
        updateStore(updated);
    };

    return (
        <div className="w-100" style={{ position: "relative", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <SmallLoading
                isLoading={loading}
                text="Fiyatlar Güncelleniyor ve Tablo Hesaplanıyor..."
            />

            <div style={{ minWidth: "950px" }}>
                <CapexTableView
                    numberedRows={storeCapexRows.length > 0 ? storeCapexRows : localRows}
                    handleCellChange={handleCellChange}
                    insertAfterRow={insertAfterRow}
                    deleteRow={deleteRow}
                    handleRefresh={handleRefresh}
                    handleUndo={handleUndo}
                    historyLength={history.length}
                    teklifDili={teklifDili}
                    initialGeneralInfo={initialGeneralInfo}
                />
            </div>
        </div>
    );
}

export default CapexTablosu;