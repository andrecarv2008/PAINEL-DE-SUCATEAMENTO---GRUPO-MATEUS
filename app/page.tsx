'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar, { TabType } from '@/components/Sidebar';
import RegistrationTab from '@/components/RegistrationTab';
import DashboardTab from '@/components/DashboardTab';
import HistoryTab from '@/components/HistoryTab';
import PermissionsTab from '@/components/PermissionsTab';
import ImportTab from '@/components/ImportTab';
import { AnimatePresence, motion } from 'motion/react';
import { useRegistrations } from '@/lib/firestore-service';
import { useAuth } from '@/hooks/useAuth';
import { Terminal, ShieldCheck, LogIn, Mail, Lock, UserPlus, AlertCircle, Loader2 } from 'lucide-react';

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const { user, role, warehouse, permissions, loading: authLoading, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const { registrations, addRegistration, confirmRegistration, deleteRegistration } = useRegistrations(warehouse);

  const handleNewRegistration = async (data: any) => {
    await addRegistration(data);
  };

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') setAuthError('Usuário não encontrado.');
      else if (err.code === 'auth/wrong-password') setAuthError('Senha incorreta.');
      else if (err.code === 'auth/email-already-in-use') setAuthError('Este e-mail já está em uso.');
      else if (err.code === 'auth/invalid-email') setAuthError('E-mail inválido.');
      else if (err.code === 'auth/weak-password') setAuthError('A senha deve ter pelo menos 6 caracteres.');
      else setAuthError('Erro ao processar autenticação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setAuthError('Erro ao entrar com Google.');
    }
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
          className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-10 shadow-2xl relative z-10"
        >
          <div className="w-20 h-20 bg-sky-600 rounded-3xl flex items-center justify-center shadow-lg shadow-sky-600/20 mx-auto mb-6">
            <Terminal className="text-white w-12 h-12 stroke-[3]" />
          </div>
          
          <h1 className="text-3xl font-black tracking-tighter text-slate-950 dark:text-white uppercase italic leading-none mb-1 text-center">
            Ativo<span className="text-sky-600">Terminal</span>
          </h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10 text-center">Advanced Fleet Management</p>
          
          <form onSubmit={handleAuth} className="space-y-4 mb-8">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                <input 
                  type="email" 
                  placeholder="E-MAIL"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-[10px] font-black text-slate-950 dark:text-white uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                <input 
                  type="password" 
                  placeholder="SENHA"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-[10px] font-black text-slate-950 dark:text-white uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>
            </div>

            <AnimatePresence>
              {authError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3 rounded-xl flex items-center gap-3"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-[9px] font-black uppercase text-red-600 dark:text-red-400 tracking-widest">{authError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-sky-600/20 active:scale-95 text-[10px] uppercase tracking-[0.2em] border-b-4 border-sky-700"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : isRegistering ? (
                <UserPlus className="w-4 h-4" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {isRegistering ? 'Criar Nova Conta' : 'Entrar no Sistema'}
            </button>
          </form>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-white/[0.05]"></div>
            </div>
            <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 bg-white dark:bg-slate-900 px-4">
              Ou continuar com
            </div>
          </div>

          <div className="space-y-6">
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-4 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] text-slate-900 dark:text-white font-black py-4 rounded-xl hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-all active:scale-95 text-[10px] uppercase tracking-widest"
            >
              <LogIn className="w-4 h-4" />
              Acessar com Google
            </button>

            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthError(null);
              }}
              className="w-full text-center text-[10px] font-black text-slate-400 hover:text-sky-500 uppercase tracking-widest transition-colors"
            >
              {isRegistering ? 'Já possui uma conta? Entrar' : 'Novo por aqui? Criar conta'}
            </button>

            <div className="flex items-center justify-center gap-2 text-slate-300 dark:text-slate-700">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Protocolo de Segurança Ativo</span>
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
              {activeTab === 'import' && permissions?.importData && (
                <ImportTab key="import" />
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
