import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { getAQIColor } from '../../utils/stationUtils';

export default function ForecastChart({ chartData, weekly, chartWidth, onChartWidthChange }) {
  const [selectedPoint, setSelectedPoint] = useState(null);

  if (!chartData || !chartData.points || chartData.points.length === 0) {
    return null;
  }

  return (
    <View style={styles.weeklyCard}>
      <View style={styles.weeklyHeader}>
        <View style={styles.weeklyTitleRow}>
          <View style={styles.weeklyAccentBar} />
          <View>
            <Text style={styles.weeklyTitle}>Diễn biến 7 ngày tiếp theo</Text>
          </View>
        </View>
      </View>

      {/* Biểu đồ đường AQI */}
      <View style={styles.weeklyChartContainer}>
        {/* Trục Y - Labels AQI */}
        <View style={[styles.yAxisLabels, { height: chartData.height || 120 }]}>
          {chartData.yAxisLabels && chartData.yAxisLabels.slice().reverse().map((label, idx) => {
            const totalLabels = chartData.yAxisLabels.length;
            const chartHeight = chartData.height || 120;
            const spacing = chartHeight / (totalLabels - 1 || 1);
            const topPos = idx * spacing;
            
            return (
              <Text
                key={label}
                style={[
                  styles.yAxisLabel,
                  { top: topPos - 6 }
                ]}
              >
                {label}
              </Text>
            );
          })}
        </View>
        
        {/* Chart area */}
        <View 
          style={styles.weeklyChartWrapper}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            if (width > 0 && width !== chartWidth) {
              onChartWidthChange(width);
            }
          }}
        >
          <Svg width={chartData.width || chartWidth} height={chartData.height || 120}>
            {/* Vẽ các zones màu AQI dựa trên trục Y */}
            {(() => {
              const h = chartData.height || 120;
              const w = chartData.width || chartWidth;
              const yMin = chartData.yMin || 0;
              const yMax = chartData.yMax || 300;
              const yRange = yMax - yMin || 1;
              
              // AQI zones theo chuẩn EPA
              const aqiZones = [
                { min: 0, max: 50, color: '#22c55e' },     // Xanh lá - Tốt
                { min: 50, max: 100, color: '#eab308' },   // Vàng - Trung bình
                { min: 100, max: 150, color: '#f97316' },  // Cam - Kém
                { min: 150, max: 200, color: '#ef4444' },  // Đỏ - Xấu
                { min: 200, max: 300, color: '#a855f7' },  // Tím - Rất xấu
                { min: 300, max: 500, color: '#7c2d12' },  // Nâu đỏ - Nguy hại
              ];
              
              return aqiZones.map((zone, idx) => {
                // Chỉ vẽ zone nếu nó nằm trong range hiển thị
                if (zone.max < yMin || zone.min > yMax) return null;
                
                // Tính vị trí y cho zone
                const zoneMin = Math.max(zone.min, yMin);
                const zoneMax = Math.min(zone.max, yMax);
                
                // Convert AQI value sang pixel position (y = 0 ở top, y = h ở bottom)
                // yMin ở bottom (y = h), yMax ở top (y = 0)
                const y1 = h - ((zoneMax - yMin) / yRange) * h; // Top của zone
                const y2 = h - ((zoneMin - yMin) / yRange) * h; // Bottom của zone
                const zoneHeight = y2 - y1;
                
                if (zoneHeight <= 0) return null;
                
                return (
                  <Rect
                    key={idx}
                    x="0"
                    y={y1}
                    width={w}
                    height={zoneHeight}
                    fill={zone.color}
                    opacity={0.75}
                  />
                );
              });
            })()}
            
            {/* Gridlines ngang */}
            {chartData.yAxisLabels && chartData.yAxisLabels.map((label, idx) => {
              const totalLabels = chartData.yAxisLabels.length;
              const chartHeight = chartData.height || 120;
              const spacing = chartHeight / (totalLabels - 1 || 1);
              const y = chartHeight - (idx * spacing);
              
              return (
                <Path
                  key={`grid-${label}`}
                  d={`M 0 ${y} L ${chartData.width || chartWidth} ${y}`}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                  strokeDasharray="4,4"
                  opacity={0.7}
                />
              );
            })}
            
            {/* Đường line AQI - màu đơn giản */}
            {chartData.points.map((point, idx) => {
              if (idx === 0) return null;
              const prevPoint = chartData.points[idx - 1];
              
              // Kiểm tra nếu có gap (ngày không có data giữa 2 điểm)
              if (point.idx - prevPoint.idx > 1) return null;
              
              return (
                <Path
                  key={`segment-${idx}`}
                  d={`M ${prevPoint.x} ${prevPoint.y} L ${point.x} ${point.y}`}
                  stroke="#2563eb"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}
            
            {/* Vẽ các điểm có thể chạm - màu theo AQI */}
            {chartData.points.map((point, idx) => {
              const isToday = point.idx === 0; // first point corresponds to today
              const isSelected = selectedPoint?.idx === point.idx;
              const radius = isToday ? (isSelected ? 9 : 7) : (isSelected ? 7 : 5);
              const fillColor = getAQIColor(point.aqi);
              const strokeColor = isToday ? '#632626ff' : '#ffffff';
              const strokeW = isToday ? 3 : 2;

              return (
                <Circle
                  key={idx}
                  cx={point.x}
                  cy={point.y}
                  r={radius}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeW}
                  onPress={() => setSelectedPoint(point)}
                />
              );
            })}
          </Svg>
        
          {/* Các nút invisible để dễ chạm hơn */}
          {chartData.points.map((point, idx) => (
            <TouchableOpacity
              key={`touch-${idx}`}
              style={[
                styles.chartPointTouch,
                {
                  left: point.x - 15,
                  top: point.y - 15,
                },
              ]}
              onPress={() => setSelectedPoint(point)}
              activeOpacity={0.7}
            />
          ))}
          
          {/* Tooltip hiển thị thông tin điểm được chọn */}
          {selectedPoint && (
            <View
              style={[
                styles.chartTooltip,
                {
                  left: Math.min(Math.max(selectedPoint.x - 60, 0), 140),
                  top: selectedPoint.y - 70,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.tooltipClose}
                onPress={() => setSelectedPoint(null)}
              >
                <Text style={styles.tooltipCloseText}>×</Text>
              </TouchableOpacity>
              <Text style={styles.tooltipDate}>
                {selectedPoint.label}, {selectedPoint.date}
              </Text>
              <View style={styles.tooltipAqiRow}>
                <Text style={styles.tooltipAqiLabel}>AQI:</Text>
                <Text style={styles.tooltipAqiValue}>{selectedPoint.aqi}</Text>
              </View>
              {selectedPoint.pm25 && (
                <Text style={styles.tooltipDetail}>
                  PM2.5: {selectedPoint.pm25.toFixed(1)} µg/m³
                </Text>
              )}
              {selectedPoint.temp && (
                <Text style={styles.tooltipDetail}>
                  🌡️ {Math.round(selectedPoint.temp)}°C
                </Text>
              )}
              {selectedPoint.humidity && (
                <Text style={styles.tooltipDetail}>
                  💧 {selectedPoint.humidity}%
                </Text>
              )}
              {selectedPoint.precipitation !== null && selectedPoint.precipitation !== undefined && (
                <Text style={styles.tooltipDetail}>
                  🌧️ {selectedPoint.precipitation} mm
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Nhãn ngày trục dưới */}
      <View style={[styles.weeklyDatesRow, { width: chartData.width || chartWidth }]}>
        {weekly.map((item, idx) => {
          const step = weekly.length > 1 ? (chartData.width || chartWidth) / (weekly.length - 1) : (chartData.width || chartWidth) / 2;
          const leftPosition = idx * step;
          
          return (
            <Text 
              key={item.date} 
              style={[
                styles.weeklyDateLabel,
                { 
                  position: 'absolute',
                  left: leftPosition,
                  transform: [{ translateX: -15 }] // Center text (approx half of text width)
                }
              ]}
            >
              {item.date}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  weeklyCard: {
    borderRadius: 24,
    padding: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  weeklyHeader: {
    marginBottom: 8,
  },
  weeklyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyAccentBar: {
    width: 3,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#8b5cf6',
    marginRight: 8,
  },
  weeklyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  weeklyChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 8,
  },
  yAxisLabels: {
    width: 35,
    position: 'relative',
    justifyContent: 'space-between',
    marginRight: 8,
  },
  yAxisLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '600',
    right: 0,
  },
  weeklyChartWrapper: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    flex: 1,
  },
  weeklyDatesRow: {
    position: 'relative',
    height: 20,
    marginLeft: 43, // Width of yAxisLabels (35) + marginRight (8)
    marginTop: 2,
  },
  weeklyDateLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },
  chartPointTouch: {
    position: 'absolute',
    width: 30,
    height: 30,
    zIndex: 10,
  },
  chartTooltip: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    zIndex: 20,
  },
  tooltipClose: {
    position: 'absolute',
    top: '0%',
    right: 4,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
  },
  tooltipCloseText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '700',
    lineHeight: 18,
  },
  tooltipDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '600',
  },
  tooltipAqiRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  tooltipAqiLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginRight: 6,
  },
  tooltipAqiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  tooltipDetail: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
});

