// src/utils/apiClient.js
import axios from "axios";
import { applyAutoAuthInterceptor } from "./autoAuth"; // 🚀 Evrensel zırhımız

export const apiClient = axios.create({
    // 🚀 URL artık elle yazılmıyor, .env dosyasındaki VITE_URL'den dinamik olarak besleniyor!
    baseURL: import.meta.env.VITE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
});

// 🛡️ Ana istemciye zırhı giydiriyoruz
applyAutoAuthInterceptor(apiClient);

const API = {
    login: async (body) => apiClient.post("auth/login", body),
    getProfile: async () => apiClient.get("auth/profile"),
    logout: async () => apiClient.post("auth/logout")
};

export default API;