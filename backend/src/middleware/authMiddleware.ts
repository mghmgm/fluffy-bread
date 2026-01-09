import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/tokenUtils';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Токен не предоставлен' });
      return;
    }

    const token = authHeader.substring(7); // Убираем "Bearer "
    const decoded = verifyToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Невалидный токен' });
  }
};
