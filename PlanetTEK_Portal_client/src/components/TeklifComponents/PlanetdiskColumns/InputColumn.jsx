import React, { useEffect } from "react";
import InputParameters from "./InputColumnDetailes/InputParametersDetail";
import DiskParameters from "./InputColumnDetailes/DıskParametersDetail";
import LamellaParameters from "./InputColumnDetailes/LamellaParameterDetail";

function InputColumn() {

  return (
    <div className="card border-0 text-white h-100" style={{ backgroundColor: "#1a1c1d", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
      {/* gap-3 eklenerek tüm elemanların alt alta sıralı ve dengeli durması sağlandı */}
      <InputParameters/>
      <DiskParameters/>
      <LamellaParameters/>
    </div>
  );
}

export default InputColumn;