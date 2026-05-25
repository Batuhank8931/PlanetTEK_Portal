import React, { useEffect, useMemo } from "react";

import IleriAritmaInputSelections from "./ileriAritmaSelections/IleriAritmaInputSelections";
import IleriAritmaPumpSelections from "./ileriAritmaSelections/IleriAritmaPumpSelections";
import IleriAritmaDozajSelections from "./ileriAritmaSelections/IleriAritmaDozajSelections";
import IleriAritmaTankMixerSelections from "./ileriAritmaSelections/IleriAritmaTankMixerSelections";

function IleriAritmaDetail({ data, updateData }) {
    return (
        <div className="flex flex-col gap-4">
            <IleriAritmaInputSelections
                data={data} updateData={updateData}
            />
            <IleriAritmaPumpSelections
                data={data} updateData={updateData}
            />
            <IleriAritmaDozajSelections
                data={data} updateData={updateData}
            />
            <IleriAritmaTankMixerSelections
                data={data} updateData={updateData}
            />
        </div>
    );
}

export default IleriAritmaDetail;