import { useCallback, useState } from 'react';
import authService from '../../services/authService';

const emailRegex = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

/**
 * Manage register form state, validation, and submission side-effects.
 */
export default function useRegisterForm({ onSuccess } = {}) {
  const [values, setValues] = useState({
    email: '',
    username: '',
    password: '',
    displayName: '',
    gender: '',
    age: '',
    phone: '',
    location: '',
    city: '',
    country: '',
    group: 'normal',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const validate = useCallback(() => {
    if (!values.email || !values.username || !values.password) {
      setError('Email, username và mật khẩu là bắt buộc');
      return false;
    }
    if (!emailRegex.test(values.email)) {
      setError('Email không hợp lệ. Vui lòng nhập đúng định dạng email.');
      return false;
    }
    if (!usernameRegex.test(values.username)) {
      setError('Username phải có 3-20 ký tự và chỉ chứa chữ, số, gạch dưới');
      return false;
    }
    if (values.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    return true;
  }, [values.email, values.password, values.username]);

  const submit = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const profile = {
        displayName: values.displayName || undefined,
        gender: values.gender || undefined,
        age: values.age ? parseInt(values.age, 10) : undefined,
        phone: values.phone || undefined,
        location: values.location || undefined,
        city: values.city || undefined,
        country: values.country || undefined,
        group: values.group || undefined,
      };
      Object.keys(profile).forEach((key) => profile[key] === undefined && delete profile[key]);

      await authService.register({
        email: values.email,
        username: values.username,
        password: values.password,
        profile,
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      if (typeof err === 'object') {
        let msg = err.message;
        if (!msg) {
          if (err.error) msg = err.error;
          else if (err.detail) msg = err.detail;
          else msg = JSON.stringify(err);
        }
        setError(msg || 'Đăng ký thất bại. Vui lòng thử lại.');
      } else {
        setError(String(err) || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  }, [onSuccess, validate, values]);

  return {
    values,
    loading,
    error,
    setError,
    setField,
    submit,
  };
}


