'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, MoreVertical, ExternalLink, Archive, FileText, Download, ChevronRight, Eye, Check, Loader2, Trash2, TrendingUp, AlertCircle, CheckCircle2, ListFilter, Calendar } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

interface HistoryItem {
  id?: string;
  plate: string;
  warehouse: string;
  reason: string;
  technician: string;
  date: string;
  time: string;
  attachment?: string | null;
  attachmentData?: string | null;
  attachmentBorracharia?: string | null;
  attachmentDataBorracharia?: string | null;
  status?: 'pending' | 'confirmed';
  dot: string;
  tireFogo: string;
  lifeCycle: string;
  removalDate?: string;
}

interface HistoryTabProps {
  history: HistoryItem[];
  title?: string;
  isAnalystMode?: boolean;
  onConfirmed?: () => void;
  onConfirmAction?: (id: string) => Promise<void>;
  onDeleteAction?: (id: string) => Promise<void>;
  canDelete?: boolean;
}

export default function HistoryTab({ 
  history, 
  title = "HISTÓRICO", 
  isAnalystMode = false, 
  onConfirmed, 
  onConfirmAction,
  onDeleteAction,
  canDelete = false
}: HistoryTabProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredHistory = history.filter(record => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = record.plate.toLowerCase().includes(term) || 
                         record.technician.toLowerCase().includes(term);
    const matchesFilter = filter === 'all' ? true : record.status === filter;
    return matchesSearch && matchesFilter;
  });

  // KPI Calculations
  const stats = {
    total: history.length,
    pending: history.filter(h => h.status === 'pending').length,
    confirmed: history.filter(h => h.status === 'confirmed').length,
    efficiency: history.length > 0 ? Math.round((history.filter(h => h.status === 'confirmed').length / history.length) * 100) : 0
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-2">
            {title.split(' ')[0]} <span className="text-sky-600">{title.split(' ')[1] || ''}</span>
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Gestão Analítica de Ativos e Conformidade</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.05] rounded-xl text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-all active:scale-95 shadow-sm">
            <Download className="w-3.5 h-3.5" />
            Exportar Dataset
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Registros', value: stats.total, icon: TrendingUp, color: 'sky' },
          { label: 'Pendentes Auditoria', value: stats.pending, icon: AlertCircle, color: 'amber' },
          { label: 'Baixas Confirmadas', value: stats.confirmed, icon: CheckCircle2, color: 'green' },
          { label: 'Taxa Eficiência', value: `${stats.efficiency}%`, icon: Filter, color: 'indigo' },
        ].map((kpi, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[1.5rem] shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform`}>
              <kpi.icon className="w-full h-full" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{kpi.value}</p>
              </div>
              <div className={`p-2.5 bg-${kpi.color}-50 dark:bg-${kpi.color}-500/10 rounded-xl border border-${kpi.color}-100 dark:border-${kpi.color}-500/20 shadow-inner`}>
                <kpi.icon className={`w-5 h-5 text-${kpi.color}-600 dark:text-${kpi.color}-400`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar Section */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between p-2 bg-slate-100/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-[1.5rem] backdrop-blur-sm">
        <div className="relative w-full lg:w-[450px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 w-4 h-4 group-focus-within:text-sky-500 transition-colors" />
          <input 
            type="text" 
            placeholder="PESQUISAR POR ATIVO OU RESPONSÁVEL..." 
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[1.2rem] py-3.5 pl-12 pr-4 text-[10px] font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 uppercase tracking-[0.1em] placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[1.2rem] shadow-inner">
          {[
            { id: 'all', label: 'Todos', icon: ListFilter },
            { id: 'pending', label: 'Auditoria', icon: AlertCircle },
            { id: 'confirmed', label: 'Finalizado', icon: CheckCircle2 },
          ].map((btn) => (
            <button 
              key={btn.id}
              onClick={() => setFilter(btn.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                filter === btn.id 
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' 
                  : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.03]'
              }`}
            >
              <btn.icon className="w-3.5 h-3.5" />
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.05]">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Fluxo Operacional</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] hidden md:table-cell">Parâmetros Técnicos</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Contexto / Origem</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] hidden lg:table-cell">Timeline</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">Controle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/[0.02]">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((record, i) => (
                  <motion.tr 
                    key={record.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-slate-50/50 dark:hover:bg-sky-500/[0.03] transition-all group cursor-default"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-white/[0.05] rounded-2x flex items-center justify-center font-black text-[10px] text-slate-900 dark:text-white group-hover:border-sky-500/50 group-hover:scale-105 transition-all italic shadow-sm`}>
                            {record.plate.slice(0, 3)}
                         </div>
                         <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-black text-slate-900 dark:text-white tracking-widest uppercase">{record.plate}</p>
                              {record.status === 'confirmed' ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              )}
                            </div>
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">{record.warehouse}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 hidden md:table-cell">
                      <div className="flex gap-6">
                         <div className="flex flex-col min-w-[60px]">
                            <span className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase mb-1 tracking-widest leading-none">CODE DOT</span>
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 font-mono italic">{record.dot}</span>
                         </div>
                         <div className="flex flex-col min-w-[60px]">
                            <span className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase mb-1 tracking-widest leading-none">LIFE CYCLE</span>
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">{record.lifeCycle}ª VIDA</span>
                         </div>
                         <div className="flex flex-col min-w-[60px]">
                            <span className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase mb-1 tracking-widest leading-none">FIRE ID</span>
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">{record.tireFogo}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col gap-1.5">
                          <span className={`inline-flex items-center w-fit px-2.5 py-1 ${record.status === 'confirmed' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20 shadow-inner' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 shadow-inner'} text-[8px] font-black uppercase rounded-lg border tracking-widest`}>
                            {record.reason}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                            {record.technician}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6 hidden lg:table-cell">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <Calendar className="w-3 h-3 text-slate-300 dark:text-slate-700" />
                             <span className="text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-tighter tabular-nums">{record.date}</span>
                          </div>
                          <span className="text-slate-400 dark:text-slate-600 text-[9px] font-bold uppercase tracking-widest italic ml-5">{record.time}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2.5">
                          {isAnalystMode && record.id && record.status !== 'confirmed' && (
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!onConfirmAction) return;
                                try {
                                  setProcessingId(record.id!);
                                  await onConfirmAction(record.id!);
                                  if (onConfirmed) onConfirmed();
                                } catch (err) {
                                  console.error("Confirmation failed:", err);
                                  alert("Falha ao confirmar. Verifique sua conexão.");
                                } finally {
                                  setProcessingId(null);
                                }
                              }}
                              disabled={processingId === record.id}
                              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-green-500 disabled:opacity-50 transition-all shadow-xl shadow-green-600/20 active:scale-95 border-b-[3px] border-green-700"
                            >
                               {processingId === record.id ? (
                                 <Loader2 className="w-3.5 h-3.5 animate-spin" />
                               ) : (
                                 <Check className="w-3.5 h-3.5 stroke-[3]" />
                               )}
                               <span>{processingId === record.id ? 'Sincronizando...' : 'Confirmar'}</span>
                            </button>
                          )}
                          
                          <div className="flex items-center gap-2">
                            {record.attachment && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (record.attachmentData) {
                                    const link = document.createElement('a');
                                    link.href = record.attachmentData;
                                    link.download = record.attachment || 'laudo_renovadora.pdf';
                                    link.click();
                                  } else {
                                    alert('Este registro não possui laudo da renovadora digitalizado.');
                                  }
                                }}
                                title="Laudo Renovadora"
                                className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all group/pdf shadow-sm"
                              >
                                <FileText className="w-3.5 h-3.5 transition-transform group-hover/pdf:scale-110" />
                              </button>
                            )}

                            {record.attachmentBorracharia && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (record.attachmentDataBorracharia) {
                                      const link = document.createElement('a');
                                      link.href = record.attachmentDataBorracharia;
                                      link.download = record.attachmentBorracharia || 'laudo_borracharia.pdf';
                                      link.click();
                                    } else {
                                      alert('Este registro não possui laudo da borracharia digitalizado.');
                                    }
                                  }}
                                  title="Laudo Borracharia"
                                  className="p-2.5 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition-all group/pdf shadow-sm"
                                >
                                  <FileText className="w-3.5 h-3.5 transition-transform group-hover/pdf:scale-110" />
                                </button>
                              )}
                          </div>

                          <div className="relative group/more">
                             <button className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/[0.1] rounded-xl text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
                                <MoreVertical className="w-4 h-4" />
                             </button>
                             
                             <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-2xl opacity-0 invisible group-hover/more:opacity-100 group-hover/more:visible transition-all z-20 overflow-hidden ring-4 ring-slate-100 dark:ring-white/[0.02]">
                                <button className="w-full text-left px-5 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.05] flex items-center gap-3 transition-colors">
                                  <Eye className="w-4 h-4 text-sky-500" /> Ver Detalhes
                                </button>
                                {canDelete && record.id && (
                                  <button 
                                    onClick={() => setConfirmDeleteId(record.id!)}
                                    className="w-full text-left px-5 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 border-t border-slate-100 dark:border-white/[0.05] transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" /> Excluir Ativo
                                  </button>
                                )}
                             </div>
                          </div>
                       </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                   <td colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-white/[0.02] border-2 border-dashed border-slate-200 dark:border-white/[0.05] rounded-[3rem] flex items-center justify-center text-slate-200 dark:text-slate-800">
                          <Archive className="w-12 h-12" />
                        </div>
                        <div className="max-w-xs mx-auto space-y-2">
                          <p className="text-slate-900 dark:text-white font-black uppercase text-base tracking-tighter italic">Nenhum Ativo Encontrado</p>
                          <p className="text-slate-400 dark:text-slate-600 text-[9px] uppercase font-bold leading-relaxed tracking-widest">O dataset atual não retornou resultados para os filtros selecionados no ledger operacional.</p>
                        </div>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer / Pagination Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-8 py-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[2rem] shadow-sm">
         <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-sky-50 dark:bg-sky-500/10 rounded-full border border-sky-100 dark:border-sky-500/20">
               <p className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest leading-none mt-0.5">Dataset: Ativo</p>
            </div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Exibindo <span className="text-slate-900 dark:text-white">{filteredHistory.length}</span> de <span className="text-slate-900 dark:text-white">{history.length}</span> registros</p>
         </div>
         <div className="flex items-center gap-3">
            <button className="p-2.5 px-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-xl text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase cursor-not-allowed transition-all">Anterior</button>
            <button className="p-2.5 px-6 bg-slate-900 dark:bg-white border border-slate-950 dark:border-white text-[9px] font-black text-white dark:text-slate-950 uppercase hover:opacity-90 transition-all shadow-lg active:scale-95">Próximo</button>
         </div>
      </div>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/20 rounded-[3rem] p-10 text-center shadow-2xl ring-8 ring-red-500/5"
            >
              <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Trash2 className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-3 leading-none">Eliminar Registro?</h3>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-10 uppercase tracking-[0.2em] leading-relaxed">Esta ação é crítica e removerá permanentemente os dados do ledger operacional, afetando a integridade do histórico.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="py-5 bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase rounded-2xl hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    if (!onDeleteAction) return;
                    try {
                      setDeletingId(confirmDeleteId);
                      await onDeleteAction(confirmDeleteId);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setConfirmDeleteId(null);
                      setDeletingId(null);
                    }
                  }}
                  disabled={!!deletingId}
                  className="py-5 bg-red-600 text-white font-black text-[10px] uppercase rounded-2xl hover:bg-red-500 transition-all shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 border-b-4 border-red-800"
                >
                  {deletingId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
