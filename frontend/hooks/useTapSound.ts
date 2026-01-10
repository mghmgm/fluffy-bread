import { Audio } from 'expo-av';

let tapSound: Audio.Sound | null = null;
let loading: Promise<void> | null = null;

export async function initTapSound() {
  if (tapSound) return;

  // защита от параллельных загрузок
  if (loading) return loading;

  loading = (async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/onBreadTap.mp3')
    );
    tapSound = sound;
  })();

  try {
    await loading;
  } finally {
    loading = null;
  }
}

export async function playTapSound() {
  if (!tapSound) {
    await initTapSound();
  }
  await tapSound?.replayAsync();
}

export async function disposeTapSound() {
  await tapSound?.unloadAsync();
  tapSound = null;
}
