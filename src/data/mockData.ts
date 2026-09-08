import type { ModuleCategory, Task, UserProfile } from '../types';

export const MODULE_CATEGORIES: ModuleCategory[] = [
  {
    id: 'general',
    name: 'ทั่วไป',
    color: '#6366f1',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    badgeText: 'text-indigo-800',
    borderClass: 'border-l-indigo-500',
  },
];

export const TEAM_MEMBERS: UserProfile[] = [];

// Empty clean slate
export const INITIAL_TASKS: Task[] = [];
