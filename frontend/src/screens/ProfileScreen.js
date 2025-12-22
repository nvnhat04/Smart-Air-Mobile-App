import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProfileEditModal from '../components/profile/ProfileEditModal';
import useProfile from '../hooks/useProfile';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const {
    loading,
    auth,
    profile,
    showEditModal,
    editForm,
    saving,
    setEditForm,
    handleLogout,
    openEditModal,
    closeEditModal,
    handleSaveProfile,
  } = useProfile(navigation);

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
                onPress={openEditModal}
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
              onPress={openEditModal}
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

      <ProfileEditModal
        visible={showEditModal}
        editForm={editForm}
        setEditForm={setEditForm}
        saving={saving}
        onClose={closeEditModal}
        onSave={handleSaveProfile}
      />
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

});