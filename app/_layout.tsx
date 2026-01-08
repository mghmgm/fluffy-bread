import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { initDatabase } from './database/Database';

export default function RootLayout() {
  useEffect(() => {
      initDatabase();
  }, []);

  useBackgroundMusic();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name='achievements' options={{
          presentation: 'transparentModal',
          animation: 'slide_from_right',
        }} />
      <Stack.Screen name='skins'options={{
          presentation: 'transparentModal',
          animation: 'slide_from_right',
        }}  />
    </Stack>
  );
}
