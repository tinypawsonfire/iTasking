import React, { useState, useEffect, useRef } from 'react';
import type { Task } from '../types';
import { getDeadlineAlertInfo, formatThaiDate } from '../utils/dateUtils';
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  X,
  ChevronRight,
  User,
  Sparkles,
  Volume2,
} from 'lucide-react';

interface NotificationCenterProps {
  tasks: Task[];
  onOpenTaskUpdate: (task: Task) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  tasks,
  onOpenTaskUpdate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission === 'granted'
      : false
  );
  const panelRef = useRef<HTMLDivElement>(null);

  // Group tasks by urgency
  const urgentTasks = tasks
    .map((task) => ({
      task,
      alert: getDeadlineAlertInfo(task.deadlineDate, task.status),
    }))
    .filter(
      ({ alert }) =>
        alert.urgency === 'overdue' ||
        alert.urgency === 'due_today' ||
        alert.urgency === 'due_soon'
    )
    .sort((a, b) => a.alert.daysDiff - b.alert.daysDiff);

  const totalUrgentCount = urgentTasks.length;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Request browser notification permission
  const handleRequestNotification = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setHasPermission(perm === 'granted');
      if (perm === 'granted' && urgentTasks.length > 0) {
        new Notification('🔔 Team Task Alert', {
          body: `มี ${urgentTasks.length} งานที่ใกล้ถึงกำหนดส่งหรือเกินกำหนด`,
          icon: '/favicon.svg',
        });
      }
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl border transition-all flex items-center justify-center ${
          totalUrgentCount > 0
            ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
        }`}
        title="ศูนย์แจ้งเตือนงานใกล้ถึงกำหนด"
      >
        <Bell className={`w-4 h-4 ${totalUrgentCount > 0 ? 'animate-bounce' : ''}`} />
        {totalUrgentCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
            {totalUrgentCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fadeIn text-xs">
          {/* Panel Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm">การแจ้งเตือนกำหนดส่ง</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px]">
              {totalUrgentCount} รายการเร่งด่วน
            </span>
          </div>

          {/* List of Urgent Tasks */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
            {urgentTasks.map(({ task, alert }) => (
              <div
                key={task.id}
                onClick={() => {
                  onOpenTaskUpdate(task);
                  setIsOpen(false);
                }}
                className="p-3 hover:bg-indigo-50/60 transition-colors cursor-pointer space-y-1.5 rounded-xl group"
              >
                {/* Top: Module + Urgency Badge */}
                <div className="flex items-center justify-between gap-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    {task.module}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] border ${alert.badgeClass}`}
                  >
                    {alert.badgeText}
                  </span>
                </div>

                {/* Title */}
                <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {task.title}
                </div>

                {/* Owner and Deadline */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <User className="w-3 h-3 text-slate-400" />
                    ผู้ดูแล: {task.assignees.join(', ')}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {task.deadlineText || formatThaiDate(task.deadlineDate)}
                  </span>
                </div>
              </div>
            ))}

            {totalUrgentCount === 0 && (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-semibold text-slate-700 text-xs">
                  ไม่มีงานที่ใกล้ถึงกำหนดหรือเกินกำหนด
                </p>
                <p className="text-[11px] text-slate-400">
                  ทุกงานอยู่ในกรอบเวลาที่วางไว้เรียบร้อยดี 👍
                </p>
              </div>
            )}
          </div>

          {/* Panel Footer / Browser Notification Toggle */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
            {!hasPermission ? (
              <button
                onClick={handleRequestNotification}
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
              >
                <Volume2 className="w-3 h-3" /> เปิดแจ้งเตือนผ่านเบราว์เซอร์
              </button>
            ) : (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> เปิดการแจ้งเตือนแล้ว
              </span>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 font-medium"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
