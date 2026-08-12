import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useTeklifStore = create(
  persist(
    (set) => ({
      formData: {},
      currentStep: 1,

      // 🔄 YENİ AKSİYON: Tüm formData'yı tek seferde günceller / override eder
      setFormData: (data) =>
        set((state) => ({
          formData: {
            ...state.formData, // opsiyonel: var olan state'i korumak istersen tutabilirsin, yoksa direkt data da yazabilirsin
            ...data
          }
        })),

      updateSection: (section, data) =>
        set((state) => ({
          formData: {
            ...state.formData,
            [section]: { ...state.formData[section], ...data }
          }
        })),

      setCurrentStepStore: (step) => set({ currentStep: step }),

      resetForm: () => set({ formData: {}, currentStep: 1 }),

      resetTables: () =>
        set((state) => ({
          formData: {
            ...state.formData,
            tables: {}
          }
        })),

      resetIleriAritma: () =>
        set((state) => {
          const currentEquipments = state.formData?.equipments || {};
          const { ileriAritma, ...restEquipments } = currentEquipments;

          return {
            formData: {
              ...state.formData,
              equipments: restEquipments
            }
          };
        }),

      resetEquipments: () =>
        set((state) => {
          const currentModulesState = state.formData?.equipments?.modulesState;
          return {
            formData: {
              ...state.formData,
              equipments: {
                modulesState: currentModulesState || {}
              }
            }
          };
        })
    }),
    {
      name: "teklif-form-storage"
    }
  )
);