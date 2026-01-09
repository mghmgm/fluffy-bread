import { db } from '../config/database';
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

    const stmt = db.prepare(`
      INSERT INTO users (username, email, password, created_at)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(username, email, hashedPassword, createdAt);
    
    return {
      id: result.lastInsertRowid as number,
      username,
      email,
      password: hashedPassword,
      createdAt,
    };
  }

  // Поиск по email
  static findByEmail(email: string): IUser | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as IUser | undefined;
  }

  // Поиск по ID
  static findById(id: number): IUser | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as IUser | undefined;
  }

  // Поиск по username
  static findByUsername(username: string): IUser | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as IUser | undefined;
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
