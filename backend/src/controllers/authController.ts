import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken } from '../utils/tokenUtils';
import { IAuthResponse, IRegisterRequest, ILoginRequest } from '../types';

export class AuthController {
  // Регистрация
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body as IRegisterRequest;

      // Валидация
      if (!username || !email || !password) {
        res.status(400).json({ error: 'Все поля обязательны' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
        return;
      }

      // Проверка существования
      const existingUser = User.findByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: 'Email уже зарегистрирован' });
        return;
      }

      const existingUsername = User.findByUsername(username);
      if (existingUsername) {
        res.status(409).json({ error: 'Username уже занят' });
        return;
      }

      // Создание пользователя
      const user = await User.create(username, email, password);
      const token = generateToken({ userId: user.id, email: user.email });

      const response: IAuthResponse = {
        user: User.toResponse(user),
        token,
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }

  // Логин
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as ILoginRequest;

      // Валидация
      if (!email || !password) {
        res.status(400).json({ error: 'Email и пароль обязательны' });
        return;
      }

      // Поиск пользователя
      const user = User.findByEmail(email);
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
      const token = generateToken({ userId: user.id, email: user.email });

      const response: IAuthResponse = {
        user: User.toResponse(user),
        token,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Ошибка входа:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }

  // Получение текущего пользователя
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const user = User.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'Пользователь не найден' });
        return;
      }

      res.status(200).json(User.toResponse(user));
    } catch (error) {
      console.error('Ошибка получения профиля:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ message: 'Успешный выход' });
    } catch (error) {
      console.error('Ошибка выхода:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }

}
