import pool from '../config/postgres';
import bcrypt from 'bcrypt';
import { IUser, IUserResponse } from '../types';

export class User {
  // Создание пользователя
  static async create(
    username: string,
    email: string,
    password: string
  ): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = Date.now();

    const result = await pool.query(
      'INSERT INTO users (username, email, password, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, email, hashedPassword, createdAt]
    );

    return result.rows[0];
  }

  // Поиск по email
  static async findByEmail(email: string): Promise<IUser | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  // Поиск по ID
  static async findById(id: number): Promise<IUser | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  // Поиск по username
  static async findByUsername(username: string): Promise<IUser | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  }

  // Проверка пароля
  static async comparePassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
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
}
