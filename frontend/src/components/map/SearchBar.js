import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const SearchBar = ({ 
  query, 
  onChangeText, 
  onClear, 
  loading,
  placeholder = 'Tìm địa điểm...',
  onFocus,
  onBlur 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Feather name="search" size={18} color="#64748b" />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={query}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {loading ? (
          <ActivityIndicator size="small" color="#1e40af" />
        ) : query.length > 0 ? (
          <TouchableOpacity 
            onPress={onClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x" size={18} color="#64748b" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
});

export default SearchBar;
