import React from 'react';
import { Task, TaskStatus } from '../types';
import { formatThaiDate, isTaskOverdue } from '../utils/dateUtils';
import {
  Clock,
  PlayCircle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Plus,
  ArrowRight,
} from 'lucide-react';

interface KanbanBoardViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onAddNewTask: () => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; icon: React.ReactNode }[] = [
  {
    id: 'todo',
    title: 'ยังไม่เริ่ม (To Do)',
    color: 'border-t-slate-400 bg-slate-50/50',
    icon: <Clock className="w-4 h-4 text-slate-500" />,
  },
  {
    id: 'in_progress',
    title: 'กำลังทำ (In Progress)',
    color: 'border-t-blue-500 bg-blue-50/30',
    icon: <PlayCircle className="w-4 h-4 text-blue-600" />,
  },
  {
    id: 'review',
    title: 'รอตรวจ / รอสัญญา / ติดปัญหา',
    color: 'border-t-amber-500 bg-amber-50/30',
    icon: <AlertCircle className="w-4 h-4 text-amber-600" />,
  },
  {
    id: 'completed',
    title: 'เสร็จสมบูรณ์ (Completed)',
    color: 'border-t-emerald-500 bg-emerald-50/30',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
  },
];

export const KanbanBoardView: React.FC<KanbanBoardViewProps> = ({
  tasks,
  onSelectTask,
  onUpdateStatus,
  onAddNewTask,
}) => {
  const getTasksForColumn = (status: TaskStatus) => {
    if (status === 'review') {
      return tasks.filter((t) => t.status === 'review' || t.status === 'blocked');
    }
    return tasks.filter((t) => t.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const colTasks = getTasksForColumn(col.id);

        return (
          <div
            key={col.id}
            className={`rounded-2xl border border-slate-200 border-t-4 ${col.color} p-4 flex flex-col min-h-[500px] shadow-sm`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                {col.icon}
                <h4 className="font-bold text-sm text-slate-800">{col.title}</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-xs">
                {colTasks.length}
              </span>
            </div>

            {/* Task Cards List */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {colTasks.map((task) => {
                const overdue = isTaskOverdue(task.deadlineDate, task.status);

                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer space-y-2.5 group"
                  >
                    {/* Top Row: Module Badge & Code */}
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700">
                        {task.module}
                      </span>
                      {task.code && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {task.code}
                        </span>
                      )}
                    </div>

                    {/* Task Title */}
                    <h5 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug">
                      {task.title}
                    </h5>

                    {/* Detail Snippet */}
                    {task.detail && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {task.detail}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                        <span>ความคืบหน้า</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            task.progress === 100
                              ? 'bg-emerald-500'
                              : task.progress >= 50
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Assignees & Meta */}
                    <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-slate-100 text-xs">
                      {/* Assignees */}
                      <div className="flex flex-wrap gap-1">
                        {task.assignees.map((name, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700"
                          >
                            {name}
                          </span>
                        ))}
                      </div>

                      {/* Log Count */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MessageSquare className="w-3 h-3 text-indigo-500" />
                        <span>{task.logs?.length || 0}</span>
                      </div>
                    </div>

                    {/* Deadline & Quick Move Action */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div
                        className={`flex items-center gap-1 font-medium ${
                          overdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        <span>{task.deadlineText || formatThaiDate(task.deadlineDate)}</span>
                      </div>

                      {/* Quick Move Next Button */}
                      {col.id !== 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextStatus: TaskStatus =
                              col.id === 'todo'
                                ? 'in_progress'
                                : col.id === 'in_progress'
                                ? 'review'
                                : 'completed';
                            onUpdateStatus(task.id, nextStatus);
                          }}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-colors"
                          title="เลื่อนสถานะไปข้างหน้า"
                        >
                          <span>ถัดไป</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {colTasks.length === 0 && (
                <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                  ไม่มีงานในสถานะนี้
                </div>
              )}
            </div>

            {/* Column Bottom Add Button */}
            {col.id === 'todo' && (
              <button
                onClick={onAddNewTask}
                className="mt-3 w-full py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มงานใหม่
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
