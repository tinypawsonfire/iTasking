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
  let dbWritable = false;

  if (isConfigured && url && token) {
    try {
      const pingRes = await fetch(`${url}/ping`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (pingRes.ok) {
        const data = await pingRes.json();
        dbOnline = data.result === 'PONG';
      }

      // Test write command
      const writeRes = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', 'itasking:health:ping', 'pong']),
      });
      if (writeRes.ok) {
        const wData = await writeRes.json();
        dbWritable = wData.result === 'OK';
      }
    } catch {
      dbOnline = false;
      dbWritable = false;
    }
  }

  return res.status(200).json({
    status: 'ok',
    app: 'iTasking Cloud',
    dbConfigured: isConfigured,
    dbOnline,
    dbWritable,
    timestamp: new Date().toISOString(),
  });
}
