import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      isAuthenticated: false,
      setAuthenticated: (value) => set({ isAuthenticated: value }),
    }),
    {
      name: 'app-storage',
    }
  )
); 