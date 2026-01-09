import AsyncStorage from '@react-native-async-storage/async-storage';


const API_URL = 'https://fluffy-bread.onrender.com/api';

const TOKEN_KEY = 'fluffy-bread/auth-token';

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
  // Авторизация
  register: async (username: string, email: string, password: string) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    await saveToken(data.token);
    return data;
  },

  login: async (email: string, password: string) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await saveToken(data.token);
    return data;
  },

  logout: async () => {
    await apiRequest('/auth/logout', {
      method: 'POST',
    });
    await removeToken();
  },

  getMe: async () => {
    return apiRequest('/auth/me');
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
};
