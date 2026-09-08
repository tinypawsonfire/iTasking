import React, { useState } from 'react';
import { Sparkles, ShieldCheck, ArrowRight, Building2, User, IdCard, CheckCircle2 } from 'lucide-react';

export interface UserAuthSession {
  name: string;
  empId: string;
  bu: string;
  loginAt: string;
}

interface LoginPageProps {
  onLogin: (session: UserAuthSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [empId, setEmpId] = useState('');
  const [bu, setBu] = useState('ICI');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณากรอกชื่อของคุณ');
      return;
    }
    if (!empId.trim()) {
      setError('กรุณากรอกรหัสพนักงาน');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const session: UserAuthSession = {
        name: name.trim(),
        empId: empId.trim().toUpperCase(),
        bu: bu,
        loginAt: new Date().toISOString(),
      };
      localStorage.setItem('iTasking_auth_session', JSON.stringify(session));
      onLogin(session);
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/50 relative overflow-hidden font-sans p-4 select-none">
      {/* Ambient soft glow accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-200/50 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-200/50 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[150px] pointer-events-none" />

      {/* Clean Light-Theme Card */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 sm:p-9 shadow-[0_20px_60px_-15px_rgba(0,115,234,0.12)] relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0073ea] via-[#338cff] to-[#784bd1] text-white shadow-xl shadow-blue-500/25 mb-3.5 transform hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
            iTasking <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0073ea] border border-blue-200 font-bold tracking-wide">ENTERPRISE</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">
            Smart Visual Task & Timeline Management System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl text-center font-medium animate-shake">
              ⚠️ {error}
            </div>
          )}

          {/* Field 1: ชื่อ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#0073ea]" /> ชื่อ / นามเรียก (Name)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="เช่น Somchai D."
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0073ea] focus:ring-4 focus:ring-[#0073ea]/10 transition-all font-medium"
              autoFocus
            />
          </div>

          {/* Field 2: รหัสพนักงาน */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <IdCard className="w-3.5 h-3.5 text-indigo-500" /> รหัสพนักงาน (Employee ID)
            </label>
            <input
              type="text"
              value={empId}
              onChange={(e) => { setEmpId(e.target.value); setError(''); }}
              placeholder="เช่น EMP-0881"
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase tracking-wider font-mono font-semibold"
            />
          </div>

          {/* Field 3: BU (Dropdown) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-600" /> Business Unit (BU)
            </label>
            <div className="relative">
              <select
                value={bu}
                onChange={(e) => setBu(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all cursor-pointer appearance-none font-bold"
              >
                <option value="ICI">ICI</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 py-3.5 px-4 bg-gradient-to-r from-[#0073ea] via-[#0060c0] to-[#5a2ec0] hover:from-[#0060c0] hover:to-[#4a229d] text-white font-bold rounded-xl text-sm shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>เข้าสู่ระบบ iTasking</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-7 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Secured Workspace
          </span>
          <span className="font-semibold text-slate-500">BU: ICI Dedicated</span>
        </div>
      </div>
    </div>
  );
};
