import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useTeklifStore = create(
  persist(
    (set) => ({
      formData: {}, // Tamamen boş başlıyor
      currentStep: 1, // Yeni eklenen: Aktif adımı hafızada tutmak için

      // Dinamik update: Seksiyon verilerini günceller
      updateSection: (section, data) => set((state) => ({
        formData: {
          ...state.formData,
          [section]: { ...state.formData[section], ...data }
        }
      })),

      // Yeni eklenen: Adım bilgisini store'da güncellemek için
      setCurrentStepStore: (step) => set({ currentStep: step }),

      // Hafızayı tamamen sıfırlamak için (Adımı da 1 yapar)
      resetForm: () => set({ formData: {}, currentStep: 1 }),

      resetTables: () => set((state) => ({
        formData: {
          ...state.formData,
          tables: {} // tables objesini sıfırladık, diğer veriler korundu
        }
      })),

      resetEquipments: () => set((state) => {
        const currentModulesState = state.formData?.equipments?.modulesState;

        return {
          formData: {
            ...state.formData,
            equipments: {
              // Sadece modüllerin checkbox durumlarını koruyoruz
              modulesState: currentModulesState || {},
              // Geri kalan tüm hesaplanmış detayları (onAritma, feedPump vb.) sıfırlıyoruz
            }
          }
        };
      })


    }),
    {
      name: "teklif-form-storage", // Tarayıcı hafızasındaki benzersiz isim
    }
  )
);