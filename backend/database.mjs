import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || '';
const SSL_MODE = process.env.PGSSLMODE || '';

const createPool = () => {
  if (!DATABASE_URL) return null;

  const useSsl = SSL_MODE === 'require';
  return new Pool({
    connectionString: DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });
};

const pool = createPool();

const ensureTable = async () => {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reflections (
      user_id TEXT NOT NULL,
      reflection_id TEXT NOT NULL,
      value_name TEXT NOT NULL,
      note TEXT NOT NULL,
      practice_title TEXT NOT NULL,
      reflection_date TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, reflection_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS reflections_user_date_idx
    ON reflections (user_id, reflection_date DESC);
  `);
};

export const hasDatabase = () => Boolean(pool);

export const initDatabase = async () => {
  if (!pool) return false;
  await ensureTable();
  return true;
};

export const closeDatabase = async () => {
  if (!pool) return;
  await pool.end();
};

export const listReflections = async (userId) => {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured.');
  }

  const result = await pool.query(
    `
      SELECT
        reflection_id AS id,
        value_name AS value,
        note,
        practice_title AS "practiceTitle",
        reflection_date AS date
      FROM reflections
      WHERE user_id = $1
      ORDER BY reflection_date DESC, updated_at DESC;
    `,
    [userId]
  );

  return result.rows;
};

export const replaceReflections = async (userId, reflections) => {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM reflections WHERE user_id = $1', [userId]);

    for (const reflection of reflections) {
      await client.query(
        `
          INSERT INTO reflections (
            user_id,
            reflection_id,
            value_name,
            note,
            practice_title,
            reflection_date
          )
          VALUES ($1, $2, $3, $4, $5, $6);
        `,
        [
          userId,
          reflection.id,
          reflection.value,
          reflection.note,
          reflection.practiceTitle,
          reflection.date,
        ]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
