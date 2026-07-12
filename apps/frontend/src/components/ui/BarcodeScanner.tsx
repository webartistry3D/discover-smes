import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { clsx } from 'clsx';
import { Camera, CameraOff, RefreshCw, ScanLine, ChevronDown, Search } from 'lucide-react';

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
  isDarkMode?: boolean;
}

export function BarcodeScanner({ onDetected, onClose, isDarkMode = false }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>(undefined);
  const [isStarting, setIsStarting] = useState(true);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [showCamSelect, setShowCamSelect] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const onDetectedRef = useRef(onDetected);
  useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);

  // Suppress ZXing internal debug messages
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    
    console.log = (...args: any[]) => {
      const message = args[0];
      if (typeof message === 'string' && 
          (message.includes('MultiFormatReader: non-ReaderException') ||
           message.includes('NotFoundException2') ||
           message.includes('ChecksumException2'))) {
        return; // Suppress these specific ZXing messages
      }
      originalConsoleLog.apply(console, args);
    };
    
    console.warn = (...args: any[]) => {
      const message = args[0];
      if (typeof message === 'string' && 
          (message.includes('MultiFormatReader: non-ReaderException') ||
           message.includes('NotFoundException2') ||
           message.includes('ChecksumException2'))) {
        return; // Suppress these specific ZXing messages
      }
      originalConsoleWarn.apply(console, args);
    };
    
    return () => {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
    };
  }, []);

  // ── Stop active scanner ─────────────────────────────────────
  const stopScanner = useCallback(() => { // eslint-disable-line react-hooks/exhaustive-deps
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // ── Enumerate cameras ──────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    console.log('[BarcodeScanner] Starting camera enumeration...');
    BrowserMultiFormatReader.listVideoInputDevices()
      .then((devices) => {
        if (!mountedRef.current) return;
        console.log('[BarcodeScanner] Found devices:', devices.map(d => ({ id: d.deviceId, label: d.label })));
        setCameras(devices);
        const rear = devices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
        );
        const selected = rear?.deviceId ?? devices[0]?.deviceId;
        console.log('[BarcodeScanner] Selected camera:', selected);
        setSelectedCamera(selected);
      })
      .catch((err) => {
        console.error('[BarcodeScanner] Camera enumeration failed:', err);
        if (mountedRef.current) setError('Camera access denied. Please allow camera permissions.');
      });
    return () => { 
      console.log('[BarcodeScanner] Cleanup: unmounting enumeration');
      mountedRef.current = false; 
    };
  }, []);

  // ── Start scanner ──────────────────────────────────────────
  const startScanner = useCallback(async (deviceId?: string) => {
    console.log('[BarcodeScanner] startScanner called with deviceId:', deviceId);
    if (!videoRef.current) {
      console.log('[BarcodeScanner] No video ref, exiting');
      return;
    }

    console.log('[BarcodeScanner] Stopping any existing scanner...');
    stopScanner();
    console.log('[BarcodeScanner] Setting starting state to true');
    setIsStarting(true);
    setError(null);

    try {
      console.log('[BarcodeScanner] Creating BrowserMultiFormatReader...');
      
      // Check if ZXing is properly available
      if (typeof BrowserMultiFormatReader === 'undefined') {
        throw new Error('ZXing library not loaded. Please refresh the page and try again.');
      }
      
      const reader = new BrowserMultiFormatReader();

      // Some browsers/devices never resolve if the camera is busy or unavailable
      console.log('[BarcodeScanner] Setting 10s timeout...');
      startTimeoutRef.current = setTimeout(() => {
        console.log('[BarcodeScanner] TIMEOUT reached - camera never started');
        if (!mountedRef.current) return;
        stopScanner();
        setIsStarting(false);
        setError('Camera is taking too long to start. Make sure it is not in use by another app and permissions are allowed.');
      }, 10000);

      // decodeFromVideoDevice handles getUserMedia internally
      console.log('[BarcodeScanner] Calling decodeFromVideoDevice...');
      const startTime = Date.now();
      const controls = await reader.decodeFromVideoDevice(
        deviceId ?? undefined,
        videoRef.current,
        (result, err) => {
          // Only log when there's a result or unexpected error
          if (result) {
            console.log('[BarcodeScanner] decodeFromVideoDevice callback called:', { result: !!result, error: err?.name, time: Date.now() - startTime });
          } else if (err && !(err instanceof NotFoundException) && err?.name !== 'ChecksumException' && err?.name !== 'NotFoundException2') {
            console.log('[BarcodeScanner] decodeFromVideoDevice callback called:', { result: !!result, error: err?.name, time: Date.now() - startTime });
          }
          
          if (startTimeoutRef.current) {
            clearTimeout(startTimeoutRef.current);
            startTimeoutRef.current = null;
          }
          if (result) {
            const text = result.getText();
            console.log('[BarcodeScanner] Barcode detected:', text);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              if (!mountedRef.current) return;
              setLastResult(text);
              onDetectedRef.current(text);
              debounceRef.current = setTimeout(() => {
                if (mountedRef.current) setLastResult(null);
              }, 2000);
            }, 100);
          }
          // NotFoundException, ChecksumException, and NotFoundException2 fire every frame without a barcode — ignore
          if (err && !(err instanceof NotFoundException) && err?.name !== 'ChecksumException' && err?.name !== 'NotFoundException2') {
            console.log('[BarcodeScanner] Unexpected error:', err);
            // other errors are also ignorable during continuous scan
          }
        }
      );
      console.log('[BarcodeScanner] decodeFromVideoDevice returned controls, time:', Date.now() - startTime);

      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }

      if (mountedRef.current) {
        console.log('[BarcodeScanner] Scanner started successfully, setting controls');
        controlsRef.current = controls;
        setIsStarting(false);
      } else {
        console.log('[BarcodeScanner] Component unmounted, stopping scanner');
        controls.stop();
      }
    } catch (e: any) {
      console.error('[BarcodeScanner] Exception in startScanner:', { name: e?.name, message: e?.message, stack: e?.stack });
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
      if (!mountedRef.current) return;
      setIsStarting(false);
      if (e?.name === 'NotAllowedError' || e?.message?.includes('Permission')) {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (e?.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not start camera: ' + (e?.message ?? 'Unknown error'));
      }
    }
  }, [stopScanner]);

  // ── Start/restart when camera changes ─────────────────────
  useEffect(() => {
    console.log('[BarcodeScanner] useEffect triggered, selectedCamera:', selectedCamera);
    if (selectedCamera !== undefined) {
      console.log('[BarcodeScanner] Starting scanner with camera:', selectedCamera);
      startScanner(selectedCamera);
    }
    return () => {
      console.log('[BarcodeScanner] Cleanup: stopping scanner and clearing debounce');
      stopScanner();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCamera]);

  return (
    <div className={clsx(
      'fixed inset-0 z-50 flex flex-col',
      isDarkMode ? 'bg-gray-950' : 'bg-black'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 safe-area-top">
        <div className="flex items-center gap-2">
          <ScanLine size={20} className="text-festac-green" />
          <span className="text-white font-semibold text-sm">Scan Barcode</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Camera selector */}
          {cameras.length > 1 && (
            <div className="relative">
              <button
                onClick={() => {
                  console.log('[BarcodeScanner] Camera selector clicked');
                  setShowCamSelect(!showCamSelect);
                }}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                <Camera size={14} />
                <span className="hidden sm:inline">Camera</span>
                <ChevronDown size={12} />
              </button>
              {showCamSelect && (
                <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-10 min-w-48">
                  {cameras.map((cam) => (
                    <button
                      key={cam.deviceId}
                      onClick={() => {
                        console.log('[BarcodeScanner] Camera selected:', cam.deviceId, cam.label);
                        setSelectedCamera(cam.deviceId);
                        setShowCamSelect(false);
                      }}
                      className={clsx(
                        'w-full text-left text-xs px-4 py-2.5 transition-colors',
                        selectedCamera === cam.deviceId
                          ? 'text-festac-green bg-festac-green/10'
                          : 'text-gray-300 hover:bg-gray-700'
                      )}
                    >
                      {cam.label || `Camera ${cameras.indexOf(cam) + 1}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Restart */}
          <button
            onClick={() => {
              console.log('[BarcodeScanner] Restart camera clicked');
              startScanner(selectedCamera);
            }}
            className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg transition-colors"
            title="Restart camera"
          >
            <RefreshCw size={16} />
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg transition-colors"
          >
            <CameraOff size={16} />
          </button>
        </div>
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative overflow-hidden">
        {/* Video stream */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          onLoadedData={() => {
            console.log('[BarcodeScanner] Video onLoadedData fired - stream ready');
            if (startTimeoutRef.current) {
              clearTimeout(startTimeoutRef.current);
              startTimeoutRef.current = null;
            }
            setIsStarting(false);
          }}
          onError={(e) => {
            console.error('[BarcodeScanner] Video onError fired:', e);
            if (startTimeoutRef.current) {
              clearTimeout(startTimeoutRef.current);
              startTimeoutRef.current = null;
            }
            setIsStarting(false);
            setError('Camera stream failed to load. Try another camera or restart.');
            stopScanner();
          }}
          onPlay={() => {
            console.log('[BarcodeScanner] Video onPlay fired');
          }}
          onCanPlay={() => {
            console.log('[BarcodeScanner] Video onCanPlay fired');
          }}
        />

        {/* Scan overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Dimmed borders */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Scan window */}
          <div className="relative w-64 h-48 sm:w-80 sm:h-56">
            {/* Clear center */}
            <div className="absolute inset-0 bg-transparent" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)' }} />

            {/* Corner brackets */}
            {/* TL */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-festac-green rounded-tl-lg" />
            {/* TR */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-festac-green rounded-tr-lg" />
            {/* BL */}
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-festac-green rounded-bl-lg" />
            {/* BR */}
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-festac-green rounded-br-lg" />

            {/* Animated scan line */}
            {!error && !isStarting && (
              <div
                className="absolute left-2 right-2 h-0.5 bg-festac-green/80 shadow-[0_0_6px_2px_rgba(34,197,94,0.5)]"
                style={{
                  animation: 'scanline 2s ease-in-out infinite',
                }}
              />
            )}

            {/* Last detected badge */}
            {lastResult && (
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-festac-green text-white text-xs font-mono px-3 py-1 rounded-full whitespace-nowrap">
                ✓ {lastResult}
              </div>
            )}
          </div>
        </div>

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 px-6 text-center">
            <CameraOff size={40} className="text-red-400 mb-3" />
            <p className="text-white text-sm font-medium">{error}</p>
            <button
              onClick={() => startScanner(selectedCamera)}
              className="mt-4 bg-festac-green text-white text-sm px-4 py-2 rounded-xl hover:bg-festac-green/90"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {isStarting && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <div className="w-8 h-8 border-2 border-festac-green border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-white/70 text-sm">Starting camera...</p>
          </div>
        )}
      </div>

      {/* Footer with navigation buttons */}
      <div className="px-4 py-4 pb-20 safe-area-bottom">
        <div className="flex flex-col gap-3">
          {/* Navigation buttons */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                console.log('[BarcodeScanner] Manual entry clicked');
                // Close scanner and focus on manual input
                onClose();
                // Focus on the scan input after a short delay
                setTimeout(() => {
                  const scanInput = document.querySelector('input[placeholder*="Scan barcode"]') as HTMLInputElement;
                  if (scanInput) {
                    scanInput.focus();
                    scanInput.click();
                  }
                }, 100);
              }}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-xl transition-colors"
            >
              <ScanLine size={16} />
              Manual Entry
            </button>
            <button
              onClick={() => {
                console.log('[BarcodeScanner] Exit clicked');
                onClose();
              }}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-xl transition-colors"
            >
              <CameraOff size={16} />
              Exit
            </button>
          </div>
          
          {/* Hint text */}
          <p className="text-white/50 text-xs text-center">
            Point camera at a barcode — EAN, QR, Code128 supported
          </p>
        </div>
      </div>

      {/* Scanline CSS animation */}
      <style>{`
        @keyframes scanline {
          0%   { top: 8px; opacity: 1; }
          48%  { top: calc(100% - 8px); opacity: 1; }
          50%  { top: calc(100% - 8px); opacity: 0; }
          52%  { top: 8px; opacity: 0; }
          54%  { top: 8px; opacity: 1; }
          100% { top: 8px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
