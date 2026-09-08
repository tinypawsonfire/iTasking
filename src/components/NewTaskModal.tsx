import React, { useState } from 'react';
import { ModuleCategory, Priority, Task, TaskStatus, UserProfile } from '../types';
import { X, Plus, Calendar, Tag, User, Layers, AlertCircle } from 'lucide-react';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (newTask: Task) => void;
  modules: ModuleCategory[];
  users: UserProfile[];
  currentUser: UserProfile;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  modules,
  users,
  currentUser,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [module, setModule] = useState(modules[0]?.name || 'ประกัน');
  const [detail, setDetail] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([currentUser.name]);
  const [startDate, setStartDate] = useState('2026-08-25');
  const [deadlineDate, setDeadlineDate] = useState('2026-09-15');
  const [deadlineText, setDeadlineText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('in_progress');

  const handleToggleAssignee = (name: string) => {
    if (selectedAssignees.includes(name)) {
      setSelectedAssignees(selectedAssignees.filter((a) => a !== name));
    } else {
      setSelectedAssignees([...selectedAssignees, name]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      code: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      module,
      title: title.trim(),
      detail: detail.trim(),
      assignees: selectedAssignees.length > 0 ? selectedAssignees : [currentUser.name],
      teams: [currentUser.team],
      status,
      priority,
      progress: status === 'completed' ? 100 : 0,
      startDate: startDate || new Date().toISOString().slice(0, 10),
      deadlineDate: deadlineDate || new Date().toISOString().slice(0, 10),
      deadlineText: deadlineText.trim() || undefined,
      subtasks: [],
      logs: [
        {
          id: `log-${Date.now()}`,
          taskId: `task-${Date.now()}`,
          author: currentUser.name,
          timestamp: new Date().toISOString(),
          actionType: 'created',
          content: `สร้างงานใหม่ในหมวด ${module} และมอบหมายให้ ${selectedAssignees.join(', ')}`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddTask(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">เพิ่มงานใหม่ (Create New Task)</h3>
            <p className="text-xs text-slate-500 mt-0.5">กรอกข้อมูลงาน ผู้รับผิดชอบ และกำหนดส่งเพื่อเพิ่มลงตารางไทม์ไลน์</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Title & Module */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="font-bold text-slate-700 block">ชื่องาน (Task Name) *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น Cover+ ipad, สัญญารีวิว, API Sync..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">หมวดหมู่ (Module)</label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Detail */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">รายละเอียดงาน (Detail / Action Plan)</label>
            <textarea
              rows={3}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="ระบุเป้าหมาย สเปก ข้อตกลง หรือสิ่งที่ต้องประสานงาน..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Assignees (Multi-select) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-indigo-600" /> เลือกผู้รับผิดชอบ (Assignees)
            </label>
            <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-32 overflow-y-auto">
              {users.map((u) => {
                const isSelected = selectedAssignees.includes(u.name);
                return (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => handleToggleAssignee(u.name)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {u.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">วันเริ่มงาน (Start Date)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">วันกำหนดส่ง (Deadline)</label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">ข้อความกำกับ Deadline (ถ้ามี)</label>
              <input
                type="text"
                value={deadlineText}
                onChange={(e) => setDeadlineText(e.target.value)}
                placeholder="เช่น รอสัญญา, 25 ส.ค."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">สถานะเริ่มต้น</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
              >
                <option value="in_progress">In progress (กำลังทำ)</option>
                <option value="todo">To Do (ยังไม่เริ่ม)</option>
                <option value="review">Review (รอตรวจ/รอสัญญา)</option>
                <option value="blocked">Blocked (ติดปัญหา)</option>
                <option value="completed">Completed (เสร็จแล้ว)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">ระดับความสำคัญ</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
              >
                <option value="medium">ปกติ (Medium)</option>
                <option value="high">สูง (High)</option>
                <option value="urgent">เร่งด่วนมาก (Urgent)</option>
                <option value="low">ต่ำ (Low)</option>
              </select>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> บันทึกและสร้างงาน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
