import React from 'react';
import type { Task } from '../types';
import { getDeadlineAlertInfo } from '../utils/dateUtils';
import { NotificationCenter } from './NotificationCenter';
import {
  Table2,
  Calendar,
  MessageSquare,
  LayoutGrid,
  BarChart3,
  Plus,
  Download,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  PlayCircle,
  AlertTriangle,
  LogOut,
  UserCheck,
  Cloud,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import type { UserAuthSession } from './LoginPage';

export type SimpleActiveView = 'monday' | 'calendar' | 'daily' | 'cards' | 'dashboard';

interface HeaderProps {
  activeView: SimpleActiveView;
  setActiveView: (view: SimpleActiveView) => void;
  tasks: Task[];
  onOpenNewTask: () => void;
  onOpenTaskUpdate: (task: Task) => void;
  onOpenAISummary: () => void;
  onExportData: () => void;
  onResetData: () => void;
  userSession?: UserAuthSession | null;
  onLogout?: () => void;
  isCloudConnected?: boolean;
  isSyncing?: boolean;
  onRefreshCloud?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  tasks,
  onOpenNewTask,
  onOpenTaskUpdate,
  onOpenAISummary,
  onExportData,
  onResetData,
  userSession,
  onLogout,
  isCloudConnected = false,
  isSyncing = false,
  onRefreshCloud,
}) => {
  const totalCount = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const urgentCount = tasks.filter((t) => {
    const alert = getDeadlineAlertInfo(t.deadlineDate, t.status);
    return (
      alert.urgency === 'overdue' ||
      alert.urgency === 'due_today' ||
      alert.urgency === 'due_soon'
    );
  }).length;

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top brand & actions */}
        <div className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0073ea] via-[#579bfc] to-[#a25ddc] text-white flex items-center justify-center shadow-sm font-black text-lg">
              <span>iT</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                iTasking
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#e5f4ff] text-[#0073ea] border border-[#cce5ff]">
                  Monday Style ✨
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">
                ระบบจัดการงาน ไทม์ไลน์ และสถานะสีสไตล์ Monday.com
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Cloud Sync Status Indicator */}
            <div
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                isCloudConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
              title={
                isCloudConnected
                  ? 'Vercel Database เชื่อมต่อแล้ว - ซิงค์ข้อมูลกับทุกคนในทีมแบบ Real-time'
                  : 'โหมด Local Storage (เมื่อเชื่อมต่อ Vercel KV จะซิงค์อัตโนมัติ)'
              }
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                  <span className="hidden md:inline">Syncing...</span>
                </>
              ) : isCloudConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden md:inline">Cloud Synced</span>
                  {onRefreshCloud && (
                    <button
                      onClick={onRefreshCloud}
                      className="p-1 hover:bg-emerald-100 rounded-md transition-colors ml-0.5 cursor-pointer"
                      title="กดเพื่อดึงข้อมูลล่าสุดจากคลาวด์"
                    >
                      <RefreshCw className="w-3 h-3 text-emerald-700" />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden md:inline text-[11px]">Local Mode</span>
                  {onRefreshCloud && (
                    <button
                      onClick={onRefreshCloud}
                      className="p-1 hover:bg-slate-200 rounded-md transition-colors ml-0.5 cursor-pointer"
                      title="กดเพื่อตรวจสอบการเชื่อมต่อคลาวด์"
                    >
                      <RefreshCw className="w-3 h-3 text-slate-500" />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* AI Summary Button */}
            <button
              onClick={onOpenAISummary}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              title="สร้างสรุปรายงานภาพรวมและส่ง LINE ด้วย AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-900" />
              <span>✨ สรุปรายงาน AI</span>
            </button>

            {/* Notification Bell with Badge */}
            <NotificationCenter
              tasks={tasks}
              onOpenTaskUpdate={onOpenTaskUpdate}
            />

            <button
              onClick={onExportData}
              title="ดาวน์โหลดไฟล์สำรองข้อมูล (JSON)"
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onResetData}
              title="ล้างข้อมูลทั้งหมดเพื่อเริ่มใหม่"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onOpenNewTask}
              className="px-4 py-2 bg-[#0073ea] hover:bg-[#0060c0] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Item</span>
            </button>

            {/* Logged in User Profile & Logout */}
            {userSession && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-2.5 py-1.5 rounded-xl transition-all">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                    {userSession.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-bold text-slate-800 leading-tight">
                      {userSession.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {userSession.empId} • <span className="text-indigo-600 font-bold">{userSession.bu}</span>
                    </div>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="ออกจากระบบ"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 text-xs transition-colors flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold hidden xl:inline">Logout</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* View Switcher & Quick Stats */}
        <div className="py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* View tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setActiveView('monday')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeView === 'monday'
                  ? 'bg-white text-[#0073ea] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>📋 Main Table (Monday)</span>
            </button>

            <button
              onClick={() => setActiveView('calendar')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeView === 'calendar'
                  ? 'bg-white text-[#0073ea] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>📆 ปฏิทินงาน (Calendar)</span>
            </button>

            <button
              onClick={() => setActiveView('daily')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeView === 'daily'
                  ? 'bg-white text-[#0073ea] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>📅 Daily Activity</span>
            </button>

            <button
              onClick={() => setActiveView('cards')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeView === 'cards'
                  ? 'bg-white text-[#0073ea] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>🗂️ Cards</span>
            </button>

            <button
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeView === 'dashboard'
                  ? 'bg-white text-[#0073ea] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>📈 Dashboard</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold">
              ทั้งหมด: <span className="font-bold text-slate-900">{totalCount}</span>
            </div>

            <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-semibold flex items-center gap-1">
              <PlayCircle className="w-3 h-3 text-[#fdab3d]" />
              <span>Working:</span>
              <span className="font-bold">{inProgressCount}</span>
            </div>

            <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#00c875]" />
              <span>Done:</span>
              <span className="font-bold">{completedCount}</span>
            </div>

            {urgentCount > 0 && (
              <div className="px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 font-semibold flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-[#df2f4a]" />
                <span>Urgent:</span>
                <span className="font-bold">{urgentCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
