import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';

export default function ProfileEditModal({
  visible,
  editForm,
  setEditForm,
  saving,
  onClose,
  onSave,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Feather name="x" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Display Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Họ và tên *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nhập họ và tên"
                value={editForm.displayName}
                onChangeText={(text) => setEditForm({ ...editForm, displayName: text })}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Gender */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Giới tính</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    editForm.gender === 'male' && styles.genderButtonActive,
                  ]}
                  onPress={() => setEditForm({ ...editForm, gender: 'male' })}
                >
                  <Feather
                    name="male"
                    size={18}
                    color={editForm.gender === 'male' ? '#2563eb' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.genderButtonText,
                      editForm.gender === 'male' && styles.genderButtonTextActive,
                    ]}
                  >
                    Nam
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    editForm.gender === 'female' && styles.genderButtonActive,
                  ]}
                  onPress={() => setEditForm({ ...editForm, gender: 'female' })}
                >
                  <Feather
                    name="female"
                    size={18}
                    color={editForm.gender === 'female' ? '#2563eb' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.genderButtonText,
                      editForm.gender === 'female' && styles.genderButtonTextActive,
                    ]}
                  >
                    Nữ
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Age */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tuổi</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nhập tuổi"
                value={editForm.age}
                onChangeText={(text) =>
                  setEditForm({ ...editForm, age: text.replace(/[^0-9]/g, '') })
                }
                keyboardType="number-pad"
                maxLength={3}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nhập số điện thoại"
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                keyboardType="phone-pad"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* City */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Thành phố</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nhập thành phố"
                value={editForm.city}
                onChangeText={(text) => setEditForm({ ...editForm, city: text })}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Country */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Quốc gia</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nhập quốc gia"
                value={editForm.country}
                onChangeText={(text) => setEditForm({ ...editForm, country: text })}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Group */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nhóm người</Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <Picker
                  selectedValue={editForm.group}
                  onValueChange={(val) => setEditForm({ ...editForm, group: val })}
                >
                  <Picker.Item label="Bình thường" value="normal" />
                  <Picker.Item label="Nhạy cảm" value="sensitive" />
                </Picker>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
              <Text style={styles.modalCancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveButton, saving && styles.modalSaveButtonDisabled]}
              onPress={onSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#ffffff" />
                  <Text style={styles.modalSaveButtonText}>Lưu</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    gap: 8,
  },
  genderButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  genderButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748b',
  },
  genderButtonTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: 600,
    color: '#64748b',
  },
  modalSaveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});


