import React from "react";

function LoadingEkrani({
  isGenerating,
  generatingModuleName,
  version = "PRO-V1",
}) {
  if (!isGenerating) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11, 12, 13, 0.31)",
        backdropFilter: "blur(10px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* LOGO ALANI (3D Perspektif Eklendi) */}
        <div
          style={{
            position: "relative",
            width: 320,
            height: 180,
            marginBottom: 40,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            perspective: "800px", // 3D derinlik hissi için şart
          }}
        >
          {/* Koyu halka */}
          <div className="orbit-container orbit-dark">
            <div className="ring dark-ring" />
          </div>

          {/* Yeşil halka */}
          <div className="orbit-container orbit-green">
            <div className="ring green-ring" />
          </div>
        </div>

        {/* Yazılar */}
        <span
          style={{
            color: "#ffffff90",
            fontSize: 10,
            letterSpacing: 3,
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          SİSTEM ENTEGRASYONU
        </span>

        <h5
          style={{
            color: "white",
            margin: 0,
            fontWeight: 500,
            textAlign: "center",
            minHeight: "1.5em",
          }}
        >
          {generatingModuleName || "Veriler işleniyor..."}
        </h5>

        <span
          style={{
            marginTop: 50,
            color: "#ffffff50",
            fontSize: 9,
            letterSpacing: 1,
            textAlign: "center",
          }}
        >

        </span>
      </div>

      <style>{`
        .orbit-container {
          position: absolute;
          top: 15px;
          transform-style: preserve-3d; /* Çocuk elementlerin de 3D uzayda kalmasını sağlar */
        }

        /* Her iki halka da aynı sürede (1.4s) döner ancak yeşil olan 
          tam döngünün yarısı kadar (0.7s) geriden başlar.
        */
        .orbit-dark {
          animation: orbit3D 1.4s ease-in-out infinite;
        }

        .orbit-green {
          animation: orbit3D 1.4s ease-in-out infinite;
          animation-delay: -0.7s; /* Tam zıt fazda olmaları için negatif delay */
        }

        .ring {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          border: 35px solid;
          box-sizing: border-box;
        }

        .dark-ring {
          border-color: #1a1c1d;
        }

        .green-ring {
          border-color: #00874e;
          box-shadow: 0 0 25px rgba(0,135,78,0.25);
        }

        /* YENİ 3D AKIŞKAN ANİMASYON:
          - translateX ile sağa sola kayarken, rotateY(45deg) ile derinlik veriyoruz.
          - z-index (veya translateZ) geçişleri %25 ve %75'te CSS tarafından 
            yumuşakça işlendiği için renk kırılması/keskinliği tamamen yok olur.
        */
        @keyframes orbit3D {
          0% {
            transform: translateX(-43px) rotateY(-15deg) translateZ(-10px);
            z-index: 1;
          }
          25% {
            /* Tam orta kesişim noktalarından birinde öne geçiş */
            z-index: 2; 
          }
          50% {
            transform: translateX(43px) rotateY(15deg) translateZ(10px);
            z-index: 2;
          }
          75% {
            /* Diğer kesişimde arkaya geçiş */
            z-index: 1;
          }
          100% {
            transform: translateX(-43px) rotateY(-15deg) translateZ(-10px);
            z-index: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default LoadingEkrani;