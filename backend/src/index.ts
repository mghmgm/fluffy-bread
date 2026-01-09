import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/database';
import authRoutes from './routes/authRoutes';
import gameRoutes from './routes/gameRoutes'; // ← ДОБАВЬТЕ

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initDatabase();

// Роуты
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes); // ← ДОБАВЬТЕ

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Сервер работает' });
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});
