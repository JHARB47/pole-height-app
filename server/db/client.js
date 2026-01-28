import { getPool } from "./pool.js";

/**
 * @param {import('pg').QueryConfig | string} text
 * @param {any[]} [params]
 */
export async function query(text, params) {
  const pool = getPool();
  return pool.query(text, params);
}

/**
 * @param {(client: import('pg').PoolClient) => Promise<any>} handler
 */
export async function transaction(handler) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await handler(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
