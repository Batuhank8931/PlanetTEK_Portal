// CapexTablosu.js
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useTeklifStore } from "../../utils/teklifStore";
import CapexTableView from "./CapexTableView";
import capexHesapFonksiyonu from "../../utils/CapexHesap";
import SmallLoading from "../modals/smallLoading";

const generateWBSNumbers = (rowsArray) => {
    let level0 = 0; let level1 = 0; let level2 = 0; let level3 = 0;
    let level1_sub = 0; // 1.1'in doğrudan altındaki bağımsız elemanlar için (1.1.2, 1.1.3)

    return rowsArray.map((row) => {
        let computedNo = "";
        const isPrice = row.type === 3;

        if (row.type === 0) {
            level0++; level1 = 0; level2 = 0; level3 = 0; level1_sub = 0;
            computedNo = `${level0}.`;
        } else if (row.type === 1) {
            level1++; level2 = 0; level3 = 0; level1_sub = 0; // Yeni alt grupta sub sıfırlanır
            computedNo = `${level0}.${level1}.`;
        } else if (row.type === 2) {
            level2++; level3 = 0;
            level1_sub++; // 1.1.1 gibi bir grup açıldığı için alt kırılım sayacını yer ayırtmak üzere artırıyoruz
            computedNo = `${level0}.${level1}.${level2}.`;
        } else if (row.type === 3) {
            const isIzgaraKalemi = String(row.id).includes("izgara_");

            if (isIzgaraKalemi) {
                if (level2 === 0) {
                    level2 = 1;
                    if (level1_sub === 0) level1_sub = 1;
                }
                level3++;
                computedNo = `${level0}.${level1}.${level2}.${level3}.`;
            } else {
                // Izgara grubu bitti veya hiç yoksa doğrudan 1.1'in altına bağla (1.1.2, 1.1.3, 1.1.4...)
                level1_sub++;
                computedNo = `${level0}.${level1}.${level1_sub}.`;
            }
        }
        return { ...row, computedNo, isPrice };
    });
};

function CapexTablosu() {
    const formData = useTeklifStore((state) => state.formData);
    const updateSection = useTeklifStore((state) => state.updateSection);
    const currency = formData?.customerInfo?.currency || "EUR";
    const exchangeRate = formData?.customerInfo?.exchangeRate || "1";

    const teklifDili = formData?.customerInfo?.teklifDili;

    const customerInfo = formData?.customerInfo;
    const teklifNo = formData.customerInfo.teklifNo;
    const refNO = formData.customerInfo.offer_number;

    const formatDate = () => {
        return new Intl.DateTimeFormat('tr-TR', {
            year: 'numeric'
        }).format(new Date()).replace(/\./g, ' ');
    };

    const initialGeneralInfo = {
        offerNo: `${formatDate()} / ${teklifNo} `,
        refNo: refNO,
        clientName: customerInfo?.ticariUnvan || "-",
    };

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

    const calculateTotalNetPrice = (rowsArray) => {
        return rowsArray.reduce((sum, row) => {
            // isOptional veya isLocalSupply true ise genel toplama dahil etme
            if (row.isPrice && !row.isUrgent && !row.isOptional && !row.isLocalSupply && row.piece > 0) {
                return sum + (row.netTotal || 0);
            }
            return sum;
        }, 0);
    };
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

        const guncelDil = formData?.customerInfo?.teklifDili || "Yabancı";
        const currency = formData?.customerInfo?.currency || "EUR";
        const exchangeRate = formData?.customerInfo?.exchangeRate || "1";
        const opsiyonelMetni = guncelDil === "Yerli" ? "Opsiyonel" : "Optional";
        const yerindeTedarikMetni = guncelDil === "Yerli" ? "Yerinde Tedarik" : "Supply Locally";

        const updated = activeRows.map(row => {
            if (row.id === id) {
                // Yeni değeri ata
                const updatedRow = { ...row, [field]: val };

                // Eğer biri aktif edildiyse diğer boncuğu söndürelim (çakışmasınlar diye)
                if (field === "isOptional" && val === true) updatedRow.isLocalSupply = false;
                if (field === "isLocalSupply" && val === true) updatedRow.isOptional = false;

                if (field === "piece" || field === "unitPrice" || field === "discount" || field === "isOptional" || field === "isLocalSupply") {
                    const piece = parseFloat(updatedRow.piece) || 0;
                    const unitPrice = parseFloat(updatedRow.unitPrice) || 0;
                    const discount = parseFloat(updatedRow.discount) || 0;

                    // rawTotal her koşulda sayısal kalıyor
                    updatedRow.rawTotal = parseFloat((piece * unitPrice).toFixed(2));

                    if (updatedRow.isOptional) {
                        updatedRow.netTotal = opsiyonelMetni;
                    } else if (updatedRow.isLocalSupply) {
                        updatedRow.netTotal = yerindeTedarikMetni;
                    } else {
                        // İkisi de kapalıysa normal indirimli fiyat hesaplansın
                        updatedRow.netTotal = parseFloat((updatedRow.rawTotal * (1 - discount / 100)).toFixed(2));
                    }
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
            isPrice: selectedType === 3,
            isOptional: false,
            isLocalSupply: false, // Yeni alan default false
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
                    currency={currency}
                    exchangeRate={exchangeRate}
                    initialGeneralInfo={initialGeneralInfo}
                />
            </div>
        </div>
    );
}

export default CapexTablosu;