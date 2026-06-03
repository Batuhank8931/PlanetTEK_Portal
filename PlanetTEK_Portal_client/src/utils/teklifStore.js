import { create } from "zustand";

export const useTeklifStore = create((set) => ({
  formData: {}, // Tamamen boş başlıyor, her şeyi komponentler dinamik dolduracak

  // Dinamik update: Eğer gönderdiğiniz key (section) henüz yoksa oluşturur, varsa günceller
  updateSection: (section, data) => set((state) => ({
    formData: {
      ...state.formData,
      [section]: { ...state.formData[section], ...data }
    }
  })),

  // İstediğiniz zaman hafızayı tamamen sıfırlamak için
  resetForm: () => set({ formData: {} })
}));