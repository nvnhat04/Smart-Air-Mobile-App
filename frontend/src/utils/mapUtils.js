/**
 * Create day options for forecast selector
 * @returns {Array} Array of day options with label, dateStr, and isoDate
 */
export const createDayOptions = () => {
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

/**
 * Get health advice based on AQI value and user group
 * Based on: Công văn 12/MT-SKHC/2024 - Bộ Y tế
 * @param {number} aqi - Air Quality Index value
 * @param {string} userGroup - 'normal' (người bình thường) or 'sensitive' (nhóm nhạy cảm)
 * @returns {Object} Health advice object with text and action
 */
export const getHealthAdvice = (aqi, userGroup = 'normal') => {
  // console.log('🏥 getHealthAdvice called with:', { aqi, userGroup });
  const isSensitive = userGroup === 'sensitive';
  // console.log('🏥 isSensitive:', isSensitive);
  
  // AQI 0-50: Tốt (Good)
  if (!aqi || aqi <= 50) {
    return {
      text: isSensitive 
        ? 'An toàn cho mọi hoạt động ngoài trời.'
        : 'Chất lượng không khí tốt.',
      action: 'Thoải mái ra ngoài',
      level: 'good',
      color: '#22c55e'
    };
  }
  
  // AQI 51-100: Trung bình (Moderate)
  if (aqi <= 100) {
    const result = {
      text: isSensitive
        ? 'Hạn chế hoạt động ngoài trời lâu. Theo dõi triệu chứng khó thở.'
        : 'Chất lượng không khí chấp nhận được.',
      action: isSensitive ? 'Hạn chế thời gian' : 'Bình thường',
      level: 'moderate',
      color: '#eab308'
    };
    // console.log('🏥 Returning for AQI 51-100:', result.text);
    return result;
  }
  
  // AQI 101-150: Kém (Unhealthy for Sensitive Groups)
  if (aqi <= 150) {
    return {
      text: isSensitive
        ? 'Tránh ra ngoài. Nếu cần thiết: đeo khẩu trang N95, hạn chế tối đa thời gian.'
        : 'Đeo khẩu trang khi ra ngoài. Đóng cửa sổ trong nhà.',
      action: 'Đeo khẩu trang',
      level: 'unhealthy_sensitive',
      color: '#f97316'
    };
  }
  
  // AQI 151-200: Xấu (Unhealthy)
  if (aqi <= 200) {
    return {
      text: isSensitive
        ? 'KHÔNG ra ngoài. Đóng kín cửa, bật máy lọc không khí. Gọi bác sĩ nếu khó thở.'
        : 'Ở trong nhà. Ra ngoài bắt buộc: đeo khẩu trang N95, hạn chế thời gian.',
      action: 'Ở trong nhà',
      level: 'unhealthy',
      color: '#ef4444'
    };
  }
  
  // AQI 201-300: Rất xấu (Very Unhealthy)
  if (aqi <= 300) {
    return {
      text: isSensitive
        ? 'TUYỆT ĐỐI không ra ngoài! Bật máy lọc không khí. Gọi cấp cứu nếu có triệu chứng.'
        : 'Hạn chế tối đa ra ngoài. Bắt buộc: khẩu trang N95, thời gian tối thiểu.',
      action: 'Máy lọc không khí',
      level: 'very_unhealthy',
      color: '#a855f7'
    };
  }
  
  // AQI 301+: Nguy hại (Hazardous)
  return {
    text: isSensitive
      ? '🚨 KHẨN CẤP! Ở trong nhà tuyệt đối. Máy lọc công suất cao. Gọi 115 nếu khó thở.'
      : '🚨 CẢNH BÁO NGHIÊM TRỌNG! Ở trong nhà, đóng kín cửa, bật máy lọc không khí.',
    action: '⚠️ Khẩn cấp',
    level: 'hazardous',
    color: '#7c2d12'
  };
};

/**
 * Search location using Nominatim API
 * @param {string} query - Search query
 * @param {string} endpoint - Nominatim endpoint URL
 * @returns {Promise<Array>} Array of search results
 */
export const searchLocation = async (query, endpoint) => {
  if (!query || query.trim().length < 2) {
    throw new Error('Vui lòng nhập ít nhất 2 ký tự');
  }

  const url = `${endpoint}?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=10&countrycodes=vn`;
  
  // Add timeout handling with AbortController (5 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SmartAir/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Lỗi tìm kiếm (${response.status})`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Không tìm thấy kết quả');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      throw new Error('Timeout: Không thể tìm kiếm trong 5 giây');
    }
    
    throw error;
  }
};

/**
 * Fetch PM2.5 data for a location from Open-Meteo API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} apiUrl - Open-Meteo API URL
 * @returns {Promise<Object>} PM2.5 data with AQI
 */
export const fetchPM25Data = async (lat, lon, apiUrl) => {
  const url = `${apiUrl}?latitude=${lat}&longitude=${lon}`;
  
  // Add timeout handling with AbortController (5 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Lỗi lấy dữ liệu PM2.5 (${response.status})`);
    }

    const data = await response.json();
    const pm25 = data?.current?.pm2_5;

    if (pm25 == null) {
      throw new Error('Không có dữ liệu PM2.5 tại vị trí này');
    }

    // Convert PM2.5 to AQI (simplified EPA formula for PM2.5)
    let aqi;
    if (pm25 <= 12) {
      aqi = Math.round((50 / 12) * pm25);
    } else if (pm25 <= 35.4) {
      aqi = Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
    } else if (pm25 <= 55.4) {
      aqi = Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
    } else if (pm25 <= 150.4) {
      aqi = Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
    } else if (pm25 <= 250.4) {
      aqi = Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
    } else {
      aqi = Math.round(((500 - 301) / (500 - 250.5)) * (pm25 - 250.5) + 301);
    }

    return {
      pm25: Math.round(pm25 * 10) / 10,
      aqi: Math.max(0, Math.min(500, aqi)),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      throw new Error('Timeout: API không phản hồi trong 5 giây');
    }
    
    throw error;
  }
};
