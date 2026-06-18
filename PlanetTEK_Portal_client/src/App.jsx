// App.jsx
import "./App.css";
import { useEffect } from "react"; // 👈 useEffect'i ekledik
import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";

function AppContent() {
  const { user, logout } = useAuth(); // 👈 Context'indeki logout fonksiyonunu çek (ismi clearUser vb. ise ona göre düzelt)

  useEffect(() => {
    // 🎧 autoAuth'tan gelecek sinyali dinleyen kulaklık
    const handleAuthFailure = () => {
      console.log("🔒 [App] Sinyal alındı! Token bitti, giriş sayfasına yönlendiriliyorsunuz...");
      if (logout) {
        logout(); // Kullanıcı nesnesini null yapar
      }
    };

    // Dinleyiciyi tarayıcıya ekle
    window.addEventListener("auth-failure", handleAuthFailure);

    // Bileşen kapandığında hafıza sızıntısı olmasın diye temizle
    return () => {
      window.removeEventListener("auth-failure", handleAuthFailure);
    };
  }, [logout]);

  // user null olduğu an LoginPage otomatik ekrana basılır!
  return user ? <MainPage /> : <LoginPage />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;