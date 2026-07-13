import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { WifiOff, AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { useUIStore } from '../../stores/ui.store';
import { Button } from '../../components/ui/index';

export default function NotFoundPage() {
  const { isDarkMode } = useUIStore();
  const [, setLocation] = useLocation();
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const handle = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handle);
    window.addEventListener('offline', handle);
    return () => {
      window.removeEventListener('online', handle);
      window.removeEventListener('offline', handle);
    };
  }, []);

  return (
    <div
      className={clsx(
        'min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-4 py-12',
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      )}
    >
      <div
        className={clsx(
          'w-24 h-24 rounded-full flex items-center justify-center',
          isOffline
            ? isDarkMode
              ? 'bg-red-900/20'
              : 'bg-red-50'
            : isDarkMode
              ? 'bg-blue-900/20'
              : 'bg-blue-50'
        )}
      >
        {isOffline ? (
          <WifiOff size={40} className="text-red-500" />
        ) : (
          <AlertTriangle size={40} className="text-blue-500" />
        )}
      </div>

      <div className="max-w-md">
        <h1 className="text-4xl font-display font-black mb-2">404</h1>
        <p className={clsx('text-lg mb-2', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>
          {isOffline
            ? "You're offline. Check your connection and try again."
            : "We couldn't find the page you're looking for."}
        </p>
        {isOffline && (
          <p className={clsx('text-sm mb-6', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
            Once your connection is restored, the app will reload automatically.
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {isOffline ? (
          <Button onClick={() => window.location.reload()} variant="primary">
            <RefreshCw size={18} className="mr-2" />
            Try Again
          </Button>
        ) : (
          <Button onClick={() => setLocation('/')} variant="primary">
            <Home size={18} className="mr-2" />
            Go Home
          </Button>
        )}
      </div>
    </div>
  );
}
