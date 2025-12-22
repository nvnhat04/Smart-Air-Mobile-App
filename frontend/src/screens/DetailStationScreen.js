import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import GoodIcon from '../components/icon/good';
import MaroonIcon from '../components/icon/maroon';
import OrangeIcon from '../components/icon/orange';
import PurpleIcon from '../components/icon/purple';
import RedIcon from '../components/icon/red';
import YellowIcon from '../components/icon/yellow';
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

function getAQIIcon(score) {
  if (score <= 50) return <GoodIcon width={90} height={90} />; // Tốt - Mặt cười
  if (score <= 100) return <YellowIcon width={90} height={90} />; // Trung bình - Bình thường
  if (score <= 150) return <OrangeIcon width={90} height={90} />; // Kém - Đeo khẩu trang
  if (score <= 200) return <RedIcon width={90} height={90} />; // Xấu - Lo lắng
  if (score <= 300) return <PurpleIcon width={90} height={90} />; // Rất xấu - Kinh hãi
  return <MaroonIcon width={90} height={90} />; // Nguy hại - Nguy hiểm
}

export default function DetailStationScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const station = route.params?.station;
  const selectedDay = route.params?.selectedDay;
  
  console.log('🔍 DetailScreen received params:', {
    stationName: station?.name,
    temp: station?.temp,
    humidity: station?.humidity,
    aqi: station?.aqi,
    pm25: station?.pm25,
    selectedDay: selectedDay?.isoDate,
    timestamp:station?.timestamp
  });
  const [realtimeData, setRealtimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [userGroup, setUserGroup] = useState('normal'); // 'normal' or 'sensitive'
  const [chartWidth, setChartWidth] = useState(Dimensions.get('window').width - 100); // Chart width for responsive

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
            precipitation: item.rain_sum || 0,
            dateKey: item.dateKey,
            hasData: item.hasData,
          }));

          // Nếu là trạm thật (không phải custom point), override day[0] với dữ liệu CEM
          if (isRealStation && weeklyData.length > 0) {
            console.log('🔄 Replacing day[0] with real CEM station data');
            console.log('📊 Station data from params:', {
              temp: station.temp,
              humidity: station.humidity,
              aqi: station.aqi,
              pm25: station.pm25
            });
            console.log('📊 Forecast data (before merge):', {
              temp: weeklyData[0].temp,
              humidity: weeklyData[0].humidity,
              aqi: weeklyData[0].aqi,
              pm25: weeklyData[0].pm25
            });
            
            weeklyData[0] = {
              ...weeklyData[0], // Giữ date, label, dateKey
              // Ưu tiên AQI và PM2.5 từ CEM (real-time)
              aqi: station.aqi || station.baseAqi || weeklyData[0].aqi,
              pm25: station.pm25 || weeklyData[0].pm25,
              // Ưu tiên temp/humidity từ forecast (Open-Meteo reliable hơn)
              temp: weeklyData[0].temp || station.temp,
              humidity: weeklyData[0].humidity || station.humidity,
              wind_speed: weeklyData[0].wind_speed || station.windSpeed,
              precipitation: weeklyData[0].precipitation || station.precipitation || 0,
              hasData: true, // Station luôn có data
            };
            console.log('✅ Day[0] merged data:', {
              aqi: weeklyData[0].aqi,
              pm25: weeklyData[0].pm25,
              temp: weeklyData[0].temp,
              humidity: weeklyData[0].humidity,
              source: {
                aqi: station.aqi ? 'CEM' : 'Forecast',
                temp: weeklyData[0].temp ? 'Forecast' : 'Station'
              }
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
              precipitation: weeklyData[0].precipitation,
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
  }, [station?.lat, station?.lon]); // Chỉ fetch lại khi vị trí thay đổi

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
    let dayData = null;
    if (selectedDay && realtimeData?.weekly) {
      dayData = realtimeData.weekly.find(d => d.dateKey === selectedDay.isoDate);
    }
    console.log('🔍 selectedDay data found:', dayData);
    // console.log('🔍 realtimeData latest:', realtimeData?.weekly);
    // Nếu không có selectedDay hoặc không tìm thấy, dùng latestData như cũ
    const latestData = dayData || realtimeData?.latest;
    const currentAqi = latestData?.aqi || station.aqi || 80;
    const healthAdvice = getHealthAdvice(currentAqi, userGroup);
    // Nếu có realtime data, dùng data mới nhất
    // const latestData = realtimeData?.latest;
    // const currentAqi = latestData?.aqi || station.aqi || 80;
    // const healthAdvice = getHealthAdvice(currentAqi, userGroup);
    
    // Calculate pm25 as number
    const pm25Value = latestData?.pm25 || station.pm25 || (currentAqi * 0.6);
    const tempValue = latestData?.temp || station.temp || 28;
    
    console.log('📊 DetailScreen data merge:', {
      latestDataTemp: latestData?.temp,
      stationTemp: station.temp,
      finalTemp: tempValue,
      latestDataHumidity: latestData?.humidity,
      stationHumidity: station.humidity,
      finalHumidity: latestData?.humidity || station.humidity || 70
    });
    
    const result = {
      ...station, // Spread station FIRST
      wind: latestData?.wind_speed?.toFixed(1) || latestData?.windSpeed?.toFixed(1) || station.windSpeed?.toFixed(1) || station.wind || '5.0',
      pm25: pm25Value, // Keep as number for UI formatting
      humidity: latestData?.humidity || station.humidity || 70,
      temp: Math.round(tempValue),
      aqi: currentAqi,
      precipitation: latestData?.precipitation || station.precipitation || 0,
      advice: healthAdvice, // Override advice LAST
    };
    
    console.log('📊 DetailScreen final display data:', {
      temp: result.temp,
      humidity: result.humidity,
      aqi: result.aqi,
      pm25: result.pm25
    });
    
    return result;
  }, [station, realtimeData, userGroup, selectedDay]);

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
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const displayTime = `${hours}:${minutes}`;
    return {
      displayDate,
      displayTime,
      displayLabel: `Hôm nay, ${displayDate}`,
    };
  }, []);

  // Helper to format a timestamp (fallbacks to current time/date)
  const formatTimestamp = (ts) => {
    if (!ts) return { time: '', date: now.displayDate };
    try {
      const d = new Date(ts);
      const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      return { time, date };
    } catch (e) {
      return { time: now.displayTime, date: now.displayDate };
    }
  };

  const displayTs = formatTimestamp(station?.timestamp);

  const aqiBadge = getAQIBadgeColor(data.aqi || 80);

  const weeklyDateRange = useMemo(() => {
    if (!weekly || weekly.length === 0) return '';
    return `${weekly[0].date} - ${weekly[weekly.length - 1].date}`;
  }, [weekly]);

  const chartData = useMemo(() => {
    if (!weekly || weekly.length === 0) return { path: '', points: [], width: chartWidth };
    
    // Filter ra các ngày có data
    const validData = weekly.filter(w => w.aqi !== null && w.aqi !== undefined);
    
    if (validData.length === 0) return { path: '', points: [], width: chartWidth };
    
    const values = validData.map((w) => w.aqi);
    const dataMax = Math.max(...values);
    const dataMin = Math.min(...values);
    
    // Thêm padding 20% cho min/max để chart có không gian biến thiên rõ hơn
    const padding = (dataMax - dataMin) * 0.2 || 10;
    const max = dataMax + padding;
    const min = Math.max(0, dataMin - padding); // Không cho min < 0
    const range = max - min || 1;
    
    const w = chartWidth; // Sử dụng dynamic width
    const h = 120; // Tăng height lên để chart lớn hơn
    
    // Tính step dựa trên tổng số ngày (kể cả null)
    const step = weekly.length > 1 ? w / (weekly.length - 1) : w;

    // Build path và points array
    let pathSegments = [];
    let points = [];
    
    weekly.forEach((item, idx) => {
      if (item.aqi !== null && item.aqi !== undefined) {
        const x = idx * step;
        const norm = (item.aqi - min) / range;
        // Tăng margin top/bottom để có không gian rõ hơn
        const y = h - norm * (h - 24) - 12;
        
        // Lưu thông tin điểm
        points.push({
          x,
          y,
          aqi: item.aqi,
          date: item.date,
          label: item.label,
          temp: item.temp,
          humidity: item.humidity,
          precipitation: item.precipitation,
          pm25: item.pm25,
          idx,
          color: getAQIColor(item.aqi), // Thêm màu theo AQI
        });
        
        // Check nếu là điểm đầu tiên hoặc điểm trước đó là null
        const isFirstInSegment = idx === 0 || 
          (idx > 0 && (weekly[idx - 1].aqi === null || weekly[idx - 1].aqi === undefined));
        
        const command = isFirstInSegment ? 'M' : 'L';
        pathSegments.push(`${command} ${x} ${y}`);
      }
    });
    
    // Tạo labels cho trục Y
    // Sử dụng min/max đã có padding để labels phù hợp với vùng dữ liệu
    const yMax = Math.ceil(max / 10) * 10; // Làm tròn lên bội số 10
    const yMin = Math.floor(min / 10) * 10; // Làm tròn xuống bội số 10
    const yRange = yMax - yMin || 50;
    
    // Tính step cho labels - ít nhất 3 labels, nhiều nhất 5 labels
    let yStep;
    if (yRange <= 50) {
      yStep = 10;
    } else if (yRange <= 100) {
      yStep = 25;
    } else {
      yStep = 50;
    }
    
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
      width: w,
      height: h,
    };
  }, [weekly, chartWidth]);

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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backIcon}>{'‹'}</Text>
        </TouchableOpacity>

        {/* Location Chip - Riêng biệt phía trên */}
        <View style={styles.locationChipWrapper}>
          <View style={styles.locationChip}>
            <Text style={styles.locationText}>
              Hôm nay - {displayTs.date}
            </Text>
            {displayTs.time !== '' && (
             <Text style={styles.locationText}>
              {displayTs.time} 
            </Text>
            )}
            <Text style={styles.locationText}>
              {data.name || 'Trạm quan trắc'}
            </Text>
          </View>
        </View>

        {/* Header gradient */}
        <View
          style={[
            styles.header,
            { backgroundColor: data.color || '#22c55e' },
          ]}
        >
          {/* Header Center - AQI và Info */}
          <View style={styles.headerCenter}>
            {/* Cột trái: Số AQI */}
            <View style={styles.aqiColumn}>
              <Text style={styles.aqiLabelText}>AQI VN</Text>
              <View style={styles.aqiCircleWrapper}>
                <View style={styles.aqiCircleGlow} />
                <Text style={styles.aqiNumber}>{data.aqi ?? 0}</Text>
              </View>
              
              <Text style={styles.pm25Label}>PM2.5:</Text>
              <Text style={styles.pm25Value}>
                {typeof data.pm25 === 'number' ? data.pm25.toFixed(1) : data.pm25} µg/m³
              </Text>
              
            </View>

            {/* Cột phải: Thông tin chi tiết */}
            <View style={styles.infoColumn}>
            {/* <Text style={styles.statusIcon}>{getAQIIcon(data.aqi || 0)}</Text> */}
            <View style={styles.statusIcon}>
                {getAQIIcon(data.aqi || 0)}
            </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>{data.status || 'Trung bình'}</Text>
              </View>
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
              <View style={styles.metricInfoBox}>
                <Text style={styles.metricLabel}>Nhiệt độ</Text>
                <Text style={styles.metricValue}>{data.temp}°</Text>
              </View>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconBox, { backgroundColor: '#dbeafe' }]}>
                <Text style={styles.metricIcon}>💧</Text>
              </View>
              <View style={styles.metricInfoBox}>
                <Text style={styles.metricLabel}>Độ ẩm</Text>
                <Text style={styles.metricValue}>{data.humidity}%</Text>
              </View>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconBox, { backgroundColor: '#e5e7eb' }]}>
                <Text style={styles.metricIcon}>💨</Text>
              </View>
              <View style={styles.metricInfoBox}>
                <Text style={styles.metricLabel}>Gió</Text>
                <Text style={styles.metricValue}>{data.wind} km/h</Text>
              </View>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconBox, { backgroundColor: '#e5e7eb' }]}>
                <Text style={styles.metricIcon}>🌧️</Text>
              </View>              
              <View style={styles.metricInfoBox}>
              <Text style={styles.metricLabel}>Lượng mưa</Text>
            
              <Text style={styles.metricValue}>{data.precipitation} mm</Text>
              </View> 
              
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
              <View style={[styles.yAxisLabels, { height: chartData.height || 120 }]}>
                {chartData.yAxisLabels && chartData.yAxisLabels.slice().reverse().map((label, idx) => {
                  const totalLabels = chartData.yAxisLabels.length;
                  const chartHeight = chartData.height || 120;
                  const spacing = chartHeight / (totalLabels - 1 || 1);
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
              <View 
                style={styles.weeklyChartWrapper}
                onLayout={(event) => {
                  const { width } = event.nativeEvent.layout;
                  if (width > 0 && width !== chartWidth) {
                    setChartWidth(width);
                  }
                }}
              >
                <Svg width={chartData.width || chartWidth} height={chartData.height || 120}>
                  {/* Vẽ các zones màu AQI dựa trên trục Y */}
                  {(() => {
                    const h = chartData.height || 120;
                    const w = chartData.width || chartWidth;
                    const yMin = chartData.yMin || 0;
                    const yMax = chartData.yMax || 300;
                    const yRange = yMax - yMin || 1;
                    
                    // AQI zones theo chuẩn EPA
                    const aqiZones = [
                      { min: 0, max: 50, color: '#22c55e' },     // Xanh lá - Tốt
                      { min: 50, max: 100, color: '#eab308' },   // Vàng - Trung bình
                      { min: 100, max: 150, color: '#f97316' },  // Cam - Kém
                      { min: 150, max: 200, color: '#ef4444' },  // Đỏ - Xấu
                      { min: 200, max: 300, color: '#a855f7' },  // Tím - Rất xấu
                      { min: 300, max: 500, color: '#7c2d12' },  // Nâu đỏ - Nguy hại
                    ];
                    
                    return aqiZones.map((zone, idx) => {
                      // Chỉ vẽ zone nếu nó nằm trong range hiển thị
                      if (zone.max < yMin || zone.min > yMax) return null;
                      
                      // Tính vị trí y cho zone
                      const zoneMin = Math.max(zone.min, yMin);
                      const zoneMax = Math.min(zone.max, yMax);
                      
                      // Convert AQI value sang pixel position (y = 0 ở top, y = h ở bottom)
                      // yMin ở bottom (y = h), yMax ở top (y = 0)
                      const y1 = h - ((zoneMax - yMin) / yRange) * h; // Top của zone
                      const y2 = h - ((zoneMin - yMin) / yRange) * h; // Bottom của zone
                      const zoneHeight = y2 - y1;
                      
                      if (zoneHeight <= 0) return null;
                      
                      return (
                        <Rect
                          key={idx}
                          x="0"
                          y={y1}
                          width={w}
                          height={zoneHeight}
                          fill={zone.color}
                          opacity={0.75}
                        />
                      );
                    });
                  })()}
                  
                  {/* Gridlines ngang */}
                  {chartData.yAxisLabels && chartData.yAxisLabels.map((label, idx) => {
                    const totalLabels = chartData.yAxisLabels.length;
                    const chartHeight = chartData.height || 120;
                    const spacing = chartHeight / (totalLabels - 1 || 1);
                    const y = chartHeight - (idx * spacing);
                    
                    return (
                      <Path
                        key={`grid-${label}`}
                        d={`M 0 ${y} L ${chartData.width || chartWidth} ${y}`}
                        stroke="#e5e7eb"
                        strokeWidth={1}
                        strokeDasharray="4,4"
                        opacity={0.7}
                      />
                    );
                  })}
                  
                  {/* Đường line AQI - màu đơn giản */}
                  {chartData.points.map((point, idx) => {
                    if (idx === 0) return null;
                    const prevPoint = chartData.points[idx - 1];
                    
                    // Kiểm tra nếu có gap (ngày không có data giữa 2 điểm)
                    if (point.idx - prevPoint.idx > 1) return null;
                    
                    return (
                      <Path
                        key={`segment-${idx}`}
                        d={`M ${prevPoint.x} ${prevPoint.y} L ${point.x} ${point.y}`}
                        stroke="#2563eb"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}
                  
                  {/* Vẽ các điểm có thể chạm - màu theo AQI */}
                  {chartData.points.map((point, idx) => {
                    const isToday = point.idx === 0; // first point corresponds to today
                    const isSelected = selectedPoint?.idx === point.idx;
                    const radius = isToday ? (isSelected ? 9 : 7) : (isSelected ? 7 : 5);
                    const fillColor = getAQIColor(point.aqi);
                    const strokeColor = isToday ? '#632626ff' : '#ffffff';
                    const strokeW = isToday ? 3 : 2;

                    return (
                      <Circle
                        key={idx}
                        cx={point.x}
                        cy={point.y}
                        r={radius}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={strokeW}
                        onPress={() => setSelectedPoint(point)}
                      />
                    );
                  })}
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
                  {selectedPoint.precipitation !== null && selectedPoint.precipitation !== undefined && (
                    <Text style={styles.tooltipDetail}>
                      🌧️ {selectedPoint.precipitation} mm
                    </Text>
                  )}
                </View>
              )}
            </View>
            </View>

            {/* Nhãn ngày trục dưới */}
            <View style={[styles.weeklyDatesRow, { width: chartData.width || chartWidth }]}>
              {weekly.map((item, idx) => {
                const step = weekly.length > 1 ? (chartData.width || chartWidth) / (weekly.length - 1) : (chartData.width || chartWidth) / 2;
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
                const aqiBgColor = hasData ? getAQIColor(item.aqi) : '#f3f4f6';
                const aqiTextColor = hasData ? '#ffffff' : '#9ca3af';
                
                // Calculate temp display with min/max if available
                const tempDisplay = hasData ? (
                  item.temp_max !== null && item.temp_min !== null 
                    ? `${Math.round(item.temp_min)}° - ${Math.round(item.temp_max)}° `
                    : `${Math.round(item.temp)}°C`
                ) : 'N/A';
                
                return (
                  <View key={item.date} style={[
                    styles.forecastCard,
                    !hasData && styles.forecastCardNoData
                  ]}>
                    <Text style={styles.forecastDay}>{item.label}</Text>
                    <Text style={[styles.forecastDate, { opacity: 0.8 }]}>{item.date}</Text>
                    <Text style={styles.forecastTemp}>
                      {tempDisplay}
                    </Text>
                    {hasData && item.precipitation !== null && item.precipitation !== undefined && (
                      <Text style={styles.forecastPrecip}>
                        🌧️ {item.precipitation}mm
                      </Text>
                    )}
                    <View
                      style={[
                        styles.forecastAqiBadge,
                        { 
                          backgroundColor: aqiBgColor,
                          borderWidth: hasData ? 0 : 1,
                          borderColor: hasData ? 'transparent' : '#e5e7eb'
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.forecastAqiText,
                          { color: aqiTextColor, fontWeight: '700' },
                        ]}
                      >
                        {hasData ? `${item.aqi}` : 'Chưa có'}
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
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 40,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backIcon: {
    color: 'rgba(0, 0, 0, 0.62)',
    fontSize: 40,
    marginTop: -2,
    fontWeight: '300',
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
  locationChipWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  aqiColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  infoColumn: {
    flex: 1,
    gap: 8,
    alignItems: 'center',
  },
  aqiLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
    opacity: 0.95,
  },
  locationChip: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgb(255, 255, 255)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
    width: '50%',
  },
  locationDot: {
    fontSize: 10,
    color: '#22c55e',
    marginRight: 6,
  },
  locationText: {
    fontSize: 13,
    color: 'rgb(0, 0, 0)',
    fontWeight: '600',
    textAlign: 'center',
  },
  aqiCircleWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aqiCircleGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.35)',
    opacity: 0.9,
  },
  aqiNumber: {
    fontSize: 44,
    fontWeight: '900',
    color: '#ffffff',
  },
  aqiLabel: {
    position: 'absolute',
    top: 8,
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusIcon: {
    fontSize: 90,
  },
  statusPillText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  pm25Card: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'center',
  },
  pm25Icon: {
    fontSize: 14,
  },
  pm25Label: {
    fontSize: 11,
    color: '#ffffff',
    opacity: 0.9,
    fontWeight: '600',
  },
  pm25Value: {
    fontSize: 15,
    fontWeight: '800',
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  metricCard: {
    flexBasis: '48%',
    minWidth: 100,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    flexDirection: "row",
    gap: 10,
  },
  metricInfoBox: {
    flexDirection: "column",
    alignItems: 'flex-start',
    flex: 1,
  },
  metricIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIcon: {
    fontSize: 24,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 26,
  },
  metricLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
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
    flex: 1,
  },
  weeklyDatesRow: {
    position: 'relative',
    height: 20,
    marginLeft: 43, // Width of yAxisLabels (35) + marginRight (8)
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
  forecastPrecip: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.95,
  },
  forecastAqiBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  forecastAqiText: {
    fontSize: 13,
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
    top: '0%',
    right: 4,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
  },
  tooltipCloseText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '700',
    lineHeight: 18,
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

