'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, UserPlus, Trash2, Mail, ShieldCheck, Loader2, ShieldAlert, Building2 } from 'lucide-react';
import { useUserRoles, useRolePermissions } from '@/lib/firestore-service';
import { WAREHOUSES } from '@/lib/constants';

export default function PermissionsTab() {
  const { roles, loading: rolesLoading, setRole, removeRole } = useUserRoles();
  const { roleConfigs, loading: permsLoading, updatePermission } = useRolePermissions();
  const [email, setEmail] = useState('');
  const [role, setRoleType] = useState<'ADMIN' | 'ANALYST' | 'TECHNICIAN'>('TECHNICIAN');
  const [warehouse, setWarehouse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    await setRole(email.toLowerCase().trim(), role, warehouse || null);
    setEmail('');
    setWarehouse('');
    setIsSubmitting(false);
  };

  const getPermissionStatus = (roleName: string, permKey: string) => {
    const config = roleConfigs.find(c => c.role === roleName);
    if (!roleName) return false;
    if (roleName === 'ADMIN' && (permKey !== 'managePermissions' && permKey !== 'deleteRecords')) return true;
    if (config) {
      return (config.permissions as any)[permKey] || false;
    }
    const defaults: any = {
      TECHNICIAN: { viewDashboard: true, registerWithdrawal: true, accessAnalystPanel: false, confirmTechnicalWithdrawal: false, viewGeneralHistory: true, managePermissions: false, deleteRecords: false, importData: false },
      ANALYST: { viewDashboard: true, registerWithdrawal: true, accessAnalystPanel: true, confirmTechnicalWithdrawal: true, viewGeneralHistory: true, managePermissions: false, deleteRecords: false, importData: true },
      ADMIN: { viewDashboard: true, registerWithdrawal: true, accessAnalystPanel: true, confirmTechnicalWithdrawal: true, viewGeneralHistory: true, managePermissions: true, deleteRecords: true, importData: true }
    };
    return defaults[roleName]?.[permKey] || false;
  };

  const togglePermission = async (roleName: string, permKey: string) => {
    const current = getPermissionStatus(roleName, permKey);
    await updatePermission(roleName, permKey, !current);
  };

  if (rolesLoading || permsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  const permissionRows = [
    { key: 'viewDashboard', label: 'DASHBOARD' },
    { key: 'registerWithdrawal', label: 'REGISTRO DE SUCATEAMENTO' },
    { key: 'accessAnalystPanel', label: 'PAINEL ANALISTA' },
    { key: 'viewGeneralHistory', label: 'HISTÓRICO GERAL' },
    { key: 'managePermissions', label: 'PERMISSÕES' },
    { key: 'confirmTechnicalWithdrawal', label: 'EFETUAR BAIXA TÉCNICA' },
    { key: 'deleteRecords', label: 'PRIVILÉGIO DE EXCLUSÃO' },
    { key: 'importData', label: 'IMPORTAÇÃO DE DADOS (CSV)' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-10 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 dark:border-white/[0.05] pb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-950 dark:text-white tracking-widest uppercase italic leading-none">
            PAINEL DE <span className="text-sky-600">SUCATEAMENTO</span>
          </h2>
          <div className="text-slate-400 dark:text-slate-500 text-[10px] font-mono font-bold uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-sky-600/40 rounded-full" />
            Terminal de Gestão de Acessos Operacionais
          </div>
        </div>
        <div className="hidden md:block">
          <div className="flex items-center gap-6 text-right">
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Status do Servidor</p>
              <p className="text-xs font-mono font-bold text-green-600 mt-1">OPERACIONAL ONLINE</p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-white/[0.05]" />
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Nodes Ativos</p>
              <p className="text-xs font-mono font-bold text-slate-900 dark:text-slate-300 mt-1">{roles.length} TERMINAIS</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Form Column */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 dark:opacity-[0.02] -translate-x-4 translate-y-4 group-hover:opacity-10 transition-all group-hover:scale-110">
              <Shield className="w-40 h-40" />
            </div>
            
            <h3 className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
              <div className="p-2.5 bg-sky-50 dark:bg-sky-500/10 rounded-xl border border-sky-100 dark:border-sky-500/20">
                <UserPlus className="w-4 h-4" />
              </div>
              Novo Credenciamento
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Endereço de Identificação (Email)</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600 group-focus-within:text-sky-600 transition-colors" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="id@corp.com.br"
                    className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-2xl px-12 py-4 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/5 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Nível de Protocolo (Role)</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                    <select 
                      value={role}
                      onChange={(e) => setRoleType(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-2xl px-12 py-4 text-xs font-mono text-slate-900 dark:text-white focus:border-sky-500/50 transition-all outline-none appearance-none cursor-pointer"
                    >
                      <option value="TECHNICIAN" className="bg-white dark:bg-slate-900">NÍVEL 1: TÉCNICO OPERACIONAL</option>
                      <option value="ANALYST" className="bg-white dark:bg-slate-900">NÍVEL 2: ANALISTA TÉCNICO</option>
                      <option value="ADMIN" className="bg-white dark:bg-slate-900">NÍVEL 3: ADMINISTRADOR MASTER</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Escopo de Operação (Jurisdição)</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                    <select 
                      value={warehouse}
                      onChange={(e) => setWarehouse(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-2xl px-12 py-4 text-xs font-mono text-slate-900 dark:text-white focus:border-sky-500/50 transition-all outline-none appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-white dark:bg-slate-900">ACESSO TOTAL (HQ GLOBAL)</option>
                      {WAREHOUSES.map(wh => (
                        <option key={wh} value={wh} className="bg-white dark:bg-slate-900">{wh}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-sky-600 text-white font-black text-[10px] uppercase tracking-[0.4em] rounded-2xl hover:bg-sky-500 transition-all disabled:opacity-50 shadow-xl shadow-sky-600/10 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Inicializar Credencial
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] p-8 rounded-[2rem] space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] px-1 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
              Hierarquia de Segurança
            </h4>
            <div className="space-y-5">
              {[
                { role: 'Nível 3 (Admin)', desc: 'Full Access: Gestão de Sistema e Auditoria Full.', status: 'text-red-500' },
                { role: 'Nível 2 (Analista)', desc: 'Intermediate Access: Verificação e Validação Técnica.', status: 'text-sky-600' },
                { role: 'Nível 1 (Técnico)', desc: 'Field Access: Entrada de Dados e Operação Local.', status: 'text-slate-400 dark:text-slate-500' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="w-px h-10 bg-slate-200 dark:bg-white/[0.05] group-hover:bg-sky-500/30 transition-colors" />
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${item.status}`}>{item.role}</p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold leading-tight mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[2rem] overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-200 dark:border-white/[0.05] flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
              <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.4em] flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Matriz de Terminais Autorizados
              </h3>
              <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.05] text-[9px] font-mono text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                Realtime Data
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/30 dark:bg-white/[0.01]">
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Identificador</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Protocolo</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Escopo Operacional</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Comandos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                  {roles.map((uRole) => (
                    <tr key={uRole.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-sky-600 border border-slate-200 dark:border-white/[0.05] transition-all">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            {uRole.displayName && (
                              <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-widest">{uRole.displayName}</span>
                            )}
                            <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 tracking-tight">{uRole.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black tracking-[0.2em] uppercase border ${
                          uRole.role === 'ADMIN' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20' :
                          uRole.role === 'ANALYST' ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-500/20' :
                          'bg-slate-50 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/[0.05]'
                        }`}>
                          {uRole.role}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {uRole.warehouse ? (
                          <div className="flex items-center gap-2 text-sky-600/60 dark:text-sky-400/60 uppercase text-[10px] font-black tracking-widest">
                            <div className="w-1.5 h-1.5 bg-sky-600/40 dark:bg-sky-400/40 rounded-full" />
                            {uRole.warehouse}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 uppercase text-[9px] font-black tracking-[0.2em] italic">
                            <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                            Global Access
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => removeRole(uRole.email)}
                          className="p-3 text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                          title="REVOKE ACCESS"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {roles.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-30">
                          <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">Nenhum protocolo ativo detectado no sistema.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[2rem] p-10 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 opacity-5 dark:opacity-[0.02] pointer-events-none">
              <ShieldCheck className="w-64 h-64" />
            </div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                  Permissões de Protocolo
                </h3>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-2">Mapeamento granular de Capabilities por Nível de Acesso</p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20">
                <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest">Configuração Ativa</span>
              </div>
            </div>

            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold uppercase tracking-widest">
                <thead className="border-b border-slate-100 dark:border-white/[0.05]">
                  <tr>
                    <th className="py-5 text-left text-slate-400 dark:text-slate-500">Recurso / Capability</th>
                    <th className="py-5 text-center px-6">Técnico</th>
                    <th className="py-5 text-center px-6">Analista</th>
                    <th className="py-5 text-center px-6 text-red-500/80">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/[0.02]">
                  {permissionRows.map((row) => (
                    <tr key={row.key} className="group hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="py-5 font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{row.label}</td>
                      <td className="py-5 text-center">
                        <div className="flex justify-center">
                          <button 
                            onClick={() => togglePermission('TECHNICIAN', row.key)}
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                              getPermissionStatus('TECHNICIAN', row.key) 
                              ? 'bg-sky-600 border-sky-600 shadow-lg shadow-sky-600/20' 
                              : 'border-slate-200 dark:border-white/[0.1] hover:border-slate-300 dark:hover:border-white/20 bg-slate-50 dark:bg-white/[0.02]'
                            }`}
                          >
                            {getPermissionStatus('TECHNICIAN', row.key) && <div className="w-1.5 h-1.5 bg-white rounded-sm rotate-45" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-5 text-center">
                        <div className="flex justify-center">
                          <button 
                            onClick={() => togglePermission('ANALYST', row.key)}
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                              getPermissionStatus('ANALYST', row.key) 
                              ? 'bg-sky-600 border-sky-600 shadow-lg shadow-sky-600/20' 
                              : 'border-slate-200 dark:border-white/[0.1] hover:border-slate-300 dark:hover:border-white/20 bg-slate-50 dark:bg-white/[0.02]'
                            }`}
                          >
                            {getPermissionStatus('ANALYST', row.key) && <div className="w-1.5 h-1.5 bg-white rounded-sm rotate-45" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-5 text-center">
                        <div className="flex justify-center">
                          <button 
                            onClick={() => togglePermission('ADMIN', row.key)}
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                              getPermissionStatus('ADMIN', row.key) 
                              ? 'bg-red-500 border-red-500 shadow-lg shadow-red-500/20' 
                              : 'border-slate-200 dark:border-white/[0.1] hover:border-slate-300 dark:hover:border-white/20 bg-slate-50 dark:bg-white/[0.02]'
                            }`}
                          >
                            {getPermissionStatus('ADMIN', row.key) && <div className="w-1.5 h-1.5 bg-white rounded-sm rotate-45" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-10 p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] flex items-center gap-4 relative z-10">
              <div className="p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/[0.05] rounded-xl">
                 <ShieldAlert className="w-4 h-4 text-slate-400 dark:text-slate-600" />
              </div>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black tracking-widest uppercase italic leading-tight">
                Aviso de Segurança: Qualquer alteração na matriz de permissões afeta instantaneamente a experiência de todos os terminais conectados. 
                Use com cautela em ambientes de produção.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
