import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Создание ВСЕХ таблиц
export const initDatabase = async () => {
  // 1. Таблица пользователей
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at BIGINT NOT NULL
    );
  `);

  // 2. Таблица рекордов
  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_scores (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      created_at BIGINT NOT NULL
    );
  `);

  // 3. Таблица достижений пользователя
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      achievement_id VARCHAR(255) NOT NULL,
      unlocked_at BIGINT NOT NULL,
      UNIQUE(user_id, achievement_id)
    );
  `);

  // 4. Таблица скинов пользователя
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_skins (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      skin_id VARCHAR(255) NOT NULL,
      unlocked_at BIGINT NOT NULL,
      UNIQUE(user_id, skin_id)
    );
  `);

  console.log('✅ PostgreSQL tables created');
};

export default pool;
