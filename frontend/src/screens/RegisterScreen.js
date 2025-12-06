import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../services/api';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (!email || !username || !password) {
      Alert.alert('Error', 'Email, username and password are required');
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      Alert.alert('Error', 'Username must be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }

    setLoading(true);
    try {
      const profile = {
        displayName: displayName || undefined,
        gender: gender || undefined,
        age: age ? parseInt(age) : undefined,
        phone: phone || undefined,
        location: location || undefined,
        city: city || undefined,
        country: country || undefined
      };

      // Remove undefined fields
      Object.keys(profile).forEach(key => profile[key] === undefined && delete profile[key]);

      console.log('[RegisterScreen] Registering with username and profile:', username, profile);
      const res = await api.auth.register(email, username, password, profile);
      console.log('[RegisterScreen] Register response:', res);
      
      Alert.alert('Success', `Account created! Username: @${res.user?.username || username}`);
      navigation.navigate('Login');
    } catch (e) {
      console.error('[RegisterScreen] Register error:', e);
      Alert.alert('Registration failed', e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      {/* Required fields */}
      <Text style={styles.sectionTitle}>Required</Text>
      <TextInput
        style={styles.input}
        placeholder="Email *"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Username * (3-20 chars, letters, numbers, underscore)"
        value={username}
        onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password * (min 6 characters)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />

      {/* Optional profile fields */}
      <Text style={styles.sectionTitle}>Profile (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={displayName}
        onChangeText={setDisplayName}
        editable={!loading}
      />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={gender} onValueChange={setGender} enabled={!loading}>
          <Picker.Item label="Select gender" value="" />
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
          <Picker.Item label="Other" value="other" />
        </Picker>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Location / Address"
        value={location}
        onChangeText={setLocation}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="City"
        value={city}
        onChangeText={setCity}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Country"
        value={country}
        onChangeText={setCountry}
        editable={!loading}
      />

      {/* Submit button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
      </TouchableOpacity>

      {/* Login link */}
      <TouchableOpacity
        style={styles.link}
        onPress={() => navigation.navigate('Login')}
        disabled={loading}
      >
        <Text style={styles.linkText}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, color: '#1f2937' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 12, color: '#374151' },
  label: { fontSize: 14, fontWeight: '500', marginTop: 12, marginBottom: 6, color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    overflow: 'hidden'
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { marginTop: 16, alignItems: 'center', paddingBottom: 20 },
  linkText: { color: '#2563eb', fontSize: 14 }
});
