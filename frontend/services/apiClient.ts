import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://fluffy-bread.onrender.com/api'; // Облако
// const API_URL = 'http://10.0.2.2:3000/api'; // Android эмулятор
// const API_URL = 'http://localhost:3000/api'; // iOS симулятор

const TOKEN_KEY = 'fluffy-bread/auth-token';
const USER_KEY = 'fluffy-bread/user';

// Сохранение токена
export const saveToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

// Получение токена
export const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

// Удаление токена
export const removeToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

// Сохранение пользователя
export const saveUser = async (user: any): Promise<void> => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Получение пользователя
export const getUser = async (): Promise<any> => {
  const user = await AsyncStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

// Удаление пользователя
export const removeUser = async (): Promise<void> => {
  await AsyncStorage.removeItem(USER_KEY);
};

// Базовый fetch с авторизацией
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка сервера');
  }

  return response.json();
};

// API методы
export const api = {
  // === АВТОРИЗАЦИЯ ===
  register: async (username: string, email: string, password: string) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    await saveToken(data.token);
    await saveUser(data.user);
    return data;
  },

  login: async (email: string, password: string) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await saveToken(data.token);
    await saveUser(data.user);
    return data;
  },

  logout: async () => {
    await removeToken();
    await removeUser();
  },

  getMe: async () => {
    return apiRequest('/auth/me');
  },

  // === ДОСТИЖЕНИЯ ===
  getAchievements: async () => {
    return apiRequest('/achievements');
  },

  getUserAchievements: async () => {
    return apiRequest('/achievements/user');
  },

  unlockAchievement: async (achievementId: number) => {
    return apiRequest(`/achievements/${achievementId}/unlock`, {
      method: 'POST',
    });
  },

  getAchievementStats: async () => {
    return apiRequest('/achievements/stats');
  },

  // === СКИНЫ ===
  getSkins: async () => {
    return apiRequest('/skins');
  },

  getUserSkins: async () => {
    return apiRequest('/skins/user');
  },

  unlockSkin: async (skinId: number) => {
    return apiRequest(`/skins/${skinId}/unlock`, {
      method: 'POST',
    });
  },

  // === НАСТРОЙКИ ===
  getSettings: async () => {
    return apiRequest('/settings');
  },

  updateSettings: async (settings: any) => {
    return apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  updateMusicVolume: async (volume: number) => {
    return apiRequest('/settings/music-volume', {
      method: 'PUT',
      body: JSON.stringify({ musicVolume: volume }),
    });
  },

  updateSoundVolume: async (volume: number) => {
    return apiRequest('/settings/sound-volume', {
      method: 'PUT',
      body: JSON.stringify({ soundVolume: volume }),
    });
  },

  // === ИГРОВЫЕ ДАННЫЕ ===
  saveHighScore: async (score: number) => {
    return apiRequest('/game/high-score', {
      method: 'POST',
      body: JSON.stringify({ score }),
    });
  },

  getHighScore: async () => {
    return apiRequest('/game/high-score');
  },

  // Синхронизация игровых данных
  syncGameData: async (data: {
    localHighScore: number;
    localAchievements: string[];
    localSkins: string[];
  }) => {
    return apiRequest('/game/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // === ПРОФИЛЬ ===
  updateUsername: async (username: string) => {
    return apiRequest('/auth/update-username', {
      method: 'PUT',
      body: JSON.stringify({ username }),
    });
  },

  deleteProgress: async () => {
    return apiRequest('/auth/progress', {
      method: 'DELETE',
    });
  },
};
