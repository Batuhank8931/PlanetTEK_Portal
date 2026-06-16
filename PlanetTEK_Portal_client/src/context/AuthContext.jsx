import { createContext, useContext, useState } from "react";
import API from "../utils/apiClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Eski sistemdeki 'token' state'i yerine artık güvenli 'user' nesnesini koyuyoruz
  const [user, setUser] = useState(() => {
    // Sayfa yenilendiğinde kullanıcı adını geçici olarak hafızada tutmak istersen:
    const savedUser = localStorage.getItem("userName");
    const savedRole = localStorage.getItem("userRole");
    const savedId = localStorage.getItem("userId");

    if (savedUser && savedRole && savedId) {
      return { id: savedId, name: savedUser, role: savedRole };
    }
    return null;
  });

  const login = async (taken_username, taken_password) => {
    const body = { username: taken_username, password: taken_password };

    try {
      const response = await API.login(body);
      console.log("Backend Yanıtı:", response.data);

      const userData = response.data.user;
      setUser(userData);

      localStorage.setItem("userName", userData.name);
      localStorage.setItem("userRole", userData.role);
      localStorage.setItem("userId", userData.id);

    } catch (error) {
      console.error("Context içinde yakalanan hata:", error.message);

      // 🚀 SİHİRLİ DOKUNUŞLAR HERE:
      // 1. Kullanıcı giriş yapamadığı için state'i kesin olarak sıfırla
      setUser(null);

      // 2. Eski hayalet localStorage verileri varsa temizle ki App.jsx'in kafası karışmasın
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");

      // 3. Hatayı yukarı fırlat ki LoginPage'deki try-catch bunu yakalayabilsin!
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Backend'deki çerezi temizleyen endpoint'i tetikle (isteğe bağlı)
      await API.logout().catch(() => { });
    } finally {
      // Hafızayı temizle ve kapıyı kapat
      setUser(null);
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
    }
  };

  // Eski kodundaki gibi 'token' kelimesine bağımlı yerler varsa patlamasın diye, 
  // 'token' yerine doğrudan 'user' varlığını boolean (true/false) olarak fırlatıyoruz!
  return (
    <AuthContext.Provider value={{ token: !!user, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}