import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
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

  const handleDeleteProgress = useCallback(() => {
    Alert.alert(
      'Удалить прогресс',
      'Это действие удалит все ваши игровые записи. Это нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteProgress();
              await updateHighScore(0);
              Alert.alert('Успех', 'Прогресс удалён');
            } catch (e) {
              Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось удалить прогресс');
            }
          },
        },
      ]
    );
  }, [updateHighScore]);

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

            <TouchableOpacity style={[styles.btn, styles.danger]} onPress={handleDeleteProgress}>
              <Text style={styles.btnText}>Удалить прогресс</Text>
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

      <TouchableOpacity style={[styles.btn, styles.close]} onPress={() => router.back()}>
        <Text style={styles.btnText}>Закрыть</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff4dc', padding: 16, gap: 14 },
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
  danger: { backgroundColor: '#e63946' },
  close: { alignSelf: 'flex-start' },
});
