import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AqiBar() {
  const segments = [
    { color: '#22c55e', label: '0–50' },
    { color: '#eab308', label: '51–100' },
    { color: '#f97316', label: '101–150' },
    { color: '#ef4444', label: '151–200' },
    { color: '#7c3aed', label: '201–300' },
    { color: '#7f1d1d', label: '300+' },
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
    color: '#f9fafb',
    fontSize: 12,
    fontWeight: '450',
  },
});



