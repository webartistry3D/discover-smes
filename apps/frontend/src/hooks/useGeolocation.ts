import { useEffect, useRef, useCallback } from 'react';
import { useUIStore } from '../stores/ui.store';
import { FESTAC_CENTER } from '../lib/shared';

const COORD_DECIMALS = 3;

function roundCoord(value: number) {
  return Math.round(value * 10 ** COORD_DECIMALS) / 10 ** COORD_DECIMALS;
}

export function useGeolocation(autoRequest = false) {
  const { userLocation, locationPermission, setUserLocation, setLocationPermission } = useUIStore();
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef(userLocation);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      setUserLocation(FESTAC_CENTER);
      return;
    }

    if (watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = roundCoord(position.coords.latitude);
        const lng = roundCoord(position.coords.longitude);

        if (
          lastLocationRef.current &&
          Math.abs(lat - lastLocationRef.current.lat) < 0.001 &&
          Math.abs(lng - lastLocationRef.current.lng) < 0.001
        ) {
          return;
        }

        lastLocationRef.current = { lat, lng };
        setUserLocation({ lat, lng });
        setLocationPermission('granted');
      },
      () => {
        setLocationPermission('denied');
        setUserLocation(FESTAC_CENTER);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
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
