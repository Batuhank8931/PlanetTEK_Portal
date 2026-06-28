import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useTeklifStore = create(
  persist(
    (set) => ({
      formData: {},
      currentStep: 1,

      updateSection: (section, data) => set((state) => ({
        formData: {
          ...state.formData,
          [section]: { ...state.formData[section], ...data }
        }
      })),

      setCurrentStepStore: (step) => set({ currentStep: step }),

      resetForm: () => set({ formData: {}, currentStep: 1 }),

      resetTables: () => set((state) => ({
        formData: {
          ...state.formData,
          tables: {}
        }
      })),

      // 🔄 YENİ AKSİYON: İleri arıtmayı komple uçuran fonksiyon
      // ... diğer store kodların

      resetIleriAritma: () => set((state) => {
        // 1. Mevcut equipments nesnesini güvenle alıyoruz
        const currentEquipments = state.formData?.equipments || {};

        // 2. Destructuring kullanarak ileriAritma'yı dışarı çıkartıyoruz, 
        // geri kalan her şeyi (onAritma, feedPump vb.) restEquipments içinde topluyoruz.
        const { ileriAritma, ...restEquipments } = currentEquipments;

        // 3. Store'u güncelliyoruz; artık equipments altında ileriAritma diye bir key HİÇ KALMADI.
        return {
          formData: {
            ...state.formData,
            equipments: restEquipments
          }
        };
      }),

      // ... diğer store kodların

      resetEquipments: () => set((state) => {
        const currentModulesState = state.formData?.equipments?.modulesState;
        return {
          formData: {
            ...state.formData,
            equipments: {
              modulesState: currentModulesState || {},
            }
          }
        };
      })
    }),
    {
      name: "teklif-form-storage",
    }
  )
);