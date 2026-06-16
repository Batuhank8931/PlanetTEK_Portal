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

                    // 🚀 SİHİRLİ DOKUNUŞ: Statik domain silindi, .env'den gelen VITE_URL ile birleştirildi!
                    const apiUrl = import.meta.env.VITE_URL;
                    // Eğer .env'deki url'nin sonunda "/" varsa çift slash olmasın diye temiz bir birleştirme yapıyoruz
                    const refreshUrl = apiUrl.endsWith("/") ? `${apiUrl}auth/refresh` : `${apiUrl}/auth/refresh`;


                    // Yenileme isteğini dinamik url ile atıyoruz
                    const refreshRes = await axios.post(refreshUrl, {}, { withCredentials: true });

                    // Tarayıcının çerezi mühürlemesi için 150ms nefes payı
                    await new Promise(resolve => setTimeout(resolve, 150));

                    // Tekrarlanacak isteğin ayarlarını kontrol et ve zorla
                    originalRequest.withCredentials = true;


                    return instance(originalRequest);
                } catch (refreshError) {
                    console.error("🚨 [autoAuth]: KRİTİK! /refresh isteği de patladı veya döngü kırıldı:", {
                        status: refreshError.response?.status,
                        data: refreshError.response?.data
                    });
                    window.location.href = "/login"; // Kapalı kalıyor
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }
    );
}