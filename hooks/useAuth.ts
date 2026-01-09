import { useState, useEffect } from 'react';
import { getToken, api } from '../services/apiClient';

export const useAuth = () => {
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (token) {
        const userData = await api.getMe();
        setUser(userData);
      }
    } catch (error) {
      console.log('Не авторизован');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    setLoading(true);
    checkAuth();
  };

  return { user, loading, refresh };
};
