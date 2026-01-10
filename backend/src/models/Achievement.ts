import pool from '../config/postgres';
import { IAchievement, IUserAchievement } from '../types';

export class Achievement {
  // Создание достижения
  static async create(
    name: string,
    description: string,
    icon: string,
    requirement: number,
    points: number,
  ): Promise<IAchievement> {
    const createdAt = new Date();

    const result = await pool.query(
      'INSERT INTO achievements (name, description, icon, requirement, points, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, icon, requirement, points, createdAt],
    );

    return result.rows[0];
  }

  // Получить все достижения
  static async findAll(): Promise<IAchievement[]> {
    const result = await pool.query('SELECT * FROM achievements ORDER BY points DESC');
    return result.rows;
  }

  // Получить достижение по ID
  static async findById(id: number): Promise<IAchievement | null> {
    const result = await pool.query('SELECT * FROM achievements WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  // Получить достижения пользователя
  static async findByUserId(userId: number): Promise<IUserAchievement[]> {
    const result = await pool.query(
      'SELECT ua.*, a.name, a.description, a.icon, a.requirement, a.points FROM user_achievements ua JOIN achievements a ON ua.achievement_id = a.id WHERE ua.user_id = $1 ORDER BY ua.unlocked_at DESC',
      [userId],
    );
    return result.rows;
  }

  // Получить разблокированные достижения пользователя
  static async findUnlockedByUserId(userId: number): Promise<IUserAchievement[]> {
    const result = await pool.query(
      'SELECT ua.*, a.name, a.description, a.icon, a.requirement, a.points FROM user_achievements ua JOIN achievements a ON ua.achievement_id = a.id WHERE ua.user_id = $1 AND ua.is_unlocked = true ORDER BY ua.unlocked_at DESC',
      [userId],
    );
    return result.rows;
  }

  // Проверить есть ли достижение у пользователя
  static async hasUserAchievement(userId: number, achievementId: number): Promise<boolean> {
    const result = await pool.query(
      'SELECT * FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
      [userId, achievementId],
    );
    return result.rows.length > 0;
  }

  // Добавить достижение пользователю
  static async addToUser(userId: number, achievementId: number): Promise<IUserAchievement> {
    const createdAt = new Date();

    const result = await pool.query(
      'INSERT INTO user_achievements (user_id, achievement_id, is_unlocked, unlocked_at, created_at) VALUES ($1, $2, false, null, $3) RETURNING *',
      [userId, achievementId, createdAt],
    );

    return result.rows[0];
  }

  // Разблокировать достижение
  static async unlock(userId: number, achievementId: number): Promise<IUserAchievement> {
    const unlockedAt = new Date();

    const result = await pool.query(
      'UPDATE user_achievements SET is_unlocked = true, unlocked_at = $1 WHERE user_id = $2 AND achievement_id = $3 RETURNING *',
      [unlockedAt, userId, achievementId],
    );

    return result.rows[0];
  }

  // Получить общий прогресс достижений пользователя
  static async getUserAchievementStats(
    userId: number,
  ): Promise<{ total: number; unlocked: number; points: number }> {
    const result = await pool.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN is_unlocked THEN 1 ELSE 0 END) as unlocked, COALESCE(SUM(CASE WHEN is_unlocked THEN a.points ELSE 0 END), 0) as points FROM user_achievements ua LEFT JOIN achievements a ON ua.achievement_id = a.id WHERE ua.user_id = $1',
      [userId],
    );

    const row = result.rows[0];
    return {
      total: parseInt(row.total) || 0,
      unlocked: parseInt(row.unlocked) || 0,
      points: parseInt(row.points) || 0,
    };
  }

  // Обновить достижение
  static async update(id: number, data: Partial<IAchievement>): Promise<IAchievement> {
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
      `UPDATE achievements SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values,
    );

    return result.rows[0];
  }

  // Удалить достижение
  static async delete(id: number): Promise<void> {
    await pool.query('DELETE FROM achievements WHERE id = $1', [id]);
  }
}
