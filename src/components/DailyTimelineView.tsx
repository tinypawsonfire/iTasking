import React, { useState, useMemo } from 'react';
import type { Task, ActivityLog } from '../types';
import { formatDateTimeThai, formatThaiDate } from '../utils/dateUtils';
import {
  Calendar,
  Clock,
  User,
  Tag,
  TrendingUp,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Flame,
  Layers,
} from 'lucide-react';

interface DailyTimelineViewProps {
  tasks: Task[];
  onOpenUpdate: (task: Task) => void;
}

interface GroupedDailyLogs {
  dateKey: string; // YYYY-MM-DD
  dateDisplay: string; // e.g. "วันนี้ (4 ก.ย. 2026)"
  isToday: boolean;
  isYesterday: boolean;
  items: { log: ActivityLog; task: Task }[];
}

export const DailyTimelineView: React.FC<DailyTimelineViewProps> = ({
  tasks,
  onOpenUpdate,
}) => {
  const [filterAuthor, setFilterAuthor] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Extract and group logs by date
  const groupedDailyLogs = useMemo(() => {
    const rawList: { log: ActivityLog; task: Task }[] = [];
    tasks.forEach((t) => {
      if (t.logs && t.logs.length > 0) {
        t.logs.forEach((l) => {
          rawList.push({ log: l, task: t });
        });
      }
    });

    // Filter by author and search query
    const filtered = rawList.filter(({ log, task }) => {
      if (filterAuthor !== 'all' && log.author !== filterAuthor) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mContent = log.content.toLowerCase().includes(q);
        const mTask = task.title.toLowerCase().includes(q);
        const mAuthor = log.author.toLowerCase().includes(q);
        if (!mContent && !mTask && !mAuthor) return false;
      }
      return true;
    });

    // Sort descending by timestamp
    filtered.sort((a, b) => {
      const tA = new Date(a.log.timestamp).getTime() || 0;
      const tB = new Date(b.log.timestamp).getTime() || 0;
      return tB - tA;
    });

    // Group by Date string (YYYY-MM-DD)
    const map = new Map<string, { log: ActivityLog; task: Task }[]>();
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    filtered.forEach((item) => {
      const dateKey = item.log.timestamp ? item.log.timestamp.slice(0, 10) : todayStr;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(item);
    });

    const groups: GroupedDailyLogs[] = [];
    map.forEach((items, dateKey) => {
      const isToday = dateKey === todayStr;
      const isYesterday = dateKey === yesterdayStr;
      let dateDisplay = formatThaiDate(dateKey);
      if (isToday) dateDisplay = `วันนี้ (${formatThaiDate(dateKey)})`;
      else if (isYesterday) dateDisplay = `เมื่อวาน (${formatThaiDate(dateKey)})`;

      groups.push({
        dateKey,
        dateDisplay,
        isToday,
        isYesterday,
        items,
      });
    });

    return groups;
  }, [tasks, filterAuthor, searchTerm]);

  // Unique authors
  const authors = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      t.logs?.forEach((l) => {
        if (l.author) set.add(l.author);
      });
    });
    return Array.from(set);
  }, [tasks]);

  const totalLogsCount = groupedDailyLogs.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            ไทม์ไลน์บันทึกรายวัน (Daily Activity Storyline)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            เห็นภาพชัดเจนว่าในแต่ละวันใครเข้ามาอัปเดตงานอะไร คืบหน้าไปถึงไหนแล้ว
          </p>
        </div>

        {/* Filter by author and search */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">ผู้ดูแล:</span>
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
              placeholder="ค้นหาข้อความอัปเดต..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Visual Day-by-Day Timeline Stream */}
      <div className="space-y-8">
        {groupedDailyLogs.map((group) => (
          <div key={group.dateKey} className="space-y-3">
            {/* Date Group Header Badge */}
            <div className="flex items-center gap-2">
              <div
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs ${
                  group.isToday
                    ? 'bg-indigo-600 text-white shadow-indigo-200 ring-2 ring-indigo-300/40'
                    : group.isYesterday
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{group.dateDisplay}</span>
              </div>
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-[11px] text-slate-400 font-medium">
                {group.items.length} รายการอัปเดต
              </span>
            </div>

            {/* Daily Events Cards */}
            <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200">
              {group.items.map(({ log, task }) => (
                <div key={log.id} className="relative group">
                  {/* Timeline Pin Dot */}
                  <div className="absolute -left-[22px] top-3.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600 shadow-xs group-hover:scale-125 transition-transform flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                  </div>

                  <div className="bg-slate-50 hover:bg-indigo-50/40 rounded-2xl p-4 border border-slate-200/80 hover:border-indigo-300 transition-all space-y-2">
                    {/* Event Meta Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1">
                          <User className="w-3 h-3 text-indigo-600" /> {log.author}
                        </span>
                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDateTimeThai(log.timestamp).split('เวลา')[1] ? `เวลา ${formatDateTimeThai(log.timestamp).split('เวลา')[1]}` : ''}
                        </span>
                      </div>

                      {/* Associated Task Pill */}
                      <button
                        onClick={() => onOpenUpdate(task)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-100 transition-all flex items-center gap-1"
                        title="คลิกเพื่อเปิดดูรายละเอียดงาน"
                      >
                        <Tag className="w-3 h-3" />
                        <span>{task.title}</span>
                        <span className="text-[10px] opacity-75">({task.module})</span>
                      </button>
                    </div>

                    {/* Log Note Content */}
                    <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                      {log.content}
                    </p>

                    {/* Progress / Status Change Tag */}
                    {(log.progressPercent !== undefined || log.newStatus) && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-1 border-t border-slate-100/80">
                        <div className="flex items-center gap-2">
                          {log.progressPercent !== undefined && (
                            <span className="text-indigo-600 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> ความคืบหน้า: {log.progressPercent}%
                            </span>
                          )}
                          {log.newStatus && <span>• สถานะ: {log.newStatus}</span>}
                        </div>

                        <button
                          onClick={() => onOpenUpdate(task)}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 hover:underline"
                        >
                          <span>อัปเดตต่อ</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {groupedDailyLogs.length === 0 && (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">ยังไม่มีบันทึกความเคลื่อนไหวรายวัน</p>
            <p className="text-xs text-slate-400">
              เมื่อมีคนกด "อัปเดตงาน" ไทม์ไลน์รายวันจะแสดงประวัติที่นี่โดยอัตโนมัติ
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
