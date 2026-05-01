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
import { Terminal, ShieldCheck, LogIn, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const { user, role, warehouse, permissions, loading: authLoading, loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const { registrations, addRegistration, confirmRegistration, deleteRegistration } = useRegistrations(warehouse);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthSubmitting(true);
    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
      } else {
        if (!name) throw new Error('Nome é obrigatório');
        await signupWithEmail(email, password, name);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao realizar autenticação');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar com Google');
    }
  };

  const handleNewRegistration = async (data: any) => {
    await addRegistration(data);
    // Don't switch to analyst tab anymore, keep the user on the registration screen
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[440px] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-3xl p-8 md:p-10 shadow-2xl relative z-10"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-sky-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-600/20 mx-auto mb-6">
              <Terminal className="text-white w-10 h-10 stroke-[3]" />
            </div>
            
            <h1 className="text-3xl font-black tracking-tighter text-slate-950 dark:text-white uppercase italic leading-none mb-1">
              Ativo<span className="text-sky-600">Terminal</span>
            </h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Advanced Fleet Management</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <AnimatePresence mode="wait">
              {authMode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-600 transition-colors" />
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-sky-600 transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-600 transition-colors" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@grupomateus.com.br"
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-sky-600 transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-600 transition-colors" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-sky-600 transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold uppercase text-center">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={authSubmitting}
              className="w-full flex items-center justify-center gap-3 bg-sky-600 text-white font-black py-4 rounded-xl hover:bg-sky-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 text-xs uppercase tracking-widest shadow-xl shadow-sky-600/20"
            >
              {authSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {authMode === 'login' ? 'Entrar no Sistema' : 'Criar Conta Agora'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.2em]">
              <span className="bg-white dark:bg-slate-900 px-4 text-slate-400">Ou continue com</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-4 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-black py-4 rounded-xl hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all active:scale-95 text-[10px] uppercase tracking-widest"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Entrar com Google
          </button>

          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setError(null);
              }}
              className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-sky-600 dark:hover:text-sky-500 transition-colors"
            >
              {authMode === 'login' ? 'Não tem uma conta? Registre-se' : 'Já tem uma conta? Clique aqui'}
            </button>
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
            <ShieldCheck className="w-3 h-3" />
            <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Criptografia de Ponta a Ponta</span>
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
