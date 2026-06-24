import React from "react";

function SmallLoading({ isLoading, text }) {
  if (!isLoading) return null;

  return (
    <div
      style={{
        position: "fixed", // 🌟 Tüm sayfayı kaplaması için fixed yapıldı
        top: 0, left: 0, width: "100vw", height: "100vh", // 🌟 Ekranı tamamen kilitler
        backgroundColor: "rgba(11, 12, 13, 0.96)", // Koyu ana tema rengiyle full ekran kapatma
        zIndex: 9999, // 🌟 Her şeyin en üstünde durması için z-index yükseltildi
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backdropFilter: "blur(20px)", // Yumuşak premium arka plan bluru
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}
    >
      <div className="d-flex flex-column align-items-center" style={{ width: "280px" }}>
        
        {/* MİNİMAL DÖNEN LOGO ARALIKLARI */}
        <div className="position-relative mb-3" style={{ width: "180px", height: "110px" }}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 800 500" 
            width="100%" 
            height="100%"
            style={{ filter: "drop-shadow(0 0 15px rgba(0, 135, 78, 0.25))" }}
          >
            {/* Sol Koyu Halka */}
            <circle 
              cx="280" 
              cy="250" 
              r="190" 
              fill="none" 
              stroke="#1a1c1d" 
              strokeWidth="90" 
              className="small-circle-left"
            />
            
            {/* Sağ Yeşil Halka */}
            <circle 
              cx="520" 
              cy="250" 
              r="190" 
              fill="none" 
              stroke="#00874e" 
              strokeWidth="90" 
              className="small-circle-right"
            />
          </svg>
        </div>

        {/* TEK PARAMETRİK METİN */}
        {text && (
          <p 
            className="text-white fw-medium text-center m-0 px-2 text-truncate w-100" 
            style={{ fontSize: "13px", color: "#e2e8f0", letterSpacing: "0.2px" }}
          >
            {text}
          </p>
        )}
      </div>

      {/* CSS ANIMATIONS */}
      <style>{`
        .small-circle-left {
          transform-box: fill-box;
          transform-origin: center;
          animation: small-spin-rev 7s linear infinite;
        }
        .small-circle-right {
          transform-box: fill-box;
          transform-origin: center;
          animation: small-spin 5s linear infinite;
        }

        @keyframes small-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes small-spin-rev {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}

export default SmallLoading;