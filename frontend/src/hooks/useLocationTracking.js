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
const MIN_SAVE_INTERVAL = 30 * 60 * 1000; // 30 minutes - minimum time between saves
const MIN_DISTANCE_THRESHOLD = 1000; // 1000 meters - minimum distance to trigger new save
const DISTANCE_CHECK_TIMEOUT = 60 * 60 * 1000; // 1 hour - sau 1 giờ thì không check khoảng cách nữa

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

// Tính khoảng cách giữa 2 tọa độ (Haversine formula) - đơn vị: meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Lưu vị trí vào server với anti-spam logic
const saveLocationToServer = async (userId, latitude, longitude, aqi = null, address = null, pm25 = null, forceCheck = true) => {
  try {
    if (!userId) {
      console.warn('[useLocationTracking] No userId, skipping save');
      return null;
    }

    // Anti-spam check: kiểm tra vị trí và thời gian lần lưu trước
    if (forceCheck) {
      try {
        const trackingDataStr = await AsyncStorage.getItem(LOCATION_TRACKING_KEY);
        if (trackingDataStr) {
          const trackingData = JSON.parse(trackingDataStr);
          const { lastSaveTime, lastLat, lastLng } = trackingData;
          
          const now = Date.now();
          const timeSinceLastSave = now - (lastSaveTime || 0);
          
          // Kiểm tra thời gian: phải cách ít nhất MIN_SAVE_INTERVAL
          if (timeSinceLastSave < MIN_SAVE_INTERVAL) {
            console.log(`[useLocationTracking] ⚠️ Spam prevention: Only ${Math.round(timeSinceLastSave / 1000)}s since last save (min: ${MIN_SAVE_INTERVAL / 1000}s)`);
            return { skipped: true, reason: 'time_threshold' };
          }
          
          // Kiểm tra khoảng cách: CHỈ kiểm tra nếu chưa đủ 1 giờ kể từ lần save gần nhất
          if (timeSinceLastSave < DISTANCE_CHECK_TIMEOUT) {
            if (lastLat && lastLng) {
              const distance = calculateDistance(lastLat, lastLng, latitude, longitude);
              if (distance < MIN_DISTANCE_THRESHOLD) {
                console.log(`[useLocationTracking] ⚠️ Spam prevention: Only ${Math.round(distance)}m from last location (min: ${MIN_DISTANCE_THRESHOLD}m)`);
                return { skipped: true, reason: 'distance_threshold' };
              }
            }
          } else {
            console.log(`[useLocationTracking] ℹ️ Over 1 hour since last save (${Math.round(timeSinceLastSave / 60000)} minutes), skipping distance check`);
          }
        }
      } catch (checkError) {
        console.warn('[useLocationTracking] Failed to check spam prevention:', checkError);
        // Continue with save even if check fails
      }
    }

    const finalAddress = address || await getAddressFromCoords(latitude, longitude);
    const finalAqi = (aqi !== null && aqi !== undefined) ? aqi : null;
    const finalPm25 = (pm25 !== null && pm25 !== undefined) ? pm25 : (finalAqi ? (finalAqi * 0.6) : null);

    // Skip saving if no AQI data available
    if (finalAqi === null) {
      console.warn('[useLocationTracking] ⚠️ No AQI data available, skipping save');
      return { skipped: true, reason: 'no_aqi_data' };
    }

    console.log('[useLocationTracking] ✅ Saving location:', {
      userId,
      lat: latitude,
      lng: longitude,
      aqi: finalAqi,
      pm25: finalPm25,
      address: finalAddress,
      source: aqi !== null ? 'manual' : 'auto-tracking' // Debug: nguồn gọi
    });

    const result = await api.saveLocation(userId, latitude, longitude, finalAqi, finalAddress, finalPm25);
    console.log('[useLocationTracking] Location saved successfully:', result);
    
    // Cập nhật thông tin lần lưu gần nhất
    await AsyncStorage.setItem(
      LOCATION_TRACKING_KEY,
      JSON.stringify({
        lastSaveTime: Date.now(),
        lastLat: latitude,
        lastLng: longitude
      })
    );
    
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
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

    // const latitude = 21.0278; // Example latitude
    // const longitude = 105.8342; // Example longitude

      // Nếu không có AQI trong additionalData, fetch từ backend
      let finalAqi = additionalData.aqi;
      let finalPm25 = additionalData.pm25;
      let finalAddress = additionalData.address;

      if (finalAqi === null || finalAqi === undefined) {
        try {
          // Fetch PM2.5 data từ backend
          console.log('[useLocationTracking] Fetching PM2.5 data from backend for auto-save...');
          const pm25Data = await api.getPM25Point(latitude, longitude);
          if (pm25Data && pm25Data.aqi) {
            finalAqi = pm25Data.aqi;
            finalPm25 = pm25Data.pm25;
            console.log('[useLocationTracking] ✅ Got real AQI from backend:', finalAqi);
          } else {
            console.warn('[useLocationTracking] ⚠️ Backend returned no AQI data, skip auto-save');
            return null; // Skip auto-save if no data
          }
        } catch (error) {
          console.warn('[useLocationTracking] ⚠️ Failed to fetch PM2.5 from backend:', error.message);
          return null; // Skip auto-save if backend fails
        }
      }

      // Lưu vào server (với spam check)
      console.log('[useLocationTracking] Attempting to save current location:', { latitude, longitude, finalAqi, finalPm25 , finalAddress});
      const result = await saveLocationToServer(userId, latitude, longitude, finalAqi, finalAddress, finalPm25, true);

      // Chỉ cập nhật lastSaveTimeRef nếu thực sự lưu thành công (không bị skip)
      if (result && !result.skipped) {
        lastSaveTimeRef.current = Date.now();
      }

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
        // console.log('[useLocationTracking] Location history data:', history);
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
