import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAQICategory, getAQIColor } from '../../utils/aqiUtils';

const StationDetail = ({ station, onClose, onNavigate, loading }) => {
  if (!station) return null;

  const aqiColor = getAQIColor(station.aqi || station.baseAqi || 0);
  const aqiStatus = getAQICategory(station.aqi || station.baseAqi || 0);

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.aqiBadge, { backgroundColor: aqiColor }]}>
              <Text style={styles.aqiValue}>
                {station.aqi || station.baseAqi || 'N/A'}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.title} numberOfLines={2}>
                {station.name || station.address || 'Vị trí'}
              </Text>
              <Text style={[styles.status, { color: aqiColor }]}>
                {aqiStatus}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x" size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {station.address && (
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={16} color="#64748b" />
              <Text style={styles.infoText}>{station.address}</Text>
            </View>
          )}

          {(station.lat && station.lng) && (
            <View style={styles.infoRow}>
              <Feather name="navigation" size={16} color="#64748b" />
              <Text style={styles.infoText}>
                {parseFloat(station.lat).toFixed(4)}, {parseFloat(station.lng).toFixed(4)}
              </Text>
            </View>
          )}

          {station.pm25 && (
            <View style={styles.infoRow}>
              <Feather name="wind" size={16} color="#64748b" />
              <Text style={styles.infoText}>
                PM2.5: {station.pm25} µg/m³
              </Text>
            </View>
          )}

          {station.temp && (
            <View style={styles.infoRow}>
              <Feather name="thermometer" size={16} color="#64748b" />
              <Text style={styles.infoText}>
                Nhiệt độ: {station.temp}°C
              </Text>
            </View>
          )}

          {station.humidity && (
            <View style={styles.infoRow}>
              <Feather name="droplet" size={16} color="#64748b" />
              <Text style={styles.infoText}>
                Độ ẩm: {station.humidity}%
              </Text>
            </View>
          )}

          {station.advice && (
            <View style={styles.adviceBox}>
              <Text style={styles.adviceTitle}>💡 Lời khuyên</Text>
              <Text style={styles.adviceText}>{station.advice.text}</Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          style={[styles.detailButton, loading && styles.detailButtonDisabled]}
          onPress={onNavigate}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.detailButtonText}>Đang tải...</Text>
            </>
          ) : (
            <>
              <Text style={styles.detailButtonText}>Xem chi tiết</Text>
              <Feather name="arrow-right" size={18} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 20,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  aqiBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aqiValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  status: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: 300,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
  },
  adviceBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  adviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 6,
  },
  adviceText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1e40af',
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
  },
  detailButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  detailButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default StationDetail;
