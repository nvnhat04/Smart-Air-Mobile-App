import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { fetchStationsWithLatestData } from '../../services/cemApi';
import { getAQICategory, getAQIColor, getHealthAdvice } from '../../utils';

/**
 * Quản lý tải danh sách trạm CEM và build map stationDetailsById
 * - Giữ nguyên thông điệp lỗi, flow như MapScreen cũ
 */
export default function useMapStations() {
  const [cemStations, setCemStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);

  useEffect(() => {
    const loadStations = async () => {
      try {
        setLoadingStations(true);
        console.log('🔄 Loading stations from CEM API...');
        const stations = await fetchStationsWithLatestData();
        console.log(`✅ Loaded ${stations.length} stations from CEM`);

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

        setCemStations(stations);
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
  }, []);

  const stationDetailsById = useMemo(() => {
    const map = {};
    cemStations.forEach((station) => {
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

  return {
    cemStations,
    loadingStations,
    stationDetailsById,
  };
}


