// App.jsx
import "./App.css";
import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";

function AppContent() {
  // 🚀 GÜNCELLEME: 'token' bağımlılığını tamamen çöpe atıyoruz.
  // Sadece ve sadece merkezi 'user' nesnesinin varlığına güveniyoruz.
  const { user } = useAuth();

  // Eğer hafızada veya context içinde doğrulanmış bir kullanıcı varsa içeri al, yoksa kapıda tut.
  // Interceptor arkada token yenilerken 'user' nesnesi silinmediği için 
  // uygulama artık asenkron istek anlarında donmayacak veya login'e fırlatmayacak!
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