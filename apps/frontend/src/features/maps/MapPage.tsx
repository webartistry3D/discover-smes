import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, MessageCircle, Star, Navigation, Search } from 'lucide-react';
import type * as Leaflet from 'leaflet';
import { useNearbyVendors } from '../../hooks/useVendors';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useUIStore } from '../../stores/ui.store';
import { VerificationBadge } from '../../components/ui/VerificationBadge';
import { Spinner } from '../../components/ui/index';
import { generateWhatsAppUrl, generateWhatsAppGreeting, FESTAC_CENTER } from '../../lib/shared';
import { VendorCard } from '../../components/marketplace/VendorCard';
import type { VendorSummary } from '../../lib/shared';
import { clsx } from 'clsx';

const TILE_URL = `${import.meta.env.VITE_API_URL}/tiles/{z}/{x}/{y}?dpr={r}`;
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

interface MapIconProps {
  isFeatured: boolean;
}

function MapMarkerIcon({ isFeatured }: MapIconProps) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        background: isFeatured ? '#F59E0B' : '#1B5E20',
        border: '3px solid white',
        borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span style={{ transform: 'rotate(45deg)', fontSize: 14 }}>🏪</span>
    </div>
  );
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Leaflet.Map | null>(null);
  const markersRef = useRef<Leaflet.Marker[]>([]);
  const userMarkerRef = useRef<Leaflet.Marker | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  const [selectedVendor, setSelectedVendor] = useState<VendorSummary | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [manualCenter, setManualCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [coords, setCoords] = useState({ lat: '', lng: '' });

  const { isDarkMode } = useUIStore();
  const { location, requestLocation } = useGeolocation(true);
  const mapCenter = manualCenter ?? location ?? FESTAC_CENTER;

  const { data: vendors, isLoading } = useNearbyVendors(mapCenter.lat, mapCenter.lng, 50);

  const vendorsWithCoordinates = vendors?.filter((v) => v.coordinates?.lat && v.coordinates?.lng) ?? [];

  // Initialize Leaflet map
  useEffect(() => {
    mountedRef.current = true;
    const container = mapRef.current;
    if (!container || mapInstanceRef.current) return undefined;

    let mapInstance: Leaflet.Map | null = null;

    const initMap = async () => {
      const L = await import('leaflet');
      if (!mountedRef.current || !mapRef.current || mapInstanceRef.current) return;

      container.innerHTML = '';
      (container as any)._leaflet_id = undefined;
      (container as any)._leaflet_events = undefined;

      const map = L.map(container, {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: 14,
        zoomControl: false,
      });

      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        maxZoom: 20,
        detectRetina: true,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstance = map;
      mapInstanceRef.current = map;
      setMapReady(true);

      // Ensure map renders at the correct size after container layout
      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    };

    initMap();

    return () => {
      mountedRef.current = false;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;

      if (mapInstance) {
        try {
          mapInstance.remove();
        } catch (e) {
          console.error('Error removing map:', e);
        }
        mapInstance = null;
      }
      mapInstanceRef.current = null;

      if (container) {
        container.innerHTML = '';
        (container as any)._leaflet_id = undefined;
        (container as any)._leaflet_events = undefined;
      }
    };
  }, []);

  // Resize observer to keep map sized correctly
  useEffect(() => {
    const map = mapInstanceRef.current;
    const container = mapRef.current?.parentElement;
    if (!map || !container) return undefined;

    resizeObserverRef.current = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (mapInstanceRef.current && map.getContainer()?.isConnected) {
          map.invalidateSize();
        }
      });
    });
    resizeObserverRef.current.observe(container);

    return () => resizeObserverRef.current?.disconnect();
  }, [mapReady]);

  // Recenter map when the active center (manual search or user location) changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.getContainer()?.isConnected) return undefined;
    map.flyTo([mapCenter.lat, mapCenter.lng], 15, { animate: true, duration: 1 });
  }, [mapCenter.lat, mapCenter.lng]);

  // Add vendor markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!mapReady || !map || !map.getContainer()?.isConnected) return undefined;

    import('leaflet').then((L) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      vendorsWithCoordinates.forEach((vendor) => {
        const { lat, lng } = vendor.coordinates!;

        const icon = L.divIcon({
          html: `<div style="width:36px;height:36px;background:${vendor.isFeatured ? '#F59E0B' : '#1B5E20'};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:14px;">🏪</span></div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map).on('click', (e) => {
          e.originalEvent.stopPropagation();
          setSelectedVendor(vendor);
        });

        markersRef.current.push(marker);
      });
    });
  }, [mapReady, vendorsWithCoordinates]);

  // Add user location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!mapReady || !map || !map.getContainer()?.isConnected) return undefined;

    import('leaflet').then((L) => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      const userIconHtml = `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 6px rgba(59,130,246,0.2);"></div>`;
      const userIcon = L.divIcon({ html: userIconHtml, className: '', iconSize: [16, 16], iconAnchor: [8, 8] });
      const userMarker = L.marker([mapCenter.lat, mapCenter.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      userMarkerRef.current = userMarker;
    });

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, [mapReady, mapCenter.lat, mapCenter.lng]);

  // Close bottom sheet on outside click or Escape key
  const handleSheetClose = useCallback(() => setSelectedVendor(null), []);

  useEffect(() => {
    if (!selectedVendor) return undefined;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSheetClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        handleSheetClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedVendor, handleSheetClose]);

  const handleCenterOnMe = () => {
    if (!location) {
      requestLocation();
      return;
    }
    setManualCenter(null);
    const map = mapInstanceRef.current;
    if (map && map.getContainer()?.isConnected) {
      map.flyTo([location.lat, location.lng], 15, { animate: true, duration: 1 });
    }
  };

  const handleCoordinateSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(coords.lat);
    const lng = parseFloat(coords.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
    setManualCenter({ lat, lng });
  };

  return (
    <div className={clsx('min-h-[calc(100vh-64px)] w-full p-4 sm:p-6', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      <div className="max-w-6xl mx-auto">
        <div
          className={clsx(
            'overflow-hidden shadow-card border relative',
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
            'h-[calc(75vh-105px)] sm:h-[calc(100vh-160px)]'
          )}
          style={{ minHeight: '400px' }}
        >
          {/* Map container */}
          <div ref={mapRef} className="absolute inset-0 z-0 w-full h-full" />

          {/* Loading overlay */}
          {!mapReady && (
            <div className={clsx('absolute inset-0 flex items-center justify-center z-10 pointer-events-none', isDarkMode ? 'bg-gray-800' : 'bg-gray-100')}>
              <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" />
                <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Loading map...</p>
              </div>
            </div>
          )}

          {/* Top controls */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between pointer-events-none">
            <div className="flex flex-col gap-2 pointer-events-auto">
              <div className={clsx('rounded-2xl shadow-card-hover px-4 py-2.5 flex items-center gap-2 w-fit', isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900')}>
                <MapPin size={14} className="text-festac-green" />
                <span className="text-sm font-semibold">{vendorsWithCoordinates.length} businesses nearby</span>
                {isLoading && <Spinner size="sm" />}
              </div>
            </div>

            <button
              onClick={handleCenterOnMe}
              className={clsx('rounded-2xl shadow-card-hover p-2.5 transition-colors pointer-events-auto', isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50')}
              title="Center on my location"
            >
              <Navigation size={18} className="text-festac-green" />
            </button>
          </div>

          {/* Legend */}
          <div className={clsx('absolute bottom-4 left-4 z-20 rounded-xl shadow-card px-3 py-2 flex items-center gap-3 pointer-events-auto', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-festac-green" />
              <span className={clsx('text-xs', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>Business</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-festac-amber" />
              <span className={clsx('text-xs', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>Featured</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className={clsx('text-xs', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>You</span>
            </div>
          </div>

          {/* Vendor bottom sheet */}
          <AnimatePresence>
            {selectedVendor && (
              <motion.div
                ref={sheetRef}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className={clsx('absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl shadow-2xl p-5', isDarkMode ? 'bg-gray-800' : 'bg-white')}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={clsx('w-12 h-12 rounded-xl overflow-hidden flex-shrink-0', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}>
                      {selectedVendor.coverImage ? (
                        <img src={selectedVendor.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🏪</div>
                      )}
                    </div>
                    <div>
                      <h3 className={clsx('font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>{selectedVendor.businessName}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {selectedVendor.totalReviews > 0 && (
                          <div className="flex items-center gap-1">
                            <Star size={11} className="star-filled" />
                            <span className="text-xs text-gray-600">{selectedVendor.averageRating.toFixed(1)}</span>
                          </div>
                        )}
                        <VerificationBadge level={selectedVendor.verificationLevel} size="sm" showLabel={false} />
                        {selectedVendor.distance !== undefined && (
                          <span className="text-xs text-gray-400">{selectedVendor.distance.toFixed(1)}km</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={handleSheetClose} className={clsx('p-1.5 rounded-xl transition-colors', isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}>
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>

                <p className={clsx('text-xs flex items-center gap-1 mb-4', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                  <MapPin size={11} className="text-festac-green flex-shrink-0" />
                  {selectedVendor.address}
                </p>

                <div className="flex gap-2">
                  <Link href={`/vendors/${selectedVendor.slug}`} className="flex-1">
                    <button className="btn-primary w-full justify-center py-2.5 text-sm">View Profile</button>
                  </Link>
                  {selectedVendor.whatsappPhone && (
                    <a
                      href={generateWhatsAppUrl(selectedVendor.whatsappPhone, generateWhatsAppGreeting(selectedVendor.businessName))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp px-4 py-2.5"
                    >
                      <MessageCircle size={16} />
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search & nearby businesses */}
        <div className={clsx('mt-4 rounded-2xl shadow-card border p-4', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
          <form onSubmit={handleCoordinateSearch} className="flex flex-wrap items-center gap-3 mb-4">
            <span className={clsx('text-sm font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>Search coordinates</span>
            <div className={clsx('flex items-center gap-2 rounded-xl px-3 py-2', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}>
              <Search size={14} className="text-festac-green flex-shrink-0" />
              <input
                type='text'
                inputMode='decimal'
                placeholder='Lat'
                value={coords.lat}
                onChange={(e) => setCoords((c) => ({ ...c, lat: e.target.value }))}
                className={clsx('w-20 text-sm bg-transparent focus:outline-none', isDarkMode ? 'placeholder-gray-500' : 'placeholder-gray-400')}
              />
              <span className={clsx('text-xs', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>|</span>
              <input
                type='text'
                inputMode='decimal'
                placeholder='Lng'
                value={coords.lng}
                onChange={(e) => setCoords((c) => ({ ...c, lng: e.target.value }))}
                className={clsx('w-20 text-sm bg-transparent focus:outline-none', isDarkMode ? 'placeholder-gray-500' : 'placeholder-gray-400')}
              />
            </div>
            <button
              type='submit'
              className='px-3 py-2 rounded-lg bg-festac-green text-white text-sm font-medium hover:bg-festac-green/90 transition-colors'
            >
              Search
            </button>
          </form>

          <h3 className={clsx('text-sm font-semibold mb-3', isDarkMode ? 'text-white' : 'text-gray-900')}>Nearby Businesses</h3>
          <div className='flex gap-4 overflow-x-auto pb-4'>
            {!isLoading && vendorsWithCoordinates.length === 0 && (
              <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No businesses found.</p>
            )}
            {vendorsWithCoordinates.map((vendor, i) => (
              <div key={vendor.id} className='max-w-[260px] flex-shrink-0'>
                <VendorCard vendor={vendor} index={i} variant='compact' />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
