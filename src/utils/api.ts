import type { Task, ModuleCategory } from '../types';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  loadCategoriesFromStorage,
  saveCategoriesToStorage,
} from './storage';

export interface CloudSyncStatus {
  isCloudConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
}

/**
 * Fetch tasks from Vercel Cloud Database (/api/tasks).
 * Falls back to localStorage if offline or DB not yet configured.
 */
export async function fetchTasksFromCloud(): Promise<{ tasks: Task[]; isCloudConnected: boolean }> {
  try {
    const res = await fetch('/api/tasks', {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.dbConnected && Array.isArray(data.tasks)) {
        // If cloud database is empty, seed it with current tasks if any exist
        if (data.tasks.length === 0) {
          const localTasks = loadTasksFromStorage();
          if (localTasks.length > 0) {
            await syncAllTasksToCloud(localTasks);
            return { tasks: localTasks, isCloudConnected: true };
          }
        }
        // Save to local cache
        saveTasksToStorage(data.tasks);
        return { tasks: data.tasks, isCloudConnected: true };
      }
    }
  } catch (err) {
    // Expected when running pure Vite local server without Vercel CLI
    // console.log('Using local storage fallback');
  }

  return {
    tasks: loadTasksFromStorage(),
    isCloudConnected: false,
  };
}

/**
 * Sync all tasks to Cloud Database.
 */
export async function syncAllTasksToCloud(tasks: Task[]): Promise<boolean> {
  // Always update local cache first
  saveTasksToStorage(tasks);

  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks }),
    });

    if (res.ok) {
      const data = await res.json();
      return !!data.dbConnected;
    }
  } catch {
    // Ignore network error on local offline
  }

  return false;
}

/**
 * Save or update single task to Cloud Database.
 */
export async function syncTaskToCloud(task: Task): Promise<boolean> {
  try {
    const res = await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task }),
    });

    if (res.ok) {
      const data = await res.json();
      return !!data.dbConnected;
    }
  } catch {
    // Local offline
  }
  return false;
}

/**
 * Delete a task from Cloud Database.
 */
export async function deleteTaskFromCloud(taskId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/tasks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Check health status of Vercel Database.
 */
export async function checkCloudHealth(): Promise<{ dbConfigured: boolean; dbOnline: boolean }> {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      return {
        dbConfigured: !!data.dbConfigured,
        dbOnline: !!data.dbOnline,
      };
    }
  } catch {
    // Local
  }
  return { dbConfigured: false, dbOnline: false };
}

/**
 * Fetch categories from Vercel Cloud Database (/api/categories).
 */
export async function fetchCategoriesFromCloud(): Promise<{ categories: ModuleCategory[]; isCloudConnected: boolean }> {
  try {
    const res = await fetch('/api/categories', {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.dbConnected && Array.isArray(data.categories)) {
        if (data.categories.length === 0) {
          const localCats = loadCategoriesFromStorage();
          if (localCats.length > 0) {
            await syncCategoriesToCloud(localCats);
            return { categories: localCats, isCloudConnected: true };
          }
        }
        saveCategoriesToStorage(data.categories);
        return { categories: data.categories, isCloudConnected: true };
      }
    }
  } catch {
    // Fallback
  }

  return {
    categories: loadCategoriesFromStorage(),
    isCloudConnected: false,
  };
}

/**
 * Save categories to Vercel Cloud Database (/api/categories).
 */
export async function syncCategoriesToCloud(categories: ModuleCategory[]): Promise<boolean> {
  saveCategoriesToStorage(categories);
  try {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
