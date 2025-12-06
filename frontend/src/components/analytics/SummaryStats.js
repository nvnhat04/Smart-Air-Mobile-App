import { StyleSheet, Text, View } from 'react-native';

const SummaryStats = ({ pastAvg, futureAvg, diff, pastPm25Avg, futurePm25Avg, cigPast, cigFuture }) => {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>7 ngày qua</Text>
          <Text style={styles.summaryValue}>{pastAvg}</Text>
          <Text style={styles.summarySubtext}>TB AQI</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>6 ngày tới</Text>
          <Text style={styles.summaryValue}>{futureAvg}</Text>
          <Text style={styles.summarySubtext}>TB AQI</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Chênh lệch</Text>
          <Text style={[styles.summaryValue, { color: diff >= 0 ? '#f87171' : '#4ade80' }]}>
            {diff >= 0 ? '+' : ''}{diff}
          </Text>
          <Text style={styles.summarySubtext}>AQI</Text>
        </View>
      </View>
      
      <View style={styles.cigaretteRow}>
        <View style={styles.cigaretteBox}>
          <Text style={styles.cigaretteLabel}>🚬 7 ngày qua:</Text>
          <Text style={styles.cigaretteValue}>
            TB {pastPm25Avg} µg/m³ ≈ {cigPast} điếu/ngày
          </Text>
        </View>
        <View style={styles.cigaretteBox}>
          <Text style={styles.cigaretteLabel}>🚬 6 ngày tới:</Text>
          <Text style={styles.cigaretteValue}>
            TB {futurePm25Avg} µg/m³ ≈ {cigFuture} điếu/ngày
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#e2e8f0',
  },
  summarySubtext: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  cigaretteRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    gap: 8,
  },
  cigaretteBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cigaretteLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  cigaretteValue: {
    fontSize: 12,
    color: '#94a3b8',
  },
});

export default SummaryStats;
