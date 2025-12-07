import api from '../services/api';
import { formatDate, formatDateSlash, getDateKey } from './aqiUtils';

// Cache for past data (không thay đổi)
let pastDataCache = null;
let pastDataCacheTimestamp = null;
const PAST_DATA_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Process location history and forecast data with caching
 * @param {Array} historyData - Array of location history records
 * @param {boolean} forceRefresh - Force refresh all data including cache
 * @returns {Promise<Array>} Analytics data array
 */
export const processLocationHistory = async (historyData, forceRefresh = false) => {
  const today = new Date();
  const analyticsData = [];
  
  // Check if we can use cached past data
  const cacheValid = pastDataCache && 
                     pastDataCacheTimestamp && 
                     (Date.now() - pastDataCacheTimestamp) < PAST_DATA_CACHE_DURATION &&
                     !forceRefresh;
  
  let pastData = [];
  let todayData = null;
  let historyByDate = {};
  
  if (cacheValid) {
    // Use cached past data
    console.log('[Analytics] Using cached past data');
    pastData = pastDataCache.pastData;
    historyByDate = pastDataCache.historyByDate;
  } else {
    // Process past data from scratch
    console.log('[Analytics] Processing past data from history');
    
    // Track location frequency and coordinates for forecast
    const locationFrequency = {};
    const locationCoords = {};
    
    // Process history data
    historyData.forEach((record) => {
      const recordDate = new Date(record.timestamp);
      const dateKey = getDateKey(recordDate);
      
      // Group by date (collect ALL records of each day for averaging)
      if (!historyByDate[dateKey]) {
        historyByDate[dateKey] = [];
      }
      historyByDate[dateKey].push(record);
      
      // Track location frequency
      const locationKey = record.address || record.name;
      locationFrequency[locationKey] = (locationFrequency[locationKey] || 0) + 1;
      if (!locationCoords[locationKey]) {
        locationCoords[locationKey] = { lat: record.latitude, lon: record.longitude };
      }
    });
    
    // Add past 6 days from history (calculate average AQI per day)
    for (let i = -6; i < 0; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateKey = getDateKey(date);
      const dateStr = formatDate(date);
      
      const dayRecords = historyByDate[dateKey];
      if (dayRecords && dayRecords.length > 0) {
        // Calculate average AQI for the day
        const totalAqi = dayRecords.reduce((sum, record) => sum + (record.aqi || 0), 0);
        const avgAqi = Math.round(totalAqi / dayRecords.length);
        
        // Get most frequent location for the day
        const dayLocationFreq = {};
        dayRecords.forEach(record => {
          const loc = record.address || record.name || 'Unknown';
          dayLocationFreq[loc] = (dayLocationFreq[loc] || 0) + 1;
        });
        const mostFrequentLocation = Object.entries(dayLocationFreq)
          .sort((a, b) => b[1] - a[1])[0][0];
        
        pastData.push({
          key: i.toString(),
          date: dateStr,
          aqi: avgAqi,
          location: mostFrequentLocation,
          type: 'past',
          recordCount: dayRecords.length, // Số bản ghi đã tính trung bình
        });
      }
    }
    
    // Cache the past data
    pastDataCache = { pastData, historyByDate };
    pastDataCacheTimestamp = Date.now();
    console.log('[Analytics] Cached past data:', pastData.length, 'days');
  }
  
  // Add cached/processed past data
  analyticsData.push(...pastData);
  
  // Always process today data (can change during the day)
  const todayStr = formatDate(today);
  const todayKey = getDateKey(today);
  const todayRecords = historyByDate[todayKey];
  
  if (todayRecords && todayRecords.length > 0) {
    const totalAqi = todayRecords.reduce((sum, record) => sum + (record.aqi || 0), 0);
    const avgAqi = Math.round(totalAqi / todayRecords.length);
    
    const dayLocationFreq = {};
    todayRecords.forEach(record => {
      const loc = record.address || record.name || 'Unknown';
      dayLocationFreq[loc] = (dayLocationFreq[loc] || 0) + 1;
    });
    const mostFrequentLocation = Object.entries(dayLocationFreq)
      .sort((a, b) => b[1] - a[1])[0][0];
    
    analyticsData.push({
      key: '0',
      date: todayStr,
      aqi: avgAqi,
      location: mostFrequentLocation,
      type: 'present',
      recordCount: todayRecords.length,
    });
  }
  
  // Always refresh forecast data (forecast changes)
  // Optimize: Fetch all forecasts in parallel instead of sequential
  console.log('[Analytics] Fetching fresh forecast data (parallel)');
  
  const forecastPromises = [];
  const forecastMeta = [];
  
  for (let i = 1; i <= 6; i++) {
    // Lấy vị trí của ngày đối xứng trong quá khứ (ngày -(7-i))
    const pastDayOffset = -(7 - i); // -6, -5, -4, -3, -2, -1
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() + pastDayOffset);
    const pastDateKey = getDateKey(pastDate);
    const pastDateStr = formatDateSlash(pastDate);
    
    const pastDayRecords = historyByDate[pastDateKey];
    
    if (pastDayRecords && pastDayRecords.length > 0) {
      const pastRecord = pastDayRecords[0];
      
      // Validate coordinates
      const lat = parseFloat(pastRecord.latitude);
      const lon = parseFloat(pastRecord.longitude);
      
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        console.warn(`[Forecast Day +${i}] Invalid coordinates: ${lat}, ${lon}`);
        continue;
      }
      
      // Store metadata for later processing
      forecastMeta.push({
        index: i,
        lat,
        lon,
        pastDayOffset,
        pastDateStr,
        pastRecord,
      });
      
      // Create promise for parallel execution
      forecastPromises.push(
        api.getPM25Forecast(lat, lon, 1)
          .then(data => ({ success: true, data, index: i }))
          .catch(error => ({ success: false, error: error.message, index: i }))
      );
    } else {
      console.log(`[Forecast Day +${i}] No location data for past day ${pastDayOffset}`);
    }
  }
  
  // Execute all forecasts in parallel
  if (forecastPromises.length > 0) {
    const results = await Promise.all(forecastPromises);
    
    // Process results
    results.forEach((result, idx) => {
      if (result.success) {
        const meta = forecastMeta[idx];
        const forecastList = result.data?.forecast || [];
        const dayForecast = forecastList[0];
        
        if (dayForecast && dayForecast.aqi > 0) {
          const futureDate = new Date(today);
          futureDate.setDate(today.getDate() + meta.index);
          const futureDateStr = formatDate(futureDate);
          
          const locationName = meta.pastRecord.address || meta.pastRecord.name || 'Unknown';
          const shortLocation = locationName.split(',').slice(-2).join(',').trim() || locationName;
          
          analyticsData.push({
            key: `+${meta.index}`,
            date: futureDateStr,
            aqi: dayForecast.aqi,
            location: `Dự báo: ${shortLocation}`,
            type: 'future',
            note: `Bạn đã đến đây ngày ${meta.pastDateStr}`,
          });
          
          console.log(`[Forecast Day +${meta.index}] ${shortLocation}, AQI: ${dayForecast.aqi}`);
        }
      } else {
        const meta = forecastMeta[idx];
        console.warn(`[Forecast Day +${result.index}] API error:`, result.error);
      }
    });
  }
  
  return analyticsData;
};

/**
 * Clear the past data cache (use when history data changes significantly)
 */
export const clearAnalyticsCache = () => {
  pastDataCache = null;
  pastDataCacheTimestamp = null;
  console.log('[Analytics] Cache cleared');
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
