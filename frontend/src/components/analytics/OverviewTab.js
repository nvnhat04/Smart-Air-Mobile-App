import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { scaleFont } from '../../constants/responsive';
import ChartSelectedInfo from './ChartSelectedInfo';
import ExposureChart from './ExposureChart';
import ExposureStatsCards from './ExposureStatsCards';
import StatsPeriodDropdown from './StatsPeriodDropdown';

export default function OverviewTab({
  loading,
  analyticsData,
  selectedIdx,
  setSelectedIdx,
  exposureMultiplier,
  selectedData,
  dayStats,
  topLocationsByDay,
  statsPeriod,
  setStatsPeriod,
  showStatsPeriodMenu,
  setShowStatsPeriodMenu,
  locationStats,
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
  onRefreshChart,
  setActiveTab,
  setDateFilter,
}) {
  return (
    <>
      {/* Mini bar chart dạng thẻ */}
      <ExposureChart
        analyticsData={analyticsData}
        selectedIdx={selectedIdx}
        setSelectedIdx={setSelectedIdx}
        exposureMultiplier={exposureMultiplier}
        onRefresh={onRefreshChart}
        topLocationsByDay={topLocationsByDay}
        setDateFilter={setDateFilter}
      />

      {/* Dynamic info box */}
      <ChartSelectedInfo
        selectedData={selectedData}
        exposureMultiplier={exposureMultiplier}
        dayStats={dayStats}
        topLocationsByDay={topLocationsByDay}
        setActiveTab={setActiveTab}
        setDateFilter={setDateFilter}
      />

      {/* Thống kê mức độ phơi nhiễm */}
      <View style={styles.exposureWrapper}>
        <View style={styles.exposureHeader}>
          <View style={styles.exposureIconBox}>
            <Text style={styles.exposureIcon}>🫁</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.exposureTitle}>Thống kê mức độ phơi nhiễm</Text>
            <Text style={styles.exposureSubtitle}>
              Dựa trên lộ trình thường ngày của bạn
            </Text>
          </View>
          <StatsPeriodDropdown
            statsPeriod={statsPeriod}
            setStatsPeriod={setStatsPeriod}
            showStatsPeriodMenu={showStatsPeriodMenu}
            setShowStatsPeriodMenu={setShowStatsPeriodMenu}
          />
        </View>

        {/* Loading chỉ cho phần thống kê */}
        {loading ? (
          <View style={styles.loadingTabContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingTabText}>Đang tải dữ liệu phơi nhiễm...</Text>
          </View>
        ) : (
          <ExposureStatsCards
            statsPeriod={statsPeriod}
            locationStats={locationStats}
            exposureMultiplier={exposureMultiplier}
            pastAvg={pastAvg}
            pastPm25Avg={pastPm25Avg}
            cigPast={cigPast}
            futureAvg={futureAvg}
            futurePm25Avg={futurePm25Avg}
            cigFuture={cigFuture}
            futureMinAqi={futureMinAqi}
            futureMaxAqi={futureMaxAqi}
            getDateRangePast={getDateRangePast}
            getDateRangeForecast={getDateRangeForecast}
          />
        )}
      </View>

      {/* Chú thích dưới thống kê phơi nhiễm */}
      <ExposureNoteCard />
    </>
  );
}

// ExposureNoteCard component - gộp vào OverviewTab
function ExposureNoteCard() {
  return (
    <View style={noteCardStyles.exposureNoteCard}>
      <View style={noteCardStyles.exposureNoteIconBox}>
        <Text style={noteCardStyles.exposureNoteIcon}>💡</Text>
      </View>
      <View style={noteCardStyles.exposureNoteTextBox}>
        <Text style={noteCardStyles.exposureNoteTitle}>Dự báo thông minh</Text>
        <Text style={noteCardStyles.exposureNoteText}>
          Các địa điểm được dự báo dựa trên lộ trình thường ngày của bạn trong 7 ngày qua. Hệ
          thống phân tích các vị trí bạn thường lui tới để đưa ra dự báo AQI chính xác hơn.
        </Text>
      </View>
    </View>
  );
}

const noteCardStyles = StyleSheet.create({
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
    fontSize: scaleFont(14),
  },
  exposureNoteTextBox: {
    flex: 1,
  },
  exposureNoteTitle: {
    fontSize: scaleFont(12),
    fontWeight: '700',
    color: '#854d0e',
    marginBottom: 2,
  },
  exposureNoteText: {
    fontSize: scaleFont(11),
    color: '#92400e',
    lineHeight: scaleFont(15),
  },
});

const styles = StyleSheet.create({
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
    fontSize: scaleFont(18),
  },
  exposureTitle: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  exposureSubtitle: {
    fontSize: scaleFont(12),
    color: '#64748b',
  },
  loadingTabContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingTabText: {
    marginTop: 16,
    fontSize: scaleFont(14),
    color: '#64748b',
    fontWeight: '500',
  },
});

