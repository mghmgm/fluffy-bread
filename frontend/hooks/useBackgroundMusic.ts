import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { Audio } from 'expo-av';

export function useBackgroundMusic(enabled: boolean, volume: number) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // загрузка 1 раз
  useEffect(() => {
    let disposed = false;

    (async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/menumusic.mp3'),
        { shouldPlay: false, isLooping: true, volume } // volume применится при старте
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

  // реагируем на enabled
  useEffect(() => {
    const sound = soundRef.current;
    if (!sound) return;

    (async () => {
      if (!enabled) await sound.pauseAsync();
      else if (AppState.currentState === 'active') await sound.playAsync();
    })();
  }, [enabled]);

  // реагируем на volume
  useEffect(() => {
    const sound = soundRef.current;
    if (!sound) return;
    sound.setVolumeAsync(volume); // менять на лету
  }, [volume]);

  // AppState
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      const sound = soundRef.current;
      if (!sound) return;

      if (state !== 'active') await sound.pauseAsync();
      else if (enabledRef.current) await sound.playAsync();
    });

    return () => sub.remove();
  }, []);
}
