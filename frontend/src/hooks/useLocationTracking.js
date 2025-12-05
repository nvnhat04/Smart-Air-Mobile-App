/**
 * useLocationTracking Hook
 * 
 * Tính năng:
 * - Tự động lưu vị trí mỗi giờ
 * - Lưu vị trí khi user xem detail
 * - Lấy lịch sử vị trí 15 ngày
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef } from 'react';
import api from '../services/api';

const LOCATION_TRACKING_KEY = '@location_tracking';
const TRACKING_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

// Helper để tính AQI từ PM2.5 (approximation)
const calculateAQI = (pm25) => {
  if (pm25 <= 12) return Math.round((pm25 / 12) * 50);
  if (pm25 <= 35.4) return Math.round(((pm25 - 12) / (35.4 - 12)) * 50 + 50);
  if (pm25 <= 55.4) return Math.round(((pm25 - 35.4) / (55.4 - 35.4)) * 50 + 100);
  if (pm25 <= 150.4) return Math.round(((pm25 - 55.4) / (150.4 - 55.4)) * 50 + 150);
  return Math.round(((pm25 - 150.4) / (250.4 - 150.4)) * 50 + 200);
};

// Reverse geocoding để lấy địa chỉ
const getAddressFromCoords = async (latitude, longitude) => {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results && results.length > 0) {
      const result = results[0];
      const parts = [
        result.street,
        result.district,
        result.city,
        result.region,
      ].filter(Boolean);
      return parts.join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  } catch (error) {
    console.warn('[useLocationTracking] Reverse geocoding failed:', error);
  }
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
};

// Lưu vị trí vào server
const saveLocationToServer = async (userId, latitude, longitude, aqi = null, address = null, pm25 = null) => {
  try {
    if (!userId) {
      console.warn('[useLocationTracking] No userId, skipping save');
      return null;
    }

    const finalAddress = address || await getAddressFromCoords(latitude, longitude);
    const finalAqi = aqi !== null ? aqi : 75; // Default AQI if not provided
    const finalPm25 = pm25 !== null ? pm25 : (finalAqi ? (finalAqi * 0.6) : 45); // Approximate PM2.5 from AQI

    console.log('[useLocationTracking] Saving location:', {
      userId,
      lat: latitude,
      lng: longitude,
      aqi: finalAqi,
      pm25: finalPm25,
      address: finalAddress
    });

    const result = await api.saveLocation(userId, latitude, longitude, finalAqi, finalAddress, finalPm25);
    console.log('[useLocationTracking] Location saved successfully:', result);
    
    return result;
  } catch (error) {
    console.error('[useLocationTracking] Failed to save location:', error);
    return null;
  }
};

/**
 * Hook chính để tracking vị trí
 * @param {boolean} enabled - Enable/disable tracking
 * @returns {Object} { saveCurrentLocation, getLocationHistory }
 */
export const useLocationTracking = (enabled = true) => {
  const intervalRef = useRef(null);
  const lastSaveTimeRef = useRef(null);

  // Hàm lưu vị trí hiện tại
  const saveCurrentLocation = useCallback(async (additionalData = {}) => {
    try {
      const getUserId = async () => {
        try {
          const authStr = await AsyncStorage.getItem('auth');
          if (authStr) {
            const auth = JSON.parse(authStr);
            return auth.uid || auth.user_id || null;
          }
        } catch (error) {
          console.warn('[useLocationTracking] Failed to get userId:', error);
        }
        return null;
      };

      const userId = await getUserId();
      if (!userId) {
        console.warn('[useLocationTracking] No userId found');
        return null;
      }

      // Kiểm tra permission
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[useLocationTracking] Location permission not granted');
        return null;
      }

      // Lấy vị trí hiện tại
    //   const location = await Location.getCurrentPositionAsync({
    //     accuracy: Location.Accuracy.Balanced,
    //   });

    //   const { latitude, longitude } = location.coords;
    const latitude = 21.0278; // Example latitude
    const longitude = 105.8342; // Example longitude

      // Tính AQI nếu có PM2.5 trong additionalData
      const { aqi, address, pm25 } = additionalData;

      // Lưu vào server
      const result = await saveLocationToServer(userId, latitude, longitude, aqi, address, pm25);

      // Cập nhật last save time
      lastSaveTimeRef.current = Date.now();
      await AsyncStorage.setItem(
        LOCATION_TRACKING_KEY,
        JSON.stringify({ lastSaveTime: lastSaveTimeRef.current })
      );

      return result;
    } catch (error) {
      console.error('[useLocationTracking] Failed to save current location:', error);
      return null;
    }
  }, []);


  // Lấy lịch sử vị trí 15 ngày
  const getLocationHistory = useCallback(async (days = 15) => {
    try {
      const history = await api.getLocationHistory(days);
      console.log('[useLocationTracking] Location history loaded:', history.length, 'records');
        console.log('[useLocationTracking] Location history data:', history);
      return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('[useLocationTracking] Failed to get location history:', error);
      return [];
    }
  }, []);

  // Tự động lưu vị trí mỗi giờ
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const startAutoTracking = async () => {
      // Load last save time
      try {
        const trackingDataStr = await AsyncStorage.getItem(LOCATION_TRACKING_KEY);
        if (trackingDataStr) {
          const trackingData = JSON.parse(trackingDataStr);
          lastSaveTimeRef.current = trackingData.lastSaveTime;
        }
      } catch (error) {
        console.warn('[useLocationTracking] Failed to load tracking data:', error);
      }

      // Kiểm tra xem đã đến giờ lưu chưa
      const checkAndSave = async () => {
        const now = Date.now();
        const lastSave = lastSaveTimeRef.current || 0;
        const timeSinceLastSave = now - lastSave;

        if (timeSinceLastSave >= TRACKING_INTERVAL) {
          console.log('[useLocationTracking] Auto-saving location (hourly)');
          await saveCurrentLocation();
        }
      };

      // Chạy ngay lần đầu
      await checkAndSave();

      // Set interval để check mỗi 10 phút (để không miss giờ lưu)
      intervalRef.current = setInterval(checkAndSave, 10 * 60 * 1000);
    };

    startAutoTracking();

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled]);

  return {
    saveCurrentLocation,
    getLocationHistory,
  };
};

export default useLocationTracking;
