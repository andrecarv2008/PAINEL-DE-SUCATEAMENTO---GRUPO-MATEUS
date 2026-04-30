'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar, { TabType } from '@/components/Sidebar';
import RegistrationTab from '@/components/RegistrationTab';
import DashboardTab from '@/components/DashboardTab';
import HistoryTab from '@/components/HistoryTab';
import PermissionsTab from '@/components/PermissionsTab';
import { AnimatePresence, motion } from 'motion/react';
import { useRegistrations } from '@/lib/firestore-service';
import { useAuth } from '@/hooks/useAuth';
import { Terminal, ShieldCheck, LogIn } from 'lucide-react';

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const { user, role, warehouse, permissions, loading: authLoading, loginWithGoogle } = useAuth();
  const { registrations, addRegistration, confirmRegistration, deleteRegistration } = useRegistrations(warehouse);

  const handleNewRegistration = async (data: any) => {
    await addRegistration(data);
    setActiveTab('analyst');
  };

  if (authLoading) {
    return (
      <div className="bg-slate-50 dark:bg-[#020617] min-h-screen flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-slate-50 dark:bg-[#020617] min-h-screen text-slate-900 dark:text-slate-100 selection:bg-sky-500 selection:text-white flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/5 blur-[120px] rounded-full"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-3xl p-10 shadow-2xl relative z-10 text-center"
        >
          <div className="w-20 h-20 bg-sky-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-600/20 mx-auto mb-8">
            <Terminal className="text-white w-12 h-12 stroke-[3]" />
          </div>
          
          <h1 className="text-4xl font-black tracking-tighter text-slate-950 dark:text-white uppercase italic leading-none mb-2">
            Ativo<span className="text-sky-600">Terminal</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10">Advanced Fleet Management</p>
          
          <div className="space-y-4">
            <button 
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black py-4 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-95 text-sm uppercase tracking-widest shadow-xl"
            >
              <LogIn className="w-5 h-5" />
              Acessar com Google
            </button>
            <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Acesso Criptografado</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-[#020617] min-h-screen text-slate-900 dark:text-slate-100 selection:bg-sky-500 selection:text-white flex flex-col relative overflow-hidden font-sans transition-colors duration-300">
      {/* Dynamic Background System */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full opacity-70" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '100px 100px' }} />
      </div>

      <Header />
      <div className="flex flex-1 pt-16 relative z-10">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} permissions={permissions} />
        
        <main className="flex-1 ml-20 lg:ml-64 p-6 md:p-10 transition-all duration-300 relative">
          <div className="max-w-[1600px] mx-auto relative z-10">
            <AnimatePresence mode="wait">
              {activeTab === 'registration' && permissions?.registerWithdrawal && (
                <RegistrationTab key="reg" onSuccess={handleNewRegistration} onTabChange={setActiveTab} />
              )}
              {activeTab === 'dashboard' && permissions?.viewDashboard && (
                <DashboardTab key="dash" />
              )}
              {activeTab === 'analyst' && permissions?.accessAnalystPanel && (
                <HistoryTab 
                  key="analyst" 
                  history={registrations.filter(r => !r.status || r.status === 'pending')} 
                  title="PAINEL ANALISTA" 
                  isAnalystMode
                  onConfirmed={() => setActiveTab('history')}
                  onConfirmAction={confirmRegistration}
                  onDeleteAction={deleteRegistration}
                  canDelete={permissions?.deleteRecords}
                />
              )}
              {activeTab === 'history' && permissions?.viewGeneralHistory && (
                <HistoryTab 
                  key="hist" 
                  history={registrations} 
                  title="HISTÓRICO GERAL" 
                  onDeleteAction={deleteRegistration}
                  canDelete={permissions?.deleteRecords}
                />
              )}
              {activeTab === 'permissions' && permissions?.managePermissions && (
                <PermissionsTab key="perm" />
              )}
              
              {/* Fallback if user somehow lands on a restricted tab */}
              {((activeTab === 'analyst' && !permissions?.accessAnalystPanel) || 
                (activeTab === 'permissions' && !permissions?.managePermissions) ||
                (activeTab === 'registration' && !permissions?.registerWithdrawal)) && (
                <div className="flex flex-col items-center justify-center p-20 text-center">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-3xl flex items-center justify-center mb-6">
                    <ShieldCheck className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase italic mb-2 tracking-widest">Acesso Restrito</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-8">Você não possui permissão para acessar esta área.</p>
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className="px-8 py-3 bg-sky-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-sky-500 transition-all shadow-lg shadow-sky-600/20"
                  >
                    Voltar ao Dashboard
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
