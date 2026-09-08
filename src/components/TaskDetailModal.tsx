import React, { useState } from 'react';
import { ActivityLog, Subtask, Task, TaskStatus, UserProfile } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatDateTimeThai, formatThaiDate, isTaskOverdue } from '../utils/dateUtils';
import {
  X,
  Calendar,
  User,
  Clock,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  Tag,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
  currentUser: UserProfile;
  availableUsers: UserProfile[];
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  onDeleteTask,
  currentUser,
  availableUsers,
}) => {
  if (!isOpen || !task) return null;

  const [currentTask, setCurrentTask] = useState<Task>({ ...task });
  const [newLogContent, setNewLogContent] = useState('');
  const [newLogStatus, setNewLogStatus] = useState<TaskStatus>(task.status);
  const [newLogProgress, setNewLogProgress] = useState<number>(task.progress);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync state if task changes
  React.useEffect(() => {
    if (task) {
      setCurrentTask({ ...task });
      setNewLogStatus(task.status);
      setNewLogProgress(task.progress);
    }
  }, [task]);

  const handleStatusChange = (newStatus: TaskStatus) => {
    const updated = {
      ...currentTask,
      status: newStatus,
      progress: newStatus === 'completed' ? 100 : currentTask.progress,
      updatedAt: new Date().toISOString(),
    };
    setCurrentTask(updated);
    onUpdateTask(updated);

    if (newStatus === 'completed') {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
  };

  const handleProgressChange = (newProgress: number) => {
    const newStatus: TaskStatus =
      newProgress === 100
        ? 'completed'
        : newProgress > 0 && currentTask.status === 'todo'
        ? 'in_progress'
        : currentTask.status;

    const updated = {
      ...currentTask,
      progress: newProgress,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    setCurrentTask(updated);
    onUpdateTask(updated);

    if (newProgress === 100 && currentTask.progress !== 100) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
  };

  const handleAddProgressLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogContent.trim()) return;

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      taskId: currentTask.id,
      author: currentUser.name,
      role: currentUser.team,
      avatarColor: currentUser.avatarColor,
      timestamp: new Date().toISOString(),
      actionType: newLogStatus !== currentTask.status ? 'status_change' : 'progress_update',
      content: newLogContent.trim(),
      previousStatus: currentTask.status,
      newStatus: newLogStatus,
      progressPercent: newLogProgress,
    };

    const isCompleted = newLogStatus === 'completed' || newLogProgress === 100;

    const updated: Task = {
      ...currentTask,
      status: newLogStatus,
      progress: newLogProgress,
      logs: [newLog, ...(currentTask.logs || [])],
      updatedAt: new Date().toISOString(),
    };

    setCurrentTask(updated);
    onUpdateTask(updated);
    setNewLogContent('');

    if (isCompleted && currentTask.status !== 'completed') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
    }
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = currentTask.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    const completedCount = updatedSubtasks.filter((s) => s.completed).length;
    const autoProgress = updatedSubtasks.length > 0
      ? Math.round((completedCount / updatedSubtasks.length) * 100)
      : currentTask.progress;

    const updated = {
      ...currentTask,
      subtasks: updatedSubtasks,
      progress: autoProgress,
      status: autoProgress === 100 ? ('completed' as TaskStatus) : currentTask.status,
      updatedAt: new Date().toISOString(),
    };
    setCurrentTask(updated);
    onUpdateTask(updated);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSub: Subtask = {
      id: `st-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      assignee: currentUser.name,
    };

    const updatedSubtasks = [...(currentTask.subtasks || []), newSub];
    const updated = {
      ...currentTask,
      subtasks: updatedSubtasks,
      updatedAt: new Date().toISOString(),
    };
    setCurrentTask(updated);
    onUpdateTask(updated);
    setNewSubtaskTitle('');
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = currentTask.subtasks.filter((s) => s.id !== subtaskId);
    const updated = {
      ...currentTask,
      subtasks: updatedSubtasks,
      updatedAt: new Date().toISOString(),
    };
    setCurrentTask(updated);
    onUpdateTask(updated);
  };

  const overdue = isTaskOverdue(currentTask.deadlineDate, currentTask.status);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div className="space-y-1.5 flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                {currentTask.code || 'TASK'}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                หมวด: {currentTask.module}
              </span>
              <StatusBadge
                status={currentTask.status}
                interactive={true}
                onChange={handleStatusChange}
              />
              {overdue && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                  <AlertCircle className="w-3 h-3" /> เกินกำหนด
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              {currentTask.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two Columns */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Details, Progress Slider, Subtasks */}
          <div className="lg:col-span-7 space-y-5">
            {/* Task Detail / Description */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> รายละเอียดงาน (Detail)
                </span>
                <button
                  onClick={() => setIsEditingDetail(!isEditingDetail)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {isEditingDetail ? 'เสร็จสิ้น' : 'แก้ไข'}
                </button>
              </div>
              {isEditingDetail ? (
                <textarea
                  value={currentTask.detail}
                  onChange={(e) => {
                    const updated = { ...currentTask, detail: e.target.value };
                    setCurrentTask(updated);
                    onUpdateTask(updated);
                  }}
                  rows={3}
                  className="w-full text-sm p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {currentTask.detail || 'ไม่มีรายละเอียดเพิ่มเติม'}
                </p>
              )}
            </div>

            {/* Quick Meta Info (Assignees & Dates) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Assignees */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-xs font-semibold text-slate-400 block mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> ผู้รับผิดชอบ
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentTask.assignees.map((name, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      {name}
                    </span>
                  ))}
                  {currentTask.assignees.length === 0 && (
                    <span className="text-xs text-slate-400">ยังไม่ระบุ</span>
                  )}
                </div>
              </div>

              {/* Deadline */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-xs font-semibold text-slate-400 block mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> กำหนดส่ง (Deadline)
                </span>
                <div className="text-sm font-bold text-slate-800">
                  {currentTask.deadlineText || formatThaiDate(currentTask.deadlineDate)}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  เริ่ม: {formatThaiDate(currentTask.startDate)}
                </div>
              </div>
            </div>

            {/* Overall Progress Slider */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600" /> ความคืบหน้ารวม ({currentTask.progress}%)
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    currentTask.progress === 100
                      ? 'bg-emerald-100 text-emerald-800'
                      : currentTask.progress >= 50
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {currentTask.progress === 100 ? 'เสร็จสมบูรณ์' : `${currentTask.progress}% Complete`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={currentTask.progress}
                onChange={(e) => handleProgressChange(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
                <span>0% (ยังไม่เริ่ม)</span>
                <span>50% (กำลังทำ)</span>
                <span>100% (เสร็จสิ้น)</span>
              </div>
            </div>

            {/* Sub-tasks Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-600" /> รายการงานย่อย (Sub-tasks)
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {currentTask.subtasks?.filter((s) => s.completed).length || 0}/
                  {currentTask.subtasks?.length || 0}
                </span>
              </div>

              {/* Subtask list */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {currentTask.subtasks?.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                  >
                    <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleToggleSubtask(st.id)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 cursor-pointer"
                      />
                      <span
                        className={`text-sm ${
                          st.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'
                        }`}
                      >
                        {st.title}
                      </span>
                    </label>
                    <button
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(!currentTask.subtasks || currentTask.subtasks.length === 0) && (
                  <p className="text-xs text-slate-400 py-1 italic">ยังไม่มีรายการงานย่อย</p>
                )}
              </div>

              {/* Add Subtask Form */}
              <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="เพิ่มขั้นตอนงานย่อย..."
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskTitle.trim()}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> เพิ่ม
                </button>
              </form>
            </div>
          </div>

          {/* Right Column (5 cols): Activity Log & Post Update Form */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Post Update Form (The Core Feature) */}
            <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/50 border border-indigo-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> บันทึกความคืบหน้า (Log Update)
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                  โดย: {currentUser.name}
                </span>
              </div>

              <form onSubmit={handleAddProgressLog} className="space-y-3">
                <textarea
                  value={newLogContent}
                  onChange={(e) => setNewLogContent(e.target.value)}
                  placeholder="ระบุความคืบหน้าล่าสุด เช่น ประชุมสรุป BRD แล้ว, รอ API doc สัปดาห์หน้า, ส่งมอบงานแล้ว..."
                  rows={3}
                  className="w-full text-xs p-3 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner resize-none text-slate-800 placeholder:text-slate-400"
                />

                {/* Status & Progress Quick Pickers */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">ปรับสถานะเป็น</label>
                    <select
                      value={newLogStatus}
                      onChange={(e) => setNewLogStatus(e.target.value as TaskStatus)}
                      className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
                    >
                      <option value="in_progress">In progress</option>
                      <option value="blocked">ติดปัญหา / รอข้อมูล</option>
                      <option value="review">รอตรวจ / รอสัญญา</option>
                      <option value="completed">Completed (เสร็จสิ้น)</option>
                      <option value="todo">ยังไม่เริ่ม</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      ความคืบหน้า ({newLogProgress}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={newLogProgress}
                      onChange={(e) => setNewLogProgress(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none accent-indigo-600 mt-2"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!newLogContent.trim()}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> โพสต์บันทึกความคืบหน้า
                </button>
              </form>
            </div>

            {/* Chronological Activity Feed */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col min-h-[260px]">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> ประวัติการอัปเดต (Activity Feed)
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {currentTask.logs?.length || 0} รายการ
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[300px]">
                {currentTask.logs?.map((log) => (
                  <div
                    key={log.id}
                    className="relative pl-5 border-l-2 border-indigo-200 space-y-1 text-xs"
                  >
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-indigo-600"></div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{log.author}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {formatDateTimeThai(log.timestamp)}
                      </span>
                    </div>

                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs leading-relaxed">
                      {log.content}
                    </p>

                    {log.progressPercent !== undefined && (
                      <div className="flex items-center gap-2 text-[10px] text-indigo-600 font-semibold">
                        <span>ความคืบหน้า: {log.progressPercent}%</span>
                        {log.newStatus && <span>• สถานะ: {log.newStatus}</span>}
                      </div>
                    )}
                  </div>
                ))}

                {(!currentTask.logs || currentTask.logs.length === 0) && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    ยังไม่มีประวัติการอัปเดตงานนี้
                    <br />
                    พิมพ์บันทึกความคืบหน้าเพื่อเริ่มต้น Timeline
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-rose-600 font-semibold">ยืนยันการลบงานนี้?</span>
                <button
                  onClick={() => onDeleteTask(currentTask.id)}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700"
                >
                  ใช่, ลบเลย
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-slate-400 hover:text-rose-600 font-medium flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> ลบงานนี้
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
