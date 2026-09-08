import React from 'react';
import { TaskStatus } from '../types';
import { Clock, PlayCircle, AlertCircle, CheckCircle2, Eye } from 'lucide-react';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (newStatus: TaskStatus) => void;
}

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  todo: {
    label: 'ยังไม่เริ่ม',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  in_progress: {
    label: 'In progress',
    bg: 'bg-blue-600',
    text: 'text-white',
    border: 'border-blue-700',
    icon: <PlayCircle className="w-3.5 h-3.5" />,
  },
  blocked: {
    label: 'ติดปัญหา / รอข้อมูล',
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    border: 'border-rose-300',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  review: {
    label: 'รอตรวจ / รอสัญญา',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
    icon: <Eye className="w-3.5 h-3.5" />,
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-700',
    text: 'text-white',
    border: 'border-emerald-800',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  interactive = false,
  onChange,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.todo;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  if (interactive && onChange) {
    return (
      <div className="relative inline-block">
        <select
          value={status}
          onChange={(e) => onChange(e.target.value as TaskStatus)}
          className={`appearance-none cursor-pointer rounded-full border shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${sizeClasses[size]} ${config.bg} ${config.text} ${config.border} pr-6`}
          style={{ backgroundImage: 'none' }}
        >
          <option value="todo" className="bg-white text-slate-800">ยังไม่เริ่ม</option>
          <option value="in_progress" className="bg-white text-slate-800">In progress</option>
          <option value="blocked" className="bg-white text-slate-800">ติดปัญหา / รอข้อมูล</option>
          <option value="review" className="bg-white text-slate-800">รอตรวจ / รอสัญญา</option>
          <option value="completed" className="bg-white text-slate-800">Completed</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg className="h-3 w-3 fill-current opacity-70" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm ${sizeClasses[size]} ${config.bg} ${config.text} ${config.border}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
