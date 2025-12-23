import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
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
import { AqiBar } from '../components/ui';
import { StationDetailSheet } from '../components/map';
import { useLocationTracking } from '../hooks/map/useLocationTracking';
import useMapSearch from '../hooks/map/useMapSearch';
import useAutoSaveUserLocation from '../hooks/map/useAutoSaveUserLocation';
import { BASE_URL } from '../services/api';
import { fetchStationsWithLatestData } from '../services/cemApi';
import { fetchPM25DataFromBackend, fetchWeatherData, reverseGeocode } from '../services/mapService';
import {
  createDayOptions,
  getAQIColor,
  getHealthAdvice
} from '../utils';
import { generateLeafletHTML } from '../utils/mapHtmlUtils';
import { getAQICategory } from '../utils/aqiUtils';
const CONTROL_HEIGHT = 40;

export default function MapScreen() {
  const { saveCurrentLocation } = useLocationTracking(true); // Enable auto-tracking
  // On mount: ensure location permission is requested first
  useEffect(() => {
    let mounted = true;
    const ensurePermission = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') return;

        const res = await Location.requestForegroundPermissionsAsync();
        if (res.status === 'granted') {
          console.log('[MapScreen] Location permission granted');
          return;
        }

        // If permission denied, prompt user to open settings
        Alert.alert(
          'Cho phép vị trí',
          'Ứng dụng cần quyền vị trí để hiển thị bản đồ và vị trí của bạn. Vui lòng bật quyền trong Cài đặt.',
          [
            { text: 'Huỷ', style: 'cancel' },
            { text: 'Mở cài đặt', onPress: () => Linking.openSettings() },
          ],
        );
      } catch (e) {
        console.warn('[MapScreen] Permission check error', e);
      }
    };

    ensurePermission();
    return () => { mounted = false; };
  }, []);
  const [dayOptions] = useState(createDayOptions);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [dayMenuOpen, setDayMenuOpen] = useState(false);
  const selectedDay = dayOptions[selectedDayIndex];
  const webviewRef = React.useRef(null);
  const [locating, setLocating] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loadingPointData, setLoadingPointData] = useState(false);
  
  // Search logic từ hook
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    searchError,
    clearSearch,
  } = useMapSearch();
  const [lastClickedPoint, setLastClickedPoint] = useState(null); // Lưu tọa độ điểm đã click
  const [cemStations, setCemStations] = useState([]); // Dữ liệu thật từ CEM API
  const [loadingStations, setLoadingStations] = useState(true); // Loading state cho stations
  const [webviewReady, setWebviewReady] = useState(false); // Track WebView ready state

  // Tự động lưu lịch sử vị trí GPS khi user xem chi tiết vị trí của mình
  const { savedLocationRef } = useAutoSaveUserLocation(selectedStation, saveCurrentLocation);
  const [showHeatmap, setShowHeatmap] = useState(true); // Toggle heatmap
  const [showMarkers, setShowMarkers] = useState(true); // Toggle markers
  const navigation = useNavigation();

  // Load dữ liệu trạm thật từ CEM API khi component mount
  useEffect(() => {
    console.log('🚀 MapScreen mounted - Starting to load stations...');
    
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
            pm25: stations[0].pm25,
          });
        } else {
          console.log('⚠️ No stations returned from API');
        }
        
        console.log('✅ setCemStations called with', stations.length, 'stations');
        setCemStations(stations);
        
        // Force log để kiểm tra
        setTimeout(() => {
          console.log('🔍 After setCemStations - state should be updated');
        }, 100);
      } catch (error) {
        console.error('❌ Error loading CEM stations:', error);
        console.error('❌ Error stack:', error.stack);
        Alert.alert(
          'Lỗi tải dữ liệu',
          'Không thể tải dữ liệu trạm từ CEM. Vui lòng thử lại sau.',
          [{ text: 'OK' }]
        );
      } finally {
        console.log('🏁 loadStations finally block - setLoadingStations(false)');
        setLoadingStations(false);
      }
    };

    console.log('📞 Calling loadStations()...');
    loadStations();
  }, []); // Chỉ chạy một lần khi mount

  // API functions đã được tách vào services/mapService.js:
  // - fetchPM25DataFromBackend
  // - fetchWeatherData
  // - reverseGeocode

  // Handle map click to fetch data from APIs
  const handleMapClick = async (lat, lon, pointId = 'custom-point') => {
    try {
      // Validate coordinates before making API calls
      const validLat = parseFloat(lat);
      const validLon = parseFloat(lon);
      
      if (isNaN(validLat) || isNaN(validLon)) {
        console.warn('⚠️ Invalid coordinates:', { lat, lon });
        Alert.alert('Lỗi', 'Tọa độ không hợp lệ');
        return;
      }
      
      if (validLat < -90 || validLat > 90 || validLon < -180 || validLon > 180) {
        console.warn('⚠️ Coordinates out of range:', { lat: validLat, lon: validLon });
        Alert.alert('Lỗi', 'Tọa độ nằm ngoài phạm vi cho phép');
        return;
      }
      
      setLoadingPointData(true);
      
      // Lưu tọa độ để có thể re-fetch khi đổi ngày (chỉ cho custom-point)
      if (pointId === 'custom-point') {
        setLastClickedPoint({ lat: validLat, lon: validLon });
      }
      
      // Use Promise.allSettled instead of Promise.all to handle individual failures gracefully
      const results = await Promise.allSettled([
        fetchPM25DataFromBackend(validLat, validLon, selectedDay?.isoDate),
        fetchWeatherData(validLat, validLon, selectedDay?.isoDate),
        reverseGeocode(validLat, validLon),
      ]);
      
      // Extract data from settled promises with fallback values
      const pm25Data = results[0].status === 'fulfilled' ? results[0].value : null;
      const weatherData = results[1].status === 'fulfilled' ? results[1].value : { temp: 0, humidity: 0, windSpeed: 0, weatherCode: 0, precipitation: 0 };
      const locationData = results[2].status === 'fulfilled' ? results[2].value : { 
        name: 'Điểm được chọn', 
        address: `${validLat.toFixed(4)}, ${validLon.toFixed(4)}`, 
        district: '', 
        city: '' 
      };
      
      // Debug: Log fetched data
      console.log('📊 handleMapClick - Fetched data:', {
        pm25: pm25Data?.pm25,
        aqi: pm25Data?.aqi,
        temp: weatherData.temp,
        humidity: weatherData.humidity,
        precipitation: weatherData.precipitation,
        selectedDate: selectedDay?.isoDate || 'today',
        pointId: pointId
      });
      
      // Log any failures for debugging
      const apiNames = ['fetchPM25Data', 'fetchWeatherData', 'reverseGeocode'];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`⚠️ ${apiNames[index]} failed:`, result.reason?.message || result.reason);
        }
      });

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

      // Construct station-like object (KHÔNG lưu vị trí này vào location history)
      const pointData = {
        id: pointId, // Sử dụng pointId được truyền vào (mặc định 'custom-point')
        lat: validLat,
        lon: validLon, // Đổi từ lng sang lon để consistent với DetailStationScreen
        lng: validLon, // Giữ lng để backward compatible
        name: locationData.name,
        address: locationData.address,
        district: locationData.district,
        city: locationData.city,
        aqi: pm25Data?.aqi || null,
        pm25: pm25Data?.pm25 || null,
        status: pm25Data?.aqi ? getAQICategory(pm25Data.aqi) : 'Không có dữ liệu',
        color: pm25Data?.aqi ? getAQIColor(pm25Data.aqi) : '#9ca3af',
        temp: weatherData.temp,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        weatherCode: weatherData.weatherCode,
        precipitation: weatherData.precipitation,
        advice: getHealthAdvice(pm25Data?.aqi),
        category: pm25Data?.category || null,
      };

      console.log('📍 pointData created for popup:', {
        name: pointData.name,
        temp: pointData.temp,
        humidity: pointData.humidity,
        aqi: pointData.aqi
      });

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
        status: getAQICategory(aqi),
        color: getAQIColor(aqi),
        advice: getHealthAdvice(aqi),
      };
    });
    return map;
  }, [cemStations]);

  // Lấy thêm thông tin chi tiết (temp, humidity, advice, color, address...) giống AirGuardApp.jsx
  const selectedStationDetail = useMemo(() => {
    if (!selectedStation) return null;
    
    // If it's a custom point from map click or user GPS location, return as-is
    if (selectedStation.id === 'custom-point' || selectedStation.id === 'user-gps-location') {
      return selectedStation;
    }
    
    // Otherwise, merge data from stationDetailsById with weather data from selectedStation
    const detailed = stationDetailsById[selectedStation.id];
    if (detailed) {
      // Merge: Keep weather data from selectedStation (temp, humidity, windSpeed, precipitation)
      return {
        ...detailed,
        temp: selectedStation.temp !== undefined ? selectedStation.temp : detailed.temp,
        humidity: selectedStation.humidity !== undefined ? selectedStation.humidity : detailed.humidity,
        windSpeed: selectedStation.windSpeed !== undefined ? selectedStation.windSpeed : detailed.windSpeed,
        precipitation: selectedStation.precipitation !== undefined ? selectedStation.precipitation : detailed.precipitation,
        weatherCode: selectedStation.weatherCode !== undefined ? selectedStation.weatherCode : detailed.weatherCode,
      };
    }
    
    // Fallback: calculate status, color, advice if not in stationDetailsById
    const aqi = selectedStation.aqi || selectedStation.baseAqi || 0;
    return {
      ...selectedStation,
      status: getAQICategory(aqi),
      color: getAQIColor(aqi),
      advice: getHealthAdvice(aqi),
    };
  }, [selectedStation, stationDetailsById]);


  // Re-fetch PM2.5 data khi đổi ngày (nếu đang xem điểm tùy ý hoặc vị trí GPS)
  useEffect(() => {
    if (selectedStation?.id === 'custom-point' && lastClickedPoint) {
      // Re-fetch dữ liệu với ngày mới cho điểm tùy ý
      handleMapClick(lastClickedPoint.lat, lastClickedPoint.lon, 'custom-point');
    } else if (selectedStation?.id === 'user-gps-location' && selectedStation?.lat && selectedStation?.lon) {
      // Re-fetch dữ liệu với ngày mới cho vị trí GPS (giữ nguyên id)
      handleMapClick(selectedStation.lat, selectedStation.lon, 'user-gps-location');
    }
  }, [selectedDay]); // Đảm bảo dependencies đầy đủ

  const handleLocateMe = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập vị trí',
          'Ứng dụng cần quyền truy cập vị trí để hiển thị vị trí của bạn trên bản đồ.',
          [{ text: 'OK' }]
        );
        setLocating(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = pos.coords;
      
      // Validate GPS coordinates
      const validLat = parseFloat(latitude);
      const validLon = parseFloat(longitude);
      
      if (isNaN(validLat) || isNaN(validLon)) {
        console.warn('⚠️ Invalid GPS coordinates:', { latitude, longitude });
        Alert.alert('Lỗi', 'Tọa độ GPS không hợp lệ');
        setLocating(false);
        return;
      }
      
      if (validLat < -90 || validLat > 90 || validLon < -180 || validLon > 180) {
        console.warn('⚠️ GPS coordinates out of range:', { lat: validLat, lon: validLon });
        Alert.alert('Lỗi', 'Tọa độ GPS nằm ngoài phạm vi cho phép');
        setLocating(false);
        return;
      }
      
      // Di chuyển bản đồ đến vị trí GPS
      if (webviewRef.current) {
        const js = `
          window.__setExternalLocation && window.__setExternalLocation(${validLat}, ${validLon});
          true;
        `;
        webviewRef.current.injectJavaScript(js);
      }
      
      // Fetch dữ liệu PM2.5 và hiển thị popup cho vị trí GPS của user
      setLoadingPointData(true);
      
      // Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled([
        fetchPM25DataFromBackend(validLat, validLon, selectedDay?.isoDate),
        fetchWeatherData(validLat, validLon, selectedDay?.isoDate),
        reverseGeocode(validLat, validLon),
      ]);
      
      // Extract data from settled promises with fallback values
      const pm25Data = results[0].status === 'fulfilled' ? results[0].value : null;
      const weatherData = results[1].status === 'fulfilled' ? results[1].value : { temp: 0, humidity: 0, windSpeed: 0, weatherCode: 0, precipitation: 0 };
      const locationData = results[2].status === 'fulfilled' ? results[2].value : { 
        name: 'Vị trí của bạn', 
        address: `${validLat.toFixed(4)}, ${validLon.toFixed(4)}`, 
        district: '', 
        city: '' 
      };
      
      // Log any failures for debugging
      const apiNames = ['fetchPM25DataFromBackend', 'fetchWeatherData', 'reverseGeocode'];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`⚠️ GPS location ${apiNames[index]} failed:`, result.reason?.message || result.reason);
        }
      });
      
      // Construct user GPS location object
      const userGpsLocation = {
        id: 'user-gps-location', // ID đặc biệt để nhận diện vị trí GPS của user
        lat: validLat,
        lon: validLon,
        lng: validLon,
        name: locationData.name,
        address: locationData.address,
        district: locationData.district,
        city: locationData.city,
        aqi: pm25Data?.aqi || null,
        pm25: pm25Data?.pm25 || null,
        status: pm25Data?.aqi ? getAQICategory(pm25Data.aqi) : 'Không có dữ liệu',
        color: pm25Data?.aqi ? getAQIColor(pm25Data.aqi) : '#9ca3af',
        temp: weatherData.temp,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        weatherCode: weatherData.weatherCode,
        precipitation: weatherData.precipitation,
        advice: getHealthAdvice(pm25Data?.aqi),
        category: pm25Data?.category || null,
      };
      
      // Hiển thị popup thông tin vị trí GPS
      setSelectedStation(userGpsLocation);
      setLoadingPointData(false);
      
    } catch (e) {
      console.warn('GPS error', e);
      Alert.alert(
        'Lỗi GPS',
        'Không thể lấy vị trí hiện tại. Vui lòng kiểm tra GPS và thử lại.',
        [{ text: 'OK' }]
      );
      setLoadingPointData(false);
    } finally {
      setLocating(false);
    }
  };


  const handleSelectSearchResult = async (item) => {
    // Clear search UI completely
    clearSearch();

    // Center map tới địa điểm OSM
    if (webviewRef.current && item.lat && item.lng) {
      const js = `
        window.__setExternalLocation && window.__setExternalLocation(${item.lat}, ${item.lng});
        true;
      `;
      webviewRef.current.injectJavaScript(js);
    }

    // Fetch dữ liệu và hiển thị popup detail (giống như handleMapClick)
    await handleMapClick(item.lat, item.lng);
  };

  // Inject stations vào WebView sau khi cemStations được load và WebView ready
  useEffect(() => {
    console.log('🔍 Inject stations check:', {
      webviewReady,
      hasWebviewRef: !!webviewRef.current,
      cemStationsLength: cemStations.length
    });
    
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

  // Generate HTML with BASE_URL
  const leafletHTML = useMemo(() => generateLeafletHTML(BASE_URL), []);

  return (
    <View style={styles.container}>
      {/* WebView hiển thị Leaflet map (WebView thuần, giống bản đầu) */}
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: leafletHTML }}
        style={styles.webview}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        onLoad={() => {
          console.log('✅ WebView loaded, map ready');
          setWebviewReady(true);
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'station_click') {
              // Get full station data from cemStations by id
              const stationId = data.payload.id;
              const fullStation = cemStations.find(s => s.id === stationId);

              // Hide any external GPS/custom marker when a station is selected
              try {
                if (webviewRef.current) {
                  webviewRef.current.injectJavaScript("window.__clearExternalMarker && window.__clearExternalMarker(); true;");
                }
              } catch (e) {
                console.warn('inject clearExternalMarker failed', e);
              }

              if (fullStation) {
                // Use full data from CEM API directly - don't recalculate AQI
                // The AQI from cemStations is already correct from the API
                // But fetch weather data (temp, humidity, windSpeed, precipitation) from Open-Meteo
                const lon = fullStation.lon || fullStation.lng;
                fetchWeatherData(fullStation.lat, lon, selectedDay?.isoDate).then(weatherData => {
                  setSelectedStation({
                    ...fullStation,
                    temp: weatherData.temp,
                    humidity: weatherData.humidity,
                    windSpeed: weatherData.windSpeed,
                    precipitation: weatherData.precipitation,
                    weatherCode: weatherData.weatherCode,
                  });
                }).catch(err => {
                  console.error('Error fetching weather for station:', err);
                  // Still show station without weather data
                  setSelectedStation(fullStation);
                });
              } else {
                // Fallback to basic data from WebView
                setSelectedStation(data.payload);
              }
            } else if (data.type === 'map_click') {
              // Handle map click - fetch data from backend
              const { lat, lng } = data.payload;
              handleMapClick(lat, lng);
            } else if (data.type === 'console_log') {
              console.log('[WebView]', data.payload);
            } else if (data.type === 'console_error') {
              console.error('[WebView]', data.payload);
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
      {/* <View style={styles.zoomControls}>
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
      </View> */}

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
                  // setDayMenuOpen(true);
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
      <StationDetailSheet
        station={selectedStationDetail}
        loading={loadingPointData}
        selectedDay={selectedDay}
        onClose={() => {
          setSelectedStation(null);
          savedLocationRef.current = null; // Reset để có thể save lại location nếu quay lại
        }}
      />

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
    width: '50%',
    left: '24.5%',  
    right: '33.5%',
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
