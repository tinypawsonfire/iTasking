export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  const isConfigured = Boolean(url && token);
  let dbOnline = false;

  if (isConfigured) {
    try {
      const pingRes = await fetch(`${url}/ping`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (pingRes.ok) {
        const data = await pingRes.json();
        dbOnline = data.result === 'PONG';
      }
    } catch {
      dbOnline = false;
    }
  }

  return res.status(200).json({
    status: 'ok',
    app: 'iTasking Cloud',
    dbConfigured: isConfigured,
    dbOnline,
    timestamp: new Date().toISOString(),
  });
}
