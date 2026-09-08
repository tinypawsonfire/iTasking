import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis, DB_KEYS } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!redis) {
    return res.status(200).json({
      dbConnected: false,
      message: 'Vercel Database (Upstash Redis / Vercel KV) not configured yet.',
      tasks: null,
    });
  }

  try {
    if (req.method === 'GET') {
      const tasks = await redis.get(DB_KEYS.TASKS);
      return res.status(200).json({
        dbConnected: true,
        tasks: tasks || [],
      });
    }

    if (req.method === 'POST') {
      const body = req.body;
      let newTasksList: any[] = [];

      if (Array.isArray(body?.tasks)) {
        // Full batch sync
        newTasksList = body.tasks;
      } else if (body?.task) {
        // Single add
        const currentTasks: any[] = (await redis.get(DB_KEYS.TASKS)) || [];
        newTasksList = [body.task, ...currentTasks.filter((t: any) => t.id !== body.task.id)];
      } else if (Array.isArray(body)) {
        newTasksList = body;
      }

      await redis.set(DB_KEYS.TASKS, newTasksList);
      return res.status(200).json({
        success: true,
        dbConnected: true,
        count: newTasksList.length,
      });
    }

    if (req.method === 'PUT') {
      const { task, taskId, updates } = req.body;
      const currentTasks: any[] = (await redis.get(DB_KEYS.TASKS)) || [];

      let updatedList = [];
      if (task) {
        updatedList = currentTasks.map((t: any) => (t.id === task.id ? task : t));
        // If not found, add
        if (!currentTasks.some((t: any) => t.id === task.id)) {
          updatedList.unshift(task);
        }
      } else if (taskId && updates) {
        updatedList = currentTasks.map((t: any) => (t.id === taskId ? { ...t, ...updates } : t));
      } else {
        updatedList = currentTasks;
      }

      await redis.set(DB_KEYS.TASKS, updatedList);
      return res.status(200).json({
        success: true,
        dbConnected: true,
        tasks: updatedList,
      });
    }

    if (req.method === 'DELETE') {
      const { taskId } = req.body || req.query;
      if (!taskId) {
        return res.status(400).json({ error: 'taskId required' });
      }

      const currentTasks: any[] = (await redis.get(DB_KEYS.TASKS)) || [];
      const filtered = currentTasks.filter((t: any) => t.id !== taskId);
      await redis.set(DB_KEYS.TASKS, filtered);

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
