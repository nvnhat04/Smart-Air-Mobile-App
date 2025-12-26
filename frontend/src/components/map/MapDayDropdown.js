import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { scaleFont } from '../../constants/responsive';
/**
 * Dropdown chọn ngày (chips) giống SmartAir-UI
 * UI/UX giữ nguyên như MapScreen gốc.
 */
export default function MapDayDropdown({
  visible,
  dayOptions,
  selectedDayIndex,
  onSelectDay,
}) {
  if (!visible) return null;

  return (
    <View style={styles.dayDropdown}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayScrollContent}
      >
        {dayOptions.map((opt, idx) => (
          <TouchableOpacity
            key={`${opt.label}-${opt.dateStr}`}
            style={[
              styles.dayChip,
              selectedDayIndex === idx && styles.dayChipActive,
            ]}
            onPress={() => onSelectDay(idx, opt)}
          >
            <View>
              <Text
                style={[
                  styles.dayChipText,
                  selectedDayIndex === idx && styles.dayChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
              <Text
                style={[
                  styles.dayChipDate,
                  selectedDayIndex === idx && styles.dayChipDateActive,
                ]}
              >
                {opt.dateStr}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dayDropdown: {
    position: 'absolute',
    top: 96,
    left: 12,
    right: 60,
    zIndex: 12,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dayScrollContent: {
    flexDirection: 'row',
  },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
  },
  dayChipActive: {
    backgroundColor: '#2563eb',
  },
  dayChipText: {
    fontSize: scaleFont(11),
    color: '#4b5563',
  },
  dayChipTextActive: {
    color: '#f9fafb',
    fontWeight: '600',
  },
  dayChipDate: {
    fontSize: scaleFont(10),
    color: '#9ca3af',
  },
  dayChipDateActive: {
    color: '#e5e7eb',
  },
});


