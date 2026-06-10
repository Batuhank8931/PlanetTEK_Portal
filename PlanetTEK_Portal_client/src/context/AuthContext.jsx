import { createContext, useContext, useState, useEffect } from "react";
import API from "../utils/utilRequest";
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    // Load token from localStorage when app first loads
    return localStorage.getItem("authToken");
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  }, [token]);

  const login = async (taken_username, taken_password) => {
    const body = { username: taken_username, password: taken_password };

    try {
      const response = await API.login(body);
      console.log(response);
      setToken(response.data.token);
      const user_role = response.data.user.role;
      const user_id = response.data.user.id
      localStorage.setItem("userName", taken_username);
      localStorage.setItem("userRole", user_role);
      localStorage.setItem("userId", user_id);
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
