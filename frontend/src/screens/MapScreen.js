import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { config } from '../../config';
import AqiBar from '../components/ui/AqiBar';
import { fetchStationsWithLatestData } from '../services/cemApi';

const CONTROL_HEIGHT = 40;
const NOMINATIM_ENDPOINT = config.NOMINATIM_ENDPOINT + '/search';

// API endpoints
const API_BASE_URL = config.API_BASE_URL[Platform.OS] || config.API_BASE_URL.web;
const OPENMETEO_API_URL = config.OPENMETEO_API_URL;



const healthAdvice = {
  good: { text: 'Không khí tuyệt vời! Hãy tận hưởng các hoạt động ngoài trời.', action: 'Mở cửa sổ' },
  moderate: { text: 'Chất lượng chấp nhận được. Nhóm nhạy cảm nên hạn chế vận động mạnh.', action: 'Theo dõi thêm' },
  unhealthy: { text: 'Có hại cho sức khỏe. Nên đeo khẩu trang khi ra đường.', action: 'Đeo khẩu trang' },
  veryUnhealthy: { text: 'Rất có hại. Hạn chế tối đa ra ngoài. Đóng kín cửa sổ.', action: 'Đóng cửa sổ' },
  hazardous: { text: 'Nguy hại! Ở trong nhà và sử dụng máy lọc không khí ngay.', action: 'Dùng máy lọc khí' },
};

// const generateLocationDetails = (baseData) => {
//   const aqi = baseData.aqi;
//   let status = 'Tốt';
//   let color = '#22c55e';
//   let advice = healthAdvice.good;

//   if (aqi > 50) { status = 'Trung bình'; color = '#eab308'; advice = healthAdvice.moderate; }
//   if (aqi > 100) { status = 'Kém'; color = '#f97316'; advice = healthAdvice.unhealthy; }
//   if (aqi > 150) { status = 'Xấu'; color = '#ef4444'; advice = healthAdvice.veryUnhealthy; }
//   if (aqi > 200) { status = 'Nguy hại'; color = '#7f1d1d'; advice = healthAdvice.hazardous; }

//   return {
//     ...baseData,
//     status,
//     color,
//     advice,
//     temp: 28 + Math.floor(Math.random() * 5),
//     humidity: 60 + Math.floor(Math.random() * 20),
//   };
// };

// --- MOCK DATA - COMMENTED OUT, USING REAL DATA FROM CEM API ---
// const stationDetailsById = baseStationMarkers
//   .map((marker) => generateLocationDetails({ ...marker, aqi: marker.baseAqi }))
//   .reduce((acc, item) => {
//     acc[item.id] = item;
//     return acc;
//   }, {});

// Sẽ được tạo từ cemStations trong component

// Tạo danh sách 7 ngày từ hôm nay với label + ngày hiển thị + ISO date cho WMS
const createDayOptions = () => {
  const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const result = [];
  const today = new Date();

  for (let offset = 0; offset < 7; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dayName = weekdays[d.getDay()];
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const dateStr = `${day}/${month}`;
    const isoDate = `${year}-${month}-${day}`; // YYYY-MM-DD cho PopGIS

    let label;
    if (offset === 0) label = 'Hôm nay';
    else if (offset === 1) label = 'Ngày mai';
    else label = dayName;

    result.push({ label, dateStr, isoDate });
  }

  return result;
};

// HTML Leaflet map inline – giữ nguyên logic postMessage station_click
const LEAFLET_HTML = `
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      html,
      body,
      #map {
        height: 100%;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
          sans-serif;
      }
      .leaflet-control-zoom { display: none !important; }
      @keyframes ping {
        0% { transform: scale(1); opacity: 0.9; }
        75%, 100% { transform: scale(2); opacity: 0; }
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const map = L.map('map', { zoomControl: false }).setView([21.0285, 105.8542], 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      let wmsLayer = null;
      let currentDate = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
      
      function createWmsLayer(dateStr) {
        if (wmsLayer) {
          try { map.removeLayer(wmsLayer); } catch (e) {}
        }
        
        // Chuyển đổi date format nếu cần (YYYY-MM-DD -> YYYYMMDD)
        const dateParam = dateStr ? dateStr.replace(/-/g, '') : currentDate;
        
        // Sử dụng TiTiler server với AQI colormap
        // Dùng 10.0.2.2 cho Android emulator, localhost cho iOS/web
        const serverUrl = 'http://10.0.2.2:8000';
        
        wmsLayer = L.tileLayer(
          serverUrl + '/pm25/tiles/{z}/{x}/{y}.png?date=' + dateParam + '&colormap_name=aqi',
          {
            maxZoom: 18,
            transparent: true,
            opacity: 0.6,
            attribution: '&copy; SmartAQ PM2.5',
            crossOrigin: true
          }
        );
        wmsLayer.addTo(map);
      }
      createWmsLayer();


      const stations = [
        // { id: 1, name: 'Vị trí của bạn', aqi: 141, lat: 21.038511, lng: 105.784817 },
        // { id: 2, name: 'Trạm Hà Đông', aqi: 91, lat: 20.980549, lng: 105.777182 },
        // { id: 3, name: 'Trạm Thanh Xuân', aqi: 81, lat: 20.999001, lng: 105.801448 },
        // { id: 4, name: 'Trạm Bắc Ninh', aqi: 87, lat: 21.121444, lng: 106.111273 },
        // { id: 5, name: 'Trạm Gia Lâm', aqi: 49, lat: 21.039937, lng: 105.921001 },
        // { id: 6, name: 'Trạm Ecopark', aqi: 40, lat: 20.946839, lng: 105.952934 },
        // { id: 7, name: 'Trạm Việt Trì', aqi: 108, lat: 21.323284, lng: 105.429681 },
        // { id: 8, name: 'Trạm Lục Ngạn', aqi: 88, lat: 21.275277, lng: 106.449584 },
        // { id: 9, name: 'Trạm Chí Linh', aqi: 101, lat: 21.141819, lng: 106.384886 }
      ];

      function getAqiColor(aqi) {
        if (aqi <= 50) return '#22c55e';
        if (aqi <= 100) return '#eab308';
        if (aqi <= 150) return '#f97316';
        return '#ef4444';
      }

      function getStatusText(aqi) {
        if (aqi <= 50) return 'Tốt';
        if (aqi <= 100) return 'Trung bình';
        if (aqi <= 150) return 'Kém';
        if (aqi <= 200) return 'Xấu';
        return 'Nguy hại';
      }

      stations.forEach((s) => {
        const color = getAqiColor(s.aqi);
        const pingHtml =
          s.aqi > 150
            ? '<div style="position:absolute;inset:0;border-radius:999px;background:rgba(239,68,68,0.4);animation:ping 1.2s infinite;"></div>'
            : '';

        const iconHtml =
          '<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">' +
          pingHtml +
          '<div style="position:relative;width:32px;height:32px;border-radius:999px;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#ffffff;background:' +
          color +
          ';">' +
          s.aqi +
          '</div></div>';

        const icon = L.divIcon({
          html: iconHtml,
          className: '',
          iconAnchor: [0, 0]
        });

        const marker = L.marker([s.lat, s.lng], { icon }).addTo(map);
        marker.on('click', function () {
          try {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  type: 'station_click',
                  payload: { ...s, status: getStatusText(s.aqi) }
                })
              );
            }
            map.setView([s.lat, s.lng], 12);
          } catch (err) {
            console.error('postMessage error', err);
          }
        });
      });

      // Nhãn chủ quyền cho Quần đảo Hoàng Sa, Trường Sa (hardcode giống SmartAir-UI / OSM)
      function addSovereigntyLabel(lat, lng, text) {
        const html =
          '<div style="text-align:center;pointer-events:none;">' +
          '<span style="' +
          'display:inline-block;' +
          'color:#555;' +
          'font-weight:500;' +
          'font-size:10px;' +
          'font-style:italic;' +
          'padding:2px 8px;' +
          'border-radius:999px;' +
          'border:1px solid rgba(255,255,255,0.9);' +
          'white-space:nowrap;' +
          'font-family:-apple-system,BlinkMacSystemFont,\\\"Segoe UI\\\",Roboto,sans-serif;' +
          'text-shadow:' +
          '-1px -1px 0 #fff,' +
          ' 1px -1px 0 #fff,' +
          '-1px  1px 0 #fff,' +
          ' 1px  1px 0 #fff,' +
          ' 0    0   3px rgba(255,255,255,0.8);' +
          '">' +
          text +
          '</span>' +
          '</div>';
        const icon = L.divIcon({
          html,
          className: 'custom-map-label',
          iconSize: [200, 40],
          iconAnchor: [100, 20],
        });
        L.marker([lat, lng], {
          icon,
          interactive: false,
          keyboard: false,
          zIndexOffset: 1000,
        }).addTo(map);
      }

      addSovereigntyLabel(16.5, 112.0, 'Quần đảo Hoàng Sa');
      addSovereigntyLabel(10.0, 114.0, 'Quần đảo Trường Sa');

      // Marker cho địa điểm được chọn từ GPS / search / click map
      let externalMarker = null;
      function ensureExternalMarker(lat, lng) {
        const extIcon = L.divIcon({
          html:
            '<div style="width:18px;height:18px;border-radius:999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>',
          className: '',
          iconAnchor: [9, 9],
        });

        if (externalMarker) {
          externalMarker.setLatLng([lat, lng]);
        } else {
          externalMarker = L.marker([lat, lng], { icon: extIcon }).addTo(map);
        }
      }

      window.__setMapCenter = function (lat, lng) {
        try {
          map.setView([lat, lng], 12);
        } catch (e) {
          console.error('setMapCenter error', e);
        }
      };

      // Được gọi từ React Native khi có vị trí GPS hoặc địa điểm tìm kiếm
      window.__setExternalLocation = function (lat, lng) {
        try {
          ensureExternalMarker(lat, lng);
          map.setView([lat, lng], 12);
        } catch (e) {
          console.error('setExternalLocation error', e);
        }
      };

      window.__setWmsDate = function (isoDate) {
        try {
          if (isoDate) {
            // isoDate có thể là YYYY-MM-DD hoặc YYYYMMDD
            createWmsLayer(isoDate);
          }
        } catch (e) {
          console.error('setWmsDate error', e);
        }
      };

      // Function để update stations từ React Native
      let stationMarkers = [];
      let markersVisible = true;
      
      window.__updateStations = function (newStations) {
        try {
          // Xóa tất cả markers cũ
          stationMarkers.forEach(marker => map.removeLayer(marker));
          stationMarkers = [];

          // Thêm markers mới
          newStations.forEach((s) => {
            const color = getAqiColor(s.aqi || s.baseAqi || 0);
            const iconHtml =
              '<div style="' +
              'width:28px;height:28px;border-radius:999px;' +
              'background:' + color + ';' +
              'display:flex;align-items:center;justify-content:center;' +
              'border:2px solid white;' +
              'box-shadow:0 2px 8px rgba(0,0,0,0.3);' +
              'font-size:10px;font-weight:600;color:#fff;">' +
              (s.aqi || s.baseAqi || '?') +
              '</div>';

            const icon = L.divIcon({
              html: iconHtml,
              className: '',
              iconAnchor: [14, 14],
            });

            const marker = L.marker([s.lat, s.lng], { icon });
            
            // Chỉ add vào map nếu markers đang visible
            if (markersVisible) {
              marker.addTo(map);
            }
            
            marker.on('click', function () {
              try {
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                  window.ReactNativeWebView.postMessage(
                    JSON.stringify({
                      type: 'station_click',
                      payload: { ...s, status: getStatusText(s.aqi || s.baseAqi || 0) }
                    })
                  );
                }
                map.setView([s.lat, s.lng], 12);
              } catch (err) {
                console.error('postMessage error', err);
              }
            });

            stationMarkers.push(marker);
          });

          console.log('Updated stations:', newStations.length);
        } catch (e) {
          console.error('updateStations error', e);
        }
      };

      // Function để toggle markers visibility
      window.__toggleMarkers = function (visible) {
        try {
          markersVisible = visible;
          stationMarkers.forEach(marker => {
            if (visible) {
              marker.addTo(map);
            } else {
              map.removeLayer(marker);
            }
          });
          console.log('Markers visibility:', visible);
        } catch (e) {
          console.error('toggleMarkers error', e);
        }
      };

      // Function để toggle heatmap visibility
      window.__toggleHeatmap = function (visible) {
        try {
          if (wmsLayer) {
            if (visible) {
              wmsLayer.addTo(map);
            } else {
              map.removeLayer(wmsLayer);
            }
            console.log('Heatmap visibility:', visible);
          }
        } catch (e) {
          console.error('toggleHeatmap error', e);
        }
      };

      map.on('click', function (e) {
        try {
          const { lat, lng } = e.latlng;
          ensureExternalMarker(lat, lng);
          
          // Send map click event to React Native
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'map_click',
                payload: { lat, lng }
              })
            );
          }
        } catch (err) {
          console.error('map click error', err);
        }
      });
    </script>
  </body>
</html>
`;

export default function MapScreen() {
  const [dayOptions] = useState(createDayOptions);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [dayMenuOpen, setDayMenuOpen] = useState(false);
  const selectedDay = dayOptions[selectedDayIndex];
  const webviewRef = React.useRef(null);
  const [locating, setLocating] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [loadingPointData, setLoadingPointData] = useState(false);
  const [lastClickedPoint, setLastClickedPoint] = useState(null); // Lưu tọa độ điểm đã click
  const [cemStations, setCemStations] = useState([]); // Dữ liệu thật từ CEM API
  const [loadingStations, setLoadingStations] = useState(true); // Loading state cho stations
  const [webviewReady, setWebviewReady] = useState(false); // Track WebView ready state
  const [showHeatmap, setShowHeatmap] = useState(true); // Toggle heatmap
  const [showMarkers, setShowMarkers] = useState(true); // Toggle markers
  const navigation = useNavigation();

  // Load dữ liệu trạm thật từ CEM API khi component mount
  useEffect(() => {
    const loadStations = async () => {
      try {
        setLoadingStations(true);
        console.log('🔄 Loading stations from CEM API...');
        const stations = await fetchStationsWithLatestData();
        console.log(`✅ Loaded ${stations.length} stations from CEM`);
        
        // Debug: Log chi tiết stations
        if (stations.length > 0) {
          console.log('📊 First station sample:', {
            id: stations[0].id,
            name: stations[0].name,
            lat: stations[0].lat,
            lng: stations[0].lng,
            aqi: stations[0].aqi,
            baseAqi: stations[0].baseAqi,
          });
        }
        
        setCemStations(stations);
      } catch (error) {
        console.error('❌ Error loading CEM stations:', error);
        Alert.alert(
          'Lỗi tải dữ liệu',
          'Không thể tải dữ liệu trạm từ CEM. Vui lòng thử lại sau.',
          [{ text: 'OK' }]
        );
      } finally {
        setLoadingStations(false);
      }
    };

    loadStations();
  }, []); // Chỉ chạy một lần khi mount

  // Helper function to get AQI color
  const getAqiColor = (aqi) => {
    if (!aqi) return '#9ca3af';
    if (aqi <= 50) return '#22c55e';
    if (aqi <= 100) return '#eab308';
    if (aqi <= 150) return '#f97316';
    if (aqi <= 200) return '#ef4444';
    if (aqi <= 300) return '#991b1b';
    return '#7f1d1d';
  };

  // Helper function to get AQI status
  const getAqiStatus = (aqi) => {
    if (!aqi) return 'Không rõ';
    if (aqi <= 50) return 'Tốt';
    if (aqi <= 100) return 'Trung bình';
    if (aqi <= 150) return 'Kém';
    if (aqi <= 200) return 'Xấu';
    if (aqi <= 300) return 'Rất xấu';
    return 'Nguy hại';
  };

  // Helper function to get health advice
  const getHealthAdvice = (aqi) => {
    if (!aqi) return healthAdvice.good;
    if (aqi <= 50) return healthAdvice.good;
    if (aqi <= 100) return healthAdvice.moderate;
    if (aqi <= 150) return healthAdvice.unhealthy;
    if (aqi <= 200) return healthAdvice.veryUnhealthy;
    return healthAdvice.hazardous;
  };

  // Fetch PM2.5 and AQI data from backend with fallback URLs
  const fetchPM25Data = async (lat, lon, date) => {
    const dateParam = date ? date.replace(/-/g, '') : '';
    const endpoint = `/pm25/point?lon=${lon}&lat=${lat}${dateParam ? `&date=${dateParam}` : ''}`;
    
    // Try multiple URLs for Android emulator compatibility
    const urlsToTry = Platform.OS === 'android' 
      ? [
          `http://10.0.2.2:8000${endpoint}`,
          `http://localhost:8000${endpoint}`,
          `http://127.0.0.1:8000${endpoint}`,
        ]
      : [`${API_BASE_URL}${endpoint}`];
    
    for (const url of urlsToTry) {
      try {
        console.log('Trying PM2.5 from:', url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`PM2.5 API error from ${url}: ${response.status}`);
          continue; // Try next URL
        }
        
        const data = await response.json();
        console.log('✅ PM2.5 data received from:', url);
        return data;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn(`⏱️ Timeout connecting to ${url}`);
        } else {
          console.warn(`❌ Failed to fetch from ${url}:`, error.message);
        }
        // Continue to next URL
      }
    }
    
    // All URLs failed
    console.error('❌ All backend URLs failed');
    console.error('Tried URLs:', urlsToTry);
    console.warn('💡 Solutions:');
    console.warn('1. Make sure server is running: cd server && python run.py');
    console.warn('2. Check server binds to 0.0.0.0:8000 (not 127.0.0.1)');
    console.warn('3. Try accessing http://localhost:8000/health in browser');
    return null;
  };

  // Fetch weather data from Open-Meteo API (free, no API key required)
  const fetchWeatherData = async (lat, lon) => {
    try {
      // Open-Meteo API endpoint with current weather parameters
      const url = `${OPENMETEO_API_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const current = data.current || {};
      
      return {
        temp: Math.round(current.temperature_2m || 0),
        humidity: current.relative_humidity_2m || 0,
        windSpeed: current.wind_speed_10m || 0,
        weatherCode: current.weather_code || 0,
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return {
        temp: 0,
        humidity: 0,
        windSpeed: 0,
        weatherCode: 0,
      };
    }
  };

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (lat, lon) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=vi`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SmartAir-Mobile/1.0',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const address = data.address || {};
      
      const city = address.city || address.town || address.village || '';
      const district = address.city_district || address.district || address.suburb || '';
      const state = address.state || '';
      
      return {
        name: data.display_name?.split(',')[0] || 'Điểm được chọn',
        address: data.display_name || '',
        district: district || city,
        city: state || city,
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return {
        name: 'Điểm được chọn',
        address: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        district: '',
        city: '',
      };
    }
  };

  // Handle map click to fetch data from APIs
  const handleMapClick = async (lat, lon) => {
    try {
      setLoadingPointData(true);
      
      // Lưu tọa độ để có thể re-fetch khi đổi ngày
      setLastClickedPoint({ lat, lon });
      
      // Fetch all data in parallel
      const [pm25Data, weatherData, locationData] = await Promise.all([
        fetchPM25Data(lat, lon, selectedDay?.isoDate),
        fetchWeatherData(lat, lon),
        reverseGeocode(lat, lon),
      ]);

      // Check if backend server is not available (but still show weather data if available)
      if (!pm25Data) {
        Alert.alert(
          '⚠️ Không có dữ liệu PM2.5',
          Platform.OS === 'android' 
            ? `Không thể kết nối với server backend.\n\nĐã thử các URL:\n• http://10.0.2.2:8000\n• http://localhost:8000\n• http://127.0.0.1:8000\n\n✅ Giải pháp:\n1. Mở terminal mới\n2. cd server\n3. python run.py\n4. Đảm bảo server bind 0.0.0.0:8000`
            : `Không thể kết nối với server backend.\n\n✅ Giải pháp:\n1. Mở terminal: cd server\n2. Chạy: python run.py\n3. Kiểm tra: http://localhost:8000/health`,
          [{ text: 'Đã hiểu' }]
        );
      }

      // Construct station-like object
      const pointData = {
        id: 'custom-point',
        lat,
        lon, // Đổi từ lng sang lon để consistent với DetailStationScreen
        lng: lon, // Giữ lng để backward compatible
        name: locationData.name,
        address: locationData.address,
        district: locationData.district,
        city: locationData.city,
        aqi: pm25Data?.aqi || null,
        pm25: pm25Data?.pm25 || null,
        status: pm25Data?.aqi ? getAqiStatus(pm25Data.aqi) : 'Không có dữ liệu',
        color: pm25Data?.aqi ? getAqiColor(pm25Data.aqi) : '#9ca3af',
        temp: weatherData.temp,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        weatherCode: weatherData.weatherCode,
        advice: pm25Data?.aqi ? getHealthAdvice(pm25Data.aqi) : healthAdvice.good,
        category: pm25Data?.category || null,
      };

      setSelectedStation(pointData);
    } catch (error) {
      console.error('Error handling map click:', error);
    } finally {
      setLoadingPointData(false);
    }
  };

  // Tạo stationDetailsById từ cemStations
  const stationDetailsById = useMemo(() => {
    const map = {};
    cemStations.forEach(station => {
      const aqi = station.aqi || station.baseAqi || 0;
      map[station.id] = {
        ...station,
        aqi,
        status: getAqiStatus(aqi),
        color: getAqiColor(aqi),
        advice: getHealthAdvice(aqi),
      };
    });
    return map;
  }, [cemStations]);

  // Lấy thêm thông tin chi tiết (temp, humidity, advice, color, address...) giống AirGuardApp.jsx
  const selectedStationDetail = useMemo(() => {
    if (!selectedStation) return null;
    
    // If it's a custom point from map click, return as-is
    if (selectedStation.id === 'custom-point') {
      return selectedStation;
    }
    
    // Otherwise, get detailed info from stationDetailsById
    const detailed = stationDetailsById[selectedStation.id];
    if (!detailed) return selectedStation;
    return {
      ...detailed,
      ...selectedStation,
    };
  }, [selectedStation, stationDetailsById]);

  // Memoize handleMapClick to avoid redefining on every render
  const handleMapClick = React.useCallback((lat, lon) => {
    // ... original handleMapClick logic here ...
  }, [/* dependencies: add all variables used inside handleMapClick */]);

  // Re-fetch PM2.5 data khi đổi ngày (nếu đang xem điểm tùy ý)
  useEffect(() => {
    if (selectedStation?.id === 'custom-point' && lastClickedPoint) {
      // Re-fetch dữ liệu với ngày mới
      handleMapClick(lastClickedPoint.lat, lastClickedPoint.lon);
    }
  }, [selectedDay, selectedStation, lastClickedPoint, handleMapClick]); // Đảm bảo dependencies đầy đủ

  const handleLocateMe = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocating(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = pos.coords;
      if (webviewRef.current && latitude && longitude) {
        const js = `
          window.__setExternalLocation && window.__setExternalLocation(${latitude}, ${longitude});
          true;
        `;
        webviewRef.current.injectJavaScript(js);
      }
    } catch (e) {
      // Có thể log ra console trong dev, nhưng không làm crash app
      console.warn('GPS error', e);
    } finally {
      setLocating(false);
    }
  };

  // Tìm kiếm địa điểm qua OpenStreetMap Nominatim (giống SmartAir-UI, bản rút gọn)
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const runSearch = async () => {
      const q = searchQuery.trim();
      if (q.length < 3) {
        setSearchResults([]);
        setSearchError(null);
        return;
      }

      try {
        setSearchLoading(true);
        setSearchError(null);

        const params = new URLSearchParams({
          format: 'json',
          addressdetails: '1',
          polygon_geojson: '0',
          limit: '5',
          countrycodes: 'vn',
          dedupe: '1',
          q,
        });

        const res = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
          headers: {
            'Accept-Language': 'vi',
            'User-Agent': 'SmartAir-Mobile/1.0',
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error('Search failed');
        }

        const data = await res.json();
        if (!active) return;

        const mapped = data.map((item) => {
          const city = item.address?.city || item.address?.town || item.address?.village || '';
          const district = item.address?.city_district || item.address?.district || '';
          const state = item.address?.state || '';
          const formatted = [district, city, state].filter(Boolean).join(', ');

          return {
            id: `osm-${item.place_id}`,
            name: item.display_name?.split(',')[0] || item.display_name,
            address: formatted || item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          };
        });

        setSearchResults(mapped);
      } catch (e) {
        if (e.name !== 'AbortError') {
          setSearchError('Không tìm thấy địa điểm phù hợp');
        }
      } finally {
        if (active) setSearchLoading(false);
      }
    };

    const debounce = setTimeout(runSearch, 450);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(debounce);
    };
  }, [searchQuery]);

  const handleSelectSearchResult = (item) => {
    // Center map tới địa điểm OSM
    if (webviewRef.current && item.lat && item.lng) {
      const js = `
        window.__setExternalLocation && window.__setExternalLocation(${item.lat}, ${item.lng});
        true;
      `;
      webviewRef.current.injectJavaScript(js);
    }

    setSearchQuery(item.name);
    setSearchResults([]);
    setSearchError(null);
  };

  // Inject stations vào WebView sau khi cemStations được load và WebView ready
  useEffect(() => {
    if (webviewReady && webviewRef.current && cemStations.length > 0) {
      console.log(`🗺️ Injecting ${cemStations.length} stations into map...`);
      
      // Delay nhỏ để đảm bảo map đã init xong
      setTimeout(() => {
        const js = `
          if (window.__updateStations) {
            window.__updateStations(${JSON.stringify(cemStations)});
            console.log('✅ Stations injected successfully');
          } else {
            console.error('❌ __updateStations function not found');
          }
          true;
        `;
        webviewRef.current.injectJavaScript(js);
      }, 500); // 500ms delay
    }
  }, [cemStations, webviewReady]); // Trigger khi cemStations hoặc webviewReady thay đổi

  // Toggle markers visibility
  useEffect(() => {
    if (webviewReady && webviewRef.current) {
      const js = `
        window.__toggleMarkers && window.__toggleMarkers(${showMarkers});
        true;
      `;
      webviewRef.current.injectJavaScript(js);
    }
  }, [showMarkers, webviewReady]);

  // Ẩn markers khi chọn ngày khác ngày hôm nay
  useEffect(() => {
    if (webviewReady && webviewRef.current) {
      const shouldShowMarkers = selectedDayIndex === 0 && showMarkers;
      const js = `
        window.__toggleMarkers && window.__toggleMarkers(${shouldShowMarkers});
        true;
      `;
      webviewRef.current.injectJavaScript(js);
    }
  }, [selectedDayIndex, showMarkers, webviewReady]);

  // Toggle heatmap visibility
  useEffect(() => {
    if (webviewReady && webviewRef.current) {
      const js = `
        window.__toggleHeatmap && window.__toggleHeatmap(${showHeatmap});
        true;
      `;
      webviewRef.current.injectJavaScript(js);
    }
  }, [showHeatmap, webviewReady]);

  return (
    <View style={styles.container}>
      {/* WebView hiển thị Leaflet map (WebView thuần, giống bản đầu) */}
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: LEAFLET_HTML }}
        style={styles.webview}
        onLoad={() => {
          console.log('✅ WebView loaded, map ready');
          setWebviewReady(true);
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'station_click') {
              setSelectedStation(data.payload);
            } else if (data.type === 'map_click') {
              // Handle map click - fetch data from backend
              const { lat, lng } = data.payload;
              handleMapClick(lat, lng);
            }
          } catch (e) {
            // ignore parse errors
          }
        }}
      />

      {/* Thanh control trên cùng: chọn ngày + GPS */}
      <View style={styles.topBar}>
        {/* Thanh search giống SmartAir-UI */}
        <View style={styles.searchWrapper}>
          <Feather name="search" size={16} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm quận, phường, xã..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Nút chọn ngày */}
        <TouchableOpacity
          style={styles.dayButton}
          onPress={() => setDayMenuOpen((prev) => !prev)}
        >
          <Text style={styles.dayButtonText}>
            {selectedDay ? `${selectedDay.label} - ${selectedDay.dateStr}` : 'Chọn ngày'}
          </Text>
          <Feather
            name={dayMenuOpen ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="#9ca3af"
          />
        </TouchableOpacity>

        {/* Nút GPS */}
        <TouchableOpacity
          style={styles.gpsButton}
          onPress={handleLocateMe}
          disabled={locating}
        >
          {locating ? (
            <View style={styles.gpsSpinner} />
          ) : (
            <Feather name="crosshair" size={16} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Layer Controls - Toggle Heatmap & Markers */}
      <View style={styles.layerControls}>
        <TouchableOpacity
          style={[styles.layerButton, !showHeatmap && styles.layerButtonInactive]}
          onPress={() => setShowHeatmap(!showHeatmap)}
        >
          <Feather name="map" size={16} color={showHeatmap ? "#2563eb" : "#9ca3af"} />
          <Text style={[styles.layerButtonText, !showHeatmap && styles.layerButtonTextInactive]}>
            Heatmap
          </Text>
        </TouchableOpacity>
       <View style={styles.separator} />
        <TouchableOpacity
          style={[
            styles.layerButton,
            (!showMarkers || selectedDayIndex !== 0) && styles.layerButtonInactive
          ]}
          onPress={() => {
            if (selectedDayIndex === 0) {
              setShowMarkers(!showMarkers);
            }
          }}
          disabled={selectedDayIndex !== 0}
        >
          <Feather 
            name="map-pin" 
            size={16} 
            color={(showMarkers && selectedDayIndex === 0) ? "#2563eb" : "#9ca3af"} 
          />
          <Text style={[
            styles.layerButtonText,
            (!showMarkers || selectedDayIndex !== 0) && styles.layerButtonTextInactive
          ]}>
            Trạm
          </Text>
        </TouchableOpacity>
      </View>

      {/* Zoom controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => {
            if (webviewRef.current) {
              webviewRef.current.injectJavaScript(`
                map.zoomIn();
                true;
              `);
            }
          }}
        >
          <Feather name="plus" size={20} color="#374151" />
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => {
            if (webviewRef.current) {
              webviewRef.current.injectJavaScript(`
                map.zoomOut();
                true;
              `);
            }
          }}
        >
          <Feather name="minus" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Dropdown kết quả tìm kiếm OSM */}
      {searchQuery.trim().length > 0 && (searchResults.length > 0 || searchLoading || searchError) && (
        <View style={styles.searchDropdown}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.searchDropdownContent}
          >
            {searchResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.searchResultRow}
                onPress={() => handleSelectSearchResult(item)}
              >
                <Feather
                  name="map-pin"
                  size={14}
                  color="#2563eb"
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.searchResultName}>{item.name}</Text>
                  {!!item.address && (
                    <Text style={styles.searchResultAddress}>{item.address}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {searchLoading && (
              <Text style={styles.searchStatusText}>Đang tìm kiếm địa điểm...</Text>
            )}

            {!searchLoading && !searchResults.length && !searchError && (
              <Text style={styles.searchStatusText}>
                Nhập ít nhất 3 ký tự để tìm kiếm
              </Text>
            )}

            {searchError && (
              <Text style={[styles.searchStatusText, { color: '#ef4444' }]}>
                {searchError}
              </Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* Thanh ngày dạng popup phía dưới, scroll ngang giống SmartAir-UI */}
      {dayMenuOpen && (
        <View style={styles.dayDropdown}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayScrollContent}
          >
            {dayOptions.map((opt, idx) => (
              <TouchableOpacity
                key={`${opt.label}-${opt.dateStr}`}
                style={[
                  styles.dayChip,
                  selectedDayIndex === idx && styles.dayChipActive,
                ]}
                onPress={() => {
                  setSelectedDayIndex(idx);
                  setDayMenuOpen(false);
                  if (webviewRef.current && opt.isoDate) {
                    const js = `window.__setWmsDate && window.__setWmsDate('${opt.isoDate}'); true;`;
                    webviewRef.current.injectJavaScript(js);
                  }
                }}
              >
                <View>
                  <Text
                    style={[
                      styles.dayChipText,
                      selectedDayIndex === idx && styles.dayChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text
                    style={[
                      styles.dayChipDate,
                      selectedDayIndex === idx && styles.dayChipDateActive,
                    ]}
                  >
                    {opt.dateStr}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom sheet hiển thị chi tiết station – giống popup trong SmartAir-UI */}
      {selectedStationDetail && (
        <View style={styles.stationSheet}>
          <View style={styles.stationSheetHandle} />

          {/* Thanh header: chỉ nút đóng bên trái, bỏ text "Thông tin trạm đo" */}
          <View style={styles.stationHeaderRow}>
            <TouchableOpacity
              onPress={() => setSelectedStation(null)}
              style={styles.stationHeaderClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color="#4b5563" />
            </TouchableOpacity>
            <View style={{ width: 32 }} />
          </View>

          {loadingPointData ? (
            <View style={[styles.stationContent, { alignItems: 'center', paddingVertical: 24 }]}>
              <Text style={{ color: '#6b7280', fontSize: 14 }}>Đang tải dữ liệu...</Text>
            </View>
          ) : (
            <View style={styles.stationContent}>
              <View style={styles.stationMainRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stationName}>{selectedStationDetail.name}</Text>

                  {selectedStationDetail.address && (
                    <View style={styles.stationAddressRow}>
                      <Feather
                        name="map-pin"
                        size={12}
                        color="#6b7280"
                        style={{ marginRight: 4, marginTop: 2 }}
                      />
                      <Text style={styles.stationAddressText}>
                        {selectedStationDetail.address}
                      </Text>
                    </View>
                  )}

                  <View style={styles.stationChipsRow}>
                    <View
                      style={[
                        styles.stationAqiPill,
                        { backgroundColor: selectedStationDetail.color || '#22c55e' },
                      ]}
                    >
                      <Text style={styles.stationAqiPillText}>
                        {selectedStationDetail.aqi ? `AQI ${selectedStationDetail.aqi}` : 'Không có dữ liệu'}
                      </Text>
                    </View>
                    <Text style={styles.stationStatusText}>
                      • {selectedStationDetail.status}
                    </Text>
                    {!!selectedStationDetail.district && (
                      <Text style={styles.stationDistrictText}>
                        • {selectedStationDetail.district}
                      </Text>
                    )}
                  </View>

                  {/* Show PM2.5 value if available */}
                  {selectedStationDetail.pm25 !== null && selectedStationDetail.pm25 !== undefined && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ fontSize: 12, color: '#6b7280' }}>
                        PM2.5: <Text style={{ fontWeight: '600', color: '#111827' }}>
                          {selectedStationDetail.pm25.toFixed(1)} μg/m³
                        </Text>
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.stationSideMetrics}>
                  {selectedStationDetail.temp !== null && selectedStationDetail.temp !== undefined && (
                    <View style={styles.metricRow}>
                      <Feather name="thermometer" size={14} color="#6b7280" style={{ marginRight: 4 }} />
                      <Text style={styles.metricText}>{selectedStationDetail.temp}°C</Text>
                    </View>
                  )}
                  {selectedStationDetail.humidity !== null && selectedStationDetail.humidity !== undefined && (
                    <View style={styles.metricRow}>
                      <Feather name="droplet" size={14} color="#6b7280" style={{ marginRight: 4 }} />
                      <Text style={styles.metricText}>{selectedStationDetail.humidity}%</Text>
                    </View>
                  )}
                  {selectedStationDetail.windSpeed !== null && selectedStationDetail.windSpeed !== undefined && (
                    <View style={styles.metricRow}>
                      <Feather name="wind" size={14} color="#6b7280" style={{ marginRight: 4 }} />
                      <Text style={styles.metricText}>{selectedStationDetail.windSpeed} m/s</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Button Xem chi tiết & dự báo - hiển thị cho mọi điểm trong ngày hôm nay */}
              {selectedDay === dayOptions[0] && (
              <TouchableOpacity
                style={styles.detailButton}
                activeOpacity={0.85}
                onPress={() => {
                  if (selectedStationDetail) {
                    navigation.navigate('DetailStation', { station: selectedStationDetail });
                  }
                }}
              >
                <Text style={styles.detailButtonText}>
                        Xem chi tiết & dự báo
                </Text>
                <Feather name="chevron-right" size={16} color="#ffffff" />
              </TouchableOpacity>
              )}
            </View>
            
          )}
        </View>
      )}

      {/* AQI bar dưới cùng – mô phỏng giống SmartAir-UI */}
      <View style={styles.bottomPanel}>
        <AqiBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 13,
    color: '#6b7280',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 48,
    left: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    paddingVertical: 0,
  },
  searchDropdown: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 92,
    left: 12,
    right: 12,
    zIndex: 11,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 220,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  searchDropdownContent: {
    paddingVertical: 6,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchResultName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  searchResultAddress: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  searchStatusText: {
    fontSize: 12,
    color: '#9ca3af',
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'center',
  },
  gpsButton: {
    marginLeft: 0,
    width: CONTROL_HEIGHT,
    height: CONTROL_HEIGHT,
    borderRadius: 999,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  gpsSpinner: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '0deg' }],
  },
  separator: {
  width: 2,
  height: '100%',   // hoặc 100% nếu muốn đường dài
  backgroundColor: '#e1dbdbff', // màu xám nhạt
},
  layerControls: {
    position: 'absolute',
    width: '45%',
    left: '27.5%',  
    bottom: 60,
    zIndex: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  layerButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    minWidth: 100,
  },
  layerButtonInactive: {
    opacity: 0.5,
  },
  layerButtonText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  layerButtonTextInactive: {
    color: '#9ca3af',
  },
  zoomControls: {
    position: 'absolute',
    right: 12,
    top: 100,
    zIndex: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    overflow: 'hidden',
  },
  zoomButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dayButton: {
    marginRight: 8,
    paddingHorizontal: 12,
    height: CONTROL_HEIGHT,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayButtonText: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '600',
    marginRight: 4,
  },
  dayButtonArrow: {
    fontSize: 10,
    color: '#9ca3af',
  },
  dayDropdown: {
    position: 'absolute',
    top: 96,
    left: 12,
    right: 60,
    zIndex: 12,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dayScrollContent: {
    flexDirection: 'row',
  },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
  },
  dayChipActive: {
    backgroundColor: '#2563eb',
  },
  dayChipText: {
    fontSize: 11,
    color: '#4b5563',
  },
  dayChipTextActive: {
    color: '#f9fafb',
    fontWeight: '600',
  },
  dayChipDate: {
    fontSize: 10,
    color: '#9ca3af',
  },
  dayChipDateActive: {
    color: '#e5e7eb',
  },
  bottomPanel: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    zIndex: 10,
  },
  stationSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 8,
    paddingBottom: 16,
    zIndex: 15,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  stationSheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#d1d5db',
    marginBottom: 6,
  },
  stationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  stationHeaderClose: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  stationHeaderTitle: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  stationContent: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  stationMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  stationSub: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  stationAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  stationAddressText: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
  },
  stationChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 8,
  },
  stationAqiPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stationAqiPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  stationStatusText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  stationDistrictText: {
    marginLeft: 6,
    fontSize: 11,
    color: '#9ca3af',
  },
  stationSideMetrics: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricText: {
    fontSize: 13,
    color: '#6b7280',
  },
  detailButton: {
    marginTop: 8,
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 6,
  },
  aqiWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  aqiTitle: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  aqiBar: {
    flexDirection: 'row',
    borderRadius: 999,
    overflow: 'hidden',
    height: 18,
    marginBottom: 6,
  },
  aqiSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aqiSegmentText: {
    color: '#f9fafb',
    fontSize: 9,
    fontWeight: '700',
  },
  aqiNote: {
    color: '#9ca3af',
    fontSize: 10,
  },
});
