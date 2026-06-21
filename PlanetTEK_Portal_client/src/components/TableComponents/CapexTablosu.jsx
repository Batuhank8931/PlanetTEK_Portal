// CapexTablosu.js
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useTeklifStore } from "../../utils/teklifStore";
import CapexTableView from "./CapexTableView";
import capexHesapFonksiyonu from "../../utils/CapexHesap";

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

    const teklifDili = formData?.customerInfo?.teklifDili || "Yerli";
    const storeCapex = formData?.tables?.capextablosu;

    const [loading, setLoading] = useState(false);
    const [localRows, setLocalRows] = useState([]);

    const priceData = useMemo(() => {
        return {
            screens: [], 
            pumps: [],
            isYurtIci: teklifDili === "Yerli"
        };
    }, [teklifDili]);

    const updateStore = useCallback((updatedRows) => {
        const finalRowsWithNumbers = generateWBSNumbers(updatedRows);
        setLocalRows(finalRowsWithNumbers);
        updateSection("tables", {
            ...formData?.tables,
            capextablosu: finalRowsWithNumbers
        });
    }, [formData?.tables, updateSection]);

    useEffect(() => {
        if (storeCapex && storeCapex.length > 0) {
            setLocalRows(storeCapex);
            return;
        }

        async function fetchAndCalculateCapex() {
            setLoading(true);
            try {
                const rawInitialData = await capexHesapFonksiyonu(formData, priceData);
                const initialDataWithNo = generateWBSNumbers(rawInitialData);
                
                setLocalRows(initialDataWithNo);
                updateSection("tables", {
                    ...formData?.tables,
                    capextablosu: initialDataWithNo
                });
            } catch (error) {
                console.error("CAPEX tablosu hesaplanırken hata oluştu:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAndCalculateCapex();
    }, [storeCapex, priceData]); 

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const rawFreshData = await capexHesapFonksiyonu(formData, priceData);
            const freshDataWithNo = generateWBSNumbers(rawFreshData);
            updateSection("tables", {
                ...formData?.tables,
                capextablosu: freshDataWithNo
            });
            setLocalRows(freshDataWithNo);
        } catch (error) {
            console.error("Yenileme sırasında hata:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCellChange = (id, field, val) => {
        const activeRows = storeCapex && storeCapex.length > 0 ? storeCapex : localRows;
        const updated = activeRows.map(row => {
            if (row.id === id) {
                const updatedRow = { ...row, [field]: val };
                if (field === "piece" || field === "unitPrice" || field === "discount") {
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
        const activeRows = storeCapex && storeCapex.length > 0 ? storeCapex : localRows;
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
        const activeRows = storeCapex && storeCapex.length > 0 ? storeCapex : localRows;
        const updated = activeRows.filter(row => String(row.id) !== String(id));
        updateStore(updated);
    };

    return (
        /* 🚀 DEĞİŞİKLİK: 
          w-100 yanına "overflow-x: 'auto'" eklendi. 
          Böylece tablo ekran dışına taşarsa telefonda otomatik kaydırma çubuğu çıkacak.
        */
        <div className="w-100" style={{ position: "relative", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            {/* Loading Arayüzü */}
            {loading && (
                <div style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(255,255,255,0.7)",
                    zIndex: 10,
                    display: "flex", justifyContent: "center", alignItems: "center",
                    fontWeight: "bold", color: "#333"
                }}>
                    <span>Fiyatlar Güncelleniyor ve Tablo Hesaplanıyor...</span>
                </div>
            )}

            {/* 🚀 TAVSİYE/DÜZENLEME:
              Tablonun geniş ekranda normal, mobilde ise sıkışmadan minimum 900px genişlikte 
              kalması ve düzgün scroll edilebilmesi için sarmalayıcı bir div daha ekledik.
            */}
            <div style={{ minWidth: "950px" }}>
                <CapexTableView
                    numberedRows={storeCapex && storeCapex.length > 0 ? storeCapex : localRows}
                    handleCellChange={handleCellChange}
                    insertAfterRow={insertAfterRow}
                    deleteRow={deleteRow}
                    handleRefresh={handleRefresh}
                    teklifDili={teklifDili}
                    historyLength={0}
                />
            </div>
        </div>
    );
}

export default CapexTablosu;