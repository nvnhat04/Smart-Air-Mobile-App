import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AqiBar() {
  const segments = [
    { color: '#00ab78', label: '0–50' },
    { color: '#ffff00', label: '51–100' },
    { color: '#ff7e00', label: '101–150' },
    { color: '#d52827', label: '151–200' },
    { color: '#8f3f97', label: '201–300' },
    { color: '#7e0023', label: '300+' },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {segments.map((seg) => (
          <View
            key={seg.label}
            style={[styles.segment, { backgroundColor: seg.color }]}
          >
            <Text style={styles.segmentText}>{seg.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#DDDDDD',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 999,
    overflow: 'hidden',
    height: 18,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    color: '#d1d2d4ff',
    fontSize: 12,
    fontWeight: '450',
  },
});



