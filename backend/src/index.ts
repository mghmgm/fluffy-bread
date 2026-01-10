import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/postgres';
import authRoutes from './routes/authRoutes';
import gameRoutes from './routes/gameRoutes';
import skinRoutes from './routes/skinRoutes';
import achievementRoutes from './routes/achievementRoutes';
import settingsRoutes from './routes/settingsRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: '*',
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Роуты
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/skins', skinRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Сервер работает' });
});

// ПРАВИЛЬНЫЙ запуск с async/await
const startServer = async () => {
  try {
    await initDatabase();
    console.log('✅ База данных инициализирована');

    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

startServer();
