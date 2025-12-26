import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

/**
 * Quản lý danh sách địa điểm "trốn bụi" (escape)
 * - Lazy load khi activeTab === 'escape' và có userLocation
 * - Lưu trạng thái loading, đã load, bán kính lọc, số ngày dự báo
 */
export default function useEscapeDestinations({ baseDestinations, userLocation, activeTab }) {
  const [escapeDestinations, setEscapeDestinations] = useState([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [destinationsLoaded, setDestinationsLoaded] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(100);
  const [showRadiusMenu, setShowRadiusMenu] = useState(false);
  const [escapeForecastDays, setEscapeForecastDays] = useState(3);
  const [showEscapeDaysMenu, setShowEscapeDaysMenu] = useState(false);

  // Helpers
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateDriveTime = (distance) => {
    const avgSpeed = 40; // km/h
    const hours = distance / avgSpeed;
    if (hours < 1) return `${Math.round(hours * 60)} phút`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
  };

  const loadDestinationsAQI = useCallback(async () => {
    if (!userLocation) return;
    setLoadingDestinations(true);
    try {
      const results = await Promise.all(
        baseDestinations.map(async (dest) => {
          try {
            const distance = Math.round(
              calculateDistance(userLocation.latitude, userLocation.longitude, dest.lat, dest.lon),
            );
            const driveTime = calculateDriveTime(distance);

            const daysToFetch = Math.min(Math.max(1, escapeForecastDays), 7);
            const forecastData = await api.getPM25Forecast(dest.lat, dest.lon, daysToFetch);

            // Lấy forecast hiện tại (cuối mảng)
            const idxForSummary = Math.min(
              Math.max(0, daysToFetch - 1),
              (forecastData?.forecast?.length || 1) - 1,
            );
            const currentForecast = forecastData?.forecast?.[idxForSummary];
            const currentAqi = currentForecast?.aqi || 0;

            // Forecast cho ngày target (escapeForecastDays)
            const now = new Date();
            const targetFuture = new Date(
              now.getTime() + (Math.max(1, Math.min(escapeForecastDays, 7)) * 24 * 60 * 60 * 1000),
            );
            const targetDateStr = targetFuture.toISOString().split('T')[0];
            const forecastForTarget = forecastData?.forecast?.find((f) => f.date === targetDateStr);

            let aqiFuture = currentAqi;
            let pm25Future = currentForecast?.pm25 || 0;
            let hasForecast = false;

            if (forecastForTarget && forecastForTarget.aqi > 0) {
              aqiFuture = forecastForTarget.aqi;
              pm25Future = forecastForTarget.pm25;
              hasForecast = true;
            }

            return {
              ...dest,
              aqi: aqiFuture,
              pm25: pm25Future,
              currentAqi,
              hasForecast,
              distance,
              driveTime,
              weatherType: currentForecast?.weather?.main === 'Clear' ? 'sun' : 'cloud',
              precipitation: currentForecast?.rain_sum || 0,
              temp_max: currentForecast?.temp_max || null,
              temp_min: currentForecast?.temp_min || null,
            };
          } catch (error) {
            // Fallback khi lỗi
            const distance = Math.round(
              calculateDistance(userLocation.latitude, userLocation.longitude, dest.lat, dest.lon),
            );
            return {
              ...dest,
              aqi: 0,
              pm25: 0,
              currentAqi: 0,
              hasForecast: false,
              distance,
              driveTime: calculateDriveTime(distance),
              temp: 20,
              weatherType: 'cloud',
            };
          }
        }),
      );

      setEscapeDestinations(results);
      setDestinationsLoaded(true);
    } catch (error) {
      console.error('[useEscapeDestinations] Failed to load destinations:', error);
    } finally {
      setLoadingDestinations(false);
    }
  }, [baseDestinations, userLocation, escapeForecastDays]);

  // Lazy load khi chuyển tab Escape + có userLocation
  useEffect(() => {
    if (activeTab !== 'escape' || !userLocation || destinationsLoaded) return;
    loadDestinationsAQI();
  }, [activeTab, userLocation, destinationsLoaded, loadDestinationsAQI]);

  // Reset loaded flag khi đổi số ngày forecast để load lại
  useEffect(() => {
    setDestinationsLoaded(false);
  }, [escapeForecastDays]);

  const filteredDestinations = useMemo(
    () =>
      escapeDestinations
        .filter((d) => d.distance <= selectedRadius && d.currentAqi > 0)
        .sort((a, b) => a.aqi - b.aqi),
    [escapeDestinations, selectedRadius],
  );

  return {
    escapeDestinations,
    filteredDestinations,
    loadingDestinations,
    destinationsLoaded,
    selectedRadius,
    setSelectedRadius,
    showRadiusMenu,
    setShowRadiusMenu,
    escapeForecastDays,
    setEscapeForecastDays,
    showEscapeDaysMenu,
    setShowEscapeDaysMenu,
    setDestinationsLoaded,
    loadDestinationsAQI,
  };
}


