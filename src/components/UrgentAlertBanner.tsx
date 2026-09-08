import React, { useState } from 'react';
import type { Task } from '../types';
import { getDeadlineAlertInfo } from '../utils/dateUtils';
import { AlertTriangle, Clock, X, ChevronRight, Flame } from 'lucide-react';

interface UrgentAlertBannerProps {
  tasks: Task[];
  onOpenTaskUpdate: (task: Task) => void;
}

export const UrgentAlertBanner: React.FC<UrgentAlertBannerProps> = ({
  tasks,
  onOpenTaskUpdate,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Filter urgent tasks
  const urgentList = tasks
    .map((task) => ({
      task,
      alert: getDeadlineAlertInfo(task.deadlineDate, task.status),
    }))
    .filter(
      ({ alert }) =>
        alert.urgency === 'overdue' ||
        alert.urgency === 'due_today' ||
        alert.urgency === 'due_soon'
    );

  if (isDismissed || urgentList.length === 0) return null;

  const topTask = urgentList[0];

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-2xl p-3 sm:p-3.5 shadow-md flex items-center justify-between gap-3 text-xs animate-fadeIn">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 font-bold">
          <Clock className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="font-bold flex items-center gap-2">
            <span>แจ้งเตือนกำหนดส่ง ({urgentList.length} งานเร่งด่วน)</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">
              {topTask.alert.badgeText}
            </span>
          </div>
          <p className="text-white/90 truncate text-[11px]">
            เรื่อง: <span className="font-bold">{topTask.task.title}</span> (ผู้ดูแล:{' '}
            {topTask.task.assignees.join(', ')})
            {urgentList.length > 1 && ` และอีก ${urgentList.length - 1} งาน`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onOpenTaskUpdate(topTask.task)}
          className="px-3 py-1.5 bg-white text-orange-700 hover:bg-orange-50 font-extrabold rounded-xl shadow-xs transition-all text-xs flex items-center gap-1"
        >
          <span>ดูและอัปเดต</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
