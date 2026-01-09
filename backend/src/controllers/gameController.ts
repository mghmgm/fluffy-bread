import { Request, Response } from 'express';
import { db } from '../config/database';

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
      const serverHighScore = db.prepare(`
        SELECT MAX(score) as maxScore FROM game_scores WHERE user_id = ?
      `).get(userId) as { maxScore: number | null };

      const serverAchievements = db.prepare(`
        SELECT achievement_id FROM user_achievements WHERE user_id = ?
      `).all(userId) as Array<{ achievement_id: string }>;

      const serverSkins = db.prepare(`
        SELECT skin_id FROM user_skins WHERE user_id = ?
      `).all(userId) as Array<{ skin_id: string }>;

      // MERGE логика
      const mergedHighScore = Math.max(
        localHighScore || 0,
        serverHighScore?.maxScore || 0
      );

      const mergedAchievements = Array.from(new Set([
        ...localAchievements,
        ...serverAchievements.map(a => a.achievement_id)
      ]));

      const mergedSkins = Array.from(new Set([
        ...localSkins,
        ...serverSkins.map(s => s.skin_id)
      ]));

      // Сохраняем новые данные на сервер
      if (localHighScore && localHighScore > (serverHighScore?.maxScore || 0)) {
        db.prepare(`
          INSERT INTO game_scores (user_id, score, created_at)
          VALUES (?, ?, ?)
        `).run(userId, localHighScore, Date.now());
      }

      for (const achId of localAchievements) {
        db.prepare(`
          INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, unlocked_at)
          VALUES (?, ?, ?)
        `).run(userId, achId, Date.now());
      }

      for (const skinId of localSkins) {
        db.prepare(`
          INSERT OR IGNORE INTO user_skins (user_id, skin_id, unlocked_at)
          VALUES (?, ?, ?)
        `).run(userId, skinId, Date.now());
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
