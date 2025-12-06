import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

const DateFilterBar = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { key: 'all', label: 'Tất cả' },
    { key: 'today', label: 'Hôm nay' },
    { key: 'last3days', label: '3 ngày' },
    { key: 'last7days', label: '7 ngày' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterButton,
            activeFilter === filter.key && styles.filterButtonActive,
          ]}
          onPress={() => onFilterChange(filter.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === filter.key && styles.filterTextActive,
            ]}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#1e40af',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#ffffff',
  },
});

export default DateFilterBar;
