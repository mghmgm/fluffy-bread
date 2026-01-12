import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { initDatabase } from './database/Database';
import { View, Text, TouchableOpacity, StyleSheet, } from 'react-native';
import { getUser, removeUser, removeToken, api } from '../services/apiClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AudioSettingsProvider } from '@/hooks/useAudioSettings';

export default function RootLayout() {
  const [user, setUser] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    initDatabase();
    const load = async () => {
      const u = await getUser();
      setUser(u);
    };
    load();
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    await removeToken();
    await removeUser();
    setUser(null);
    router.replace('/');
  };

  return (
    <AudioSettingsProvider>
      {/* <SafeAreaView edges={['top', 'left', 'right']} />
        <View style={styles.header}>
          <Text style={styles.title}>Fluffy Bread</Text>
          <View style={styles.actions}>
            {user ? (
              <>
                <Text style={styles.username}>{user.username}</Text>
                <TouchableOpacity style={styles.btn} onPress={handleLogout}>
                  <Text style={styles.btnText}>Выйти</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.btn} onPress={() => router.push('/login')}>
                  <Text style={styles.btnText}>Войти</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={() => router.push('/register')}>
                  <Text style={styles.btnText}>Регистрация</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View> */}

      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="achievements"
          options={{
            presentation: 'transparentModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="skins"
          options={{
            presentation: 'transparentModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            presentation: 'transparentModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            presentation: 'transparentModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'transparentModal',
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </AudioSettingsProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    backgroundColor: '#f1c27d',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3d2c1f',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    backgroundColor: '#3d2c1f',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  btnText: {
    color: '#fff4dc',
    fontWeight: '700',
  },
  username: {
    color: '#3d2c1f',
    fontWeight: '700',
  },
});
