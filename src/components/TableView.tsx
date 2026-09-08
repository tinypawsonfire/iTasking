import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatThaiDate, isTaskOverdue } from '../utils/dateUtils';
import {
  ArrowUpDown,
  Calendar,
  User,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface TableViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  tasks,
  onSelectTask,
  onUpdateStatus,
}) => {
  const [sortField, setSortField] = useState<'module' | 'title' | 'status' | 'deadlineDate' | 'progress'>('module');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';

    if (sortField === 'progress') {
      return sortOrder === 'asc' ? a.progress - b.progress : b.progress - a.progress;
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return 0;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-900 text-white font-semibold">
              <th
                onClick={() => handleSort('module')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>หมวดหมู่ (Module)</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('title')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>ชื่องาน (Task)</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4">รายละเอียด (Detail)</th>
              <th className="py-3.5 px-4">ผู้รับผิดชอบ (Assignee)</th>
              <th
                onClick={() => handleSort('status')}
                className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>สถานะ (Status)</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('progress')}
                className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>ความคืบหน้า</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('deadlineDate')}
                className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>กำหนดส่ง (Deadline)</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-center">Log อัปเดต</th>
              <th className="py-3.5 px-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {sortedTasks.map((task) => {
              const overdue = isTaskOverdue(task.deadlineDate, task.status);

              return (
                <tr
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                >
                  {/* Module Badge */}
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {task.module}
                    </span>
                  </td>

                  {/* Title & Code */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                      <span>{task.title}</span>
                    </div>
                    {task.code && (
                      <span className="text-[10px] text-slate-400 font-mono">{task.code}</span>
                    )}
                  </td>

                  {/* Detail */}
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    {task.detail || '-'}
                  </td>

                  {/* Assignees */}
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {task.assignees.map((name, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                          {name}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td
                    className="py-3 px-3 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <StatusBadge
                      status={task.status}
                      interactive={true}
                      onChange={(newSt) => onUpdateStatus(task.id, newSt)}
                    />
                  </td>

                  {/* Progress Bar */}
                  <td className="py-3 px-4 text-center">
                    <div className="w-24 mx-auto space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600">
                        <span>{task.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            task.progress === 100
                              ? 'bg-emerald-500'
                              : task.progress >= 50
                              ? 'bg-indigo-500'
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
                      <div className="text-[10px] text-rose-500 font-semibold">เกินกำหนด</div>
                    )}
                  </td>

                  {/* Latest Log Count & Snippet */}
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                      <MessageSquare className="w-3 h-3 text-indigo-500" />
                      {task.logs?.length || 0}
                    </span>
                  </td>

                  {/* Action Link */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onSelectTask(task)}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                      title="ดูรายละเอียดและอัพเดท"
                    >
                      <ExternalLink className="w-4 h-4" />
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
