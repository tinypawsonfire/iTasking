import React, { useState, useMemo } from 'react';
import type { Task, TaskStatus, ActivityLog, ModuleCategory, Priority } from '../types';
import { formatThaiDate, formatDateTimeThai, getDeadlineAlertInfo } from '../utils/dateUtils';
import {
  X,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Printer,
  Copy,
  Check,
  TrendingUp,
  Paperclip,
  ExternalLink,
  MessageSquare,
  Flame,
  Layers,
  Flag,
  ListTodo,
  Edit3,
  ArrowRight,
  ChevronRight,
  Plus,
  Send,
  Milestone,
  Route,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MONDAY_STATUSES, MONDAY_PRIORITIES } from './MondayTableView';

interface TaskInfographicTimelineModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenUpdateModal?: (task: Task, initialTab?: 'log' | 'edit') => void;
  onSaveUpdate?: (updatedTask: Task) => void;
  modules?: ModuleCategory[];
  availableUsers?: string[];
}

export const TaskInfographicTimelineModal: React.FC<TaskInfographicTimelineModalProps> = ({
  task,
  isOpen,
  onClose,
  onOpenUpdateModal,
  onSaveUpdate,
  modules = [],
  availableUsers = ['มอส', 'เอก', 'แป้ง', 'นพ', 'เจมส์', 'ไอซ์'],
}) => {
  if (!isOpen || !task) return null;

  // Sorting state for activity journey: 'asc' = Chronological (oldest to newest), 'desc' = newest first
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Quick inline update inside Infographic
  const [quickLogText, setQuickLogText] = useState('');
  const [quickAuthor, setQuickAuthor] = useState(task.assignees[0] || 'ผู้รับผิดชอบ');
  const [quickProgress, setQuickProgress] = useState(task.progress);
  const [quickStatus, setQuickStatus] = useState<TaskStatus>(task.status);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Category details
  const categoryConfig = modules.find(
    (m) => m.name.toLowerCase() === task.module.toLowerCase()
  );
  const categoryColor = categoryConfig?.color || '#0073ea';

  // Status & Priority configs
  const statusConfig =
    MONDAY_STATUSES.find((s) => s.id === task.status) || MONDAY_STATUSES[1];
  const priorityConfig =
    MONDAY_PRIORITIES.find((p) => p.id === task.priority) || MONDAY_PRIORITIES[2];
  const alertInfo = getDeadlineAlertInfo(task.deadlineDate, task.status);

  // Subtask statistics
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((st) => st.completed).length || 0;
  const subtasksPercent =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Chronological event journey
  const activityTrail = useMemo(() => {
    const list: ActivityLog[] = task.logs ? [...task.logs] : [];
    list.sort((a, b) => {
      const tA = new Date(a.timestamp).getTime() || 0;
      const tB = new Date(b.timestamp).getTime() || 0;
      return sortOrder === 'asc' ? tA - tB : tB - tA;
    });
    return list;
  }, [task.logs, sortOrder]);

  // Handle toggling subtasks
  const handleToggleSubtask = (subtaskId: string) => {
    if (!onSaveUpdate) return;
    const updatedSubtasks = (task.subtasks || []).map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const doneCount = updatedSubtasks.filter((st) => st.completed).length;
    const newProgress = Math.round((doneCount / updatedSubtasks.length) * 100);

    const toggledItem = updatedSubtasks.find((st) => st.id === subtaskId);
    const logItem: ActivityLog = {
      id: `log-${Date.now()}`,
      taskId: task.id,
      author: quickAuthor || task.assignees[0] || 'ผู้ใช้',
      timestamp: new Date().toISOString(),
      actionType: 'progress_update',
      content: `${toggledItem?.completed ? '✅ ทำเสร็จแล้ว' : '🔄 ยกเลิกเสร็จ'}: ขั้นตอน "${toggledItem?.title}"`,
      progressPercent: newProgress,
    };

    const updatedTask: Task = {
      ...task,
      subtasks: updatedSubtasks,
      progress: newProgress,
      status: newProgress === 100 ? 'completed' : task.status,
      logs: [logItem, ...(task.logs || [])],
      updatedAt: new Date().toISOString(),
    };

    onSaveUpdate(updatedTask);
    if (newProgress === 100) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  // Handle adding a new subtask
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim() || !onSaveUpdate) return;
    const newSt = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    const updatedSubtasks = [...(task.subtasks || []), newSt];

    const updatedTask: Task = {
      ...task,
      subtasks: updatedSubtasks,
      updatedAt: new Date().toISOString(),
    };

    onSaveUpdate(updatedTask);
    setNewSubtaskTitle('');
  };

  // Handle posting quick update log
  const handlePostQuickLog = () => {
    if (!quickLogText.trim() && quickStatus === task.status && quickProgress === task.progress) {
      return;
    }
    if (!onSaveUpdate) return;

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      taskId: task.id,
      author: quickAuthor || task.assignees[0] || 'ผู้รับผิดชอบ',
      timestamp: new Date().toISOString(),
      actionType: quickStatus !== task.status ? 'status_change' : 'note',
      content:
        quickLogText.trim() ||
        (quickStatus !== task.status
          ? `เปลี่ยนสถานะเป็น ${statusConfig.label}`
          : `อัปเดตความคืบหน้าของงาน`),
      previousStatus: task.status,
      newStatus: quickStatus,
      progressPercent: quickProgress,
    };

    const updatedTask: Task = {
      ...task,
      status: quickStatus,
      progress: quickProgress,
      logs: [newLog, ...(task.logs || [])],
      updatedAt: new Date().toISOString(),
    };

    onSaveUpdate(updatedTask);
    setQuickLogText('');

    if (quickStatus === 'completed' || quickProgress === 100) {
      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    }
  };

  // Copy executive summary for LINE / Chat
  const handleCopySummary = () => {
    const lines = [
      `📊 [สรุปความคืบหน้า Infographic: ${task.title}]`,
      `🏷️ หมวดหมู่: ${task.module} | สถานะ: ${statusConfig.label}`,
      `👤 ผู้รับผิดชอบ: ${task.assignees.join(', ')}`,
      `📅 ไทม์ไลน์: ${formatThaiDate(task.startDate)} ➔ ${task.deadlineText || formatThaiDate(task.deadlineDate)}`,
      alertInfo.badgeText ? `⏰ กำหนดส่ง: ${alertInfo.badgeText}` : '',
      totalSubtasks > 0 ? `📋 ขั้นตอนย่อย: สำเร็จแล้ว ${completedSubtasks}/${totalSubtasks} ขั้นตอน` : '',
      activityTrail.length > 0 ? `\n📝 อัปเดตล่าสุด: "${activityTrail[0].content}" (${formatThaiDate(activityTrail[0].timestamp)})` : '',
      `\n🔗 ดูบนระบบ: https://itasking.vercel.app`,
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  interface RoadmapMilestone {
    id: string;
    dateDisplay: string;
    rawDate: string;
    title: string;
    summary: string;
    author?: string;
    type: 'start' | 'log' | 'current' | 'deadline';
    status: 'done' | 'active' | 'pending';
    icon: 'start' | 'update' | 'status' | 'deadline';
  }

  // Chronological Left-to-Right Real-World Roadmap Milestones
  const roadmapMilestones = useMemo<RoadmapMilestone[]>(() => {
    const milestones: RoadmapMilestone[] = [];

    // 1. Start Milestone (จุดเริ่มต้นซ้ายสุด)
    const startRaw = task.startDate || task.createdAt;
    milestones.push({
      id: 'step-start',
      dateDisplay: formatThaiDate(startRaw),
      rawDate: startRaw,
      title: 'เริ่มต้นภารกิจ',
      summary: task.detail
        ? (task.detail.length > 55 ? task.detail.slice(0, 55) + '...' : task.detail)
        : `สร้างงานในหมวด ${task.module} และเริ่มวางแผนงาน`,
      author: task.assignees[0] || 'ผู้มอบหมาย',
      type: 'start',
      status: 'done',
      icon: 'start',
    });

    // 2. Intermediate Milestones from task.logs (Sorted chronologically oldest -> newest)
    const validLogs = (task.logs || [])
      .filter((l) => l.actionType !== 'created')
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let selectedLogs = validLogs;
    if (validLogs.length > 4) {
      const statusChanges = validLogs.filter((l) => l.actionType === 'status_change');
      const otherLogs = validLogs.filter((l) => l.actionType !== 'status_change');
      const merged = [
        validLogs[0],
        ...statusChanges.slice(-2),
        ...otherLogs.slice(-2),
        validLogs[validLogs.length - 1],
      ];
      const seen = new Set<string>();
      selectedLogs = merged.filter((l) => {
        if (seen.has(l.id)) return false;
        seen.add(l.id);
        return true;
      }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    selectedLogs.forEach((l, idx) => {
      const isLatest = idx === selectedLogs.length - 1 && task.status !== 'completed';
      const isStatusChange = l.actionType === 'status_change';

      let cleanSummary = l.content || 'อัปเดตความคืบหน้าของงาน';
      if (cleanSummary.length > 60) {
        cleanSummary = cleanSummary.slice(0, 60) + '...';
      }

      milestones.push({
        id: l.id,
        dateDisplay: formatThaiDate(l.timestamp),
        rawDate: l.timestamp,
        title: isStatusChange ? 'ปรับเปลี่ยนสถานะ' : 'บันทึกความคืบหน้า',
        summary: cleanSummary,
        author: l.author,
        type: 'log',
        status: isLatest ? 'active' : 'done',
        icon: isStatusChange ? 'status' : 'update',
      });
    });

    // If there were NO intermediate logs and task is in progress, add a "Current stage" milestone
    if (validLogs.length === 0 && task.status !== 'completed' && task.status !== 'todo') {
      milestones.push({
        id: 'step-current',
        dateDisplay: 'ปัจจุบัน',
        rawDate: new Date().toISOString(),
        title: statusConfig.label,
        summary: 'อยู่ระหว่างดำเนินการตามแผนงาน',
        author: task.assignees[0],
        type: 'current',
        status: 'active',
        icon: 'update',
      });
    }

    // 3. Deadline Milestone (จุดสิ้นสุดขวาสุด)
    const isCompleted = task.status === 'completed';
    milestones.push({
      id: 'step-deadline',
      dateDisplay: task.deadlineText || formatThaiDate(task.deadlineDate),
      rawDate: task.deadlineDate,
      title: isCompleted ? 'เป้าหมายสำเร็จ' : 'กำหนดส่งมอบ (Deadline)',
      summary: isCompleted ? 'ส่งมอบงานครบถ้วนสมบูรณ์' : alertInfo.badgeText,
      author: task.assignees.join(', '),
      type: 'deadline',
      status: isCompleted ? 'done' : 'pending',
      icon: 'deadline',
    });

    return milestones;
  }, [task, statusConfig, alertInfo]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/60 backdrop-blur-md animate-fadeIn overflow-y-auto font-sans">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Sticky Top Bar */}
        <div className="p-4 px-6 border-b border-slate-100 bg-white/95 backdrop-blur-md flex items-center justify-between gap-3 sticky top-0 z-20">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className="px-3 py-1 rounded-xl text-xs font-black tracking-wide uppercase text-white shadow-xs flex items-center gap-1.5"
              style={{ backgroundColor: categoryColor }}
            >
              <Layers className="w-3.5 h-3.5" />
              {task.module}
            </span>

            {task.code && (
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {task.code}
              </span>
            )}

            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${priorityConfig.bg} ${priorityConfig.text}`}>
              {priorityConfig.label}
            </span>

            <span className={`px-3 py-1 rounded-xl text-xs font-black shadow-xs ${statusConfig.bg} ${statusConfig.text} flex items-center gap-1.5`}>
              {task.status === 'completed' && <Check className="w-3.5 h-3.5" />}
              {task.status === 'in_progress' && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              )}
              {statusConfig.label}
            </span>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer shadow-2xs"
              title="คัดลอกสรุปสำหรับส่งใน LINE หรือแชท"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">คัดลอกสรุป</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              title="พิมพ์เอกสาร Infographic"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">พิมพ์</span>
            </button>

            {onOpenUpdateModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUpdateModal(task, 'edit');
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="แก้ไขข้อมูลงานและผู้รับผิดชอบ"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">แก้ไขข้อมูล</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Infographic Canvas */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-7 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30">
          
          {/* Header Title Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>TIMELINE & STEP-BY-STEP INFOGRAPHIC JOURNEY</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight">
              {task.title}
            </h1>
            {task.detail && (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                {task.detail}
              </p>
            )}
          </div>

          {/* 4 Infographic Key Metric Widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Widget 1: Current Stage & Status */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                <span>ขั้นตอนปัจจุบัน</span>
                <Milestone className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="my-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-xl font-extrabold text-xs shadow-2xs flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.text}`}>
                    {task.status === 'completed' && <Check className="w-3.5 h-3.5" />}
                    {task.status === 'in_progress' && (
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    )}
                    <span>{statusConfig.label}</span>
                  </span>
                </div>
                <div className="text-xs font-black text-slate-800 truncate">
                  {roadmapMilestones.find((s) => s.status === 'active')?.title || (task.status === 'completed' ? 'เป้าหมายสำเร็จ' : 'ดำเนินการหลัก')}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {task.status === 'completed' ? 'ส่งมอบงานครบถ้วน' : 'อยู่ระหว่างดำเนินการตามแผน'}
                </div>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                  style={{
                    width:
                      task.status === 'completed'
                        ? '100%'
                        : task.status === 'review'
                        ? '75%'
                        : task.status === 'in_progress'
                        ? '50%'
                        : '25%',
                  }}
                />
              </div>
            </div>

            {/* Widget 2: Timeline Target */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                <span>กรอบเวลาเป้าหมาย</span>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-800 truncate">
                  {task.deadlineText || formatThaiDate(task.deadlineDate)}
                </div>
                <div className="text-[11px] text-slate-400">
                  เริ่ม: {formatThaiDate(task.startDate)}
                </div>
              </div>
              <div className="mt-2">
                <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${alertInfo.badgeClass}`}>
                  {alertInfo.badgeText}
                </span>
              </div>
            </div>

            {/* Widget 3: Subtasks Status */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                <span>ขั้นตอนย่อย (Subtasks)</span>
                <ListTodo className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <div className="text-base font-black text-slate-900">
                  {completedSubtasks} / {totalSubtasks} <span className="text-xs font-semibold text-slate-400">เสร็จ</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {totalSubtasks > 0 ? `สำเร็จ ${completedSubtasks} จาก ${totalSubtasks} รายการ` : 'ยังไม่มีงานย่อย'}
                </div>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{
                    width: totalSubtasks > 0 ? `${(completedSubtasks / totalSubtasks) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>

            {/* Widget 4: Owners / Team */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                <span>ทีมผู้รับผิดชอบ</span>
                <User className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {task.assignees.map((name, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/70"
                  >
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-black">
                      {name.slice(0, 1)}
                    </span>
                    <span className="truncate max-w-[80px]">{name}</span>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                อัปเดตล่าสุด: {task.updatedAt ? formatThaiDate(task.updatedAt) : '-'}
              </div>
            </div>
          </div>

          {/* Infographic Work Progression Roadmap (Left-to-Right Timeline) */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0073ea] flex items-center justify-center font-bold shadow-2xs shrink-0">
                  <Route className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 flex-wrap">
                    <span>แผนภูมิขั้นตอนการดำเนินงาน</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">
                      (WORK PROGRESSION ROADMAP)
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    ไทม์ไลน์ลำดับขั้นตอนจากซ้ายไปขวา: วันที่ดำเนินการ ➔ สิ่งที่ทำสรุป ➔ กำหนดส่ง Deadline
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0073ea] border border-blue-200">
                {roadmapMilestones.length} เหตุการณ์ตามลำดับเวลา
              </span>
            </div>

            {/* Horizontal Left-to-Right Stepper Track */}
            <div className="relative pt-2 pb-1">
              <div className="overflow-x-auto pb-4 pt-1 custom-scrollbar">
                <div className="flex items-start gap-4 min-w-[760px] px-1">
                  {roadmapMilestones.map((m, idx) => {
                    const isDone = m.status === 'done';
                    const isActive = m.status === 'active';
                    const isFirst = idx === 0;
                    const isLast = idx === roadmapMilestones.length - 1;

                    return (
                      <div
                        key={m.id}
                        className="flex-1 min-w-[220px] sm:min-w-[240px] flex flex-col items-center group"
                      >
                        {/* 1. Dedicated Top Rail Track (Nodes & Connectors) */}
                        <div className="w-full relative flex items-center justify-center h-14">
                          {/* Connector Line Left (from previous node) */}
                          {!isFirst && (
                            <div className="absolute left-0 right-1/2 top-1/2 -translate-y-1/2 h-1 z-0">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isDone || isActive
                                    ? 'bg-gradient-to-r from-emerald-500 to-[#0073ea]'
                                    : 'bg-slate-200 border-t border-dashed border-slate-300'
                                }`}
                              />
                            </div>
                          )}

                          {/* Connector Line Right (to next node) */}
                          {!isLast && (
                            <div className="absolute left-1/2 right-0 top-1/2 -translate-y-1/2 h-1 z-0">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isDone
                                    ? 'bg-gradient-to-r from-[#0073ea] to-emerald-500'
                                    : isActive
                                    ? 'bg-gradient-to-r from-[#0073ea] to-slate-200'
                                    : 'bg-slate-200 border-t border-dashed border-slate-300'
                                }`}
                              />
                            </div>
                          )}

                          {/* Central Node Pin Badge */}
                          <div
                            className={`relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-300 shadow-sm ${
                              isActive
                                ? 'bg-gradient-to-tr from-[#0073ea] via-indigo-600 to-blue-600 text-white ring-4 ring-blue-100 shadow-lg shadow-blue-500/30 scale-105'
                                : isDone
                                ? 'bg-emerald-500 text-white ring-4 ring-emerald-50 shadow-md shadow-emerald-500/20'
                                : 'bg-white text-slate-400 border-2 border-slate-200 shadow-2xs'
                            }`}
                          >
                            {m.icon === 'start' && <Sparkles className="w-4 h-4" />}
                            {m.icon === 'status' && <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                            {m.icon === 'update' && (isDone ? <Check className="w-4 h-4 stroke-[2.5]" /> : <MessageSquare className="w-4 h-4" />)}
                            {m.icon === 'deadline' && (isDone ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Flag className="w-4 h-4 text-amber-500" />)}
                          </div>

                          {/* Step Number Tag on Node */}
                          <span
                            className={`absolute -bottom-1.5 z-20 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black border ${
                              isActive
                                ? 'bg-blue-600 text-white border-blue-400 shadow-xs'
                                : isDone
                                ? 'bg-emerald-600 text-white border-emerald-400'
                                : 'bg-slate-100 text-slate-500 border-slate-300'
                            }`}
                          >
                            0{idx + 1}
                          </span>
                        </div>

                        {/* Vertical Connector Stem from Node to Card */}
                        <div className="w-0.5 h-3 bg-slate-200" />

                        {/* 2. Milestone Card (Placed safely BELOW the rail track) */}
                        <div
                          className={`w-full rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                            isActive
                              ? 'bg-gradient-to-b from-blue-50/60 to-white border-2 border-blue-400/90 shadow-lg shadow-blue-500/10 ring-2 ring-blue-100'
                              : isDone
                              ? 'bg-white/95 border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300'
                              : 'bg-slate-50/50 border-slate-200/80'
                          }`}
                        >
                          {/* Card Top Header: Step Label & Date Pill */}
                          <div className="p-3.5 pb-2">
                            <div className="flex items-center justify-between gap-1.5 mb-2">
                              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                                {m.type === 'start'
                                  ? '🚀 จุดเริ่มต้น'
                                  : m.type === 'deadline'
                                  ? '🎯 กำหนดส่งมอบ'
                                  : `📍 ขั้นตอนที่ ${idx + 1}`}
                              </span>

                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                                  isActive
                                    ? 'bg-blue-100/90 text-blue-700 border-blue-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200/70'
                                }`}
                              >
                                <Calendar className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span>{m.dateDisplay}</span>
                              </span>
                            </div>

                            {/* Milestone Title */}
                            <h4
                              className={`text-xs font-black tracking-tight leading-snug mb-1.5 ${
                                isActive ? 'text-blue-900' : 'text-slate-900'
                              }`}
                            >
                              {m.title}
                            </h4>

                            {/* Summary Callout Note */}
                            <div
                              className={`text-[11px] leading-relaxed p-2.5 rounded-xl border-l-3 ${
                                isActive
                                  ? 'bg-white border-blue-500 text-slate-700 shadow-2xs font-medium'
                                  : isDone
                                  ? 'bg-slate-50 border-emerald-500 text-slate-600 font-medium'
                                  : 'bg-white/70 border-slate-300 text-slate-500'
                              }`}
                            >
                              {m.summary}
                            </div>
                          </div>

                          {/* Card Footer: Author & Status Pill */}
                          <div className="px-3.5 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px] font-bold">
                            <div className="flex items-center gap-1.5 text-slate-500 truncate max-w-[120px]">
                              <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[9px] flex items-center justify-center font-black shrink-0">
                                {m.author?.slice(0, 1) || 'U'}
                              </div>
                              <span className="truncate">{m.author || 'ทีมงาน'}</span>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-md border text-[10px] shrink-0 ${
                                isActive
                                  ? 'bg-blue-600 text-white border-blue-600 font-black shadow-2xs flex items-center gap-1'
                                  : isDone
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 font-medium'
                              }`}
                            >
                              {isActive ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                  <span>ขั้นตอนล่าสุด</span>
                                </>
                              ) : isDone ? (
                                '✓ สำเร็จแล้ว'
                              ) : (
                                'รอส่งมอบ'
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Subtasks Checklist Section */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  ขั้นตอนย่อยที่ระบุไว้ ({completedSubtasks}/{totalSubtasks})
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-400">
                คลิกเพื่อเช็คความสำเร็จ
              </span>
            </div>

            {/* List of subtasks */}
            <div className="space-y-2">
              {task.subtasks && task.subtasks.length > 0 ? (
                task.subtasks.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => handleToggleSubtask(st.id)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      st.completed
                        ? 'bg-emerald-50/50 border-emerald-200/70 text-slate-500'
                        : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                          st.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        {st.completed && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          st.completed ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {st.title}
                      </span>
                    </div>

                    {st.assignee && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                        {st.assignee}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  ยังไม่ได้กำหนดขั้นตอนย่อย — เพิ่มขั้นตอนย่อยได้ด้านล่าง
                </div>
              )}

              {/* Add subtask input */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSubtask();
                  }}
                  placeholder="+ เพิ่มขั้นตอนย่อยใหม่ (พิมพ์แล้วกด Enter หรือปุ่มเพิ่ม)..."
                  className="flex-1 py-2 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  เพิ่มขั้นตอน
                </button>
              </div>
            </div>
          </div>

          {/* Chronological Step-by-step Activity Journey */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Milestone className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  ประวัติขั้นตอน & บันทึกความคืบหน้า ({activityTrail.length} อัปเดต)
                </h3>
              </div>

              {/* Sort Order Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setSortOrder('asc')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    sortOrder === 'asc'
                      ? 'bg-white text-indigo-600 shadow-2xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  เริ่มต้น ➔ ล่าสุด (ไทม์ไลน์)
                </button>
                <button
                  type="button"
                  onClick={() => setSortOrder('desc')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    sortOrder === 'desc'
                      ? 'bg-white text-indigo-600 shadow-2xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  ล่าสุดก่อน
                </button>
              </div>
            </div>

            {/* Vertical Infographic Trail */}
            <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-100 space-y-6 pt-2 pb-2">
              {activityTrail.map((item, idx) => {
                const isCreation = item.actionType === 'created';
                const isStatusChange = item.actionType === 'status_change';
                const isProgress = item.actionType === 'progress_update';

                return (
                  <div key={item.id} className="relative group">
                    {/* Node Dot Icon */}
                    <div
                      className={`absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center text-white shadow-xs ${
                        isCreation
                          ? 'bg-emerald-500'
                          : isStatusChange
                          ? 'bg-[#0073ea]'
                          : isProgress
                          ? 'bg-purple-600'
                          : 'bg-amber-500'
                      }`}
                    >
                      {isCreation ? (
                        <Sparkles className="w-3.5 h-3.5" />
                      ) : isStatusChange ? (
                        <ArrowRight className="w-3.5 h-3.5" />
                      ) : isProgress ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Content Card */}
                    <div className="bg-slate-50/70 hover:bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-sm transition-all space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center">
                            {item.author?.slice(0, 1) || 'U'}
                          </span>
                          <span className="text-xs font-black text-slate-800">
                            {item.author}
                          </span>
                          {item.actionType === 'progress_update' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700">
                              อัปเดตความคืบหน้า
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDateTimeThai(item.timestamp)}</span>
                        </div>
                      </div>

                      {/* Log text content */}
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {item.content}
                      </p>

                      {/* Status change tag pills */}
                      {item.previousStatus && item.newStatus && (
                        <div className="flex items-center gap-1.5 pt-1 text-[11px] font-bold">
                          <span className="text-slate-400">สถานะ:</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                            {item.previousStatus}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-[#0073ea]">
                            {item.newStatus}
                          </span>
                        </div>
                      )}

                      {/* Attachment preview */}
                      {item.attachment && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <a
                            href={item.attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>{item.attachment.name}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {activityTrail.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">
                  ยังไม่มีประวัติการอัปเดตงาน
                </div>
              )}
            </div>
          </div>

          {/* Quick Post Update Bar at the bottom of Infographic */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-indigo-600" /> บันทึกอัปเดตความคืบหน้านี้ทันที
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-bold">โดย:</span>
                <select
                  value={quickAuthor}
                  onChange={(e) => setQuickAuthor(e.target.value)}
                  className="py-1 px-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none"
                >
                  {availableUsers.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={quickLogText}
                  onChange={(e) => setQuickLogText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePostQuickLog();
                  }}
                  placeholder="พิมพ์ข้อความอัปเดตขั้นตอนงาน หรือความคืบหน้าที่สำเร็จ..."
                  className="w-full py-2 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={quickStatus}
                  onChange={(e) => setQuickStatus(e.target.value as TaskStatus)}
                  className="flex-1 py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                >
                  {MONDAY_STATUSES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handlePostQuickLog}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <span>ส่งอัปเดต</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
