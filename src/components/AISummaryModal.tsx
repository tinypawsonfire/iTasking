import React, { useState } from 'react';
import type { Task } from '../types';
import { formatThaiDate, getDeadlineAlertInfo } from '../utils/dateUtils';
import {
  Sparkles,
  X,
  Copy,
  Check,
  Send,
  Printer,
  Download,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AISummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

export const AISummaryModal: React.FC<AISummaryModalProps> = ({
  isOpen,
  onClose,
  tasks,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [copiedLine, setCopiedLine] = useState(false);

  // Generate structured summary
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const reviewTasks = tasks.filter((t) => t.status === 'review' || t.status === 'blocked');
  const urgentTasks = tasks.filter((t) => {
    const alert = getDeadlineAlertInfo(t.deadlineDate, t.status);
    return alert.urgency === 'overdue' || alert.urgency === 'due_today' || alert.urgency === 'due_soon';
  });

  const totalTasks = tasks.length;
  const avgProgress =
    totalTasks > 0 ? Math.round(tasks.reduce((a, b) => a + b.progress, 0) / totalTasks) : 0;

  // Build report text for copying
  const plainReport = `📊 สรุปความคืบหน้าภาพรวมโครงการ [iTasking Report]
📅 รายงาน ณ วันที่: ${formatThaiDate(new Date().toISOString().slice(0, 10))}
----------------------------------------
📈 ภาพรวม:
• งานทั้งหมด: ${totalTasks} งาน
• เสร็จสมบูรณ์แล้ว: ${completedTasks.length}/${totalTasks} งาน
• กำลังดำเนินการ: ${inProgressTasks.length} งาน
• รอตรวจ/สัญญา/ติดปัญหา: ${reviewTasks.length} งาน
• งานที่ต้องเร่งรัด/ใกล้กำหนด: ${urgentTasks.length} งาน

✅ งานที่เสร็จสมบูรณ์แล้ว:
${
  completedTasks.length > 0
    ? completedTasks.map((t) => ` - [${t.module}] ${t.title} (ผู้ดูแล: ${t.assignees.join(', ')})`).join('\n')
    : ' - ยังไม่มีงานที่ปิดสมบูรณ์ในรอบนี้'
}

🔄 งานสำคัญที่กำลังดำเนินการ:
${
  inProgressTasks.length > 0
    ? inProgressTasks
        .slice(0, 5)
        .map(
          (t) =>
            ` - [${t.module}] ${t.title} | ผู้ดูแล: ${t.assignees.join(', ')} | กำหนดส่ง: ${t.deadlineText || formatThaiDate(t.deadlineDate)}`
        )
        .join('\n')
    : ' - ไม่มีงานที่กำลังทำ'
}

⚠️ งานที่ต้องเร่งรัด / ใกล้ถึงกำหนด:
${
  urgentTasks.length > 0
    ? urgentTasks
        .map(
          (t) =>
            ` - 🚨 [${t.module}] ${t.title} | ผู้ดูแล: ${t.assignees.join(', ')} | กำหนดส่ง: ${t.deadlineText || formatThaiDate(t.deadlineDate)}`
        )
        .join('\n')
    : ' - ทุกงานอยู่ในเกณฑ์เวลาปกติ'
}
----------------------------------------
รายงานโดยระบบ iTasking (Smart Visual Tracking)`;

  const lineFormatted = `🚀 [iTasking] อัปเดตสถานะงานประจำสัปดาห์ 📌
📊 สถานะภาพรวม: เสร็จแล้ว ${completedTasks.length}/${totalTasks} งาน (${inProgressTasks.length} งานกำลังดำเนินการ)

🔥 งานเร่งด่วนที่ต้องส่งเร็วๆ นี้ (${urgentTasks.length} งาน):
${
  urgentTasks.length > 0
    ? urgentTasks.map((t) => `👉 ${t.title} (@${t.assignees.join(', ')}) ส่ง: ${t.deadlineText || formatThaiDate(t.deadlineDate)}`).join('\n')
    : '✨ ไม่มีงานค้าง ทุกอย่างตรงเวลาครับ'
}

💬 ติดตามและอัปเดตงานทั้งหมดได้ที่ระบบ iTasking`;

  const handleCopy = () => {
    navigator.clipboard.writeText(plainReport);
    setCopied(true);
    confetti({ particleCount: 50, spread: 60 });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyLine = () => {
    navigator.clipboard.writeText(lineFormatted);
    setCopiedLine(true);
    confetti({ particleCount: 50, spread: 60 });
    setTimeout(() => setCopiedLine(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                AI สรุปรายงานความคืบหน้า (Smart Weekly Summary)
              </h3>
              <p className="text-xs text-indigo-200">
                ประมวลผลสถานะและประวัติ Log ของทีมโดยอัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">งานทั้งหมด</div>
              <div className="text-lg font-black text-indigo-600">{totalTasks} งาน</div>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-center">
              <div className="text-[10px] text-emerald-600 font-bold uppercase">เสร็จสมบูรณ์</div>
              <div className="text-lg font-black text-emerald-700">{completedTasks.length} งาน</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200 text-center">
              <div className="text-[10px] text-blue-600 font-bold uppercase">กำลังทำ</div>
              <div className="text-lg font-black text-blue-700">{inProgressTasks.length} งาน</div>
            </div>
            <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200 text-center">
              <div className="text-[10px] text-rose-600 font-bold uppercase">ต้องเร่งรัด</div>
              <div className="text-lg font-black text-rose-700">{urgentTasks.length} งาน</div>
            </div>
          </div>

          {/* AI Formatted Sections */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-4 font-sans text-slate-800 leading-relaxed">
            {/* 1. Highlights */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                1. ผลงานที่สำเร็จแล้ว (Completed Highlights)
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                {completedTasks.map((t) => (
                  <li key={t.id}>
                    <span className="font-bold">{t.title}</span> ({t.module}) — ผู้ดูแล:{' '}
                    <span className="font-semibold text-slate-900">{t.assignees.join(', ')}</span>
                  </li>
                ))}
                {completedTasks.length === 0 && <li className="text-slate-400">ยังไม่มีงานที่ปิดสมบูรณ์ในรอบนี้</li>}
              </ul>
            </div>

            {/* 2. In Progress */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider text-blue-700">
                <Clock className="w-4 h-4 text-blue-600" />
                2. งานสำคัญที่กำลังดำเนินงาน (Key In-Progress)
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                {inProgressTasks.slice(0, 5).map((t) => (
                  <li key={t.id}>
                    <span className="font-bold">{t.title}</span> (ผู้ดูแล:{' '}
                    {t.assignees.join(', ')}) กำหนดส่ง:{' '}
                    {t.deadlineText || formatThaiDate(t.deadlineDate)}
                  </li>
                ))}
                {inProgressTasks.length === 0 && <li className="text-slate-400">ไม่มีงานที่กำลังทำ</li>}
              </ul>
            </div>

            {/* 3. Urgent / Action Required */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider text-rose-700">
                <Flame className="w-4 h-4 text-rose-600" />
                3. งานเร่งด่วนที่ต้องติดตาม (Urgent Actions)
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                {urgentTasks.map((t) => (
                  <li key={t.id} className="text-rose-900">
                    <span className="font-bold">{t.title}</span> (ผู้ดูแล:{' '}
                    <span className="font-bold">{t.assignees.join(', ')}</span>) กำหนดส่ง:{' '}
                    <span className="font-bold text-rose-700">
                      {t.deadlineText || formatThaiDate(t.deadlineDate)}
                    </span>
                  </li>
                ))}
                {urgentTasks.length === 0 && <li className="text-slate-400">ทุกงานอยู่ในกำหนดเวลาปกติ</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLine}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                copiedLine
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              {copiedLine ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLine ? 'คัดลอกสำหรับ LINE แล้ว!' : '📲 คัดลอกส่งเข้า LINE'}</span>
            </button>

            <button
              onClick={handleCopy}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                copied
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'คัดลอกรายงานฉบับเต็มแล้ว!' : '📋 คัดลอกรายงานฉบับเต็ม'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
