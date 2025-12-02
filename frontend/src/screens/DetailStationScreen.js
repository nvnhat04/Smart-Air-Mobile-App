import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

function generateWeeklyData(baseColor) {
  const daysShort = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const today = new Date();

  return Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() + idx);
    const dayOfWeek = d.getDay();
    const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1,
    ).padStart(2, '0')}`;

    const val = 20 + Math.floor(Math.random() * 130);

    return {
      label: daysShort[dayOfWeek],
      date: dateStr,
      temp: 27 + Math.floor(Math.random() * 6),
      aqi: val,
    };
  });
}

function getAQIBadgeColor(score) {
  if (score <= 50) return { bg: '#dcfce7', text: '#166534' };
  if (score <= 100) return { bg: '#fef9c3', text: '#854d0e' };
  if (score <= 150) return { bg: '#ffedd5', text: '#9a3412' };
  if (score <= 200) return { bg: '#fee2e2', text: '#b91c1c' };
  return { bg: '#ede9fe', text: '#5b21b6' };
}

export default function DetailStationScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const station = route.params?.station;

  const data = useMemo(() => {
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
        advice: {
          text: 'Theo dõi chất lượng không khí và hạn chế vận động mạnh ngoài trời.',
          action: 'Theo dõi thêm',
        },
      };
    }
    return {
      wind: station.wind ?? '5.0',
      pm25: station.pm25 ?? String((station.aqi || 80) * 0.6),
      humidity: station.humidity ?? 70,
      temp: station.temp ?? 28,
      advice: station.advice ?? {
        text: 'Theo dõi chất lượng không khí và hạn chế vận động mạnh ngoài trời.',
        action: 'Theo dõi thêm',
      },
      ...station,
    };
  }, [station]);

  const weekly = useMemo(() => generateWeeklyData(data.color || '#22c55e'), [data.color]);

  const now = useMemo(() => {
    const d = new Date();
    const date = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const displayDate = `${date}/${month}/${year}`;
    return {
      displayDate,
      displayLabel: `Hôm nay, ${displayDate}`,
    };
  }, []);

  const aqiBadge = getAQIBadgeColor(data.aqi || 80);

  const weeklyDateRange = useMemo(() => {
    if (!weekly || weekly.length === 0) return '';
    return `${weekly[0].date} - ${weekly[weekly.length - 1].date}`;
  }, [weekly]);

  const chartPath = useMemo(() => {
    if (!weekly || weekly.length === 0) return '';
    const values = weekly.map((w) => w.aqi);
    const max = Math.max(...values, 10);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const w = 260;
    const h = 70;
    const step = weekly.length > 1 ? w / (weekly.length - 1) : w;

    return weekly
      .map((item, idx) => {
        const x = idx * step;
        const norm = (item.aqi - min) / range;
        const y = h - norm * (h - 8) - 4;
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [weekly]);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header gradient */}
        <View
          style={[
            styles.header,
            { backgroundColor: data.color || '#22c55e' },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backIcon}>{'‹'}</Text>
          </TouchableOpacity>

          <View style={styles.headerTopRight}>
            <View style={styles.dateChip}>
              <Text style={styles.dateChipValue}>{now.displayLabel}</Text>
            </View>
          </View>

          <View style={styles.headerCenter}>
            <View style={styles.locationChip}>
              <Text style={styles.locationText}>
                {data.name || 'Trạm quan trắc'}
              </Text>
            </View>

            <View style={styles.aqiCircleWrapper}>
              <View style={styles.aqiCircleGlow} />
              <Text style={styles.aqiNumber}>{data.aqi ?? 0}</Text>
            </View>

            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{data.status || 'Trung bình'}</Text>
            </View>

            <View style={styles.pm25Card}>
              <Text style={styles.pm25Label}>PM2.5</Text>
              <Text style={styles.pm25Value}>{data.pm25.toFixed(2)} µg/m³</Text>
            </View>

            <View style={styles.adviceBubble}>
              <Text style={styles.adviceText}>💡 {data.advice?.text}</Text>
            </View>
          </View>
        </View>

        {/* Main info */}
        <View style={styles.mainSection}>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={[styles.metricIconBox, { backgroundColor: '#ffedd5' }]}>
                <Text style={styles.metricIcon}>🌡️</Text>
              </View>
              <Text style={styles.metricValue}>{data.temp}°</Text>
              <Text style={styles.metricLabel}>Nhiệt độ</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconBox, { backgroundColor: '#dbeafe' }]}>
                <Text style={styles.metricIcon}>💧</Text>
              </View>
              <Text style={styles.metricValue}>{data.humidity}%</Text>
              <Text style={styles.metricLabel}>Độ ẩm</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconBox, { backgroundColor: '#e5e7eb' }]}>
                <Text style={styles.metricIcon}>💨</Text>
              </View>
              <Text style={styles.metricValue}>{data.wind} km/h</Text>
              <Text style={styles.metricLabel}>Gió</Text>
            </View>
          </View>

          {/* Health advice */}
          <View style={styles.healthCard}>
            <View style={styles.healthHeader}>
              <View style={styles.healthIconBox}>
                <Text style={styles.healthIcon}>🛡️</Text>
              </View>
              <Text style={styles.healthTitle}>Khuyến cáo sức khỏe</Text>
            </View>

            <View style={styles.healthBody}>
              {/* Hàng 1: Hành động nên làm + pill hành động */}
              <View style={styles.healthRowBox}>
                <View style={styles.healthRowPrimary}>
                  <View style={styles.healthCheckIconBox}>
                    <Text style={styles.healthCheckIcon}>✓</Text>
                  </View>
                  <Text style={styles.healthPrimaryLabel}>Hành động nên làm</Text>
                  <View style={styles.healthActionPill}>
                    <Text style={styles.healthActionText}>
                      {data.advice?.action || 'Đeo khẩu trang'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Hàng 2: cảnh báo nhóm nhạy cảm */}
              <View style={[styles.healthRowBox, { marginTop: 8 }]}>
                <View style={styles.healthRowWarning}>
                  <View style={styles.healthWarningIconBox}>
                    <Text style={styles.healthWarningIcon}>!</Text>
                  </View>
                  <Text style={styles.healthText}>
                    Nhóm người nhạy cảm (người già, trẻ em) nên hạn chế ra ngoài vào thời điểm này.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Diễn biến 7 ngày tiếp theo – card 1: chỉ biểu đồ */}
          <View style={styles.weeklyCard}>
            <View style={styles.weeklyHeader}>
              <View style={styles.weeklyTitleRow}>
                <View style={styles.weeklyAccentBar} />
                <View>
                  <Text style={styles.weeklyTitle}>Diễn biến 7 ngày tiếp theo</Text>
                  {!!weeklyDateRange && (
                    <Text style={styles.weeklySubTitle}>{weeklyDateRange}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Biểu đồ đường AQI */}
            <View style={styles.weeklyChartWrapper}>
              <Svg width={260} height={70}>
                <Path
                  d={chartPath}
                  stroke={data.color || '#22c55e'}
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>

            {/* Nhãn ngày trục dưới */}
            <View style={styles.weeklyDatesRow}>
              {weekly.map((item) => (
                <Text key={item.date} style={styles.weeklyDateLabel}>
                  {item.date}
                </Text>
              ))}
            </View>
          </View>

          {/* Dự báo 7 ngày – card 2: thẻ dọc scroll ngang */}
          <View style={styles.forecastSection}>
            <View style={styles.forecastHeader}>
              <View style={styles.forecastHeaderLeft}>
                <View style={styles.forecastIconBox}>
                  <Text style={styles.forecastIcon}>📅</Text>
                </View>
                <View>
                  <Text style={styles.forecastTitle}>Dự báo 7 ngày</Text>
                  <Text style={styles.forecastSubtitle}>
                    Thời tiết &amp; chất lượng không khí
                  </Text>
                </View>
              </View>
              {!!weeklyDateRange && (
                <Text style={styles.forecastDateRange}>{weeklyDateRange}</Text>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.forecastScroll}
              contentContainerStyle={styles.forecastScrollContent}
            >
              {weekly.map((item) => {
                const badge = getAQIBadgeColor(item.aqi);
                return (
                  <View key={item.date} style={styles.forecastCard}>
                    <Text style={styles.forecastDay}>{item.label}</Text>
                    <Text style={styles.forecastDate}>{item.date}</Text>
                    <Text style={styles.forecastTemp}>{item.temp}°C</Text>
                    <View
                      style={[
                        styles.forecastAqiBadge,
                        { backgroundColor: badge.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.forecastAqiText,
                          { color: badge.text },
                        ]}
                      >
                        {item.aqi} AQI
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <Text style={styles.forecastHintText}>Kéo sang phải để xem thêm</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 32,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 14,
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#ffffff',
    fontSize: 40,
    marginTop: -4,
  },
  headerTopRight: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    right: 16,
  },
  dateChip: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateChipIcon: {
    fontSize: 12,
    color: '#ffffff',
    marginRight: 6,
  },
  dateChipValue: {
    fontSize: 11.5,
    color: '#ffffff',
    fontWeight: '700',
  },
  headerCenter: {
    marginTop: 40,
    alignItems: 'center',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  locationDot: {
    fontSize: 10,
    color: '#22c55e',
    marginRight: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#f9fafb',
    fontWeight: '600',
  },
  aqiCircleWrapper: {
    width: 140,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  aqiCircleGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
    opacity: 0.9,
  },
  aqiNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: '#ffffff',
  },
  statusPill: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  pm25Card: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  pm25Label: {
    fontSize: 11,
    color: '#ffffff',
    opacity: 0.9,
  },
  pm25Value: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  adviceBubble: {
    marginTop: 12,
    maxWidth: '90%',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  adviceText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '500',
  },
  mainSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricIcon: {
    fontSize: 18,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  healthCard: {
    borderRadius: 24,
    padding: 14,
    backgroundColor: '#ecfdf3',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 16,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  healthIconBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  healthIcon: {
    fontSize: 18,
    color: '#ffffff',
  },
  healthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14532d',
  },
  healthBody: {
    marginTop: 2,
  },
  healthRowBox: {
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  healthRowPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthCheckIconBox: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  healthCheckIcon: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  healthPrimaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
    flexShrink: 0,
  },
  healthActionPill: {
    marginLeft: 'auto',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  healthActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  healthRowWarning: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  healthWarningIconBox: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#fed7aa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  healthWarningIcon: {
    fontSize: 16,
    color: '#f97316',
    fontWeight: '700',
  },
  healthText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
  },
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
  weeklySubTitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  weeklyChartWrapper: {
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  weeklyDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 2,
  },
  weeklyDateLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },
  weeklyList: {
    marginTop: 4,
  },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  weeklyLeft: {
    flex: 1,
  },
  weeklyDay: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  weeklyDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  weeklyCenter: {
    width: 70,
    alignItems: 'center',
  },
  weeklyTemp: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  weeklyAqiBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  weeklyAqiText: {
    fontSize: 11,
    fontWeight: '700',
  },
  forecastSection: {
    marginTop: 12,
    borderRadius: 24,
    padding: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  forecastHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forecastIconBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  forecastIcon: {
    fontSize: 18,
    color: '#ffffff',
  },
  forecastTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  forecastSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  forecastDateRange: {
    fontSize: 11,
    color: '#9ca3af',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  forecastScroll: {
    marginTop: 4,
  },
  forecastScrollContent: {
    paddingVertical: 4,
  },
  forecastCard: {
    width: 96,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    alignItems: 'center',
  },
  forecastDay: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  forecastDate: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
  },
  forecastTemp: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  forecastAqiBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  forecastAqiText: {
    fontSize: 11,
    fontWeight: '700',
  },
  forecastHintText: {
    marginTop: 6,
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

