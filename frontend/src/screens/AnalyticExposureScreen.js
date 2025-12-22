import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocationTracking } from '../hooks/useLocationTracking';
import api from '../services/api';
import {
  getAQIColor,
  getExposureMultiplier,
  processLocationHistory as processHistory,
} from '../utils';
import { getTopLocationsByDay } from '../utils/analyticsUtils';

export default function AnalyticExposureScreen() {
  const [showStatsInfo, setShowStatsInfo] = useState(false);
  const { getLocationHistory } = useLocationTracking(true);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false); // Changed to false - only load when needed
  const [selectedIdx, setSelectedIdx] = useState(7);
  const [selectedRadius, setSelectedRadius] = useState(100);
  const [showRadiusMenu, setShowRadiusMenu] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'history', 'escape'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'last3days', 'last7days', or specific date (YYYY-MM-DD)
  const [exposureMode, setExposureMode] = useState('outdoor'); // 'outdoor', 'indoor', 'indoor_purifier'
  const [showExposureMenu, setShowExposureMenu] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState(7); // 1, 3, or 7 days
  const [showStatsPeriodMenu, setShowStatsPeriodMenu] = useState(false);
  const [userLocation, setUserLocation] = useState(null); // Vị trí thực của user từ GPS/history
  const [locationStats, setLocationStats] = useState(null); // Stats from API
  const [escapeDestinations, setEscapeDestinations] = useState([]); // Destinations with real AQI
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [destinationsLoaded, setDestinationsLoaded] = useState(false); // Track if already loaded
  const [escapeForecastDays, setEscapeForecastDays] = useState(3); // days to request for escape forecasts (max 7)
  const [showEscapeDaysMenu, setShowEscapeDaysMenu] = useState(false);
  const [overviewLoaded, setOverviewLoaded] = useState(false); // Track overview tab loaded
  const [historyLoaded, setHistoryLoaded] = useState(false); // Track history tab loaded
  const [dayStats, setDayStats] = useState(null); // stats for a selected specific day
  // When the date filter changes in the History tab, load the corresponding day stats
  useEffect(() => {
    if (!dateFilter || typeof dateFilter !== 'string') return;

    // Support both specific date strings (YYYY-MM-DD) and the special 'today' filter
    let targetDate = null;
    if (dateFilter === 'today') {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      targetDate = `${yyyy}-${mm}-${dd}`;
    } else {
      const isSpecificDate = /^\d{4}-\d{2}-\d{2}$/.test(dateFilter);
      if (isSpecificDate) targetDate = dateFilter;
    }

    if (!targetDate) {
      setDayStats(null);
      return;
    }

    let cancelled = false;
    const fetchStats = async () => {
      try {
        setDayStats(null);
        console.log('[AnalyticExposureScreen] Loading day stats for date:', targetDate);
        const stats = await api.getLocationStatsForDay(targetDate);
        if (!cancelled) {
          setDayStats(stats);
          setHistoryLoaded(true);
        }
      } catch (err) {
        if (!cancelled) console.error('[AnalyticExposureScreen] Failed to load day stats:', err.message || err);
      }
    };

    fetchStats();
    return () => { cancelled = true; };
  }, [dateFilter]);
  
  // Load location history - only basic data, no forecast yet
  const loadHistoryBasic = useCallback(async () => {
    try {
      const history = await getLocationHistory(8); // Chỉ lấy 7 ngày
      setHistoryData(history);
      console.log('[AnalyticExposureScreen] Loaded 7-day history:', history.length, 'records');
      
      // Lấy vị trí gần nhất của user từ history
      if (history.length > 0) {
        const latestLocation = history[0]; // History đã sorted theo timestamp giảm dần
        setUserLocation({
          name: latestLocation.address || 'Vị trí của bạn',
          address: latestLocation.address,
          aqi: latestLocation.aqi,
          latitude: latestLocation.latitude,
          longitude: latestLocation.longitude,
        });
        // console.log('[AnalyticExposureScreen] User location set from history:', latestLocation.address);
      }
      setHistoryLoaded(true);
      return history;
    } catch (error) {
      console.error('[AnalyticExposureScreen] Failed to load history:', error);
      return [];
    }
  }, [getLocationHistory]);

  // Load overview data with forecast (lazy loaded when overview tab is active)
  const loadOverviewData = useCallback(async () => {
    if (overviewLoaded) return; // Already loaded

    setLoading(true);
    try {
      // Call API to get location stats
      try {
        const stats = await api.getLocationStats(statsPeriod);
        setLocationStats(stats);
        // console.log('[AnalyticExposureScreen] Location stats:', stats);
      } catch (statsError) {
        console.warn('[AnalyticExposureScreen] Failed to load stats:', statsError.message);
      }

      // Process history chỉ khi lần đầu load (không phụ thuộc statsPeriod)
      if (analyticsData.length === 0) {
        const processed = await processHistory(historyData, false, userLocation);
        setAnalyticsData(processed);
        // console.log('[AnalyticExposureScreen] Processed analytics data:', processed.length, 'days');
        // console.log('[AnalyticExposureScreen] Sample data:', processed.slice(0, 3));
      }
      setOverviewLoaded(true);
    } catch (error) {
      console.error('[AnalyticExposureScreen] Failed to load overview:', error);
    } finally {
      setLoading(false);
    }
  }, [historyData, overviewLoaded, statsPeriod, analyticsData.length]);

  // Khi đổi statsPeriod chỉ gọi lại API stats, không reload lại chart/processHistory
  useEffect(() => {
    const reloadStatsOnly = async () => {
      setLoading(true);
      try {
        const stats = await api.getLocationStats(statsPeriod);
        setLocationStats(stats);
        // console.log('[AnalyticExposureScreen] Reloaded stats only:', stats);
      } catch (statsError) {
        console.warn('[AnalyticExposureScreen] Failed to reload stats:', statsError.message);
      } finally {
        setLoading(false);
      }
    };
    if (overviewLoaded) {
      reloadStatsOnly();
    }
  }, [statsPeriod, overviewLoaded]);

  // Manual reload function for history tab
  const reloadHistory = useCallback(async () => {
    setLoading(true);
    try {
      await loadHistoryBasic();
      // If overview was loaded, reload it too
      if (overviewLoaded) {
        setOverviewLoaded(false);
        await loadOverviewData();
      }
    } finally {
      setLoading(false);
    }
  }, [loadHistoryBasic, loadOverviewData, overviewLoaded]);

  // Refresh the chart (force re-process history and forecasts)
  const refreshChart = useCallback(async () => {
    setLoading(true);
    try {
      const processed = await processHistory(historyData, true, userLocation);
      setAnalyticsData(processed);
      setOverviewLoaded(true);
    } catch (err) {
      console.error('[AnalyticExposureScreen] Failed to refresh chart:', err);
    } finally {
      setLoading(false);
    }
  }, [historyData]);

  // Initial load - only basic history data
  useEffect(() => {
    loadHistoryBasic();
  }, [loadHistoryBasic]);

  // Lazy load data khi switch tab
  useEffect(() => {
    if (activeTab === 'overview' && !overviewLoaded && historyData.length > 0) {
      console.log('[AnalyticExposureScreen] Lazy loading overview data...');
      loadOverviewData();
    }
  }, [activeTab, overviewLoaded, historyData, loadOverviewData]);

  // Reload when screen becomes focused and auth changes (event-based, no polling)
  const isFocused = useIsFocused();
  const lastTokenRef = useRef(null);
  useEffect(() => {
    if (!isFocused) return;

    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('auth');
        const auth = raw ? JSON.parse(raw) : null;
        const token = auth?.token || auth?.access_token || null;
        // console.log('[AnalyticExposureScreen] auth token check, current:', token, 'last:', lastTokenRef.current);
        if (token !== lastTokenRef.current) {
          lastTokenRef.current = token;
          if (!mounted) return;
          setOverviewLoaded(false);
          setHistoryLoaded(false);
          setAnalyticsData([]);
          setHistoryData([]);
          setDayStats(null);
          const hist = await loadHistoryBasic();
          if (activeTab === 'overview') {
            try {
              const processed = await processHistory(hist, true, userLocation);
              setAnalyticsData(processed);
              setOverviewLoaded(true);
            } catch (e) {
              console.error('[AnalyticExposureScreen] Failed to process history after auth change:', e);
            }
          }
        }
      } catch (err) {
        // ignore
      }
    })();

    return () => { mounted = false; };
  }, [isFocused, activeTab, loadHistoryBasic, loadOverviewData]);

  // Calculate distance between two coordinates (Haversine formula)
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

  // Calculate estimated drive time based on distance
  const calculateDriveTime = (distance) => {
    const avgSpeed = 40; // km/h average speed
    const hours = distance / avgSpeed;
    if (hours < 1) {
      return `${Math.round(hours * 60)} phút`;
    }
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
  };

  // Base destinations with coordinates and recommendations
  const baseDestinations = useMemo(
    () => [
      { 
        id: 1, 
        name: 'Khu đô thị Ecopark, Hưng Yên', 
        recommendation: 'Công viên sinh thái, hồ nước rộng, đạp xe dạo chơi',
        lat: 20.9578,
        lon: 105.9369,
        img_url: 'https://ttgland.vn/Areas/Admin/Content/Fileuploads/images/khu-do-thi-ecopark-hung-yen-tong-the.jpg'
      },
      { 
        id: 2, 
        name: 'Công viên Yên Sở', 
        recommendation: 'Hồ rộng, chạy bộ, picnic gia đình, không gian xanh',
        lat: 20.9642,
        lon: 105.8546,
        img_url: 'https://mia.vn/media/uploads/blog-du-lich/trai-nghiem-thu-vi-cam-trai-tai-cong-vien-yen-so-3-1639940800.jpeg'
      },
      { 
        id: 3, 
        name: 'Làng cổ Đường Lâm', 
        recommendation: 'Làng cổ 1200 năm, nhà truyền thống, ẩm thực đặc sản',
        lat: 21.1570,
        lon: 105.4725,
        img_url: 'https://cdn.vntrip.vn/cam-nang/wp-content/uploads/2017/11/lang-co-duong-lam-6-e1509792323651.jpg'
      },
      { 
        id: 4, 
        name: 'Khu du lịch Sơn Tây', 
        recommendation: 'Thành cổ Sơn Tây, núi non hùng vĩ, không khí trong lành',
        lat: 21.1350,
        lon: 105.5053,
        img_url: 'https://cdn.justfly.vn/700x464/media/202106/30/1625050495-thanh-co-son-tay-3.jpg'
      },
      { 
        id: 5, 
        name: 'Vườn Vua Resort', 
        recommendation: 'Resort sinh thái, vườn cây ăn trái, trải nghiệm làm vườn',
        lat: 21.1051,
        lon: 105.2952,
        img_url: 'https://chungcudep.net/wp-content/uploads/2019/06/nha-hang-sen-du-an-vuon-vua-resort-phu-tho.jpg'
      },
      { 
        id: 6, 
        name: 'Vườn quốc gia Ba Vì, Hà Nội', 
        recommendation: 'Vườn quốc gia, suối nước nóng, cắm trại rừng thông',
        lat: 21.0805,
        lon: 105.3592,
        img_url: 'https://reviewvilla.vn/wp-content/uploads/2022/06/vuon-quoc-gia-ba-vi-14.jpg'
      },
      { 
        id: 7, 
        name: 'Chùa Hương, Mỹ Đức', 
        recommendation: 'Di tích lịch sử, chèo thuyền suối Yến, núi non hữu tình',
        lat: 20.6139,
        lon: 105.7711,
        img_url: 'https://lh5.googleusercontent.com/M_3FhIKKa4tPnG3d4leZAgdpKmiUOr2gdaz_itT4Yj8g0DJOinb_hCsozYg8NfWBBkwsywYYIqaWgjj_EptAZTQvb8OhCgzPPQK5uqelN0TZX0GJW0h3eXZ24uBWfA8TSYBUwWdp71DiDHw36WPgq-U'
      },
      { 
        id: 8, 
        name: 'Đại Lải, Phú Thọ', 
        recommendation: 'Hồ Đại Lải xanh mát, resort nghỉ dưỡng, thể thao nước',
        lat: 21.3289,
        lon: 105.7274,
        img_url: 'https://cdn.tgdd.vn/Files/2021/07/05/1365854/nhung-kinh-nghiem-kham-pha-ho-dai-lai-vinh-phuc-202202141456396264.jpg'
      },
      { 
        id: 9, 
        name: 'Tam Đảo, Phú Thọ', 
        recommendation: 'Săn mây, check-in Thác Bạc, khí hậu mát mẻ quanh năm',
        lat: 21.4546,
        lon: 105.6414,
        img_url: 'https://media.thuonghieuvaphapluat.vn/upload/2021/11/18/tam-dao-vinh-phuc-thac-mac-gia-trong-xe-qua-cao-bao-ve-xo-xat-voi-khach-du-lichfb2.jpg'
      },
      { 
        id: 10, 
        name: 'Thung Nham, Ninh Bình', 
        recommendation: 'Hang động, vườn chim, kayaking, cảnh quan tuyệt đẹp',
        lat: 20.2192,
        lon: 105.8910,
        img_url: 'https://35chill.vn/wp-content/uploads/2021/07/camnhi-202922032904-Vuon-chim-Thung-Nham-Ninh-Binh-2-1.jpg'
      },
    ],
    [],
  );

  // Load destinations only when escape tab is active (lazy loading)
  useEffect(() => {
    if (activeTab !== 'escape' || !userLocation || destinationsLoaded) return;

    const loadDestinationsAQI = async () => {
      setLoadingDestinations(true);
      try {
        // Optimize: Load all destinations in parallel (no batching)
        console.log('[AnalyticExposureScreen] Loading all destinations in parallel...');
        
        const results = await Promise.all(
          baseDestinations.map(async (dest) => {
            try {
              // Calculate distance and drive time
              const distance = Math.round(calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                dest.lat,
                dest.lon
              ));
              const driveTime = calculateDriveTime(distance);

              // Use forecast API only (includes current data in response)
              const daysToFetch = Math.min(Math.max(1, escapeForecastDays), 7);
              const forecastData = await api.getPM25Forecast(dest.lat, dest.lon, daysToFetch);
              console.log(`[AnalyticExposureScreen] Loaded forecast for ${dest.name}: requested ${daysToFetch} days, got ${forecastData?.forecast?.length || 0}`);
              
              // Get forecast for the configured future window (escapeForecastDays days)
              const now = new Date();
              const targetFuture = new Date(now.getTime() + (Math.max(1, Math.min(escapeForecastDays, 7)) * 24 * 60 * 60 * 1000));
              const targetDateStr = targetFuture.toISOString().split('T')[0];
              
              // Get current data (first item in forecast)
              // Use the last item in the returned forecast array as the 'current' summary index
              const idxForSummary = Math.min(Math.max(0, daysToFetch - 1), (forecastData?.forecast?.length || 1) - 1);
              const currentForecast = forecastData?.forecast?.[idxForSummary];
              const currentAqi = currentForecast?.aqi || 0;
              
              // Find the forecast for the selected future window
              const forecastForTarget = forecastData?.forecast?.find(f => f.date === targetDateStr);
              
              let aqi48h = currentAqi;
              let pm25_48h = currentForecast?.pm25 || 0;
              let hasForecast = false;
              
              if (forecastForTarget && forecastForTarget.aqi > 0) {
                aqi48h = forecastForTarget.aqi;
                pm25_48h = forecastForTarget.pm25;
                hasForecast = true;
              }
              
              return {
                ...dest,
                aqi: aqi48h,
                pm25: pm25_48h,
                currentAqi,
                hasForecast,
                distance,
                driveTime,
                // temp: currentForecast?.weather?.temp || 20,
                weatherType: currentForecast?.weather?.main === 'Clear' ? 'sun' : 'cloud',
                precipitation: currentForecast?.rain_sum || 0,
                temp_max: currentForecast?.temp_max || null,
                temp_min: currentForecast?.temp_min || null,
              };
            } catch (error) {
              console.error(`[AnalyticExposureScreen] Failed to load ${dest.name}:`, error.message);
              // Return with minimal data on error
              const distance = Math.round(calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                dest.lat,
                dest.lon
              ));
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
          })
        );

        // console.log('[AnalyticExposureScreen] Loaded destinations:', results.length, 'total');
        // console.log('[AnalyticExposureScreen] With forecast:', results.filter(d => d.hasForecast).length);
        setEscapeDestinations(results);
        setDestinationsLoaded(true); // Mark as loaded to avoid reloading
      } catch (error) {
        console.error('[AnalyticExposureScreen] Failed to load destinations:', error);
      } finally {
        setLoadingDestinations(false);
      }
    };

    loadDestinationsAQI();
  }, [activeTab, userLocation, baseDestinations, destinationsLoaded, escapeForecastDays]);


  const filteredDestinations = useMemo(
    () =>
      escapeDestinations
        .filter((d) => d.distance <= selectedRadius && d.currentAqi > 0) // Only filter out complete API failures
        .sort((a, b) => a.aqi - b.aqi),
    [escapeDestinations, selectedRadius],
  );

  // Filter history data theo ngày (PHẢI ĐẶT TRƯỚC if/return để tuân thủ Rules of Hooks)
  const filteredHistoryData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return historyData.filter(item => {
      const itemDate = new Date(item.timestamp);
      const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      
      switch (dateFilter) {
        case 'today':
          return itemDate >= today;
        case 'last3days':
          const threeDaysAgo = new Date(today);
          threeDaysAgo.setDate(today.getDate() - 3);
          return itemDate >= threeDaysAgo;
        case 'last7days':
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          return itemDate >= sevenDaysAgo;
        case 'all':
          return true;
        default:
          // Check if it's a specific date (YYYY-MM-DD format)
          if (dateFilter && dateFilter.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateFilter.split('-').map(Number);
            const filterDate = new Date(year, month - 1, day);
            return itemDateOnly.getTime() === filterDate.getTime();
          }
          return true;
      }
    });
  }, [historyData, dateFilter]);

  const selectedData = analyticsData[selectedIdx] || {
    key: '0',
    date: '--/--',
    aqi: 0,
    location: 'Chưa có dữ liệu',
    type: 'present',
  };

  // Hàm tính hệ số phơi nhiễm
  const exposureMultiplier = getExposureMultiplier(exposureMode);

  // Use API stats if available, otherwise fallback to manual calculation
  const pastAvg = locationStats 
    ? Math.round(locationStats.avg_aqi * exposureMultiplier)
    : analyticsData.filter(d => d.type === 'past').length > 0
      ? Math.round(analyticsData.filter(d => d.type === 'past').reduce((sum, d) => sum + d.aqi, 0) / analyticsData.filter(d => d.type === 'past').length * exposureMultiplier)
      : 0;
  const pastSum = analyticsData.filter(d => d.type === 'past').reduce((sum, d) => sum + d.aqi, 0);
  // Phân chia dựa trên type (past/present/future) thay vì index cố định
  const pastSlice = analyticsData.filter(d => d.type === 'past');
  // console.log('[AnalyticExposureScreen] pastSlice length:', pastSlice);
  const presentSlice = analyticsData.filter(d => d.type === 'present');
  // Respect `statsPeriod` when computing future slice — only include next N days
  const futureAll = analyticsData.filter(d => d.type === 'future');
  const futureSlice = futureAll.slice(0, Math.max(0, Number(statsPeriod) || 0));

  // Thống kê top location từng ngày quá khứ (7 ngày)
  const topLocationsByDay = useMemo(() => getTopLocationsByDay(historyData), [historyData]);

  // Min/max AQI tuần tới
  const futureMinAqi = futureSlice.length > 0 ? Math.min(...futureSlice.map(d => d.aqi)) : null;
  const futureMaxAqi = futureSlice.length > 0 ? Math.max(...futureSlice.map(d => d.aqi)) : null;
  // Tính trung bình chỉ cho các ngày có data và áp dụng hệ số phơi nhiễm
  const futureAvg = futureSlice.length > 0
    ? Math.round(futureSlice.reduce((sum, d) => sum + d.aqi, 0) / futureSlice.length * exposureMultiplier)
    : 0;
  const futureSum = futureSlice.reduce((sum, d) => sum + d.aqi, 0);
  const diff = futureAvg - pastAvg;

  // Convert AQI to PM2.5 using proper EPA formula
  const aqiToPm25 = (aqi) => {
    if (aqi <= 50) return ((aqi - 0) / (50 - 0)) * (12.0 - 0) + 0;
    if (aqi <= 100) return ((aqi - 51) / (100 - 51)) * (35.4 - 12.1) + 12.1;
    if (aqi <= 150) return ((aqi - 101) / (150 - 101)) * (55.4 - 35.5) + 35.5;
    if (aqi <= 200) return ((aqi - 151) / (200 - 151)) * (150.4 - 55.5) + 55.5;
    if (aqi <= 300) return ((aqi - 201) / (300 - 201)) * (250.4 - 150.5) + 150.5;
    return ((aqi - 301) / (500 - 301)) * (500.4 - 250.5) + 250.5;
  };

  // Use API stats PM2.5 if available, otherwise convert from AQI
  const pastPm25Avg = locationStats
    ? (locationStats.avg_pm25 * exposureMultiplier).toFixed(1)
    : aqiToPm25(pastAvg).toFixed(1);
  // console.log("Length data ",locationStats);
  const futurePm25Avg = aqiToPm25(futureAvg).toFixed(1);
  const cigPast = locationStats ? (pastPm25Avg * (locationStats.length == 0 ? 1 : locationStats.length) / 22).toFixed(1) : '0.0';
  // Use selected statsPeriod when estimating cigarette-equivalent exposure for the future window
  const cigFuture = locationStats ? (Number(futurePm25Avg) * (Number(statsPeriod) || 7) / 22).toFixed(1) : '0.0';

  const maxAqi = Math.max(...analyticsData.map((d) => d.aqi * exposureMultiplier), 10);

  const radiusOptions = [20, 50, 70, 100, 120, 150, 200];

  // Helper: format a Date as dd-mm-yyyy
  const formatDate = (d) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}`;
  };

  // Return a display range for the past `period` days ending today
  const getDateRangeForecast = (period) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() +1);
    end.setDate(start.getDate() + (Number(period) - 1));
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  };
 const getDateRangePast = (period) => {
    const end = new Date();
    const start = new Date();
    end.setDate(end.getDate() - 1);
    start.setDate(end.getDate() - (Number(period) - 1));
    return `${formatDate(start)} - ${formatDate(end)}`;
  };
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Popup chú thích thống kê (global) */}
      <Modal
        visible={showStatsInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatsInfo(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={() => setShowStatsInfo(false)}>
          <View style={{
            margin: 32,
            marginTop: 120,
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 20,
            elevation: 6,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#2563eb', marginBottom: 8 }}>Chú thích thống kê</Text>
            <Text style={{ marginBottom: 8, color: '#334155' }}>• <Text style={{ fontWeight: 'bold' }}>AQI</Text> (Air Quality Index): Chỉ số chất lượng không khí, càng cao càng ô nhiễm.</Text>
            <Text style={{ marginBottom: 8, color: '#334155' }}>• <Text style={{ fontWeight: 'bold' }}>PM2.5</Text>: Bụi mịn đường kính &lt; 2.5μm, nguy hiểm cho sức khỏe.</Text>
            <Text style={{ marginBottom: 8, color: '#334155' }}>• <Text style={{ fontWeight: 'bold' }}>Quy đổi điếu thuốc</Text>: 22μg/m³ PM2.5/ngày ≈ hút 1 điếu thuốc lá.</Text>
            <Text style={{ color: '#64748b', fontSize: 13 }}>Các chỉ số được tính dựa trên lộ trình và dữ liệu thực tế của bạn.</Text>
            <Pressable
              style={{ marginTop: 18, alignSelf: 'flex-end', backgroundColor: '#2563eb', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 18 }}
              onPress={() => setShowStatsInfo(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Đóng</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Phơi nhiễm cá nhân</Text>
          <Text style={styles.headerSubtitle}>Phân tích chất lượng không khí theo ngày</Text>
        </View>
           <Pressable onPress={() => setShowStatsInfo(true)} style={{ marginRight: 8, alignSelf: 'flex-start' }}>
             <Ionicons name="information-circle-outline" size={25} color="#2563eb" />
          </Pressable>
        {/* Compact Exposure Mode Dropdown */}
        {/* <View>
          <TouchableOpacity
            style={styles.exposureModeDropdown}
            onPress={() => setShowExposureMenu(!showExposureMenu)}
            activeOpacity={0.7}
          >
            <Feather 
              name={exposureMode === 'outdoor' ? 'sun' : exposureMode === 'indoor' ? 'home' : 'wind'} 
              size={14} 
              color="#1d4ed8" 
            />
            <Text style={styles.exposureModeDropdownText}>
              {exposureMode === 'outdoor' ? 'Ngoài trời' : 
               exposureMode === 'indoor' ? 'Trong nhà' : 
               'Có máy lọc'}
            </Text>
            <Feather 
              name={showExposureMenu ? 'chevron-up' : 'chevron-down'} 
              size={14} 
              color="#64748b" 
            />
          </TouchableOpacity>
          
          {showExposureMenu && (
            <View style={styles.exposureModeMenu}>
              <TouchableOpacity
                style={[styles.exposureModeMenuItem, exposureMode === 'outdoor' && styles.exposureModeMenuItemActive]}
                onPress={() => {
                  setExposureMode('outdoor');
                  setShowExposureMenu(false);
                }}
                activeOpacity={0.7}
              >
                <Feather name="sun" size={14} color={exposureMode === 'outdoor' ? '#1d4ed8' : '#64748b'} />
                <Text style={[styles.exposureModeMenuText, exposureMode === 'outdoor' && styles.exposureModeMenuTextActive]}>
                  Ngoài trời
                </Text>
                <Text style={styles.exposureModeMenuMultiplier}>1.0x</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.exposureModeMenuItem, exposureMode === 'indoor' && styles.exposureModeMenuItemActive]}
                onPress={() => {
                  setExposureMode('indoor');
                  setShowExposureMenu(false);
                }}
                activeOpacity={0.7}
              >
                <Feather name="home" size={14} color={exposureMode === 'indoor' ? '#1d4ed8' : '#64748b'} />
                <Text style={[styles.exposureModeMenuText, exposureMode === 'indoor' && styles.exposureModeMenuTextActive]}>
                  Trong nhà
                </Text>
                <Text style={styles.exposureModeMenuMultiplier}>0.5x</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.exposureModeMenuItem, exposureMode === 'indoor_purifier' && styles.exposureModeMenuItemActive]}
                onPress={() => {
                  setExposureMode('indoor_purifier');
                  setShowExposureMenu(false);
                }}
                activeOpacity={0.7}
              >
                <Feather name="wind" size={14} color={exposureMode === 'indoor_purifier' ? '#1d4ed8' : '#64748b'} />
                <Text style={[styles.exposureModeMenuText, exposureMode === 'indoor_purifier' && styles.exposureModeMenuTextActive]}>
                  Có máy lọc
                </Text>
                <Text style={styles.exposureModeMenuMultiplier}>0.1x</Text>
              </TouchableOpacity>
            </View>
          )}
        </View> */}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
          activeOpacity={0.7}
        >
          <Feather 
            name="bar-chart-2" 
            size={16} 
            color={activeTab === 'overview' ? '#1d4ed8' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Tổng quan
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.7}
        >
          <Feather 
            name="clock" 
            size={16} 
            color={activeTab === 'history' ? '#1d4ed8' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Lịch sử
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'escape' && styles.tabActive]}
          onPress={() => setActiveTab('escape')}
          activeOpacity={0.7}
        >
          <Feather 
            name="map" 
            size={16} 
            color={activeTab === 'escape' ? '#1d4ed8' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'escape' && styles.tabTextActive]}>
            Trốn bụi
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content: Tổng quan */}
      {activeTab === 'overview' && (
        <>
          {/* Mini bar chart dạng thẻ */}
          <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartHeaderLeft}>
            <View style={styles.chartAccent} />
            <Text style={styles.chartTitle}>Diễn biến theo ngày</Text>
          </View>
          <TouchableOpacity onPress={refreshChart} style={{ padding: 6, alignSelf: 'center' }} activeOpacity={0.7}>
            <Feather name="refresh-cw" size={18} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Chart container with Y-axis */}
        <View style={styles.chartContainer}>
          {/* Y-axis labels */}
          <View style={styles.yAxisContainer}>
            <Text style={styles.yAxisLabel}>300</Text>
            <Text style={styles.yAxisLabel}>250</Text>
            <Text style={styles.yAxisLabel}>200</Text>
            <Text style={styles.yAxisLabel}>150</Text>
            <Text style={styles.yAxisLabel}>100</Text>
            <Text style={styles.yAxisLabel}>50</Text>
            <Text style={styles.yAxisLabel}>0</Text>
          </View>

          {/* Bars container */}
          <View style={styles.barsContainer}>
            {/* Grid lines */}
            <View style={styles.gridLinesContainer}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={styles.gridLine} />
              ))}
            </View>

            <View style={styles.barRow}>
              {analyticsData.map((item, idx) => {
                if(!item) return null;
                const adjustedAqi = item.aqi * exposureMultiplier;
                const heightRatio = Math.min(adjustedAqi, 300) / 300; // Max AQI 300
                const barHeight = 120 * heightRatio + 5;
                const isSelected = idx === selectedIdx;
                const isToday = item.type === 'present';
                // Hiển thị label mỗi 3 ngày (index 0, 3, 6, 9, 12) hoặc ngày hôm nay
                const shouldShowLabel = idx % 3 === 0 || isToday;
                const dateLabel = isToday ? '' : item.date;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.barWrapper}
                    onPress={() => {
                      setSelectedIdx(idx);
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: getAQIColor(adjustedAqi),
                          opacity: isSelected ? 1 : 0.75,
                          transform: [{ scale: isSelected ? 1.15 : 1 }],
                          borderWidth: isToday ? 2 : 0,
                          borderColor: isToday ? '#2563eb' : 'transparent',
                          shadowColor: isToday ? '#2563eb' : isSelected ? getAQIColor(adjustedAqi) : 'transparent',
                          shadowOpacity: isToday ? 0.4 : isSelected ? 0.3 : 0,
                          shadowRadius: isToday ? 6 : 4,
                          shadowOffset: { width: 0, height: isToday ? 3 : 2 },
                          elevation: isToday ? 4 : isSelected ? 3 : 0,
                        },
                      ]}
                    />
                    {shouldShowLabel && (
                      <View style={styles.barLabelContainer}>
                        {isToday ? (
                          <Text style={styles.barLabelTodayTag}>Hôm nay</Text>
                        ) : (
                          <Text style={styles.barLabel}>{dateLabel}</Text>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Dynamic info box */}
        <View style={styles.selectedInfoCard}>
          <View style={{ flex: 1 }}>
            <View style={styles.selectedTagRow}>
              <View style={styles.selectedTag}>
                <Text style={styles.selectedTagText}>
                  {selectedData.type === 'past'
                    ? '📊 Lịch sử'
                    : selectedData.type === 'present'
                    ? '📍 Hôm nay'
                    : '🔮 Dự báo'}
                </Text>
              </View>
              <Text style={styles.selectedDate}>{selectedData.date}</Text>
            </View>
            {selectedData.type !== 'past' && (
            <Text style={styles.selectedLocation}>{selectedData.location}</Text>
            )}
            {!!selectedData.note && (
              <Text style={styles.selectedNote}>💡 {selectedData.note}</Text>
            )}

            {/* Top location chỉ cho ngày đang chọn nếu là quá khứ */}
            {selectedData.type === 'past' && topLocationsByDay && Object.keys(topLocationsByDay).length > 0 && (
              (() => {
                // selectedData.date dạng 'dd-mm' hoặc 'dd/mm', dateKey dạng 'yyyy-mm-dd'
                // Tìm dateKey có ngày và tháng trùng selectedData.date
                const [selDay, selMonth] = selectedData.date.split(/[-\/]/);
                const dateKey = Object.keys(topLocationsByDay).find(key => {
                  const [year, month, day] = key.split('-');
                  return day === selDay && month === selMonth;
                });
                const locs = dateKey ? topLocationsByDay[dateKey] : [];
                if (!dateKey || locs.length === 0) return null;
                return (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ fontWeight: 'bold', color: '#2563eb', marginBottom: 2 }}>
                      Top địa điểm trong ngày:
                    </Text>
                    {locs.slice(0, 2).map((loc, idx) => (
                      <Text key={loc.location} style={{ color: '#334155', fontSize: 13, marginLeft: 8 }}>
                        {idx + 1}. {loc.location} <Text style={{ color: '#64748b' }}> - {loc.count} lần</Text>
                      </Text>
                    ))}
                  </View>
                );
              })()
            )}
            {/* Details button to open History tab for the selected past day */}
            {(selectedData.type === 'past' || selectedData.type === 'present') && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  // Find dateKey like chart onPress logic
                  let dateKey = null;
                  if (topLocationsByDay && Object.keys(topLocationsByDay).length > 0 && selectedData.date) {
                    const [selDay, selMonth] = selectedData.date.split(/[-\/]/);
                    dateKey = Object.keys(topLocationsByDay).find(key => {
                      const [year, month, day] = key.split('-');
                      return day === selDay && month === selMonth;
                    });
                  }
                  setActiveTab('history');
                  if (dateKey) {
                    setDateFilter(dateKey);
                  } else {
                    setDateFilter('all');
                  }
                }}
                style={{
                  marginTop: 10,
                  backgroundColor: '#eef2ff',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignSelf: 'flex-start',
                }}
              >
                <Text style={{ color: '#2563eb', fontWeight: '700' }}>Xem chi tiết</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.selectedAqiBox}>
            {selectedData.type === 'past' && topLocationsByDay && Object.keys(topLocationsByDay).length > 0 ? (() => {
              // selectedData.date dạng 'dd-mm' hoặc 'dd/mm', dateKey dạng 'yyyy-mm-dd'
              const [selDay, selMonth] = selectedData.date.split(/[-\/]/);
              const dateKey = Object.keys(topLocationsByDay).find(key => {
                const [year, month, day] = key.split('-');
                return day === selDay && month === selMonth;

              });
              const locs = dateKey ? topLocationsByDay[dateKey] : [];
              const topLoc = locs && locs.length > 0 ? locs[0] : null;
              if (!topLoc) return (
                <>
                  <Text style={styles.selectedAqiValue}>--</Text>
                  <Text style={styles.selectedAqiLabel}>AQI TB</Text>
                </>
              );
              const avgAqi = Math.round((topLoc.avgAqi || 0) * exposureMultiplier);
              return (
                <>
                  <Text style={[styles.selectedAqiValue, { color: getAQIColor(avgAqi) }]}>{avgAqi}</Text>
                  <Text style={styles.selectedAqiLabel}>AQI TB</Text>
                </>
              );
            })() : (
              <>
                <Text
                  style={[
                    styles.selectedAqiValue,
                    { color: getAQIColor(selectedData.aqi * exposureMultiplier) },
                  ]}
                >
                  {Math.round(selectedData.aqi * exposureMultiplier)}
                </Text>
                <Text style={styles.selectedAqiLabel}>AQI VN dự báo</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Thống kê mức độ phơi nhiễm */}
      <View style={styles.exposureWrapper}>
        {/* Popup chú thích thống kê moved to global render */}
        <View style={styles.exposureHeader}>
       
          <View style={styles.exposureIconBox}>
            <Text style={styles.exposureIcon}>🫁</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.exposureTitle}>Thống kê mức độ phơi nhiễm</Text>
            <Text style={styles.exposureSubtitle}>
              Dựa trên lộ trình thường ngày của bạn
            </Text>
          </View>
          <View>
            <TouchableOpacity
              style={styles.statsPeriodDropdown}
              onPress={() => setShowStatsPeriodMenu(!showStatsPeriodMenu)}
              activeOpacity={0.7}
            >
              <Text style={styles.statsPeriodDropdownText}>
                {statsPeriod === 3 ? '3 ngày' :statsPeriod === 5 ? '5 ngày' : '7 ngày'}
              </Text>
              <Feather 
                name={showStatsPeriodMenu ? 'chevron-up' : 'chevron-down'} 
                size={14} 
                color="#64748b" 
              />
            </TouchableOpacity>
            {showStatsPeriodMenu && (
              <View style={styles.statsPeriodMenu}>
              
                <TouchableOpacity
                  style={[styles.statsPeriodMenuItem, statsPeriod === 3 && styles.statsPeriodMenuItemActive]}
                  onPress={() => {
                    setStatsPeriod(3);
                    setShowStatsPeriodMenu(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.statsPeriodMenuText, statsPeriod === 3 && styles.statsPeriodMenuTextActive]}>
                    3 ngày
                  </Text>
                </TouchableOpacity>
                  <TouchableOpacity
                  style={[styles.statsPeriodMenuItem, statsPeriod === 1 && styles.statsPeriodMenuItemActive]}
                  onPress={() => {
                    setStatsPeriod(5);
                    setShowStatsPeriodMenu(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.statsPeriodMenuText, statsPeriod === 5 && styles.statsPeriodMenuTextActive]}>
                    5 ngày
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statsPeriodMenuItem, statsPeriod === 7 && styles.statsPeriodMenuItemActive]}
                  onPress={() => {
                    setStatsPeriod(7);
                    setShowStatsPeriodMenu(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.statsPeriodMenuText, statsPeriod === 7 && styles.statsPeriodMenuTextActive]}>
                    7 ngày
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Loading chỉ cho phần thống kê */}
        {loading ? (
          <View style={styles.loadingTabContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingTabText}>Đang tải dữ liệu phơi nhiễm...</Text>
          </View>
        ) : (
          <View style={styles.exposureSection}>
            {/* Past card */}
            <View style={styles.exposureCardPast}>
              <Text style={styles.exposureTag}>
                {statsPeriod === 5 ? '5 NGÀY QUA' : statsPeriod === 3 ? '3 NGÀY QUA' : '7 NGÀY QUA'}
              </Text>
               <Text style={styles.exposureDays}>
                {getDateRangePast(statsPeriod)}
              </Text>
              <Text style={styles.exposureAqi}>{pastAvg}</Text>
              <Text style={styles.exposureAqiLabel}>AQI VN Trung bình</Text>
              {/* Min/Max AQI */}
              {locationStats && locationStats.min_aqi !== null && locationStats.max_aqi !== null && (
                <View style={styles.minMaxContainer}>
                  <View style={styles.minMaxItem}>
                    <Text style={styles.minMaxLabel}>Min</Text>
                    <Text style={styles.minMaxValue}>{Math.round(locationStats.min_aqi * exposureMultiplier)}</Text>
                  </View>
                  <Text style={styles.minMaxSeparator}>•</Text>
                  <View style={styles.minMaxItem}>
                    <Text style={styles.minMaxLabel}>Max</Text>
                    <Text style={styles.minMaxValue}>{Math.round(locationStats.max_aqi * exposureMultiplier)}</Text>
                  </View>
                </View>
              )}
              <View style={styles.exposureDivider} />
              <Text style={styles.exposurePm25Unit}> PM2.5 trung bình</Text>
              <Text style={styles.exposurePm25}>
                {pastPm25Avg}
                <Text style={styles.exposurePm25Unit}> µg/m³</Text>
              </Text>
              <Text style={styles.exposureText}>Tổng phơi nhiễm tuần trước</Text>
              <Text style={styles.exposureCig}>
                ≈ hút <Text style={styles.exposureCigValue}>{cigPast}</Text> điếu thuốc
              </Text>
            </View>

            {/* Future card */}
            <View style={styles.exposureCardFuture}>
              <Text style={[styles.exposureTag, { color: '#2563eb' }]}>{statsPeriod === 1 ? 'HÔM NAY' : statsPeriod === 3 ? '3 NGÀY TỚI' : '7 NGÀY TỚI'}</Text>
               <Text style={styles.exposureDays}>
                {getDateRangeForecast(statsPeriod)}
              </Text>
              <Text style={[styles.exposureAqi, { color: '#2563eb' }]}>{futureAvg}</Text>
              <Text style={styles.exposureAqiLabel}>AQI VN trung bình</Text>
              {/* Min/Max AQI tuần tới */}
              {futureMinAqi !== null && futureMaxAqi !== null && (
                <View style={styles.minMaxContainer}>
                  <View style={styles.minMaxItem}>
                    <Text style={styles.minMaxLabel}>Min</Text>
                    <Text style={styles.minMaxValue}>{Math.round(futureMinAqi * exposureMultiplier)}</Text>
                  </View>
                  <Text style={styles.minMaxSeparator}>•</Text>
                  <View style={styles.minMaxItem}>
                    <Text style={styles.minMaxLabel}>Max</Text>
                    <Text style={styles.minMaxValue}>{Math.round(futureMaxAqi * exposureMultiplier)}</Text>
                  </View>
                </View>
              )}
              <View style={styles.exposureDividerFuture} />
              <Text style={styles.exposurePm25Unit}> PM2.5 trung bình</Text>
              <Text style={[styles.exposurePm25, { color: '#2563eb' }]}>
                {futurePm25Avg}
                <Text style={styles.exposurePm25Unit}> µg/m³</Text>
              </Text>
              <Text style={styles.exposureText}>Tổng phơi nhiễm tuần tới</Text>
              <Text style={styles.exposureCig}>
                ≈ hút <Text style={styles.exposureCigValue}>{cigFuture}</Text> điếu thuốc
              </Text>
              {/* <View
                style={[
                  styles.diffBadge,
                  diff < 0 ? styles.diffBadgeGood : styles.diffBadgeBad,
                ]}
              >
                <Text
                  style={[
                    styles.diffBadgeText,
                    diff < 0 ? styles.diffBadgeTextGood : styles.diffBadgeTextBad,
                  ]}
                >
                  {diff < 0 ? `Giảm ${Math.abs(diff)} đơn vị` : `Tăng ${diff} đơn vị`}
                </Text>
              </View> */}
            </View>
          </View>
        )}
      </View>
  
      {/* Chú thích dưới thống kê phơi nhiễm */}
      <View style={styles.exposureNoteCard}>
        <View style={styles.exposureNoteIconBox}>
          <Text style={styles.exposureNoteIcon}>💡</Text>
        </View>
        <View style={styles.exposureNoteTextBox}>
          <Text style={styles.exposureNoteTitle}>Dự báo thông minh</Text>
          <Text style={styles.exposureNoteText}>
            Các địa điểm được dự báo dựa trên lộ trình thường ngày của bạn trong 7 ngày qua. Hệ
            thống phân tích các vị trí bạn thường lui tới để đưa ra dự báo AQI chính xác hơn.
          </Text>
        </View>
      </View>
      {/* End of overview tab fragment */}
      </>
      )}
      {/* Tab Content: Trốn bụi */}
      {activeTab === 'escape' && (
        <>
          {loadingDestinations ? (
            <View style={styles.loadingTabContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingTabText}>Đang tải địa điểm...</Text>
            </View>
          ) : (
            <View style={styles.escapeContainer}>
              {/* Trốn bụi cuối tuần */}
              <View style={styles.weekendSection}>
        {/* Header + nút chọn bán kính */}
        <View style={styles.weekendHeaderRow}>
          <View style={styles.weekendHeaderText}>
            <Text style={styles.weekendTitle}>Trốn bụi 🚆</Text>
            {/* <Text style={styles.weekendSubtitle}>Dựa trên dự báo {escapeForecastDays === 1 ? '24h' : `${escapeForecastDays} ngày`} tới</Text> */}
          </View>
          <View style={styles.weekendRadiusContainer}>
            <TouchableOpacity
              style={styles.weekendRadiusButton}
              onPress={() => setShowRadiusMenu((v) => !v)}
              activeOpacity={0.8}
            >
              <Feather name="navigation-2" size={12} color="#1d4ed8" />
              <Text style={styles.weekendRadiusButtonText}>{selectedRadius}km</Text>
              <Feather
                name={showRadiusMenu ? 'chevron-up' : 'chevron-down'}
                size={12}
                color="#6b7280"
              />
            </TouchableOpacity>
            {showRadiusMenu && (
              <View style={styles.weekendRadiusMenu}>
                {radiusOptions.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.weekendRadiusMenuItem,
                      selectedRadius === r && styles.weekendRadiusMenuItemActive,
                    ]}
                    onPress={() => {
                      setSelectedRadius(r);
                      setShowRadiusMenu(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.weekendRadiusMenuText,
                        selectedRadius === r && styles.weekendRadiusMenuTextActive,
                      ]}
                    >
                      {r} km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={{ width: 8 , height: 8 }}></View>
            {/* Forecast days selector (1..7) */}
            <TouchableOpacity
              style={[styles.weekendRadiusButton, { marginLeft: 8 }]}
              onPress={() => setShowEscapeDaysMenu((v) => !v)}
              activeOpacity={0.8}
            >
              <Feather name="clock" size={12} color="#1d4ed8" />
              <Text style={styles.weekendRadiusButtonText}>{ `${escapeForecastDays} ngày`}</Text>
              <Feather
                name={showEscapeDaysMenu ? 'chevron-up' : 'chevron-down'}
                size={12}
                color="#6b7280"
              />
            </TouchableOpacity>
            {showEscapeDaysMenu && (
              <View style={[styles.weekendRadiusMenu, { right: 0, left: undefined, marginLeft: 0, marginTop: 8 }]}> 
                {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.weekendRadiusMenuItem, escapeForecastDays === d && styles.weekendRadiusMenuItemActive]}
                    onPress={() => {
                      setEscapeForecastDays(d);
                      setShowEscapeDaysMenu(false);
                      setDestinationsLoaded(false); // force reload with new window
                    }}
                  >
                    <Text style={[styles.weekendRadiusMenuText, escapeForecastDays === d && styles.weekendRadiusMenuTextActive]}>
                      { `${d} ngày`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Thẻ vị trí hiện tại */}
        {userLocation ? (
        <View style={styles.weekendLocationCard}>
          <View>
            <Text style={styles.weekendLocationLabel}>Vị trí hiện tại</Text>
            <Text style={styles.weekendLocationName}>{userLocation.name || userLocation.address}</Text>
          </View>
          <View style={styles.weekendLocationAqiBox}>
            <Text style={styles.weekendLocationAqiLabel}>AQI</Text>
            <Text style={[
              styles.weekendLocationAqiValue,
              { color: getAQIColor(userLocation.aqi || 0) }
            ]}>
               {userLocation.aqi || 0}
            </Text>
          </View>
        </View>
        ) : (
          <View style={styles.weekendLocationCard}>
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 16 }}>
              <Feather name="map-pin" size={32} color="#cbd5e1" />
              <Text style={{ fontSize: 14, color: '#64748b', marginTop: 8 }}>
                Chưa có vị trí
              </Text>
              <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>
                Nhấn nút GPS trên bản đồ để lưu vị trí của bạn
              </Text>
            </View>
          </View>
        )}
      

        <Text style={styles.weekendSectionHeading}>Gợi ý hàng đầu</Text>

        {loadingDestinations ? (
          <View style={styles.loadingDestinationsContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingDestinationsText}>Đang tải dữ liệu địa điểm...</Text>
          </View>
        ) : filteredDestinations.length === 0 ? (
          <View style={styles.emptyDestinationsContainer}>
            <Feather name="map" size={48} color="#cbd5e1" />
            <Text style={styles.emptyDestinationsText}>
              {!userLocation 
                ? 'Vui lòng lưu vị trí để xem gợi ý' 
                : escapeDestinations.length === 0
                ? 'Không thể tải dữ liệu địa điểm'
                : 'Không có địa điểm nào trong bán kính này'}
            </Text>
            {userLocation && escapeDestinations.length === 0 && (
              <Text style={styles.emptyDestinationsSubtext}>
                Vui lòng kiểm tra kết nối mạng và thử lại
              </Text>
            )}
          </View>
        ) : (
          userLocation && filteredDestinations.map((dest) => {
            const cleanRatio = (userLocation.aqi / dest.aqi).toFixed(1);
            const aqiChange = dest.currentAqi > 0 ? dest.aqi - dest.currentAqi : 0;
            const aqiChangePercent = dest.currentAqi > 0 
              ? Math.round((aqiChange / dest.currentAqi) * 100)
              : 0;
            
            return (
              <View key={dest.id} style={styles.weekendCardOuter}>
                <ImageBackground
                  source={{
                    uri: dest.img_url,
                  }}
                  style={styles.weekendCardImage}
                  imageStyle={styles.weekendCardImageStyle}
                >
                  <View style={styles.weekendCardOverlay} />
                  <View style={styles.weekendCardInner}>
                    <View style={styles.weekendCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.weekendCardTitle}>{dest.name}</Text>
                        <Text style={styles.weekendMetaText}>
                          {dest.distance} km • {dest.driveTime}
                        </Text>
                        {dest.currentAqi > 0 && aqiChange !== 0 && (
                          <View style={[
                            styles.forecastBadge,
                            aqiChange < 0 ? styles.forecastBadgeGood : styles.forecastBadgeBad
                          ]}>
                            <Text style={[
                              styles.forecastBadgeText,
                              aqiChange < 0 ? styles.forecastBadgeTextGood : styles.forecastBadgeTextBad
                            ]}>
                              {aqiChange < 0 ? '↓' : '↑'} {Math.abs(aqiChangePercent)}% sau {escapeForecastDays === 1 ? '24h' : `${escapeForecastDays} ngày`}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.weekendAqiBadge}>
                        <View style={[styles.weekendAqiBadge, { backgroundColor: getAQIColor(dest.aqi) }]}> 
                          <Text style={styles.weekendAqiLabel}>AQI {dest.aqi}</Text>
                          {/* <Text style={styles.weekendAqiValue}>{dest.aqi}</Text> */}
                        </View>
                      </View>
                    </View>

                    <View style={styles.weekendStatsRow}>
                      <View style={styles.weekendStatBox}>
                        <Text style={styles.weekendStatLabel}>
                          {cleanRatio > 1 ? 'Độ sạch' : 'Độ ô nhiễm'}
                        </Text>
                        <Text style={styles.weekendStatValue}>Gấp {cleanRatio > 1 ? cleanRatio : (1 / cleanRatio).toFixed(1)} lần</Text>
                      </View>
                      <View style={styles.weekendStatBox}>
                        <Text style={styles.weekendStatLabel}>Thời tiết</Text>
                        <Text style={styles.weekendStatValue}>{dest.temp_min}°C - {dest.temp_max}°C</Text>
                      </View>
                      <View style={styles.weekendStatBox}>
                        <Text style={styles.weekendStatLabel}>Lượng mưa</Text>
                        <Text style={styles.weekendStatValue}>{dest.precipitation} mm</Text>
                      </View>
                      
                    </View>

                    <Text style={styles.weekendRecommendation}>💡 {dest.recommendation}</Text>
                  </View>
                </ImageBackground>
              </View>
            );
          })
        )}
              </View>
            </View>
          )}
        </>
      )}

      {/* Tab Content: Lịch sử chi tiết */}
      {activeTab === 'history' && (
        <>
          {loading || !historyLoaded ? (
            <View style={styles.loadingTabContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingTabText}>Đang tải lịch sử vị trí...</Text>
            </View>
          ) : (
            <View style={styles.historyContainer}>
              <View style={styles.historyHeader}>
                  <View style={styles.historyHeaderIcon}>
                    <Feather name="map-pin" size={18} color="#1d4ed8" />
                  </View>
                  <View style={styles.historyHeaderText}>
                    <Text style={styles.historyTitle}>Lịch sử vị trí đã lưu</Text>
                    <Text style={styles.historySubtitle}>
                      {filteredHistoryData.length} vị trí
                      {dateFilter === 'today' && ' • Hôm nay'}
                      {dateFilter === 'last3days' && ' • 3 ngày qua'}
                      {dateFilter === 'last7days' && ' • 7 ngày qua'}
                      {dateFilter === 'all' && ` • Tất cả (${historyData.length} tổng)`}
                      {dateFilter && dateFilter.match(/^\d{4}-\d{2}-\d{2}$/) && (() => {
                        const [year, month, day] = dateFilter.split('-');
                        return ` • Ngày ${day}/${month}/${year}`;
                      })()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.reloadButton}
                    onPress={reloadHistory}
                    activeOpacity={0.7}
                  >
                    <Feather name="refresh-cw" size={18} color="#1d4ed8" />
                  </TouchableOpacity>
              </View>
              {/* Day-specific stats (when user tapped a past bar) */}
              {dayStats && (
                <View style={styles.dayStatsCard}>
                  

                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#64748b' }}>AQI VN Trung bình</Text>
                      <Text style={{ fontSize: 18, fontWeight: '700' }}>{dayStats.avg_aqi ?? '--'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#64748b' }}>PM2.5 Trung bình</Text>
                      <Text style={{ fontSize: 18, fontWeight: '700' }}>{dayStats.avg_pm25 != null ? `${Number(dayStats.avg_pm25).toFixed(1)} µg/m³` : '--'}</Text>
                    </View>
                    {/* <View style={{ flex: 1 }}>
                      <Text style={{ color: '#64748b' }}>Bản ghi</Text>
                      <Text style={{ fontSize: 18, fontWeight: '700' }}>{dayStats.total_records}</Text>
                    </View> */}
                  </View>

                  <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#64748b' }}>AQI VN Max</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600' }}>{dayStats.max_aqi ?? '--'}</Text>
                    </View>
                    {/* <View style={{ flex: 1 }}>
                      <Text style={{ color: '#64748b' }}>AQI Min</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600' }}>{dayStats.min_aqi ?? '--'}</Text>
                    </View> */}
                     <View style={{ flex: 1 }}>
                    <Text style={{ color: '#64748b' }}>PM2.5 Max</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600' }}>
                      {dayStats?.max_pm25 != null
                        ? `${Number(dayStats.max_pm25).toFixed(1)} µg/m³`
                        : '--'}
                    </Text>
                  </View>
                    {/* <View style={{ flex: 1 }}>
                      <Text style={{ color: '#64748b' }}>Số địa điểm</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600' }}>{dayStats.unique_locations ?? '--'}</Text>
                    </View> */}
                  </View>

                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  {/* <View style={{ flex: 1 }}>
                    <Text style={{ color: '#64748b' }}>PM2.5 Max</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600' }}>
                      {dayStats?.max_pm25 != null
                        ? Number(dayStats.max_pm25).toFixed(1)
                        : '--'}
                    </Text>
                  </View> */}
                  <View style={{ flex: 1 }}>
                      <Text style={{ color: '#64748b' }}>AQI VN Min</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600' }}>{dayStats.min_aqi ?? '--'}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#64748b' }}>PM2.5 Min</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600' }}>{dayStats?.min_pm25 != null
                        ? `${Number(dayStats.min_pm25).toFixed(1)} µg/m³`
                        : '--'}</Text>
                    </View>
                    {/* <View style={{ flex: 1 }} /> */}
                  </View>

                  {/* Most visited locations with counts */}
                  {dayStats.most_visited_location && Object.keys(dayStats.most_visited_location).length > 0 && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>Địa điểm thường đến</Text>
                      {Object.entries(dayStats.most_visited_location).map(([addr, count]) => (
                        <View
                          key={addr}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginVertical: 2,
                          }}
                        >
                          <Text
                            style={{ color: '#334155', fontSize: 13, flex: 1, marginRight: 8 }}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {addr}
                          </Text>
                          <Text style={{ color: '#64748b', fontSize: 13, flexShrink: 0, minWidth: 48, textAlign: 'right' }}>
                            {count} lần
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
  

          {/* Date Filter */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterButton, dateFilter === 'all' && styles.filterButtonActive]}
                onPress={() => setDateFilter('all')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterButtonText, dateFilter === 'all' && styles.filterButtonTextActive]}>
                  Tất cả
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.filterButton, dateFilter === 'today' && styles.filterButtonActive]}
                onPress={() => setDateFilter('today')}
                activeOpacity={0.7}
              >
                <Feather 
                  name="sun" 
                  size={14} 
                  color={dateFilter === 'today' ? '#1d4ed8' : '#64748b'} 
                />
                <Text style={[styles.filterButtonText, dateFilter === 'today' && styles.filterButtonTextActive]}>
                  Hôm nay
                </Text>
              </TouchableOpacity>
              
              {/* Specific date buttons for last 7 days */}
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (i + 1));
                const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const displayDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
                const isActive = dateFilter === dateKey;
                
                return (
                  <TouchableOpacity
                    key={dateKey}
                    style={[styles.filterButton, isActive && styles.filterButtonActive]}
                    onPress={() => setDateFilter(dateKey)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
                      {displayDate}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {filteredHistoryData.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Feather name="map" size={48} color="#cbd5e1" />
              <Text style={styles.emptyHistoryText}>
                {historyData.length === 0 ? 'Chưa có lịch sử vị trí' : 'Không có dữ liệu'}
              </Text>
              <Text style={styles.emptyHistorySubtext}>
                {historyData.length === 0 
                  ? 'Nhấn nút GPS trên bản đồ để lưu vị trí hiện tại'
                  : 'Thử chọn bộ lọc khác'}
              </Text>
            </View>
          ) : (
            filteredHistoryData.map((item, index) => {
              // Timestamp from server: "2025-12-07T13:08:25.378251+07:00" (new format with timezone)
              // or "2025-11-30T14:25:59.106000" (old format without timezone - UTC)
              const timestampStr = item.timestamp;
              let dateStr = '';
              let timeStr = '';
              
              if (timestampStr && timestampStr.includes('T')) {
                const [datePart, timePartFull] = timestampStr.split('T');
                const [year, month, day] = datePart.split('-');
                dateStr = `${day}/${month}/${year}`;
                
                // Check if timestamp has timezone info (+07:00 or -XX:XX)
                const hasTimezone = timePartFull.includes('+') || (timePartFull.match(/-/g) || []).length > 0;
                
                if (hasTimezone) {
                  // New format with timezone: "13:08:25.378251+07:00"
                  // Remove timezone: split by + or - (for negative timezones)
                  let timePart = timePartFull;
                  if (timePart.includes('+')) {
                    timePart = timePart.split('+')[0];
                  } else if (timePart.lastIndexOf('-') > 0) {
                    timePart = timePart.substring(0, timePart.lastIndexOf('-'));
                  }
                  
                  // Remove milliseconds if present
                  if (timePart.includes('.')) {
                    timePart = timePart.split('.')[0];
                  }
                  
                  const [hour, minute] = timePart.split(':');
                  timeStr = `${hour}:${minute}`;
                } else {
                  // Old format without timezone (UTC): "14:25:59.106000"
                  // Need to add 7 hours for Vietnam time
                  let timePart = timePartFull;
                  if (timePart.includes('.')) {
                    timePart = timePart.split('.')[0];
                  }
                  
                  const [hour, minute, second] = timePart.split(':');
                  const vnDate= new Date(`${datePart}T${timePart}Z`); // Parse as UTC
                  // const  = new Date(utcDate.getTime()); // Add 7 hours
                  // console.log('Original UTC Date:', vnDate.toISOString());
                  // vnDate.setHours(vnDate.getHours() + 7);
                  // console.log('Converted VN Date:', vnDate.toISOString());
                  const vnHour = vnDate.getHours().toString().padStart(2, '0');
                  const vnMinute = vnDate.getMinutes().toString().padStart(2, '0');
                  timeStr = `${vnHour}:${vnMinute}`;
                  // console.log('Converted VN Time:', timeStr);
                  // Update dateStr in case it changed after adding 7 hours
                  const vnDay = vnDate.getDate().toString().padStart(2, '0');
                  const vnMonth = (vnDate.getMonth() + 1).toString().padStart(2, '0');
                  const vnYear = vnDate.getFullYear();
                  dateStr = `${vnDay}/${vnMonth}/${vnYear}`;
                }
              } else {
                // Fallback to Date parsing
                const date = new Date(timestampStr);
                dateStr = date.toLocaleDateString('vi-VN');
                timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
              }
              
              return (
                <View key={`${item.timestamp}-${index}`} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <View style={[styles.historyCardAqiBadge, { backgroundColor: getAQIColor(item.aqi || 0) }]}>
                      <Text style={styles.historyCardAqiText}>{item.aqi || 0}</Text>
                    </View>
                    <View style={styles.historyCardHeaderText}>
                      <Text style={styles.historyCardDate}>{dateStr}</Text>
                      <Text style={styles.historyCardTime}>{timeStr}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.historyCardBody}>
                    <View style={styles.historyCardRow}>
                      <Feather name="map-pin" size={14} color="#64748b" />
                      <Text style={styles.historyCardLocation} numberOfLines={2}>
                        {item.address || 'Không có địa chỉ'}
                      </Text>
                    </View>
                    
                    {item.pm25 && (
                      <View style={styles.historyCardRow}>
                        <Feather name="wind" size={14} color="#64748b" />
                        <Text style={styles.historyCardMeta}>
                          PM2.5: {item.pm25.toFixed(1)} µg/m³
                        </Text>
                      </View>
                    )}
                    
                    {item.weather && (
                      <View style={styles.historyCardRow}>
                        <Feather name="cloud" size={14} color="#64748b" />
                        <Text style={styles.historyCardMeta}>
                          {item.weather.temp}°C • {item.weather.description}
                        </Text>
                      </View>
                    )}
                    
                    {/* {item.latitude && item.longitude && (
                      <View style={styles.historyCardRow}>
                        <Feather name="navigation" size={14} color="#64748b" />
                        <Text style={styles.historyCardMeta}>
                          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                        </Text>
                      </View>
                    )} */}
                  </View>
                </View>
              );
            })
          )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );

}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: '#eff6ff',
  },
  content: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  exposureModeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  exposureModeDropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  exposureModeMenu: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 160,
    zIndex: 1000,
  },
  exposureModeMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  exposureModeMenuItemActive: {
    backgroundColor: '#f0f9ff',
  },
  exposureModeMenuText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  exposureModeMenuTextActive: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  exposureModeMenuMultiplier: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#dbeafe',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#1d4ed8',
  },
  escapeContainer: {
    flex: 1,
  },
  historyContainer: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    gap: 12,
  },
  historyHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyHeaderText: {
    flex: 1,
  },
  dayStatsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reloadButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  historySubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#1d4ed8',
  },
  emptyHistory: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptyHistorySubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  historyCardAqiBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCardAqiText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  historyCardHeaderText: {
    flex: 1,
  },
  historyCardDate: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  historyCardTime: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  historyCardBody: {
    gap: 8,
  },
  historyCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyCardLocation: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    lineHeight: 18,
  },
  historyCardMeta: {
    fontSize: 13,
    color: '#64748b',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartAccent: {
    width: 4,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#6366f1',
    marginRight: 10,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  yAxisContainer: {
    width: 32,
    height: 145,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 6,
    paddingBottom: 30,
  },
  yAxisLabel: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '600',
  },
  barsContainer: {
    flex: 1,
    position: 'relative',
    paddingRight: 8, // Đảm bảo label ngày cuối không bị cắt
  },
  gridLinesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 145,
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  gridLine: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 145,
    paddingBottom: 30,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 11,
    borderRadius: 4,
    marginHorizontal: 1.5,
  },
  barLabelContainer: {
    position: 'absolute',
    bottom: -26,
    alignItems: 'center',
  },
  barLabel: {
    marginTop: 4,
    fontSize: 7,
    color: '#9ca3af',
    fontWeight: '700',
  },
  barLabelToday: {
    color: '#2563eb',
    fontWeight: '700',
  },
  barLabelTodayTag: {
    marginTop: 1,
    fontSize: 7,
    color: '#2563eb',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  selectedInfoCard: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  selectedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
  },
  selectedDate: {
    fontSize: 10,
    color: '#6b7280',
    marginLeft: 6,
  },
  selectedLocation: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
    marginTop: 2,
  },
  selectedNote: {
    marginTop: 4,
    fontSize: 10,
    color: '#1d4ed8',
  },
  selectedAqiBox: {
    marginLeft: 10,
    alignItems: 'flex-end',
  },
  selectedAqiValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  selectedAqiLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
  selectedFooterText: {
    marginTop: 4,
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  exposureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exposureCardPast: {
    flex: 1,
    marginRight: 6,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  exposureCardFuture: {
    flex: 1,
    marginLeft: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#93c5fd',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  exposureTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4b5563',
    marginBottom: 4,
  },
   exposureDays: {
    fontSize: 8,
    fontWeight: '700',
    color: '#8b8d90ff',
    marginBottom: 4,
  },
  exposureAqi: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
  },
  exposureAqiLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  minMaxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  minMaxItem: {
    alignItems: 'center',
  },
  minMaxLabel: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  minMaxValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginTop: 2,
  },
  minMaxSeparator: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 12,
  },
  exposureDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    marginVertical: 6,
  },
  exposureDividerFuture: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#bfdbfe',
    marginVertical: 6,
  },
  exposurePm25: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  exposurePm25Unit: {
    fontSize: 11,
    fontWeight: '400',
    color: '#6b7280',
    textAlign: 'center',
  },
  exposureText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  exposureCig: {
    marginTop: 4,
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  exposureCigValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#f22602ff',
  },
  exposureWrapper: {
    marginTop: 16,
    marginBottom: 8,
  },
  exposureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsPeriodDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
    minWidth: 80,
  },
  statsPeriodDropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  statsPeriodMenu: {
    position: 'absolute',
    top: 38,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    minWidth: 100,
    zIndex: 1000,
  },
  statsPeriodMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statsPeriodMenuItemActive: {
    backgroundColor: '#eff6ff',
  },
  statsPeriodMenuText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  statsPeriodMenuTextActive: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  exposureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  exposureIcon: {
    fontSize: 18,
  },
  exposureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  exposureSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  exposureFooterPill: {
    marginTop: 8,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#fee2e2',
  },
  exposureFooterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b91c1c',
  },
  diffBadge: {
    marginTop: 6,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  diffBadgeGood: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  diffBadgeBad: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#f97316',
  },
  diffBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  diffBadgeTextGood: {
    color: '#166534',
  },
  diffBadgeTextBad: {
    color: '#b91c1c',
  },
  exposureNoteCard: {
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 14,
    backgroundColor: '#fefce8',
    borderWidth: 1,
    borderColor: '#facc15',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  exposureNoteIconBox: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: '#fef9c3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  exposureNoteIcon: {
    fontSize: 14,
  },
  exposureNoteTextBox: {
    flex: 1,
  },
  exposureNoteTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854d0e',
    marginBottom: 2,
  },
  exposureNoteText: {
    fontSize: 11,
    color: '#92400e',
    lineHeight: 15,
  },
  weekendSection: {
    marginTop: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  weekendHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekendHeaderText: {
    flex: 1,
    marginRight: 8,
  },
  weekendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  weekendSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  weekendRadiusContainer: {
    position: 'relative',
    flexDirection: 'row',
  },
  weekendRadiusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  weekendRadiusButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
    marginHorizontal: 4,
  },
  weekendRadiusMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 6,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 4,
    minWidth: 90,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 20,
   
  },
  weekendRadiusMenuItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  weekendRadiusMenuItemActive: {
    backgroundColor: '#dbeafe',
  },
  weekendRadiusMenuText: {
    fontSize: 11,
    color: '#4b5563',
  },
  weekendRadiusMenuTextActive: {
    fontWeight: '700',
    color: '#1d4ed8',
  },
  weekendLocationCard: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekendLocationLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  weekendLocationName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 2,
  },
  weekendLocationAqiBox: {
    alignItems: 'flex-end',
  },
  weekendLocationAqiLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  weekendLocationAqiValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  weekendSectionHeading: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  weekendCardOuter: {
    marginTop: 10,
    borderRadius: 18,
    overflow: 'hidden',
  },
  weekendCardImage: {
    height: 130,
    width: '100%',
    justifyContent: 'flex-end',
  },
  weekendCardImageStyle: {
    borderRadius: 18,
  },
  weekendCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.35)',
  },
  weekendCardInner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  weekendCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  weekendCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  weekendMetaText: {
    fontSize: 11,
    color: '#e5e7eb',
    marginTop: 2,
  },
  weekendAqiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    // backgroundColor: 'rgba(190, 223, 195, 0.72)',
  },
  weekendAqiLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.72)',
    fontWeight: '600',
  },
  weekendAqiValue: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.72)',
  },
  weekendStatsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  weekendStatBox: {
    flex: 1,
    marginRight: 4,
    backgroundColor: 'rgba(126, 139, 170, 0.72)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  weekendStatLabel: {
    fontSize: 10,
    color: '#e5e7eb',
  },
  weekendStatValue: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.72)',
  },
  weekendRecommendation: {
    marginTop: 6,
    fontSize: 11,
    color: '#e5e7eb',
  },
  forecastBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  forecastBadgeGood: {
    backgroundColor: 'rgba(187, 247, 208, 0.9)',
  },
  forecastBadgeBad: {
    backgroundColor: 'rgba(254, 226, 226, 0.9)',
  },
  forecastBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  forecastBadgeTextGood: {
    color: '#14532d',
  },
  forecastBadgeTextBad: {
    color: '#7f1d1d',
  },
  loadingDestinationsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loadingDestinationsText: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyDestinationsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyDestinationsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyDestinationsSubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
});

