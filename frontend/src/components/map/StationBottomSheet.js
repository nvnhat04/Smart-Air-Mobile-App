import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function StationBottomSheet({ station, onClose }) {
  if (!station) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{station.name}</Text>
            <Text style={styles.sub}>
              Lat: {station.lat.toFixed(3)} • Lng: {station.lng.toFixed(3)}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <View style={styles.aqiBadge}>
            <Text style={styles.aqiText}>{station.aqi}</Text>
            <Text style={styles.aqiLabel}>AQI</Text>
          </View>
          <View style={styles.hint}>
            <Text style={styles.hintText}>
              {station.status
                ? `Trạng thái: ${station.status}. Chạm marker khác để xem trạm khác.`
                : 'Chạm marker khác trên bản đồ để xem thông tin chi tiết.'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 50,
  },
  sheet: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#d1d5db',
    marginBottom: 8,
  },
  header: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  sub: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  closeBtn: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 999,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aqiBadge: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  aqiText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f9fafb',
    marginRight: 4,
  },
  aqiLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  hint: {
    flex: 1,
    backgroundColor: '#e5f2ff',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  hintText: {
    fontSize: 11,
    color: '#1d4ed8',
  },
});


