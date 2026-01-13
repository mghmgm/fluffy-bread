import pool from '../config/postgres';
import bcrypt from 'bcrypt';
import { IUser, IUserResponse } from '../types';

export class User {
  // Создание пользователя
  static async create(username: string, email: string, password: string): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = Date.now();

    const result = await pool.query(
      'INSERT INTO users (username, email, password, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, email, hashedPassword, createdAt],
    );

    return result.rows[0];
  }

  // Поиск по email
  static async findByEmail(email: string): Promise<IUser | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  // Поиск по ID
  static async findById(id: number): Promise<IUser | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  // Поиск по username
  static async findByUsername(username: string): Promise<IUser | null> {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  }

  // Проверка пароля
  static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Обновить username
  static async updateUsername(id: number, username: string): Promise<IUser> {
    const result = await pool.query('UPDATE users SET username = $1 WHERE id = $2 RETURNING *', [
      username,
      id,
    ]);
    return result.rows[0];
  }

  // Убрать пароль из ответа
  static toResponse(user: IUser): IUserResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  // Удалить аккаунт
  static async deleteAccountSafe(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const userExists = await this.findById(id);

      if (!userExists) {
        return { success: false, message: 'Пользователь не найден' };
      }

      const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

      // Исправление: добавлена проверка на null и приведение к числу
      if (result.rowCount && result.rowCount > 0) {
        return { success: true, message: 'Аккаунт успешно удален' };
      } else {
        return { success: false, message: 'Не удалось удалить аккаунт' };
      }
    } catch (error) {
      console.error('Ошибка при удалении аккаунта:', error);
      return { success: false, message: 'Внутренняя ошибка сервера' };
    }
  }
}