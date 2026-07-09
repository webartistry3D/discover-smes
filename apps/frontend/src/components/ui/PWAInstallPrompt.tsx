import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const alreadyDismissed = localStorage.getItem('pwa-install-dismissed');
    if (alreadyDismissed) return undefined;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    const standaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;

    if (standaloneMode) return undefined;

    if (ios) {
      setIsIOS(true);
      return undefined;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') setInstallEvent(null);
    setDismissed(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setInstallEvent(null);
    setIsIOS(false);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  if (dismissed) return null;

  if (isIOS) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">Install Discover SMEs</p>
                {showIOSGuide ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>
                  </p>
                ) : (
                  <button
                    onClick={() => setShowIOSGuide(true)}
                    className="text-xs text-brand-600 dark:text-brand-400 mt-0.5 underline"
                  >
                    How to install
                  </button>
                )}
              </div>
            </div>
            <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!installEvent) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-white">Install Discover SMEs</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Add to home screen for a better experience</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
