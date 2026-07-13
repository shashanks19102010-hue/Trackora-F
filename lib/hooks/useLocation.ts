/**
 * Real-time location tracking hook
 * Handles geolocation with high accuracy and error handling
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '@/lib/supabase-client';
import { Location } from '@/lib/types';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  timestamp: Date | null;
  isTracking: boolean;
  error: string | null;
}

export function useLocation(userId: string) {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    timestamp: null,
    isTracking: false,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    setLocation((prev) => ({ ...prev, isTracking: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, altitude } = position.coords;
        const timestamp = new Date(position.timestamp);

        setLocation((prev) => ({
          ...prev,
          latitude,
          longitude,
          accuracy,
          altitude,
          timestamp,
        }));

        db.insertLocation({
          user_id: userId,
          latitude,
          longitude,
          accuracy,
          altitude,
          timestamp: timestamp.toISOString(),
        }).catch((error) => console.error('Failed to save location:', error));
      },
      (error) => {
        setLocation((prev) => ({
          ...prev,
          error: `Geolocation error: ${error.message}`,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [userId]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLocation((prev) => ({ ...prev, isTracking: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { location, startTracking, stopTracking };
}
