import React, { useEffect } from "react";
import hesaplaDiskKatsayisiDetayli from "../../../utils/hesaplaDiskKatsayisiDetayli";
import InputParameters from "./InputColumnDetailes/InputParametersDetail";
import DiskParameters from "./InputColumnDetailes/DıskParametersDetail";
import LamellaParameters from "./InputColumnDetailes/LamellaParameterDetail";

function InputColumn({ data, updateData }) {

  return (
    <div className="card border-0 text-white h-100" style={{ backgroundColor: "#1a1c1d", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
      {/* gap-3 eklenerek tüm elemanların alt alta sıralı ve dengeli durması sağlandı */}
      <InputParameters
        data={data}
        updateData={updateData}
      />
      <DiskParameters
        data={data}
        updateData={updateData}
      />
      <LamellaParameters
        data={data}
        updateData={updateData}
      />
    </div>
  );
}

export default InputColumn;