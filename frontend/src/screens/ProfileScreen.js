import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [auth, setAuth] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const navigation = useNavigation();

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const raw = await AsyncStorage.getItem('auth');
      if (!raw) {
        navigation.navigate('Login');
        return;
      }
      const authData = JSON.parse(raw);
      setAuth(authData);

      if (authData.uid) {
        try {
          const res = await fetch(`${api.AUTH_BASE}/profile/${authData.uid}`);
          if (res.ok) {
            const json = await res.json();
            const profileData = json.profile || null;
            setProfile(profileData);
            setEditData(profileData || {});
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
  };

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit - reset to current profile
      setEditData(profile || {});
    }
    setEditMode(!editMode);
  };

  const handleSaveProfile = async () => {
    if (!auth || !auth.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setSaving(true);
      
      // Build update payload (only changed fields)
      const updatePayload = {};
      Object.keys(editData).forEach(key => {
        if (editData[key] !== profile?.[key]) {
          updatePayload[key] = editData[key];
        }
      });

      // If no changes, exit edit mode
      if (Object.keys(updatePayload).length === 0) {
        setEditMode(false);
        return;
      }

      // Call update endpoint
      const res = await fetch(`${api.AUTH_BASE}/profile/${auth.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      if (res.ok) {
        const json = await res.json();
        setProfile(json.profile || editData);
        setEditMode(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        const error = await res.json();
        Alert.alert('Update failed', error.detail || 'Unknown error');
      }
    } catch (e) {
      console.error('[ProfileScreen] Save error:', e);
      Alert.alert('Error', e.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('auth');
              setAuth(null);
              setProfile(null);
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (e) {
              console.error('[ProfileScreen] logout error', e);
              Alert.alert('Logout failed', String(e));
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.containerCenter}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!auth) {
    return (
      <View style={styles.containerCenter}>
        <Text style={styles.message}>You are not logged in.</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // View mode: display profile data
  const ProfileRow = ({ icon, label, value }) => (
    <View style={styles.profileRow}>
      <View style={styles.labelContainer}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value || '—'}</Text>
    </View>
  );

  // Edit mode: editable form fields
  const EditField = ({ label, icon, value, field, placeholder }) => (
    <View style={styles.editFieldContainer}>
      <View style={styles.editLabelContainer}>
        <Ionicons name={icon} size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
        <Text style={styles.editLabel}>{label}</Text>
      </View>
      <TextInput
        style={styles.editInput}
        value={String(value || '')}
        onChangeText={(text) => setEditData({ ...editData, [field]: text })}
        placeholder={placeholder}
        editable={!saving}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Your Profile 👤</Text>
        {profile && (
          <TouchableOpacity
            style={styles.editToggleButton}
            onPress={handleEditToggle}
            disabled={saving}
          >
            <Ionicons
              name={editMode ? 'close' : 'create'}
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Account Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Info</Text>
        <ProfileRow icon="person-circle-outline" label="User ID" value={auth.uid} />
        <ProfileRow icon="mail-outline" label="Email" value={auth.email} />
      </View>

      {/* Personal Details Card - View or Edit Mode */}
      {profile ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Details</Text>

          {editMode ? (
            // Edit mode
            <>
              <EditField
                label="Full Name"
                icon="person-outline"
                value={editData.displayName}
                field="displayName"
                placeholder="Enter your full name"
              />

              <View style={styles.editFieldContainer}>
                <View style={styles.editLabelContainer}>
                  <Ionicons name="male-female-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={styles.editLabel}>Gender</Text>
                </View>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={editData.gender || ''}
                    onValueChange={(value) => setEditData({ ...editData, gender: value })}
                    enabled={!saving}
                  >
                    <Picker.Item label="Select gender" value="" />
                    <Picker.Item label="Male" value="male" />
                    <Picker.Item label="Female" value="female" />
                    <Picker.Item label="Other" value="other" />
                  </Picker>
                </View>
              </View>

              <EditField
                label="Age"
                icon="calendar-outline"
                value={editData.age}
                field="age"
                placeholder="Enter your age"
              />

              <EditField
                label="Phone"
                icon="call-outline"
                value={editData.phone}
                field="phone"
                placeholder="Enter your phone number"
              />

              <EditField
                label="City"
                icon="location-outline"
                value={editData.city}
                field="city"
                placeholder="Enter your city"
              />

              <EditField
                label="Country"
                icon="flag-outline"
                value={editData.country}
                field="country"
                placeholder="Enter your country"
              />

              {/* Save / Cancel buttons */}
              <View style={styles.editButtonRow}>
                <TouchableOpacity
                  style={[styles.editActionButton, styles.saveButton]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.editActionButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.editActionButton, styles.cancelButton]}
                  onPress={handleEditToggle}
                  disabled={saving}
                >
                  <Ionicons name="close" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.editActionButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // View mode
            <>
              <ProfileRow icon="person-outline" label="Full Name" value={profile.displayName} />
              <ProfileRow icon="male-female-outline" label="Gender" value={profile.gender} />
              <ProfileRow icon="calendar-outline" label="Age" value={profile.age ?? null} />
              <ProfileRow icon="call-outline" label="Phone" value={profile.phone} />
              <ProfileRow icon="location-outline" label="City" value={profile.city} />
              <ProfileRow icon="flag-outline" label="Country" value={profile.country} />
            </>
          )}
        </View>
      ) : (
        <View style={styles.noticeBox}>
          <Ionicons name="alert-circle-outline" size={24} color={colors.noticeText} style={{ marginRight: 10 }} />
          <Text style={styles.noticeText}>
            Profile not available on server. You may need to register via the app so the server stores your profile (requires Firebase Admin config).
          </Text>
        </View>
      )}

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={saving}>
        <Ionicons name="log-out-outline" size={22} color={colors.cardBackground} style={{ marginRight: 8 }} />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const colors = {
  primary: '#007AFF', // Modern blue (iOS style)
  danger: '#FF3B30', // Red for logout/danger
  background: '#f8f9fa', // Light, subtle background
  cardBackground: '#ffffff',
  textPrimary: '#1c1c1e', // Dark text
  textSecondary: '#8e8e93', // Muted text
  border: '#e5e5e5', // Light border
  noticeBackground: '#fff0f0', // Light red for notices
  noticeText: '#b00020',
};

const styles = StyleSheet.create({
  // Global Styles
  primaryColor: { color: colors.primary },

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  editToggleButton: {
    padding: 10,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    marginLeft: 10,
  },

  // Card styles
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Profile Row (View Mode)
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 15,
  },
  value: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
    maxWidth: '50%',
    textAlign: 'right',
  },

  // Edit Mode Fields
  editFieldContainer: {
    marginBottom: 16,
  },
  editLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  editLabel: {
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 14,
  },
  editInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: colors.background,
    color: colors.textPrimary,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },

  // Edit Action Buttons
  editButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  editActionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editActionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  editActionButtonTextCancel: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },

  // Notice Box
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 15,
    backgroundColor: colors.noticeBackground,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    marginBottom: 20,
  },
  noticeText: {
    flexShrink: 1,
    color: colors.noticeText,
    fontSize: 14,
    lineHeight: 20,
  },

  // Buttons
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.danger,
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  logoutButtonText: {
    color: colors.cardBackground,
    fontWeight: '700',
    fontSize: 16,
  },

  // Login State
  message: {
    fontSize: 18,
    marginBottom: 20,
    color: colors.textPrimary
  },
  loginButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  loginButtonText: {
    color: colors.cardBackground,
    fontWeight: '700',
    fontSize: 16,
  }
});