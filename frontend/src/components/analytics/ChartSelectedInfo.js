import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAQIColor } from '../../utils';

export default function ChartSelectedInfo({
  selectedData,
  exposureMultiplier,
  dayStats,
  topLocationsByDay,
  onViewDetails,
  setActiveTab,
  setDateFilter,
}) {
  return (
    <View style={styles.selectedInfoCard}>
      <View style={{ flex: 1 }}>
        <View style={styles.selectedTagRow}>
          <View style={styles.selectedTag}>
            <Text style={styles.selectedTagText}>
              {selectedData.type === 'past'
                ? '📊 Lịch sử'
                : selectedData.type === 'present'
                ? '📍 Hôm nay'
                : '🔮 Dự báo'}
            </Text>
          </View>
          <Text style={styles.selectedDate}>{selectedData.date}</Text>
        </View>
        {selectedData.type !== 'past' && (
          <Text style={styles.selectedLocation}>{selectedData.location}</Text>
        )}
        {!!selectedData.note && (
          <Text style={styles.selectedNote}>💡 {selectedData.note}</Text>
        )}

        {/* Top location chỉ cho ngày đang chọn nếu là quá khứ */}
        {selectedData.type === 'past' && (() => {
          // Kiểm tra dayStats.most_visited_location có hợp lệ không
          const mostVisited = dayStats?.most_visited_location;
          const hasValidDayStats = mostVisited && 
            typeof mostVisited === 'object' && 
            !Array.isArray(mostVisited) &&
            mostVisited !== null &&
            Object.keys(mostVisited).length > 0;

          if (hasValidDayStats) {
            // Hiển thị từ dayStats.most_visited_location
            const entries = Object.entries(mostVisited)
              .filter(([addr, count]) => addr && typeof count === 'number' && count > 0)
              .sort((a, b) => b[1] - a[1]) // Sort by count descending
              .slice(0, 5); // Limit to top 5

            if (entries.length > 0) {
              return (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>Địa điểm thường đến</Text>
                  {entries.map(([addr, count]) => (
                    <View
                      key={addr}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginVertical: 2,
                      }}
                    >
                      <Text
                        style={{ color: '#334155', fontSize: 13, flex: 1, marginRight: 8 }}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {addr}
                      </Text>
                      <Text style={{ color: '#64748b', fontSize: 13, flexShrink: 0, textAlign: 'right' }}>
                        {count} lần
                      </Text>
                    </View>
                  ))}
                </View>
              );
            }
          }

          return null;
        })()}
        {/* Details button to open History tab for the selected past day */}
        {(selectedData.type === 'past' || selectedData.type === 'present') && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              // Tìm dateKey từ selectedData.date
              let dateKey = null;
              if (selectedData.date) {
                if (selectedData.type === 'present') {
                  // Nếu là hôm nay, dùng 'today'
                  dateKey = 'today';
                } else if (selectedData.type === 'past') {
                  // Tìm dateKey từ topLocationsByDay dựa trên selectedData.date (format 'dd-mm' hoặc 'dd/mm')
                  if (topLocationsByDay && Object.keys(topLocationsByDay).length > 0) {
                    const [selDay, selMonth] = selectedData.date.split(/[-\/]/);
                    dateKey = Object.keys(topLocationsByDay).find(key => {
                      const [year, month, day] = key.split('-');
                      return day === selDay && month === selMonth;
                    });
                  }
                }
              }
              
              // Set dateFilter trước khi chuyển tab
              if (dateKey) {
                setDateFilter(dateKey);
              } else if (selectedData.type === 'present') {
                setDateFilter('today');
              } else {
                setDateFilter('all');
              }
              
              // Chuyển sang tab history
              setActiveTab('history');
            }}
            style={{
              marginTop: 10,
              backgroundColor: '#eef2ff',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              alignSelf: 'flex-start',
            }}
          >
            <Text style={{ color: '#2563eb', fontWeight: '700' }}>Xem chi tiết</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.selectedAqiBox}>
        {selectedData.type === 'past' ? (() => {
          // Use the day-average AQI if available (from analyticsData or dayStats)
          const rawAqi = (selectedData && selectedData.aqi != null)
            ? selectedData.aqi
            : (dayStats && dayStats.avg_aqi != null ? dayStats.avg_aqi : null);

          if (rawAqi == null) {
            return (
              <>
                <Text style={styles.selectedAqiValue}>--</Text>
                <Text style={styles.selectedAqiLabel}>AQI VN TB</Text>
              </>
            );
          }

          const avgAqi = Math.round(rawAqi * exposureMultiplier);
          return (
            <>
              <Text style={[styles.selectedAqiValue, { color: getAQIColor(avgAqi) }]}>{avgAqi}</Text>
              <Text style={styles.selectedAqiLabel}>AQI VN TB</Text>
            </>
          );
        })() : (
          <>
            <Text
              style={[
                styles.selectedAqiValue,
                { color: getAQIColor(selectedData.aqi * exposureMultiplier) },
              ]}
            >
              {Math.round(selectedData.aqi * exposureMultiplier)}
            </Text>
            <Text style={styles.selectedAqiLabel}>AQI VN dự báo</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  selectedInfoCard: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  selectedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
  },
  selectedDate: {
    fontSize: 10,
    color: '#6b7280',
    marginLeft: 6,
  },
  selectedLocation: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
    marginTop: 2,
  },
  selectedNote: {
    marginTop: 4,
    fontSize: 10,
    color: '#1d4ed8',
  },
  selectedAqiBox: {
    marginLeft: 10,
    alignItems: 'flex-end',
  },
  selectedAqiValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  selectedAqiLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
});

