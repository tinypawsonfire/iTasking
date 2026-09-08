import React, { useState } from 'react';
import type { Task, ModuleCategory, TaskStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatThaiDate, isTaskOverdue, generateTimelineHeader, formatDateTimeThai } from '../utils/dateUtils';
import { Calendar, User, Clock, ChevronRight, Layers, Edit3, MessageSquare, Sparkles } from 'lucide-react';

interface ModernTimelineViewProps {
  tasks: Task[];
  modules: ModuleCategory[];
  onOpenUpdate: (task: Task) => void;
  onQuickStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

export const ModernTimelineView: React.FC<ModernTimelineViewProps> = ({
  tasks = [],
  modules = [],
  onOpenUpdate,
  onQuickStatusChange,
}) => {
  const [activeModuleTab, setActiveModuleTab] = useState('all');
  const { months, totalWeeks } = generateTimelineHeader();

  const filteredTasks =
    activeModuleTab === 'all'
      ? tasks
      : tasks.filter((t) => t.module.toLowerCase() === activeModuleTab.toLowerCase());

  // Calculate start week index and end week index for a continuous bar
  const getBarPosition = (taskStartStr: string, taskEndStr: string) => {
    try {
      const taskStart = new Date(taskStartStr);
      const taskEnd = new Date(taskEndStr);

      let startIndex = -1;
      let endIndex = -1;

      totalWeeks.forEach((w, idx) => {
        if (w.startDate <= taskEnd && w.endDate >= taskStart) {
          if (startIndex === -1) startIndex = idx;
          endIndex = idx;
        }
      });

      if (startIndex === -1) {
        // Default to first week if out of bounds
        startIndex = 0;
        endIndex = 0;
      }

      const totalCols = totalWeeks.length;
      const leftPercent = (startIndex / totalCols) * 100;
      const widthPercent = Math.max(((endIndex - startIndex + 1) / totalCols) * 100, 5);

      return {
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        spanWeeks: endIndex - startIndex + 1,
      };
    } catch {
      return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-4 sm:p-6">
      {/* Header & Module Filter Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            ไทม์ไลน์ภาพรวม (Gantt Timeline Chart)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            แท่งไทม์ไลน์แสดงระยะเวลาและหมุดประวัติการอัปเดต • คลิกที่แถบเพื่อดูรายละเอียด
          </p>
        </div>

        {/* Module Filter Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveModuleTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeModuleTab === 'all'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({tasks.length})
          </button>
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveModuleTab(m.name)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeModuleTab === m.name
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Gantt Area */}
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Month & Week Timeline Header Bar */}
          <div className="grid grid-cols-12 gap-0 bg-slate-900 text-white rounded-xl overflow-hidden mb-2 text-xs font-semibold shadow-xs">
            {/* Left label header */}
            <div className="col-span-4 p-3 flex items-center justify-between border-r border-slate-800">
              <span className="font-bold">ชื่องานและผู้รับผิดชอบ</span>
              <span className="text-slate-400 text-[11px]">กำหนดส่ง</span>
            </div>

            {/* Right Weeks Scale */}
            <div className="col-span-8 flex divide-x divide-slate-800 text-center">
              {months.map((m) => (
                <div key={m.id} className="flex-1 py-1.5 flex flex-col justify-center">
                  <div className="text-[11px] font-bold text-indigo-300">{m.name}</div>
                  <div className="flex justify-around text-[9px] text-slate-400 pt-0.5 font-normal">
                    {m.weeks.map((w) => (
                      <span key={w.id} className="flex-1">
                        {w.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Rows */}
          <div className="space-y-2">
            {filteredTasks.map((task) => {
              const overdue = isTaskOverdue(task.deadlineDate, task.status);
              const barPos = getBarPosition(task.startDate, task.deadlineDate);

              let barBg = 'bg-blue-600 hover:bg-blue-700';
              if (task.status === 'completed') {
                barBg = 'bg-emerald-600 hover:bg-emerald-700';
              } else if (task.status === 'blocked') {
                barBg = 'bg-rose-600 hover:bg-rose-700';
              } else if (task.status === 'review') {
                barBg = 'bg-amber-500 hover:bg-amber-600';
              }

              const logsCount = task.logs?.length || 0;
              const latestLog = logsCount > 0 ? task.logs[0] : null;

              return (
                <div
                  key={task.id}
                  onClick={() => onOpenUpdate(task)}
                  className="grid grid-cols-12 gap-0 bg-white hover:bg-indigo-50/40 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition-all cursor-pointer p-2.5 items-center group text-xs shadow-2xs"
                >
                  {/* Left: Task Information */}
                  <div className="col-span-4 pr-3 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700">
                        {task.module}
                      </span>
                      <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1 font-medium text-slate-600">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="line-clamp-1">{task.assignees.join(', ')}</span>
                      </div>

                      <div
                        className={`font-semibold shrink-0 ${
                          overdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {task.deadlineText || formatThaiDate(task.deadlineDate)}
                      </div>
                    </div>
                  </div>

                  {/* Right: Continuous Gantt Bar with Grid Lines & Pins */}
                  <div className="col-span-8 flex items-center h-8 bg-slate-50/80 rounded-lg p-1 relative overflow-hidden border border-slate-100">
                    {/* Background Grid Guidelines for weeks */}
                    <div className="absolute inset-0 flex divide-x divide-slate-200/40 pointer-events-none">
                      {totalWeeks.map((w) => (
                        <div key={w.id} className="flex-1 h-full"></div>
                      ))}
                    </div>

                    {/* The Continuous Bar */}
                    {barPos && (
                      <div
                        className={`absolute h-6 rounded-lg ${barBg} text-white shadow-xs flex items-center justify-between px-2 text-[10px] font-bold transition-all group-hover:shadow-md group-hover:scale-[1.01] z-10`}
                        style={{
                          left: barPos.left,
                          width: barPos.width,
                        }}
                        title={`${task.title} • อัปเดตล่าสุดโดย ${latestLog ? latestLog.author : 'ผู้ดูแล'}`}
                      >
                        <span className="truncate pr-1 flex items-center gap-1">
                          {task.title}
                        </span>

                        {/* Milestone Pins badge on the bar */}
                        <div className="flex items-center gap-1 shrink-0">
                          {logsCount > 0 && (
                            <span
                              className="bg-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5"
                              title={`${logsCount} บันทึกอัปเดต`}
                            >
                              <MessageSquare className="w-2.5 h-2.5" />
                              {logsCount}
                            </span>
                          )}
                          <span className="bg-black/25 px-1.5 py-0.5 rounded text-[9px] font-extrabold">
                            {task.progress}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                ไม่มีงานในหมวดหมู่นี้
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
