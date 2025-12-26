import { useMemo } from 'react';
import { getHealthAdvice } from '../../utils/mapUtils';

/**
 * Hook to merge station data with forecast and user preferences
 */
export default function useStationData(station, realtimeData, userGroup, selectedDay) {
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
    
    // Nếu không có selectedDay hoặc không tìm thấy, dùng latestData như cũ
    const latestData = dayData || realtimeData?.latest;
    const currentAqi = latestData?.aqi || station.aqi || 80;
    const healthAdvice = getHealthAdvice(currentAqi, userGroup);
    
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

  return data;
}

