import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion"; // 🚀 Framer Motion eklendi

import SideBar from "../components/SideBar";
import DashBoardPage from "../components/DashBoardPage";
import TeklifPage from "../components/TeklifPage";
import CalculationPage from "../components/CalculationPage";
import FiyatlarPage from "../components/FiyatlarPage";
import KullanicilarPage from "../components/KullanicilarPage";
import MusterilerPage from "../components/MusterilerPage";

// 404 Bileşeni
const NotFound = () => <h1 className="text-white p-4">404 NOT FOUND</h1>;

// 🚀 Sayfa geçiş animasyonlarının şablonu (Yumuşak Opaklık ve Hafif Yukarı Kayma)
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

const pageTransition = {
  duration: 0.25,
  ease: "easeInOut"
};

// 🚀 Animasyonlu Rotaları Yöneten İç Bileşen
function AnimatedRoutes({ userRole, HomeComponent }) {
  const location = useLocation(); // Rota değişimlerini yakalamak için şart

  return (
    // mode="wait": Eski sayfa tamamen kaybolmadan yenisi başlamaz, çakışmayı önler
    <AnimatePresence mode="wait">
      {/* Her rota değiştiğinde AnimatePresence'ın bunu anlaması için location.pathname'i key olarak veriyoruz */}
      <Routes location={location} key={location.pathname}>
        <Route 
          path="/" 
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
              <HomeComponent />
            </motion.div>
          } 
        />

        {userRole === "Admin" && (
          <>
            <Route path="/mainpage" element={
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <DashBoardPage />
              </motion.div>
            } />
            <Route path="/teklif" element={
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <TeklifPage />
              </motion.div>
            } />
            <Route path="/musteriler" element={
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <MusterilerPage />
              </motion.div>
            } />
            <Route path="/calculation" element={
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <CalculationPage />
              </motion.div>
            } />
            <Route path="/fiyatlar" element={
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <FiyatlarPage />
              </motion.div>
            } />
            <Route path="/kullanicilar" element={
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <KullanicilarPage />
              </motion.div>
            } />
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

  let HomeComponent;
  if (userRole === "Admin") {
    HomeComponent = DashBoardPage;
  } else if (userRole === "Requester") {
    HomeComponent = CreateRequest; // Not: Eğer importu yoksa hata vermemesi için kontrol edin
  } else if (userRole === "Reviewer") {
    HomeComponent = ViewRequest;   // Not: Eğer importu yoksa hata vermemesi için kontrol edin
  } else {
    HomeComponent = NotFound;
  }

  return (
    <Router>
      <div className="d-flex" style={{ height: "100vh", overflow: "hidden" }}>
        {/* Sidebar */}
        <SideBar logout={logout} />

        {/* Main content area */}
        <div
          className="flex-grow-1 p-3"
          style={{
            overflowY: "auto",
            height: "100vh",
            backgroundColor: "#1a2d3a",
          }}
        >
          {/* Animasyonları ve Rotaları çalıştıran alt bileşeni buraya çağırıyoruz */}
          <AnimatedRoutes userRole={userRole} HomeComponent={HomeComponent} />
        </div>
      </div>
    </Router>
  );
}

export default MainPage;