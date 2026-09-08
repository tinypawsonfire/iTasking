import React from 'react';
import { Plus, CheckCircle2, User, Calendar, Layers } from 'lucide-react';

interface EmptyStateProps {
  onOpenCreate: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onOpenCreate }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm space-y-6 my-6 animate-fadeIn">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
        <Layers className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-extrabold text-slate-900">
          เริ่มต้นใช้งานระบบติดตามงาน (Ready to start)
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          ระบบว่างพร้อมใช้งาน คุณสามารถเริ่มสร้างงานแรกเพื่อกำหนดว่า{' '}
          <span className="font-bold text-slate-700">เรื่องอะไร</span>,{' '}
          <span className="font-bold text-slate-700">ใครดูแล</span>, และ{' '}
          <span className="font-bold text-slate-700">มีไทม์ไลน์อย่างไร</span>
        </p>
      </div>

      {/* 3 Core Pillars Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
          <div className="text-xs font-bold text-indigo-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 1. เรื่องที่ทำ
          </div>
          <p className="text-xs text-slate-600 font-medium">ระบุชื่อและรายละเอียดของงาน</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
          <div className="text-xs font-bold text-indigo-600 flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> 2. ใครดูแล
          </div>
          <p className="text-xs text-slate-600 font-medium">ระบุชื่อผู้รับผิดชอบหลัก</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
          <div className="text-xs font-bold text-indigo-600 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> 3. ไทม์ไลน์
          </div>
          <p className="text-xs text-slate-600 font-medium">กำหนดวันเริ่มและวันส่งงาน</p>
        </div>
      </div>

      {/* Create Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onOpenCreate}
          className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มงานแรกของคุณ</span>
        </button>
      </div>
    </div>
  );
};
