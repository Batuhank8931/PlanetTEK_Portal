//mainpage.jsx

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


import SideBar from "../components/SideBar";


import DashBoardPage from "../components/DashBoardPage";
import TeklifPage from "../components/TeklifPage";
import CalculationPage from "../components/CalculationPage";
import FiyatlarPage from "../components/FiyatlarPage";
import KullanicilarPage from "../components/KullanicilarPage";
import MusterilerPage from "../components/MusterilerPage";


// Simple 404 Component
const NotFound = () => <h1>404 NOT FOUND</h1>;

function MainPage() {
  const userRole = localStorage.getItem("userRole"); // get the role
  const { logout } = useAuth(); // get logout from auth context

  // Determine the component to render at "/"
  let HomeComponent;
  if (userRole === "Admin") {
    HomeComponent = DashBoardPage;
  } else if (userRole === "Requester") {
    HomeComponent = CreateRequest;
  } else if (userRole === "Reviewer") {
    HomeComponent = ViewRequest;
  } else {
    HomeComponent = NotFound;
  }

  return (
    <Router>
      <div className="d-flex" style={{ height: "100vh", overflow: "hidden" }}>
        {/* Sidebar — fixed height */}
        <SideBar logout={logout} />

        {/* Main content area — scrollable */}
        <div
          className="flex-grow-1 p-3"
          style={{
            overflowY: "auto",
            height: "100vh",
            backgroundColor: "#1a2d3a",
          }}
        >
          <Routes>
            <Route path="/" element={<HomeComponent />} />

            {userRole === "Admin" && (
              <>
                <Route path="/mainpage" element={<DashBoardPage />} />
                <Route path="/teklif" element={<TeklifPage />} />
                <Route path="/musteriler" element={<MusterilerPage />} />
                <Route path="/calculation" element={<CalculationPage />} />
                <Route path="/fiyatlar" element={<FiyatlarPage />} />
                <Route path="/kullanicilar" element={<KullanicilarPage />} />
              </>
            )}

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </Router>

  );
}

export default MainPage;


