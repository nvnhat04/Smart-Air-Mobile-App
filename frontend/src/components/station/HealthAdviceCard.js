import { StyleSheet, Text, View } from 'react-native';
import { UserGroupSelector } from '../ui';

import { scaleFont } from '../../constants/responsive';
export default function HealthAdviceCard({ advice, userGroup, onUserGroupChange }) {
  return (
    <View style={styles.healthCard}>
      <View style={styles.healthHeader}>
        <View style={styles.healthIconBox}>
          <Text style={styles.healthIcon}>🛡️</Text>
        </View>
        <Text style={styles.healthTitle}>Khuyến cáo sức khỏe</Text>
      </View>

      {/* User Group Selector */}
      <UserGroupSelector
        selectedGroup={userGroup}
        onGroupChange={onUserGroupChange}
        style={{ marginVertical: 12 }}
      />

      <View style={styles.healthBody}>
        {/* Khuyến cáo chi tiết */}
        <View style={styles.healthAdviceBox}>
          <Text style={styles.healthAdviceText}>
            {advice?.text}
          </Text>
        </View>

        {/* Nguồn: Bộ Y tế */}
        <Text style={styles.healthSource}>
          Nguồn: Công văn 12/MT-SKHC/2024 - Bộ Y tế
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  healthCard: {
    borderRadius: 24,
    padding: 14,
    backgroundColor: '#ecfdf3',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 16,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  healthIconBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  healthIcon: {
    fontSize: scaleFont(18),
    color: '#ffffff',
  },
  healthTitle: {
    fontSize: scaleFont(15),
    fontWeight: '700',
    color: '#14532d',
  },
  healthBody: {
    gap: 10,
  },
  healthAdviceBox: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dcfce7',
    padding: 12,
  },
  healthAdviceText: {
    fontSize: scaleFont(13),
    color: '#166534',
    lineHeight: 20,
  },
  healthSource: {
    fontSize: scaleFont(10),
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

