import { Request, Response } from 'express';
import { Skin } from '../models/Skin';

export class SkinController {
  // Получить все скины пользователя
  static async getUserSkins(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const skins = await Skin.findByUserId(userId);
      res.status(200).json({ skins });
    } catch (error) {
      console.error('Get user skins error:', error);
      res.status(500).json({ error: 'Ошибка получения скинов' });
    }
  }

  // Получить разблокированные скины
  static async getUnlockedSkins(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const skins = await Skin.findUnlockedByUserId(userId);
      res.status(200).json({ skins });
    } catch (error) {
      console.error('Get unlocked skins error:', error);
      res.status(500).json({ error: 'Ошибка получения скинов' });
    }
  }

  // Разблокировать скин
  static async unlockSkin(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const { skinId } = req.params;
      const skin = await Skin.unlock(parseInt(skinId));

      res.status(200).json({ skin });
    } catch (error) {
      console.error('Unlock skin error:', error);
      res.status(500).json({ error: 'Ошибка разблокировки скина' });
    }
  }
}
