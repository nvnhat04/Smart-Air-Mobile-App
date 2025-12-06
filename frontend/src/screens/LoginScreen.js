import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../services/api';

export default function LoginScreen() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!emailOrUsername || !password) {
      Alert.alert('Error', 'Please enter email/username and password');
      return;
    }

    try {
      const data = await api.auth.login(emailOrUsername, password);
      console.log('Login success', data);
      // Save auth info locally
      const authData = {
        access_token: data.access_token,
        token_type: data.token_type,
        uid: data.user?._id || null,
        email: data.user?.email || null,
        username: data.user?.username || null
      };
      await AsyncStorage.setItem('auth', JSON.stringify(authData));
      // Alert.alert('Logged in', `Welcome ${data.user?.username ? '@' + data.user.username : data.user?.email}!`);
      navigation.navigate('MainTabs');
    } catch (e) {
      console.error('Login error', e);
      Alert.alert('Login failed', e.message || String(e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Email or Username" 
        value={emailOrUsername} 
        onChangeText={setEmailOrUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        secureTextEntry 
        value={password} 
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Create an account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12 },
  button: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  link: { marginTop: 12, alignItems: 'center' },
  linkText: { color: '#2563eb' }
});
