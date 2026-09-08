import React from 'react';
import type { Task, TaskStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import {
  formatThaiDate,
  getDeadlineAlertInfo,
  formatDateTimeThai,
} from '../utils/dateUtils';
import {
  Calendar,
  User,
  MessageSquare,
  Clock,
  TrendingUp,
  Edit3,
  Settings2,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onOpenUpdate: (task: Task, initialTab?: 'log' | 'edit') => void;
  onQuickStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onOpenUpdate,
  onQuickStatusChange,
}) => {
  const alertInfo = getDeadlineAlertInfo(task.deadlineDate, task.status);
  const latestLog = task.logs && task.logs.length > 0 ? task.logs[0] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all p-4 sm:p-5 flex flex-col justify-between space-y-3.5 group">
      {/* Top Header: Module, Deadline Alert Badge, Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onOpenUpdate(task, 'edit')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center gap-1 cursor-pointer"
            title="คลิกเพื่อเปลี่ยนหมวดหมู่ / แก้ไขงาน"
          >
            <span>{task.module}</span>
            <Edit3 className="w-2.5 h-2.5 text-slate-400" />
          </button>
          {/* Deadline Alert Tag */}
          {alertInfo.urgency !== 'completed' && (
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] border ${alertInfo.badgeClass}`}
            >
              {alertInfo.badgeText}
            </span>
          )}
        </div>

        <StatusBadge
          status={task.status}
          size="sm"
          interactive={true}
          onChange={(newSt) => onQuickStatusChange(task.id, newSt)}
        />
      </div>

      {/* Task Title & Detail */}
      <div className="space-y-1">
        <h4
          onClick={() => onOpenUpdate(task, 'edit')}
          className="font-bold text-slate-900 text-base leading-snug hover:text-indigo-600 transition-colors cursor-pointer"
          title="คลิกเพื่อแก้ไขข้อมูลงาน"
        >
          {task.title}
        </h4>
        {task.detail && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {task.detail}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> ความคืบหน้า
          </span>
          <span className="font-bold text-indigo-600">{task.progress}%</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              task.progress === 100
                ? 'bg-emerald-500'
                : task.progress >= 50
                ? 'bg-indigo-600'
                : 'bg-amber-500'
            }`}
            style={{ width: `${task.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Latest Activity Log Preview */}
      {latestLog && (
        <div className="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100/70 text-xs space-y-1">
          <div className="flex items-center justify-between font-semibold text-slate-700">
            <span className="text-[11px] text-indigo-700 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> อัปเดตล่าสุด ({latestLog.author})
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              {formatDateTimeThai(latestLog.timestamp).split('เวลา')[0]}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
            "{latestLog.content}"
          </p>
        </div>
      )}

      {/* Footer: Assignees, Deadline & Action Button */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        {/* Assignees */}
        <div className="flex flex-wrap gap-1 items-center">
          <User className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
          {task.assignees.map((name, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700"
            >
              {name}
            </span>
          ))}
        </div>

        {/* Deadline */}
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{task.deadlineText || formatThaiDate(task.deadlineDate)}</span>
        </div>
      </div>

      {/* Action Buttons: Log & Edit */}
      <div className="grid grid-cols-2 gap-2 w-full pt-1">
        <button
          type="button"
          onClick={() => onOpenUpdate(task, 'log')}
          className="py-2 px-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs rounded-xl border border-indigo-100 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          title="บันทึกความคืบหน้า / อัปเดตสถานะ"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>บันทึก Log</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenUpdate(task, 'edit')}
          className="py-2 px-2 bg-slate-100 hover:bg-slate-800 text-slate-700 hover:text-white font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          title="แก้ไขชื่องาน, หมวดหมู่, ผู้ดูแล, วันส่ง"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>แก้ไขข้อมูล</span>
        </button>
      </div>
    </div>
  );
};
