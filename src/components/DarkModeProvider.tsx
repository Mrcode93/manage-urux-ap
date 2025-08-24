import { useEffect } from 'react';
import { useStore } from '../store/useStore';

interface DarkModeProviderProps {
  children: React.ReactNode;
}

export default function DarkModeProvider({ children }: DarkModeProviderProps) {
  const { darkMode } = useStore();

  useEffect(() => {
    const htmlElement = document.documentElement;
    
    if (darkMode) {
      htmlElement.classList.add('dark');
      htmlElement.classList.remove('light');
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.classList.add('light');
    }
  }, [darkMode]);

  return <>{children}</>;
} 