import process from "node:process";
/**
 * @param {any} _event
 * @param {any} _context
 * @returns {Promise<{statusCode: number, headers: Record<string, string>, body: string}>}
 */
export async function handler(_event, _context) {
  const { Client } = await import("pg");
  const headers = {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
  };
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED;
  if (!connectionString) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        error: "Missing DATABASE_URL env var",
        hint: "Set DATABASE_URL in .env or Netlify site env vars",
        envChecked: [
          "DATABASE_URL",
          "NETLIFY_DATABASE_URL",
          "NETLIFY_DATABASE_URL_UNPOOLED",
        ],
      }),
    };
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    const { rows } = await client.query("SELECT NOW() AS now");
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, now: rows[0].now }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      }),
    };
  } finally {
    try {
      await client.end();
    } catch {
      /* ignore close error */
    }
  }
}
