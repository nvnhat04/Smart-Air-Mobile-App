import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocationTracking } from '../hooks/useLocationTracking';
import api from '../services/api';

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

  for (let i = 1; i <= 7; i++) {
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

const getAQIColor = (aqi) => {
  if (aqi <= 50) return '#22c55e';
  if (aqi <= 100) return '#eab308';
  if (aqi <= 150) return '#f97316';
  if (aqi <= 200) return '#ef4444';
  return '#7f1d1d';
};

// Hàm tạo dữ liệu từ lịch sử thực + dự báo từ API PM2.5
const processLocationHistory = async (historyData) => {
  const today = new Date();
  const analyticsData = [];
  
  // Group history by date
  const historyByDate = {};
  // Track location frequency and coordinates for forecast
  const locationFrequency = {};
  const locationCoords = {}; // Store lat/lon for each location
  

  historyData.forEach(record => {
    const recordDate = new Date(record.timestamp);
    const dateKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}-${String(recordDate.getDate()).padStart(2, '0')}`;
    
    if (!historyByDate[dateKey]) {
      historyByDate[dateKey] = [];
    }
    historyByDate[dateKey].push(record);
    
    // Count location frequency and store coordinates
    const address = record.address || 'Unknown';
    locationFrequency[address] = (locationFrequency[address] || 0) + 1;
    if (!locationCoords[address] && record.latitude && record.longitude) {
      locationCoords[address] = { lat: record.latitude, lon: record.longitude };
    }
  });
  
  // Find most visited locations
  const sortedLocations = Object.entries(locationFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([addr]) => addr);
  
  console.log('[processLocationHistory] Most visited locations:', sortedLocations);

  // Tạo data cho 6 ngày qua
  for (let i = -6; i < 0; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dateStr = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const dayRecords = historyByDate[dateKey] || [];
    let aqi, location, lat, lon;
    
    if (dayRecords.length > 0) {
      // Tính AQI trung bình trong ngày
      const totalAqi = dayRecords.reduce((sum, r) => sum + (r.aqi || 0), 0);
      aqi = Math.round(totalAqi / dayRecords.length);
      // Lấy địa điểm có AQI cao nhất
      const maxRecord = dayRecords.reduce((max, r) => (r.aqi || 0) > (max.aqi || 0) ? r : max, dayRecords[0]);
      location = maxRecord.address || 'Vị trí không xác định';
      lat = maxRecord.latitude;
      lon = maxRecord.longitude;
    } else {
      // Không có data thực, dùng mock
      aqi = 30 + Math.floor(Math.random() * 90);
      location = 'Chưa có dữ liệu';
      lat = null;
      lon = null;
    }

    analyticsData.push({
      key: i.toString(),
      date: dateStr,
      aqi,
      location,
      latitude: lat,
      longitude: lon,
      type: 'past',
    });
  }

  // Hôm nay
  const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayRecords = historyByDate[todayKey] || [];
  
  let todayAqi, todayLocation, todayLat, todayLon;
  if (todayRecords.length > 0) {
    const maxRecord = todayRecords.reduce((max, r) => (r.aqi || 0) > (max.aqi || 0) ? r : max, todayRecords[0]);
    todayAqi = maxRecord.aqi || 75;
    todayLocation = maxRecord.address || 'Vị trí hiện tại';
    todayLat = maxRecord.latitude;
    todayLon = maxRecord.longitude;
  } else {
    todayAqi = 75;
    todayLocation = 'Vị trí hiện tại';
    todayLat = null;
    todayLon = null;
  }

  analyticsData.push({
    key: '0',
    date: todayStr,
    aqi: todayAqi,
    location: todayLocation,
    latitude: todayLat,
    longitude: todayLon,
    type: 'present',
  });

  // Dự báo 6 ngày tới - Gọi API PM2.5 forecast cho các vị trí đã lưu
  // Ngày +1 dự báo tại vị trí của ngày -6, +2 tại -5, +3 tại -4, +4 tại -3, +5 tại -2, +6 tại -1
  const forecastPromises = [];
  const forecastLocationMap = {}; // Map ngày → vị trí
  
  for (let i = 1; i <= 6; i++) {
    // Lấy data từ ngày đối xứng trong quá khứ (ngày -(7-i))
    const mirrorDate = new Date(today);
    mirrorDate.setDate(today.getDate() - (7 - i));
    const mirrorDateKey = `${mirrorDate.getFullYear()}-${String(mirrorDate.getMonth() + 1).padStart(2, '0')}-${String(mirrorDate.getDate()).padStart(2, '0')}`;
    
    const mirrorDayRecords = historyByDate[mirrorDateKey] || [];
    
    if (mirrorDayRecords.length > 0) {
      // Lấy vị trí chính trong ngày đối xứng
      const primaryRecord = mirrorDayRecords.reduce((max, r) => (r.aqi || 0) > (max.aqi || 0) ? r : max, mirrorDayRecords[0]);
      const primaryLocation = primaryRecord.address;
      const coords = locationCoords[primaryLocation];
      
      if (coords) {
        forecastLocationMap[i] = { location: primaryLocation, coords };
        // Gọi API PM2.5 forecast
        forecastPromises.push(
          api.getPM25Forecast(coords.lat, coords.lon, 7)
            .then(data => ({ day: i, data, location: primaryLocation }))
            .catch(err => {
              console.error(`[Forecast Day +${i}] API error:`, err);
              return { day: i, data: null, location: primaryLocation };
            })
        );
      }
    }
  }
  
  // Đợi tất cả API calls
  const forecastResults = await Promise.all(forecastPromises);
  const forecastDataMap = {};
  forecastResults.forEach(result => {
    if (result.data && result.data.forecast) {
      forecastDataMap[result.day] = result.data;
    }
  });
  
  // Tạo dự báo 7 ngày với data từ API
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const mirrorDate = new Date(today);
    mirrorDate.setDate(today.getDate() - i);
    const mirrorDateKey = `${mirrorDate.getFullYear()}-${String(mirrorDate.getMonth() + 1).padStart(2, '0')}-${String(mirrorDate.getDate()).padStart(2, '0')}`;
    const mirrorDateStr = `${String(mirrorDate.getDate()).padStart(2, '0')}/${String(mirrorDate.getMonth() + 1).padStart(2, '0')}`;
    
    let aqi, location;
    const forecastData = forecastDataMap[i];
    const locationInfo = forecastLocationMap[i];
    
    if (forecastData && forecastData.forecast && forecastData.forecast.length > 0) {
      // Sử dụng data từ API PM2.5 forecast
      const dayForecast = forecastData.forecast[i - 1]; // Index 0 = ngày đầu tiên
      aqi = dayForecast?.aqi || 75;
      location = locationInfo?.location || 'Dự báo';
      
      const addressParts = location.split(',');
      const shortLocation = addressParts[addressParts.length - 2]?.trim() || addressParts[0] || 'Dự báo';
      
      console.log(`[Forecast Day +${i}] API PM2.5: ${dayForecast?.pm25}, AQI: ${aqi}, Location: ${shortLocation}`);
      
      const coords = locationInfo?.coords;
      analyticsData.push({
        key: `+${i}`,
        date: dateStr,
        aqi: Math.max(0, Math.min(500, aqi)),
        location: `Dự báo: ${shortLocation}`,
        latitude: coords?.lat || null,
        longitude: coords?.lon || null,
        type: 'future',
        note: `Dự báo PM2.5 tại ${shortLocation}`,
      });
    } else {
      // Fallback: tính toán local nếu API fail
      const mirrorDayRecords = historyByDate[mirrorDateKey] || [];
      
      if (mirrorDayRecords.length > 0) {
        const primaryRecord = mirrorDayRecords.reduce((max, r) => (r.aqi || 0) > (max.aqi || 0) ? r : max, mirrorDayRecords[0]);
        const primaryLocation = primaryRecord.address;
        const locationRecords = historyData.filter(r => r.address === primaryLocation);
        
        if (locationRecords.length > 0) {
          const avgPm25 = locationRecords.reduce((sum, r) => sum + (r.pm25 || 0), 0) / locationRecords.length;
          const forecastPm25 = avgPm25 + (Math.random() * 8 - 4);
          
          if (forecastPm25 <= 12) aqi = Math.round((forecastPm25 / 12) * 50);
          else if (forecastPm25 <= 35.4) aqi = Math.round(((forecastPm25 - 12) / (35.4 - 12)) * 50 + 50);
          else if (forecastPm25 <= 55.4) aqi = Math.round(((forecastPm25 - 35.4) / (55.4 - 35.4)) * 50 + 100);
          else if (forecastPm25 <= 150.4) aqi = Math.round(((forecastPm25 - 55.4) / (150.4 - 55.4)) * 50 + 150);
          else aqi = Math.round(((forecastPm25 - 150.4) / (250.4 - 150.4)) * 50 + 200);
        } else {
          aqi = Math.round(primaryRecord.aqi + (Math.random() * 15 - 7.5));
        }
        
        const addressParts = (primaryLocation || '').split(',');
        location = addressParts[addressParts.length - 2]?.trim() || addressParts[0] || 'Dự báo';
      } else {
        // No history data
        const fallbackLocation = sortedLocations[0];
        if (fallbackLocation) {
          const coords = locationCoords[fallbackLocation];
          if (coords) {
            aqi = 75 + Math.floor(Math.random() * 50);
          } else {
            aqi = 75 + Math.floor(Math.random() * 50);
          }
          const parts = fallbackLocation.split(',');
          location = parts[parts.length - 2]?.trim() || parts[0] || 'Dự báo';
        } else {
          aqi = 75 + Math.floor(Math.random() * 50);
          location = 'Dự báo';
        }
      }

      // Lấy coordinates từ primary record hoặc fallback location
      let fallbackLat = null, fallbackLon = null;
      if (mirrorDayRecords.length > 0) {
        const primaryRecord = mirrorDayRecords.reduce((max, r) => (r.aqi || 0) > (max.aqi || 0) ? r : max, mirrorDayRecords[0]);
        fallbackLat = primaryRecord.latitude;
        fallbackLon = primaryRecord.longitude;
      } else if (sortedLocations[0] && locationCoords[sortedLocations[0]]) {
        const coords = locationCoords[sortedLocations[0]];
        fallbackLat = coords.lat;
        fallbackLon = coords.lon;
      }

      analyticsData.push({
        key: `+${i}`,
        date: dateStr,
        aqi: Math.max(0, Math.min(500, aqi)),
        location: `Dự báo: ${location}`,
        latitude: fallbackLat,
        longitude: fallbackLon,
        type: 'future',
        note: mirrorDayRecords.length > 0 ? `Dựa trên dữ liệu ngày ${mirrorDateStr}` : `Dự báo cho ${location}`,
      });
    }
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
  
  // Load location history khi component mount (7 ngày)
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const history = await getLocationHistory(7); // Chỉ lấy 7 ngày
        setHistoryData(history);
        console.log('[AnalyticExposureScreen] Loaded 7-day history:', history.length, 'records');
        
        // Process history với API PM2.5 forecast
        const processed = await processLocationHistory(history);
        setAnalyticsData(processed);
      } catch (error) {
        console.error('[AnalyticExposureScreen] Failed to load history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadHistory();
  }, [getLocationHistory]);

  // Mock data "trốn bụi đi chơi"
  const allDestinations = useMemo(
    () => [
      { id: 1, name: 'Ecopark, Hưng Yên', aqi: 40, weatherType: 'sun', temp: 24, distance: 18, driveTime: '35 phút', recommendation: 'Công viên sinh thái, hồ nước rộng, đạp xe dạo chơi' },
      { id: 2, name: 'Công viên Yên Sở', aqi: 45, weatherType: 'sun', temp: 23, distance: 12, driveTime: '25 phút', recommendation: 'Hồ rộng, chạy bộ, picnic gia đình, không gian xanh' },
      { id: 3, name: 'Làng cổ Đường Lâm', aqi: 48, weatherType: 'cloud', temp: 22, distance: 45, driveTime: '1 giờ 10 phút', recommendation: 'Làng cổ 1200 năm, nhà sàn truyền thống, ẩm thực đặc sản' },
      { id: 4, name: 'Khu du lịch Sơn Tây', aqi: 44, weatherType: 'sun', temp: 21, distance: 42, driveTime: '1 giờ', recommendation: 'Thành cổ Sơn Tây, núi non hùng vĩ, không khí trong lành' },
      { id: 5, name: 'Vườn Vua Resort', aqi: 38, weatherType: 'sun', temp: 25, distance: 35, driveTime: '50 phút', recommendation: 'Resort sinh thái, vườn cây ăn trái, trải nghiệm làm vườn' },
      { id: 6, name: 'Ba Vì, Hà Nội', aqi: 42, weatherType: 'sun', temp: 21, distance: 65, driveTime: '1 giờ 45 phút', recommendation: 'Vườn quốc gia, suối nước nóng, cắm trại rừng thông' },
      { id: 7, name: 'Chùa Hương, Mỹ Đức', aqi: 48, weatherType: 'cloud', temp: 22, distance: 60, driveTime: '1 giờ 40 phút', recommendation: 'Di tích lịch sử, chèo thuyền suối Yến, núi non hữu tình' },
      { id: 8, name: 'Đại Lải, Vĩnh Phúc', aqi: 38, weatherType: 'sun', temp: 23, distance: 55, driveTime: '1 giờ 20 phút', recommendation: 'Hồ Đại Lải xanh mát, resort nghỉ dưỡng, thể thao nước' },
      { id: 9, name: 'Tam Đảo, Vĩnh Phúc', aqi: 35, weatherType: 'cloud', temp: 18, distance: 85, driveTime: '2 giờ 15 phút', recommendation: 'Săn mây, check-in Thác Bạc, khí hậu mát mẻ quanh năm' },
      { id: 10, name: 'Thung Nham, Ninh Bình', aqi: 36, weatherType: 'sun', temp: 24, distance: 95, driveTime: '2 giờ 30 phút', recommendation: 'Hang động, vườn chim, kayaking, cảnh quan tuyệt đẹp' },
    ],
    [],
  );

  const filteredDestinations = useMemo(
    () =>
      allDestinations
        .filter((d) => d.distance <= selectedRadius)
        .sort((a, b) => a.aqi - b.aqi),
    [allDestinations, selectedRadius],
  );

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Đang tải dữ liệu phơi nhiễm...</Text>
      </View>
    );
  }

  const selectedData = analyticsData[selectedIdx];

  const pastSlice = analyticsData.slice(0, 8);
  const futureSlice = analyticsData.slice(8);
  const pastAvg = Math.round(
    pastSlice.reduce((sum, d) => sum + d.aqi, 0) / Math.max(pastSlice.length, 1),
  );
  const futureAvg = Math.round(
    futureSlice.reduce((sum, d) => sum + d.aqi, 0) / Math.max(futureSlice.length, 1),
  );
  const diff = futureAvg - pastAvg;

  const pastPm25Avg = (pastAvg * 0.6).toFixed(1);
  const futurePm25Avg = (futureAvg * 0.6).toFixed(1);
  const cigPast = (pastPm25Avg / 22).toFixed(1);
  const cigFuture = (futurePm25Avg / 22).toFixed(1);

  const maxAqi = Math.max(...analyticsData.map((d) => d.aqi), 10);

  // Mock data "trốn bụi đi chơi" giống Analytics.jsx
  const userLocation = {
    name: 'Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội',
    aqi: 141,
  };
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
      </View>

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
                const heightRatio = Math.min(item.aqi, 300) / 300; // Max AQI 300
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
                          backgroundColor: getAQIColor(item.aqi),
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
                { color: getAQIColor(selectedData.aqi) },
              ]}
            >
              {selectedData.aqi}
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

            <View style={styles.exposureFooterPill}>
              <Text style={styles.exposureFooterPillText}>📍 7 địa điểm đã ghé</Text>
            </View>
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
        <View style={styles.weekendLocationCard}>
          <View>
            <Text style={styles.weekendLocationLabel}>Vị trí hiện tại</Text>
            <Text style={styles.weekendLocationName}>{userLocation.name}</Text>
          </View>
          <View style={styles.weekendLocationAqiBox}>
            <Text style={styles.weekendLocationAqiLabel}>AQI</Text>
            <Text style={styles.weekendLocationAqiValue}>{userLocation.aqi}</Text>
          </View>
        </View>

        <Text style={styles.weekendSectionHeading}>Gợi ý hàng đầu</Text>

        {filteredDestinations.map((dest) => {
          const cleanRatio = (userLocation.aqi / dest.aqi).toFixed(1);
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
                    <View>
                      <Text style={styles.weekendCardTitle}>{dest.name}</Text>
                      <Text style={styles.weekendMetaText}>
                        {dest.distance} km • {dest.driveTime}
                      </Text>
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
        })}
      </View>
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
    fontSize: 8,
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
    color: '#b91c1c',
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
});

