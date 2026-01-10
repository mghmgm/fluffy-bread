// useBackgroundMusic.ts
import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export function useBackgroundMusic() {
  const musicRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,     // играть даже при silent switch на iOS
        staysActiveInBackground: true,  // держать аудиосессию активной в фоне
      });

      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/menumusic.mp3'),
        { shouldPlay: true, isLooping: true, volume: 0.35 }
      );

      if (cancelled) {
        await sound.unloadAsync();
        return;
      }

      musicRef.current = sound;
    })();

    return () => {
      cancelled = true;
      musicRef.current?.unloadAsync();
      musicRef.current = null;
    };
  }, []);
}
