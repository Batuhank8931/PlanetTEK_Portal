import React, { useEffect, useMemo } from "react";

import IleriAritmaInputSelections from "./ileriAritmaSelections/IleriAritmaInputSelections";
import IleriAritmaPumpSelections from "./ileriAritmaSelections/IleriAritmaPumpSelections";
import IleriAritmaDozajSelections from "./ileriAritmaSelections/IleriAritmaDozajSelections";
import IleriAritmaTankMixerSelections from "./ileriAritmaSelections/IleriAritmaTankMixerSelections";

function IleriAritmaDetail() {
    return (
        <div className="flex flex-col gap-4">
            <IleriAritmaInputSelections
            />
            <IleriAritmaPumpSelections
            />
            <IleriAritmaDozajSelections
            />
            <IleriAritmaTankMixerSelections
            />
        </div>
    );
}

export default IleriAritmaDetail;