import { useCallback, useMemo, useState } from 'react';
import api from '../../services/api';
import { getExposureMultiplier } from '../../utils';
import { getTopLocationsByDay } from '../../utils/analyticsUtils';
import { getAQIColor } from '../../utils';
import { processLocationHistory as processHistory } from '../../utils';

/**
 * Quản lý logic tổng quan phơi nhiễm (overview tab)
 * - loadOverviewData (lazy)
 * - refreshChart
 * - tính toán các chỉ số past/future, pm2.5 quy đổi, thuốc lá
 */
export default function useExposureOverview(historyData = []) {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(7);
  const [exposureMode, setExposureMode] = useState('outdoor'); // 'outdoor', 'indoor', 'indoor_purifier'
  const [showExposureMenu, setShowExposureMenu] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState(7); // 1, 3, 5, 7
  const [showStatsPeriodMenu, setShowStatsPeriodMenu] = useState(false);
  const [locationStats, setLocationStats] = useState(null);
  const [overviewLoaded, setOverviewLoaded] = useState(false);

  const exposureMultiplier = useMemo(() => getExposureMultiplier(exposureMode), [exposureMode]);

  const loadOverviewData = useCallback(
    async ({ historyData, userLocation, setLoading }) => {
      if (overviewLoaded) return;
      setLoading?.(true);
      try {
        // Call API stats
        try {
          const stats = await api.getLocationStats(statsPeriod);
          setLocationStats(stats);
        } catch (statsError) {
          console.warn('[useExposureOverview] Failed to load stats:', statsError.message);
        }

        // Process history lần đầu (không phụ thuộc statsPeriod cho chart)
        if (analyticsData.length === 0) {
          const processed = await processHistory(historyData, false, userLocation);
          setAnalyticsData(processed);
        }
        setOverviewLoaded(true);
      } catch (error) {
        console.error('[useExposureOverview] Failed to load overview:', error);
      } finally {
        setLoading?.(false);
      }
    },
    [analyticsData.length, overviewLoaded, statsPeriod],
  );

  const reloadStatsOnly = useCallback(
    async ({ setLoading }) => {
      setLoading?.(true);
      try {
        const stats = await api.getLocationStats(statsPeriod);
        setLocationStats(stats);
      } catch (err) {
        console.warn('[useExposureOverview] Failed to reload stats:', err.message);
      } finally {
        setLoading?.(false);
      }
    },
    [statsPeriod],
  );

  const refreshChart = useCallback(
    async ({ historyData, userLocation, setLoading }) => {
      setLoading?.(true);
      try {
        const processed = await processHistory(historyData, true, userLocation);
        setAnalyticsData(processed);
        setOverviewLoaded(true);
      } catch (err) {
        console.error('[useExposureOverview] Failed to refresh chart:', err);
      } finally {
        setLoading?.(false);
      }
    },
    [],
  );

  // Derived data
  const pastSlice = useMemo(() => analyticsData.filter((d) => d.type === 'past'), [analyticsData]);
  const presentSlice = useMemo(() => analyticsData.filter((d) => d.type === 'present'), [analyticsData]);
  const futureAll = useMemo(() => analyticsData.filter((d) => d.type === 'future'), [analyticsData]);
  const futureSlice = useMemo(
    () => futureAll.slice(0, Math.max(0, Number(statsPeriod) || 0)),
    [futureAll, statsPeriod],
  );

  const pastAvg = useMemo(() => {
    if (locationStats) return Math.round((locationStats.avg_aqi || 0) * exposureMultiplier);
    if (pastSlice.length === 0) return 0;
    const avg = pastSlice.reduce((sum, d) => sum + d.aqi, 0) / pastSlice.length;
    return Math.round(avg * exposureMultiplier);
  }, [locationStats, pastSlice, exposureMultiplier]);

  const futureMinAqi = futureSlice.length > 0 ? Math.min(...futureSlice.map((d) => d.aqi)) : null;
  const futureMaxAqi = futureSlice.length > 0 ? Math.max(...futureSlice.map((d) => d.aqi)) : null;
  const futureAvg = futureSlice.length > 0
    ? Math.round(
        futureSlice.reduce((sum, d) => sum + d.aqi, 0) / futureSlice.length * exposureMultiplier,
      )
    : 0;

  const aqiToPm25 = (aqi) => {
    if (aqi <= 50) return ((aqi - 0) / (50 - 0)) * (12.0 - 0) + 0;
    if (aqi <= 100) return ((aqi - 51) / (100 - 51)) * (35.4 - 12.1) + 12.1;
    if (aqi <= 150) return ((aqi - 101) / (150 - 101)) * (55.4 - 35.5) + 35.5;
    if (aqi <= 200) return ((aqi - 151) / (200 - 151)) * (150.4 - 55.5) + 55.5;
    if (aqi <= 300) return ((aqi - 201) / (300 - 201)) * (250.4 - 150.5) + 150.5;
    return ((aqi - 301) / (500 - 301)) * (500.4 - 250.5) + 250.5;
  };

  const pastPm25Avg = locationStats
    ? (locationStats.avg_pm25 * exposureMultiplier).toFixed(1)
    : aqiToPm25(pastAvg).toFixed(1);
  const futurePm25Avg = aqiToPm25(futureAvg).toFixed(1);

  const cigPast = locationStats
    ? (pastPm25Avg * (locationStats.length === 0 ? 1 : locationStats.length) / 22).toFixed(1)
    : '0.0';
  const cigFuture = (Number(futurePm25Avg) * (Number(statsPeriod) || 7) / 22).toFixed(1);

  const diff = futureAvg - pastAvg;

  // topLocationsByDay nên được tạo từ historyData (raw records), không phải từ analyticsData
  const topLocationsByDay = useMemo(() => getTopLocationsByDay(historyData), [historyData]);

  const selectedData = analyticsData[selectedIdx] || {
    key: '0',
    date: '--/--',
    aqi: 0,
    location: 'Chưa có dữ liệu',
    type: 'present',
  };

  return {
    // state
    analyticsData,
    setAnalyticsData,
    selectedIdx,
    setSelectedIdx,
    exposureMode,
    setExposureMode,
    showExposureMenu,
    setShowExposureMenu,
    statsPeriod,
    setStatsPeriod,
    showStatsPeriodMenu,
    setShowStatsPeriodMenu,
    locationStats,
    setLocationStats,
    overviewLoaded,
    setOverviewLoaded,

    // actions
    loadOverviewData,
    reloadStatsOnly,
    refreshChart,

    // derived
    exposureMultiplier,
    pastSlice,
    presentSlice,
    futureSlice,
    futureMinAqi,
    futureMaxAqi,
    futureAvg,
    pastAvg,
    pastPm25Avg,
    futurePm25Avg,
    cigPast,
    cigFuture,
    diff,
    topLocationsByDay,
    selectedData,
    getAQIColor, // convenient export for rendering
  };
}


