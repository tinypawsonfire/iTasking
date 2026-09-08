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
          : `ปรับความคืบหน้าเป็น ${quickProgress}%`),
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
      `📈 ความคืบหน้า: ${task.progress}%`,
      `👤 ผู้รับผิดชอบ: ${task.assignees.join(', ')}`,
      `📅 ไทม์ไลน์: ${formatThaiDate(task.startDate)} ➔ ${task.deadlineText || formatThaiDate(task.deadlineDate)}`,
      alertInfo.badgeText ? `⏰ กำหนดส่ง: ${alertInfo.badgeText}` : '',
      totalSubtasks > 0 ? `📋 ขั้นตอนย่อย: สำเร็จแล้ว ${completedSubtasks}/${totalSubtasks} (${subtasksPercent}%)` : '',
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

  // 4 Milestone Roadmap Stages
  const stages = [
    {
      step: 1,
      title: 'เริ่มต้นภารกิจ',
      desc: 'ตั้งเป้าหมาย & เริ่มงาน',
      date: formatThaiDate(task.startDate),
      isDone: true,
      isActive: false,
    },
    {
      step: 2,
      title: 'ดำเนินการหลัก',
      desc: `${task.progress}% ดำเนินการแล้ว`,
      date: task.progress > 0 ? 'กำลังดำเนินการ' : 'รอเริ่มขั้นตอน',
      isDone: task.progress >= 60,
      isActive: task.status === 'in_progress' && task.progress < 60,
    },
    {
      step: 3,
      title: 'ตรวจสอบ & สรุปผล',
      desc: 'รอตรวจ / รอข้อตกลง',
      date: task.status === 'review' ? 'อยู่ระหว่างตรวจ' : 'ตามกำหนดส่ง',
      isDone: task.status === 'completed',
      isActive: task.status === 'review',
    },
    {
      step: 4,
      title: 'เป้าหมายสำเร็จ',
      desc: task.deadlineText || formatThaiDate(task.deadlineDate),
      date: task.status === 'completed' ? 'เสร็จสมบูรณ์' : alertInfo.badgeText,
      isDone: task.status === 'completed',
      isActive: task.status === 'completed',
    },
  ];

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
            {/* Widget 1: Progress Circle */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                <span>ความคืบหน้า</span>
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex items-center gap-3 my-1">
                <div className="relative w-12 h-12 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={
                        task.progress === 100
                          ? 'text-emerald-500'
                          : task.progress >= 50
                          ? 'text-[#0073ea]'
                          : 'text-amber-500'
                      }
                      strokeDasharray={`${task.progress}, 100`}
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-slate-900">
                    {task.progress}%
                  </div>
                </div>
                <div>
                  <div className="text-sm font-black text-slate-800">
                    {task.progress === 100
                      ? 'สำเร็จแล้ว'
                      : task.progress >= 75
                      ? 'ใกล้สมบูรณ์'
                      : task.progress >= 30
                      ? 'กำลังเร่งรัด'
                      : 'เพิ่งเริ่มต้น'}
                  </div>
                  <div className="text-[11px] text-slate-400">เป้าหมาย 100%</div>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                  style={{ width: `${task.progress}%` }}
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
                  {totalSubtasks > 0 ? `ความคืบหน้า ${subtasksPercent}%` : 'ยังไม่มีงานย่อย'}
                </div>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${subtasksPercent}%` }}
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

          {/* Infographic 4-Stage Roadmap Banner */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-[#0073ea]" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  แผนภูมิขั้นตอนการดำเนินงาน (Work Progression Roadmap)
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-400">4 ระยะหลัก</span>
            </div>

            {/* Visual Stepper Nodes */}
            <div className="relative pt-2 pb-2">
              {/* Connecting Bar */}
              <div className="hidden sm:block absolute top-1/2 -translate-y-1/2 left-8 right-8 h-1.5 bg-slate-100 rounded-full z-0">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width:
                      task.status === 'completed'
                        ? '100%'
                        : task.status === 'review'
                        ? '75%'
                        : task.progress >= 50
                        ? '50%'
                        : '25%',
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 relative z-10">
                {stages.map((st) => (
                  <div
                    key={st.step}
                    className={`flex sm:flex-col items-center gap-3 sm:text-center p-3 sm:p-2.5 rounded-2xl transition-all ${
                      st.isActive
                        ? 'bg-blue-50/70 border border-blue-200'
                        : 'bg-white sm:bg-transparent'
                    }`}
                  >
                    {/* Node circle */}
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shadow-xs shrink-0 transition-transform ${
                        st.isDone
                          ? 'bg-emerald-500 text-white'
                          : st.isActive
                          ? 'bg-[#0073ea] text-white ring-4 ring-blue-100 animate-pulse'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {st.isDone ? <Check className="w-4 h-4" /> : st.step}
                    </div>

                    {/* Step label */}
                    <div className="space-y-0.5 text-left sm:text-center min-w-0">
                      <div className="text-xs font-black text-slate-900">{st.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{st.desc}</div>
                      <div className="text-[10px] font-bold text-indigo-600">{st.date}</div>
                    </div>
                  </div>
                ))}
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
                          {item.progressPercent !== undefined && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700">
                              คืบหน้า {item.progressPercent}%
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
