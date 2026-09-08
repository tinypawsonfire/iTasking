import React from 'react';
import { Task, UserProfile } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatThaiDate, isTaskOverdue } from '../utils/dateUtils';
import { User, CheckCircle2, Clock, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react';

interface TeamWorkloadViewProps {
  tasks: Task[];
  users: UserProfile[];
  onSelectTask: (task: Task) => void;
}

export const TeamWorkloadView: React.FC<TeamWorkloadViewProps> = ({
  tasks,
  users,
  onSelectTask,
}) => {
  // Compute workload statistics per team member
  const memberWorkloads = users.map((user) => {
    const userTasks = tasks.filter((t) =>
      t.assignees.some((name) => name.toLowerCase().includes(user.name.toLowerCase()) || user.name.toLowerCase().includes(name.toLowerCase()))
    );

    const completed = userTasks.filter((t) => t.status === 'completed').length;
    const inProgress = userTasks.filter((t) => t.status === 'in_progress').length;
    const overdue = userTasks.filter((t) => isTaskOverdue(t.deadlineDate, t.status)).length;
    const avgProgress =
      userTasks.length > 0
        ? Math.round(userTasks.reduce((acc, t) => acc + t.progress, 0) / userTasks.length)
        : 0;

    return {
      user,
      tasks: userTasks,
      total: userTasks.length,
      completed,
      inProgress,
      overdue,
      avgProgress,
    };
  }).filter((w) => w.total > 0);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            ภาระงานและความคืบหน้ารายบุคคล (Assignee Workload & Progress)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ดูว่าใครรับผิดชอบงานอะไรบ้าง กำลังทำถึงไหนแล้ว และมีงานค้างหรือเกินกำหนดหรือไม่
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          <span>ผู้รับผิดชอบที่กำลังมีงาน:</span>
          <span className="text-indigo-600 font-bold">{memberWorkloads.length} คน</span>
        </div>
      </div>

      {/* Grid of Team Member Workload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {memberWorkloads.map(({ user, tasks: userTasks, total, completed, inProgress, overdue, avgProgress }) => (
          <div
            key={user.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-indigo-300 transition-all"
          >
            <div>
              {/* Member Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl ${user.avatarColor} text-white flex items-center justify-center font-bold text-base shadow-sm`}
                  >
                    {user.name.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{user.name}</h4>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 mt-0.5">
                      สังกัด: {user.team} • {user.role}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-indigo-600">{total}</div>
                  <div className="text-[10px] text-slate-400 font-medium">งานทั้งหมด</div>
                </div>
              </div>

              {/* Progress Summary Bar */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> ปิดงานสำเร็จแล้ว
                  </span>
                  <span className="font-bold text-emerald-600">{completed}/{total} งาน</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                  ></div>
                </div>

                {/* Stat Badges */}
                <div className="grid grid-cols-3 gap-1 pt-1 text-center">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400">กำลังทำ</div>
                    <div className="font-bold text-blue-600 text-xs">{inProgress}</div>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400">เสร็จแล้ว</div>
                    <div className="font-bold text-emerald-600 text-xs">{completed}</div>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400">เกินกำหนด</div>
                    <div className={`font-bold text-xs ${overdue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {overdue}
                    </div>
                  </div>
                </div>
              </div>

              {/* Task List under Member */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  รายการงานที่รับผิดชอบ
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {userTasks.map((t) => {
                    const taskOverdue = isTaskOverdue(t.deadlineDate, t.status);

                    return (
                      <div
                        key={t.id}
                        onClick={() => onSelectTask(t)}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/30 transition-all cursor-pointer text-xs group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                            {t.module}
                          </span>
                          <span
                            className={`text-[10px] font-medium ${
                              taskOverdue ? 'text-rose-600 font-bold' : 'text-slate-400'
                            }`}
                          >
                            {t.deadlineText || formatThaiDate(t.deadlineDate)}
                          </span>
                        </div>

                        <div className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {t.title}
                        </div>

                        <div className="flex items-center justify-end mt-2 pt-1 border-t border-slate-100 text-[10px]">
                          <StatusBadge status={t.status} size="sm" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
