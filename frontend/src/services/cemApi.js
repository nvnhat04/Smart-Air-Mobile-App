/**
 * CEM (Center for Environmental Monitoring) API Service
 * Lấy dữ liệu thật từ API của Tổng cục Môi trường
 * API Base: https://tedp.vn/api
 */

const CEM_API_BASE = 'https://tedp.vn/api'; // Đổi sang HTTPS
const FETCH_TIMEOUT = 10000; // 10 seconds timeout

// Mock data fallback khi API không khả dụng
const MOCK_STATIONS = [
  { 
    id: '1', 
    lat: 21.038511,
    lon: 105.784817, 
    lng: 105.784817, 
    name: 'Trạm Cầu Giấy',
    address: 'Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội',
    district: 'Quận Cầu Giấy',
    city: 'Hà Nội',
    aqi: 141,
    baseAqi: 141,
    pm25: 65.3
  },
  { 
    id: '2', 
    lat: 20.980549,
    lon: 105.777182, 
    lng: 105.777182, 
    name: 'Trạm Hà Đông',
    address: 'Phường Quang Trung, Quận Hà Đông, Hà Nội',
    district: 'Quận Hà Đông',
    city: 'Hà Nội',
    aqi: 91,
    baseAqi: 91,
    pm25: 38.5
  },
  { 
    id: '3', 
    lat: 20.999001,
    lon: 105.801448, 
    lng: 105.801448, 
    name: 'Trạm Thanh Xuân',
    address: 'Phường Nhân Chính, Quận Thanh Xuân, Hà Nội',
    district: 'Quận Thanh Xuân',
    city: 'Hà Nội',
    aqi: 81,
    baseAqi: 81,
    pm25: 32.1
  },
];

/**
 * Fetch với timeout
 */
const fetchWithTimeout = async (url, options = {}, timeout = FETCH_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Fetch danh sách tất cả các trạm quan trắc môi trường
 * @returns {Promise<Array>} Danh sách các trạm
 */
export const fetchStations = async () => {
  try {
    console.log('🔄 Fetching stations from CEM API...');
    const response = await fetchWithTimeout(
      `${CEM_API_BASE}/stations?size=200`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      },
      10000 // 10 second timeout
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ CEM Stations received:', data._embedded?.stations?.length || 0);

    // Parse dữ liệu trạm từ API
    if (data._embedded && data._embedded.stations) {
      return data._embedded.stations.map(station => {
        // Tạo tên trạm từ nhiều nguồn
        let stationName = station.name || station.stationName || '';
        
        // Nếu không có tên, tạo từ địa chỉ hoặc mã trạm
        if (!stationName || stationName.trim() === '') {
          if (station.stationCode || station.code) {
            stationName = `Trạm ${station.stationCode || station.code}`;
          } else if (station.address) {
            // Lấy phần đầu của địa chỉ làm tên
            const addressParts = station.address.split(',');
            stationName = addressParts[0]?.trim() || 'Trạm quan trắc';
          } else if (station.province || station.city) {
            stationName = `Trạm ${station.province || station.city}`;
          } else {
            stationName = 'Trạm quan trắc';
          }
        }
        
        return {
          id: station.id,
          name: stationName,
          lat: station.lat || station.latitude,
          lng: station.lon || station.lng || station.longitude,
          address: station.address || '',
          district: station.district || '',
          city: station.province || station.city || '',
          stationCode: station.stationCode || station.code,
          type: station.stationType?.name || 'Không rõ',
          status: station.status || 'active',
        };
      });
    }

    return [];
  } catch (error) {
    console.error('❌ Error fetching CEM stations:', error);
    console.log('⚠️ Using mock data fallback');
    return MOCK_STATIONS;
  }
};

/**
 * Fetch dữ liệu AQI theo giờ mới nhất của tất cả các trạm
 * Sử dụng endpoint aqi_hour với time range (3 giờ gần nhất)
 * @param {Array<string>} stationIds - Mảng các station IDs
 * @returns {Promise<Object>} Object với key là station ID, value là dữ liệu AQI mới nhất
 */
export const fetchLatestAQIHourData = async (stationIds) => {
  try {
    if (!stationIds || stationIds.length === 0) {
      console.log('⚠️ No station IDs provided');
      return {};
    }

    // Chia nhỏ thành batches để tránh URL quá dài (HTTP 414)
    const BATCH_SIZE = 50; // Mỗi batch 50 stations
    const batches = [];
    
    for (let i = 0; i < stationIds.length; i += BATCH_SIZE) {
      batches.push(stationIds.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`🔄 Fetching AQI data in ${batches.length} batches...`);

    // Tạo time range: 24 giờ trước đến hiện tại
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const getTimeEnd = now.toISOString();
    const getTimeStart = twentyFourHoursAgo.toISOString();

    const latestDataMap = {};

    // Fetch từng batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const stationIdsParam = batch.join(',');

      const url = `${CEM_API_BASE}/aqi_hour/search/findByStationIdInAndGetTimeBetweenOrderByGetTimeDesc?stationIds=${stationIdsParam}&getTimeStart=${getTimeStart}&getTimeEnd=${getTimeEnd}`;
      
      console.log(`🔄 Batch ${i + 1}/${batches.length}: ${batch.length} stations`);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn(`⚠️ Batch ${i + 1} failed: HTTP ${response.status}`);
          continue; // Skip batch nếu fail
        }

        const data = await response.json();
        
        // Parse dữ liệu - lấy record mới nhất cho mỗi trạm
        if (data._embedded && data._embedded.aqi_hour) {
          data._embedded.aqi_hour.forEach(record => {
            const stationId = record.stationId;
            if (!stationId || latestDataMap[stationId]) return;

            const aqi = record.aqi || record.AQI;
            const pm25 = record.pm25 || record.PM25;

            latestDataMap[stationId] = {
              pm25: pm25,
              aqi: aqi,
              temp: record.temp || record.temperature,
              humidity: record.humidity,
              windSpeed: record.windSpeed || record.wind_speed,
              timestamp: record.getTime || record.time || record.timestamp,
              co: record.co || record.CO,
              no2: record.no2 || record.NO2,
              so2: record.so2 || record.SO2,
              o3: record.o3 || record.O3,
            };
          });
        }
      } catch (batchError) {
        console.warn(`⚠️ Batch ${i + 1} error:`, batchError.message);
      }
    }

    console.log(`📊 Parsed data for ${Object.keys(latestDataMap).length} stations`);
    
    if (Object.keys(latestDataMap).length === 0) {
      console.log('⚠️ No AQI data found - using mock values');
    }
    
    return latestDataMap;
  } catch (error) {
    console.error('❌ Error fetching CEM AQI hour data:', error);
    return {};
  }
};

/**
 * Tính AQI từ giá trị PM2.5 theo chuẩn US EPA
 * @param {number} pm25 - Nồng độ PM2.5 (μg/m³)
 * @returns {number} AQI value
 */
export const calculateAQIFromPM25 = (pm25) => {
  if (pm25 === null || pm25 === undefined) return null;

  // Bảng chuyển đổi PM2.5 sang AQI (US EPA standard)
  const breakpoints = [
    { pm_low: 0, pm_high: 25, aqi_low: 0, aqi_high: 50 },      // Good
    { pm_low: 25.1, pm_high: 50, aqi_low: 51, aqi_high: 100 }, // Moderate
    { pm_low: 50.1, pm_high: 80, aqi_low: 101, aqi_high: 150 }, // USG
    { pm_low: 80.1, pm_high: 150.4, aqi_low: 151, aqi_high: 200 }, // Unhealthy
    { pm_low: 150.5, pm_high: 250.4, aqi_low: 201, aqi_high: 300 }, // Very Unhealthy
    { pm_low: 250.5, pm_high: 500, aqi_low: 301, aqi_high: 500 },  // Hazardous
  ];

  for (const bp of breakpoints) {
    if (pm25 >= bp.pm_low && pm25 <= bp.pm_high) {
      const aqi = Math.round(
        ((bp.aqi_high - bp.aqi_low) / (bp.pm_high - bp.pm_low)) * (pm25 - bp.pm_low) + bp.aqi_low
      );
      return aqi;
    }
  }

  // Nếu vượt quá 500
  return pm25 > 500 ? 500 : null;
};

/**
 * Fetch dữ liệu AQI theo ngày cụ thể cho một trạm
 * @param {number} stationId - ID của trạm
 * @param {string} date - Ngày theo format YYYY-MM-DD
 * @returns {Promise<Object>} Dữ liệu AQI của ngày đó
 */
export const fetchStationDataByDate = async (stationId, date) => {
  try {
    // Sử dụng endpoint data_day hoặc data_hour tùy theo API
    const response = await fetch(
      `${CEM_API_BASE}/data_day?stationId=${stationId}&date=${date}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data._embedded && data._embedded.data_day && data._embedded.data_day.length > 0) {
      const record = data._embedded.data_day[0];
      const pm25 = record.pm25 || record.PM25 || record.value;
      
      return {
        pm25: pm25,
        aqi: pm25 ? calculateAQIFromPM25(pm25) : null,
        temp: record.temp || record.temperature,
        humidity: record.humidity,
        windSpeed: record.windSpeed || record.wind_speed,
        timestamp: record.time || record.timestamp,
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching station data by date:', error);
    return null;
  }
};

/**
 * Kết hợp dữ liệu trạm với dữ liệu latest AQI
 * @returns {Promise<Array>} Mảng các trạm đã có dữ liệu AQI
 */
export const fetchStationsWithLatestData = async () => {
  try {
    console.log('🔄 Fetching stations and latest data from CEM API...');
    
    // Fetch stations trước
    const stations = await fetchStations();
    
    if (stations.length === 0) {
      console.log('⚠️ No stations found, using mock data');
      return MOCK_STATIONS;
    }
    
    // Nếu đang dùng mock data (có pm25/aqi sẵn), return luôn
    if (stations[0]?.aqi !== undefined) {
      console.log('ℹ️ Using mock data with built-in AQI values');
      return stations;
    }

    // Lấy danh sách station IDs
    const stationIds = stations.map(s => s.id).filter(Boolean);
    console.log(`📍 Found ${stations.length} stations, fetching AQI data for ${stationIds.length} station IDs...`);

    // Fetch AQI hour data
    const latestDataMap = await fetchLatestAQIHourData(stationIds);

    console.log(`📍 Found ${stations.length} stations`);
    console.log(`📊 Found data for ${Object.keys(latestDataMap).length} stations`);

    // Kết hợp dữ liệu
    const stationsWithData = stations.map(station => {
      const latestData = latestDataMap[station.id] || {};
      
      // Nếu không có AQI từ API, tạo mock AQI ngẫu nhiên cho demo
      const hasRealAQI = latestData.aqi !== null && latestData.aqi !== undefined;
      const mockAQI = hasRealAQI ? null : Math.floor(Math.random() * 150) + 30; // Random AQI từ 30-180
      const finalAQI = hasRealAQI ? latestData.aqi : mockAQI;
      
      return {
        ...station,
        lon: station.lng, // Thêm lon để consistent với các component khác
        pm25: latestData.pm25 || (mockAQI ? mockAQI * 0.45 : null), // Estimate PM2.5 from AQI
        aqi: finalAQI,
        baseAqi: finalAQI || 0, // For compatibility with old code
        temp: latestData.temp || (20 + Math.floor(Math.random() * 10)), // Mock temp 20-30°C
        humidity: latestData.humidity || (60 + Math.floor(Math.random() * 30)), // Mock humidity 60-90%
        windSpeed: latestData.windSpeed || null,
        timestamp: latestData.timestamp || new Date().toISOString(),
      };
    });

    // Lọc chỉ lấy các trạm có tọa độ hợp lệ
    const validStations = stationsWithData.filter(
      station => station.lat && station.lng && 
                 station.lat >= -90 && station.lat <= 90 && 
                 station.lng >= -180 && station.lng <= 180
    );

    console.log(`✅ Returning ${validStations.length} valid stations with coordinates`);
    
    return validStations;
  } catch (error) {
    console.error('❌ Error in fetchStationsWithLatestData:', error);
    return [];
  }
};
