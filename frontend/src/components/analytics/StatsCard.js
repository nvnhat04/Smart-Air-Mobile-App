import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { getAQIColor } from '../../utils/aqiUtils';

const StatsCard = ({ selectedData }) => {
  if (!selectedData) return null;

  return (
    <View style={styles.statsCard}>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Feather name="map-pin" size={16} color="#64748b" />
          <Text style={styles.statLabel}>Vị trí</Text>
          <Text style={styles.statValue} numberOfLines={2}>
            {selectedData.location}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Feather name="activity" size={16} color="#64748b" />
          <Text style={styles.statLabel}>AQI</Text>
          <Text style={[styles.statValue, { color: getAQIColor(selectedData.aqi) }]}>
            {selectedData.aqi}
          </Text>
        </View>
      </View>
      {selectedData.note && (
        <View style={styles.noteBox}>
          <Feather name="info" size={12} color="#64748b" />
          <Text style={styles.noteText}>{selectedData.note}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  statsCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    gap: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#cbd5e1',
    fontStyle: 'italic',
  },
});

export default StatsCard;
