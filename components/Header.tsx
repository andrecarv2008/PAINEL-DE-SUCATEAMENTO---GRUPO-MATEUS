'use client';

import { Terminal, Settings, ShieldCheck, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-md fixed top-0 w-full z-50 border-b border-slate-200 dark:border-white/[0.05] shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-colors duration-300">
      <div className="flex justify-between items-center px-10 h-16 w-full">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-950 dark:bg-sky-600 rounded flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.1)]">
            <Terminal className="text-white w-6 h-6 stroke-[3]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-none">
              Painel de <span className="text-sky-600">Sucateamento</span>
            </h1>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Industrial Intelligence</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-all border border-slate-200 dark:border-white/[0.05]"
            title="Alternar Tema"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <div className="text-right hidden md:block">
            <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Protocol Node</p>
            <p className="text-slate-600 dark:text-slate-300 text-[10px] font-mono">B05-SOUTH-PROD</p>
          </div>
          <div className="w-[1px] h-8 bg-slate-200 dark:bg-white/[0.05] hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-green-600 uppercase">System Stable</span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">99.8% Sync</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.05] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-sky-600/50" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
