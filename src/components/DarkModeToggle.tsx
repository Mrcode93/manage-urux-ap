import { useStore } from '../store/useStore';
import { toast } from 'react-hot-toast';

export default function DarkModeToggle() {
  const { darkMode, toggleDarkMode } = useStore();

  const handleToggle = () => {
    toggleDarkMode();
    toast.success(
      darkMode ? 'تم إيقاف الوضع الداكن' : 'تم تفعيل الوضع الداكن',
      {
        icon: darkMode ? '☀️' : '🌙',
        duration: 2000,
      }
    );
  };

  return (
    <button
      onClick={handleToggle}
      className={`fixed bottom-6 left-6 z-50 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        darkMode
          ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
          : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
      }`}
      title={darkMode ? 'إيقاف الوضع الداكن' : 'تفعيل الوضع الداكن'}
    >
      {darkMode ? (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
} 