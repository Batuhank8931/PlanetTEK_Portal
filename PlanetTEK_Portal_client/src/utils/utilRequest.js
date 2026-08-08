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

    // 🔍 Submersible Costs Listesi Getir
    getSubmersibleCosts: async () => {
        return crudClient.get("api/price/submersible-pumps-costs");
    },

    // 🔍 Filtration Costs Listesi Getir
    getFiltrationCosts: async () => {
        return crudClient.get("api/price/filtration-costs");
    },

    // 🔍 Filtration Costs Listesi Getir
    getMembraneCosts: async () => {
        return crudClient.get("api/price/membrane-costs");
    },

    // 🔍 Sludge Dewatering Costs Listesi Getir
    getSludgeDewateringCosts: async () => {
        return crudClient.get("api/price/sludge-dewatering-costs");
    },

    // 🔍 Sludge Dewatering Costs Listesi Getir
    getIlerAritmaEquipmentsCosts: async () => {
        return crudClient.get("api/price/ileri-aritma-costs");
    },

    // 📊 1. Belirli Bir Pompanın Eğrisini Getir (GET api/price/pump-curve/:pump_id)
    getPumpCurve: async (pumpId) => {
        try {
            const res = await crudClient.get(`api/price/pump-curve/${pumpId}`);
            return res;
        } catch (err) {
            console.error(`❌ [API.getPumpCurve] Pompa eğrisi (ID: ${pumpId}) çekilirken hata oluştu:`, {
                status: err.response?.status,
                message: err.message,
                responseData: err.response?.data
            });
            throw err;
        }
    },

    // 📊 2. Belirli Bir Pompanın Eğrisini Güncelle (PUT api/price/pump-curve/:pump_id)
    // payload yapısı: { points: [ { flow_rate: 1.5, head_mss: 14.5 }, ... ] }
    updatePumpCurve: async (pumpId, payload) => {
        try {
            const res = await crudClient.put(`api/price/pump-curve/${pumpId}`, payload);
            return res;
        } catch (err) {
            console.error(`❌ [API.updatePumpCurve] Pompa eğrisi (ID: ${pumpId}) güncellenirken hata oluştu:`, {
                status: err.response?.status,
                message: err.message,
                responseData: err.response?.data
            });
            throw err;
        }
    },

    getParamteters: async () => {
        return crudClient.get("api/parameters");
    },

    updateParametersData: async (payload) => {
        try {
            const res = await crudClient.post("api/parameters/update", payload);
            return res;
        } catch (err) {
            console.error("❌ [API.updateParametersData] Parametreler güncellenirken hata oluştu:", {
                status: err.response?.status,
                message: err.message,
                responseData: err.response?.data
            });
            throw err;
        }
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
    },

    // API objesinin içine (Örn: getSludgeDewateringCosts'un altına) ekle:

    // 🔍 Tüm pompaları eğri dataları (mssData) ile birlikte listeler
    getAllPumpsWithCurves: async () => {
        try {
            const res = await crudClient.get("api/price/pumps-with-curves");
            return res;
        } catch (err) {
            console.error("❌ [API.getAllPumpsWithCurves] Eğrili pompa listesi çekilemedi:", {
                status: err.response?.status,
                message: err.message,
                responseData: err.response?.data
            });
            throw err;
        }
    },

    getCentrifugePumps: async () => {
        try {
            const res = await crudClient.get("api/price/centrifuge-pumps");
            return res;
        } catch (err) {
            console.error("❌ [API.ggetCentrifugePumps] Santrifüj pompa listesi çekilemedi:", {
                status: err.response?.status,
                message: err.message,
                responseData: err.response?.data
            });
            throw err;
        }
    },
    // 📝 Teklif Oluşturma ve Kaydetme
    sendFormData: async (formData) => {
        return crudClient.post("/api/sendFormData", formData);
    },

    // 🔍 Teklife Ait Dosyaları (Word, PDF, Excel) Listeleme
    getTeklifData: async (offerNumber, customerId = null) => {
        return crudClient.post("/api/getTeklifData", {
            offer_number: offerNumber,
            customer_id: customerId, // 👈 customer_id eklendi
        });
    },

    // 📄 Teklif Dosyasını İndirme (Blob)
    getDocData: async (offerNumber, fileType = "docx", customerId = null) => {
        return crudClient.post(
            "/api/getDocData",
            { offer_number: offerNumber, file_type: fileType, customer_id: customerId },
            { responseType: "blob" } // ⚠️ Dosya indirme (binary) işlemleri için gereklidir
        );
    },
    getAllOffers: async (params = {}) => {
        return crudClient.get("/api/getAllOffers", { params });
    },
    // ==========================================
    // 🏢 MÜŞTERİ CRUD İSTEKLERİ
    // ==========================================

    // 🔍 1. Müşteri Listesi Getirme (POST api/getCustomers)
    getCustomers: async (filterData = {}) => {
        try {
            const res = await crudClient.post("api/getCustomers", filterData);
            return res;
        } catch (err) {
            console.error("❌ [API.getCustomers] HATA bloğuna düştü! Detay:", {
                status: err.response?.status,
                message: err.message,
                responseData: err.response?.data
            });
            throw err;
        }
    },

    // 🎯 2. Tek Müşteri Detayı Getirme - Modal için (GET api/getCustomer/:id)
    getCustomerById: async (customerId) => {
        try {
            const res = await crudClient.get(`api/getCustomer/${customerId}`);
            return res;
        } catch (err) {
            console.error("❌ [API.getCustomerById] HATA bloğuna düştü! Detay:", {
                status: err.response?.status,
                message: err.message,
                responseData: err.response?.data
            });
            throw err;
        }
    },

    // ➕ 3. Yeni Müşteri Ekleme (POST api/addCustomer)
    addCustomer: async (customerData) => {
        return crudClient.post("api/addCustomer", customerData);
    },

    // 🔄 4. Müşteri Güncelleme (PUT api/putCustomer/:id)
    putCustomer: async (customerId, updateData) => {
        return crudClient.put(`api/putCustomer/${customerId}`, updateData);
    },

    // ❌ 5. Müşteri Silme (DELETE api/deleteCustomer/:id)
    deleteCustomer: async (customerId) => {
        return crudClient.delete(`api/deleteCustomer/${customerId}`);
    },

    // ➕ 3. Yeni Müşteri Ekleme (POST api/addCustomer)
    customerForOffer: async (searchTerm) => {
        return crudClient.post("api/customerForOffer", { searchTerm }); // <-- { searchTerm: "acme" } gidiyor
    }
};

export default API;