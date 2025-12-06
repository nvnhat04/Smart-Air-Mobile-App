import { Feather } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SearchResults = ({ results, onSelectResult, error }) => {
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={24} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {results.map((result, index) => (
          <TouchableOpacity
            key={`${result.lat}-${result.lon}-${index}`}
            style={styles.resultItem}
            onPress={() => onSelectResult(result)}
            activeOpacity={0.7}
          >
            <Feather name="map-pin" size={16} color="#64748b" />
            <View style={styles.resultContent}>
              <Text style={styles.resultName} numberOfLines={1}>
                {result.display_name}
              </Text>
              <Text style={styles.resultCoords}>
                {parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)}
              </Text>
            </View>
            <Feather name="arrow-right" size={16} color="#94a3b8" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 300,
    zIndex: 999,
  },
  scrollView: {
    maxHeight: 300,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  resultCoords: {
    fontSize: 11,
    color: '#94a3b8',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#ef4444',
  },
});

export default SearchResults;
