import React, { useState } from "react";
import { useTeklifStore } from "../../../utils/teklifStore";

import IleriAritmaInputSelections, { DEFAULT_INPUT_VALUES } from "./ileriAritmaSelections/IleriAritmaInputSelections";
import IleriAritmaPumpSelections from "./ileriAritmaSelections/IleriAritmaPumpSelections";
import IleriAritmaTankMixerSelections from "./ileriAritmaSelections/IleriAritmaTankMixerSelections";
import IleriAritmaDozajSelections from "./ileriAritmaSelections/IleriAritmaDozajSelections";

function IleriAritmaDetail() {
    const resetIleriAritma = useTeklifStore((state) => state.resetIleriAritma);
    
    // 🔄 Yenileme anahtarı
    const [refreshKey, setRefreshKey] = useState(0);

    // 🌊 Pompadan Mikser'e aktarılan Geri Devir Debisi (m³/h)
    const [geriDevirDebisi, setGeriDevirDebisi] = useState(0);

    // 🧪 Input bileşeninden gelen parametreler (Dozaj bileşenine aktarılacak)
    const [inputParams, setInputParams] = useState(DEFAULT_INPUT_VALUES);

    const handleCleanAndRefresh = () => {
        resetIleriAritma();
        setGeriDevirDebisi(0);
        setInputParams(DEFAULT_INPUT_VALUES);
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="flex flex-col gap-4" key={refreshKey}>
            {/* Input parametrelerindeki değişim parent state'e aktarılır */}
            <IleriAritmaInputSelections
                onReset={handleCleanAndRefresh}
                onParamsChange={setInputParams}
            />
            
            {/* Pompa seçimi ve oluşan debi */}
            <IleriAritmaPumpSelections 
                onFlowChange={setGeriDevirDebisi} 
            />
            
            {/* Mikser seçimi (Debiye bağlı) */}
            <IleriAritmaTankMixerSelections 
                geriDevirDebisi={geriDevirDebisi} 
            />
            
            {/* Dozaj seçimi (Input parametrelerine bağlı) */}
            <IleriAritmaDozajSelections 
                inputParams={inputParams} 
            />
        </div>
    );
}

export default IleriAritmaDetail;