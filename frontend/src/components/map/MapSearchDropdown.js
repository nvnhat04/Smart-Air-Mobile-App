import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

/**
 * Dropdown hiển thị kết quả search OSM
 * UI/UX giữ nguyên như MapScreen gốc.
 */
export default function MapSearchDropdown({
  searchQuery,
  searchResults,
  searchLoading,
  searchError,
  onSelectResult,
}) {
  if (searchQuery.trim().length === 0) return null;
  const shouldShow =
    searchResults.length > 0 || searchLoading || searchError;
  if (!shouldShow) return null;

  return (
    <View style={styles.searchDropdown}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.searchDropdownContent}
      >
        {searchResults.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.searchResultRow}
            onPress={() => onSelectResult(item)}
          >
            <Feather
              name="map-pin"
              size={14}
              color="#2563eb"
              style={{ marginRight: 8, marginTop: 2 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.searchResultName}>{item.name}</Text>
              {!!item.address && (
                <Text style={styles.searchResultAddress}>{item.address}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {searchLoading && (
          <Text style={styles.searchStatusText}>Đang tìm kiếm địa điểm...</Text>
        )}

        {!searchLoading && !searchResults.length && !searchError && (
          <Text style={styles.searchStatusText}>
            Nhập ít nhất 3 ký tự để tìm kiếm
          </Text>
        )}

        {searchError && (
          <Text style={[styles.searchStatusText, { color: '#ef4444' }]}>
            {searchError}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchDropdown: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 92,
    left: 12,
    right: 12,
    zIndex: 11,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 220,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  searchDropdownContent: {
    paddingVertical: 6,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchResultName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  searchResultAddress: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  searchStatusText: {
    fontSize: 12,
    color: '#9ca3af',
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'center',
  },
});


