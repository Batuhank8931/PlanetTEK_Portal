// src/utils/autoAuth.js
import axios from "axios";

export function applyAutoAuthInterceptor(instance) {
    instance.interceptors.response.use(
        (response) => {
            console.log(`⚡ [autoAuth] Başarılı Response Geçişi: ${response.config.url}`);
            return response;
        },
        async (error) => {
            const originalRequest = error.config;
            const isLoginRequest = originalRequest.url && originalRequest.url.includes("auth/login");

            console.log(`⚠️ [autoAuth] Hata Yakalandı! URL: ${originalRequest?.url} | Status: ${error.response?.status}`);

            if (error.response && error.response.status === 401 && !originalRequest._retry && !isLoginRequest) {
                originalRequest._retry = true;

                try {
                    console.log("🔄 [autoAuth]: 401 Yakalandı. Access Token bitti, arka planda /refresh tetikleniyor...");
                    
                    // 🚀 SİHİRLİ DOKUNUŞ: Statik domain silindi, .env'den gelen VITE_URL ile birleştirildi!
                    const apiUrl = import.meta.env.VITE_URL;
                    // Eğer .env'deki url'nin sonunda "/" varsa çift slash olmasın diye temiz bir birleştirme yapıyoruz
                    const refreshUrl = apiUrl.endsWith("/") ? `${apiUrl}auth/refresh` : `${apiUrl}/auth/refresh`;

                    console.log(`📡 [autoAuth]: /refresh isteği şu adrese atılıyor: ${refreshUrl}`);

                    // Yenileme isteğini dinamik url ile atıyoruz
                    const refreshRes = await axios.post(refreshUrl, {}, { withCredentials: true });
                    console.log("🟩 [autoAuth]: /refresh İsteği Sunucudan 200 Döndü! Yanıt:", refreshRes.data);
                    
                    // Tarayıcının çerezi mühürlemesi için 150ms nefes payı
                    await new Promise(resolve => setTimeout(resolve, 150));
                    
                    // Tekrarlanacak isteğin ayarlarını kontrol et ve zorla
                    originalRequest.withCredentials = true;
                    console.log("🔄 [autoAuth]: Patlayan istek şimdi TEKRARLANIYOR. Config:", {
                        url: originalRequest.url,
                        method: originalRequest.method,
                        withCredentials: originalRequest.withCredentials
                    });
                    
                    return instance(originalRequest);
                } catch (refreshError) {
                    console.error("🚨 [autoAuth]: KRİTİK! /refresh isteği de patladı veya döngü kırıldı:", {
                        status: refreshError.response?.status,
                        data: refreshError.response?.data
                    });
                    // window.location.href = "/"; // Kapalı kalıyor
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }
    );
}