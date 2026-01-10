import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './apiClient';
import { getOwnedSkins, getAchievements } from './gameApi';
import { loadHighScore } from './storage';

export const syncWithServer = async (): Promise<void> => {
  try {
    // 1. Получаем локальные данные
    const localHighScore = await loadHighScore();
    const localAchievementsObj = await getAchievements();
    const localSkins = await getOwnedSkins();
    
    const localAchievements = Object.keys(localAchievementsObj).filter(
      key => localAchievementsObj[key]?.unlocked
    );

    // 2. Отправляем на сервер и получаем merged данные
    const merged = await api.syncGameData({
      localHighScore,
      localAchievements,
      localSkins,
    });

    // 3. Обновляем локальное хранилище с сервера
    await AsyncStorage.setItem('fluffy-bread/high-score', merged.highScore.toString());
    
    const newAchievements: any = {};
    merged.achievements.forEach((id: string) => {
      newAchievements[id] = { unlocked: true };
    });
    await AsyncStorage.setItem('fluffy-bread/achievements/state', JSON.stringify(newAchievements));
    
    await AsyncStorage.setItem('fluffy-bread/skins/owned', JSON.stringify(merged.skins));

    console.log('✅ Синхронизация завершена:', merged);
  } catch (error) {
    console.warn('⚠️ Синхронизация не удалась (оффлайн?):', error);
  }
};
