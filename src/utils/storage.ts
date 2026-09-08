import type { ModuleCategory, Task, UserProfile } from '../types';
import { INITIAL_TASKS, MODULE_CATEGORIES, TEAM_MEMBERS } from '../data/mockData';

const STORAGE_KEYS = {
  TASKS: 'team_task_tracker_tasks_v2_clean',
  CATEGORIES: 'team_task_tracker_categories_v2_clean',
  USERS: 'team_task_tracker_users_v2_clean',
};

export function loadTasksFromStorage(): Task[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (data !== null) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading tasks from localStorage', err);
  }
  return INITIAL_TASKS;
}

export function saveTasksToStorage(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.error('Error saving tasks to localStorage', err);
  }
}

export function loadCategoriesFromStorage(): ModuleCategory[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (data !== null) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading categories from localStorage', err);
  }
  return MODULE_CATEGORIES;
}

export function saveCategoriesToStorage(categories: ModuleCategory[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (err) {
    console.error('Error saving categories to localStorage', err);
  }
}

export function clearAllStorage(): { tasks: Task[]; categories: ModuleCategory[] } {
  localStorage.removeItem(STORAGE_KEYS.TASKS);
  localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  localStorage.removeItem(STORAGE_KEYS.USERS);
  // Also clear old keys
  localStorage.removeItem('team_task_tracker_tasks_v1');
  return {
    tasks: [],
    categories: MODULE_CATEGORIES,
  };
}

export function exportDataAsJson(tasks: Task[]): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `team-tasks-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
