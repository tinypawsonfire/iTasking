import React from 'react';
import { ModuleCategory, Task, TaskStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { generateTimelineHeader, formatThaiDate, isTaskOverdue } from '../utils/dateUtils';
import { ChevronRight, Calendar, User, CheckCircle2, AlertCircle } from 'lucide-react';

interface GanttTimelineViewProps {
  tasks: Task[];
  modules: ModuleCategory[];
  onSelectTask: (task: Task) => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
}

export const GanttTimelineView: React.FC<GanttTimelineViewProps> = ({
  tasks,
  modules,
  onSelectTask,
  onUpdateStatus,
}) => {
  const { months, totalWeeks } = generateTimelineHeader();

  // Helper to determine if a week overlaps with task start & deadline dates
  const isWeekActive = (weekStartDate: Date, weekEndDate: Date, taskStartStr: string, taskEndStr: string) => {
    try {
      const taskStart = new Date(taskStartStr);
      const taskEnd = new Date(taskEndStr);

      return weekStartDate <= taskEnd && weekEndDate >= taskStart;
    } catch {
      return false;
    }
  };

  const getWeekProgressType = (
    weekStartDate: Date,
    weekEndDate: Date,
    taskStartStr: string,
    taskEndStr: string
  ): 'start' | 'middle' | 'end' | 'single' | 'none' => {
    try {
      const taskStart = new Date(taskStartStr);
      const taskEnd = new Date(taskEndStr);

      const isActive = weekStartDate <= taskEnd && weekEndDate >= taskStart;
      if (!isActive) return 'none';

      const isStartWeek = weekStartDate <= taskStart && taskStart <= weekEndDate;
      const isEndWeek = weekStartDate <= taskEnd && taskEnd <= weekEndDate;

      if (isStartWeek && isEndWeek) return 'single';
      if (isStartWeek) return 'start';
      if (isEndWeek) return 'end';
      return 'middle';
    } catch {
      return 'none';
    }
  };

  // Group tasks by module
  const tasksByModule = modules.map((mod) => ({
    module: mod,
    tasks: tasks.filter((t) => t.module.toLowerCase() === mod.name.toLowerCase()),
  })).filter(group => group.tasks.length > 0);

  // Remaining tasks without a matching module category
  const otherTasks = tasks.filter(
    (t) => !modules.some((m) => m.name.toLowerCase() === t.module.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* View Header with Legend */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            ตารางไทม์ไลน์ภาพรวม (Master Gantt Timeline)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            คำนวณและแสดงแถบระยะเวลาทำงานรายสัปดาห์อัตโนมัติ คลิกที่แถบหรือชื่องานเพื่อดู Log ความคืบหน้า
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500 inline-block shadow-sm"></span>
            <span className="text-slate-600 font-medium">In progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600 inline-block shadow-sm"></span>
            <span className="text-slate-600 font-medium">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500 inline-block shadow-sm"></span>
            <span className="text-slate-600 font-medium">Blocked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 inline-block shadow-sm"></span>
            <span className="text-slate-600 font-medium">Review</span>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Gantt Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse min-w-[1200px]">
          {/* Main Column Headers */}
          <thead>
            <tr className="bg-slate-900 text-white font-semibold text-center border-b border-slate-800">
              {/* Left Static Headers */}
              <th className="py-3 px-3 w-56 text-left border-r border-slate-800">Module / Task</th>
              <th className="py-3 px-3 w-64 text-left border-r border-slate-800">Detail</th>
              <th className="py-3 px-3 w-40 text-left border-r border-slate-800">ผู้รับผิดชอบ</th>
              <th className="py-3 px-3 w-32 text-center border-r border-slate-800">Status</th>
              <th className="py-3 px-3 w-32 text-center border-r border-slate-800">Deadline</th>

              {/* Month Group Headers */}
              {months.map((m) => (
                <th
                  key={m.id}
                  colSpan={m.weeks.length}
                  className="py-2 px-1 border-r border-slate-800 text-center tracking-wider text-xs font-bold uppercase bg-slate-800/90 text-indigo-200"
                >
                  {m.name} <span className="text-[10px] text-slate-400 font-normal">({m.nameThai.split(' ')[0]})</span>
                </th>
              ))}
            </tr>

            {/* Sub-header: Week Numbers (W1, W2, W3, W4...) */}
            <tr className="bg-slate-800 text-slate-300 text-[11px] font-medium text-center border-b border-slate-700">
              <th className="py-1 px-3 text-left border-r border-slate-700"></th>
              <th className="py-1 px-3 text-left border-r border-slate-700"></th>
              <th className="py-1 px-3 text-left border-r border-slate-700"></th>
              <th className="py-1 px-3 text-center border-r border-slate-700"></th>
              <th className="py-1 px-3 text-center border-r border-slate-700"></th>

              {totalWeeks.map((w) => (
                <th
                  key={w.id}
                  className="py-1.5 px-0.5 w-10 border-r border-slate-700/60 font-semibold"
                >
                  {w.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200">
            {tasksByModule.map(({ module, tasks }) => (
              <React.Fragment key={module.id}>
                {/* Module Section Banner (Matching the colored header rows in spreadsheet) */}
                <tr
                  className="font-bold text-xs"
                  style={{ backgroundColor: `${module.color}18` }}
                >
                  <td
                    colSpan={5 + totalWeeks.length}
                    className="py-2.5 px-3 border-y border-slate-200"
                    style={{ borderLeft: `5px solid ${module.color}` }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-0.5 rounded text-white text-xs font-extrabold uppercase shadow-sm"
                        style={{ backgroundColor: module.color }}
                      >
                        {module.name}
                      </span>
                      <span className="text-slate-600 font-medium text-xs">
                        ({tasks.length} งาน)
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Individual Tasks within Module */}
                {tasks.map((task, idx) => {
                  const overdue = isTaskOverdue(task.deadlineDate, task.status);

                  return (
                    <tr
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                    >
                      {/* Task Title */}
                      <td className="py-2.5 px-3 border-r border-slate-100 font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[11px] font-mono w-4">
                            {idx + 1}.
                          </span>
                          <span className="group-hover:text-indigo-600 transition-colors">
                            {task.title}
                          </span>
                        </div>
                      </td>

                      {/* Detail */}
                      <td className="py-2.5 px-3 border-r border-slate-100 text-slate-600 text-xs max-w-xs truncate">
                        {task.detail || '-'}
                      </td>

                      {/* ผู้รับผิดชอบ (Assignees) */}
                      <td className="py-2.5 px-3 border-r border-slate-100">
                        <div className="flex flex-wrap gap-1">
                          {task.assignees.map((name, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              {name}
                            </span>
                          ))}
                          {task.assignees.length === 0 && (
                            <span className="text-slate-300">-</span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td
                        className="py-2.5 px-2 border-r border-slate-100 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <StatusBadge
                          status={task.status}
                          size="sm"
                          interactive={true}
                          onChange={(newSt) => onUpdateStatus(task.id, newSt)}
                        />
                      </td>

                      {/* Deadline */}
                      <td className="py-2.5 px-3 border-r border-slate-100 text-center text-slate-700 font-medium whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span className={overdue ? 'text-rose-600 font-bold' : ''}>
                            {task.deadlineText || formatThaiDate(task.deadlineDate)}
                          </span>
                          {overdue && (
                            <span className="text-[10px] text-rose-500 font-semibold">
                              (เกินกำหนด)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Gantt Timeline Weeks Cells */}
                      {totalWeeks.map((week) => {
                        const active = isWeekActive(
                          week.startDate,
                          week.endDate,
                          task.startDate,
                          task.deadlineDate
                        );

                        const progressType = getWeekProgressType(
                          week.startDate,
                          week.endDate,
                          task.startDate,
                          task.deadlineDate
                        );

                        // Colors by status
                        let barBg = 'bg-blue-500';
                        if (task.status === 'completed') barBg = 'bg-emerald-500';
                        else if (task.status === 'blocked') barBg = 'bg-rose-500';
                        else if (task.status === 'review') barBg = 'bg-amber-500';

                        return (
                          <td
                            key={week.id}
                            className="p-0 border-r border-slate-100 text-center relative h-10 w-10 bg-slate-50/30"
                          >
                            {active && (
                              <div
                                className={`h-6 mx-0.5 rounded-sm ${barBg} text-white flex items-center justify-center font-bold text-[10px] shadow-sm transition-transform hover:scale-105 ${
                                  progressType === 'start'
                                    ? 'rounded-l-md ml-1'
                                    : progressType === 'end'
                                    ? 'rounded-r-md mr-1'
                                    : progressType === 'single'
                                    ? 'rounded-md mx-1'
                                    : ''
                                }`}
                                title={`${task.title} - ${week.month} ${week.label}`}
                              >
                                {progressType === 'start' || progressType === 'single' ? (
                                  <span className="truncate px-1 text-[9px]">
                                    {task.title}
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            {/* Other tasks without matching group */}
            {otherTasks.length > 0 && (
              <>
                <tr className="bg-slate-200 font-bold text-xs">
                  <td colSpan={5 + totalWeeks.length} className="py-2 px-3 border-y border-slate-300">
                    หมวดอื่นๆ ({otherTasks.length})
                  </td>
                </tr>
                {otherTasks.map((task, idx) => (
                  <tr
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="hover:bg-indigo-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 border-r border-slate-100 font-semibold text-slate-800">
                      {task.title}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-slate-600 text-xs">
                      {task.detail}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100">
                      {task.assignees.join(', ')}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-100 text-center">
                      <StatusBadge status={task.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                      {task.deadlineText || formatThaiDate(task.deadlineDate)}
                    </td>
                    {totalWeeks.map((week) => (
                      <td key={week.id} className="p-0 border-r border-slate-100 text-center h-10 w-10"></td>
                    ))}
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
