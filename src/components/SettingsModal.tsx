import React, { useState } from 'react';
import type { ModuleCategory, Task } from '../types';
import {
  X,
  Settings,
  Layers,
  Users,
  Database,
  Plus,
  Trash2,
  Edit2,
  Check,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  Palette,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HardDrive,
  ExternalLink,
} from 'lucide-react';
import { exportDataAsJson } from '../utils/storage';
import { checkCloudHealth, syncAllTasksToCloud, syncCategoriesToCloud } from '../utils/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ModuleCategory[];
  tasks: Task[];
  onUpdateCategories: (newCategories: ModuleCategory[]) => void;
  onUpdateTasks: (newTasks: Task[]) => void;
  availableUsers: string[];
  onUpdateUsers?: (newUsers: string[]) => void;
  isCloudConnected?: boolean;
  onRefreshCloud?: () => void;
  initialTab?: 'categories' | 'team' | 'system';
}

const PRESET_COLORS = [
  { name: 'Ocean Blue', hex: '#0073ea' },
  { name: 'Emerald Green', hex: '#00c875' },
  { name: 'Amber Orange', hex: '#fdab3d' },
  { name: 'Rose Red', hex: '#e2445c' },
  { name: 'Purple Violet', hex: '#a25ddc' },
  { name: 'Indigo Deep', hex: '#579bfc' },
  { name: 'Teal Ocean', hex: '#03a9f4' },
  { name: 'Slate Dark', hex: '#4b5563' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  categories,
  tasks,
  onUpdateCategories,
  onUpdateTasks,
  availableUsers,
  onUpdateUsers,
  isCloudConnected = false,
  onRefreshCloud,
  initialTab = 'categories',
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'categories' | 'team' | 'system'>(initialTab);

  // Categories Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0].hex);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Quick Team Member State
  const [newUserName, setNewUserName] = useState('');

  // Ping Test State
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  // 1. Add New Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCatName.trim();
    if (!clean) return;

    if (categories.some((c) => c.name.toLowerCase() === clean.toLowerCase())) {
      alert(`หมวดหมู่ "${clean}" มีอยู่แล้วในระบบ`);
      return;
    }

    const newCat: ModuleCategory = {
      id: `cat-${Date.now()}`,
      name: clean,
      color: newCatColor,
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      badgeText: 'text-indigo-800',
      borderClass: 'border-l-indigo-500',
    };

    onUpdateCategories([...categories, newCat]);
    setNewCatName('');
  };

  // 2. Start Editing Category
  const handleStartEdit = (cat: ModuleCategory) => {
    setEditingCatId(cat.id);
    setEditingName(cat.name);
    setEditingColor(cat.color || '#0073ea');
    setDeleteConfirmId(null);
  };

  // 3. Save Edited Category
  const handleSaveEdit = (catId: string) => {
    const clean = editingName.trim();
    if (!clean) return;

    const oldCat = categories.find((c) => c.id === catId);
    if (!oldCat) return;

    // Check duplicate name
    if (
      clean.toLowerCase() !== oldCat.name.toLowerCase() &&
      categories.some((c) => c.name.toLowerCase() === clean.toLowerCase())
    ) {
      alert(`หมวดหมู่ "${clean}" มีอยู่แล้วในระบบ`);
      return;
    }

    // Update categories list
    const updatedCats = categories.map((c) =>
      c.id === catId ? { ...c, name: clean, color: editingColor || c.color } : c
    );
    onUpdateCategories(updatedCats);

    // If name changed, update existing tasks in this category
    if (clean.toLowerCase() !== oldCat.name.toLowerCase()) {
      const updatedTasks = tasks.map((t) =>
        t.module.toLowerCase() === oldCat.name.toLowerCase()
          ? { ...t, module: clean, updatedAt: new Date().toISOString() }
          : t
      );
      onUpdateTasks(updatedTasks);
    }

    setEditingCatId(null);
  };

  // 4. Delete Category
  const handleDeleteCategory = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;

    // Check tasks using this category
    const affectedTasks = tasks.filter(
      (t) => t.module.toLowerCase() === cat.name.toLowerCase()
    );

    if (affectedTasks.length > 0) {
      // Reassign affected tasks to 'ทั่วไป'
      const updatedTasks = tasks.map((t) =>
        t.module.toLowerCase() === cat.name.toLowerCase()
          ? { ...t, module: 'ทั่วไป', updatedAt: new Date().toISOString() }
          : t
      );
      onUpdateTasks(updatedTasks);
    }

    // Remove category
    const filteredCats = categories.filter((c) => c.id !== catId);

    // Ensure 'ทั่วไป' exists if tasks were reassigned
    if (
      affectedTasks.length > 0 &&
      !filteredCats.some((c) => c.name.toLowerCase() === 'ทั่วไป')
    ) {
      filteredCats.push({
        id: `cat-${Date.now()}`,
        name: 'ทั่วไป',
        color: '#64748b',
      });
    }

    onUpdateCategories(filteredCats);
    setDeleteConfirmId(null);
  };

  // 5. Add Team Member
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newUserName.trim();
    if (!clean) return;
    if (availableUsers.includes(clean)) {
      alert(`ผู้ดูแลชื่อ "${clean}" มีอยู่แล้ว`);
      return;
    }
    if (onUpdateUsers) {
      onUpdateUsers([...availableUsers, clean]);
    }
    setNewUserName('');
  };

  // 6. Remove Team Member
  const handleRemoveUser = (nameToRemove: string) => {
    if (onUpdateUsers) {
      onUpdateUsers(availableUsers.filter((u) => u !== nameToRemove));
    }
  };

  // 7. Ping Cloud Database Test
  const handleTestCloudPing = async () => {
    setIsPinging(true);
    setPingStatus(null);
    try {
      const start = Date.now();
      const res = await checkCloudHealth();
      const duration = Date.now() - start;
      if (res.dbOnline) {
        setPingStatus(`🟢 เชื่อมต่อสำเร็จ! Upstash Redis Singapore ออนไลน์ (Latency: ${duration}ms)`);
      } else {
        setPingStatus('🔴 ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบ Environment Variables');
      }
    } catch {
      setPingStatus('🔴 การทดสอบล้มเหลว ตรวจสอบเครือข่าย');
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Settings className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                การตั้งค่าระบบ (System Settings)
              </h3>
              <p className="text-xs text-indigo-200">
                จัดการหมวดหมู่, ปรับแต่งรายชื่อทีม, และสถานะคลาวด์ iTasking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-white/10 p-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-slate-200 bg-slate-50/70 flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'categories'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. จัดการหมวดหมู่ / ฝ่าย ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'team'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. ผู้ดูแลแนะนำ ({availableUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'system'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>3. คลาวด์ & ข้อมูลสำรอง</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-sm">
          {/* TAB 1: CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Add New Category Form */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    เพิ่มหมวดหมู่ใหม่ (Add New Category)
                  </h4>
                </div>

                <form onSubmit={handleAddCategory} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="พิมพ์ชื่อหมวดหมู่ เช่น PARTNER, OPERATION, CUSTOMER, HR..."
                      className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    {/* Color Presets */}
                    <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shrink-0">
                      <Palette className="w-3.5 h-3.5 text-slate-400 ml-1" />
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setNewCatColor(c.hex)}
                          className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                            newCatColor === c.hex
                              ? 'scale-125 ring-2 ring-indigo-500 ring-offset-1'
                              : 'hover:scale-110 opacity-80'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มหมวดหมู่</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Categories List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                    รายการหมวดหมู่ทั้งหมด ({categories.length} หมวดหมู่)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    💡 คลิกเพื่อเปลี่ยนชื่อหรือสีได้ทันที
                  </span>
                </div>

                <div className="space-y-2">
                  {categories.map((cat) => {
                    const isEditing = editingCatId === cat.id;
                    const taskCount = tasks.filter(
                      (t) => t.module.toLowerCase() === cat.name.toLowerCase()
                    ).length;
                    const isConfirmingDelete = deleteConfirmId === cat.id;

                    return (
                      <div
                        key={cat.id}
                        className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* Left: Color dot & Name */}
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: cat.color || '#0073ea' }}
                            />

                            {!isEditing ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold text-slate-800 text-xs truncate">
                                  {cat.name}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                  {taskCount} งาน
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit(cat.id);
                                    if (e.key === 'Escape') setEditingCatId(null);
                                  }}
                                  className="flex-1 px-2.5 py-1 text-xs border border-indigo-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                                />
                                {/* Color Picker for edit */}
                                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                                  {PRESET_COLORS.map((c) => (
                                    <button
                                      key={c.hex}
                                      type="button"
                                      onClick={() => setEditingColor(c.hex)}
                                      className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                                        editingColor === c.hex
                                          ? 'scale-125 ring-2 ring-indigo-500'
                                          : 'opacity-70'
                                      }`}
                                      style={{ backgroundColor: c.hex }}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(cat)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="แก้ไขชื่อและสี"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteConfirmId(
                                      isConfirmingDelete ? null : cat.id
                                    )
                                  }
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="ลบหมวดหมู่นี้"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setEditingCatId(null)}
                                  className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  ยกเลิก
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(cat.id)}
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>บันทึก</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Inline Delete Confirmation */}
                        {isConfirmingDelete && (
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-fadeIn text-xs">
                            <div className="flex items-center gap-2 text-rose-800 font-bold">
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>ยืนยันการลบหมวดหมู่ "{cat.name}" หรือไม่?</span>
                            </div>
                            {taskCount > 0 && (
                              <p className="text-[11px] text-rose-700">
                                ⚠️ มีงานจำนวน {taskCount} งานในหมวดนี้ ระบบจะย้ายงานทั้งหมดไปยังหมวด "ทั่วไป" โดยอัตโนมัติเพื่อไม่ให้ข้อมูลสูญหาย
                              </p>
                            )}
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                ยกเลิก
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                ยืนยันลบหมวดหมู่
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUICK TEAM MEMBERS */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Add Member Form */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    เพิ่มรายชื่อผู้ดูแลแนะนำ (Add Suggested Team Member)
                  </h4>
                </div>

                <form onSubmit={handleAddUser} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="พิมพ์ชื่อเพื่อนร่วมทีม เช่น มอส, เอก, แป้ง, นพ, เจมส์..."
                    className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มชื่อ</span>
                  </button>
                </form>
              </div>

              {/* Members Pill List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                  รายชื่อผู้ดูแลในระบบ ({availableUsers.length} คน)
                </h4>
                <div className="flex flex-wrap gap-2 p-4 bg-white rounded-2xl border border-slate-200">
                  {availableUsers.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 group hover:border-slate-300"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                        {name.slice(0, 1).toUpperCase()}
                      </span>
                      <span>{name}</span>
                      {onUpdateUsers && (
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(name)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 rounded cursor-pointer"
                          title={`ลบ ${name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                  {availableUsers.length === 0 && (
                    <p className="text-xs text-slate-400 italic">ยังไม่มีรายชื่อผู้ดูแล</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLOUD & BACKUP */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              {/* Cloud Database Connection Status */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-sm">ฐานข้อมูล Vercel Cloud Database</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isCloudConnected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {isCloudConnected ? '🟢 Cloud Synced' : '🟡 Local Mode'}
                  </span>
                </div>

                <p className="text-xs text-indigo-200 leading-relaxed">
                  ฐานข้อมูล Upstash Redis (Singapore Node) ซิงค์ข้อมูลงานและหมวดหมู่แบบ Multi-User ทุกคนในทีมเห็นข้อมูลเดียวกันแบบ Real-Time
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestCloudPing}
                    disabled={isPinging}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                    <span>{isPinging ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ (Ping Test)'}</span>
                  </button>

                  {onRefreshCloud && (
                    <button
                      type="button"
                      onClick={onRefreshCloud}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>ดึงข้อมูลล่าสุดจาก Cloud</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      setIsPushing(true);
                      try {
                        await syncAllTasksToCloud(tasks);
                        await syncCategoriesToCloud(categories);
                        setPingStatus('✓ อัปโหลดข้อมูลเครื่องนี้ขึ้น Cloud ให้ทุกคนเห็นเรียบร้อยแล้ว!');
                        setTimeout(() => setPingStatus(null), 4000);
                      } catch {
                        setPingStatus('เกิดข้อผิดพลาดในการส่งข้อมูล');
                      } finally {
                        setIsPushing(false);
                      }
                    }}
                    disabled={isPushing}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isPushing ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลเครื่องนี้ขึ้น Cloud ให้ทุกคนเห็น'}</span>
                  </button>
                </div>

                {pingStatus && (
                  <div className="p-2.5 bg-white/10 rounded-xl text-xs font-medium text-emerald-200 animate-fadeIn">
                    {pingStatus}
                  </div>
                )}
              </div>

              {/* Data Export & Backup */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-slate-700" />
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    สำรองและส่งออกข้อมูล (Data Backup)
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  ดาวน์โหลดข้อมูลงานและกิจกรรมทั้งหมดเก็บไว้ในคอมพิวเตอร์ของคุณในรูปแบบ JSON
                </p>

                <button
                  type="button"
                  onClick={() => exportDataAsJson(tasks)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>ดาวน์โหลดไฟล์สำรองข้อมูล (JSON)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};
