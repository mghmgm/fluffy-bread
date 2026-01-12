// useBackgroundMusic.ts
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { Audio } from 'expo-av';

export function useBackgroundMusic(enabled: boolean) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Загружаем звук один раз
  useEffect(() => {
    let disposed = false;

    (async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false, // важно: не играть в фоне
      });

      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/menumusic.mp3'),
        { shouldPlay: false, isLooping: true, volume: 0.35 }
      );

      if (disposed) {
        await sound.unloadAsync();
        return;
      }

      soundRef.current = sound;

      if (enabledRef.current && AppState.currentState === 'active') {
        await sound.playAsync();
      }
    })();

    return () => {
      disposed = true;
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, []);

  // Реагируем на включение/выключение музыки (меню/игра)
  useEffect(() => {
    const sound = soundRef.current;
    if (!sound) return;

    (async () => {
      if (!enabled) {
        await sound.pauseAsync();
      } else if (AppState.currentState === 'active') {
        await sound.playAsync();
      }
    })();
  }, [enabled]);

  // Реагируем на сворачивание/возврат приложения
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      const sound = soundRef.current;
      if (!sound) return;

      if (state !== 'active') {
        await sound.pauseAsync();
      } else if (enabledRef.current) {
        await sound.playAsync();
      }
    });

    return () => sub.remove();
  }, []);
}
