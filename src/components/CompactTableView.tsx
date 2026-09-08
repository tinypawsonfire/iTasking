import React from 'react';
import type { Task, TaskStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatThaiDate, isTaskOverdue, formatDateTimeThai } from '../utils/dateUtils';
import { MessageSquare, Edit3, User, Calendar } from 'lucide-react';

interface CompactTableViewProps {
  tasks: Task[];
  onOpenUpdate: (task: Task) => void;
  onQuickStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

export const CompactTableView: React.FC<CompactTableViewProps> = ({
  tasks,
  onOpenUpdate,
  onQuickStatusChange,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-900 text-white font-semibold">
              <th className="py-3 px-4">หมวดหมู่</th>
              <th className="py-3 px-4">ชื่องาน & รายละเอียด</th>
              <th className="py-3 px-4">ผู้รับผิดชอบ</th>
              <th className="py-3 px-4 text-center">สถานะ</th>
              <th className="py-3 px-4 text-center">ความคืบหน้า</th>
              <th className="py-3 px-4 text-center">กำหนดส่ง</th>
              <th className="py-3 px-4 text-center">อัปเดตล่าสุด</th>
              <th className="py-3 px-3 text-center">จัดการ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const overdue = isTaskOverdue(task.deadlineDate, task.status);
              const latestLog = task.logs && task.logs.length > 0 ? task.logs[0] : null;

              return (
                <tr
                  key={task.id}
                  onClick={() => onOpenUpdate(task)}
                  className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                >
                  {/* Module */}
                  <td className="py-3 px-4 font-bold text-slate-700">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                      {task.module}
                    </span>
                  </td>

                  {/* Title & Detail */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {task.title}
                    </div>
                    {task.detail && (
                      <p className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">
                        {task.detail}
                      </p>
                    )}
                  </td>

                  {/* Assignees */}
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {task.assignees.map((name, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td
                    className="py-3 px-4 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <StatusBadge
                      status={task.status}
                      size="sm"
                      interactive={true}
                      onChange={(newSt) => onQuickStatusChange(task.id, newSt)}
                    />
                  </td>

                  {/* Progress Bar */}
                  <td className="py-3 px-4 text-center">
                    <div className="w-20 mx-auto space-y-1">
                      <span className="text-[10px] font-bold text-slate-700 block">
                        {task.progress}%
                      </span>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
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
                  </td>

                  {/* Deadline */}
                  <td className="py-3 px-4 text-center font-medium">
                    <span className={overdue ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                      {task.deadlineText || formatThaiDate(task.deadlineDate)}
                    </span>
                    {overdue && (
                      <span className="block text-[10px] text-rose-500 font-semibold">
                        (เกินกำหนด)
                      </span>
                    )}
                  </td>

                  {/* Latest Log */}
                  <td className="py-3 px-4 text-center">
                    {latestLog ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] text-slate-600 max-w-[140px] truncate"
                        title={`${latestLog.author}: ${latestLog.content}`}
                      >
                        <MessageSquare className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="truncate">{latestLog.content}</span>
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  {/* Action button */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenUpdate(task);
                      }}
                      className="px-2.5 py-1 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white font-bold transition-all text-xs"
                    >
                      อัปเดต
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
