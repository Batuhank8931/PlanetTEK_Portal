import React, { useState } from "react"; // 👈 useState ekledik
import { useTeklifStore } from "../../../utils/teklifStore";

import IleriAritmaInputSelections from "./ileriAritmaSelections/IleriAritmaInputSelections";
import IleriAritmaPumpSelections from "./ileriAritmaSelections/IleriAritmaPumpSelections";
import IleriAritmaDozajSelections from "./ileriAritmaSelections/IleriAritmaDozajSelections";
import IleriAritmaTankMixerSelections from "./ileriAritmaSelections/IleriAritmaTankMixerSelections";

function IleriAritmaDetail() {
    const resetIleriAritma = useTeklifStore((state) => state.resetIleriAritma);
    
    // 🔄 Ögeyi sıfırdan var etmek için benzersiz bir anahtar (key) statesi
    const [refreshKey, setRefreshKey] = useState(0);

    const handleCleanAndRefresh = () => {
        // 1. Store'u tamamen uçur (Burada senin yazdığın "ileriAritma: {}" veya delete'li kod çalışabilir)
        resetIleriAritma();
        
        // 2. Key'i değiştirerek tüm alt bileşenleri DOM'dan silip sıfırdan render olmaya zorla!
        setRefreshKey(prev => prev + 1);
    };

    return (
        // 🌟 key prop'u değiştiği an bu div ve içindeki her şey hard-reset yemiş gibi sıfırlanır
        <div className="flex flex-col gap-4" key={refreshKey}>
            <IleriAritmaInputSelections
                onReset={handleCleanAndRefresh} // 👈 Yeni tetikleyiciyi verdik
            />
            <IleriAritmaPumpSelections />
            <IleriAritmaDozajSelections />
            <IleriAritmaTankMixerSelections />
        </div>
    );
}

export default IleriAritmaDetail;