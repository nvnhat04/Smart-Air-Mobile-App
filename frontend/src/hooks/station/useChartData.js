import { useMemo } from 'react';
import { getAQIColor } from '../../utils/stationUtils';

/**
 * Hook to calculate chart data from weekly forecast
 */
export default function useChartData(weekly, chartWidth) {
  const chartData = useMemo(() => {
    if (!weekly || weekly.length === 0) return { path: '', points: [], width: chartWidth };
    
    // Filter ra các ngày có data
    const validData = weekly.filter(w => w.aqi !== null && w.aqi !== undefined);
    
    if (validData.length === 0) return { path: '', points: [], width: chartWidth };
    
    const values = validData.map((w) => w.aqi);
    const dataMax = Math.max(...values);
    const dataMin = Math.min(...values);
    
    // Thêm padding 20% cho min/max để chart có không gian biến thiên rõ hơn
    const padding = (dataMax - dataMin) * 0.2 || 10;
    const max = dataMax + padding;
    const min = Math.max(0, dataMin - padding); // Không cho min < 0
    const range = max - min || 1;
    
    const w = chartWidth; // Sử dụng dynamic width
    const h = 120; // Tăng height lên để chart lớn hơn
    
    // Tính step dựa trên tổng số ngày (kể cả null)
    const step = weekly.length > 1 ? w / (weekly.length - 1) : w;

    // Build path và points array
    let pathSegments = [];
    let points = [];
    
    weekly.forEach((item, idx) => {
      if (item.aqi !== null && item.aqi !== undefined) {
        const x = idx * step;
        const norm = (item.aqi - min) / range;
        // Tăng margin top/bottom để có không gian rõ hơn
        const y = h - norm * (h - 24) - 12;
        
        // Lưu thông tin điểm
        points.push({
          x,
          y,
          aqi: item.aqi,
          date: item.date,
          label: item.label,
          temp: item.temp,
          humidity: item.humidity,
          precipitation: item.precipitation,
          pm25: item.pm25,
          idx,
          color: getAQIColor(item.aqi), // Thêm màu theo AQI
        });
        
        // Check nếu là điểm đầu tiên hoặc điểm trước đó là null
        const isFirstInSegment = idx === 0 || 
          (idx > 0 && (weekly[idx - 1].aqi === null || weekly[idx - 1].aqi === undefined));
        
        const command = isFirstInSegment ? 'M' : 'L';
        pathSegments.push(`${command} ${x} ${y}`);
      }
    });
    
    // Tạo labels cho trục Y
    // Sử dụng min/max đã có padding để labels phù hợp với vùng dữ liệu
    const yMax = Math.ceil(max / 10) * 10; // Làm tròn lên bội số 10
    const yMin = Math.floor(min / 10) * 10; // Làm tròn xuống bội số 10
    const yRange = yMax - yMin || 50;
    
    // Tính step cho labels - ít nhất 3 labels, nhiều nhất 5 labels
    let yStep;
    if (yRange <= 50) {
      yStep = 10;
    } else if (yRange <= 100) {
      yStep = 25;
    } else {
      yStep = 50;
    }
    
    const yLabels = [];
    for (let val = yMin; val <= yMax; val += yStep) {
      yLabels.push(val);
    }
    
    return {
      path: pathSegments.join(' '),
      points,
      yAxisLabels: yLabels,
      yMin,
      yMax,
      width: w,
      height: h,
    };
  }, [weekly, chartWidth]);

  return chartData;
}

