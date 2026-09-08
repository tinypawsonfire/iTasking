const DB_CATEGORIES_KEY = 'itasking:categories:v1';

function getCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return { url, token, isConfigured: Boolean(url && token) };
}

async function redisCommand(command: any[]) {
  const { url, token, isConfigured } = getCredentials();
  if (!isConfigured || !url || !token) {
    return { success: false, error: 'Database credentials not configured' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });

    const data: any = await res.json();
    if (!res.ok || data.error) {
      console.error('Upstash Redis error:', data);
      return { success: false, error: data?.error || `HTTP ${res.status}` };
    }
    return { success: true, result: data.result };
  } catch (err: any) {
    console.error('Redis fetch error:', err);
    return { success: false, error: err?.message };
  }
}

async function redisGet(key: string) {
  const res = await redisCommand(['GET', key]);
  if (!res.success || res.result === null || res.result === undefined) return null;
  try {
    return typeof res.result === 'string' ? JSON.parse(res.result) : res.result;
  } catch {
    return res.result;
  }
}

async function redisSet(key: string, value: any) {
  const strValue = typeof value === 'string' ? value : JSON.stringify(value);
  const res = await redisCommand(['SET', key, strValue]);
  if (!res.success) {
    throw new Error(res.error || 'Failed to write to Redis');
  }
  return true;
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

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      // ignore
    }
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
