import { Client } from 'pg';

export async function handler(event, context) {
  const headers = { 'content-type': 'application/json' };
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'Missing DATABASE_URL env var' }) };
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const { rows } = await client.query('SELECT NOW() AS now');
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, now: rows[0].now }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  } finally {
    try { await client.end(); } catch {}
  }
}
