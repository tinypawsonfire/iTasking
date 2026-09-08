import React, { useState } from 'react';
import type { Task, TaskStatus, ModuleCategory, Priority } from '../types';
import { formatThaiDate, isTaskOverdue, getDeadlineAlertInfo } from '../utils/dateUtils';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  MessageSquare,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Flame,
  Check,
  TrendingUp,
  Tag,
  Search,
  Sparkles,
  Paperclip,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MondayTableViewProps {
  tasks: Task[];
  modules: ModuleCategory[];
  onOpenUpdate: (task: Task, initialTab?: 'log' | 'edit') => void;
  onQuickStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask: (newTask: Task) => void;
}

export const MONDAY_STATUSES: {
  id: TaskStatus;
  label: string;
  bg: string;
  glow: string;
  badgeBg: string;
  text: string;
}[] = [
  {
    id: 'completed',
    label: 'Done',
    bg: 'bg-gradient-to-r from-[#00c875] to-[#00b067]',
    glow: 'shadow-emerald-500/20',
    badgeBg: 'bg-emerald-500',
    text: 'text-white',
  },
  {
    id: 'in_progress',
    label: 'Working on it',
    bg: 'bg-gradient-to-r from-[#fdab3d] to-[#f59e0b]',
    glow: 'shadow-amber-500/20',
    badgeBg: 'bg-amber-500',
    text: 'text-white',
  },
  {
    id: 'review',
    label: 'Waiting for Review',
    bg: 'bg-gradient-to-r from-[#579bfc] to-[#3b82f6]',
    glow: 'shadow-blue-500/20',
    badgeBg: 'bg-blue-500',
    text: 'text-white',
  },
  {
    id: 'blocked',
    label: 'Stuck',
    bg: 'bg-gradient-to-r from-[#df2f4a] to-[#e11d48]',
    glow: 'shadow-rose-500/20',
    badgeBg: 'bg-rose-500',
    text: 'text-white',
  },
  {
    id: 'todo',
    label: 'Not Started',
    bg: 'bg-gradient-to-r from-[#94a3b8] to-[#64748b]',
    glow: 'shadow-slate-500/20',
    badgeBg: 'bg-slate-500',
    text: 'text-white',
  },
];

export const MONDAY_PRIORITIES: { id: Priority; label: string; bg: string; text: string }[] = [
  { id: 'urgent', label: 'Critical ⚡', bg: 'bg-[#1e293b]', text: 'text-white' },
  { id: 'high', label: 'High', bg: 'bg-[#581c87]', text: 'text-purple-100' },
  { id: 'medium', label: 'Medium', bg: 'bg-[#4338ca]', text: 'text-indigo-100' },
  { id: 'low', label: 'Low', bg: 'bg-[#0284c7]', text: 'text-sky-100' },
];

export const MondayTableView: React.FC<MondayTableViewProps> = ({
  tasks,
  modules,
  onOpenUpdate,
  onQuickStatusChange,
  onAddTask,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [inlineNewTaskName, setInlineNewTaskName] = useState<Record<string, string>>({});
  const [activeStatusPickerTaskId, setActiveStatusPickerTaskId] = useState<string | null>(null);

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const handleInlineAdd = (moduleName: string) => {
    const name = inlineNewTaskName[moduleName]?.trim();
    if (!name) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      code: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      module: moduleName,
      title: name,
      detail: '',
      assignees: ['ยังไม่ระบุ'],
      status: 'in_progress',
      priority: 'medium',
      progress: 0,
      startDate: new Date().toISOString().slice(0, 10),
      deadlineDate: new Date().toISOString().slice(0, 10),
      subtasks: [],
      logs: [
        {
          id: `log-${Date.now()}`,
          taskId: `task-${Date.now()}`,
          author: 'ผู้ใช้',
          timestamp: new Date().toISOString(),
          actionType: 'created',
          content: `สร้างงาน "${name}" ในหมวด ${moduleName}`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddTask(newTask);
    setInlineNewTaskName((prev) => ({ ...prev, [moduleName]: '' }));
  };

  // Group tasks by module
  const moduleGroups = modules.map((mod) => {
    const modTasks = tasks.filter((t) => t.module.toLowerCase() === mod.name.toLowerCase());
    return {
      module: mod,
      tasks: modTasks,
    };
  });

  const otherTasks = tasks.filter(
    (t) => !modules.some((m) => m.name.toLowerCase() === t.module.toLowerCase())
  );
  if (otherTasks.length > 0) {
    moduleGroups.push({
      module: {
        id: 'other',
        name: 'อื่นๆ',
        color: '#6366f1',
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        badgeText: 'text-indigo-800',
        borderClass: 'border-l-indigo-500',
      },
      tasks: otherTasks,
    });
  }

  return (
    <div className="space-y-7 font-sans">
      {moduleGroups.map(({ module, tasks: groupTasks }) => {
        const isCollapsed = collapsedGroups[module.name];
        const groupColor = module.color || '#0073ea';

        const total = groupTasks.length;
        const doneCount = groupTasks.filter((t) => t.status === 'completed').length;
        const inProgressCount = groupTasks.filter((t) => t.status === 'in_progress').length;
        const reviewCount = groupTasks.filter((t) => t.status === 'review').length;
        const stuckCount = groupTasks.filter((t) => t.status === 'blocked').length;
        const donePercent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

        return (
          <div
            key={module.id}
            className="bg-white/95 rounded-3xl border border-slate-200/90 monday-shadow overflow-hidden transition-all duration-200 animate-fadeIn"
          >
            {/* Monday Header Section */}
            <div className="p-4 px-5 flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/40">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleGroup(module.name)}
                  className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shadow-2xs"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-sm"
                    style={{ backgroundColor: groupColor }}
                  ></span>
                  <h3
                    className="text-base sm:text-lg font-black tracking-tight"
                    style={{ color: groupColor }}
                  >
                    {module.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {groupTasks.length} รายการ
                  </span>
                </div>
              </div>

              {/* Header Right Mini Metric */}
              <div className="flex items-center gap-3 text-xs font-bold">
                <div className="hidden sm:flex items-center gap-1.5 text-slate-500">
                  <span>ความสำเร็จ:</span>
                  <span className="text-emerald-600 font-black">{donePercent}%</span>
                </div>
                <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden hidden sm:block">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${donePercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Table Content */}
            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse min-w-[1020px]">
                  <thead>
                    <tr className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3 w-12 text-center text-slate-400">#</th>
                      <th className="py-3 px-4 min-w-[260px] text-slate-700">Item (ชื่องาน)</th>
                      <th className="py-3 px-3 w-40 text-center">Owner (ผู้ดูแล)</th>
                      <th className="py-3 px-3 w-44 text-center">Status (สถานะ)</th>
                      <th className="py-3 px-3 w-52 text-center">Timeline (ไทม์ไลน์)</th>
                      <th className="py-3 px-3 w-32 text-center">Progress</th>
                      <th className="py-3 px-3 w-32 text-center">Priority</th>
                      <th className="py-3 px-3 w-20 text-center">Log</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {groupTasks.map((task, idx) => {
                      const statusConfig =
                        MONDAY_STATUSES.find((s) => s.id === task.status) || MONDAY_STATUSES[1];
                      const priorityConfig =
                        MONDAY_PRIORITIES.find((p) => p.id === task.priority) || MONDAY_PRIORITIES[2];
                      const alertInfo = getDeadlineAlertInfo(task.deadlineDate, task.status);
                      const isPickerOpen = activeStatusPickerTaskId === task.id;
                      const hasAttachments = task.attachments && task.attachments.length > 0;

                      return (
                        <tr
                          key={task.id}
                          className="hover:bg-slate-50/80 transition-all duration-150 group relative"
                          style={{ borderLeft: `6px solid ${groupColor}` }}
                        >
                          {/* Row Index */}
                          <td className="py-3.5 px-3 text-center text-slate-400 font-mono text-[11px] group-hover:text-slate-700">
                            {idx + 1}
                          </td>

                          {/* Task Name & Chat Bubble */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="space-y-0.5 min-w-0">
                                <span
                                  onClick={() => onOpenUpdate(task, 'edit')}
                                  className="font-bold text-slate-900 hover:text-[#0073ea] transition-colors cursor-pointer text-xs sm:text-sm block truncate"
                                  title="คลิกเพื่อแก้ไขข้อมูลงาน & หมวดหมู่"
                                >
                                  {task.title}
                                </span>
                                {task.detail && (
                                  <p className="text-[11px] text-slate-400 truncate max-w-sm">
                                    {task.detail}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {hasAttachments && (
                                  <span className="p-1 text-slate-400 hover:text-indigo-600 rounded" title="มีไฟล์แนบ">
                                    <Paperclip className="w-3.5 h-3.5" />
                                  </span>
                                )}

                                {/* Monday Chat Bubble Icon */}
                                <button
                                  onClick={() => onOpenUpdate(task, 'log')}
                                  className={`p-1.5 rounded-xl flex items-center gap-1 transition-all shadow-2xs cursor-pointer ${
                                    task.logs && task.logs.length > 0
                                      ? 'bg-indigo-50 text-[#0073ea] border border-blue-200 hover:bg-blue-100'
                                      : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100'
                                  }`}
                                  title="เปิดบันทึกความคืบหน้า"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  {task.logs && task.logs.length > 0 && (
                                    <span className="text-[10px] font-black">{task.logs.length}</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Owner Bubble Avatar */}
                          <td className="py-3 px-3 text-center">
                            <div
                              onClick={() => onOpenUpdate(task)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors max-w-[140px] border border-slate-200/60 shadow-2xs"
                            >
                              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {task.assignees[0]?.slice(0, 1) || 'U'}
                              </div>
                              <span className="text-[11px] font-bold truncate">
                                {task.assignees[0] || 'ยังไม่ระบุ'}
                              </span>
                            </div>
                          </td>

                          {/* Signature Monday.com Status Cell */}
                          <td className="py-2.5 px-3 text-center relative">
                            <button
                              onClick={() =>
                                setActiveStatusPickerTaskId(isPickerOpen ? null : task.id)
                              }
                              className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all duration-200 shadow-sm hover:brightness-105 flex items-center justify-center gap-1.5 ${statusConfig.bg} ${statusConfig.text}`}
                            >
                              {task.status === 'completed' && <Check className="w-3.5 h-3.5 shrink-0" />}
                              {task.status === 'in_progress' && (
                                <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0"></span>
                              )}
                              <span className="truncate">{statusConfig.label}</span>
                            </button>

                            {/* Status Picker Popover Palette */}
                            {isPickerOpen && (
                              <div
                                className="absolute left-1/2 -translate-x-1/2 top-13 w-52 glass-dropdown rounded-2xl p-2.5 z-50 space-y-1.5 animate-fadeIn"
                                onMouseLeave={() => setActiveStatusPickerTaskId(null)}
                              >
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
                                  เปลี่ยนสถานะ
                                </div>
                                {MONDAY_STATUSES.map((st) => (
                                  <button
                                    key={st.id}
                                    onClick={() => {
                                      onQuickStatusChange(task.id, st.id);
                                      setActiveStatusPickerTaskId(null);
                                      if (st.id === 'completed') {
                                        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
                                      }
                                    }}
                                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02] flex items-center justify-between shadow-2xs ${st.bg}`}
                                  >
                                    <span>{st.label}</span>
                                    {task.status === st.id && <Check className="w-4 h-4" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Capsule Timeline Bar */}
                          <td className="py-3 px-3 text-center">
                            <div
                              onClick={() => onOpenUpdate(task)}
                              className="w-full py-1.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center justify-between cursor-pointer transition-all shadow-2xs"
                              title={`เริ่ม ${formatThaiDate(task.startDate)} ➔ ส่ง ${task.deadlineText || formatThaiDate(task.deadlineDate)}`}
                            >
                              <span className="text-[10px] text-slate-400 font-mono">
                                {task.startDate ? task.startDate.slice(5) : ''}
                              </span>
                              <span className="font-bold text-slate-800 truncate px-1">
                                {task.deadlineText || formatThaiDate(task.deadlineDate)}
                              </span>
                              {alertInfo.urgency === 'overdue' ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" title="เกินกำหนด!"></span>
                              ) : (
                                <Calendar className="w-3 h-3 text-slate-400" />
                              )}
                            </div>
                          </td>

                          {/* Progress Column */}
                          <td className="py-3 px-3 text-center">
                            <div className="w-24 mx-auto space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                <span>{task.progress}%</span>
                              </div>
                              <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden shadow-inner">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    task.progress === 100
                                      ? 'bg-[#00c875]'
                                      : task.progress >= 50
                                      ? 'bg-[#0073ea]'
                                      : 'bg-[#fdab3d]'
                                  }`}
                                  style={{ width: `${task.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          {/* Priority Pill */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block w-full py-1.5 px-2 rounded-xl text-[11px] font-bold shadow-2xs ${priorityConfig.bg} ${priorityConfig.text}`}
                            >
                              {priorityConfig.label}
                            </span>
                          </td>

                          {/* Log Count */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => onOpenUpdate(task)}
                              className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-xs font-bold transition-colors"
                            >
                              {task.logs?.length || 0}
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Inline "+ Add Item" Row */}
                    <tr
                      className="bg-slate-50/30 hover:bg-slate-100/50 transition-colors"
                      style={{ borderLeft: `6px solid ${groupColor}` }}
                    >
                      <td className="py-3 px-3 text-center text-slate-400">
                        <Plus className="w-4 h-4 mx-auto text-slate-400" />
                      </td>
                      <td colSpan={7} className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={inlineNewTaskName[module.name] || ''}
                            onChange={(e) =>
                              setInlineNewTaskName({
                                ...inlineNewTaskName,
                                [module.name]: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleInlineAdd(module.name);
                            }}
                            placeholder={`+ เพิ่มงานใหม่ใน ${module.name} (พิมพ์ชื่องานแล้วกด ↵ Enter)...`}
                            className="w-full py-2 px-3 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#0073ea] focus:bg-white rounded-xl text-xs font-medium focus:outline-none transition-all placeholder:text-slate-400"
                          />
                          {inlineNewTaskName[module.name] && (
                            <button
                              onClick={() => handleInlineAdd(module.name)}
                              className="px-4 py-2 bg-[#0073ea] text-white rounded-xl font-bold text-xs hover:bg-[#0060c0] shrink-0 shadow-sm"
                            >
                              + เพิ่ม
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>

                  {/* Battery Progress Footer */}
                  {total > 0 && (
                    <tfoot>
                      <tr className="bg-slate-50/90 border-t border-slate-200 text-xs font-bold text-slate-600">
                        <td colSpan={3} className="py-3 px-5 text-slate-400 text-[11px]">
                          สรุปกลุ่ม {module.name} ({total} งาน)
                        </td>

                        {/* Battery Bar */}
                        <td className="py-3 px-3">
                          <div className="w-full h-4 rounded-lg overflow-hidden flex shadow-inner bg-slate-200">
                            {doneCount > 0 && (
                              <div
                                style={{ width: `${(doneCount / total) * 100}%` }}
                                className="bg-[#00c875] h-full"
                                title={`Done: ${doneCount}`}
                              ></div>
                            )}
                            {inProgressCount > 0 && (
                              <div
                                style={{ width: `${(inProgressCount / total) * 100}%` }}
                                className="bg-[#fdab3d] h-full"
                                title={`Working on it: ${inProgressCount}`}
                              ></div>
                            )}
                            {reviewCount > 0 && (
                              <div
                                style={{ width: `${(reviewCount / total) * 100}%` }}
                                className="bg-[#579bfc] h-full"
                                title={`Review: ${reviewCount}`}
                              ></div>
                            )}
                            {stuckCount > 0 && (
                              <div
                                style={{ width: `${(stuckCount / total) * 100}%` }}
                                className="bg-[#df2f4a] h-full"
                                title={`Stuck: ${stuckCount}`}
                              ></div>
                            )}
                          </div>
                        </td>

                        <td colSpan={4} className="py-3 px-5 text-right text-slate-500 font-bold">
                          {doneCount === total ? (
                            <span className="text-[#00c875] font-black flex items-center justify-end gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> 100% Completed!
                            </span>
                          ) : (
                            <span>{donePercent}% สำเร็จ</span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
