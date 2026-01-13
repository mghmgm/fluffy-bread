import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import Slider from '@react-native-community/slider';
import { useFocusEffect, useRouter } from 'expo-router';

import { useAudioSettings } from '@/hooks/useAudioSettings';
import { useAuth } from '../hooks/useAuth';
import { api, removeToken } from '../services/apiClient';
import { useGameResources } from '../hooks/useGameResources'; // чтобы сбросить рекорд локально

export default function SettingsScreen() {
  const router = useRouter();

  // Громкости
  const { musicVolume, sfxVolume, setMusicVolume, setSfxVolume, ready } = useAudioSettings();

  // Авторизация
  const { user, loading: authLoading, refresh: refreshAuth } = useAuth();

  // Ресурсы игры (для обновления highScore)
  const { updateHighScore } = useGameResources();

  const [editUsername, setEditUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  // При каждом заходе в настройки обновляем auth
  useFocusEffect(
    useCallback(() => {
      refreshAuth();
    }, [refreshAuth])
  );

  // Подставляем текущее имя в инпут
  useEffect(() => {
    setEditUsername(user?.username ?? '');
  }, [user?.username]);

  const handleSaveUsername = useCallback(async () => {
    if (!user) return;

    const next = editUsername.trim();
    if (!next) {
      Alert.alert('Ошибка', 'Имя не может быть пустым');
      return;
    }
    if (next === user.username) {
      Alert.alert('Ок', 'Имя не изменилось');
      return;
    }

    try {
      setSaving(true);
      await api.updateUsername(next);
      await refreshAuth();
      Alert.alert('Успех', 'Имя обновлено');
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось обновить имя');
      setEditUsername(user.username);
    } finally {
      setSaving(false);
    }
  }, [editUsername, refreshAuth, user]);

  const handleLogout = useCallback(async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    await removeToken();
    await refreshAuth();
    Alert.alert('Выход', 'Вы вышли из аккаунта');
    router.back();
  }, [refreshAuth, router]);

  const handleDeleteAccount = useCallback(async () => {
    if (!password.trim()) {
      Alert.alert('Ошибка', 'Введите пароль для подтверждения');
      return;
    }

    try {
      setDeleting(true);
      await api.deleteAccount({ password });
      
      await removeToken();
      await refreshAuth();
      
      setDeleteModalVisible(false);
      setPassword('');
      
      Alert.alert(
        'Аккаунт удален',
        'Ваш аккаунт и все данные были успешно удалены.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/');
            }
          }
        ]
      );
    } catch (e: any) {
      Alert.alert('Ошибка', e?.response?.data?.error || 'Не удалось удалить аккаунт');
    } finally {
      setDeleting(false);
    }
  }, [password, refreshAuth, router]);

  const openDeleteModal = useCallback(() => {
    Alert.alert(
      'Удаление аккаунта',
      'Это действие удалит:\n\n• Ваш аккаунт\n• Все игровые данные\n• Настройки\n\nЭто действие НЕОБРАТИМО!\n\nПродолжить?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Продолжить',
          style: 'destructive',
          onPress: () => setDeleteModalVisible(true)
        }
      ]
    );
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModalVisible(false);
    setPassword('');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Настройки</Text>

      <View style={styles.block}>
        <Text style={styles.label}>
          Громкость музыки: {Math.round(musicVolume * 100)}%
        </Text>
        <Slider
          disabled={!ready}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={musicVolume}
          onValueChange={setMusicVolume}
        />
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>
          Громкость звуков: {Math.round(sfxVolume * 100)}%
        </Text>
        <Slider
          disabled={!ready}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={sfxVolume}
          onValueChange={setSfxVolume}
        />
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Аккаунт</Text>

        {authLoading ? (
          <Text style={styles.muted}>Загрузка...</Text>
        ) : user ? (
          <>
            <Text style={styles.muted}>Вы вошли как: {user.username}</Text>
            <Text style={styles.muted}>Email: {user.email}</Text>

            <TextInput
              style={styles.input}
              value={editUsername}
              onChangeText={setEditUsername}
              placeholder="Новое имя"
              editable={!saving}
              placeholderTextColor="#999"
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.btn, saving && styles.btnDisabled]}
                onPress={handleSaveUsername}
                disabled={saving}
              >
                <Text style={styles.btnText}>{saving ? 'Сохранение...' : 'Сохранить'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btn} onPress={handleLogout}>
                <Text style={styles.btnText}>Выйти</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.btn, styles.danger]} onPress={openDeleteModal}>
              <Text style={styles.btnText}>Удалить аккаунт</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.row}>
            <TouchableOpacity style={styles.btn} onPress={() => router.push('/login')}>
              <Text style={styles.btnText}>Войти</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => router.push('/register')}>
              <Text style={styles.btnText}>Регистрация</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Вернуться в меню</Text>
      </TouchableOpacity>

      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDeleteModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Подтверждение удаления</Text>
            
            <Text style={styles.modalText}>
              Это действие необратимо. Все ваши данные будут удалены.
            </Text>

            <Text style={styles.modalWarning}>
              Введите ваш пароль для подтверждения:
            </Text>
            <TextInput
              style={styles.modalInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Пароль"
              placeholderTextColor="#999"
              secureTextEntry
              editable={!deleting}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={closeDeleteModal}
                disabled={deleting}
              >
                <Text style={styles.modalButtonText}>Отмена</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={handleDeleteAccount}
                disabled={deleting || !password.trim()}
              >
                <Text style={styles.modalButtonText}>
                  {deleting ? 'Удаление...' : 'Удалить аккаунт'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff4dc', padding: 16, gap: 14, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: '800', color: '#3d2c1f' },

  block: {
    backgroundColor: 'rgba(241, 194, 125, 0.25)',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  blockTitle: { fontSize: 16, fontWeight: '800', color: '#3d2c1f' },
  label: { color: '#3d2c1f', fontWeight: '700' },
  muted: { color: '#3d2c1f', opacity: 0.8 },

  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d4a574',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#3d2c1f',
  },

  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },

  btn: {
    backgroundColor: '#3d2c1f',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnText: { color: '#fff4dc', fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  warning: { backgroundColor: '#ff9500' },
  danger: { backgroundColor: '#e63946' },
  
  backButton: {
    marginTop: 16,
    padding: 12,
  },
  backButtonText: {
    textAlign: 'center',
    color: '#3d2c1f',
    fontSize: 14,
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff4dc',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e63946',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#3d2c1f',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalWarning: {
    fontSize: 14,
    color: '#e63946',
    fontWeight: '600',
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e63946',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#3d2c1f',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#666',
  },
  modalDeleteButton: {
    backgroundColor: '#e63946',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});