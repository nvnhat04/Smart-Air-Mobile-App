import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { UserGroupSelector } from '../components/ui';
import { BASE_URL } from '../services/api';
import { getHealthAdvice } from '../utils/mapUtils';

function generateWeeklyData(baseColor) {
  const daysShort = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const today = new Date();

  return Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() + idx);
    const dayOfWeek = d.getDay();
    const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1,
    ).padStart(2, '0')}`;

    const val = 20 + Math.floor(Math.random() * 130);

    return {
      label: daysShort[dayOfWeek],
      date: dateStr,
      temp: 27 + Math.floor(Math.random() * 6),
      aqi: val,
    };
  });
}

function getAQIBadgeColor(score) {
  if (score <= 50) return { bg: '#dcfce7', text: '#166534' };
  if (score <= 100) return { bg: '#fef9c3', text: '#854d0e' };
  if (score <= 150) return { bg: '#ffedd5', text: '#9a3412' };
  if (score <= 200) return { bg: '#fee2e2', text: '#b91c1c' };
  return { bg: '#ede9fe', text: '#5b21b6' };
}

function getAQIColor(score) {
  if (score <= 50) return '#22c55e'; // Xanh lá - Tốt
  if (score <= 100) return '#eab308'; // Vàng - Trung bình
  if (score <= 150) return '#f97316'; // Cam - Kém
  if (score <= 200) return '#ef4444'; // Đỏ - Xấu
  if (score <= 300) return '#a855f7'; // Tím - Rất xấu
  return '#7c2d12'; // Nâu đỏ - Nguy hại
}

export default function DetailStationScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const station = route.params?.station;

  const [realtimeData, setRealtimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [userGroup, setUserGroup] = useState('normal'); // 'normal' or 'sensitive'

  // Handle user group change with logging
  const handleUserGroupChange = (newGroup) => {
    console.log('🔄 User group changed:', userGroup, '->', newGroup);
    setUserGroup(newGroup);
  };

  // Fetch forecast data from server
  useEffect(() => {
    const fetchForecastData = async () => {
      // Fetch 6 ngày tiếp theo từ TiTiler (ngày 1-6)
      // Day[0] sẽ dùng dữ liệu thực từ CEM (station.aqi, station.pm25, etc.)
      if (!station?.lat || !station?.lon) {
        console.log('⚠️ No coordinates available for forecast');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const isRealStation = station?.id && station.id !== 'custom-point' && station.id !== 'user-gps-location';
        console.log(`🔄 Fetching 7-day forecast from TiTiler for ${isRealStation ? 'station' : 'custom point'}:`, station.name || 'Unknown');
        
        const url = `${BASE_URL}/pm25/forecast?lat=${station.lat}&lon=${station.lon}&days=7`;
        
        console.log('🔗 Forecast URL:', url);
        
        const response = await fetch(url, {
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Forecast data received:', data.forecast?.length || 0, 'days');
        console.log('📊 Days with data:', data.daysWithData, '/', data.totalDays);

        if (data.forecast && data.forecast.length > 0) {
          let weeklyData = data.forecast.map(item => ({
            date: item.date,
            label: item.dayOfWeek,
            aqi: item.aqi || null,
            pm25: item.pm25 || null,
            temp: item.temp || null,
            temp_max: item.temp_max || null,
            temp_min: item.temp_min || null,
            humidity: item.humidity || null,
            wind_speed: item.wind_speed || null,
            dateKey: item.dateKey,
            hasData: item.hasData,
          }));

          // Nếu là trạm thật (không phải custom point), override day[0] với dữ liệu CEM
          if (isRealStation && weeklyData.length > 0) {
            console.log('🔄 Replacing day[0] with real CEM station data');
            const temp = station.temp || weeklyData[0].temp;
            weeklyData[0] = {
              ...weeklyData[0], // Giữ date, label, dateKey
              aqi: station.aqi || station.baseAqi || weeklyData[0].aqi,
              pm25: station.pm25 || weeklyData[0].pm25,
              temp: temp ? Math.round(temp) : temp,
              humidity: station.humidity || weeklyData[0].humidity,
              wind_speed: station.windSpeed || weeklyData[0].wind_speed,
              hasData: true, // Station luôn có data
            };
            console.log('✅ Day[0] updated with CEM data:', {
              aqi: weeklyData[0].aqi,
              pm25: weeklyData[0].pm25,
              temp: weeklyData[0].temp
            });
          }

          setRealtimeData({
            weekly: weeklyData,
            latest: weeklyData[0].hasData ? {
              aqi: weeklyData[0].aqi,
              pm25: weeklyData[0].pm25,
              temp: weeklyData[0].temp,
              humidity: weeklyData[0].humidity,
              wind_speed: weeklyData[0].wind_speed,
            } : null,
          });
        } else {
          console.log('⚠️ No forecast data returned from server');
        }
      } catch (error) {
        console.error('❌ Error fetching forecast data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchForecastData();
  }, [station?.lat, station?.lon, station?.aqi, station?.pm25, station?.temp, station?.humidity]);

  const data = useMemo(() => {
    console.log('🔍 Recalculating data with userGroup:', userGroup);
    
    if (!station) {
      return {
        name: 'Trạm quan trắc',
        aqi: 100,
        status: 'Trung bình',
        temp: 28,
        humidity: 70,
        wind: '5.0',
        pm25: '60.0',
        color: '#4b5563',
        advice: getHealthAdvice(100, userGroup),
      };
    }
    
    // Nếu có realtime data, dùng data mới nhất
    const latestData = realtimeData?.latest;
    const currentAqi = latestData?.aqi || station.aqi || 80;
    const healthAdvice = getHealthAdvice(currentAqi, userGroup);
    
    // Calculate pm25 as number
    const pm25Value = latestData?.pm25 || station.pm25 || (currentAqi * 0.6);
    const tempValue = latestData?.temp || station.temp || 28;
    
    const result = {
      ...station, // Spread station FIRST
      wind: latestData?.wind_speed?.toFixed(1) || latestData?.windSpeed?.toFixed(1) || station.windSpeed?.toFixed(1) || station.wind || '5.0',
      pm25: pm25Value, // Keep as number for UI formatting
      humidity: latestData?.humidity || station.humidity || 70,
      temp: Math.round(tempValue),
      aqi: currentAqi,
      advice: healthAdvice, // Override advice LAST
    };
    
    console.log('📊 New advice:', healthAdvice?.text?.substring(0, 50) + '...');
    return result;
  }, [station, realtimeData, userGroup]);

  // Sử dụng realtime data nếu có, không thì fallback về mock data
  const weekly = useMemo(() => {
    if (realtimeData?.weekly && realtimeData.weekly.length > 0) {
      console.log('✅ Using realtime weekly data:', realtimeData.weekly.length, 'days');
      return realtimeData.weekly;
    }
    console.log('⚠️ Using mock weekly data');
    return generateWeeklyData(data.color || '#22c55e');
  }, [realtimeData, data.color]);

  const now = useMemo(() => {
    const d = new Date();
    const date = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const displayDate = `${date}/${month}/${year}`;
    return {
      displayDate,
      displayLabel: `Hôm nay, ${displayDate}`,
    };
  }, []);

  const aqiBadge = getAQIBadgeColor(data.aqi || 80);

  const weeklyDateRange = useMemo(() => {
    if (!weekly || weekly.length === 0) return '';
    return `${weekly[0].date} - ${weekly[weekly.length - 1].date}`;
  }, [weekly]);

  const chartData = useMemo(() => {
    if (!weekly || weekly.length === 0) return { path: '', points: [] };
    
    // Filter ra các ngày có data
    const validData = weekly.filter(w => w.aqi !== null && w.aqi !== undefined);
    
    if (validData.length === 0) return { path: '', points: [] };
    
    const values = validData.map((w) => w.aqi);
    const max = Math.max(...values, 10);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const w = 260;
    const h = 70;
    
    // Tính step dựa trên tổng số ngày (kể cả null)
    const step = weekly.length > 1 ? w / (weekly.length - 1) : w;

    // Build path và points array
    let pathSegments = [];
    let points = [];
    
    weekly.forEach((item, idx) => {
      if (item.aqi !== null && item.aqi !== undefined) {
        const x = idx * step;
        const norm = (item.aqi - min) / range;
        const y = h - norm * (h - 8) - 4;
        
        // Lưu thông tin điểm
        points.push({
          x,
          y,
          aqi: item.aqi,
          date: item.date,
          label: item.label,
          temp: item.temp,
          humidity: item.humidity,
          pm25: item.pm25,
          idx,
          color: getAQIColor(item.aqi), // Thêm màu cho điểm
        });
        
        // Check nếu là điểm đầu tiên hoặc điểm trước đó là null
        const isFirstInSegment = idx === 0 || 
          (idx > 0 && (weekly[idx - 1].aqi === null || weekly[idx - 1].aqi === undefined));
        
        const command = isFirstInSegment ? 'M' : 'L';
        pathSegments.push(`${command} ${x} ${y}`);
      }
    });
    
    // Tạo labels cho trục Y (làm tròn đến bội số 25 hoặc 50)
    const yMax = Math.ceil(max / 25) * 25;
    const yMin = Math.floor(min / 25) * 25;
    const yRange = yMax - yMin || 50;
    const yStep = yRange <= 100 ? 25 : 50;
    const yLabels = [];
    for (let val = yMin; val <= yMax; val += yStep) {
      yLabels.push(val);
    }
    
    return {
      path: pathSegments.join(' '),
      points,
      yAxisLabels: yLabels,
      yMin,
      yMax,
    };
  }, [weekly]);

  return (
    <View style={styles.root}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Đang tải dữ liệu realtime...</Text>
        </View>
      )}
      
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header gradient */}
        <View
          style={[
            styles.header,
            { backgroundColor: data.color || '#22c55e' },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backIcon}>{'‹'}</Text>
          </TouchableOpacity>

          <View style={styles.headerTopRight}>
            <View style={styles.dateChip}>
              <Text style={styles.dateChipValue}>{now.displayLabel}</Text>
            </View>
          </View>

          <View style={styles.headerCenter}>
            <View style={styles.locationChip}>
              <Text style={styles.locationText}>
                {data.name || 'Trạm quan trắc'}
              </Text>
            </View>

            <View style={styles.aqiCircleWrapper}>
              <View style={styles.aqiCircleGlow} />
              <Text style={styles.aqiNumber}>{data.aqi ?? 0}</Text>
            </View>

            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{data.status || 'Trung bình'}</Text>
            </View>

            <View style={styles.pm25Card}>
              <Text style={styles.pm25Label}>PM2.5</Text>
              <Text style={styles.pm25Value}>
                {typeof data.pm25 === 'number' ? data.pm25.toFixed(2) : data.pm25} µg/m³
              </Text>
            </View>

            <View style={styles.adviceBubble}>
              <Text style={styles.adviceText}>💡 {data.advice?.text}</Text>
            </View>
          </View>
        </View>

        {/* Main info */}
        <View style={styles.mainSection}>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={[styles.metricIconBox, { backgroundColor: '#ffedd5' }]}>
                <Text style={styles.metricIcon}>🌡️</Text>
              </View>
              <Text style={styles.metricValue}>{data.temp}°</Text>
              <Text style={styles.metricLabel}>Nhiệt độ</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconBox, { backgroundColor: '#dbeafe' }]}>
                <Text style={styles.metricIcon}>💧</Text>
              </View>
              <Text style={styles.metricValue}>{data.humidity}%</Text>
              <Text style={styles.metricLabel}>Độ ẩm</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconBox, { backgroundColor: '#e5e7eb' }]}>
                <Text style={styles.metricIcon}>💨</Text>
              </View>
              <Text style={styles.metricValue}>{data.wind} km/h</Text>
              <Text style={styles.metricLabel}>Gió</Text>
            </View>
          </View>

          {/* Health advice */}
          <View style={styles.healthCard}>
            <View style={styles.healthHeader}>
              <View style={styles.healthIconBox}>
                <Text style={styles.healthIcon}>🛡️</Text>
              </View>
              <Text style={styles.healthTitle}>Khuyến cáo sức khỏe</Text>
            </View>

            {/* User Group Selector */}
            <UserGroupSelector
              selectedGroup={userGroup}
              onGroupChange={handleUserGroupChange}
              style={{ marginVertical: 12 }}
            />

            <View style={styles.healthBody}>
              {/* Action pill */}
              {/* <View style={styles.healthActionRow}>
                <Text style={styles.healthActionLabel}>→</Text>
                <View style={styles.healthActionPillLarge}>
                  <Text style={styles.healthActionTextLarge}>
                    {data.advice?.action || 'Đeo khẩu trang'}
                  </Text>
                </View>
              </View> */}

              {/* Khuyến cáo chi tiết */}
              <View style={styles.healthAdviceBox}>
                <Text style={styles.healthAdviceText}>
                  {data.advice?.text}
                </Text>
              </View>

              {/* Nguồn: Bộ Y tế */}
              <Text style={styles.healthSource}>
                Nguồn: Công văn 12/MT-SKHC/2024 - Bộ Y tế
              </Text>
            </View>
          </View>

          {/* Diễn biến 7 ngày tiếp theo – card 1: chỉ biểu đồ */}
          <View style={styles.weeklyCard}>
            <View style={styles.weeklyHeader}>
              <View style={styles.weeklyTitleRow}>
                <View style={styles.weeklyAccentBar} />
                <View>
                  <Text style={styles.weeklyTitle}>Diễn biến 7 ngày tiếp theo</Text>
                  {!!weeklyDateRange && (
                    <Text style={styles.weeklySubTitle}>{weeklyDateRange}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Biểu đồ đường AQI */}
            <View style={styles.weeklyChartContainer}>
              {/* Trục Y - Labels AQI */}
              <View style={styles.yAxisLabels}>
                {chartData.yAxisLabels && chartData.yAxisLabels.slice().reverse().map((label, idx) => {
                  const totalLabels = chartData.yAxisLabels.length;
                  const spacing = 70 / (totalLabels - 1 || 1);
                  const topPos = idx * spacing;
                  
                  return (
                    <Text
                      key={label}
                      style={[
                        styles.yAxisLabel,
                        { top: topPos - 6 }
                      ]}
                    >
                      {label}
                    </Text>
                  );
                })}
              </View>
              
              {/* Chart area */}
              <View style={styles.weeklyChartWrapper}>
                <Svg width={260} height={70}>
                  <Defs>
                    {/* Gradient cho background AQI zones */}
                    <LinearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor="#7c2d12" stopOpacity="0.08" />
                      <Stop offset="16.67%" stopColor="#a855f7" stopOpacity="0.08" />
                      <Stop offset="33.33%" stopColor="#ef4444" stopOpacity="0.08" />
                      <Stop offset="50%" stopColor="#f97316" stopOpacity="0.08" />
                      <Stop offset="66.67%" stopColor="#eab308" stopOpacity="0.08" />
                      <Stop offset="100%" stopColor="#22c55e" stopOpacity="0.08" />
                    </LinearGradient>
                  </Defs>
                  
                  {/* Background gradient AQI zones */}
                  <Rect x="0" y="0" width="260" height="70" fill="url(#aqiGradient)" />
                  
                  {/* Gridlines ngang */}
                  {chartData.yAxisLabels && chartData.yAxisLabels.map((label, idx) => {
                    const totalLabels = chartData.yAxisLabels.length;
                    const spacing = 70 / (totalLabels - 1 || 1);
                    const y = 70 - (idx * spacing);
                    
                    return (
                      <Path
                        key={`grid-${label}`}
                        d={`M 0 ${y} L 260 ${y}`}
                        stroke="#e5e7eb"
                        strokeWidth={1}
                        strokeDasharray="4,4"
                        opacity={0.7}
                      />
                    );
                  })}
                  
                  {/* Đường line AQI - vẽ từng segment với màu riêng */}
                  {chartData.points.map((point, idx) => {
                    if (idx === 0) return null;
                    const prevPoint = chartData.points[idx - 1];
                    
                    // Kiểm tra nếu có gap (ngày không có data giữa 2 điểm)
                    if (point.idx - prevPoint.idx > 1) return null;
                    
                    // Dùng màu của điểm hiện tại
                    return (
                      <Path
                        key={`segment-${idx}`}
                        d={`M ${prevPoint.x} ${prevPoint.y} L ${point.x} ${point.y}`}
                        stroke={point.color}
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}
                  
                  {/* Vẽ các điểm có thể chạm */}
                  {chartData.points.map((point, idx) => (
                    <Circle
                      key={idx}
                      cx={point.x}
                      cy={point.y}
                      r={selectedPoint?.idx === point.idx ? 6 : 4}
                      fill={point.color}
                      stroke="#ffffff"
                      strokeWidth={2}
                      onPress={() => setSelectedPoint(point)}
                    />
                  ))}
                </Svg>
              
              {/* Các nút invisible để dễ chạm hơn */}
              {chartData.points.map((point, idx) => (
                <TouchableOpacity
                  key={`touch-${idx}`}
                  style={[
                    styles.chartPointTouch,
                    {
                      left: point.x - 15,
                      top: point.y - 15,
                    },
                  ]}
                  onPress={() => setSelectedPoint(point)}
                  activeOpacity={0.7}
                />
              ))}
              
              {/* Tooltip hiển thị thông tin điểm được chọn */}
              {selectedPoint && (
                <View
                  style={[
                    styles.chartTooltip,
                    {
                      left: Math.min(Math.max(selectedPoint.x - 60, 0), 140),
                      top: selectedPoint.y - 70,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.tooltipClose}
                    onPress={() => setSelectedPoint(null)}
                  >
                    <Text style={styles.tooltipCloseText}>×</Text>
                  </TouchableOpacity>
                  <Text style={styles.tooltipDate}>
                    {selectedPoint.label}, {selectedPoint.date}
                  </Text>
                  <View style={styles.tooltipAqiRow}>
                    <Text style={styles.tooltipAqiLabel}>AQI:</Text>
                    <Text style={styles.tooltipAqiValue}>{selectedPoint.aqi}</Text>
                  </View>
                  {selectedPoint.pm25 && (
                    <Text style={styles.tooltipDetail}>
                      PM2.5: {selectedPoint.pm25.toFixed(1)} µg/m³
                    </Text>
                  )}
                  {selectedPoint.temp && (
                    <Text style={styles.tooltipDetail}>
                      🌡️ {Math.round(selectedPoint.temp)}°C
                    </Text>
                  )}
                  {selectedPoint.humidity && (
                    <Text style={styles.tooltipDetail}>
                      💧 {selectedPoint.humidity}%
                    </Text>
                  )}
                </View>
              )}
            </View>
            </View>

            {/* Nhãn ngày trục dưới */}
            <View style={styles.weeklyDatesRow}>
              {weekly.map((item, idx) => {
                const step = weekly.length > 1 ? 260 / (weekly.length - 1) : 130;
                const leftPosition = idx * step;
                
                return (
                  <Text 
                    key={item.date} 
                    style={[
                      styles.weeklyDateLabel,
                      { 
                        position: 'absolute',
                        left: leftPosition,
                        transform: [{ translateX: -15 }] // Center text (approx half of text width)
                      }
                    ]}
                  >
                    {item.date}
                  </Text>
                );
              })}
            </View>
          </View>

          {/* Dự báo 7 ngày – card 2: thẻ dọc scroll ngang */}
          <View style={styles.forecastSection}>
            <View style={styles.forecastHeader}>
              <View style={styles.forecastHeaderLeft}>
                <View style={styles.forecastIconBox}>
                  <Text style={styles.forecastIcon}>📅</Text>
                </View>
                <View>
                  <Text style={styles.forecastTitle}>Dự báo 7 ngày</Text>
                  <Text style={styles.forecastSubtitle}>
                    Thời tiết &amp; chất lượng không khí
                  </Text>
                </View>
              </View>
              {!!weeklyDateRange && (
                <Text style={styles.forecastDateRange}>{weeklyDateRange}</Text>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.forecastScroll}
              contentContainerStyle={styles.forecastScrollContent}
            >
              {weekly.map((item) => {
                const hasData = item.aqi !== null && item.aqi !== undefined;
                const badge = hasData ? getAQIBadgeColor(item.aqi) : { bg: '#f3f4f6', text: '#9ca3af' };
                
                return (
                  <View key={item.date} style={[
                    styles.forecastCard,
                    !hasData && styles.forecastCardNoData
                  ]}>
                    <Text style={styles.forecastDay}>{item.label}</Text>
                    <Text style={styles.forecastDate}>{item.date}</Text>
                    <Text style={styles.forecastTemp}>
                      {hasData ? `${Math.round(item.temp)}°C` : 'N/A'}
                    </Text>
                    <View
                      style={[
                        styles.forecastAqiBadge,
                        { backgroundColor: badge.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.forecastAqiText,
                          { color: badge.text },
                        ]}
                      >
                        {hasData ? `${item.aqi} AQI` : 'Chưa có'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <Text style={styles.forecastHintText}>Kéo sang phải để xem thêm</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 32,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 14,
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#ffffff',
    fontSize: 40,
    marginTop: -4,
  },
  headerTopRight: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    right: 16,
  },
  dateChip: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateChipIcon: {
    fontSize: 12,
    color: '#ffffff',
    marginRight: 6,
  },
  dateChipValue: {
    fontSize: 11.5,
    color: '#ffffff',
    fontWeight: '700',
  },
  headerCenter: {
    marginTop: 40,
    alignItems: 'center',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  locationDot: {
    fontSize: 10,
    color: '#22c55e',
    marginRight: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#f9fafb',
    fontWeight: '600',
  },
  aqiCircleWrapper: {
    width: 140,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  aqiCircleGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
    opacity: 0.9,
  },
  aqiNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: '#ffffff',
  },
  statusPill: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  pm25Card: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  pm25Label: {
    fontSize: 11,
    color: '#ffffff',
    opacity: 0.9,
  },
  pm25Value: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  adviceBubble: {
    marginTop: 12,
    maxWidth: '90%',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  adviceText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '500',
  },
  mainSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricIcon: {
    fontSize: 18,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  healthCard: {
    borderRadius: 24,
    padding: 14,
    backgroundColor: '#ecfdf3',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 16,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  healthIconBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  healthIcon: {
    fontSize: 18,
    color: '#ffffff',
  },
  healthTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14532d',
  },
  healthBody: {
    gap: 10,
  },
  healthActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthActionLabel: {
    fontSize: 20,
    color: '#16a34a',
    fontWeight: '700',
  },
  healthActionPillLarge: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  healthActionTextLarge: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  healthAdviceBox: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dcfce7',
    padding: 12,
  },
  healthAdviceText: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 20,
  },
  healthSource: {
    fontSize: 10,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  weeklyCard: {
    borderRadius: 24,
    padding: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  weeklyHeader: {
    marginBottom: 8,
  },
  weeklyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyAccentBar: {
    width: 3,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#8b5cf6',
    marginRight: 8,
  },
  weeklyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  weeklySubTitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  weeklyChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 8,
  },
  yAxisLabels: {
    width: 35,
    height: 70,
    position: 'relative',
    justifyContent: 'space-between',
    marginRight: 8,
  },
  yAxisLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '600',
    right: 0,
  },
  weeklyChartWrapper: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  weeklyDatesRow: {
    position: 'relative',
    height: 20,
    width: 260,
    left: "10%",
    marginTop: 2,
  },
  weeklyDateLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },
  weeklyList: {
    marginTop: 4,
  },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  weeklyLeft: {
    flex: 1,
  },
  weeklyDay: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  weeklyDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  weeklyCenter: {
    width: 70,
    alignItems: 'center',
  },
  weeklyTemp: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  weeklyAqiBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  weeklyAqiText: {
    fontSize: 11,
    fontWeight: '700',
  },
  forecastSection: {
    marginTop: 12,
    borderRadius: 24,
    padding: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  forecastHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forecastIconBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  forecastIcon: {
    fontSize: 18,
    color: '#ffffff',
  },
  forecastTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  forecastSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  forecastDateRange: {
    fontSize: 11,
    color: '#9ca3af',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  forecastScroll: {
    marginTop: 4,
  },
  forecastScrollContent: {
    paddingVertical: 4,
  },
  forecastCard: {
    width: 96,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    alignItems: 'center',
  },
  forecastDay: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  forecastDate: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
  },
  forecastTemp: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  forecastAqiBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  forecastAqiText: {
    fontSize: 11,
    fontWeight: '700',
  },
  forecastHintText: {
    marginTop: 6,
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  forecastCardNoData: {
    opacity: 0.5,
    borderStyle: 'dashed',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  chartPointTouch: {
    position: 'absolute',
    width: 30,
    height: 30,
    zIndex: 10,
  },
  chartTooltip: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    zIndex: 20,
  },
  tooltipClose: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
  },
  tooltipCloseText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '700',
  },
  tooltipDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '600',
  },
  tooltipAqiRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  tooltipAqiLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginRight: 6,
  },
  tooltipAqiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  tooltipDetail: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
});

