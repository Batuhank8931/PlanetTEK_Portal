import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import pt_icon from "../assets/img/pt_icon.png";

function SideBar({ logout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserInfo, setShowUserInfo] = useState(false);

  // Ekranın mobil mi masaüstü mü olduğunu dinamik takip eden state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const userRole = localStorage.getItem("userRole");
  const userName = localStorage.getItem("userName");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const adminItems = [
    { label: "Ana Sayfa", path: "/mainpage", icon: "bi-house-door" },
    { label: "Teklif", path: "/teklif", icon: "bi-file-earmark-text" },
    { label: "Müşteriler", path: "/musteriler", icon: "bi-people" }, // Yeni ikon
    { label: "Katsayılar", path: "/calculation", icon: "bi-calculator" },
    { label: "Fiyatlar", path: "/fiyatlar", icon: "bi-tags" },
    { label: "Kullanıcılar", path: "/kullanicilar", icon: "bi-person-gear" }, // İpucu: Bunu da değiştirebilirsin!
  ];

  const userItems = [
    { label: "İstekler", path: "/requestslist", icon: "bi-inbox" },
  ];

  const currentItems = userRole === "Admin" ? adminItems : userItems;

  return (
    <div
      className={`d-flex flex-row flex-md-column align-items-center text-white p-2 p-md-3 ${isMobile ? "fixed-top w-100" : "sticky-top"
        }`}
      style={{
        backgroundColor: "#1a1c1d",
        height: isMobile ? "60px" : "100vh",
        width: isMobile ? "100%" : "70px",
        minWidth: isMobile ? "100%" : "70px",
        borderRight: isMobile ? "none" : "1px solid #2d3032",
        borderBottom: isMobile ? "1px solid #2d3032" : "none",
        zIndex: 1050,
      }}
    >
      {/* Logo Bölümü */}
      <div
        className="d-flex justify-content-center align-items-center rounded-circle bg-white bg-opacity-10"
        style={{
          width: isMobile ? "40px" : "44px",
          height: isMobile ? "40px" : "44px",
          flexShrink: 0
        }}
      >
        <img src={pt_icon} alt="pt_icon" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
      </div>

      {/* Masaüstü için Ayırıcı Çizgi */}
      <hr className="d-none d-md-block w-70 my-3 text-secondary" />

      {/* Menü Alanı (İkonlar) */}
      <div className="d-flex flex-row flex-md-column gap-1 gap-md-2 flex-grow-1 justify-content-start align-items-center ms-3 ms-md-0 w-100 overflow-visible">
        {currentItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <div key={item.label} className="position-relative d-flex justify-content-center align-items-center">
              <button
                className="btn border-0 d-flex justify-content-center align-items-center p-0"
                style={{
                  width: isMobile ? "40px" : "48px",
                  height: isMobile ? "40px" : "44px",
                  borderRadius: "10px",
                  backgroundColor: active ? "#00874e" : "transparent",
                  color: active ? "#ffffff" : "#a0a5a8",
                  transition: "all 0.2s ease"
                }}
                onClick={() => navigate(item.path)}
              >
                <i className={`bi ${item.icon}`} style={{ fontSize: isMobile ? "1.15rem" : "1.25rem" }}></i>
              </button>

              {/* Sadece Masaüstünde Çıkan Tooltip */}
              <div
                className="d-none d-md-block position-absolute bg-dark text-white text-nowrap p-2 rounded shadow border border-secondary"
                style={{
                  left: "60px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "0.8rem",
                  opacity: 0,
                  pointerEvents: "none",
                  transition: "opacity 0.2s ease",
                  zIndex: 1200
                }}
                ref={(el) => {
                  if (el && el.parentElement) {
                    el.parentElement.onmouseenter = () => el.style.opacity = "1";
                    el.parentElement.onmouseleave = () => el.style.opacity = "0";
                  }
                }}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Alt Kısım / Footer (Info & Logout) */}
      <div className="d-flex flex-row flex-md-column align-items-center gap-2 ms-auto ms-md-0 mt-md-auto overflow-visible">

        {/* Bilgi (Info) Butonu */}
        {userRole && (
          <div className="position-relative d-flex justify-content-center align-items-center">
            <button
              className={`btn border-0 d-flex justify-content-center align-items-center rounded-circle`}
              style={{
                height: "40px",
                width: "40px",
                color: showUserInfo ? "#00874e" : "#a0a5a8",
                backgroundColor: showUserInfo ? "rgba(255,255,255,0.05)" : "transparent"
              }}
              onClick={() => setShowUserInfo(!showUserInfo)}
            >
              <i className="bi bi-info-circle" style={{ fontSize: "1.2rem" }}></i>
            </button>

            {/* Bilgi Kutusu (Popover) */}
            {showUserInfo && (
              <div
                className="position-absolute p-3 rounded-3 shadow bg-dark text-white border border-secondary"
                style={{
                  bottom: isMobile ? "auto" : "50px",
                  top: isMobile ? "50px" : "auto",
                  left: isMobile ? "auto" : "55px",
                  right: isMobile ? "0px" : "auto",
                  width: "220px",
                  zIndex: 1300,
                  fontSize: "0.85rem",
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="fw-bold" style={{ color: "#00874e" }}>PROFİL</div>
                  <button className="btn-close btn-close-white p-1" style={{ fontSize: '0.6rem' }} onClick={() => setShowUserInfo(false)}></button>
                </div>
                <div className="mt-1"><strong>Rol:</strong> {userRole}</div>
                <div><strong>Ad:</strong> {userName}</div>
                <hr className="my-2 border-secondary" />
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                  {window.location.origin}/
                </div>
              </div>
            )}
          </div>
        )}

        {/* Çıkış Butonu */}
        <button
          className="btn btn-link link-danger text-decoration-none d-flex justify-content-center align-items-center p-0"
          style={{ height: "40px", width: "40px" }}
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-left" style={{ fontSize: "1.25rem" }}></i>
        </button>
      </div>
    </div>
  );
}

export default SideBar;