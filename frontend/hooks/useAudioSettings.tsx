import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AudioSettings = {
  musicVolume: number; // 0..1
  sfxVolume: number;   // 0..1
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  ready: boolean;
};

const AudioSettingsContext = createContext<AudioSettings | null>(null);

const KEY = 'audio_settings_v1';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function AudioSettingsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [musicVolume, setMusicVolumeState] = useState(0.35);
  const [sfxVolume, setSfxVolumeState] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (cancelled) return;

      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.musicVolume === 'number') setMusicVolumeState(clamp01(parsed.musicVolume));
        if (typeof parsed.sfxVolume === 'number') setSfxVolumeState(clamp01(parsed.sfxVolume));
      }
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(KEY, JSON.stringify({ musicVolume, sfxVolume }));
  }, [ready, musicVolume, sfxVolume]);

  const value = useMemo<AudioSettings>(
    () => ({
      musicVolume,
      sfxVolume,
      setMusicVolume: (v) => setMusicVolumeState(clamp01(v)),
      setSfxVolume: (v) => setSfxVolumeState(clamp01(v)),
      ready,
    }),
    [musicVolume, sfxVolume, ready]
  );

  return <AudioSettingsContext.Provider value={value}>{children}</AudioSettingsContext.Provider>;
}

export function useAudioSettings() {
  const ctx = useContext(AudioSettingsContext);
  if (!ctx) throw new Error('useAudioSettings must be used within AudioSettingsProvider');
  return ctx;
}
