import { useEffect } from 'react';
import { useUIStore } from '../stores/ui.store';
import { FESTAC_CENTER } from '../lib/shared';

export function useGeolocation(autoRequest = false) {
  const { userLocation, locationPermission, setUserLocation, setLocationPermission } = useUIStore();

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationPermission('granted');
      },
      () => {
        setLocationPermission('denied');
        // Fall back to Festac center
        setUserLocation(FESTAC_CENTER);
      },
      { timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  };

  useEffect(() => {
    if (autoRequest && locationPermission === 'unknown') {
      requestLocation();
    }
  }, [autoRequest]);

  return {
    location: userLocation,
    permission: locationPermission,
    requestLocation,
    isGranted: locationPermission === 'granted',
    defaultLocation: FESTAC_CENTER,
  };
}
