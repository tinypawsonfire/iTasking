export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'review' | 'completed';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'link' | 'file';
}

export interface ActivityLog {
  id: string;
  taskId: string;
  author: string;
  role?: string;
  avatarColor?: string;
  timestamp: string; // ISO date string or formatted date
  actionType: 'status_change' | 'progress_update' | 'note' | 'deadline_change' | 'created';
  content: string;
  previousStatus?: TaskStatus;
  newStatus?: TaskStatus;
  progressPercent?: number;
  attachment?: Attachment;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assignee?: string;
}

export interface Task {
  id: string;
  code?: string;
  module: string; // ประกัน, Partner, True, เคลม, Super sale, etc.
  title: string;
  detail: string;
  assignees: string[]; // ['มอส', 'เอก']
  teams?: string[]; // ['ICI', 'iCare', 'TQC']
  status: TaskStatus;
  priority: Priority;
  progress: number; // 0 - 100
  startDate: string; // YYYY-MM-DD
  deadlineDate: string; // YYYY-MM-DD
  deadlineText?: string; // e.g. "25 สิงหาคม", "รอสัญญา", "เดือนหน้า กันยายน"
  subtasks: Subtask[];
  logs: ActivityLog[];
  attachments?: Attachment[];
  dependencyTaskId?: string; // ID of task this task depends on
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ModuleCategory {
  id: string;
  name: string;
  color: string; // Tailwind color class or hex
  badgeBg: string;
  badgeText: string;
  borderClass: string;
}

export interface UserProfile {
  id: string;
  name: string;
  team: string;
  avatarColor: string;
  role: string;
}
