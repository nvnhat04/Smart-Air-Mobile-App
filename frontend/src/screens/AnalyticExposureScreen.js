import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocationTracking } from '../hooks/useLocationTracking';
import api from '../services/api';
import {
  getAQIColor,
  getExposureMultiplier,
  processLocationHistory as processHistory
} from '../utils';

const generateAnalyticsData = () => {
  const locations = [
    'Phường Yên Thường, Quận Gia Lâm',
    'Xã Xuân Quan, Huyện Văn Giang',
    'Phường Nhân Chính, Quận Thanh Xuân',
    'Phường Suối Hoa, TP. Bắc Ninh',
    'Phường Quang Trung, Quận Hà Đông',
    'Phường Tân Dân, TP. Việt Trì',
    'Phường Sao Đỏ, TP. Chí Linh',
    'Phường Dịch Vọng, Quận Cầu Giấy',
  ];

  const today = new Date();
  const analyticsData = [];

  for (let i = -7; i < 0; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = `${String(date.getDate()).padStart(2, '0')}-${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}`;
    const aqi = 30 + Math.floor(Math.random() * 90);
    const locationIdx = Math.abs(i + 7) % locations.length;

    analyticsData.push({
      key: i.toString(),
      date: dateStr,
      aqi,
      location: locations[locationIdx],
      type: 'past',
    });
  }

  const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(
    today.getMonth() + 1,
  ).padStart(2, '0')}`;
  analyticsData.push({
    key: '0',
    date: todayStr,
    aqi: 141,
    location: 'Phường Dịch Vọng, Quận Cầu Giấy',
    type: 'present',
  });

  for (let i = 1; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = `${String(date.getDate()).padStart(2, '0')}-${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}`;

    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - (8 - i));
    const pastDateStr = `${String(pastDate.getDate()).padStart(2, '0')}/${String(
      pastDate.getMonth() + 1,
    ).padStart(2, '0')}`;

    const aqi = 85 + Math.floor(Math.random() * 50);
    const locationIdx = (i - 1) % locations.length;
    const locationName = locations[locationIdx].split(',')[1]?.trim() || locations[locationIdx];

    analyticsData.push({
      key: `+${i}`,
      date: dateStr,
      aqi,
      location: `Dự báo: ${locationName}`,
      type: 'future',
      note: `Bạn đã đến đây ngày ${pastDateStr}`,
    });
  }

  return analyticsData;
};

export default function AnalyticExposureScreen() {
  const { getLocationHistory } = useLocationTracking(true);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(7);
  const [selectedRadius, setSelectedRadius] = useState(100);
  const [showRadiusMenu, setShowRadiusMenu] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'history', 'escape'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'last3days', 'last7days'
  const [exposureMode, setExposureMode] = useState('outdoor'); // 'outdoor', 'indoor', 'indoor_purifier'
  const [showExposureMenu, setShowExposureMenu] = useState(false);
  const [userLocation, setUserLocation] = useState(null); // Vị trí thực của user từ GPS/history
  const [locationStats, setLocationStats] = useState(null); // Stats from API
  const [escapeDestinations, setEscapeDestinations] = useState([]); // Destinations with real AQI
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [destinationsLoaded, setDestinationsLoaded] = useState(false); // Track if already loaded
  
  // Load location history khi component mount (7 ngày)
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const history = await getLocationHistory(7); // Chỉ lấy 7 ngày
        setHistoryData(history);
        console.log('[AnalyticExposureScreen] Loaded 7-day history:', history.length, 'records');
        
        // Call API to get location stats
        try {
          const stats = await api.getLocationStats(7);
          setLocationStats(stats);
          console.log('[AnalyticExposureScreen] Location stats:', stats);
        } catch (statsError) {
          console.warn('[AnalyticExposureScreen] Failed to load stats:', statsError.message);
        }
        
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
          console.log('[AnalyticExposureScreen] User location set from history:', latestLocation.address);
        }
        
        // Process history với API PM2.5 forecast
        const processed = await processHistory(history);
        setAnalyticsData(processed);
      } catch (error) {
        console.error('[AnalyticExposureScreen] Failed to load history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadHistory();
  }, [getLocationHistory]);

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
        name: 'Ecopark, Hưng Yên', 
        recommendation: 'Công viên sinh thái, hồ nước rộng, đạp xe dạo chơi',
        lat: 20.9578,
        lon: 105.9369,
      },
      { 
        id: 2, 
        name: 'Công viên Yên Sở', 
        recommendation: 'Hồ rộng, chạy bộ, picnic gia đình, không gian xanh',
        lat: 20.9995,
        lon: 105.8673,
      },
      { 
        id: 3, 
        name: 'Làng cổ Đường Lâm', 
        recommendation: 'Làng cổ 1200 năm, nhà sàn truyền thống, ẩm thực đặc sản',
        lat: 21.1594,
        lon: 105.4600,
      },
      { 
        id: 4, 
        name: 'Khu du lịch Sơn Tây', 
        recommendation: 'Thành cổ Sơn Tây, núi non hùng vĩ, không khí trong lành',
        lat: 21.1498,
        lon: 105.5192,
      },
      { 
        id: 5, 
        name: 'Vườn Vua Resort', 
        recommendation: 'Resort sinh thái, vườn cây ăn trái, trải nghiệm làm vườn',
        lat: 21.1300,
        lon: 105.3300,
      },
      { 
        id: 6, 
        name: 'Ba Vì, Hà Nội', 
        recommendation: 'Vườn quốc gia, suối nước nóng, cắm trại rừng thông',
        lat: 21.1400,
        lon: 105.2900,
      },
      { 
        id: 7, 
        name: 'Chùa Hương, Mỹ Đức', 
        recommendation: 'Di tích lịch sử, chèo thuyền suối Yến, núi non hữu tình',
        lat: 20.6400,
        lon: 105.5700,
      },
      { 
        id: 8, 
        name: 'Đại Lải, Vĩnh Phúc', 
        recommendation: 'Hồ Đại Lải xanh mát, resort nghỉ dưỡng, thể thao nước',
        lat: 21.3500,
        lon: 105.5860,
      },
      { 
        id: 9, 
        name: 'Tam Đảo, Vĩnh Phúc', 
        recommendation: 'Săn mây, check-in Thác Bạc, khí hậu mát mẻ quanh năm',
        lat: 21.3000,
        lon: 105.5500,
      },
      { 
        id: 10, 
        name: 'Thung Nham, Ninh Bình', 
        recommendation: 'Hang động, vườn chim, kayaking, cảnh quan tuyệt đẹp',
        lat: 20.2215,
        lon: 105.8600,
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
        // Limit concurrent requests to 3 at a time to avoid overwhelming the server
        const batchSize = 3;
        const results = [];
        
        for (let i = 0; i < baseDestinations.length; i += batchSize) {
          const batch = baseDestinations.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (dest) => {
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
                const forecastData = await api.getPM25Forecast(dest.lat, dest.lon, 3);
                
                // Get forecast for 48 hours from now
                const now = new Date();
                const target48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
                const targetDateStr = target48h.toISOString().split('T')[0];
                
                // Get current data (first item in forecast)
                const currentForecast = forecastData?.forecast?.[0];
                const currentAqi = currentForecast?.aqi || 0;
                
                // Find the forecast for 48h
                const forecastFor48h = forecastData?.forecast?.find(f => f.date === targetDateStr);
                
                let aqi48h = currentAqi;
                let pm25_48h = currentForecast?.pm25 || 0;
                let hasForecast = false;
                
                if (forecastFor48h && forecastFor48h.aqi > 0) {
                  aqi48h = forecastFor48h.aqi;
                  pm25_48h = forecastFor48h.pm25;
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
                  temp: currentForecast?.weather?.temp || 20,
                  weatherType: currentForecast?.weather?.main === 'Clear' ? 'sun' : 'cloud',
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
          results.push(...batchResults);
        }

        console.log('[AnalyticExposureScreen] Loaded destinations:', results.length, 'total');
        console.log('[AnalyticExposureScreen] With forecast:', results.filter(d => d.hasForecast).length);
        setEscapeDestinations(results);
        setDestinationsLoaded(true); // Mark as loaded to avoid reloading
      } catch (error) {
        console.error('[AnalyticExposureScreen] Failed to load destinations:', error);
      } finally {
        setLoadingDestinations(false);
      }
    };

    loadDestinationsAQI();
  }, [activeTab, userLocation, baseDestinations, destinationsLoaded]);


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
        default:
          return true;
      }
    });
  }, [historyData, dateFilter]);

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Đang tải dữ liệu phơi nhiễm...</Text>
      </View>
    );
  }

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

  // Phân chia dựa trên type (past/present/future) thay vì index cố định
  const pastSlice = analyticsData.filter(d => d.type === 'past');
  const presentSlice = analyticsData.filter(d => d.type === 'present');
  const futureSlice = analyticsData.filter(d => d.type === 'future');
  
  // Tính trung bình chỉ cho các ngày có data và áp dụng hệ số phơi nhiễm
  const futureAvg = futureSlice.length > 0
    ? Math.round(futureSlice.reduce((sum, d) => sum + d.aqi, 0) / futureSlice.length * exposureMultiplier)
    : 0;
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
  
  const futurePm25Avg = aqiToPm25(futureAvg).toFixed(1);
  const cigPast = (pastPm25Avg / 22).toFixed(1);
  const cigFuture = (futurePm25Avg / 22).toFixed(1);

  const maxAqi = Math.max(...analyticsData.map((d) => d.aqi * exposureMultiplier), 10);

  const radiusOptions = [50, 100, 150, 200];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Lịch sử &amp; dự báo</Text>
          <Text style={styles.headerSubtitle}>Phân tích chất lượng không khí 13 ngày</Text>
        </View>
        
        {/* Compact Exposure Mode Dropdown */}
        <View>
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
        </View>
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
          <View style={styles.chartAccent} />
          <Text style={styles.chartTitle}>Diễn biến 13 ngày</Text>
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
                const adjustedAqi = item.aqi * exposureMultiplier;
                const heightRatio = Math.min(adjustedAqi, 300) / 300; // Max AQI 300
                const barHeight = 120 * heightRatio + 5;
                const isSelected = idx === selectedIdx;
                const isToday = item.type === 'present';
                
                // Hiển thị label mỗi 3 ngày (index 0, 3, 6, 9, 12) hoặc ngày hôm nay
                const shouldShowLabel = idx % 3 === 0 || isToday;
                const dateLabel = isToday ? '' : item.date; // Hôm nay không hiển thị ngày
                
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.barWrapper}
                    onPress={() => setSelectedIdx(idx)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: getAQIColor(adjustedAqi),
                          opacity: isSelected ? 1 : 0.7,
                          borderWidth: isToday ? 2 : (isSelected ? 1.5 : 0),
                          borderColor: isToday ? '#2563eb' : '#0f172a',
                          shadowColor: isToday ? '#2563eb' : 'transparent',
                          shadowOpacity: isToday ? 0.3 : 0,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: isToday ? 3 : 0,
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
            <Text style={styles.selectedLocation}>{selectedData.location}</Text>
            {!!selectedData.note && (
              <Text style={styles.selectedNote}>💡 {selectedData.note}</Text>
            )}
          </View>
          <View style={styles.selectedAqiBox}>
            <Text
              style={[
                styles.selectedAqiValue,
                { color: getAQIColor(selectedData.aqi * exposureMultiplier) },
              ]}
            >
              {Math.round(selectedData.aqi * exposureMultiplier)}
            </Text>
            <Text style={styles.selectedAqiLabel}>AQI</Text>
          </View>
        </View>
        <Text style={styles.selectedFooterText}>
          Địa điểm phơi nhiễm nhiều nhất trong ngày.
        </Text>
      </View>

      {/* Thống kê mức độ phơi nhiễm */}
      <View style={styles.exposureWrapper}>
        <View style={styles.exposureHeader}>
          <View style={styles.exposureIconBox}>
            <Text style={styles.exposureIcon}>🫁</Text>
          </View>
          <View>
            <Text style={styles.exposureTitle}>Thống kê mức độ phơi nhiễm</Text>
            <Text style={styles.exposureSubtitle}>
              Dựa trên lộ trình thường ngày của bạn
            </Text>
          </View>
        </View>

        <View style={styles.exposureSection}>
          {/* Past card */}
          <View style={styles.exposureCardPast}>
            <Text style={styles.exposureTag}>7 NGÀY QUA</Text>
            <Text style={styles.exposureAqi}>{pastAvg}</Text>
            <Text style={styles.exposureAqiLabel}>AQI Trung bình</Text>

            <View style={styles.exposureDivider} />

            <Text style={styles.exposurePm25}>
              {pastPm25Avg}
              <Text style={styles.exposurePm25Unit}> µg/m³</Text>
            </Text>
            <Text style={styles.exposureText}>Phơi nhiễm PM2.5</Text>
            <Text style={styles.exposureCig}>
              ≈ hút <Text style={styles.exposureCigValue}>{cigPast}</Text> điếu thuốc
            </Text>
          </View>

          {/* Future card */}
          <View style={styles.exposureCardFuture}>
            <Text style={[styles.exposureTag, { color: '#2563eb' }]}>7 NGÀY TỚI</Text>
            <Text style={[styles.exposureAqi, { color: '#2563eb' }]}>{futureAvg}</Text>
            <Text style={styles.exposureAqiLabel}>AQI Dự kiến</Text>

            <View style={styles.exposureDividerFuture} />

            <Text style={[styles.exposurePm25, { color: '#2563eb' }]}>
              {futurePm25Avg}
              <Text style={styles.exposurePm25Unit}> µg/m³</Text>
            </Text>
            <Text style={styles.exposureText}>Phơi nhiễm PM2.5</Text>
            <Text style={styles.exposureCig}>
              ≈ hút <Text style={styles.exposureCigValue}>{cigFuture}</Text> điếu thuốc
            </Text>

            <View
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
            </View>
          </View>
        </View>
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
      </>
      )}

      {/* Tab Content: Trốn bụi */}
      {activeTab === 'escape' && (
        <View style={styles.escapeContainer}>
      {/* Trốn bụi cuối tuần */}
      <View style={styles.weekendSection}>
        {/* Header + nút chọn bán kính */}
        <View style={styles.weekendHeaderRow}>
          <View style={styles.weekendHeaderText}>
            <Text style={styles.weekendTitle}>Trốn bụi cuối tuần 🚆</Text>
            <Text style={styles.weekendSubtitle}>Dựa trên dự báo 48h tới</Text>
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
                    uri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80',
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
                              {aqiChange < 0 ? '↓' : '↑'} {Math.abs(aqiChangePercent)}% sau 48h
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.weekendAqiBadge}>
                        <Text style={styles.weekendAqiLabel}>AQI</Text>
                        <Text style={styles.weekendAqiValue}>{dest.aqi}</Text>
                      </View>
                    </View>

                    <View style={styles.weekendStatsRow}>
                      <View style={styles.weekendStatBox}>
                        <Text style={styles.weekendStatLabel}>Độ sạch</Text>
                        <Text style={styles.weekendStatValue}>Gấp {cleanRatio} lần</Text>
                      </View>
                      <View style={styles.weekendStatBox}>
                        <Text style={styles.weekendStatLabel}>Thời tiết</Text>
                        <Text style={styles.weekendStatValue}>{dest.temp}°C</Text>
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

      {/* Tab Content: Lịch sử chi tiết */}
      {activeTab === 'history' && (
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
              </Text>
            </View>
          </View>

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
              
              <TouchableOpacity
                style={[styles.filterButton, dateFilter === 'last3days' && styles.filterButtonActive]}
                onPress={() => setDateFilter('last3days')}
                activeOpacity={0.7}
              >
                <Feather 
                  name="calendar" 
                  size={14} 
                  color={dateFilter === 'last3days' ? '#1d4ed8' : '#64748b'} 
                />
                <Text style={[styles.filterButtonText, dateFilter === 'last3days' && styles.filterButtonTextActive]}>
                  3 ngày qua
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.filterButton, dateFilter === 'last7days' && styles.filterButtonActive]}
                onPress={() => setDateFilter('last7days')}
                activeOpacity={0.7}
              >
                <Feather 
                  name="calendar" 
                  size={14} 
                  color={dateFilter === 'last7days' ? '#1d4ed8' : '#64748b'} 
                />
                <Text style={[styles.filterButtonText, dateFilter === 'last7days' && styles.filterButtonTextActive]}>
                  7 ngày qua
                </Text>
              </TouchableOpacity>
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
              const date = new Date(item.timestamp);
              const dateStr = date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });
              const timeStr = date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              });
              
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
                    
                    {item.latitude && item.longitude && (
                      <View style={styles.historyCardRow}>
                        <Feather name="navigation" size={14} color="#64748b" />
                        <Text style={styles.historyCardMeta}>
                          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
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
    padding: 14,
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartAccent: {
    width: 3,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#6366f1',
    marginRight: 8,
  },
  chartTitle: {
    fontSize: 14,
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
    width: 10,
    borderRadius: 999,
    marginHorizontal: 2,
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
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
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
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exposureCardFuture: {
    flex: 1,
    marginLeft: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  exposureTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4b5563',
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
    fontWeight: '700',
    color: '#b45309',
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
    top: 34,
    right: 0,
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
    backgroundColor: 'rgba(190, 223, 195, 0.72)',
  },
  weekendAqiLabel: {
    fontSize: 10,
    color: 'rgba(2, 100, 15, 0.72)',
    fontWeight: '600',
  },
  weekendAqiValue: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(2, 100, 15, 0.72)',
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
    color: 'rgba(157, 187, 231, 0.72)',
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

