import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Публичные роуты
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Защищенные роуты
router.get('/me', authMiddleware, AuthController.getMe);
router.post('/logout', authMiddleware, AuthController.logout);
router.put('/update-username', authMiddleware, AuthController.updateUsername);
router.delete('/delete-account', authMiddleware, AuthController.deleteAccount);
router.delete('/progress', authMiddleware, AuthController.deleteProgress);

export default router;
