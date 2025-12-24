import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export default function StatsInfoModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Chú thích thống kê</Text>
          <Text style={styles.text}>
            • <Text style={styles.bold}>AQI</Text> (Air Quality Index): Chỉ số chất lượng không khí, càng cao càng ô nhiễm.
          </Text>
          <Text style={styles.text}>
            • <Text style={styles.bold}>PM2.5</Text>: Bụi mịn đường kính &lt; 2.5μm, nguy hiểm cho sức khỏe.
          </Text>
          <Text style={styles.text}>
            • <Text style={styles.bold}>Quy đổi điếu thuốc</Text>: 22μg/m³ PM2.5/ngày ≈ hút 1 điếu thuốc lá.
          </Text>
          <Text style={styles.footer}>
            Các chỉ số được tính dựa trên lộ trình và dữ liệu thực tế của bạn.
          </Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Đóng</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  modalContent: {
    margin: 32,
    marginTop: 120,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#2563eb',
    marginBottom: 8,
  },
  text: {
    marginBottom: 8,
    color: '#334155',
  },
  bold: {
    fontWeight: 'bold',
  },
  footer: {
    color: '#64748b',
    fontSize: 13,
  },
  closeButton: {
    marginTop: 18,
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

