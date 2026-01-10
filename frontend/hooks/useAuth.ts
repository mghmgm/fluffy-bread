import { useState, useEffect, useCallback } from 'react';
import { getToken, api } from '../services/apiClient';

export const useAuth = () => {
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const token = await getToken();
      if (token) {
        const userData = await api.getMe();
        setUser(userData.user); 


      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('Не авторизован');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []); // ✅ Пустой массив зависимостей

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const refresh = useCallback(() => {
    setLoading(true);
    checkAuth();
  }, [checkAuth]); // ✅ Зависит от checkAuth

  return { user, loading, refresh };
};
