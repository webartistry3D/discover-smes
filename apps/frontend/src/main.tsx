import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App';

if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // Unregister any stale service worker from previous dev sessions
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  } else {
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({
        onNeedRefresh() {
          if (confirm('New version available. Reload to update?')) {
            window.location.reload();
          }
        },
        onOfflineReady() {
          console.log('App ready to work offline');
        },
      });
    });
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
