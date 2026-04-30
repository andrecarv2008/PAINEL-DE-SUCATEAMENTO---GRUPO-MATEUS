'use client';

import { History, LayoutDashboard, ClipboardList, ChevronRight, LogOut, ShieldAlert, FileInput } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

export type TabType = 'registration' | 'dashboard' | 'history' | 'analyst' | 'permissions' | 'import';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  permissions: any;
}

export default function Sidebar({ activeTab, onTabChange, permissions }: SidebarProps) {
  const { logout, role, warehouse } = useAuth();
  
  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, perm: 'viewDashboard' },
    { id: 'registration' as const, label: 'Registro de Sucateamento', icon: ClipboardList, perm: 'registerWithdrawal' },
    { id: 'analyst' as const, label: 'Painel Analista', icon: History, perm: 'accessAnalystPanel' },
    { id: 'history' as const, label: 'Histórico Geral', icon: History, perm: 'viewGeneralHistory' },
    { id: 'import' as const, label: 'Importação', icon: FileInput, perm: 'importData' },
    { id: 'permissions' as const, label: 'Permissões', icon: ShieldAlert, perm: 'managePermissions' },
  ];

  const filteredTabs = tabs.filter(tab => !permissions || permissions[tab.perm] === true);

  return (
    <nav className="fixed left-0 top-16 bottom-0 w-20 lg:w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-white/[0.05] z-40 transition-all duration-300">
      <div className="flex flex-col h-full py-8 px-4">
        <div className="flex-1 space-y-4">
          <div className="px-2 mb-6 hidden lg:block">
             <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Operational Menu</span>
             {role && (
               <div className="mt-2 flex flex-col gap-1">
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-sky-600 rounded-full" />
                    <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 uppercase italic tracking-widest">{role}</span>
                 </div>
                 {warehouse && (
                   <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight pl-3.5 leading-none">{warehouse}</span>
                 )}
               </div>
             )}
          </div>
          {filteredTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "group relative flex items-center gap-4 w-full p-3.5 rounded-xl transition-all duration-300 border",
                  isActive 
                    ? "bg-sky-50 dark:bg-sky-500/10 text-sky-600 border-sky-100 dark:border-sky-500/20 shadow-sm" 
                    : "text-slate-500 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                )}
              >
                <tab.icon className={cn(
                  "w-5 h-5 shrink-0 transition-all duration-300",
                  isActive ? "stroke-[2.5]" : "stroke-[2]"
                )} />
                
                <span className={cn(
                  "hidden lg:block font-black text-[10px] uppercase tracking-[0.15em] whitespace-nowrap pt-0.5",
                  isActive ? "text-slate-950 dark:text-white" : ""
                )}>
                  {tab.label}
                </span>

                {isActive && (
                   <div className="hidden lg:block ml-auto w-1 h-1 bg-sky-600 rounded-full animate-pulse shadow-[0_0_8px_#0ea5e9]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-auto space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-xl hidden lg:block">
             <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Network Status</p>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400">Encrypted AES-256</span>
             </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full p-3.5 text-slate-400 hover:text-red-500 transition-colors group"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="hidden lg:block font-black text-[10px] uppercase tracking-widest">Terminate Session</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
