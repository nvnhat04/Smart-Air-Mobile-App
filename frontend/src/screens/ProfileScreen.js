import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Import icons for a modern touch

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(null);
  const [profile, setProfile] = useState(null);
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
            // Using template literal for API call is generally fine, but ensure 'api.AUTH_BASE' is correct.
            const res = await fetch(`${api.AUTH_BASE}/profile/${authData.uid}`);
            if (res.ok) {
              const json = await res.json();
              setProfile(json.profile || null);
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
    "Confirm Logout", // The title of the alert
    "Are you sure you want to log out of your account?", // The message body
    [
      // The buttons for the alert dialog
      {
        text: "Cancel", // First button (usually a dismissal action)
        style: "cancel" // Applies iOS styling for a cancel action
      },
      {
        text: "Logout", // Second button (the primary action)
        style: "destructive", // Applies iOS styling for a destructive action (often red text)
        onPress: async () => {
          // --- START: Original Logout Logic moved here ---
          try {
            await AsyncStorage.removeItem('auth');
            setAuth(null);
            setProfile(null);
            // Reset navigation stack to prevent going back to the profile screen
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } catch (e) {
            console.error('[ProfileScreen] logout error', e);
            Alert.alert('Logout failed', String(e));
          }
          // --- END: Original Logout Logic moved here ---
        }
      }
    ],
    { cancelable: true } // Allows the user to dismiss the alert by tapping outside
  );
};

  // --- Render logic for different states ---

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

  // Helper component for profile rows
  const ProfileRow = ({ icon, label, value }) => (
    <View style={styles.profileRow}>
      <View style={styles.labelContainer}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value || '—'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Your Profile 👤</Text>
      
      {/* Primary Auth Details Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Info</Text>
        <ProfileRow icon="person-circle-outline" label="User ID" value={auth.uid} />
        <ProfileRow icon="mail-outline" label="Email" value={auth.email} />
      </View>
      
      {/* Server Profile Details Card */}
      {profile ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Details</Text>
          <ProfileRow icon="person-outline" label="Full Name" value={profile.displayName} />
          <ProfileRow icon="male-female-outline" label="Gender" value={profile.gender} />
          <ProfileRow icon="calendar-outline" label="Age" value={profile.age ?? null} />
          <ProfileRow icon="call-outline" label="Phone" value={profile.phone} />
          <ProfileRow icon="location-outline" label="City" value={profile.city} />
          <ProfileRow icon="flag-outline" label="Country" value={profile.country} />
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
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
  primaryColor: { color: colors.primary }, // Use for ActivityIndicator color

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

  // Headings
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 25,
  },

  // Card styles (elevated containers for grouped info)
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 15, // Soft rounded corners
    padding: 20,
    marginBottom: 20,
    // Modern Shadow (subtle lift)
    shadowColor: "#000",
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

  // Profile Row
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

  // Notice Box (Updated)
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

  // Buttons (Updated)
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.danger,
    padding: 15,
    borderRadius: 10, // More rounded
    marginTop: 30,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  logoutButtonText: {
    color: colors.cardBackground, // White text
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