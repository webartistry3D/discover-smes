import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { clsx } from 'clsx';
import { Camera, CameraOff, RefreshCw, ScanLine, ChevronDown } from 'lucide-react';

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
  const mountedRef = useRef(true);
  const onDetectedRef = useRef(onDetected);
  useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);

  // ── Stop active scanner ─────────────────────────────────────
  const stopScanner = useCallback(() => { // eslint-disable-line react-hooks/exhaustive-deps
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
    BrowserMultiFormatReader.listVideoInputDevices()
      .then((devices) => {
        if (!mountedRef.current) return;
        setCameras(devices);
        const rear = devices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
        );
        setSelectedCamera(rear?.deviceId ?? devices[0]?.deviceId);
      })
      .catch(() => {
        if (mountedRef.current) setError('Camera access denied. Please allow camera permissions.');
      });
    return () => { mountedRef.current = false; };
  }, []);

  // ── Start scanner ──────────────────────────────────────────
  const startScanner = useCallback(async (deviceId?: string) => {
    if (!videoRef.current) return;

    stopScanner();
    setIsStarting(true);
    setError(null);

    try {
      const reader = new BrowserMultiFormatReader();

      // decodeFromVideoDevice handles getUserMedia internally
      const controls = await reader.decodeFromVideoDevice(
        deviceId ?? undefined,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
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
          // NotFoundException fires every frame without a barcode — ignore
          if (err && !(err instanceof NotFoundException)) {
            // other errors are also ignorable during continuous scan
          }
        }
      );

      if (mountedRef.current) {
        controlsRef.current = controls;
        setIsStarting(false);
      } else {
        controls.stop();
      }
    } catch (e: any) {
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
    if (selectedCamera !== undefined) {
      startScanner(selectedCamera);
    }
    return () => {
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
                onClick={() => setShowCamSelect(!showCamSelect)}
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
            onClick={() => startScanner(selectedCamera)}
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

      {/* Footer hint */}
      <div className="px-4 py-4 text-center safe-area-bottom">
        <p className="text-white/50 text-xs">
          Point camera at a barcode — EAN, QR, Code128 supported
        </p>
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
