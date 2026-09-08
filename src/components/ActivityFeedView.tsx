import React, { useState, useMemo } from 'react';
import type { Task, ActivityLog } from '../types';
import { formatDateTimeThai, formatThaiDate } from '../utils/dateUtils';
import {
  MessageSquare,
  Clock,
  User,
  Tag,
  TrendingUp,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';

interface ActivityFeedViewProps {
  tasks: Task[];
  onOpenUpdate: (task: Task) => void;
}

export const ActivityFeedView: React.FC<ActivityFeedViewProps> = ({
  tasks,
  onOpenUpdate,
}) => {
  const [filterAuthor, setFilterAuthor] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Extract all activity logs across all tasks
  const allLogs = useMemo(() => {
    const logsList: { log: ActivityLog; task: Task }[] = [];
    tasks.forEach((t) => {
      if (t.logs && t.logs.length > 0) {
        t.logs.forEach((l) => {
          logsList.push({ log: l, task: t });
        });
      }
    });

    // Sort by timestamp descending
    return logsList.sort((a, b) => {
      const timeA = new Date(a.log.timestamp).getTime() || 0;
      const timeB = new Date(b.log.timestamp).getTime() || 0;
      return timeB - timeA;
    });
  }, [tasks]);

  // Unique authors
  const authors = useMemo(() => {
    const set = new Set<string>();
    allLogs.forEach((item) => {
      if (item.log.author) set.add(item.log.author);
    });
    return Array.from(set);
  }, [allLogs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return allLogs.filter(({ log, task }) => {
      if (filterAuthor !== 'all' && log.author !== filterAuthor) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesContent = log.content.toLowerCase().includes(q);
        const matchesTask = task.title.toLowerCase().includes(q);
        const matchesAuthor = log.author.toLowerCase().includes(q);
        if (!matchesContent && !matchesTask && !matchesAuthor) return false;
      }
      return true;
    });
  }, [allLogs, filterAuthor, searchTerm]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-5">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            ฟีดความเคลื่อนไหวล่าสุด (Recent Activity Log)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ติดตามว่าใครอัปเดตงานอะไรไปบ้าง แบบเรียลไทม์
          </p>
        </div>

        {/* Filter by author & search */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">ผู้บันทึก:</span>
            <select
              value={filterAuthor}
              onChange={(e) => setFilterAuthor(e.target.value)}
              className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">ทุกคน ({authors.length})</option>
              {authors.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาข้อความ Log..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {filteredLogs.map(({ log, task }) => (
          <div key={log.id} className="relative group">
            {/* Timeline node dot */}
            <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600 shadow-xs group-hover:scale-125 transition-transform"></div>

            <div className="bg-slate-50 hover:bg-indigo-50/40 rounded-xl p-4 border border-slate-200/80 transition-all space-y-2">
              {/* Header: Author + Timestamp + Task Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    👤 {log.author}
                  </span>
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDateTimeThai(log.timestamp)}
                  </span>
                </div>

                {/* Associated Task Pill (clickable) */}
                <button
                  onClick={() => onOpenUpdate(task)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-100 transition-all flex items-center gap-1"
                >
                  <Tag className="w-3 h-3" />
                  <span>{task.title}</span>
                  <span className="text-[10px] opacity-75">({task.module})</span>
                </button>
              </div>

              {/* Log Note Content */}
              <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-100">
                {log.content}
              </p>

              {/* Status change indicator */}
              {log.newStatus && (
                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold pt-1">
                  <span>สถานะ: {log.newStatus}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            ไม่พบประวัติการอัปเดตตามเงื่อนไขที่เลือก
          </div>
        )}
      </div>
    </div>
  );
};
