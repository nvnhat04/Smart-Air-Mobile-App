import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StatsPeriodDropdown({
  statsPeriod,
  setStatsPeriod,
  showStatsPeriodMenu,
  setShowStatsPeriodMenu,
}) {
  return (
    <View>
      <TouchableOpacity
        style={styles.statsPeriodDropdown}
        onPress={() => setShowStatsPeriodMenu(!showStatsPeriodMenu)}
        activeOpacity={0.7}
      >
        <Text style={styles.statsPeriodDropdownText}>
          {statsPeriod === 3 ? '3 ngày' : statsPeriod === 5 ? '5 ngày' : '7 ngày'}
        </Text>
        <Feather 
          name={showStatsPeriodMenu ? 'chevron-up' : 'chevron-down'} 
          size={14} 
          color="#64748b" 
        />
      </TouchableOpacity>
      {showStatsPeriodMenu && (
        <View style={styles.statsPeriodMenu}>
          <TouchableOpacity
            style={[styles.statsPeriodMenuItem, statsPeriod === 3 && styles.statsPeriodMenuItemActive]}
            onPress={() => {
              setStatsPeriod(3);
              setShowStatsPeriodMenu(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.statsPeriodMenuText, statsPeriod === 3 && styles.statsPeriodMenuTextActive]}>
              3 ngày
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statsPeriodMenuItem, statsPeriod === 5 && styles.statsPeriodMenuItemActive]}
            onPress={() => {
              setStatsPeriod(5);
              setShowStatsPeriodMenu(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.statsPeriodMenuText, statsPeriod === 5 && styles.statsPeriodMenuTextActive]}>
              5 ngày
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statsPeriodMenuItem, statsPeriod === 7 && styles.statsPeriodMenuItemActive]}
            onPress={() => {
              setStatsPeriod(7);
              setShowStatsPeriodMenu(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.statsPeriodMenuText, statsPeriod === 7 && styles.statsPeriodMenuTextActive]}>
              7 ngày
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statsPeriodDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  statsPeriodDropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  statsPeriodMenu: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 120,
    zIndex: 1000,
  },
  statsPeriodMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statsPeriodMenuItemActive: {
    backgroundColor: '#f0f9ff',
  },
  statsPeriodMenuText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  statsPeriodMenuTextActive: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
});

