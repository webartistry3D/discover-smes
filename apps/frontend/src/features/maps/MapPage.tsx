import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, MessageCircle, Star, Navigation } from 'lucide-react';
import { useNearbyVendors } from '../../hooks/useVendors';
import { useGeolocation } from '../../hooks/useGeolocation';
import { VerificationBadge } from '../../components/ui/VerificationBadge';
import { Spinner } from '../../components/ui/index';
import { generateWhatsAppUrl, generateWhatsAppGreeting } from '../../lib/shared';
import { FESTAC_CENTER } from '../../lib/shared';
import type { VendorSummary } from '../../lib/shared';

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorSummary | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const isInitializingRef = useRef(false);

  const { location, requestLocation } = useGeolocation(true);
  const center = location ?? FESTAC_CENTER;

  // Use nearby vendors with larger radius to show all businesses in the area
  const { data: vendors, isLoading } = useNearbyVendors(center.lat, center.lng, 50); // 50km radius to show all Festac businesses

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || isInitializingRef.current) return undefined;

    const container = mapRef.current;

    // Clear any existing Leaflet data from the container
    if (container) {
      container.innerHTML = '';
      // Remove any Leaflet-specific properties
      (container as any)._leaflet_id = undefined;
      (container as any)._leaflet_events = undefined;
    }

    isInitializingRef.current = true;

    // Dynamically import leaflet (avoid SSR issues)
    import('leaflet').then((L) => {
      const map = L.map(container, {
        center: [center.lat, center.lng],
        zoom: 14,
      });

      // CartoDB Voyager tiles as primary, OpenStreetMap DE mirror as fallback
      const primaryTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: ['a', 'b', 'c', 'd'],
        maxZoom: 20,
      });

      const fallbackTiles = L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
      });

      primaryTiles.addTo(map);

      primaryTiles.on('tileerror', () => {
        if (map.hasLayer(primaryTiles)) {
          map.removeLayer(primaryTiles);
          fallbackTiles.addTo(map);
        }
      });

      // Custom zoom control position
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
      isInitializingRef.current = false;
    });

    return () => {
      isInitializingRef.current = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.error('Error removing map:', e);
        }
        mapInstanceRef.current = null;
      }
      if (container) {
        container.innerHTML = '';
        (container as any)._leaflet_id = undefined;
        (container as any)._leaflet_events = undefined;
      }
    };
  }, []);

  // Add vendor markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !vendors?.length) return;

    import('leaflet').then((L) => {
      // Clear existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const map = mapInstanceRef.current;

      vendors.forEach((vendor) => {
        // Use vendor coordinates if available, otherwise use map center
        const lat = vendor.coordinates?.lat ?? center.lat;
        const lng = vendor.coordinates?.lng ?? center.lng;

        // Custom marker icon with pointer-events-none to allow map interaction
        const iconHtml = `
          <div style="
            width: 36px; height: 36px;
            background: ${vendor.isFeatured ? '#F59E0B' : '#1B5E20'};
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            display: flex; align-items: center; justify-content: center;
            pointer-events: none;
          ">
            <span style="transform: rotate(45deg); font-size: 14px;">🏪</span>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -40],
        });

        const marker = L.marker([lat, lng], { icon })
          .addTo(map)
          .on('click', (e) => {
            e.originalEvent.stopPropagation();
            setSelectedVendor(vendor);
          });

        markersRef.current.push(marker);
      });
    });
  }, [mapReady, vendors, center]);

  // Add user location marker (with cleanup)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !location) {
      return undefined;
    }

    import('leaflet').then((L) => {
      // Remove existing user marker
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      const userIconHtml = `
        <div style="
          width: 16px; height: 16px;
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 6px rgba(59,130,246,0.2);
          pointer-events: none;
        "></div>
      `;

      const userIcon = L.divIcon({ html: userIconHtml, className: '', iconSize: [16, 16], iconAnchor: [8, 8] });
      const userMarker = L.marker([location.lat, location.lng], { icon: userIcon }).addTo(mapInstanceRef.current);
      userMarkerRef.current = userMarker;
    });

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, [mapReady, location]);

  const handleCenterOnMe = () => {
    if (!mapInstanceRef.current || !location) {
      requestLocation();
      return;
    }
    mapInstanceRef.current.flyTo([location.lat, location.lng], 15, { animate: true, duration: 1 });
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col relative w-full" style={{ minHeight: '400px' }}>
      {/* Map container */}
      <div ref={mapRef} className="flex-1 z-0 w-full h-full" />

      {/* Loading overlay */}
      {!mapReady && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-gray-500 text-sm">Loading map...</p>
          </div>
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <div className="bg-white rounded-2xl shadow-card-hover px-4 py-2.5 flex items-center gap-2">
          <MapPin size={14} className="text-festac-green" />
          <span className="text-sm font-semibold text-gray-900">
            {vendors?.length ?? 0} businesses nearby
          </span>
          {isLoading && <Spinner size="sm" />}
        </div>

        <button
          onClick={handleCenterOnMe}
          className="bg-white rounded-2xl shadow-card-hover p-2.5 hover:bg-gray-50 transition-colors"
          title="Center on my location"
        >
          <Navigation size={18} className="text-festac-green" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-white rounded-xl shadow-card px-3 py-2 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-festac-green" />
          <span className="text-xs text-gray-600">Business</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-festac-amber" />
          <span className="text-xs text-gray-600">Featured</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs text-gray-600">You</span>
        </div>
      </div>

      {/* Vendor bottom sheet */}
      <AnimatePresence>
        {selectedVendor && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-2xl p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {selectedVendor.coverImage ? (
                    <img src={selectedVendor.coverImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🏪</div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedVendor.businessName}</h3>
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
              <button onClick={() => setSelectedVendor(null)} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <p className="text-xs text-gray-500 flex items-center gap-1 mb-4">
              <MapPin size={11} className="text-festac-green flex-shrink-0" />
              {selectedVendor.address}
            </p>

            <div className="flex gap-2">
              <Link href={`/vendors/${selectedVendor.slug}`} className="flex-1">
                <button className="btn-primary w-full justify-center py-2.5 text-sm">
                  View Profile
                </button>
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
  );
}
