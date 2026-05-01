'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Loader2, LogIn, ChevronLeft, AlertCircle } from 'lucide-react';

interface AuthFormProps {
  onSuccess?: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { loginWithEmail, signUpWithEmail, resetPassword, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'signup') {
        if (!name) throw new Error('Nome é obrigatório');
        await signUpWithEmail(email, password, name);
      } else if (mode === 'reset') {
        await resetPassword(email);
        setMessage('E-mail de redefinição enviado!');
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-600 transition-colors" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/[0.05] rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-sky-600 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-600 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/[0.05] rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-sky-600 outline-none transition-all"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      className="text-[10px] font-bold text-sky-600 hover:text-sky-500 uppercase tracking-widest transition-colors"
                    >
                      Esqueceu?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-600 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/[0.05] rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-sky-600 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>
              </motion.div>
            )}

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-2 h-2 text-white" />
                </div>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{message}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl shadow-lg shadow-sky-600/20 flex items-center justify-center gap-3 transition-all active:scale-95 text-[10px] uppercase tracking-[0.2em]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Entrar no Sistema' : mode === 'signup' ? 'Criar minha conta' : 'Enviar instruções'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              {mode === 'login' ? (
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-sky-600 hover:text-sky-500 transition-colors"
                  >
                    Cadastre-se agora
                  </button>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-700 dark:hover:text-slate-300 mx-auto transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Voltar para o Login
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </AnimatePresence>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center px-2">
          <div className="w-full border-t border-slate-200 dark:border-white/[0.05]"></div>
        </div>
        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]">
          <span className="bg-white dark:bg-slate-900 px-4 text-slate-400">Ou continue com</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => loginWithGoogle()}
        className="w-full flex items-center justify-center gap-4 bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white font-black py-4 rounded-xl border border-slate-200 dark:border-white/[0.05] hover:bg-slate-200 dark:hover:bg-slate-800 transition-all active:scale-95 text-[10px] uppercase tracking-widest"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Conta Google
      </button>
    </div>
  );
}
