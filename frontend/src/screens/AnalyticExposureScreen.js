import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Feather } from '@expo/vector-icons';

const generateAnalyticsData = () => {
  const locations = [
    'Phường Yên Thường, Quận Gia Lâm',
    'Xã Xuân Quan, Huyện Văn Giang',
    'Phường Nhân Chính, Quận Thanh Xuân',
    'Phường Suối Hoa, TP. Bắc Ninh',
    'Phường Quang Trung, Quận Hà Đông',
    'Phường Tân Dân, TP. Việt Trì',
    'Phường Sao Đỏ, TP. Chí Linh',
    'Phường Dịch Vọng, Quận Cầu Giấy',
  ];

  const today = new Date();
  const analyticsData = [];

  for (let i = -7; i < 0; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = `${String(date.getDate()).padStart(2, '0')}-${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}`;
    const aqi = 30 + Math.floor(Math.random() * 90);
    const locationIdx = Math.abs(i + 7) % locations.length;

    analyticsData.push({
      key: i.toString(),
      date: dateStr,
      aqi,
      location: locations[locationIdx],
      type: 'past',
    });
  }

  const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(
    today.getMonth() + 1,
  ).padStart(2, '0')}`;
  analyticsData.push({
    key: '0',
    date: todayStr,
    aqi: 141,
    location: 'Phường Dịch Vọng, Quận Cầu Giấy',
    type: 'present',
  });

  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = `${String(date.getDate()).padStart(2, '0')}-${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}`;

    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - (8 - i));
    const pastDateStr = `${String(pastDate.getDate()).padStart(2, '0')}/${String(
      pastDate.getMonth() + 1,
    ).padStart(2, '0')}`;

    const aqi = 85 + Math.floor(Math.random() * 50);
    const locationIdx = (i - 1) % locations.length;
    const locationName = locations[locationIdx].split(',')[1]?.trim() || locations[locationIdx];

    analyticsData.push({
      key: `+${i}`,
      date: dateStr,
      aqi,
      location: `Dự báo: ${locationName}`,
      type: 'future',
      note: `Bạn đã đến đây ngày ${pastDateStr}`,
    });
  }

  return analyticsData;
};

const getAQIColor = (aqi) => {
  if (aqi <= 50) return '#22c55e';
  if (aqi <= 100) return '#eab308';
  if (aqi <= 150) return '#f97316';
  if (aqi <= 200) return '#ef4444';
  return '#7f1d1d';
};

export default function AnalyticExposureScreen() {
  const analyticsData = useMemo(() => generateAnalyticsData(), []);
  const [selectedIdx, setSelectedIdx] = useState(7);

  const selectedData = analyticsData[selectedIdx];

  const pastSlice = analyticsData.slice(0, 8);
  const futureSlice = analyticsData.slice(8);
  const pastAvg = Math.round(
    pastSlice.reduce((sum, d) => sum + d.aqi, 0) / Math.max(pastSlice.length, 1),
  );
  const futureAvg = Math.round(
    futureSlice.reduce((sum, d) => sum + d.aqi, 0) / Math.max(futureSlice.length, 1),
  );
  const diff = futureAvg - pastAvg;

  const pastPm25Avg = (pastAvg * 0.6).toFixed(1);
  const futurePm25Avg = (futureAvg * 0.6).toFixed(1);
  const cigPast = (pastPm25Avg / 22).toFixed(1);
  const cigFuture = (futurePm25Avg / 22).toFixed(1);

  const maxAqi = Math.max(...analyticsData.map((d) => d.aqi), 10);

  // Mock data "trốn bụi đi chơi" giống Analytics.jsx
  const userLocation = {
    name: 'Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội',
    aqi: 141,
  };
  const allDestinations = useMemo(
    () => [
      { id: 1, name: 'Ecopark, Hưng Yên', aqi: 40, weatherType: 'sun', temp: 24, distance: 18, driveTime: '35 phút', recommendation: 'Công viên sinh thái, hồ nước rộng, đạp xe dạo chơi' },
      { id: 2, name: 'Công viên Yên Sở', aqi: 45, weatherType: 'sun', temp: 23, distance: 12, driveTime: '25 phút', recommendation: 'Hồ rộng, chạy bộ, picnic gia đình, không gian xanh' },
      { id: 3, name: 'Làng cổ Đường Lâm', aqi: 48, weatherType: 'cloud', temp: 22, distance: 45, driveTime: '1 giờ 10 phút', recommendation: 'Làng cổ 1200 năm, nhà sàn truyền thống, ẩm thực đặc sản' },
      { id: 4, name: 'Khu du lịch Sơn Tây', aqi: 44, weatherType: 'sun', temp: 21, distance: 42, driveTime: '1 giờ', recommendation: 'Thành cổ Sơn Tây, núi non hùng vĩ, không khí trong lành' },
      { id: 5, name: 'Vườn Vua Resort', aqi: 38, weatherType: 'sun', temp: 25, distance: 35, driveTime: '50 phút', recommendation: 'Resort sinh thái, vườn cây ăn trái, trải nghiệm làm vườn' },
      { id: 6, name: 'Ba Vì, Hà Nội', aqi: 42, weatherType: 'sun', temp: 21, distance: 65, driveTime: '1 giờ 45 phút', recommendation: 'Vườn quốc gia, suối nước nóng, cắm trại rừng thông' },
      { id: 7, name: 'Chùa Hương, Mỹ Đức', aqi: 48, weatherType: 'cloud', temp: 22, distance: 60, driveTime: '1 giờ 40 phút', recommendation: 'Di tích lịch sử, chèo thuyền suối Yến, núi non hữu tình' },
      { id: 8, name: 'Đại Lải, Vĩnh Phúc', aqi: 38, weatherType: 'sun', temp: 23, distance: 55, driveTime: '1 giờ 20 phút', recommendation: 'Hồ Đại Lải xanh mát, resort nghỉ dưỡng, thể thao nước' },
      { id: 9, name: 'Tam Đảo, Vĩnh Phúc', aqi: 35, weatherType: 'cloud', temp: 18, distance: 85, driveTime: '2 giờ 15 phút', recommendation: 'Săn mây, check-in Thác Bạc, khí hậu mát mẻ quanh năm' },
      { id: 10, name: 'Thung Nham, Ninh Bình', aqi: 36, weatherType: 'sun', temp: 24, distance: 95, driveTime: '2 giờ 30 phút', recommendation: 'Hang động, vườn chim, kayaking, cảnh quan tuyệt đẹp' },
    ],
    [],
  );
  const [selectedRadius, setSelectedRadius] = useState(100);
  const radiusOptions = [50, 100, 150, 200];
  const [showRadiusMenu, setShowRadiusMenu] = useState(false);
  const filteredDestinations = useMemo(
    () =>
      allDestinations
        .filter((d) => d.distance <= selectedRadius)
        .sort((a, b) => a.aqi - b.aqi),
    [allDestinations, selectedRadius],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Lịch sử &amp; dự báo</Text>
          <Text style={styles.headerSubtitle}>Phân tích chất lượng không khí 15 ngày</Text>
        </View>
      </View>

      {/* Mini bar chart dạng thẻ */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartAccent} />
          <Text style={styles.chartTitle}>Diễn biến 15 ngày</Text>
        </View>

        <View style={styles.barRow}>
          {analyticsData.map((item, idx) => {
            const heightRatio = item.aqi / maxAqi;
            const barHeight = 90 * heightRatio + 10;
            const isSelected = idx === selectedIdx;
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.barWrapper}
                onPress={() => setSelectedIdx(idx)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: getAQIColor(item.aqi),
                      opacity: isSelected ? 1 : 0.7,
                      borderWidth: isSelected ? 1.5 : 0,
                      borderColor: '#0f172a',
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{item.date}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dynamic info box */}
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
            <Text style={styles.selectedLocation}>{selectedData.location}</Text>
            {!!selectedData.note && (
              <Text style={styles.selectedNote}>💡 {selectedData.note}</Text>
            )}
          </View>
          <View style={styles.selectedAqiBox}>
            <Text
              style={[
                styles.selectedAqiValue,
                { color: getAQIColor(selectedData.aqi) },
              ]}
            >
              {selectedData.aqi}
            </Text>
            <Text style={styles.selectedAqiLabel}>AQI</Text>
          </View>
        </View>
        <Text style={styles.selectedFooterText}>
          Địa điểm phơi nhiễm nhiều nhất trong ngày.
        </Text>
      </View>

      {/* Thống kê mức độ phơi nhiễm */}
      <View style={styles.exposureWrapper}>
        <View style={styles.exposureHeader}>
          <View style={styles.exposureIconBox}>
            <Text style={styles.exposureIcon}>🫁</Text>
          </View>
          <View>
            <Text style={styles.exposureTitle}>Thống kê mức độ phơi nhiễm</Text>
            <Text style={styles.exposureSubtitle}>
              Dựa trên lộ trình thường ngày của bạn
            </Text>
          </View>
        </View>

        <View style={styles.exposureSection}>
          {/* Past card */}
          <View style={styles.exposureCardPast}>
            <Text style={styles.exposureTag}>7 NGÀY QUA</Text>
            <Text style={styles.exposureAqi}>{pastAvg}</Text>
            <Text style={styles.exposureAqiLabel}>AQI Trung bình</Text>

            <View style={styles.exposureDivider} />

            <Text style={styles.exposurePm25}>
              {pastPm25Avg}
              <Text style={styles.exposurePm25Unit}> µg/m³</Text>
            </Text>
            <Text style={styles.exposureText}>Phơi nhiễm PM2.5</Text>
            <Text style={styles.exposureCig}>
              ≈ hút <Text style={styles.exposureCigValue}>{cigPast}</Text> điếu thuốc
            </Text>

            <View style={styles.exposureFooterPill}>
              <Text style={styles.exposureFooterPillText}>📍 7 địa điểm đã ghé</Text>
            </View>
          </View>

          {/* Future card */}
          <View style={styles.exposureCardFuture}>
            <Text style={[styles.exposureTag, { color: '#2563eb' }]}>7 NGÀY TỚI</Text>
            <Text style={[styles.exposureAqi, { color: '#2563eb' }]}>{futureAvg}</Text>
            <Text style={styles.exposureAqiLabel}>AQI Dự kiến</Text>

            <View style={styles.exposureDividerFuture} />

            <Text style={[styles.exposurePm25, { color: '#2563eb' }]}>
              {futurePm25Avg}
              <Text style={styles.exposurePm25Unit}> µg/m³</Text>
            </Text>
            <Text style={styles.exposureText}>Phơi nhiễm PM2.5</Text>
            <Text style={styles.exposureCig}>
              ≈ hút <Text style={styles.exposureCigValue}>{cigFuture}</Text> điếu thuốc
            </Text>

            <View
              style={[
                styles.diffBadge,
                diff < 0 ? styles.diffBadgeGood : styles.diffBadgeBad,
              ]}
            >
              <Text
                style={[
                  styles.diffBadgeText,
                  diff < 0 ? styles.diffBadgeTextGood : styles.diffBadgeTextBad,
                ]}
              >
                {diff < 0 ? `Giảm ${Math.abs(diff)} đơn vị` : `Tăng ${diff} đơn vị`}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Chú thích dưới thống kê phơi nhiễm */}
      <View style={styles.exposureNoteCard}>
        <View style={styles.exposureNoteIconBox}>
          <Text style={styles.exposureNoteIcon}>💡</Text>
        </View>
        <View style={styles.exposureNoteTextBox}>
          <Text style={styles.exposureNoteTitle}>Dự báo thông minh</Text>
          <Text style={styles.exposureNoteText}>
            Các địa điểm được dự báo dựa trên lộ trình thường ngày của bạn trong 7 ngày qua. Hệ
            thống phân tích các vị trí bạn thường lui tới để đưa ra dự báo AQI chính xác hơn.
          </Text>
        </View>
      </View>

      {/* Trốn bụi cuối tuần */}
      <View style={styles.weekendSection}>
        {/* Header + nút chọn bán kính */}
        <View style={styles.weekendHeaderRow}>
          <View style={styles.weekendHeaderText}>
            <Text style={styles.weekendTitle}>Trốn bụi cuối tuần 🚆</Text>
            <Text style={styles.weekendSubtitle}>Dựa trên dự báo 48h tới</Text>
          </View>
          <View style={styles.weekendRadiusContainer}>
            <TouchableOpacity
              style={styles.weekendRadiusButton}
              onPress={() => setShowRadiusMenu((v) => !v)}
              activeOpacity={0.8}
            >
              <Feather name="navigation-2" size={12} color="#1d4ed8" />
              <Text style={styles.weekendRadiusButtonText}>{selectedRadius}km</Text>
              <Feather
                name={showRadiusMenu ? 'chevron-up' : 'chevron-down'}
                size={12}
                color="#6b7280"
              />
            </TouchableOpacity>
            {showRadiusMenu && (
              <View style={styles.weekendRadiusMenu}>
                {radiusOptions.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.weekendRadiusMenuItem,
                      selectedRadius === r && styles.weekendRadiusMenuItemActive,
                    ]}
                    onPress={() => {
                      setSelectedRadius(r);
                      setShowRadiusMenu(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.weekendRadiusMenuText,
                        selectedRadius === r && styles.weekendRadiusMenuTextActive,
                      ]}
                    >
                      {r} km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Thẻ vị trí hiện tại */}
        <View style={styles.weekendLocationCard}>
          <View>
            <Text style={styles.weekendLocationLabel}>Vị trí hiện tại</Text>
            <Text style={styles.weekendLocationName}>{userLocation.name}</Text>
          </View>
          <View style={styles.weekendLocationAqiBox}>
            <Text style={styles.weekendLocationAqiLabel}>AQI</Text>
            <Text style={styles.weekendLocationAqiValue}>{userLocation.aqi}</Text>
          </View>
        </View>

        <Text style={styles.weekendSectionHeading}>Gợi ý hàng đầu</Text>

        {filteredDestinations.map((dest) => {
          const cleanRatio = (userLocation.aqi / dest.aqi).toFixed(1);
          return (
            <View key={dest.id} style={styles.weekendCardOuter}>
              <ImageBackground
                source={{
                  uri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80',
                }}
                style={styles.weekendCardImage}
                imageStyle={styles.weekendCardImageStyle}
              >
                <View style={styles.weekendCardOverlay} />
                <View style={styles.weekendCardInner}>
                  <View style={styles.weekendCardHeader}>
                    <View>
                      <Text style={styles.weekendCardTitle}>{dest.name}</Text>
                      <Text style={styles.weekendMetaText}>
                        {dest.distance} km • {dest.driveTime}
                      </Text>
                    </View>
                    <View style={styles.weekendAqiBadge}>
                      <Text style={styles.weekendAqiLabel}>AQI</Text>
                      <Text style={styles.weekendAqiValue}>{dest.aqi}</Text>
                    </View>
                  </View>

                  <View style={styles.weekendStatsRow}>
                    <View style={styles.weekendStatBox}>
                      <Text style={styles.weekendStatLabel}>Độ sạch</Text>
                      <Text style={styles.weekendStatValue}>Gấp {cleanRatio} lần</Text>
                    </View>
                    <View style={styles.weekendStatBox}>
                      <Text style={styles.weekendStatLabel}>Thời tiết</Text>
                      <Text style={styles.weekendStatValue}>{dest.temp}°C</Text>
                    </View>
                  </View>

                  <Text style={styles.weekendRecommendation}>💡 {dest.recommendation}</Text>
                </View>
              </ImageBackground>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eff6ff',
  },
  content: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartAccent: {
    width: 3,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#6366f1',
    marginRight: 8,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 10,
    borderRadius: 999,
    marginHorizontal: 2,
  },
  barLabel: {
    marginTop: 4,
    fontSize: 9,
    color: '#9ca3af',
  },
  selectedInfoCard: {
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
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
  selectedFooterText: {
    marginTop: 4,
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  exposureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exposureCardPast: {
    flex: 1,
    marginRight: 6,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exposureCardFuture: {
    flex: 1,
    marginLeft: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  exposureTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4b5563',
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
    fontWeight: '700',
    color: '#b45309',
  },
  exposureWrapper: {
    marginTop: 16,
    marginBottom: 8,
  },
  exposureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  exposureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  exposureIcon: {
    fontSize: 18,
  },
  exposureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  exposureSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  exposureFooterPill: {
    marginTop: 8,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#fee2e2',
  },
  exposureFooterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b91c1c',
  },
  diffBadge: {
    marginTop: 6,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  diffBadgeGood: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  diffBadgeBad: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#f97316',
  },
  diffBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  diffBadgeTextGood: {
    color: '#166534',
  },
  diffBadgeTextBad: {
    color: '#b91c1c',
  },
  exposureNoteCard: {
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 14,
    backgroundColor: '#fefce8',
    borderWidth: 1,
    borderColor: '#facc15',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  exposureNoteIconBox: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: '#fef9c3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  exposureNoteIcon: {
    fontSize: 14,
  },
  exposureNoteTextBox: {
    flex: 1,
  },
  exposureNoteTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854d0e',
    marginBottom: 2,
  },
  exposureNoteText: {
    fontSize: 11,
    color: '#92400e',
    lineHeight: 15,
  },
  weekendSection: {
    marginTop: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  weekendHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekendHeaderText: {
    flex: 1,
    marginRight: 8,
  },
  weekendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  weekendSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  weekendRadiusContainer: {
    position: 'relative',
  },
  weekendRadiusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  weekendRadiusButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
    marginHorizontal: 4,
  },
  weekendRadiusMenu: {
    position: 'absolute',
    top: 34,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 4,
    minWidth: 90,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 20,
  },
  weekendRadiusMenuItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  weekendRadiusMenuItemActive: {
    backgroundColor: '#dbeafe',
  },
  weekendRadiusMenuText: {
    fontSize: 11,
    color: '#4b5563',
  },
  weekendRadiusMenuTextActive: {
    fontWeight: '700',
    color: '#1d4ed8',
  },
  weekendLocationCard: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekendLocationLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  weekendLocationName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 2,
  },
  weekendLocationAqiBox: {
    alignItems: 'flex-end',
  },
  weekendLocationAqiLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  weekendLocationAqiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#b91c1c',
  },
  weekendSectionHeading: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  weekendCardOuter: {
    marginTop: 10,
    borderRadius: 18,
    overflow: 'hidden',
  },
  weekendCardImage: {
    height: 130,
    width: '100%',
    justifyContent: 'flex-end',
  },
  weekendCardImageStyle: {
    borderRadius: 18,
  },
  weekendCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.35)',
  },
  weekendCardInner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  weekendCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  weekendCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  weekendMetaText: {
    fontSize: 11,
    color: '#e5e7eb',
    marginTop: 2,
  },
  weekendAqiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(190, 223, 195, 0.72)',
  },
  weekendAqiLabel: {
    fontSize: 10,
    color: 'rgba(2, 100, 15, 0.72)',
    fontWeight: '600',
  },
  weekendAqiValue: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(2, 100, 15, 0.72)',
  },
  weekendStatsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  weekendStatBox: {
    flex: 1,
    marginRight: 4,
    backgroundColor: 'rgba(126, 139, 170, 0.72)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  weekendStatLabel: {
    fontSize: 10,
    color: '#e5e7eb',
  },
  weekendStatValue: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(157, 187, 231, 0.72)',
  },
  weekendRecommendation: {
    marginTop: 6,
    fontSize: 11,
    color: '#e5e7eb',
  },
});

