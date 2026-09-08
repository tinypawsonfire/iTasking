const DB_CATEGORIES_KEY = 'itasking:categories:v1';

function getCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return { url, token, isConfigured: Boolean(url && token) };
}

async function redisGet(key: string) {
  const { url, token, isConfigured } = getCredentials();
  if (!isConfigured) return null;
  const res = await fetch(`${url}/get/${key}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data: any = await res.json();
  if (!data?.result) return null;
  try {
    return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
  } catch {
    return data.result;
  }
}

async function redisSet(key: string, value: any) {
  const { url, token, isConfigured } = getCredentials();
  if (!isConfigured) return false;
  const res = await fetch(`${url}/set/${key}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(typeof value === 'string' ? value : JSON.stringify(value)),
  });
  return res.ok;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { isConfigured } = getCredentials();
  if (!isConfigured) {
    return res.status(200).json({
      dbConnected: false,
      categories: [],
    });
  }

  try {
    if (req.method === 'GET') {
      const categories = await redisGet(DB_CATEGORIES_KEY);
      return res.status(200).json({
        dbConnected: true,
        categories: Array.isArray(categories) ? categories : [],
      });
    }

    if (req.method === 'POST') {
      const body = req.body;
      const categories = Array.isArray(body?.categories) ? body.categories : body;
      await redisSet(DB_CATEGORIES_KEY, categories);
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
