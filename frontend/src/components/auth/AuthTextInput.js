import { Feather } from '@expo/vector-icons';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function AuthTextInput({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  editable = true,
  onToggleSecure,
  showSecure = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  ...rest
}) {
  return (
    <View style={styles.inputContainer}>
      {icon ? <Feather name={icon} size={20} color="#64748b" style={styles.inputIcon} /> : null}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry && !showSecure}
        editable={editable}
        {...rest}
      />
      {secureTextEntry ? (
        <TouchableOpacity onPress={onToggleSecure} style={styles.eyeIcon} disabled={!editable}>
          <Feather name={showSecure ? 'eye' : 'eye-off'} size={20} color="#94a3b8" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
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
});

