import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis, DB_KEYS } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!redis) {
    return res.status(200).json({
      dbConnected: false,
      categories: null,
    });
  }

  try {
    if (req.method === 'GET') {
      const categories = await redis.get(DB_KEYS.CATEGORIES);
      return res.status(200).json({
        dbConnected: true,
        categories: categories || [],
      });
    }

    if (req.method === 'POST') {
      const body = req.body;
      const categories = Array.isArray(body?.categories) ? body.categories : body;
      await redis.set(DB_KEYS.CATEGORIES, categories);
      return res.status(200).json({
        success: true,
        dbConnected: true,
        categories,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in /api/categories:', error);
    return res.status(500).json({ error: error?.message });
  }
}
