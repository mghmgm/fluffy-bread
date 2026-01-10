import { Request, Response } from 'express';
import { Achievement } from '../models/Achievement';

export class AchievementController {
  // Получить все достижения
  static async getAllAchievements(req: Request, res: Response): Promise<void> {
    try {
      const achievements = await Achievement.findAll();
      res.status(200).json({ achievements });
    } catch (error) {
      console.error('Get all achievements error:', error);
      res.status(500).json({ error: 'Ошибка получения достижений' });
    }
  }

  // Получить достижения пользователя
  static async getUserAchievements(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const achievements = await Achievement.findByUserId(userId);
      res.status(200).json({ achievements });
    } catch (error) {
      console.error('Get user achievements error:', error);
      res.status(500).json({ error: 'Ошибка получения достижений' });
    }
  }

  // Получить разблокированные достижения пользователя
  static async getUnlockedAchievements(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const achievements = await Achievement.findUnlockedByUserId(userId);
      res.status(200).json({ achievements });
    } catch (error) {
      console.error('Get unlocked achievements error:', error);
      res.status(500).json({ error: 'Ошибка получения достижений' });
    }
  }

  // Разблокировать достижение
  static async unlockAchievement(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const { achievementId } = req.params;
      const achievement = await Achievement.unlock(userId, parseInt(achievementId));

      res.status(200).json({ achievement });
    } catch (error) {
      console.error('Unlock achievement error:', error);
      res.status(500).json({ error: 'Ошибка разблокировки достижения' });
    }
  }

  // Получить статистику достижений
  static async getAchievementStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const stats = await Achievement.getUserAchievementStats(userId);
      res.status(200).json({ stats });
    } catch (error) {
      console.error('Get achievement stats error:', error);
      res.status(500).json({ error: 'Ошибка получения статистики' });
    }
  }
}
