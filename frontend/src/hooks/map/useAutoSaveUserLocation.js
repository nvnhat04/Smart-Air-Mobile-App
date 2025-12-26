import { useEffect, useRef } from 'react';

/**
 * Tự động lưu lịch sử vị trí GPS của user khi mở bottom sheet
 * - Chỉ lưu với điểm có id === 'user-gps-location'
 * - Tránh lưu trùng bằng cách nhớ lại lat/lng đã lưu lần gần nhất
 * - Delay 2s để đảm bảo user thực sự xem chi tiết trước khi ghi log
 */
export default function useAutoSaveUserLocation(selectedStation, saveCurrentLocation) {
  const savedLocationRef = useRef(null);

  useEffect(() => {
    // Chỉ lưu nếu là vị trí GPS thực của user
    if (
      selectedStation &&
      selectedStation.id === 'user-gps-location' &&
      selectedStation.lat &&
      selectedStation.lng
    ) {
      const locationKey = `${selectedStation.lat},${selectedStation.lng}`;

      // Tránh lưu trùng nhiều lần cho cùng một tọa độ
      if (savedLocationRef.current === locationKey) {
        console.log('[useAutoSaveUserLocation] ⏭️ Location already saved, skipping duplicate save');
        return;
      }

      const saveUserLocation = async () => {
        try {
          console.log(
            '[useAutoSaveUserLocation] 📍 Attempting to save user GPS location:',
            selectedStation.name
          );

          const result = await saveCurrentLocation({
            aqi: selectedStation.aqi || selectedStation.baseAqi,
            pm25: selectedStation.pm25,
            address: selectedStation.address || selectedStation.name || 'Vị trí của bạn',
          });

          if (result?.skipped) {
            console.log(
              `[useAutoSaveUserLocation] ⚠️ Location save skipped (${result.reason}): too soon or too close to last saved location`
            );
          } else if (result) {
            console.log('[useAutoSaveUserLocation] ✅ User GPS location saved successfully');
            savedLocationRef.current = locationKey;
          }
        } catch (error) {
          console.warn('[useAutoSaveUserLocation] ❌ Failed to save user GPS location:', error);
        }
      };

      // Delay một chút để user thực sự xem detail
      const timer = setTimeout(saveUserLocation, 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedStation, saveCurrentLocation]);

  return { savedLocationRef };
}


