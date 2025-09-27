export async function handler() {
  const ts = new Date().toISOString();
  const inNetlify = !!process.env.NETLIFY;
  const hasDb = !!(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || process.env.NETLIFY_DATABASE_URL_UNPOOLED);
  const nextSkip = process.env.NETLIFY_NEXT_PLUGIN_SKIP === 'true' || process.env.NETLIFY_NEXT_PLUGIN_SKIP === '1';
  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'cache-control': 'no-store'
    },
    body: JSON.stringify({ ok: true, service: 'netlify-functions', ts, env: { inNetlify, hasDb, nextSkip } })
  };
}
