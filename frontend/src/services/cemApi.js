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
 * Parse lastFileContent để lấy giá trị PM2.5, nhiệt độ, độ ẩm, etc.
 * Format: "PM-2.5\t75.42\tug/m3\t20251205152000\t00\r\n"
 * @param {string} content - Nội dung text từ lastFileContent
 * @returns {Object} Object chứa các giá trị đo được
 */
const parseLastFileContent = (content) => {
  if (!content || typeof content !== 'string') {
    return {};
  }

  const result = {};
  const lines = content.split('\r\n').filter(line => line.trim());

  lines.forEach(line => {
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parseFloat(parts[1]);

      if (!isNaN(value)) {
        switch (key) {
          case 'PM-2.5':
          case 'PM2.5':
            result.pm25 = value;
            break;
          case 'PM-10':
          case 'PM10':
            result.pm10 = value;
            break;
          case 'PM-1':
          case 'PM1':
            result.pm1 = value;
            break;
          case 'Temp':
            result.temp = value;
            break;
          case 'RH':
            result.humidity = value;
            break;
          case 'WinSpd':
            result.windSpeed = value;
            break;
          case 'WinDir':
            result.windDirection = value;
            break;
          case 'CO':
            result.co = value;
            break;
          case 'NO2':
            result.no2 = value;
            break;
          case 'SO2':
            result.so2 = value;
            break;
          case 'O3':
            result.o3 = value;
            break;
          case 'NO':
            result.no = value;
            break;
          case 'NOx':
            result.nox = value;
            break;
        }
      }
    }
  });

  return result;
};

/**
 * Fetch danh sách tất cả các trạm quan trắc môi trường
 * Sử dụng endpoint mới: findByIsPublicAndStationTypeAndNullableProvinceId
 * stationType=4: Trạm quan trắc không khí
 * @returns {Promise<Array>} Danh sách các trạm
 */
export const fetchStations = async () => {
  try {
    console.log('🔄 Fetching stations from CEM API (NEW endpoint)...');
    
    // Thử API mới trước
    let response;
    let data;
    let useNewApi = true;
    
    try {
      response = await fetchWithTimeout(
        'https://envisoft.gov.vn/eos/services/call/json/get_stations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            is_qi: true,
            is_public: true,
            qi_type: 'aqi',
          }),
        },
        10000 // 10 second timeout
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      data = await response.json();
      console.log('✅ NEW API Response received!');
      
    } catch (newApiError) {
      console.warn('⚠️ NEW API failed:', newApiError.message);
      console.log('🔄 Trying OLD API endpoint...');
      useNewApi = false;
      
      // Fallback về API cũ
      response = await fetchWithTimeout(
        `${CEM_API_BASE}/stations/search/findByIsPublicAndStationTypeAndNullableProvinceId?stationType=4&isPublic=true`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        },
        10000
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      data = await response.json();
      console.log('✅ OLD API Response received!');
    }
    
    // Debug: Log response structure
    console.log('📦 CEM API Response keys:', Object.keys(data));
    console.log('📦 Using API:', useNewApi ? 'NEW' : 'OLD');
    
    // Parse dữ liệu trạm từ API
    let stationsArray = null;
    
    // Thử parse với format mới (data.stations)
    if (data.stations && Array.isArray(data.stations)) {
      console.log('✅ Found stations in data.stations, count:', data.stations.length);
      stationsArray = data.stations;
    }
    // Thử parse với format cũ (data._embedded.stations)
    else if (data._embedded && data._embedded.stations && Array.isArray(data._embedded.stations)) {
      console.log('✅ Found stations in data._embedded.stations, count:', data._embedded.stations.length);
      stationsArray = data._embedded.stations;
    }
    
    if (stationsArray) {
      const mappedStations = stationsArray.map(station => {
        // Tạo tên trạm - support cả format mới và cũ
        let stationName = station.station_name || station.stationName || station.name || '';
        
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
        
        // Lấy tọa độ - support cả format mới và cũ
        const lat = station.latitude || station.lat;
        const lng = station.longitude || station.lon || station.lng;
        
        // Lấy AQI/QI - format mới dùng "qi", format cũ dùng AQI tính từ PM2.5
        let aqi = station.qi || station.aqi || station.AQI;
        
        // Parse lastFileContent nếu có (format cũ)
        const parsedData = station.lastFileContent 
          ? parseLastFileContent(station.lastFileContent) 
          : {};

        // Nếu không có AQI từ API mới, tính từ PM2.5
        if (!aqi && parsedData.pm25) {
          aqi = calculateAQIFromPM25(parsedData.pm25);
        }
        
        // PM2.5 từ lastFileContent hoặc tính ngược từ qi
        const pm25 = parsedData.pm25 || (aqi ? aqi * 0.6 : null);

        return {
          id: station.id,
          name: stationName,
          lat: lat,
          lng: lng,
          lon: lng, // Thêm lon cho consistency
          address: station.address || '',
          district: station.district || '',
          city: station.province || station.city || '',
          stationCode: station.stationCode || station.code || station.station_code,
          type: station.stationType?.name || 'Trạm quan trắc không khí',
          status: station.station_status || station.status || 'active',
          // Dữ liệu thời gian thực
          pm25: pm25,
          pm10: parsedData.pm10,
          aqi: Math.round(aqi || 0),
          baseAqi: Math.round(aqi || 0),
          temp: parsedData.temp || null,
          humidity: parsedData.humidity || null,
          windSpeed: parsedData.windSpeed || null,
          windDirection: parsedData.windDirection || null,
          co: parsedData.co,
          no2: parsedData.no2,
          so2: parsedData.so2,
          o3: parsedData.o3,
          color: station.color || '#22c55e',
          timestamp: station.qi_time || new Date().toISOString(),
        };
      });
      
      // Log first station
      if (mappedStations.length > 0) {
        console.log('📊 First mapped station:', {
          id: mappedStations[0].id,
          name: mappedStations[0].name,
          lat: mappedStations[0].lat,
          lng: mappedStations[0].lng,
          aqi: mappedStations[0].aqi,
          pm25: mappedStations[0].pm25,
        });
      }
      
      return mappedStations;
    }

    console.log('⚠️ No stations array found in response');
    return [];
  } catch (error) {
    console.error('❌ Error fetching CEM stations:', error);
    console.log('⚠️ Using mock data fallback');
    return MOCK_STATIONS;
  }
};

/**
 * Fetch chi tiết dữ liệu của một trạm cụ thể
 * @param {string|number} stationId - ID của trạm cần lấy chi tiết
 * @returns {Promise<Object>} Chi tiết dữ liệu trạm
 */
export const fetchStationDetails = async (stationId) => {
  try {
    console.log(`🔄 Fetching details for station ${stationId}...`);
    const response = await fetchWithTimeout(
      'https://envisoft.gov.vn/eos/services/call/json/qi_detail',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Origin': 'https://cem.gov.vn',
          'Referer': 'https://cem.gov.vn/',
        },
        body: new URLSearchParams({
          station_id: stationId,
        }),
      },
      10000 // 10 second timeout
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Station details received for ${stationId}`);

    // Return dữ liệu từ response.res
    return data.res || null;
  } catch (error) {
    console.error(`❌ Error fetching station details for ${stationId}:`, error);
    return null;
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
 * Fetch dữ liệu 7 ngày tiếp theo cho một trạm cụ thể
 * @param {string} stationId - ID của trạm
 * @returns {Promise<Array>} Mảng dữ liệu 7 ngày
 */
export const fetchStation7DayForecast = async (stationId) => {
  try {
    console.log(`🔄 Fetching 7-day data for station ${stationId}...`);
    
    // Tạo mảng 7 ngày từ hôm nay
    const today = new Date();
    const dates = [];
    const daysShort = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayOfWeek = date.getDay();
      const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      const isoDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      dates.push({
        date: dateStr,
        label: daysShort[dayOfWeek],
        isoDate,
        dateKey: isoDate.replace(/-/g, ''),
      });
    }
    
    // Fetch dữ liệu cho từng ngày (parallel)
    const dataPromises = dates.map(async (dateInfo) => {
      try {
        const result = await fetchStationDataByDate(stationId, dateInfo.isoDate);
        return {
          ...dateInfo,
          aqi: result?.aqi || null,
          pm25: result?.pm25 || null,
          temp: result?.temp || null,
          humidity: result?.humidity || null,
          wind_speed: result?.windSpeed || null,
          hasData: result !== null,
        };
      } catch (error) {
        console.warn(`⚠️ Failed to fetch data for ${dateInfo.isoDate}:`, error);
        return {
          ...dateInfo,
          aqi: null,
          pm25: null,
          temp: null,
          humidity: null,
          wind_speed: null,
          hasData: false,
        };
      }
    });
    
    const results = await Promise.all(dataPromises);
    
    const daysWithData = results.filter(r => r.hasData).length;
    console.log(`✅ Station ${stationId}: ${daysWithData}/7 days have data`);
    
    return results;
  } catch (error) {
    console.error('❌ Error fetching station 7-day data:', error);
    return [];
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
    
    console.log(`📍 Found ${stations.length} stations from API`);

    // Stations đã có dữ liệu PM2.5 và AQI từ lastFileContent, chỉ cần thêm lon field
    const stationsWithData = stations.map(station => ({
      ...station,
      lon: station.lng, // Thêm lon để consistent với các component khác
    }));

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