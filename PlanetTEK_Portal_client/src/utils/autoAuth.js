// src/utils/autoAuth.js
import axios from "axios";

export function applyAutoAuthInterceptor(instance) {
    instance.interceptors.response.use(
        (response) => {
            return response;
        },
        async (error) => {
            const originalRequest = error.config;
            const isLoginRequest = originalRequest.url && originalRequest.url.includes("auth/login");

            if (error.response && error.response.status === 401 && !originalRequest._retry && !isLoginRequest) {
                originalRequest._retry = true;

                try {
                    const apiUrl = import.meta.env.VITE_URL;
                    const refreshUrl = apiUrl.endsWith("/") ? `${apiUrl}auth/refresh` : `${apiUrl}/auth/refresh`;

                    const refreshRes = await axios.post(refreshUrl, {}, { withCredentials: true });
                    await new Promise(resolve => setTimeout(resolve, 150));
                    originalRequest.withCredentials = true;

                    return instance(originalRequest);
                } catch (refreshError) {
                    console.error("🚨 [autoAuth]: /refresh isteği de patladı veya döngü kırıldı:", {
                        status: refreshError.response?.status
                    });

                    // 🌟 WINDOW.LOCATION YERİNE SİHİRLİ SİNYAL:
                    // Tarayıcıya "Oturum Tamamen Patladı" olayı fırlatıyoruz
                    window.dispatchEvent(new Event("auth-failure"));

                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }
    );
}