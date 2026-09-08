import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const isConnected = !!redis;

  let pingSuccess = false;
  if (redis) {
    try {
      await redis.ping();
      pingSuccess = true;
    } catch (e) {
      pingSuccess = false;
    }
  }

  return res.status(200).json({
    status: 'ok',
    app: 'iTasking Cloud',
    dbConfigured: isConnected,
    dbOnline: pingSuccess,
    timestamp: new Date().toISOString(),
  });
}
