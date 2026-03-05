import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import './index.css';
import "@fontsource/ibm-plex-sans-arabic/300.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";

import { useStore } from './store/useStore';
import { store } from './store/index';
import DarkModeProvider from './components/DarkModeProvider';

// Set initial dark mode state
const darkMode = useStore.getState().darkMode;
if (darkMode) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.add('light');
}

// Set RTL direction
document.documentElement.dir = 'rtl';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <DarkModeProvider>
        <App />
      </DarkModeProvider>
    </Provider>
  </React.StrictMode>
);
