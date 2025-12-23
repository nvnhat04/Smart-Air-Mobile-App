import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

/**
 * Layer controls: Heatmap / Trạm
 * UI/UX, styles giữ nguyên như trong MapScreen gốc.
 */
export default function MapLayerControls({
  showHeatmap,
  onToggleHeatmap,
  showMarkers,
  onToggleMarkers,
  selectedDayIndex,
}) {
  const canToggleMarkers = selectedDayIndex === 0;

  return (
    <View style={styles.layerControls}>
      <TouchableOpacity
        style={[styles.layerButton, !showHeatmap && styles.layerButtonInactive]}
        onPress={onToggleHeatmap}
      >
        <Feather name="map" size={16} color={showHeatmap ? "#2563eb" : "#9ca3af"} />
        <Text style={[styles.layerButtonText, !showHeatmap && styles.layerButtonTextInactive]}>
          Heatmap
        </Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      <TouchableOpacity
        style={[
          styles.layerButton,
          (!showMarkers || !canToggleMarkers) && styles.layerButtonInactive
        ]}
        onPress={() => {
          if (canToggleMarkers) {
            onToggleMarkers();
          }
        }}
        disabled={!canToggleMarkers}
      >
        <Feather 
          name="map-pin" 
          size={16} 
          color={showMarkers && canToggleMarkers ? "#2563eb" : "#9ca3af"} 
        />
        <Text
          style={[
            styles.layerButtonText,
            (!showMarkers || !canToggleMarkers) && styles.layerButtonTextInactive
          ]}
        >
          Trạm
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  separator: {
    width: 2,
    height: '100%',
    backgroundColor: '#e1dbdbff',
  },
  layerControls: {
    position: 'absolute',
    width: '50%',
    left: '24.5%',
    right: '33.5%',
    bottom: 60,
    zIndex: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  layerButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    minWidth: 100,
  },
  layerButtonInactive: {
    opacity: 0.5,
  },
  layerButtonText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  layerButtonTextInactive: {
    color: '#9ca3af',
  },
});


