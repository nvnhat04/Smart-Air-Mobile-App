import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../services/api';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (!email || !username || !password) {
      setError('Email, username và mật khẩu là bắt buộc');
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError('Username phải có 3-20 ký tự và chỉ chứa chữ, số, gạch dưới');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    setError(''); // Clear previous error
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
      
      Alert.alert('Thành công', `Tài khoản đã được tạo! Username: @${res.user?.username || username}`);
      navigation.navigate('Login');
    } catch (e) {
      console.error('[RegisterScreen] Register error:', e);
      setError(e.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Feather name="user-plus" size={40} color="#3b82f6" />
          </View>
          <Text style={styles.title}>Tạo tài khoản mới</Text>
          <Text style={styles.subtitle}>Đăng ký để trải nghiệm SmartAir</Text>
        </View>

        {/* Required fields */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="alert-circle" size={16} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Thông tin bắt buộc</Text>
          </View>

          <View style={styles.inputContainer}>
            <Feather name="mail" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="at-sign" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username (3-20 ký tự)"
              placeholderTextColor="#94a3b8"
              value={username}
              onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="lock" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Feather 
                name={showPassword ? 'eye' : 'eye-off'} 
                size={20} 
                color="#94a3b8" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Optional profile fields */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="user" size={16} color="#8b5cf6" />
            <Text style={[styles.sectionTitle, { color: '#8b5cf6' }]}>Thông tin cá nhân (Tùy chọn)</Text>
          </View>

          <View style={styles.inputContainer}>
            <Feather name="user" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Họ và tên"
              placeholderTextColor="#94a3b8"
              value={displayName}
              onChangeText={setDisplayName}
              editable={!loading}
            />
          </View>

          <View style={[styles.inputContainer, styles.pickerContainer]}>
            <Feather name="users" size={20} color="#64748b" style={styles.inputIcon} />
            <Picker 
              selectedValue={gender} 
              onValueChange={setGender} 
              enabled={!loading}
              style={styles.picker}
            >
              <Picker.Item label="Giới tính" value="" />
              <Picker.Item label="Nam" value="male" />
              <Picker.Item label="Nữ" value="female" />
              <Picker.Item label="Khác" value="other" />
            </Picker>
          </View>

          <View style={styles.inputContainer}>
            <Feather name="calendar" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Tuổi"
              placeholderTextColor="#94a3b8"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="phone" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              placeholderTextColor="#94a3b8"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="map-pin" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Địa chỉ"
              placeholderTextColor="#94a3b8"
              value={location}
              onChangeText={setLocation}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="map" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Thành phố"
              placeholderTextColor="#94a3b8"
              value={city}
              onChangeText={setCity}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="globe" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Quốc gia"
              placeholderTextColor="#94a3b8"
              value={country}
              onChangeText={setCountry}
              editable={!loading}
            />
          </View>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={16} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.buttonText}>Đang tạo tài khoản...</Text>
          ) : (
            <>
              <Text style={styles.buttonText}>Tạo tài khoản</Text>
              <Feather name="arrow-right" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>

        {/* Login link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Đã có tài khoản?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.linkText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#3b82f6',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
  },
  eyeIcon: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  pickerContainer: {
    paddingRight: 8,
  },
  picker: {
    flex: 1,
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: { 
    opacity: 0.6 
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 18 
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 30,
  },
  footerText: {
    color: '#64748b',
    fontSize: 15,
  },
  linkText: { 
    color: '#3b82f6',
    fontWeight: '700',
    fontSize: 15,
  }
});
