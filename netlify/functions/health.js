/* eslint-env node */

/**
 * @param {import('@netlify/functions').HandlerEvent} _event
 * @param {import('@netlify/functions').Context} _context
 */
export async function handler(_event, _context) {
  const startTime = Date.now();
  const ts = new Date().toISOString();
  const inNetlify = !!process.env.NETLIFY;
  const hasDb = !!(
    process.env.DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED
  );
  const nextSkip =
    process.env.NETLIFY_NEXT_PLUGIN_SKIP === "true" ||
    process.env.NETLIFY_NEXT_PLUGIN_SKIP === "1";

  // Calculate response time
  const responseTime = Date.now() - startTime;

  // Basic performance metrics
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  const response = {
    ok: true,
    service: "netlify-functions",
    ts,
    performance: {
      responseTimeMs: responseTime,
      uptimeSeconds: uptime,
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      },
    },
    env: { inNetlify, hasDb, nextSkip },
  };

  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
      "x-response-time": `${responseTime}ms`,
    },
    body: JSON.stringify(response),
  };
}
