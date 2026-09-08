import React, { useState, useEffect } from 'react';
import type { Task, TaskStatus, Priority, ActivityLog, Attachment, ModuleCategory } from '../types';
import { formatThaiDate, formatDateTimeThai } from '../utils/dateUtils';
import {
  X,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Paperclip,
  Link,
  ExternalLink,
  Edit3,
  Settings2,
  Trash2,
  Plus,
  Tag,
  AlertTriangle,
  Check,
  Save,
  Route,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickUpdateModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveUpdate: (updatedTask: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onDeleteCategory?: (categoryName: string) => void;
  onAddCategory?: (name: string) => void;
  availableUsers: string[];
  modules?: ModuleCategory[];
  initialTab?: 'log' | 'edit';
  onOpenInfographic?: (task: Task) => void;
}

export const QuickUpdateModal: React.FC<QuickUpdateModalProps> = ({
  task,
  isOpen,
  onClose,
  onSaveUpdate,
  onDeleteTask,
  onDeleteCategory,
  onAddCategory,
  availableUsers,
  modules = [],
  initialTab = 'log',
  onOpenInfographic,
}) => {
  if (!isOpen || !task) return null;

  const [activeTab, setActiveTab] = useState<'log' | 'edit'>(initialTab);

  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Tab 1: Log & Progress State
  const [authorName, setAuthorName] = useState(task.assignees[0] || 'ผู้รับผิดชอบ');
  const [customAuthor, setCustomAuthor] = useState('');
  const [logDate, setLogDate] = useState<string>(getTodayStr());
  const [logText, setLogText] = useState('');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [progress, setProgress] = useState<number>(task.progress);

  // Attachments
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Tab 2: Edit Task Info & Category State
  const [editTitle, setEditTitle] = useState(task.title || '');
  const [editModule, setEditModule] = useState(task.module || '');
  const [isCreatingNewModule, setIsCreatingNewModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [editAssignees, setEditAssignees] = useState<string[]>(task.assignees || []);
  const [assigneeInput, setAssigneeInput] = useState('');
  const [editStartDate, setEditStartDate] = useState(task.startDate || '');
  const [editDeadlineDate, setEditDeadlineDate] = useState(task.deadlineDate || '');
  const [editPriority, setEditPriority] = useState<Priority>(task.priority || 'medium');
  const [editDetail, setEditDetail] = useState(task.detail || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Synchronize state whenever task or initialTab changes
  useEffect(() => {
    if (task) {
      setActiveTab(initialTab);
      setAuthorName(task.assignees[0] || 'ผู้รับผิดชอบ');
      setCustomAuthor('');
      setLogDate(getTodayStr());
      setLogText('');
      setStatus(task.status);
      setProgress(task.progress);
      setAttachmentName('');
      setAttachmentUrl('');
      setShowAttachmentInput(false);

      setEditTitle(task.title || '');
      setEditModule(task.module || '');
      setIsCreatingNewModule(false);
      setIsManagingCategories(false);
      setNewModuleName('');
      setEditAssignees([...(task.assignees || [])]);
      setAssigneeInput('');
      setEditStartDate(task.startDate || '');
      setEditDeadlineDate(task.deadlineDate || '');
      setEditPriority(task.priority || 'medium');
      setEditDetail(task.detail || '');
      setShowDeleteConfirm(false);
    }
  }, [task, initialTab, isOpen]);

  const finalAuthor = customAuthor.trim() || authorName;

  const handleQuickPercent = (pct: number) => {
    setProgress(pct);
    if (pct === 100) {
      setStatus('completed');
    } else if (pct > 0 && status === 'todo') {
      setStatus('in_progress');
    }
  };

  // Submit Tab 1: Log & Progress
  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logText.trim() && progress === task.progress && status === task.status && !attachmentUrl.trim()) {
      onClose();
      return;
    }

    let newAttachment: Attachment | undefined = undefined;
    if (attachmentUrl.trim()) {
      const isImg = /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(attachmentUrl);
      newAttachment = {
        id: `att-${Date.now()}`,
        name: attachmentName.trim() || 'เอกสารแนบ',
        url: attachmentUrl.trim(),
        type: isImg ? 'image' : 'link',
      };
    }

    let logTimestamp = new Date().toISOString();
    if (logDate) {
      const now = new Date();
      const [y, m, d] = logDate.split('-').map(Number);
      const chosenDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
      logTimestamp = chosenDate.toISOString();
    }

    const isNowCompleted = status === 'completed';

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      taskId: task.id,
      author: finalAuthor,
      timestamp: logTimestamp,
      actionType: status !== task.status ? 'status_change' : 'progress_update',
      content: logText.trim() || (status !== task.status ? `ปรับสถานะเป็น ${status}` : 'บันทึกอัปเดตงาน'),
      previousStatus: task.status,
      newStatus: status,
      progressPercent: isNowCompleted ? 100 : (task.progress || 50),
      attachment: newAttachment,
    };
    const existingAttachments = task.attachments || [];
    const updatedAttachments = newAttachment ? [...existingAttachments, newAttachment] : existingAttachments;

    const updatedLogs = [newLog, ...(task.logs || [])].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const updatedTask: Task = {
      ...task,
      status: isNowCompleted ? 'completed' : status,
      progress: isNowCompleted ? 100 : progress,
      logs: updatedLogs,
      attachments: updatedAttachments,
      updatedAt: new Date().toISOString(),
    };

    onSaveUpdate(updatedTask);
    onClose();

    if (isNowCompleted && task.status !== 'completed') {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    }
  };

  // Multi-Assignee Handlers for Tab 2
  const handleAddAssignee = (nameToAdd: string) => {
    const clean = nameToAdd.trim();
    if (clean && !editAssignees.includes(clean)) {
      setEditAssignees([...editAssignees, clean]);
    }
  };

  const handleRemoveAssignee = (indexToRemove: number) => {
    setEditAssignees(editAssignees.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAssigneeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (assigneeInput.trim()) {
        const parts = assigneeInput.split(/[,/]+/).map((s) => s.trim()).filter(Boolean);
        const newOnes = parts.filter((p) => !editAssignees.includes(p));
        if (newOnes.length > 0) {
          setEditAssignees([...editAssignees, ...newOnes]);
        }
        setAssigneeInput('');
      }
    }
  };

  // Submit Tab 2: Edit Task Info & Category
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      alert('กรุณาระบุชื่องาน');
      return;
    }

    const finalModule = isCreatingNewModule
      ? newModuleName.trim() || editModule || 'ทั่วไป'
      : editModule || 'ทั่วไป';

    let finalAssignees = [...editAssignees];
    if (assigneeInput.trim()) {
      const parts = assigneeInput.split(/[,/]+/).map((s) => s.trim()).filter(Boolean);
      parts.forEach((p) => {
        if (!finalAssignees.includes(p)) finalAssignees.push(p);
      });
    }
    if (finalAssignees.length === 0) {
      finalAssignees = ['ยังไม่ระบุ'];
    }

    // Build changes summary for audit log
    const changes: string[] = [];
    if (editTitle.trim() !== task.title) changes.push(`ชื่อ: "${editTitle.trim()}"`);
    if (finalModule !== task.module) changes.push(`หมวดหมู่: "${finalModule}"`);
    if (JSON.stringify(finalAssignees) !== JSON.stringify(task.assignees)) {
      changes.push(`ผู้ดูแล: ${finalAssignees.join(', ')}`);
    }
    if (editDeadlineDate !== task.deadlineDate) {
      changes.push(`กำหนดส่ง: ${editDeadlineDate || 'ไม่ระบุ'}`);
    }

    const changeSummary = changes.length > 0 ? changes.join(' | ') : 'ปรับปรุงข้อมูลงาน';

    const editLog: ActivityLog = {
      id: `log-${Date.now()}`,
      taskId: task.id,
      author: finalAuthor || finalAssignees[0] || 'ผู้ดูแล',
      timestamp: new Date().toISOString(),
      actionType: 'note',
      content: `⚙️ แก้ไขข้อมูล: ${changeSummary}`,
      previousStatus: task.status,
      newStatus: task.status,
      progressPercent: task.progress,
    };

    const updatedTask: Task = {
      ...task,
      title: editTitle.trim(),
      module: finalModule,
      assignees: finalAssignees,
      startDate: editStartDate,
      deadlineDate: editDeadlineDate,
      priority: editPriority,
      detail: editDetail.trim(),
      logs: [editLog, ...(task.logs || [])],
      updatedAt: new Date().toISOString(),
    };

    onSaveUpdate(updatedTask);
    onClose();
  };

  // Distinct list of all available modules (from real user data only)
  const allModulesList = Array.from(
    new Set([
      ...(modules.map((m) => m.name)),
      task.module,
    ].filter(Boolean))
  );

  const handleDeleteCategoryClick = (moduleName: string) => {
    if (window.confirm(`คุณต้องการนำหมวดหมู่ "${moduleName}" ออกจากระบบใช่หรือไม่?`)) {
      if (onDeleteCategory) {
        onDeleteCategory(moduleName);
      }
      if (editModule.toLowerCase() === moduleName.toLowerCase()) {
        const remaining = allModulesList.filter((x) => x.toLowerCase() !== moduleName.toLowerCase());
        setEditModule(remaining[0] || 'ทั่วไป');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-start justify-between">
          <div className="space-y-1.5 flex-1 pr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-white/20 text-white border border-white/20">
                {task.module}
              </span>
              <span className="text-xs text-indigo-200 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                กำหนดส่ง: {task.deadlineText || formatThaiDate(task.deadlineDate)}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight line-clamp-1">
              {task.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-white/10 p-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual Mode Tab Selector + Infographic Button */}
        <div className="px-5 pt-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('log')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'log'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>1. บันทึก Log & ความคืบหน้า</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'edit'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>2. แก้ไขข้อมูลงาน & หมวดหมู่</span>
            </button>
          </div>

          {onOpenInfographic && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInfographic(task);
              }}
              className="mb-2 px-3 py-1.5 text-xs font-bold text-[#0073ea] hover:text-white bg-blue-50 hover:bg-[#0073ea] rounded-xl border border-blue-200/90 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs group"
              title="เปิดดูไทม์ไลน์ Infographic ขั้นตอนและความคืบหน้า"
            >
              <Route className="w-3.5 h-3.5 text-[#0073ea] group-hover:text-white" />
              <span>📊 ดูไทม์ไลน์ Infographic</span>
            </button>
          )}
        </div>

        {/* TAB 1: Log & Progress Update */}
        {activeTab === 'log' && (
          <form onSubmit={handleLogSubmit} className="p-5 sm:p-6 space-y-4 text-sm overflow-y-auto">
            {/* 1. Who is updating? */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" /> ผู้บันทึกความคืบหน้า
              </label>
              <div className="flex flex-wrap gap-2">
                {task.assignees.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setAuthorName(name);
                      setCustomAuthor('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      authorName === name && !customAuthor
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {name}
                  </button>
                ))}
                <input
                  type="text"
                  value={customAuthor}
                  onChange={(e) => setCustomAuthor(e.target.value)}
                  placeholder="+ พิมพ์ชื่อผู้บันทึกอื่น..."
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 3. Status picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">สถานะงาน</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
                {[
                  { id: 'in_progress', label: 'กำลังทำ', color: 'peer-checked:bg-blue-600 peer-checked:text-white' },
                  { id: 'review', label: 'รอตรวจ / รอสัญญา', color: 'peer-checked:bg-amber-500 peer-checked:text-white' },
                  { id: 'blocked', label: 'ติดปัญหา', color: 'peer-checked:bg-rose-600 peer-checked:text-white' },
                  { id: 'completed', label: 'เสร็จสมบูรณ์', color: 'peer-checked:bg-emerald-600 peer-checked:text-white' },
                ].map((st) => (
                  <label key={st.id} className="cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={st.id}
                      checked={status === st.id}
                      onChange={() => {
                        setStatus(st.id as TaskStatus);
                        if (st.id === 'completed') setProgress(100);
                      }}
                      className="sr-only peer"
                    />
                    <div
                      className={`p-2.5 rounded-xl text-center border border-slate-200 bg-white text-slate-700 transition-all ${st.color} peer-checked:border-transparent peer-checked:shadow-xs hover:bg-slate-50`}
                    >
                      {st.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Log Date Selector (supports backdating / retroactive logging) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" /> วันที่บันทึกความคืบหน้า (เลือกวันย้อนหลังได้)
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      setLogDate(`${y}-${m}-${day}`);
                    }}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border transition-all cursor-pointer ${
                      logDate === getTodayStr()
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    วันนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(Date.now() - 86400000);
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      setLogDate(`${y}-${m}-${day}`);
                    }}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border transition-all cursor-pointer ${
                      logDate !== getTodayStr()
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    เมื่อวาน
                  </button>
                </div>
              </div>
              <input
                type="date"
                required
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* 5. Log Note / Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  บันทึกรายละเอียดความคืบหน้า (Log Update)
                </label>
                <button
                  type="button"
                  onClick={() => setShowAttachmentInput(!showAttachmentInput)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>{showAttachmentInput ? 'ซ่อนแนบลิงก์' : '+ แนบรูป / ลิงก์เอกสาร'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                placeholder="พิมพ์อัปเดตสั้นๆ เช่น ได้รับ API แล้ว, สรุปประชุมกับ True เรียบร้อย, อยู่ระหว่างทดสอบ..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 leading-relaxed resize-none"
              />
            </div>

            {/* Optional Attachment inputs */}
            {showAttachmentInput && (
              <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2 text-xs animate-fadeIn">
                <span className="font-bold text-indigo-900 block flex items-center gap-1">
                  <Link className="w-3.5 h-3.5" /> แนบหลักฐาน / ลิงก์เอกสาร (Proof of Work)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder="ชื่อไฟล์ (เช่น ภาพระบบ, สัญญา Google Drive)"
                    className="px-3 py-1.5 bg-white border border-indigo-200 rounded-xl focus:outline-none"
                  />
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="URL ลิงก์ (https://drive.google.com/... หรือภาพ)"
                    className="px-3 py-1.5 bg-white border border-indigo-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Existing Attachments Display */}
            {task.attachments && task.attachments.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  ไฟล์ & เอกสารแนบในงานนี้
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {task.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{att.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Submit buttons */}
            <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>ต้องการแก้ไขชื่องาน หรือ หมวดหมู่?</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> บันทึกการอัปเดต
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: Full Task Info & Category Editing */}
        {activeTab === 'edit' && (
          <form onSubmit={handleEditSubmit} className="p-5 sm:p-6 space-y-4 text-sm overflow-y-auto">
            {/* 1. Task Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" /> ชื่องาน / โปรเจกต์
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="ระบุชื่องาน..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* 2. Category / Module Editing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" /> หมวดหมู่ / ฝ่าย (Category / Module)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsManagingCategories(!isManagingCategories);
                      setIsCreatingNewModule(false);
                    }}
                    className={`text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                      isManagingCategories
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'text-rose-600 hover:text-rose-800 hover:bg-rose-50 border-transparent'
                    }`}
                    title="ลบหมวดหมู่ที่ไม่ต้องการใช้ออก"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isManagingCategories ? 'เสร็จสิ้น' : 'ลบหมวดหมู่'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewModule(!isCreatingNewModule);
                      setIsManagingCategories(false);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isCreatingNewModule ? 'เลือกจากรายการ' : '+ สร้างหมวดใหม่'}</span>
                  </button>
                </div>
              </div>

              {/* Managing / Deleting Categories Panel */}
              {isManagingCategories && (
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-800">
                    <span className="flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" /> กดปุ่ม ✕ ที่หมวดหมู่ที่ต้องการลบออก:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsManagingCategories(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer font-bold"
                    >
                      ปิด
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {allModulesList.map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs group"
                      >
                        <span>{m}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategoryClick(m)}
                          className="w-4 h-4 rounded-full bg-slate-100 hover:bg-rose-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-[10px]"
                          title={`ลบหมวดหมู่ "${m}"`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!isCreatingNewModule ? (
                <select
                  value={editModule}
                  onChange={(e) => {
                    if (e.target.value === '__new__') {
                      setIsCreatingNewModule(true);
                      setIsManagingCategories(false);
                    } else {
                      setEditModule(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {allModulesList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  <option value="__new__">+ สร้างหมวดหมู่ใหม่...</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    placeholder="พิมพ์ชื่อหมวดหมู่ใหม่ เช่น Partner, True, Insurance..."
                    className="flex-1 px-3.5 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newModuleName.trim()) {
                        const clean = newModuleName.trim();
                        setEditModule(clean);
                        if (onAddCategory) {
                          onAddCategory(clean);
                        }
                        setIsCreatingNewModule(false);
                      } else {
                        setIsCreatingNewModule(false);
                      }
                    }}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                  >
                    ใช้ชื่อนี้
                  </button>
                </div>
              )}
            </div>

            {/* 3. Multi-Assignee Manager (Chips) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" /> ผู้รับผิดชอบ (สามารถใส่ได้หลายคน)
              </label>

              <div className="min-h-[46px] p-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center gap-1.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
                {editAssignees.map((name, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs animate-fadeIn"
                  >
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold">
                      {name.slice(0, 1).toUpperCase()}
                    </span>
                    <span>{name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAssignee(idx)}
                      className="ml-0.5 text-indigo-400 hover:text-rose-600 hover:bg-rose-50 rounded p-0.5 transition-colors cursor-pointer"
                      title={`ลบ ${name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  value={assigneeInput}
                  onChange={(e) => setAssigneeInput(e.target.value)}
                  onKeyDown={handleAssigneeInputKeyDown}
                  placeholder={editAssignees.length === 0 ? 'พิมพ์ชื่อแล้วกด Enter...' : '+ เพิ่มอีกคน...'}
                  className="flex-1 min-w-[130px] bg-transparent text-xs py-1 px-1.5 text-slate-800 focus:outline-none"
                />
              </div>

              {/* Team Suggestion Pills */}
              {availableUsers.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[11px] text-slate-400 font-medium">เลือกด่วน:</span>
                  {availableUsers.map((u) => {
                    const isAdded = editAssignees.includes(u);
                    return (
                      <button
                        key={u}
                        type="button"
                        onClick={() => {
                          if (isAdded) {
                            setEditAssignees(editAssignees.filter((name) => name !== u));
                          } else {
                            handleAddAssignee(u);
                          }
                        }}
                        className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isAdded ? `✓ ${u}` : `+ ${u}`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Dates: Start & Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-600" /> วันที่เริ่มงาน (Start Date)
                </label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-rose-500" /> กำหนดส่ง (Deadline Date)
                </label>
                <input
                  type="date"
                  value={editDeadlineDate}
                  onChange={(e) => setEditDeadlineDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 5. Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">ระดับความสำคัญ (Priority)</label>
              <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
                {[
                  { id: 'urgent', label: '🔴 ด่วนที่สุด', color: 'peer-checked:bg-rose-600 peer-checked:text-white' },
                  { id: 'high', label: '🟠 สูง', color: 'peer-checked:bg-amber-500 peer-checked:text-white' },
                  { id: 'medium', label: '🔵 ปานกลาง', color: 'peer-checked:bg-blue-600 peer-checked:text-white' },
                  { id: 'low', label: '⚪ ทั่วไป', color: 'peer-checked:bg-slate-600 peer-checked:text-white' },
                ].map((p) => (
                  <label key={p.id} className="cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={p.id}
                      checked={editPriority === p.id}
                      onChange={() => setEditPriority(p.id as Priority)}
                      className="sr-only peer"
                    />
                    <div
                      className={`p-2 rounded-xl text-center border border-slate-200 bg-white text-slate-700 transition-all ${p.color} peer-checked:border-transparent peer-checked:shadow-xs hover:bg-slate-50`}
                    >
                      {p.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 6. Task Detail / Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">รายละเอียดงาน (Description)</label>
              <textarea
                rows={3}
                value={editDetail}
                onChange={(e) => setEditDetail(e.target.value)}
                placeholder="ระบุรายละเอียดงาน สัญญา หรือข้อกำหนดเพิ่มเติม..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 leading-relaxed resize-none"
              />
            </div>

            {/* Delete Confirmation Box if triggered */}
            {showDeleteConfirm && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>ยืนยันการลบงานนี้หรือไม่?</span>
                </div>
                <p className="text-xs text-rose-600">
                  ชื่องาน "${task.title}" จะถูกลบออกจากฐานข้อมูล Cloud และระบบทันที
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteTask) {
                        onDeleteTask(task.id);
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    ยืนยันลบงาน
                  </button>
                </div>
              </div>
            )}

            {/* Action Row */}
            <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
              {onDeleteTask && !showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบงานนี้</span>
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> บันทึกการแก้ไข
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
