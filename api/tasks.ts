const DB_TASKS_KEY = 'itasking:tasks:v1';

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

  try {
    if (req.method === 'GET') {
      const tasks = await redisGet(DB_TASKS_KEY);
      return res.status(200).json({
        dbConnected: true,
        tasks: Array.isArray(tasks) ? tasks : [],
      });
    }

    if (req.method === 'POST') {
      const body = req.body;
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
      const { task, taskId, updates } = req.body || {};
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
      const { taskId } = req.body || req.query || {};
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
