import { Audio } from 'expo-av';

let tapSound: Audio.Sound | null = null;
let loading: Promise<void> | null = null;

export async function initTapSound() {
  if (tapSound) return;
  if (loading) return loading;

  loading = (async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/onBreadTap.mp3'),
      { shouldPlay: false }
    );
    tapSound = sound;
  })();

  try {
    await loading;
  } finally {
    loading = null;
  }
}

export async function playTapSound(volume: number) {
  if (volume <= 0) return;
  if (!tapSound) await initTapSound();

  await tapSound?.setVolumeAsync(volume);
  await tapSound?.replayAsync();
}

export async function disposeTapSound() {
  await tapSound?.unloadAsync();
  tapSound = null;
}
