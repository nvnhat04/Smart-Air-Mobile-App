import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DayMenu = ({ dayOptions, selectedIndex, onSelectDay, onClose }) => {
  return (
    <View style={styles.menuContainer}>
      <View style={styles.menuHeader}>
        <Text style={styles.menuTitle}>Chọn ngày dự báo</Text>
      </View>
      <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
        {dayOptions.map((day, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.menuItem,
              selectedIndex === idx && styles.menuItemActive,
            ]}
            onPress={() => {
              onSelectDay(idx);
              onClose();
            }}
            activeOpacity={0.7}
          >
            <View>
              <Text style={[
                styles.menuItemLabel,
                selectedIndex === idx && styles.menuItemLabelActive,
              ]}>
                {day.label}
              </Text>
              <Text style={styles.menuItemDate}>{day.dateStr}</Text>
            </View>
            {selectedIndex === idx && (
              <View style={styles.checkMark}>
                <Text style={styles.checkMarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 400,
    zIndex: 1000,
  },
  menuHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  menuScroll: {
    maxHeight: 340,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemActive: {
    backgroundColor: '#eff6ff',
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  menuItemLabelActive: {
    color: '#1e40af',
    fontWeight: '700',
  },
  menuItemDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  checkMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default DayMenu;
