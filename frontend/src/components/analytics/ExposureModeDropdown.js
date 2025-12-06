import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getExposureModeIcon, getExposureModeLabel, getExposureMultiplierLabel } from '../../utils/exposureUtils';

const ExposureModeDropdown = ({ exposureMode, showMenu, onToggleMenu, onSelectMode }) => {
  const modes = ['outdoor', 'indoor', 'indoor_purifier'];

  return (
    <View>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={onToggleMenu}
        activeOpacity={0.7}
      >
        <Feather 
          name={getExposureModeIcon(exposureMode)} 
          size={14} 
          color="#1d4ed8" 
        />
        <Text style={styles.dropdownText}>
          {getExposureModeLabel(exposureMode)}
        </Text>
        <Feather 
          name={showMenu ? 'chevron-up' : 'chevron-down'} 
          size={14} 
          color="#64748b" 
        />
      </TouchableOpacity>
      
      {showMenu && (
        <View style={styles.menu}>
          {modes.map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.menuItem, exposureMode === mode && styles.menuItemActive]}
              onPress={() => onSelectMode(mode)}
              activeOpacity={0.7}
            >
              <Feather 
                name={getExposureModeIcon(mode)} 
                size={14} 
                color={exposureMode === mode ? '#1d4ed8' : '#64748b'} 
              />
              <Text style={[styles.menuText, exposureMode === mode && styles.menuTextActive]}>
                {getExposureModeLabel(mode)}
              </Text>
              <Text style={styles.menuMultiplier}>{getExposureMultiplierLabel(mode)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e40af',
  },
  menu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 160,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemActive: {
    backgroundColor: '#eff6ff',
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
  },
  menuTextActive: {
    fontWeight: '600',
    color: '#1e40af',
  },
  menuMultiplier: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
});

export default ExposureModeDropdown;
