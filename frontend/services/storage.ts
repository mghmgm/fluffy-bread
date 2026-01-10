import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORE_KEY = 'fluffy-bread/high-score';

// Retrieve the persisted high score for resource management demo.
export const loadHighScore = async (): Promise<number> => {
  try {
    const stored = await AsyncStorage.getItem(HIGH_SCORE_KEY);
    if (!stored) {
      return 0;
    }
    const parsed = Number.parseInt(stored, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch (error) {
    console.warn('Failed to load high score', error);
    return 0;
  }
};

export const persistHighScore = async (score: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(HIGH_SCORE_KEY, score.toString());
  } catch (error) {
    console.warn('Failed to persist high score', error);
  }
};

export const resetHighScore = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(HIGH_SCORE_KEY);
  } catch (error) {
    console.warn('Failed to reset high score', error);
  }
};
