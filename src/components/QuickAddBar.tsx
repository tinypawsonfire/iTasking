import React, { useState } from 'react';
import type { Task, TaskStatus, ModuleCategory } from '../types';
import { Plus, User, Calendar, Layers, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

interface QuickAddBarProps {
  modules?: ModuleCategory[];
  availableUsers?: string[];
  onAddTask: (newTask: Task) => void;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  modules = [],
  availableUsers = [],
  onAddTask,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [module, setModule] = useState(modules[0]?.name || 'งานทั่วไป');
  const [assignee, setAssignee] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineText, setDeadlineText] = useState('');
  const [detail, setDetail] = useState('');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalAssignee = assignee.trim() || 'ยังไม่ระบุ';
    const finalStartDate = startDate || new Date().toISOString().slice(0, 10);
    const finalDeadlineDate = deadlineDate || finalStartDate;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      code: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      module: module.trim() || 'งานทั่วไป',
      title: title.trim(),
      detail: detail.trim(),
      assignees: [finalAssignee],
      status: 'in_progress' as TaskStatus,
      priority: 'medium',
      progress: 0,
      startDate: finalStartDate,
      deadlineDate: finalDeadlineDate,
      deadlineText: deadlineText.trim() || undefined,
      subtasks: [],
      logs: [
        {
          id: `log-${Date.now()}`,
          taskId: `task-${Date.now()}`,
          author: finalAssignee,
          timestamp: new Date().toISOString(),
          actionType: 'created',
          content: `สร้างงาน "${title.trim()}" ผู้ดูแล: ${finalAssignee}`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddTask(newTask);
    setTitle('');
    setDetail('');
    setAssignee('');
    setDeadlineDate('');
    setDeadlineText('');
    setIsExpanded(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full py-3 px-4 bg-slate-50 hover:bg-indigo-50/70 border border-dashed border-slate-300 hover:border-indigo-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <span>+ สร้างงานใหม่ (ระบุ: เรื่องอะไร • ใครดูแล • ไทม์ไลน์)...</span>
          </div>
          <span className="text-xs text-indigo-600 font-bold hidden sm:inline">
            คลิกเพื่อกรอก ⚡
          </span>
        </button>
      ) : (
        <form onSubmit={handleQuickSubmit} className="space-y-3.5 animate-fadeIn text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" /> สร้างงานใหม่
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
            >
              ย่อเก็บ
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* 1. เรื่องที่ทำ */}
            <div className="sm:col-span-5 space-y-1">
              <label className="font-bold text-slate-700 block">
                1. เรื่องที่ทำ (ชื่องาน) *
              </label>
              <input
                type="text"
                autoFocus
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น ทำสัญญา Partner, ทดสอบระบบ API..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 2. ใครดูแล */}
            <div className="sm:col-span-4 space-y-1">
              <label className="font-bold text-slate-700 block">
                2. ใครดูแล (ผู้รับผิดชอบ) *
              </label>
              <input
                type="text"
                required
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="พิมพ์ชื่อคนรับผิดชอบ เช่น เอก, มอส..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* หมวดหมู่ / โปรเจกต์ */}
            <div className="sm:col-span-3 space-y-1">
              <label className="font-bold text-slate-700 block">
                หมวดหมู่ / ฝ่าย
              </label>
              <input
                type="text"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                placeholder="เช่น ประกัน, IT, บัญชี..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 3. ไทม์ไลน์ (วันเริ่ม และ กำหนดส่ง) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">วันเริ่มงาน</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">วันกำหนดส่ง (Deadline)</label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">ข้อความกำกับ (ถ้ามี)</label>
              <input
                type="text"
                value={deadlineText}
                onChange={(e) => setDeadlineText(e.target.value)}
                placeholder="เช่น 25 ส.ค., สิ้นเดือน, รอสัญญา..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* รายละเอียดเพิ่มเติม */}
          <div>
            <textarea
              rows={2}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="รายละเอียดงานเพิ่มเติม หรือสิ่งที่ต้องติดตาม (ไม่บังคับ)..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> บันทึกและเริ่มติดตาม
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
