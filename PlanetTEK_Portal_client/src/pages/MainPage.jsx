import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

import SideBar from "../components/SideBar";
import DashBoardPage from "../components/DashBoardPage";
import TeklifPage from "../components/TeklifPage";
import CalculationPage from "../components/CalculationPage";
import FiyatlarPage from "../components/FiyatlarPage";
import KullanicilarPage from "../components/KullanicilarPage";
import MusterilerPage from "../components/MusterilerPage";

const NotFound = () => <h1 className="text-white p-4">404 NOT FOUND</h1>;

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

const pageTransition = {
  duration: 0.25,
  ease: "easeInOut"
};

function AnimatedRoutes({ userRole, HomeComponent }) {
  const location = useLocation();

  const renderAnimatedPage = (Component) => (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
      <Component />
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Ana Sayfa */}
        <Route path="/" element={renderAnimatedPage(HomeComponent)} />

        {/* Ortak Rotalar (Hem Admin hem Satış Temsilcisi) */}
        {(userRole === "Admin" || userRole === "Satış Temsilcisi") && (
          <>
            <Route path="/mainpage" element={renderAnimatedPage(DashBoardPage)} />
            <Route path="/teklif" element={renderAnimatedPage(TeklifPage)} />
          </>
        )}

        {/* Sadece Admin'e Özel Rotalar */}
        {userRole === "Admin" && (
          <>
            <Route path="/musteriler" element={renderAnimatedPage(MusterilerPage)} />
            <Route path="/calculation" element={renderAnimatedPage(CalculationPage)} />
            <Route path="/fiyatlar" element={renderAnimatedPage(FiyatlarPage)} />
            <Route path="/kullanicilar" element={renderAnimatedPage(KullanicilarPage)} />
          </>
        )}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function MainPage() {
  const userRole = localStorage.getItem("userRole");
  const { logout } = useAuth();

  // 🚀 Satış Temsilcisi kontrolü eklendi
  let HomeComponent;
  if (userRole === "Admin" || userRole === "Satış Temsilcisi") {
    HomeComponent = DashBoardPage;
  } else {
    HomeComponent = NotFound;
  }

  return (
    <Router>
      <div className="d-flex" style={{ height: "100vh", overflow: "hidden" }}>
        <SideBar logout={logout} />
        <div
          className="flex-grow-1 p-3"
          style={{
            overflowY: "auto",
            height: "100vh",
            backgroundColor: "#1a2d3a",
          }}
        >
          <AnimatedRoutes userRole={userRole} HomeComponent={HomeComponent} />
        </div>
      </div>
    </Router>
  );
}

export default MainPage;