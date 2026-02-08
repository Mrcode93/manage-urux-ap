import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  fontFamily: 'outfit' | 'cairo' | 'tajawal';
  setFontFamily: (font: 'outfit' | 'cairo' | 'tajawal') => void;
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      fontFamily: 'outfit',
      setFontFamily: (font) => set({ fontFamily: font }),
      isAuthenticated: false,
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      isLoading: false,
      setIsLoading: (value) => set({ isLoading: value }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        fontFamily: state.fontFamily,
        isAuthenticated: state.isAuthenticated
      }), // Don't persist isLoading
    }
  )
);