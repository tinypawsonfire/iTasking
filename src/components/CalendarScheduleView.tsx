import React, { useState, useMemo } from 'react';
import type { Task, ModuleCategory, TaskStatus, ActivityLog } from '../types';
import {
  THAI_MONTHS_FULL,
  formatThaiDate,
  getDeadlineAlertInfo,
  toLocalDateString,
  formatThaiTime,
} from '../utils/dateUtils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  Filter,
  ArrowUpRight,
  Layers,
  Flag,
  ListTodo,
  Edit3,
  Settings2,
  Route,
  Pin,
  Bell,
} from 'lucide-react';

export interface CalendarDayItem {
  id: string;
  type: 'update_log' | 'deadline' | 'start';
  task: Task;
  title: string;
  badgeLabel: string;
  dateStr: string;
  timeStr?: string;
  log?: ActivityLog;
}

interface CalendarScheduleViewProps {
  tasks: Task[];
  modules: ModuleCategory[];
  onOpenUpdate: (task: Task, initialTab?: 'log' | 'edit') => void;
  onOpenNewTask?: () => void;
  onOpenInfographic?: (task: Task) => void;
}

export const CalendarScheduleView: React.FC<CalendarScheduleViewProps> = ({
  tasks,
  modules,
  onOpenUpdate,
  onOpenNewTask,
  onOpenInfographic,
}) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [filterModule, setFilterModule] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Year and Month
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterModule !== 'all' && t.module.toLowerCase() !== filterModule.toLowerCase()) {
        return false;
      }
      if (filterStatus !== 'all' && t.status !== filterStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDetail = t.detail?.toLowerCase().includes(q);
        const matchAssignee = t.assignees.some((a) => a.toLowerCase().includes(q));
        const matchLog = t.logs?.some((l) => l.content.toLowerCase().includes(q));
        if (!matchTitle && !matchDetail && !matchAssignee && !matchLog) return false;
      }
      return true;
    });
  }, [tasks, filterModule, filterStatus, searchQuery]);

  // Map all schedule events (Deadlines, Start dates, Timeline updates & milestones) to dates
  const calendarItemsByDate = useMemo(() => {
    const map = new Map<string, CalendarDayItem[]>();

    const addItem = (dateStr: string, item: CalendarDayItem) => {
      if (!dateStr) return;
      const existing = map.get(dateStr) || [];
      existing.push(item);
      map.set(dateStr, existing);
    };

    filteredTasks.forEach((task) => {
      // 1. Task Deadline (กำหนดส่ง)
      if (task.deadlineDate) {
        const dStr = toLocalDateString(task.deadlineDate);
        if (dStr) {
          addItem(dStr, {
            id: `deadline-${task.id}`,
            type: 'deadline',
            task,
            title: task.title,
            badgeLabel: '🚩 กำหนดส่งงาน',
            dateStr: dStr,
          });
        }
      }

      // 2. Task Start Date (วันเริ่มงาน)
      if (task.startDate) {
        const sStr = toLocalDateString(task.startDate);
        const dStr = toLocalDateString(task.deadlineDate);
        if (sStr && sStr !== dStr) {
          addItem(sStr, {
            id: `start-${task.id}`,
            type: 'start',
            task,
            title: `${task.title} (เริ่มงาน)`,
            badgeLabel: '🚀 วันเริ่มต้นงาน',
            dateStr: sStr,
          });
        }
      }

      // 3. Timeline Updates / Milestones (บันทึกอัปเดตงาน & กำหนดการตามวันที่ลงไว้)
      if (task.logs && task.logs.length > 0) {
        task.logs.forEach((log) => {
          if (
            log.actionType !== 'created' &&
            !log.content?.includes('แก้ไขข้อมูล') &&
            !log.content?.includes('ปรับปรุงข้อมูลงาน') &&
            log.content &&
            log.content.trim().length > 0
          ) {
            const logDateStr = toLocalDateString(log.timestamp);
            if (logDateStr) {
              addItem(logDateStr, {
                id: `log-${log.id}`,
                type: 'update_log',
                task,
                title: log.content,
                badgeLabel: '📌 บันทึก / กำหนดการ',
                dateStr: logDateStr,
                timeStr: formatThaiTime(log.timestamp),
                log,
              });
            }
          }
        });
      }
    });

    return map;
  }, [filteredTasks]);

  // Selected date items
  const selectedDateItems = useMemo(() => {
    return calendarItemsByDate.get(selectedDateStr) || [];
  }, [calendarItemsByDate, selectedDateStr]);

  // Items for the current viewed month (for highlights ribbon)
  const currentMonthItems = useMemo(() => {
    const list: CalendarDayItem[] = [];
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    calendarItemsByDate.forEach((items, dateStr) => {
      if (dateStr.startsWith(prefix)) {
        list.push(...items);
      }
    });
    list.sort((a, b) => {
      const cmp = a.dateStr.localeCompare(b.dateStr);
      if (cmp !== 0) return cmp;
      return (a.timeStr || '').localeCompare(b.timeStr || '');
    });
    return list;
  }, [calendarItemsByDate, currentYear, currentMonth]);

  const autoSelectDayForMonth = (y: number, m: number) => {
    const now = new Date();
    if (now.getFullYear() === y && now.getMonth() === m) {
      setSelectedDateStr(toLocalDateString(now));
      return;
    }
    const prefix = `${y}-${String(m + 1).padStart(2, '0')}`;
    const datesWithEvents: string[] = [];
    calendarItemsByDate.forEach((items, dStr) => {
      if (dStr.startsWith(prefix) && items.length > 0) {
        datesWithEvents.push(dStr);
      }
    });
    if (datesWithEvents.length > 0) {
      datesWithEvents.sort();
      setSelectedDateStr(datesWithEvents[0]);
    } else {
      setSelectedDateStr(`${prefix}-01`);
    }
  };

  const handlePrevMonth = () => {
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    setCurrentDate(prevMonthDate);
    autoSelectDayForMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth());
  };

  const handleNextMonth = () => {
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
    setCurrentDate(nextMonthDate);
    autoSelectDayForMonth(nextMonthDate.getFullYear(), nextMonthDate.getMonth());
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateStr(toLocalDateString(now));
  };

  // Generate calendar days for currentMonth
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon...
    const lastDateOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = toLocalDateString(today);

    // Days from prev month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDate - i;
      const prevM = currentMonth === 0 ? 12 : currentMonth;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr: dStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
      });
    }

    // Days of current month
    for (let i = 1; i <= lastDateOfMonth; i++) {
      const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
      });
    }

    // Days from next month to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextM = currentMonth + 2 > 12 ? 1 : currentMonth + 2;
      const nextY = currentMonth + 2 > 12 ? currentYear + 1 : currentYear;
      const dStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
      });
    }

    return days;
  }, [currentYear, currentMonth, today]);

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return { bg: 'bg-[#00c875]', text: 'text-white', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'in_progress':
        return { bg: 'bg-[#0073ea]', text: 'text-white', light: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'review':
        return { bg: 'bg-[#a25ddc]', text: 'text-white', light: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'blocked':
        return { bg: 'bg-[#df2f4a]', text: 'text-white', light: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { bg: 'bg-[#c4c4c4]', text: 'text-slate-800', light: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return 'เสร็จสิ้น (Done)';
      case 'in_progress': return 'กำลังทำ (Working)';
      case 'review': return 'รอตรวจ/สัญญา';
      case 'blocked': return 'ติดขัด/มีปัญหา';
      default: return 'รอดำเนินการ';
    }
  };

  const weekDayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์'];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0073ea] flex items-center justify-center font-bold">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              ตารางปฏิทินงาน & แผนงาน (Calendar Schedule)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            ดูตารางงานในแต่ละวัน เช็คกำหนดส่ง และตรวจสอบรายละเอียดงานพร้อมอัปเดตสถานะได้ทันที
          </p>
        </div>

        {/* Month Navigation & Today Button */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80 self-stretch sm:self-auto justify-between">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-white text-slate-700 rounded-xl transition-all shadow-2xs hover:text-[#0073ea]"
            title="เดือนก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-extrabold text-sm text-slate-800 px-3 min-w-[140px] text-center">
            {THAI_MONTHS_FULL[currentMonth]} {currentYear + 543}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-white text-slate-700 rounded-xl transition-all shadow-2xs hover:text-[#0073ea]"
            title="เดือนถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleGoToday}
            className="ml-2 px-3 py-1.5 bg-white text-[#0073ea] font-bold text-xs rounded-xl border border-slate-200 shadow-2xs hover:bg-[#0073ea] hover:text-white transition-all"
          >
            วันนี้
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นชื่องาน, รายละเอียด, ผู้รับผิดชอบ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0073ea] focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Module Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">หมวดงาน:</span>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#0073ea] cursor-pointer"
            >
              <option value="all">ทั้งหมด ({tasks.length})</option>
              {modules.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">สถานะ:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#0073ea] cursor-pointer"
            >
              <option value="all">ทั้งหมด</option>
              <option value="in_progress">กำลังทำ</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="blocked">มีปัญหา</option>
              <option value="review">รอตรวจ/สัญญา</option>
              <option value="todo">รอดำเนินการ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Current Month Schedule & Highlights Ribbon */}
      {currentMonthItems.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/90 border border-blue-200/80 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#0073ea] text-white flex items-center justify-center shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-xs text-slate-800">
                กำหนดการ & บันทึกสำคัญประจำเดือน {THAI_MONTHS_FULL[currentMonth]} {currentYear + 543}
              </span>
              <span className="px-2 py-0.2 rounded-full bg-blue-100 text-[#0073ea] text-[10px] font-black">
                {currentMonthItems.length} รายการ
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              คลิกเพื่อเลือกดูรายละเอียดของวันนั้น
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {currentMonthItems.map((item) => {
              const isSelected = selectedDateStr === item.dateStr;
              const isUpdateLog = item.type === 'update_log';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedDateStr(item.dateStr)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0073ea] text-white border-[#0073ea] shadow-xs'
                      : isUpdateLog
                      ? 'bg-amber-50/90 text-amber-900 border-amber-300 hover:bg-amber-100'
                      : 'bg-white text-slate-700 hover:text-[#0073ea] border-slate-200 hover:border-[#0073ea]'
                  }`}
                  title={`${item.title} (${formatThaiDate(item.dateStr)})`}
                >
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : isUpdateLog
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-blue-100 text-[#0073ea]'
                    }`}
                  >
                    {formatThaiDate(item.dateStr).slice(0, -5)}
                  </span>
                  <span className="truncate max-w-[220px]">
                    {isUpdateLog ? `📌 ${item.title}` : item.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid: Calendar on Left (7 cols) + Selected Day Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid (8 cols on large screens) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
            {weekDayNames.map((name, i) => (
              <div
                key={name}
                className={`py-2 text-xs font-black tracking-wider ${
                  i === 0 ? 'text-rose-500' : i === 6 ? 'text-indigo-500' : 'text-slate-600'
                }`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day) => {
              const dayItems = calendarItemsByDate.get(day.dateStr) || [];
              const isSelected = selectedDateStr === day.dateStr;
              const hasUpdateLog = dayItems.some((item) => item.type === 'update_log');

              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={`min-h-[105px] sm:min-h-[120px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                    isSelected
                      ? 'bg-blue-50/50 border-[#0073ea] ring-2 ring-[#0073ea]/20 shadow-sm'
                      : day.isCurrentMonth
                      ? 'bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/60'
                      : 'bg-slate-50/40 border-slate-100 opacity-45 hover:opacity-75'
                  }`}
                >
                  {/* Top Day Number & Badge */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        day.isToday
                          ? 'bg-[#0073ea] text-white shadow-xs'
                          : isSelected
                          ? 'bg-blue-200 text-[#0073ea]'
                          : day.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {dayItems.length > 0 && (
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border ${
                          hasUpdateLog
                            ? 'bg-amber-100 text-amber-900 border-amber-300 font-black shadow-2xs'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {dayItems.length}
                      </span>
                    )}
                  </div>

                  {/* Task & Event Pills inside cell */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {dayItems.slice(0, 3).map((item) => {
                      if (item.type === 'update_log') {
                        return (
                          <div
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDateStr(day.dateStr);
                              onOpenUpdate(item.task, 'log');
                            }}
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg truncate flex items-center gap-1 transition-all shadow-2xs hover:scale-[1.02] bg-gradient-to-r from-amber-500 to-orange-500 text-white cursor-pointer"
                            title={`📌 ${item.title} (${item.task.title})`}
                          >
                            <Pin className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{item.title}</span>
                          </div>
                        );
                      }

                      if (item.type === 'start') {
                        return (
                          <div
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDateStr(day.dateStr);
                              onOpenUpdate(item.task);
                            }}
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg truncate flex items-center gap-1 transition-all shadow-2xs hover:scale-[1.02] bg-sky-600 text-white cursor-pointer"
                            title={`🚀 เริ่มงาน: ${item.task.title}`}
                          >
                            <span className="truncate">🚀 {item.task.title}</span>
                          </div>
                        );
                      }

                      const colors = getStatusColor(item.task.status);
                      return (
                        <div
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateStr(day.dateStr);
                            onOpenUpdate(item.task);
                          }}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg truncate flex items-center gap-1 transition-all shadow-2xs hover:scale-[1.02] ${colors.bg} ${colors.text} cursor-pointer`}
                          title={`🚩 กำหนดส่ง: ${item.task.title} (${item.task.module})`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                          <span className="truncate">{item.task.title}</span>
                        </div>
                      );
                    })}

                    {dayItems.length > 3 && (
                      <div className="text-[10px] font-bold text-slate-500 pl-1">
                        +{dayItems.length - 3} รายการ...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Task Details Inspector (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5 sticky top-24">
          {/* Header of Inspector */}
          <div className="pb-4 border-b border-slate-100">
            <div className="text-[11px] font-bold text-[#0073ea] uppercase tracking-wider mb-1 flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" /> รายละเอียดงาน & กำหนดการประจำวัน
            </div>
            <h3 className="text-lg font-black text-slate-900 leading-snug">
              {formatThaiDate(selectedDateStr)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedDateItems.length > 0
                ? `มีกำหนดการทั้งหมด ${selectedDateItems.length} รายการในวันนี้`
                : 'ไม่มีงานหรือกำหนดการที่บันทึกไว้ในวันนี้'}
            </p>
          </div>

          {/* List of Items for Selected Date */}
          <div className="space-y-3.5 max-h-[560px] overflow-y-auto pr-1">
            {selectedDateItems.map((item) => {
              const task = item.task;
              const statusStyle = getStatusColor(task.status);
              const isUpdateLog = item.type === 'update_log';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all group ${
                    isUpdateLog
                      ? 'border-amber-300 bg-amber-50/60 hover:bg-amber-50/90 hover:shadow-md'
                      : 'border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-[#0073ea]/50 hover:shadow-md'
                  }`}
                >
                  {/* Badge & Type */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => onOpenUpdate(task, 'edit')}
                      className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100/70 text-[#0073ea] hover:bg-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="คลิกเพื่อแก้ไขหมวดหมู่ / ข้อมูลงาน"
                    >
                      <span>{task.module}</span>
                      <Edit3 className="w-2.5 h-2.5" />
                    </button>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isUpdateLog
                          ? 'bg-amber-200 text-amber-900 border border-amber-300'
                          : statusStyle.light
                      }`}
                    >
                      {item.badgeLabel}
                    </span>
                  </div>

                  {/* If update log, highlight the logged activity */}
                  {isUpdateLog ? (
                    <div className="mb-3">
                      <div className="text-sm font-extrabold text-slate-900 leading-snug mb-1">
                        📌 {item.title}
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        ชื่องานหลัก: <span className="font-bold text-slate-800">{task.title}</span>
                      </div>
                      {item.timeStr && (
                        <div className="text-[11px] text-amber-800 font-semibold mt-1">
                          ⏰ เวลาบันทึก: {item.timeStr} น.
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Main Task Title for deadline or start */
                    <h4
                      onClick={() => onOpenUpdate(task, 'edit')}
                      className="text-sm font-bold text-slate-900 hover:text-[#0073ea] transition-colors line-clamp-2 mb-1.5 cursor-pointer"
                      title="คลิกเพื่อแก้ไขข้อมูลงาน"
                    >
                      {task.title}
                    </h4>
                  )}

                  {/* Task Detail Description (if any) */}
                  {!isUpdateLog && task.detail && (
                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 mb-3 leading-relaxed">
                      {task.detail}
                    </p>
                  )}

                  {/* Metadata Row: Assignees & Deadline */}
                  <div className="space-y-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                    <div className="flex items-center justify-between">
                      {/* Assignees */}
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">
                          {task.assignees.join(', ') || 'ไม่ระบุ'}
                        </span>
                      </div>

                      {/* Log Author */}
                      {isUpdateLog && item.log?.author && (
                        <span className="text-[10px] text-slate-500">
                          โดย: <strong className="text-slate-700">{item.log.author}</strong>
                        </span>
                      )}

                      {/* Deadline info */}
                      {!isUpdateLog && task.deadlineDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-600">
                            {formatThaiDate(task.deadlineDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons: Infographic, Log & Edit */}
                  <div className="grid grid-cols-3 gap-1.5 mt-3">
                    <button
                      type="button"
                      onClick={() => (onOpenInfographic ? onOpenInfographic(task) : onOpenUpdate(task))}
                      className="py-2 px-1 bg-blue-50 hover:bg-[#0073ea] text-[#0073ea] hover:text-white border border-blue-200/90 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer group"
                      title="ดูไทม์ไลน์ Infographic ขั้นตอน & ความคืบหน้า"
                    >
                      <Route className="w-3 h-3 text-[#0073ea] group-hover:text-white" />
                      <span>ไทม์ไลน์</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenUpdate(task, 'log')}
                      className="py-2 px-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer group"
                      title="อัปเดตงาน (Update)"
                    >
                      <Edit3 className="w-3 h-3 text-white" />
                      <span>Update</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenUpdate(task, 'edit')}
                      className="py-2 px-1 bg-slate-100 hover:bg-slate-800 text-slate-700 hover:text-white border border-slate-200 hover:border-slate-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                      title="แก้ไขข้อมูลงานและหมวดหมู่"
                    >
                      <Settings2 className="w-3 h-3" />
                      <span>แก้ไข</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {selectedDateItems.length === 0 && (
              <div className="text-center py-10 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                <ListTodo className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-600 mb-1">ไม่มีงานในวันนี้</div>
                <p className="text-[11px] text-slate-400 mb-3">
                  คุณสามารถเพิ่มงานใหม่ หรือเลือกดูวันอื่นๆ จากตารางปฏิทิน
                </p>
                {onOpenNewTask && (
                  <button
                    onClick={onOpenNewTask}
                    className="px-3.5 py-1.5 bg-[#0073ea] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0060c0] transition-all inline-flex items-center gap-1"
                  >
                    + เพิ่มงานใหม่
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
