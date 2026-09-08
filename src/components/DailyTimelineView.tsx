import React, { useState, useMemo } from 'react';
import type { Task, ActivityLog, TaskStatus } from '../types';
import { formatDateTimeThai, formatThaiDate } from '../utils/dateUtils';
import {
  Calendar,
  Clock,
  User,
  Tag,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Flame,
  Layers,
  Edit3,
  Trash2,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface DailyTimelineViewProps {
  tasks: Task[];
  onOpenUpdate: (task: Task) => void;
  onUpdateTask?: (updatedTask: Task) => void;
  availableUsers?: string[];
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
  onUpdateTask,
  availableUsers = [],
}) => {
  const [filterAuthor, setFilterAuthor] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Editing state for a timeline log
  const [editingItem, setEditingItem] = useState<{ log: ActivityLog; task: Task } | null>(null);
  const [editAuthor, setEditAuthor] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus | ''>('');

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

  const STATUS_LABELS: Record<string, string> = {
    todo: 'รอดำเนินการ',
    in_progress: 'กำลังดำเนินการ',
    review: 'รอตรวจสอบ',
    completed: 'เสร็จสิ้นแล้ว',
    blocked: 'ติดปัญหา / ล่าช้า',
  };

  const handleStartEdit = (log: ActivityLog, task: Task) => {
    setEditingItem({ log, task });
    setEditAuthor(log.author || '');
    setEditContent(log.content || '');
    setEditStatus(log.newStatus || '');

    const logDate = new Date(log.timestamp);
    if (!isNaN(logDate.getTime())) {
      const y = logDate.getFullYear();
      const m = String(logDate.getMonth() + 1).padStart(2, '0');
      const d = String(logDate.getDate()).padStart(2, '0');
      setEditDate(`${y}-${m}-${d}`);
      const hh = String(logDate.getHours()).padStart(2, '0');
      const mm = String(logDate.getMinutes()).padStart(2, '0');
      setEditTime(`${hh}:${mm}`);
    } else {
      const now = new Date();
      setEditDate(now.toISOString().slice(0, 10));
      setEditTime('12:00');
    }
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const { log, task } = editingItem;

    let newTimestamp = log.timestamp;
    if (editDate) {
      const timeStr = editTime ? `${editTime}:00` : '12:00:00';
      const parsedDate = new Date(`${editDate}T${timeStr}`);
      if (!isNaN(parsedDate.getTime())) {
        newTimestamp = parsedDate.toISOString();
      }
    }

    const updatedLog: ActivityLog = {
      ...log,
      author: editAuthor.trim() || log.author,
      content: editContent.trim(),
      timestamp: newTimestamp,
      newStatus: editStatus ? (editStatus as TaskStatus) : undefined,
    };

    const updatedLogs = (task.logs || []).map((l) => (l.id === log.id ? updatedLog : l));
    const updatedTask: Task = {
      ...task,
      logs: updatedLogs,
      ...(editStatus ? { status: editStatus as TaskStatus } : {}),
      updatedAt: new Date().toISOString(),
    };

    onUpdateTask?.(updatedTask);
    setEditingItem(null);
  };

  const handleDeleteLog = (task: Task, logId: string) => {
    if (!window.confirm('คุณต้องการลบรายการบันทึกนี้จาก Timeline ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      return;
    }

    const updatedLogs = (task.logs || []).filter((l) => l.id !== logId);
    const updatedTask: Task = {
      ...task,
      logs: updatedLogs,
      updatedAt: new Date().toISOString(),
    };

    onUpdateTask?.(updatedTask);
  };

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

                  <div className="bg-slate-50 hover:bg-indigo-50/30 rounded-2xl p-4 border border-slate-200/80 hover:border-indigo-300 transition-all space-y-2.5">
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

                      {/* Associated Task Pill + Edit/Delete Actions */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => onOpenUpdate(task)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-100 transition-all flex items-center gap-1 cursor-pointer"
                          title="คลิกเพื่อเปิดดูรายละเอียดงาน"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{task.title}</span>
                          <span className="text-[10px] opacity-75">({task.module})</span>
                        </button>

                        {onUpdateTask && (
                          <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(log, task)}
                              className="px-2 py-1 rounded-md text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                              title="แก้ไขบันทึกนี้"
                            >
                              <Edit3 className="w-3 h-3 text-indigo-600" />
                              <span>แก้ไข</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLog(task, log.id)}
                              className="px-2 py-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                              title="ลบบันทึกนี้ (เผื่อดำเนินการผิดพลาด)"
                            >
                              <Trash2 className="w-3 h-3 text-rose-500" />
                              <span>ลบ</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Log Note Content */}
                    <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                      {log.content}
                    </p>

                    {/* Status Change Tag */}
                    {(log.newStatus || log.progressPercent !== undefined) && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-1 border-t border-slate-100/80">
                        <div className="flex items-center gap-2">
                          {log.newStatus && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200/60">
                              สถานะ: {STATUS_LABELS[log.newStatus] || log.newStatus}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => onOpenUpdate(task)}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
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

      {/* Edit Timeline Log Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shadow-2xs">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">แก้ไขบันทึก Timeline</h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[280px]">
                    งาน: {editingItem.task.title} ({editingItem.task.module})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Author */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ผู้บันทึก</span>
                </label>
                {availableUsers && availableUsers.length > 0 ? (
                  <select
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value={editAuthor}>{editAuthor}</option>
                    {availableUsers.filter((u) => u !== editAuthor).map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-indigo-500"
                    placeholder="ชื่อผู้บันทึก..."
                  />
                )}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>วันที่บันทึก</span>
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>เวลา</span>
                  </label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Content Note */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ข้อความรายละเอียด / สิ่งที่ได้ทำ</span>
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  placeholder="ระบุข้อความอัปเดต..."
                />
              </div>

              {/* Status Change (Optional) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  สถานะงาน (ถ้าต้องการแก้ไขสถานะ)
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TaskStatus | '')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">คงเดิม (ไม่เปลี่ยนสถานะ)</option>
                  <option value="todo">รอดำเนินการ (To Do)</option>
                  <option value="in_progress">กำลังดำเนินการ (In Progress)</option>
                  <option value="review">รอตรวจสอบ (Review)</option>
                  <option value="completed">เสร็จสิ้น (Completed)</option>
                  <option value="blocked">ติดปัญหา / ล่าช้า (Blocked)</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 px-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editContent.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกการแก้ไข</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
