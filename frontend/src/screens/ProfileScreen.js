import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useNavigation } from '@react-navigation/native';

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

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('auth');
      setAuth(null);
      setProfile(null);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e) {
      console.error('[ProfileScreen] logout error', e);
      Alert.alert('Logout failed', String(e));
    }
  };

  if (loading) {
    return (
      <View style={styles.containerCenter}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!auth) {
    return (
      <View style={styles.containerCenter}>
        <Text style={styles.message}>Not logged in</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.row}>
        <Text style={styles.label}>User ID</Text>
        <Text style={styles.value}>{auth.uid || '—'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{auth.email || '—'}</Text>
      </View>

      {profile ? (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>Full name</Text>
            <Text style={styles.value}>{profile.displayName || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gender</Text>
            <Text style={styles.value}>{profile.gender || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Age</Text>
            <Text style={styles.value}>{profile.age ?? '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{profile.phone || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>City</Text>
            <Text style={styles.value}>{profile.city || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Country</Text>
            <Text style={styles.value}>{profile.country || '—'}</Text>
          </View>
        </>
      ) : (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>Profile not available on server. You may need to register via the app so the server stores your profile (requires Firebase Admin config).</Text>
        </View>
      )}

      <TouchableOpacity style={[styles.button, { marginTop: 30 }]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  containerCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  label: { color: '#6b7280', fontWeight: '600' },
  value: { color: '#111827', maxWidth: '60%', textAlign: 'right' },
  button: { backgroundColor: '#ef4444', padding: 12, borderRadius: 6, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  message: { fontSize: 16, marginBottom: 12 },
  noticeBox: { marginTop: 12, padding: 12, backgroundColor: '#fff7ed', borderRadius: 6 },
  noticeText: { color: '#92400e' }
});
