import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { getAQIColor } from '../../utils/aqiUtils';

const UserLocationCard = ({ userLocation }) => {
  if (!userLocation) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyState}>
          <Feather name="map-pin" size={32} color="#cbd5e1" />
          <Text style={styles.emptyText}>Chưa có vị trí hiện tại</Text>
          <Text style={styles.emptySubtext}>Bật GPS để xem AQI tại vị trí của bạn</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.label}>Vị trí hiện tại</Text>
        <Text style={styles.locationName}>{userLocation.name || userLocation.address}</Text>
      </View>
      <View style={styles.aqiBox}>
        <Text style={styles.aqiLabel}>AQI</Text>
        <Text style={[
          styles.aqiValue,
          { color: getAQIColor(userLocation.aqi || 0) }
        ]}>
          {userLocation.aqi || 0}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  aqiBox: {
    alignItems: 'flex-end',
  },
  aqiLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  aqiValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default UserLocationCard;
