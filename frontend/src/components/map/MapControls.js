import { Feather } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const MapControls = ({ 
  onLocate, 
  locating, 
  onToggleHeatmap, 
  showHeatmap,
  onToggleMarkers,
  showMarkers 
}) => {
  return (
    <View style={styles.controlsContainer}>
      <TouchableOpacity
        style={[styles.controlButton, locating && styles.controlButtonActive]}
        onPress={onLocate}
        activeOpacity={0.8}
        disabled={locating}
      >
        <Feather 
          name="navigation" 
          size={20} 
          color={locating ? '#ffffff' : '#1e40af'} 
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.controlButton, showHeatmap && styles.controlButtonActive]}
        onPress={onToggleHeatmap}
        activeOpacity={0.8}
      >
        <Feather 
          name="layers" 
          size={20} 
          color={showHeatmap ? '#ffffff' : '#64748b'} 
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.controlButton, showMarkers && styles.controlButtonActive]}
        onPress={onToggleMarkers}
        activeOpacity={0.8}
      >
        <Feather 
          name="map-pin" 
          size={20} 
          color={showMarkers ? '#ffffff' : '#64748b'} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    gap: 10,
    zIndex: 100,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  controlButtonActive: {
    backgroundColor: '#1e40af',
  },
});

export default MapControls;
