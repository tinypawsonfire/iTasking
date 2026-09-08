import React, { useState } from 'react';
import type { Task, TaskStatus, ModuleCategory } from '../types';
import { getTimestampFromDateString } from '../utils/dateUtils';
import { X, Plus, Calendar, User, Layers, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (newTask: Task) => void;
  modules?: ModuleCategory[];
  availableUsers?: string[];
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  modules = [],
  availableUsers = [],
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [assigneeInput, setAssigneeInput] = useState('');
  const [assigneesList, setAssigneesList] = useState<string[]>([]);
  const [module, setModule] = useState(modules[0]?.name || 'งานทั่วไป');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineText, setDeadlineText] = useState('');
  const [detail, setDetail] = useState('');

  const handleAddAssignee = (nameToAdd: string) => {
    const clean = nameToAdd.trim();
    if (clean && !assigneesList.includes(clean)) {
      setAssigneesList([...assigneesList, clean]);
    }
    setAssigneeInput('');
  };

  const handleRemoveAssignee = (indexToRemove: number) => {
    setAssigneesList(assigneesList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDownAssignee = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (assigneeInput.trim()) {
        const parts = assigneeInput.split(/[,/]+/).map((s) => s.trim()).filter(Boolean);
        const newOnes = parts.filter((p) => !assigneesList.includes(p));
        if (newOnes.length > 0) {
          setAssigneesList([...assigneesList, ...newOnes]);
        }
        setAssigneeInput('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalAssignees = [...assigneesList];
    if (assigneeInput.trim()) {
      const parts = assigneeInput.split(/[,/]+/).map((s) => s.trim()).filter(Boolean);
      parts.forEach((p) => {
        if (!finalAssignees.includes(p)) finalAssignees.push(p);
      });
    }
    if (finalAssignees.length === 0) {
      finalAssignees = ['ยังไม่ระบุ'];
    }

    const finalStartDate = startDate || new Date().toISOString().slice(0, 10);
    const finalDeadlineDate = deadlineDate || finalStartDate;
    const creationTimestamp = getTimestampFromDateString(finalStartDate);
    const newTaskId = `task-${Date.now()}`;

    const newTask: Task = {
      id: newTaskId,
      code: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      module: module.trim() || 'งานทั่วไป',
      title: title.trim(),
      detail: detail.trim(),
      assignees: finalAssignees,
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
          taskId: newTaskId,
          author: finalAssignees[0] || 'ผู้ดูแล',
          timestamp: creationTimestamp,
          actionType: 'created',
          content: `สร้างงาน "${title.trim()}" ผู้ดูแล: ${finalAssignees.join(', ')}`,
        },
      ],
      createdAt: creationTimestamp,
      updatedAt: new Date().toISOString(),
    };

    onAddTask(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">สร้างงานใหม่ (Create Task)</h3>
              <p className="text-xs text-indigo-200">กรอกข้อมูล 3 สิ่งเพื่อเริ่มติดตามงาน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-white/10 p-1.5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* 1. เรื่องที่ทำ */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              1. เรื่องที่ทำ (ชื่องาน) *
            </label>
            <input
              type="text"
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ทำสัญญา Partner, ทดสอบระบบ API, สรุปบิล..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 2. ใครดูแล (ผู้รับผิดชอบ - Full Width เพื่อสัดส่วนที่สมดุล) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                2. ใครดูแล (ผู้รับผิดชอบ - ใส่ได้หลายคน) *
              </label>
              <span className="text-[11px] text-slate-400 font-normal">
                กด Enter หรือคั่นด้วยจุลภาค (,)
              </span>
            </div>

            {/* Multi-assignee chip container */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all flex flex-wrap items-center gap-1.5 min-h-[44px]">
              {assigneesList.map((name, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold animate-fadeIn shadow-2xs"
                >
                  <span className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center text-[9px] font-black">
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <span>{name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAssignee(idx)}
                    className="hover:text-rose-600 transition-colors p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={assigneeInput}
                onChange={(e) => setAssigneeInput(e.target.value)}
                onKeyDown={handleKeyDownAssignee}
                placeholder={assigneesList.length === 0 ? "พิมพ์ชื่อคนรับผิดชอบ เช่น เอก, มอส แล้วกด Enter..." : "+ เพิ่มอีกคน..."}
                className="flex-1 min-w-[150px] bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none py-1 px-1 font-medium"
              />
            </div>

            {/* Quick Suggestion Pills */}
            {availableUsers && availableUsers.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-slate-400 font-medium">เลือกเร็ว:</span>
                {availableUsers.slice(0, 6).map((u) => {
                  const isAdded = assigneesList.includes(u);
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => handleAddAssignee(u)}
                      disabled={isAdded}
                      className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
                        isAdded
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                          : 'bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border-slate-200 hover:border-indigo-300 cursor-pointer shadow-2xs'
                      }`}
                    >
                      + {u}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* หมวดหมู่ / ฝ่าย */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block text-xs flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              หมวดหมู่ / ฝ่าย (Module)
            </label>
            <input
              type="text"
              value={module}
              onChange={(e) => setModule(e.target.value)}
              placeholder="เช่น ประกัน, Partner, True, IT, ทั่วไป..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 3. ไทม์ไลน์ */}
          <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <label className="font-bold text-slate-700 block text-xs flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              3. ไทม์ไลน์ (วันเริ่ม ➔ วันกำหนดส่ง)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">วันเริ่มงาน</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">วันกำหนดส่ง (Deadline) *</span>
                <input
                  type="date"
                  required
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <input
                type="text"
                value={deadlineText}
                onChange={(e) => setDeadlineText(e.target.value)}
                placeholder="ข้อความระบุ Deadline พิเศษ (เช่น สิ้นเดือน, รอสัญญา, 25 ส.ค.)..."
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs mt-1"
              />
            </div>
          </div>

          {/* รายละเอียดเพิ่มเติม */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block text-xs">
              รายละเอียดงาน / Action Items (ถ้ามี)
            </label>
            <textarea
              rows={2}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="ระบุสิ่งที่ต้องทำเพิ่มเติม หรือเป้าหมายของงาน..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> บันทึกและเริ่มติดตาม
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
