import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { getAQIColor } from '../../utils/aqiUtils';

const HistoryCard = ({ item }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.dateBox}>
          <Text style={styles.dateDay}>{item.date}</Text>
          <Text style={styles.dateMonth}>{item.month}</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color="#64748b" />
            <Text style={styles.locationText} numberOfLines={2}>
              {item.location}
            </Text>
          </View>
          <View style={styles.timeRow}>
            <Feather name="clock" size={12} color="#94a3b8" />
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        </View>
        <View style={[styles.aqiBadge, { backgroundColor: getAQIColor(item.aqi) }]}>
          <Text style={styles.aqiText}>{item.aqi}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateBox: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    paddingVertical: 8,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '800',
    color: '#60a5fa',
  },
  dateMonth: {
    fontSize: 11,
    color: '#93c5fd',
    fontWeight: '600',
  },
  cardInfo: {
    flex: 1,
    gap: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  aqiBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  aqiText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
});

export default HistoryCard;
