import { Request, Response } from 'express';
import { User } from '../models/User';
import { Settings } from '../models/Settings';
import { generateToken } from '../utils/tokenUtils';
import pool from '../config/postgres';

export class AuthController {
  // Регистрация
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;

      // Проверка существования пользователя
      const existingUserByEmail = await User.findByEmail(email);
      if (existingUserByEmail) {
        res.status(400).json({ error: 'Email уже используется' });
        return;
      }

      const existingUserByUsername = await User.findByUsername(username);
      if (existingUserByUsername) {
        res.status(400).json({ error: 'Username уже занят' });
        return;
      }

      // Создание пользователя
      const user = await User.create(username, email, password);

      // Создание настроек по умолчанию
      await Settings.create(user.id);

      // Генерация токена
      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      res.status(201).json({
        user: User.toResponse(user),
        token,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Ошибка регистрации' });
    }
  }

  // Вход
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Поиск пользователя
      const user = await User.findByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Неверный email или пароль' });
        return;
      }

      // Проверка пароля
      const isPasswordValid = await User.comparePassword(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Неверный email или пароль' });
        return;
      }

      // Генерация токена
      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      res.status(200).json({
        user: User.toResponse(user),
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Ошибка входа' });
    }
  }

  // Получить текущего пользователя
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'Пользователь не найден' });
        return;
      }

      res.status(200).json({
        user: User.toResponse(user),
      });
    } catch (error) {
      console.error('GetMe error:', error);
      res.status(500).json({ error: 'Ошибка получения данных' });
    }
  }

  // Выход (опционально)
  static async logout(req: Request, res: Response): Promise<void> {
    res.status(200).json({ message: 'Выход выполнен' });
  }

  // Обновить имя пользователя
  static async updateUsername(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const { username } = req.body;

      if (!username || username.trim().length === 0) {
        res.status(400).json({ error: 'Username не может быть пустым' });
        return;
      }

      // Проверка, что username не занят
      const existingUser = await User.findByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        res.status(400).json({ error: 'Username уже занят' });
        return;
      }

      // Обновляем username
      const user = await User.updateUsername(userId, username);

      res.status(200).json({
        user: User.toResponse(user),
        message: 'Username успешно обновлено',
      });
    } catch (error) {
      console.error('Update username error:', error);
      res.status(500).json({ error: 'Ошибка обновления username' });
    }
  }

  // Удалить прогресс (очистить все высокие баллы)
  static async deleteProgress(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      // Удаляем все игровые записи для пользователя
      await pool.query('DELETE FROM game_scores WHERE user_id = $1', [userId]);

      res.status(200).json({ message: 'Прогресс успешно удален' });
    } catch (error) {
      console.error('Delete progress error:', error);
      res.status(500).json({ error: 'Ошибка удаления прогресса' });
    }
  }

  // Удалить аккаунт
  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      // Получаем пароль
      const { password } = req.body;

      // Проверка пароля (обязательно для безопасности)
      if (!password) {
        res.status(400).json({ error: 'Пароль обязателен' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'Пользователь не найден' });
        return;
      }

      const isPasswordValid = await User.comparePassword(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Неверный пароль' });
        return;
      }

      // Начинаем транзакцию для атомарного удаления всех связанных данных
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Удаляем ВСЕ связанные данные пользователя
        // 1. Сначала проверяем существующие таблицы и удаляем из них данные

        // Проверяем и удаляем из game_scores если таблица существует
        try {
          await client.query('DELETE FROM game_scores WHERE user_id = $1', [userId]);
        } catch (error: any) {
          // Игнорируем ошибку если таблицы не существует
          if (error.code !== '42P01') {
            // 42P01 - таблица не существует
            console.warn('Ошибка при удалении из game_scores:', error.message);
          }
        }

        // Проверяем и удаляем из game_runs если таблица существует
        try {
          await client.query('DELETE FROM game_runs WHERE user_id = $1', [userId]);
        } catch (error: any) {
          // Игнорируем ошибку если таблицы не существует
          if (error.code !== '42P01') {
            console.warn('Ошибка при удалении из game_runs:', error.message);
          }
        }

        // Проверяем и удаляем из user_achievements если таблица существует
        try {
          await client.query('DELETE FROM user_achievements WHERE user_id = $1', [userId]);
        } catch (error: any) {
          // Игнорируем ошибку если таблицы не существует
          if (error.code !== '42P01') {
            console.warn('Ошибка при удалении из user_achievements:', error.message);
          }
        }

        // Проверяем и удаляем из user_skins если таблица существует
        try {
          await client.query('DELETE FROM user_skins WHERE user_id = $1', [userId]);
        } catch (error: any) {
          // Игнорируем ошибку если таблицы не существует
          if (error.code !== '42P01') {
            console.warn('Ошибка при удалении из user_skins:', error.message);
          }
        }

        // Проверяем и удаляем из settings если таблица существует
        try {
          await client.query('DELETE FROM settings WHERE user_id = $1', [userId]);
        } catch (error: any) {
          // Игнорируем ошибку если таблицы не существует
          if (error.code !== '42P01') {
            console.warn('Ошибка при удалении из settings:', error.message);
          }
        }

        // И наконец удаляем самого пользователя
        const result = await client.query('DELETE FROM users WHERE id = $1', [userId]);

        await client.query('COMMIT');

        if (result.rowCount === 0) {
          res.status(404).json({ error: 'Пользователь не найден' });
          return;
        }

        // Возвращаем успешный ответ
        res.status(200).json({
          message: 'Аккаунт успешно удален',
          success: true,
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ error: 'Ошибка удаления аккаунта' });
    }
  }
}
