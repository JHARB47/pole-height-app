import { getPool } from './pool.js';

export async function query(text, params) {
  const pool = getPool();
  return pool.query(text, params);
}

export async function transaction(handler) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await handler(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
