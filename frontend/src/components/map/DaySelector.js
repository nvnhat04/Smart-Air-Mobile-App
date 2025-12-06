import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DaySelector = ({ selectedDay, onPress, isOpen }) => {
  return (
    <TouchableOpacity
      style={styles.dayButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.dayButtonContent}>
        <Feather name="calendar" size={18} color="#1e40af" />
        <View style={styles.dayTextContainer}>
          <Text style={styles.dayLabel}>{selectedDay.label}</Text>
          <Text style={styles.dayDate}>{selectedDay.dateStr}</Text>
        </View>
        <Feather 
          name={isOpen ? 'chevron-up' : 'chevron-down'} 
          size={18} 
          color="#64748b" 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  dayButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayTextContainer: {
    flex: 1,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  dayDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
});

export default DaySelector;
