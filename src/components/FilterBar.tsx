import React from 'react';
import type { ModuleCategory } from '../types';
import { Search, X, Filter, User, Layers } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedModule: string;
  setSelectedModule: (mod: string) => void;
  selectedAssignee: string;
  setSelectedAssignee: (assignee: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  modules: ModuleCategory[];
  availableUsers: string[];
  totalFilteredCount: number;
  totalTasksCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedModule,
  setSelectedModule,
  selectedAssignee,
  setSelectedAssignee,
  selectedStatus,
  setSelectedStatus,
  modules = [],
  availableUsers = [],
  totalFilteredCount = 0,
  totalTasksCount = 0,
}) => {
  const hasActiveFilters =
    searchQuery !== '' ||
    selectedModule !== 'all' ||
    selectedAssignee !== 'all' ||
    selectedStatus !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedModule('all');
    setSelectedAssignee('all');
    setSelectedStatus('all');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs space-y-3">
      {/* Search & Reset */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่องาน, ผู้รับผิดชอบ, หรือรายละเอียด..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
          {[
            { id: 'all', label: 'ทุกสถานะ' },
            { id: 'in_progress', label: 'กำลังทำ' },
            { id: 'review', label: 'รอตรวจ/สัญญา' },
            { id: 'completed', label: 'เสร็จแล้ว' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                selectedStatus === st.id
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition-colors"
          >
            <X className="w-3.5 h-3.5" /> ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* Module and Assignee Quick Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        {/* Module Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Layers className="w-3 h-3" /> หมวด:
          </span>
          <button
            onClick={() => setSelectedModule('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              selectedModule === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด
          </button>
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModule(m.name)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedModule === m.name
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>

        {/* Assignee Filter dropdown */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">ผู้รับผิดชอบ:</span>
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="all">ทุกคน ({availableUsers.length})</option>
            {availableUsers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
