const DB_TASKS_KEY = 'itasking:tasks:v1';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { isConfigured } = getCredentials();
  if (!isConfigured) {
    return res.status(200).json({
      dbConnected: false,
      message: 'Vercel Database (Upstash Redis) credentials not detected in Environment Variables.',
      tasks: [],
    });
  }

  // Parse body safely if string
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
      const tasks = await redisGet(DB_TASKS_KEY);
      return res.status(200).json({
        dbConnected: true,
        tasks: Array.isArray(tasks) ? tasks : [],
      });
    }

    if (req.method === 'POST') {
      let newTasksList: any[] = [];

      if (Array.isArray(body?.tasks)) {
        newTasksList = body.tasks;
      } else if (body?.task) {
        const currentTasks = (await redisGet(DB_TASKS_KEY)) || [];
        const filtered = Array.isArray(currentTasks)
          ? currentTasks.filter((t: any) => t.id !== body.task.id)
          : [];
        newTasksList = [body.task, ...filtered];
      } else if (Array.isArray(body)) {
        newTasksList = body;
      }

      await redisSet(DB_TASKS_KEY, newTasksList);
      return res.status(200).json({
        success: true,
        dbConnected: true,
        count: newTasksList.length,
      });
    }

    if (req.method === 'PUT') {
      const { task, taskId, updates } = body || req.query || {};
      const current = (await redisGet(DB_TASKS_KEY)) || [];
      const currentTasks: any[] = Array.isArray(current) ? current : [];

      let updatedList = [];
      if (task) {
        let found = false;
        updatedList = currentTasks.map((t: any) => {
          if (t.id === task.id) {
            found = true;
            return task;
          }
          return t;
        });
        if (!found) {
          updatedList.unshift(task);
        }
      } else if (taskId && updates) {
        updatedList = currentTasks.map((t: any) => (t.id === taskId ? { ...t, ...updates } : t));
      } else {
        updatedList = currentTasks;
      }

      await redisSet(DB_TASKS_KEY, updatedList);
      return res.status(200).json({
        success: true,
        dbConnected: true,
        tasks: updatedList,
      });
    }

    if (req.method === 'DELETE') {
      const { taskId } = body || req.query || {};
      if (!taskId) {
        return res.status(400).json({ error: 'taskId is required' });
      }

      const current = (await redisGet(DB_TASKS_KEY)) || [];
      const currentTasks: any[] = Array.isArray(current) ? current : [];
      const filtered = currentTasks.filter((t: any) => t.id !== taskId);

      await redisSet(DB_TASKS_KEY, filtered);
      return res.status(200).json({
        success: true,
        dbConnected: true,
        remainingCount: filtered.length,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in /api/tasks:', error);
    return res.status(500).json({
      error: 'Database operation failed',
      details: error?.message,
    });
  }
}
