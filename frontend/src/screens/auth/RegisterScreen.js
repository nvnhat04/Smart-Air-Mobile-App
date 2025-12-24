import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AuthButton from '../../components/auth/AuthButton';
import AuthTextInput from '../../components/auth/AuthTextInput';
import useRegisterForm from '../../hooks/auth/useRegisterForm';

import { scaleFont } from '../../constants/responsive';
export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();
  const { values, loading, error, setField, submit } = useRegisterForm({
    onSuccess: () => navigation.navigate('Login'),
  });

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

          <AuthTextInput
            icon="mail"
            placeholder="Email"
            value={values.email}
            onChangeText={(val) => setField('email', val)}
            editable={!loading}
          />

          <AuthTextInput
            icon="at-sign"
            placeholder="Username (3-20 ký tự)"
            value={values.username}
            onChangeText={(text) =>
              setField('username', text.toLowerCase().replace(/[^a-z0-9_]/g, ''))
            }
            editable={!loading}
          />

          <AuthTextInput
            icon="lock"
            placeholder="Mật khẩu (tối thiểu 6 ký tự)"
            value={values.password}
            onChangeText={(val) => setField('password', val)}
            secureTextEntry
            showSecure={showPassword}
            onToggleSecure={() => setShowPassword((prev) => !prev)}
            editable={!loading}
          />
        </View>

        {/* Optional profile fields */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="user" size={16} color="#8b5cf6" />
            <Text style={[styles.sectionTitle, { color: '#8b5cf6' }]}>
              Thông tin cá nhân (Tùy chọn)
            </Text>
          </View>

          <AuthTextInput
            icon="user"
            placeholder="Họ và tên"
            value={values.displayName}
            onChangeText={(val) => setField('displayName', val)}
            editable={!loading}
            autoCapitalize="words"
          />

          <View style={styles.inputContainerWithPicker}>
            <Feather name="users" size={20} color="#64748b" style={styles.inputIcon} />
            <Picker
              selectedValue={values.gender}
              onValueChange={(val) => setField('gender', val)}
              enabled={!loading}
              style={styles.picker}
            >
              <Picker.Item label="Giới tính" value="" />
              <Picker.Item label="Nam" value="male" />
              <Picker.Item label="Nữ" value="female" />
              <Picker.Item label="Khác" value="other" />
            </Picker>
          </View>

          <View style={styles.inputContainerWithPicker}>
            <Feather name="shield" size={20} color="#64748b" style={styles.inputIcon} />
            <Picker
              selectedValue={values.group}
              onValueChange={(val) => setField('group', val)}
              enabled={!loading}
              style={styles.picker}
            >
              <Picker.Item label="Nhóm người (Tùy chọn)" value="" />
              <Picker.Item label="Bình thường" value="normal" />
              <Picker.Item label="Nhạy cảm" value="sensitive" />
            </Picker>
          </View>

          <AuthTextInput
            icon="calendar"
            placeholder="Tuổi"
            value={values.age}
            onChangeText={(val) => setField('age', val)}
            keyboardType="numeric"
            editable={!loading}
          />

          <AuthTextInput
            icon="phone"
            placeholder="Số điện thoại"
            value={values.phone}
            onChangeText={(val) => setField('phone', val)}
            keyboardType="phone-pad"
            editable={!loading}
          />

          <AuthTextInput
            icon="map-pin"
            placeholder="Địa chỉ"
            value={values.location}
            onChangeText={(val) => setField('location', val)}
            editable={!loading}
          />

          <AuthTextInput
            icon="map"
            placeholder="Thành phố"
            value={values.city}
            onChangeText={(val) => setField('city', val)}
            editable={!loading}
          />

          <AuthTextInput
            icon="globe"
            placeholder="Quốc gia"
            value={values.country}
            onChangeText={(val) => setField('country', val)}
            editable={!loading}
          />
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={16} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Submit button */}
        <AuthButton title="Tạo tài khoản" loading={loading} onPress={submit} />

        {/* Login link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Đã có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
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
    fontSize: scaleFont(28), 
    fontWeight: '800', 
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: scaleFont(15),
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
    fontSize: scaleFont(16), 
    fontWeight: '700', 
    color: '#3b82f6',
  },
  inputContainerWithPicker: {
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
    paddingRight: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  picker: {
    flex: 1,
    color: '#0f172a',
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
    fontSize: scaleFont(15),
    marginLeft: 8,
    flex: 1,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 30,
    marginTop: 8,
  },
  footerText: {
    color: '#64748b',
    fontSize: scaleFont(15),
  },
  linkText: { 
    color: '#3b82f6',
    fontWeight: '700',
    fontSize: scaleFont(15),
  },
});


