import React from 'react';
import type { SimpleActiveView } from './Header';
import type { ModuleCategory } from '../types';
import {
  Table2,
  Calendar,
  MessageSquare,
  LayoutGrid,
  BarChart3,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Flame,
  Plus,
  FolderKanban,
  Hash,
  Users,
  LogOut,
  Building2,
  Settings,
} from 'lucide-react';
import type { UserAuthSession } from './LoginPage';

interface SidebarProps {
  activeView: SimpleActiveView;
  setActiveView: (view: SimpleActiveView) => void;
  modules: ModuleCategory[];
  selectedModule: string;
  setSelectedModule: (mod: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  totalTasksCount: number;
  urgentCount: number;
  userSession?: UserAuthSession | null;
  onLogout?: () => void;
  onAddCategory?: (name: string) => void;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  modules,
  selectedModule,
  setSelectedModule,
  isCollapsed,
  setIsCollapsed,
  totalTasksCount,
  urgentCount,
  userSession,
  onLogout,
  onAddCategory,
  onOpenSettings,
}) => {
  const [isAddingCat, setIsAddingCat] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState('');

  const handleCreateCategory = () => {
    if (newCatName.trim() && onAddCategory) {
      onAddCategory(newCatName.trim());
      setNewCatName('');
      setIsAddingCat(false);
    }
  };

  return (
    <aside
      className={`glass-panel border-r border-slate-200/80 transition-all duration-300 flex flex-col justify-between z-20 shrink-0 hidden md:flex ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Top Sidebar Header */}
      <div className="p-4 space-y-5">
        {/* Workspace Brand Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0073ea] via-[#579bfc] to-[#a25ddc] text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
              <span>iT</span>
            </div>
            {!isCollapsed && (
              <div className="animate-fadeIn">
                <h2 className="font-extrabold text-sm text-slate-900 tracking-tight leading-none flex items-center gap-1.5">
                  iTasking Pro
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">Workspace ICI</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title={isCollapsed ? 'ขยายแถบข้าง' : 'ย่อแถบข้าง'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* View Switcher Links */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Main Views
            </div>
          )}

          {[
            { id: 'monday', label: 'Main Table', icon: Table2, badge: totalTasksCount },
            { id: 'calendar', label: 'Calendar Schedule', icon: Calendar },
            { id: 'daily', label: 'Daily Activity', icon: MessageSquare },
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'cards', label: 'Cards View', icon: LayoutGrid },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as SimpleActiveView)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  isActive
                    ? 'bg-[#0073ea] text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={item.label}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {!isCollapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                {!isCollapsed && item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Categories / Modules Filter */}
        {!isCollapsed && (
          <div className="space-y-1 pt-3 border-t border-slate-200/60 animate-fadeIn">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
              <span>Categories</span>
              <div className="flex items-center gap-1">
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                    title="จัดการ & แก้ไขหมวดหมู่ (Settings)"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsAddingCat(!isAddingCat)}
                  className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                  title="+ เพิ่มหมวดหมู่ใหม่"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {isAddingCat && (
              <div className="px-2 pb-2 flex items-center gap-1.5 animate-fadeIn">
                <input
                  type="text"
                  autoFocus
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateCategory();
                    if (e.key === 'Escape') setIsAddingCat(false);
                  }}
                  placeholder="ชื่อหมวดหมู่..."
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shrink-0 hover:bg-indigo-700 cursor-pointer"
                >
                  เพิ่ม
                </button>
              </div>
            )}

            <button
              onClick={() => setSelectedModule('all')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedModule === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>ทั้งหมด</span>
            </button>

            {modules.map((m) => {
              const isSel = selectedModule.toLowerCase() === m.name.toLowerCase();
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedModule(m.name)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSel ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: m.color || '#0073ea' }}
                  ></span>
                  <span className="truncate">{m.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-200/60 space-y-3">
          {userSession && (
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-sm border border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center font-bold text-xs shadow-inner">
                    {userSession.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-100">{userSession.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{userSession.empId}</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  {userSession.bu}
                </span>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full mt-1.5 py-1.5 px-3 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 rounded-xl text-[11px] font-semibold transition-all border border-slate-700/60 flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ออกจากระบบ</span>
                </button>
              )}
            </div>
          )}

          {urgentCount > 0 && (
            <div className="p-3 bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl border border-rose-200 flex items-center gap-2.5 text-xs text-rose-900">
              <Flame className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold">มี {urgentCount} งานเร่งด่วน</div>
                <div className="text-[10px] text-rose-600 truncate">ใกล้ถึง/เกินกำหนด</div>
              </div>
            </div>
          )}

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl text-xs font-bold transition-all border border-slate-200/80 hover:border-indigo-200 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>การตั้งค่าระบบ (Settings)</span>
            </button>
          )}

          <div className="text-center text-[10px] text-slate-400 font-medium">
            iTasking Pro Edition v2.5
          </div>
        </div>
      )}
    </aside>
  );
};
