import axios from "axios";

// Runtime config yükleme
let configCache = null;
async function loadConfig() {
    if (!configCache) {
        try {
            const res = await fetch("/config.json");
            if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`);
            configCache = await res.json();
        } catch (err) {
            console.error("Config yüklenemedi:", err);
            configCache = { API_HOST: "127.0.0.1", API_PORT: 5173 }; // fallback
        }
    }
    return configCache;
}

// Base URL ve Auth URL dinamik
async function getUrls() {
    const config = await loadConfig();
    //const baseUrl = `http://${config.API_HOST}:${config.API_PORT}/api/`;
    //const AuthUrl = `http://${config.API_HOST}:${config.API_PORT}/auth/`;
    const baseUrl = " http://192.168.1.109:3008/api/"
    const AuthUrl = " http://192.168.1.109:3008/auth/"
    return { baseUrl, AuthUrl };
}



// Headers
async function headersLogin() {
    return {
        "Content-Type": "application/json",
        Accept: "*/*",
    };
}

async function headersAuth() {
    const token = localStorage.getItem("authToken");
    return {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
    };
}

// Axios wrapper
const API = {

    login: async (body) => {
        const { AuthUrl } = await getUrls();
        return axios.post(`${AuthUrl}login`, body, { headers: await headersLogin() });
    },


};

export default API;
