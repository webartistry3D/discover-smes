import { useEffect, useRef, useCallback } from 'react';
import { useUIStore } from '../stores/ui.store';
import { FESTAC_CENTER } from '../lib/shared';

export function useGeolocation(autoRequest = false) {
  const { userLocation, locationPermission, setUserLocation, setLocationPermission } = useUIStore();
  const watchIdRef = useRef<number | null>(null);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      setUserLocation(FESTAC_CENTER);
      return;
    }

    if (watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationPermission('granted');
      },
      () => {
        setLocationPermission('denied');
        setUserLocation(FESTAC_CENTER);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  }, [setUserLocation, setLocationPermission]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      setUserLocation(FESTAC_CENTER);
      return;
    }
    startWatching();
  }, [startWatching, setLocationPermission, setUserLocation]);

  useEffect(() => {
    if (autoRequest && locationPermission !== 'denied') {
      startWatching();
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [autoRequest, locationPermission, startWatching]);

  return {
    location: userLocation,
    permission: locationPermission,
    requestLocation,
    isGranted: locationPermission === 'granted',
    defaultLocation: FESTAC_CENTER,
  };
}
