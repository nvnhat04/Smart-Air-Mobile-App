import { useEffect, useState } from 'react';
import { BASE_URL } from '../../services/api';

/**
 * Hook to fetch and manage station forecast data
 */
export default function useStationDetail(station) {
  const [realtimeData, setRealtimeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecastData = async () => {
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
  }, [station?.lat, station?.lon]);

  return { realtimeData, loading };
}

