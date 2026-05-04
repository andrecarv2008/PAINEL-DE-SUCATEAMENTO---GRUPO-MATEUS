'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, MoreVertical, ExternalLink, Archive, FileText, Download, ChevronRight, Eye, Check, Loader2, Trash2 } from 'lucide-react';

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
  renovadoraAttachment?: string | null;
  renovadoraData?: string | null;
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

  return (    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-12"
    >      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-black text-slate-950 dark:text-white tracking-widest uppercase italic leading-none mb-1">
            {title.split(' ')[0]}<span className="text-sky-600">{title.split(' ')[1] || ''}</span>
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Operational Ledger & Compliance Registry</p>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-lg text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.05] flex flex-col sm:flex-row gap-4 justify-between items-center">
           <div className="relative w-full sm:w-96 group flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 w-4 h-4 group-focus-within:text-sky-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="BUSCAR POR PLACA OU TÉCNICO..." 
                  className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-lg py-2 pl-10 pr-4 text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500/50 uppercase tracking-widest"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => {
                  console.log("Searching for:", searchTerm);
                }}
                className="px-4 py-2 bg-sky-600 border border-sky-500 rounded-lg text-[9px] font-black text-white uppercase tracking-widest hover:bg-sky-500 transition-all active:scale-95 shadow-lg shadow-sky-600/10"
              >
                Pesquisar
              </button>
           </div>
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Filtrar por:</span>
              <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-colors ${
                  filter === 'all' 
                    ? 'bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 text-sky-600' 
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.05] text-slate-500 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                Todos
              </button>
              <button 
                onClick={() => setFilter('confirmed')}
                className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-colors ${
                  filter === 'confirmed' 
                    ? 'bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 text-sky-600' 
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.05] text-slate-500 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                Baixas
              </button>
              <button 
                onClick={() => setFilter('pending')}
                className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-colors ${
                  filter === 'pending' 
                    ? 'bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 text-sky-600' 
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.05] text-slate-500 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                Auditoria
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-200 dark:border-white/[0.05]">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">IDENTIFICAÇÃO</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] hidden md:table-cell">PARÂMETROS</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">MOTIVO / TÉCNICO</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] hidden lg:table-cell">REGISTRO</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((record, i) => (
                  <motion.tr 
                    key={record.id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded flex items-center justify-center font-black text-[10px] text-slate-400 dark:text-slate-500 group-hover:border-sky-500/20 transition-colors italic">
                            {record.plate.slice(0, 3)}
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white tracking-widest uppercase">{record.plate}</p>
                            <p className="text-[9px] font-black text-sky-600/60 dark:text-sky-400/60 uppercase tracking-widest">{record.warehouse}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex gap-4">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase mb-0.5">DOT</span>
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-none">{record.dot}</span>
                         </div>
                         <div className="w-[1px] h-6 bg-slate-100 dark:bg-white/[0.05] self-center" />
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase mb-0.5">Vida</span>
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-none">{record.lifeCycle}ª</span>
                         </div>
                         <div className="w-[1px] h-6 bg-slate-100 dark:bg-white/[0.05] self-center" />
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase mb-0.5">Série</span>
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-none uppercase">{record.tireFogo}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 text-[8px] font-black uppercase rounded mb-1.5 border border-slate-200 dark:border-white/[0.05] group-hover:border-sky-500/20">
                            {record.reason}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Responsável: {record.technician}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-tighter tabular-nums">
                       {record.date} <br/> {record.time}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-3">
                          {isAnalystMode && record.id && (
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
                              title="Confirmar Sucateamento" 
                              className="group/confirm flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-600/10 active:scale-95"
                            >
                               {processingId === record.id ? (
                                 <Loader2 className="w-4 h-4 animate-spin" />
                               ) : (
                                 <Check className="w-4 h-4 stroke-[3]" />
                               )}
                               <span>{processingId === record.id ? 'Processando...' : 'Confirmar'}</span>
                            </button>
                          )}
                          <button 
                            title="Ver Detalhes" 
                            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.05] rounded-lg text-slate-400 dark:text-slate-500 hover:border-sky-500/50 dark:hover:border-sky-500 hover:text-sky-600 transition-all group/eye shadow-sm"
                          >
                             <Eye className="w-4 h-4 transition-transform group-hover/eye:scale-110" />
                          </button>
                          <button className="p-2 text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white transition-colors">
                             <MoreVertical className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                   <td colSpan={5} className="py-20 text-center">
                      <div className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] rounded-full flex items-center justify-center text-slate-200 dark:text-slate-800">
                          <Archive className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-slate-400 dark:text-slate-500 font-black uppercase text-xs tracking-[0.2em]">Zero Protocols Logged</p>
                          <p className="text-slate-300 dark:text-slate-700 text-[10px] uppercase font-bold">Initiate a fleet withdrawal to populate this ledger.</p>
                        </div>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-xl">
         <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Showing {history.length} registries</p>
         <div className="flex gap-2">
            <button className="p-1 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase disabled:opacity-30" disabled>Previous</button>
            <button className="p-1 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm">Next</button>
         </div>
      </div>
    </motion.div>
  );
}
