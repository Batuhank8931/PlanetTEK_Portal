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
    return config;
}, (error) => Promise.reject(error));

// 🛡️ Zırhı giydiriyoruz
applyAutoAuthInterceptor(crudClient);

const API = {
    // ==========================================
    // 👥 KULLANICI CRUD İSTEKLERİ
    // ==========================================

    // 🔍 1. Kullanıcı Listeleme (GET api/user)
    getUser: async (userId = null) => {
        const url = userId ? `api/user?id=${userId}` : "api/user";

        try {
            const res = await crudClient.get(url);
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
    },

    // ==========================================
    // 💰 FİYAT VE PARAMETRE (PRICE DATA) İSTEKLERİ
    // ==========================================

    // 🔍 Main Units Listesi Getir
    getMainUnits: async () => {
        return crudClient.get("api/price/main-units");
    },

    // 🔍 Screen Data Listesi Getir
    getScreenData: async () => {
        return crudClient.get("api/price/screen-data");
    },

    // 🔍 Lamella Data Listesi Getir
    getLamellaData: async () => {
        return crudClient.get("api/price/lamella-data");
    },

    // 🔍 Stainless Steel Data Listesi Getir
    getStainlessSteelData: async () => {
        return crudClient.get("api/price/stainless-steel");
    },

    // 🔍 Flow Distribution Listesi Getir
    getFlowDistribution: async () => {
        return crudClient.get("api/price/flow-distribution");
    },

    // 🔍 Unit Labor Costs Listesi Getir
    getUnitLaborCosts: async () => {
        return crudClient.get("api/price/unit-labor-costs");
    },

    // 🔍 Unit Labor Costs Listesi Getir
    getSubmersibleCosts: async () => {
        return crudClient.get("api/price/submersible-pumps-costs");
    },

    // 🔍 Unit Labor Costs Listesi Getir
    getFiltrationCosts: async () => {
        return crudClient.get("api/price/filtration-costs");
    },

    // 🔄 Dinamik Fiyat / Parametre Güncelleme (POST api/price/update)
    updatePriceData: async (payload) => {
        try {
            const res = await crudClient.post("api/price/update", payload);
            return res;
        } catch (err) {
            console.error("❌ [API.updatePriceData] Fiyat güncellenirken hata oluştu:", {
                status: err.response?.status,
                message: err.message,
                responseData: err.response?.data
            });
            throw err;
        }
    }
};

export default API;