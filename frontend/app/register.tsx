import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../services/apiClient';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен быть минимум 6 символов');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const response = await api.register(username, email, password);

      Alert.alert(
        'Успех! 🎉',
        `Добро пожаловать, ${response.user.username}!\n\nВаш прогресс теперь сохраняется в облаке.`,
        [{ text: 'Начать игру', onPress: () => router.replace('/') }],
      );
    } catch (error: any) {
      Alert.alert('Ошибка регистрации', error.message || 'Попробуйте другой email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Заголовок */}
        <Text style={styles.title}>🍞 Регистрация</Text>
        <Text style={styles.subtitle}>Создайте аккаунт для синхронизации</Text>

        {/* Форма */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Имя пользователя"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Пароль (минимум 6 символов)"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Подтвердите пароль"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          {/* Кнопка регистрации */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#3d2c1f" />
            ) : (
              <Text style={styles.buttonText}>Зарегистрироваться</Text>
            )}
          </TouchableOpacity>

          {/* Ссылка на логин */}
          <TouchableOpacity onPress={() => router.push('/login')} disabled={loading}>
            <Text style={styles.link}>
              Уже есть аккаунт? <Text style={styles.linkBold}>Войти</Text>
            </Text>
          </TouchableOpacity>

          {/* Кнопка назад */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>← Назад в меню</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff4dc',
    textAlign: 'center',
    textShadowColor: '#3d2c1f',
    textShadowRadius: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffe4ad',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#f1c27d',
  },
  button: {
    backgroundColor: '#f1c27d',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3d2c1f',
  },
  link: {
    textAlign: 'center',
    color: '#fff4dc',
    fontSize: 14,
    marginTop: 8,
  },
  linkBold: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  backButton: {
    marginTop: 16,
    padding: 12,
  },
  backButtonText: {
    textAlign: 'center',
    color: '#ffe4ad',
    fontSize: 14,
  },
});
