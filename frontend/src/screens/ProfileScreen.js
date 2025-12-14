import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../services/api';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    gender: '',
    age: '',
    phone: '',
    city: '',
    country: '',
    group: '',
  });
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('auth');
        if (!raw) {
          // Not logged in
          navigation.navigate('Login');
          return;
        }
        const authData = JSON.parse(raw);
        setAuth(authData);

        // Try to fetch profile from server
        if (authData.uid) {
          try {
            const res = await fetch(`${api.AUTH_BASE}/profile/${authData.uid}`);
            if (res.ok) {
              const json = await res.json();
              setProfile(json.profile || null);
              console.log('[ProfileScreen] profile loaded from server', json);
            } else {
              console.warn('[ProfileScreen] profile fetch failed', res.status);
            }
          } catch (e) {
            console.warn('[ProfileScreen] failed to fetch profile:', e.message);
          }
        }
      } catch (e) {
        console.error('[ProfileScreen] Init error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Xác nhận đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?",
      [
        {
          text: "Hủy",
          style: "cancel"
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('auth');
              setAuth(null);
              setProfile(null);
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (e) {
              console.error('[ProfileScreen] logout error', e);
              Alert.alert('Đăng xuất thất bại', String(e));
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const handleEditProfile = () => {
    setEditForm({
      displayName: profile?.displayName || '',
      gender: profile?.gender || '',
      age: profile?.age?.toString() || '',
      phone: profile?.phone || '',
      city: profile?.city || '',
      country: profile?.country || '',
      group: profile?.group || 'normal',
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Validate form
      if (!editForm.displayName.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập họ và tên');
        return;
      }

      // Prepare data
      const updatedProfile = {
        displayName: editForm.displayName.trim(),
        gender: editForm.gender || null,
        age: editForm.age ? parseInt(editForm.age) : null,
        phone: editForm.phone.trim() || null,
        city: editForm.city.trim() || null,
        country: editForm.country.trim() || null,
        group: editForm.group || null,
      };

      // Get JWT token
      const authStr = await AsyncStorage.getItem('auth');
      const authData = authStr ? JSON.parse(authStr) : null;
      const token = authData?.token || authData?.access_token;

      if (!token) {
        Alert.alert('Lỗi', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      // Call API to update profile
      const res = await fetch(`${api.AUTH_BASE}/profile/${auth.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ profile: updatedProfile }),
      });

      if (res.ok) {
        const json = await res.json();
        setProfile(json.profile || updatedProfile);
        setShowEditModal(false);
        Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
      } else {
        const errorText = await res.text();
        console.error('Update profile failed:', errorText);
        Alert.alert('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại.');
      }
    } catch (e) {
      console.error('[ProfileScreen] save profile error:', e);
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!auth) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="user-x" size={64} color="#cbd5e1" />
        <Text style={styles.emptyTitle}>Chưa đăng nhập</Text>
        <Text style={styles.emptyText}>Vui lòng đăng nhập để xem thông tin cá nhân</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginButtonText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Helper component for profile rows
  const ProfileRow = ({ icon, label, value }) => (
    <View style={styles.profileRow}>
      <View style={styles.labelContainer}>
        <Feather name={icon} size={18} color="#64748b" style={{ marginRight: 10 }} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value || '—'}</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with gradient effect */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Feather name="user" size={40} color="#ffffff" />
              </View>
            </View>
            <Text style={styles.displayName}>
              {profile?.displayName || auth.email?.split('@')[0] || 'Người dùng'}
            </Text>
            <Text style={styles.email}>{auth.email}</Text>
          </View>
        </View>

        {/* Account Info Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          <View style={styles.card}>
            <ProfileRow icon="mail" label="Email" value={auth.email} />
            {auth.username && (
              <ProfileRow icon="at-sign" label="Tên người dùng" value={auth.username} />
            )}
            {/* {auth.uid && (
              <ProfileRow icon="hash" label="User ID" value={auth.uid.slice(0, 12) + '...'} />
            )} */}
          </View>
        </View>

        {/* Personal Details Card */}
        {profile ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEditProfile}
                activeOpacity={0.7}
              >
                <Feather name="edit-2" size={16} color="#2563eb" />
                <Text style={styles.editButtonText}>Chỉnh sửa</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              <ProfileRow icon="user" label="Họ và tên" value={profile.displayName} />
              {profile.gender && (
                <ProfileRow 
                  icon="user" 
                  label="Giới tính" 
                  value={profile.gender === 'male' ? 'Nam' : 'Nữ'} 
                />
              )}
              {profile.age && (
                <ProfileRow icon="calendar" label="Tuổi" value={profile.age} />
              )}
              {profile.phone && (
                <ProfileRow icon="phone" label="Điện thoại" value={profile.phone} />
              )}
              {profile.city && (
                <ProfileRow icon="map-pin" label="Thành phố" value={profile.city} />
              )}
              {profile.country && (
                <ProfileRow icon="globe" label="Quốc gia" value={profile.country} />
              )}
              {profile.group && (
                <ProfileRow
                  icon="shield"
                  label="Nhóm người"
                  value={profile.group === 'sensitive' ? 'Nhạy cảm' : 'Bình thường'}
                />
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noticeBox}>
            <Feather name="alert-circle" size={20} color="#f59e0b" />
            <Text style={styles.noticeText}>
              Thông tin cá nhân chưa được cập nhật trên server
            </Text>
            <TouchableOpacity 
              style={styles.noticeButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.noticeButtonText}>Cập nhật ngay</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={20} color="#ffffff" />
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowEditModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
              <TouchableOpacity 
                onPress={() => setShowEditModal(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {/* Display Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Họ và tên *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Nhập họ và tên"
                  value={editForm.displayName}
                  onChangeText={(text) => setEditForm({...editForm, displayName: text})}
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
                      editForm.gender === 'male' && styles.genderButtonActive
                    ]}
                    onPress={() => setEditForm({...editForm, gender: 'male'})}
                  >
                    <Feather 
                      name="male" 
                      size={18} 
                      color={editForm.gender === 'male' ? '#2563eb' : '#64748b'} 
                    />
                    <Text style={[
                      styles.genderButtonText,
                      editForm.gender === 'male' && styles.genderButtonTextActive
                    ]}>Nam</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      editForm.gender === 'female' && styles.genderButtonActive
                    ]}
                    onPress={() => setEditForm({...editForm, gender: 'female'})}
                  >
                    <Feather 
                      name="female" 
                      size={18} 
                      color={editForm.gender === 'female' ? '#2563eb' : '#64748b'} 
                    />
                    <Text style={[
                      styles.genderButtonText,
                      editForm.gender === 'female' && styles.genderButtonTextActive
                    ]}>Nữ</Text>
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
                  onChangeText={(text) => setEditForm({...editForm, age: text.replace(/[^0-9]/g, '')})}
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
                  onChangeText={(text) => setEditForm({...editForm, phone: text})}
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
                  onChangeText={(text) => setEditForm({...editForm, city: text})}
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
                  onChangeText={(text) => setEditForm({...editForm, country: text})}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Group */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nhóm người</Text>
                <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                  <Picker
                    selectedValue={editForm.group}
                    onValueChange={(val) => setEditForm({...editForm, group: val})}
                  >
                    <Picker.Item label="Bình thường" value="normal" />
                    <Picker.Item label="Nhạy cảm" value="sensitive" />
                  </Picker>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, saving && styles.modalSaveButtonDisabled]}
                onPress={handleSaveProfile}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  loginButton: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  // Header with Avatar
  header: {
    backgroundColor: '#2563eb',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },

  // Section
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 6,
  },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  // Profile Row
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    maxWidth: '50%',
    textAlign: 'right',
  },

  // Notice Box
  noticeBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  noticeText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
    marginTop: 8,
    fontWeight: '500',
  },
  noticeButton: {
    marginTop: 12,
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  noticeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },

  // Modal Styles
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

  // Form Styles
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

  // Modal Buttons
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
    fontWeight: '600',
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