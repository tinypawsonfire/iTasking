import React from 'react';
import type { Task, ModuleCategory } from '../types';
import { formatThaiDate, getDeadlineAlertInfo } from '../utils/dateUtils';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Layers,
  Sparkles,
  ArrowRight,
  Flame,
  BarChart3,
  PieChart,
} from 'lucide-react';

interface ExecutiveDashboardProps {
  tasks: Task[];
  modules: ModuleCategory[];
  onOpenTaskUpdate: (task: Task) => void;
  onOpenAISummary: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  tasks,
  modules,
  onOpenTaskUpdate,
  onOpenAISummary,
}) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const reviewTasks = tasks.filter((t) => t.status === 'review' || t.status === 'blocked');
  const urgentTasks = tasks.filter((t) => {
    const alert = getDeadlineAlertInfo(t.deadlineDate, t.status);
    return alert.urgency === 'overdue' || alert.urgency === 'due_today' || alert.urgency === 'due_soon';
  });

  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const avgProgress = totalTasks > 0 ? Math.round(tasks.reduce((a, b) => a + b.progress, 0) / totalTasks) : 0;

  // Workload by Assignee
  const assigneeMap = new Map<string, { total: number; completed: number; progressSum: number; tasks: Task[] }>();
  tasks.forEach((t) => {
    t.assignees.forEach((name) => {
      if (!assigneeMap.has(name)) {
        assigneeMap.set(name, { total: 0, completed: 0, progressSum: 0, tasks: [] });
      }
      const entry = assigneeMap.get(name)!;
      entry.total += 1;
      if (t.status === 'completed') entry.completed += 1;
      entry.progressSum += t.progress;
      entry.tasks.push(t);
    });
  });

  const assigneeStats = Array.from(assigneeMap.entries()).map(([name, data]) => ({
    name,
    total: data.total,
    completed: data.completed,
    avgProgress: Math.round(data.progressSum / data.total),
    tasks: data.tasks,
  })).sort((a, b) => b.total - a.total);

  // Distribution by Module
  const moduleStats = modules.map((m) => {
    const modTasks = tasks.filter((t) => t.module.toLowerCase() === m.name.toLowerCase());
    const modDone = modTasks.filter((t) => t.status === 'completed').length;
    const modProgress = modTasks.length > 0 ? Math.round(modTasks.reduce((a, b) => a + b.progress, 0) / modTasks.length) : 0;
    return {
      module: m,
      total: modTasks.length,
      completed: modDone,
      avgProgress: modProgress,
    };
  }).filter((m) => m.total > 0);

  return (
    <div className="space-y-6">
      {/* Dashboard Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-indigo-200 uppercase tracking-wider">
            Executive Summary Overview
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            แดชบอร์ดสรุปภาพรวมผู้บริหาร (iTasking Dashboard)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            ติดตามประสิทธิภาพของทีม อัตราความสำเร็จ และงานเร่งด่วนที่ต้องสนับสนุน
          </p>
        </div>

        <button
          onClick={onOpenAISummary}
          className="px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-slate-900" />
          <span>✨ สร้างสรุปรายงานด้วย AI</span>
        </button>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks & Completion */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">อัตรางานสำเร็จ</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{completedTasks.length}/{totalTasks}</span>
            <span className="text-xs text-slate-400">งานที่เสร็จสิ้น</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0}%` }}></div>
          </div>
        </div>

        {/* Total Tasks */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">งานทั้งหมดในระบบ</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600">{totalTasks}</span>
            <span className="text-xs text-slate-400">รายการงานทั้งหมด</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">กำลังดำเนินการ</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-600">{inProgressTasks.length}</span>
            <span className="text-xs text-slate-400">งานที่กำลังทำ</span>
          </div>
          <div className="text-[11px] text-slate-500">
            รอตรวจ/สัญญา: <span className="font-bold text-amber-600">{reviewTasks.length} งาน</span>
          </div>
        </div>

        {/* Urgent Actions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">งานต้องเร่งรัด</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">{urgentTasks.length}</span>
            <span className="text-xs text-slate-400">ใกล้ถึง/เกินกำหนด</span>
          </div>
          <div className="text-[11px] text-rose-600 font-semibold">
            {urgentTasks.length > 0 ? '⚠️ ต้องติดตามผู้ดูแลด่วน' : '✨ ไม่มีงานค้าง'}
          </div>
        </div>
      </div>

      {/* Middle Section: Module Progress & Assignee Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Performance */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-indigo-600" />
              ความคืบหน้าแยกตามหมวดหมู่ / ฝ่าย
            </h3>
            <span className="text-xs text-slate-400 font-medium">{moduleStats.length} หมวด</span>
          </div>

          <div className="space-y-4">
            {moduleStats.map(({ module, total, completed, avgProgress: modProg }) => (
              <div key={module.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: module.color || '#6366f1' }}
                    ></span>
                    <span className="font-bold text-slate-800">{module.name}</span>
                    <span className="text-slate-400 text-[11px]">({completed}/{total} งาน)</span>
                  </div>
                  <span className="font-extrabold text-indigo-600">เสร็จ {completed}/{total}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${total > 0 ? (completed / total) * 100 : 0}%`,
                      backgroundColor: module.color || '#6366f1',
                    }}
                  ></div>
                </div>
              </div>
            ))}

            {moduleStats.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">ยังไม่มีข้อมูลหมวดหมู่</div>
            )}
          </div>
        </div>

        {/* Assignee Workload & Output */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-indigo-600" />
              ภาระงานและผลงานรายบุคคล
            </h3>
            <span className="text-xs text-slate-400 font-medium">{assigneeStats.length} ผู้ดูแล</span>
          </div>

          <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
            {assigneeStats.map(({ name, total, completed }) => (
              <div
                key={name}
                className="p-3 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-200/70 transition-all flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{name}</div>
                    <div className="text-[11px] text-slate-400">
                      งานทั้งหมด: <span className="font-semibold text-slate-700">{total}</span> • เสร็จแล้ว:{' '}
                      <span className="font-semibold text-emerald-600">{completed}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1 min-w-[90px]">
                  <div className="font-bold text-slate-700 text-xs">เสร็จ {completed}/{total}</div>
                  <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden ml-auto">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            ))}

            {assigneeStats.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">ยังไม่มีข้อมูลผู้รับผิดชอบ</div>
            )}
          </div>
        </div>
      </div>

      {/* Urgent Bottlenecks Table */}
      {urgentTasks.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-rose-100">
            <h3 className="font-bold text-rose-800 flex items-center gap-2 text-sm">
              <Flame className="w-4 h-4 text-rose-600" />
              รายการงานที่ต้องสนับสนุนด่วน (Action Required)
            </h3>
            <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-full">
              {urgentTasks.length} รายการ
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {urgentTasks.map((task) => {
              const alert = getDeadlineAlertInfo(task.deadlineDate, task.status);
              return (
                <div
                  key={task.id}
                  onClick={() => onOpenTaskUpdate(task)}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-rose-50/40 p-2 rounded-xl cursor-pointer transition-colors text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {task.module}
                      </span>
                      <span className="font-bold text-slate-900">{task.title}</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      ผู้ดูแล: <span className="font-semibold text-slate-800">{task.assignees.join(', ')}</span> • กำหนดส่ง:{' '}
                      <span className="font-semibold">{task.deadlineText || formatThaiDate(task.deadlineDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] border ${alert.badgeClass}`}>
                      {alert.badgeText}
                    </span>
                    <button className="text-indigo-600 font-bold hover:underline flex items-center gap-0.5">
                      <span>อัปเดต</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
