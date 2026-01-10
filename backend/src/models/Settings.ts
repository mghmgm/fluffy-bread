import pool from '../config/postgres';
import { ISettings } from '../types';

export class Settings {
  // Создание настроек для пользователя
  static async create(
    userId: number,
    musicVolume: number = 0.8,
    soundVolume: number = 0.8,
    isNotificationsEnabled: boolean = true,
    isDarkMode: boolean = false,
    language: string = 'en',
  ): Promise<ISettings> {
    const createdAt = new Date();
    const updatedAt = new Date();

    const result = await pool.query(
      'INSERT INTO settings (user_id, music_volume, sound_volume, is_notifications_enabled, is_dark_mode, language, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        userId,
        musicVolume,
        soundVolume,
        isNotificationsEnabled,
        isDarkMode,
        language,
        createdAt,
        updatedAt,
      ],
    );

    return result.rows[0];
  }

  // Получить настройки пользователя
  static async findByUserId(userId: number): Promise<ISettings | null> {
    const result = await pool.query('SELECT * FROM settings WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  }

  // Получить настройки по ID
  static async findById(id: number): Promise<ISettings | null> {
    const result = await pool.query('SELECT * FROM settings WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  // Обновить настройки
  static async update(userId: number, data: Partial<ISettings>): Promise<ISettings> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(userId);

    const result = await pool.query(
      `UPDATE settings SET ${fields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
      values,
    );

    return result.rows[0];
  }

  // Обновить громкость музыки
  static async updateMusicVolume(userId: number, volume: number): Promise<ISettings> {
    const updatedAt = new Date();

    const result = await pool.query(
      'UPDATE settings SET music_volume = $1, updated_at = $2 WHERE user_id = $3 RETURNING *',
      [volume, updatedAt, userId],
    );

    return result.rows[0];
  }

  // Обновить громкость звука
  static async updateSoundVolume(userId: number, volume: number): Promise<ISettings> {
    const updatedAt = new Date();

    const result = await pool.query(
      'UPDATE settings SET sound_volume = $1, updated_at = $2 WHERE user_id = $3 RETURNING *',
      [volume, updatedAt, userId],
    );

    return result.rows[0];
  }

  // Включить/выключить уведомления
  static async updateNotifications(userId: number, isEnabled: boolean): Promise<ISettings> {
    const updatedAt = new Date();

    const result = await pool.query(
      'UPDATE settings SET is_notifications_enabled = $1, updated_at = $2 WHERE user_id = $3 RETURNING *',
      [isEnabled, updatedAt, userId],
    );

    return result.rows[0];
  }

  // Включить/выключить темный режим
  static async updateDarkMode(userId: number, isDarkMode: boolean): Promise<ISettings> {
    const updatedAt = new Date();

    const result = await pool.query(
      'UPDATE settings SET is_dark_mode = $1, updated_at = $2 WHERE user_id = $3 RETURNING *',
      [isDarkMode, updatedAt, userId],
    );

    return result.rows[0];
  }

  // Изменить язык
  static async updateLanguage(userId: number, language: string): Promise<ISettings> {
    const updatedAt = new Date();

    const result = await pool.query(
      'UPDATE settings SET language = $1, updated_at = $2 WHERE user_id = $3 RETURNING *',
      [language, updatedAt, userId],
    );

    return result.rows[0];
  }

  // Удалить настройки
  static async delete(userId: number): Promise<void> {
    await pool.query('DELETE FROM settings WHERE user_id = $1', [userId]);
  }
}
