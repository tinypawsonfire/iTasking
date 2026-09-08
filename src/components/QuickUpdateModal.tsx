import React, { useState } from 'react';
import type { Task, TaskStatus, ActivityLog, Attachment } from '../types';
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
  Image,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickUpdateModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveUpdate: (updatedTask: Task) => void;
  availableUsers: string[];
}

export const QuickUpdateModal: React.FC<QuickUpdateModalProps> = ({
  task,
  isOpen,
  onClose,
  onSaveUpdate,
  availableUsers,
}) => {
  if (!isOpen || !task) return null;

  const [authorName, setAuthorName] = useState(task.assignees[0] || 'ผู้รับผิดชอบ');
  const [customAuthor, setCustomAuthor] = useState('');
  const [logText, setLogText] = useState('');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [progress, setProgress] = useState<number>(task.progress);

  // Attachments
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const finalAuthor = customAuthor.trim() || authorName;

  const handleQuickPercent = (pct: number) => {
    setProgress(pct);
    if (pct === 100) {
      setStatus('completed');
    } else if (pct > 0 && status === 'todo') {
      setStatus('in_progress');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      taskId: task.id,
      author: finalAuthor,
      timestamp: new Date().toISOString(),
      actionType: status !== task.status ? 'status_change' : 'progress_update',
      content: logText.trim() || `อัปเดตความคืบหน้าเป็น ${progress}% (${status})`,
      previousStatus: task.status,
      newStatus: status,
      progressPercent: progress,
      attachment: newAttachment,
    };

    const isNowCompleted = status === 'completed' || progress === 100;

    const existingAttachments = task.attachments || [];
    const updatedAttachments = newAttachment ? [...existingAttachments, newAttachment] : existingAttachments;

    const updatedTask: Task = {
      ...task,
      status: isNowCompleted ? 'completed' : status,
      progress: isNowCompleted ? 100 : progress,
      logs: [newLog, ...(task.logs || [])],
      attachments: updatedAttachments,
      updatedAt: new Date().toISOString(),
    };

    onSaveUpdate(updatedTask);
    onClose();

    if (isNowCompleted && task.status !== 'completed') {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/20 text-white">
                {task.module}
              </span>
              <span className="text-xs text-indigo-200">
                กำหนดส่ง: {task.deadlineText || formatThaiDate(task.deadlineDate)}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">{task.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-white/10 p-1.5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Update Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-sm overflow-y-auto">
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
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

          {/* 2. Progress percentage with quick buttons */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" /> ความคืบหน้าปัจจุบัน
              </span>
              <span className="font-black text-indigo-600 text-base">{progress}%</span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={(e) => handleQuickPercent(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            {/* Quick % buttons */}
            <div className="flex gap-1.5 pt-1">
              {[0, 25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickPercent(pct)}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                    progress === pct
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pct === 100 ? '✓ 100% เสร็จ' : `${pct}%`}
                </button>
              ))}
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

          {/* 4. Log Note / Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 block">
                บันทึกรายละเอียดความคืบหน้า (Log Update)
              </label>
              <button
                type="button"
                onClick={() => setShowAttachmentInput(!showAttachmentInput)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>{showAttachmentInput ? 'ซ่อนแนบลิงก์' : '+ แนบรูป / ลิงก์เอกสาร'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              autoFocus
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
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> บันทึกการอัปเดต
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
