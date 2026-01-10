import pool from '../config/postgres';
import { ISkin } from '../types';

export class Skin {
  // Создание скина
  static async create(
    userId: number,
    name: string,
    rarity: string,
    imageUrl: string,
    price: number,
    isUnlocked: boolean = false,
  ): Promise<ISkin> {
    const createdAt = new Date();

    const result = await pool.query(
      'INSERT INTO skins (user_id, name, rarity, image_url, price, is_unlocked, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, name, rarity, imageUrl, price, isUnlocked, createdAt],
    );

    return result.rows[0];
  }

  // Получить все скины пользователя
  static async findByUserId(userId: number): Promise<ISkin[]> {
    const result = await pool.query(
      'SELECT * FROM skins WHERE user_id = $1 ORDER BY created_at DESC',
      [userId],
    );
    return result.rows;
  }

  // Получить скин по ID
  static async findById(id: number): Promise<ISkin | null> {
    const result = await pool.query('SELECT * FROM skins WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  // Получить все доступные скины пользователя
  static async findUnlockedByUserId(userId: number): Promise<ISkin[]> {
    const result = await pool.query(
      'SELECT * FROM skins WHERE user_id = $1 AND is_unlocked = true ORDER BY created_at DESC',
      [userId],
    );
    return result.rows;
  }

  // Разблокировать скин
  static async unlock(skinId: number): Promise<ISkin> {
    const result = await pool.query(
      'UPDATE skins SET is_unlocked = true WHERE id = $1 RETURNING *',
      [skinId],
    );
    return result.rows[0];
  }

  // Обновить скин
  static async update(id: number, data: Partial<ISkin>): Promise<ISkin> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    values.push(id);

    const result = await pool.query(
      `UPDATE skins SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values,
    );

    return result.rows[0];
  }

  // Удалить скин
  static async delete(id: number): Promise<void> {
    await pool.query('DELETE FROM skins WHERE id = $1', [id]);
  }

  // Получить все скины по редкости
  static async findByRarity(userId: number, rarity: string): Promise<ISkin[]> {
    const result = await pool.query(
      'SELECT * FROM skins WHERE user_id = $1 AND rarity = $2 ORDER BY created_at DESC',
      [userId, rarity],
    );
    return result.rows;
  }
}
