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
    const client = await pool.connect();

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

      console.log(`Начинаем удаление пользователя ID: ${userId}`);

      // Начинаем транзакцию
      await client.query('BEGIN');

      try {
        // 1. Удаляем связанные данные в правильном порядке

        // Сначала удаляем из user_achievements (есть foreign key на users)
        try {
          const result = await client.query('DELETE FROM user_achievements WHERE user_id = $1', [
            userId,
          ]);
          console.log(`Удалено ${result.rowCount} записей из user_achievements`);
        } catch (error: any) {
          // Если таблицы нет - игнорируем
          if (error.code === '42P01') {
            console.log('Таблица user_achievements не существует, пропускаем');
          } else {
            throw error;
          }
        }

        // Удаляем из skins
        try {
          const result = await client.query('DELETE FROM skins WHERE user_id = $1', [userId]);
          console.log(`Удалено ${result.rowCount} записей из skins`);
        } catch (error: any) {
          if (error.code === '42P01') {
            console.log('Таблица skins не существует, пропускаем');
          } else {
            throw error;
          }
        }

        // Удаляем из settings
        try {
          const result = await client.query('DELETE FROM settings WHERE user_id = $1', [userId]);
          console.log(`Удалено ${result.rowCount} записей из settings`);
        } catch (error: any) {
          if (error.code === '42P01') {
            console.log('Таблица settings не существует, пропускаем');
          } else {
            throw error;
          }
        }

        // И наконец удаляем самого пользователя
        const deleteResult = await client.query('DELETE FROM users WHERE id = $1', [userId]);

        if (deleteResult.rowCount === 0) {
          await client.query('ROLLBACK');
          res.status(404).json({ error: 'Пользователь не найден' });
          return;
        }

        // Фиксируем транзакцию
        await client.query('COMMIT');

        console.log(`Пользователь ID: ${userId} успешно удален`);

        // Возвращаем успешный ответ
        res.status(200).json({
          message: 'Аккаунт успешно удален',
          success: true,
        });
      } catch (error) {
        // Откатываем транзакцию в случае ошибки
        await client.query('ROLLBACK');
        throw error;
      }
    } catch (error: any) {
      console.error('Delete account error:', error);

      // Проверяем тип ошибки
      if (error.code === '23503') {
        // Ошибка внешнего ключа
        res.status(400).json({
          error:
            'Не удалось удалить аккаунт из-за связанных данных. Пожалуйста, сначала удалите все связанные записи.',
        });
      } else {
        res.status(500).json({ error: 'Ошибка удаления аккаунта' });
      }
    } finally {
      // Всегда освобождаем соединение
      client.release();
    }
  }
}
