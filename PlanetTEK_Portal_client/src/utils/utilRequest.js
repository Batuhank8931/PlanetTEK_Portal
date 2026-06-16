// src/utils/utilRequest.js
import axios from "axios";
import { applyAutoAuthInterceptor } from "./autoAuth";

const crudClient = axios.create({
    baseURL: import.meta.env.VITE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
});

// 🔍 [İstek Öncesi Röntgeni]: crudClient ile giden her isteği yola çıkmadan yakala
crudClient.interceptors.request.use((config) => {
    console.log(`📡 [crudClient Request] Yola Çıkıyor: ${config.method.toUpperCase()} -> ${config.url}`);
    console.log(`🍪 [crudClient Request] withCredentials Aktif mi?:`, config.withCredentials);
    return config;
}, (error) => Promise.reject(error));

// 🛡️ Zırhı giydiriyoruz
applyAutoAuthInterceptor(crudClient);

const API = {
    // 🔍 1. Kullanıcı Listeleme (GET api/user)
    getUser: async (userId = null) => {
        const url = userId ? `api/user?id=${userId}` : "api/user";
        console.log(`🚀 [API.getUser] Tetiklendi. URL: ${url}`);

        try {
            const res = await crudClient.get(url);
            console.log("✅ [API.getUser] BAŞARILI yanıt döndü:", res.status);
            return res;
        } catch (err) {
            console.error("❌ [API.getUser] HATA bloğuna düştü! Detay:", {
                status: err.response?.status,
                message: err.message,
                responseData: err.response?.data
            });
            throw err;
        }
    },

    // 👥 2. Kullanıcı Ekleme (POST api/user)
    addUser: async (userData) => {
        return crudClient.post("api/user", userData);
    },

    // 🔄 3. Kullanıcı Güncelleme (PUT api/user/:id)
    putUser: async (userId, updateData) => {
        return crudClient.put(`api/user/${userId}`, updateData);
    },

    // ❌ 4. Kullanıcı Silme (DELETE api/user/:id)
    deleteUser: async (userId) => {
        return crudClient.delete(`api/user/${userId}`);
    }
};

export default API;