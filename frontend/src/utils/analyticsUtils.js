import api from '../services/api';
import { formatDate, formatDateSlash, getDateKey } from './aqiUtils';

/**
 * Process location history and forecast data
 * @param {Array} historyData - Array of location history records
 * @returns {Promise<Array>} Analytics data array
 */
export const processLocationHistory = async (historyData) => {
  const today = new Date();
  const analyticsData = [];
  
  // Group history by date
  const historyByDate = {};
  // Track location frequency and coordinates for forecast
  const locationFrequency = {};
  const locationCoords = {};
  
  // Process history data
  historyData.forEach((record) => {
    const recordDate = new Date(record.timestamp);
    const dateKey = getDateKey(recordDate);
    
    // Group by date (take first record of each day)
    if (!historyByDate[dateKey]) {
      historyByDate[dateKey] = record;
    }
    
    // Track location frequency
    const locationKey = record.address || record.name;
    locationFrequency[locationKey] = (locationFrequency[locationKey] || 0) + 1;
    if (!locationCoords[locationKey]) {
      locationCoords[locationKey] = { lat: record.latitude, lon: record.longitude };
    }
  });
  
  // Get most visited location for forecast
  const sortedLocations = Object.entries(locationFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([location]) => location);
  
  const mostVisitedLocation = sortedLocations[0] || null;
  const mostVisitedCoords = mostVisitedLocation ? locationCoords[mostVisitedLocation] : null;
  
  // Add past 7 days from history
  for (let i = -6; i < 0; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateKey = getDateKey(date);
    const dateStr = formatDate(date);
    
    const record = historyByDate[dateKey];
    if (record) {
      analyticsData.push({
        key: i.toString(),
        date: dateStr,
        aqi: record.aqi || 0,
        location: record.address || record.name || 'Unknown',
        type: 'past',
      });
    }
  }
  
  // Add today
  const todayStr = formatDate(today);
  const todayKey = getDateKey(today);
  const todayRecord = historyByDate[todayKey];
  
  if (todayRecord) {
    analyticsData.push({
      key: '0',
      date: todayStr,
      aqi: todayRecord.aqi || 0,
      location: todayRecord.address || todayRecord.name || 'Unknown',
      type: 'present',
    });
  }
  
  // Add forecast for next 6 days based on past locations
  // Logic: ngày -6 dự báo cho ngày +1, ngày -5 cho +2, ..., ngày -1 cho +6
  for (let i = 1; i <= 6; i++) {
    // Lấy vị trí của ngày đối xứng trong quá khứ (ngày -(7-i))
    const pastDayOffset = -(7 - i); // -6, -5, -4, -3, -2, -1
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() + pastDayOffset);
    const pastDateKey = getDateKey(pastDate);
    const pastDateStr = formatDateSlash(pastDate);
    
    const pastRecord = historyByDate[pastDateKey];
    
    if (pastRecord && pastRecord.latitude && pastRecord.longitude) {
      // Validate coordinates
      const lat = parseFloat(pastRecord.latitude);
      const lon = parseFloat(pastRecord.longitude);
      
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        console.warn(`[Forecast Day +${i}] Invalid coordinates: ${lat}, ${lon}`);
        continue;
      }
      
      try {
        // Gọi API forecast cho vị trí của ngày quá khứ đó
        const forecastData = await api.getPM25Forecast(lat, lon, 1);
        
        const forecastList = forecastData?.forecast || [];
        const dayForecast = forecastList[0]; // Lấy ngày đầu tiên
        
        if (dayForecast && dayForecast.aqi > 0) {
          const futureDate = new Date(today);
          futureDate.setDate(today.getDate() + i);
          const futureDateStr = formatDate(futureDate);
          
          const locationName = pastRecord.address || pastRecord.name || 'Unknown';
          const shortLocation = locationName.split(',').slice(-2).join(',').trim() || locationName;
          
          analyticsData.push({
            key: `+${i}`,
            date: futureDateStr,
            aqi: dayForecast.aqi,
            location: `Dự báo: ${shortLocation}`,
            type: 'future',
            note: `Bạn đã đến đây ngày ${pastDateStr}`,
          });
          
          console.log(`[Forecast Day +${i}] Using location from day ${pastDayOffset}: ${shortLocation}, AQI: ${dayForecast.aqi}`);
        }
      } catch (error) {
        console.warn(`[Forecast Day +${i}] API error (${lat}, ${lon}):`, error.message);
        // Continue with next day instead of stopping
      }
    } else {
      console.log(`[Forecast Day +${i}] No location data for past day ${pastDayOffset}`);
    }
  }
  
  return analyticsData;
};

/**
 * Filter history data by date range
 * @param {Array} historyData - Array of location history records
 * @param {string} filter - Filter type ('all', 'today', 'last3days', 'last7days')
 * @returns {Array} Filtered history data
 */
export const filterHistoryByDate = (historyData, filter) => {
  if (filter === 'all' || !historyData || historyData.length === 0) {
    return historyData;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return historyData.filter((record) => {
    const recordDate = new Date(record.timestamp);
    const recordDay = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
    const diffDays = Math.floor((today - recordDay) / (1000 * 60 * 60 * 24));

    switch (filter) {
      case 'today':
        return diffDays === 0;
      case 'last3days':
        return diffDays >= 0 && diffDays <= 2;
      case 'last7days':
        return diffDays >= 0 && diffDays <= 6;
      default:
        return true;
    }
  });
};

/**
 * Format history data for display in history tab
 * @param {Array} historyData - Array of location history records
 * @returns {Array} Formatted history items
 */
export const formatHistoryForDisplay = (historyData) => {
  return historyData.map((record, idx) => {
    const date = new Date(record.timestamp);
    return {
      key: idx.toString(),
      date: String(date.getDate()).padStart(2, '0'),
      month: `T${date.getMonth() + 1}`,
      time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
      location: record.address || record.name || 'Unknown',
      aqi: record.aqi || 0,
    };
  });
};
