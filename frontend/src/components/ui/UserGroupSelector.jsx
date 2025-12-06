import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * UserGroupSelector Component - Tối giản
 * Cho phép người dùng chọn nhóm: Bình thường hoặc Nhạy cảm
 */
export const UserGroupSelector = ({ selectedGroup, onGroupChange, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Đối tượng:</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.toggleButtonLeft,
            selectedGroup === 'normal' && styles.toggleButtonActive
          ]}
          onPress={() => onGroupChange('normal')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.toggleText,
            selectedGroup === 'normal' && styles.toggleTextActive
          ]}>
            👤 Bình thường
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.toggleButtonRight,
            selectedGroup === 'sensitive' && styles.toggleButtonActive
          ]}
          onPress={() => onGroupChange('sensitive')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.toggleText,
            selectedGroup === 'sensitive' && styles.toggleTextActive
          ]}>
            ⚠️ Nhạy cảm
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  toggleButtonLeft: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  toggleButtonRight: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#d1d5db',
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
});

export default UserGroupSelector;
