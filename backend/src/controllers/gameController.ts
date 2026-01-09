import { Request, Response } from 'express';
import pool from '../config/postgres';

export class GameController {
  // MEGA МЕТОД: синхронизация всех данных
  static async syncGameData(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      // Данные с клиента
      const {
        localHighScore,
        localAchievements,
        localSkins
      } = req.body;

      // Получаем данные с сервера
      const serverHighScoreResult = await pool.query(
        'SELECT MAX(score) as max_score FROM game_scores WHERE user_id = $1',
        [userId]
      );
      const serverHighScore = serverHighScoreResult.rows[0]?.max_score || 0;

      const serverAchievementsResult = await pool.query(
        'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
        [userId]
      );
      const serverAchievements = serverAchievementsResult.rows.map(r => r.achievement_id);

      const serverSkinsResult = await pool.query(
        'SELECT skin_id FROM user_skins WHERE user_id = $1',
        [userId]
      );
      const serverSkins = serverSkinsResult.rows.map(r => r.skin_id);

      // MERGE логика
      const mergedHighScore = Math.max(
        localHighScore || 0,
        serverHighScore
      );

      const mergedAchievements = Array.from(new Set([
        ...localAchievements,
        ...serverAchievements
      ]));

      const mergedSkins = Array.from(new Set([
        ...localSkins,
        ...serverSkins
      ]));

      // Сохраняем новые данные на сервер
      if (localHighScore && localHighScore > serverHighScore) {
        await pool.query(
          'INSERT INTO game_scores (user_id, score, created_at) VALUES ($1, $2, $3)',
          [userId, localHighScore, Date.now()]
        );
      }

      for (const achId of localAchievements) {
        await pool.query(
          'INSERT INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES ($1, $2, $3) ON CONFLICT (user_id, achievement_id) DO NOTHING',
          [userId, achId, Date.now()]
        );
      }

      for (const skinId of localSkins) {
        await pool.query(
          'INSERT INTO user_skins (user_id, skin_id, unlocked_at) VALUES ($1, $2, $3) ON CONFLICT (user_id, skin_id) DO NOTHING',
          [userId, skinId, Date.now()]
        );
      }

      // Возвращаем объединенные данные клиенту
      res.status(200).json({
        highScore: mergedHighScore,
        achievements: mergedAchievements,
        skins: mergedSkins,
        message: 'Синхронизация завершена'
      });

    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
}
