import { useEffect, useRef } from 'react';
import { useAppState } from '../contexts/AppStateContext';

interface UseDriverLocationOptions {
  enabled: boolean;
  interval?: number;
}

export function useDriverLocation({ enabled, interval = 15000 }: UseDriverLocationOptions) {
  const { currentUser, updateDriverLocation } = useAppState();
  const watchIdRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !currentUser || currentUser.role !== 'driver') {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    if (!navigator.geolocation) {
      console.warn('Geolocation API non disponible sur cet appareil.');
      return;
    }

    const scheduleSync = (lat: number, lng: number) => {
      updateDriverLocation({ lat, lng, updatedAt: new Date() }).catch((err) => {
        console.warn('[driver-location] update failed', err);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => scheduleSync(lat, lng), interval);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        scheduleSync(latitude, longitude);
      },
      (error) => {
        console.warn('[driver-location] watch error', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
      },
    );

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, interval, currentUser, updateDriverLocation]);
}
