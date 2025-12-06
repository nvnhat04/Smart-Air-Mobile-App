import { Feather } from '@expo/vector-icons';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { getAQIColor } from '../../utils/aqiUtils';

const WeekendCard = ({ destination, userLocation }) => {
  const distance = destination.distance 
    ? `${destination.distance.toFixed(1)} km` 
    : 'N/A';

  return (
    <View style={styles.cardOuter}>
      <ImageBackground
        source={{ uri: destination.image }}
        style={styles.cardImage}
        imageStyle={styles.cardImageStyle}
      >
        <View style={styles.cardOverlay} />
        <View style={styles.cardInner}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{destination.name}</Text>
              <View style={styles.metaRow}>
                <Feather name="map-pin" size={12} color="#cbd5e1" />
                <Text style={styles.metaText}>{distance}</Text>
              </View>
            </View>
            <View style={[styles.aqiBadge, { backgroundColor: getAQIColor(destination.aqi) }]}>
              <Text style={styles.aqiLabel}>AQI</Text>
              <Text style={styles.aqiValue}>{destination.aqi}</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Feather name="trending-down" size={16} color="rgba(157, 187, 231, 0.72)" />
              <Text style={styles.statLabel}>Giảm</Text>
              <Text style={styles.statValue}>
                {userLocation?.aqi ? (userLocation.aqi - destination.aqi) : 0} AQI
              </Text>
            </View>
            <View style={styles.statBox}>
              <Feather name="clock" size={16} color="rgba(157, 187, 231, 0.72)" />
              <Text style={styles.statLabel}>Thời gian</Text>
              <Text style={styles.statValue}>{destination.time || 'N/A'}</Text>
            </View>
          </View>
          
          <Text style={styles.recommendation}>{destination.recommendation}</Text>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    marginBottom: 16,
  },
  cardImage: {
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImageStyle: {
    borderRadius: 16,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  cardInner: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  aqiBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  aqiLabel: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  aqiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(157, 187, 231, 0.72)',
  },
  recommendation: {
    marginTop: 6,
    fontSize: 11,
    color: '#e5e7eb',
  },
});

export default WeekendCard;
