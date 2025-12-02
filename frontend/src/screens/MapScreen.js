import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AqiBar from '../components/ui/AqiBar';

const CONTROL_HEIGHT = 40;
const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';

// --- MOCK DATA (tham chiếu từ AirGuardApp.jsx) ---
const baseStationMarkers = [
  { 
    id: 1, 
    lat: 21.038511, 
    lng: 105.784817, 
    baseAqi: 141, 
    name: 'Vị trí của bạn',
    address: 'Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội',
    district: 'Quận Cầu Giấy',
    city: 'Hà Nội'
  },
  { 
    id: 2, 
    lat: 20.980549, 
    lng: 105.777182, 
    baseAqi: 91, 
    name: 'Trạm Hà Đông',
    address: 'Phường Quang Trung, Quận Hà Đông, Hà Nội',
    district: 'Quận Hà Đông',
    city: 'Hà Nội'
  },
  { 
    id: 3, 
    lat: 20.999001, 
    lng: 105.801448, 
    baseAqi: 81, 
    name: 'Trạm Thanh Xuân',
    address: 'Phường Nhân Chính, Quận Thanh Xuân, Hà Nội',
    district: 'Quận Thanh Xuân',
    city: 'Hà Nội'
  },
  { 
    id: 4, 
    lat: 21.121444, 
    lng: 106.111273, 
    baseAqi: 87, 
    name: 'Trạm Bắc Ninh',
    address: 'Phường Suối Hoa, Thành phố Bắc Ninh, Bắc Ninh',
    district: 'Thành phố Bắc Ninh',
    city: 'Bắc Ninh'
  },
  { 
    id: 5, 
    lat: 21.039937, 
    lng: 105.921001, 
    baseAqi: 49, 
    name: 'Trạm Gia Lâm',
    address: 'Phường Yên Thường, Quận Gia Lâm, Hà Nội',
    district: 'Quận Gia Lâm',
    city: 'Hà Nội'
  },
  { 
    id: 6, 
    lat: 20.946839, 
    lng: 105.952934, 
    baseAqi: 40, 
    name: 'Trạm Ecopark',
    address: 'Xã Xuân Quan, Huyện Văn Giang, Hưng Yên',
    district: 'Huyện Văn Giang',
    city: 'Hưng Yên'
  },
  { 
    id: 7, 
    lat: 21.323284, 
    lng: 105.429681, 
    baseAqi: 108, 
    name: 'Trạm Việt Trì',
    address: 'Phường Tân Dân, Thành phố Việt Trì, Phú Thọ',
    district: 'Thành phố Việt Trì',
    city: 'Phú Thọ'
  },
  { 
    id: 8, 
    lat: 21.275277, 
    lng: 106.449584, 
    baseAqi: 88, 
    name: 'Trạm Lục Ngạn',
    address: 'Thị trấn Chũ, Huyện Lục Ngạn, Bắc Giang',
    district: 'Huyện Lục Ngạn',
    city: 'Bắc Giang'
  },
  { 
    id: 9, 
    lat: 21.141819, 
    lng: 106.384886, 
    baseAqi: 101, 
    name: 'Trạm Chí Linh',
    address: 'Phường Sao Đỏ, Thành phố Chí Linh, Hải Dương',
    district: 'Thành phố Chí Linh',
    city: 'Hải Dương'
  },
];

const healthAdvice = {
  good: { text: 'Không khí tuyệt vời! Hãy tận hưởng các hoạt động ngoài trời.', action: 'Mở cửa sổ' },
  moderate: { text: 'Chất lượng chấp nhận được. Nhóm nhạy cảm nên hạn chế vận động mạnh.', action: 'Theo dõi thêm' },
  unhealthy: { text: 'Có hại cho sức khỏe. Nên đeo khẩu trang khi ra đường.', action: 'Đeo khẩu trang' },
  veryUnhealthy: { text: 'Rất có hại. Hạn chế tối đa ra ngoài. Đóng kín cửa sổ.', action: 'Đóng cửa sổ' },
  hazardous: { text: 'Nguy hại! Ở trong nhà và sử dụng máy lọc không khí ngay.', action: 'Dùng máy lọc khí' },
};

const generateLocationDetails = (baseData) => {
  const aqi = baseData.aqi;
  let status = 'Tốt';
  let color = '#22c55e';
  let advice = healthAdvice.good;

  if (aqi > 50) { status = 'Trung bình'; color = '#eab308'; advice = healthAdvice.moderate; }
  if (aqi > 100) { status = 'Kém'; color = '#f97316'; advice = healthAdvice.unhealthy; }
  if (aqi > 150) { status = 'Xấu'; color = '#ef4444'; advice = healthAdvice.veryUnhealthy; }
  if (aqi > 200) { status = 'Nguy hại'; color = '#7f1d1d'; advice = healthAdvice.hazardous; }

  return {
    ...baseData,
    status,
    color,
    advice,
    temp: 28 + Math.floor(Math.random() * 5),
    humidity: 60 + Math.floor(Math.random() * 20),
  };
};

const stationDetailsById = baseStationMarkers
  .map((marker) => generateLocationDetails({ ...marker, aqi: marker.baseAqi }))
  .reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

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
        { id: 1, name: 'Vị trí của bạn', aqi: 141, lat: 21.038511, lng: 105.784817 },
        { id: 2, name: 'Trạm Hà Đông', aqi: 91, lat: 20.980549, lng: 105.777182 },
        { id: 3, name: 'Trạm Thanh Xuân', aqi: 81, lat: 20.999001, lng: 105.801448 },
        { id: 4, name: 'Trạm Bắc Ninh', aqi: 87, lat: 21.121444, lng: 106.111273 },
        { id: 5, name: 'Trạm Gia Lâm', aqi: 49, lat: 21.039937, lng: 105.921001 },
        { id: 6, name: 'Trạm Ecopark', aqi: 40, lat: 20.946839, lng: 105.952934 },
        { id: 7, name: 'Trạm Việt Trì', aqi: 108, lat: 21.323284, lng: 105.429681 },
        { id: 8, name: 'Trạm Lục Ngạn', aqi: 88, lat: 21.275277, lng: 106.449584 },
        { id: 9, name: 'Trạm Chí Linh', aqi: 101, lat: 21.141819, lng: 106.384886 }
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

      map.on('click', function (e) {
        try {
          const { lat, lng } = e.latlng;
          ensureExternalMarker(lat, lng);
          map.setView(e.latlng, 12);
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
  const navigation = useNavigation();

  // Lấy thêm thông tin chi tiết (temp, humidity, advice, color, address...) giống AirGuardApp.jsx
  const selectedStationDetail = useMemo(() => {
    if (!selectedStation) return null;
    const detailed = stationDetailsById[selectedStation.id];
    if (!detailed) return selectedStation;
    return {
      ...detailed,
      ...selectedStation,
    };
  }, [selectedStation]);

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

  return (
    <View style={styles.container}>
      {/* WebView hiển thị Leaflet map (WebView thuần, giống bản đầu) */}
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: LEAFLET_HTML }}
        style={styles.webview}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'station_click') {
              setSelectedStation(data.payload);
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
                      AQI {selectedStationDetail.aqi}
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
              </View>

              <View style={styles.stationSideMetrics}>
                <View style={styles.metricRow}>
                  <Feather name="thermometer" size={14} color="#6b7280" style={{ marginRight: 4 }} />
                  <Text style={styles.metricText}>{selectedStationDetail.temp}°C</Text>
                </View>
                <View style={styles.metricRow}>
                  <Feather name="droplet" size={14} color="#6b7280" style={{ marginRight: 4 }} />
                  <Text style={styles.metricText}>{selectedStationDetail.humidity}%</Text>
                </View>
              </View>
            </View>

            {/* Button Xem chi tiết & dự báo */}
            <TouchableOpacity
              style={styles.detailButton}
              activeOpacity={0.85}
              onPress={() => {
                if (selectedStationDetail) {
                  navigation.navigate('DetailStation', { station: selectedStationDetail });
                }
              }}
            >
              <Text style={styles.detailButtonText}>Xem chi tiết &amp; dự báo</Text>
              <Feather name="chevron-right" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
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
  zoomControls: {
    position: 'absolute',
    right: 12,
    bottom: 180,
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
