import { Request, Response } from 'express';
import { Settings } from '../models/Settings';

export class SettingsController {
  // Получить настройки пользователя
  static async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const settings = await Settings.findByUserId(userId);
      if (!settings) {
        // Если нет настроек, создаем дефолтные
        const newSettings = await Settings.create(userId);
        res.status(200).json({ settings: newSettings });
        return;
      }

      res.status(200).json({ settings });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: 'Ошибка получения настроек' });
    }
  }

  // Обновить настройки
  static async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const settings = await Settings.update(userId, req.body);
      res.status(200).json({ settings });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: 'Ошибка обновления настроек' });
    }
  }

  // Обновить громкость музыки
  static async updateMusicVolume(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const { musicVolume } = req.body;
      const settings = await Settings.updateMusicVolume(userId, musicVolume);
      res.status(200).json({ settings });
    } catch (error) {
      console.error('Update music volume error:', error);
      res.status(500).json({ error: 'Ошибка обновления громкости' });
    }
  }

  // Обновить громкость звука
  static async updateSoundVolume(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const { soundVolume } = req.body;
      const settings = await Settings.updateSoundVolume(userId, soundVolume);
      res.status(200).json({ settings });
    } catch (error) {
      console.error('Update sound volume error:', error);
      res.status(500).json({ error: 'Ошибка обновления громкости' });
    }
  }
}
