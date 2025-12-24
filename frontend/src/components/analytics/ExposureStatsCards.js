import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ExposureStatsCards({
  statsPeriod,
  locationStats,
  exposureMultiplier,
  pastAvg,
  pastPm25Avg,
  cigPast,
  futureAvg,
  futurePm25Avg,
  cigFuture,
  futureMinAqi,
  futureMaxAqi,
  getDateRangePast,
  getDateRangeForecast,
}) {
  return (
    <View style={styles.exposureSection}>
      {/* Past card */}
      <View style={styles.exposureCardPast}>
        <Text style={styles.exposureTag}>
          {statsPeriod === 5 ? '5 NGÀY QUA' : statsPeriod === 3 ? '3 NGÀY QUA' : '7 NGÀY QUA'}
        </Text>
        <Text style={styles.exposureDays}>
          {getDateRangePast(statsPeriod)}
        </Text>
        <Text style={styles.exposureAqi}>{pastAvg}</Text>
        <Text style={styles.exposureAqiLabel}>AQI VN Trung bình</Text>
        {/* Min/Max AQI */}
        {locationStats && locationStats.min_aqi !== null && locationStats.max_aqi !== null && (
          <View style={styles.minMaxContainer}>
            <View style={styles.minMaxItem}>
              <Text style={styles.minMaxLabel}>Min</Text>
              <Text style={styles.minMaxValue}>{Math.round(locationStats.min_aqi * exposureMultiplier)}</Text>
            </View>
            <Text style={styles.minMaxSeparator}>•</Text>
            <View style={styles.minMaxItem}>
              <Text style={styles.minMaxLabel}>Max</Text>
              <Text style={styles.minMaxValue}>{Math.round(locationStats.max_aqi * exposureMultiplier)}</Text>
            </View>
          </View>
        )}
        <View style={styles.exposureDivider} />
        <Text style={styles.exposurePm25Unit}> PM2.5 trung bình</Text>
        <Text style={styles.exposurePm25}>
          {pastPm25Avg}
          <Text style={styles.exposurePm25Unit}> µg/m³</Text>
        </Text>
        <Text style={styles.exposureText}>Tổng phơi nhiễm tuần trước</Text>
        <Text style={styles.exposureCig}>
          ≈ hút <Text style={styles.exposureCigValue}>{cigPast}</Text> điếu thuốc
        </Text>
      </View>

      {/* Future card */}
      <View style={styles.exposureCardFuture}>
        <Text style={[styles.exposureTag, { color: '#2563eb' }]}>
          {statsPeriod === 1 ? 'HÔM NAY' : statsPeriod === 3 ? '3 NGÀY TỚI' : '7 NGÀY TỚI'}
        </Text>
        <Text style={styles.exposureDays}>
          {getDateRangeForecast(statsPeriod)}
        </Text>
        <Text style={[styles.exposureAqi, { color: '#2563eb' }]}>{futureAvg}</Text>
        <Text style={styles.exposureAqiLabel}>AQI VN trung bình</Text>
        {/* Min/Max AQI tuần tới */}
        {futureMinAqi !== null && futureMaxAqi !== null && (
          <View style={styles.minMaxContainer}>
            <View style={styles.minMaxItem}>
              <Text style={styles.minMaxLabel}>Min</Text>
              <Text style={styles.minMaxValue}>{Math.round(futureMinAqi * exposureMultiplier)}</Text>
            </View>
            <Text style={styles.minMaxSeparator}>•</Text>
            <View style={styles.minMaxItem}>
              <Text style={styles.minMaxLabel}>Max</Text>
              <Text style={styles.minMaxValue}>{Math.round(futureMaxAqi * exposureMultiplier)}</Text>
            </View>
          </View>
        )}
        <View style={styles.exposureDividerFuture} />
        <Text style={styles.exposurePm25Unit}> PM2.5 trung bình</Text>
        <Text style={[styles.exposurePm25, { color: '#2563eb' }]}>
          {futurePm25Avg}
          <Text style={styles.exposurePm25Unit}> µg/m³</Text>
        </Text>
        <Text style={styles.exposureText}>Tổng phơi nhiễm tuần tới</Text>
        <Text style={styles.exposureCig}>
          ≈ hút <Text style={styles.exposureCigValue}>{cigFuture}</Text> điếu thuốc
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  exposureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exposureCardPast: {
    flex: 1,
    marginRight: 6,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  exposureCardFuture: {
    flex: 1,
    marginLeft: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#93c5fd',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  exposureTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4b5563',
    marginBottom: 4,
  },
  exposureDays: {
    fontSize: 8,
    fontWeight: '700',
    color: '#8b8d90ff',
    marginBottom: 4,
  },
  exposureAqi: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
  },
  exposureAqiLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  minMaxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  minMaxItem: {
    alignItems: 'center',
  },
  minMaxLabel: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  minMaxValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginTop: 2,
  },
  minMaxSeparator: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 12,
  },
  exposureDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    marginVertical: 6,
  },
  exposureDividerFuture: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#bfdbfe',
    marginVertical: 6,
  },
  exposurePm25: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  exposurePm25Unit: {
    fontSize: 11,
    fontWeight: '400',
    color: '#6b7280',
    textAlign: 'center',
  },
  exposureText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  exposureCig: {
    marginTop: 4,
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  exposureCigValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#f22602ff',
  },
});

