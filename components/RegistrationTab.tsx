'use client';

import { useState, useEffect } from 'react';
import { Truck, MapPin, AlertCircle, User as UserIcon, Clock, CheckCircle2, ClipboardIcon, FileText, Upload, X, ArrowUpRight, Archive, History, ShieldCheck, Building2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { WAREHOUSES } from '@/lib/constants';

interface RegistrationFormProps {
  onSuccess: (data: any) => void;
  onTabChange: (tab: any) => void;
}

export default function RegistrationTab({ onSuccess, onTabChange }: RegistrationFormProps) {
  const { user, warehouse: userWarehouse } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 8).toUpperCase());
  const [formData, setFormData] = useState({
    plate: '',
    warehouse: '',
    reason: '',
    technician: '',
    dot: '',
    tireFogo: '',
    lifeCycle: '',
    removalDate: '',
  });

  const [plateError, setPlateError] = useState(false);
  const [plateTouched, setPlateTouched] = useState(false);

  const validatePlate = (value: string) => {
    // Brazilian plate pattern: AAA-0000
    const regex = /^[A-Z]{3}-[0-9]{4}$/;
    return regex.test(value);
  };

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    
    // Auto-format: Add hyphen if missing (e.g., ABC1234 -> ABC-1234)
    if (value.length === 3 && !value.includes('-')) {
      // Just keep typing
    } else if (value.length > 3 && value[3] !== '-') {
      value = value.slice(0, 3) + '-' + value.slice(3);
    }

    // Limit length
    if (value.length > 8) value = value.slice(0, 8);

    setFormData({ ...formData, plate: value });
    setPlateTouched(true);
    setPlateError(!validatePlate(value));
  };

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (userWarehouse) {
      const timer = setTimeout(() => {
        setFormData(prev => ({ ...prev, warehouse: userWarehouse }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [userWarehouse]);

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);
  
  const [renovadoraFile, setRenovadoraFile] = useState<File | null>(null);
  const [renovadoraData, setRenovadoraData] = useState<string | null>(null);

  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'laudo' | 'renovadora') => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
       if (file.size > 3 * 1024 * 1024) {
         alert('Arquivo muito grande. Limite de 3MB permitido.');
         return;
       }
       
       const reader = new FileReader();
       reader.onloadend = () => {
         if (type === 'laudo') {
           setAttachedFile(file);
           setFileData(reader.result as string);
         } else {
           setRenovadoraFile(file);
           setRenovadoraData(reader.result as string);
         }
       };
       reader.readAsDataURL(file);
    } else if (file) {
       alert('Por favor, selecione apenas arquivos PDF.');
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const { storage } = await import('../lib/firebase');
    const storageRef = ref(storage, `attachments/${Date.now()}_${path}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
    
    setIsUploading(true);
    try {
      let finalLaudoURL = fileData;
      let finalRenovadoraURL = renovadoraData;

      // Upload to storage if files are large or to avoid Firestore limit
      // Base64 encoding adds ~33% overhead, so a 800KB file becomes ~1.1MB
      if (attachedFile && attachedFile.size > 500 * 1024) {
        finalLaudoURL = await uploadFile(attachedFile, 'laudo');
      }
      
      if (renovadoraFile && renovadoraFile.size > 500 * 1024) {
        finalRenovadoraURL = await uploadFile(renovadoraFile, 'renovadora');
      }

      onSuccess({
        ...formData,
        date: new Date().toLocaleDateString('pt-BR'),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        attachment: attachedFile ? attachedFile.name : null,
        attachmentData: finalLaudoURL,
        renovadoraAttachment: renovadoraFile ? renovadoraFile.name : null,
        renovadoraData: finalRenovadoraURL,
        userEmail: user?.email || 'Sistema',
      });
      setIsSuccess(true);
    } catch (error) {
      console.error("Erro ao processar anexos:", error);
      alert("Erro ao enviar arquivos de laudo. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };;

  const handleNewRegistration = () => {
    setFormData({ plate: '', warehouse: '', reason: '', technician: '', dot: '', tireFogo: '', lifeCycle: '', removalDate: '' });
    setAttachedFile(null);
    setFileData(null);
    setRenovadoraFile(null);
    setRenovadoraData(null);
    setIsSuccess(false);
  };
  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto py-12"
      >
        <div className="bg-white dark:bg-slate-900 border border-green-200 dark:border-green-500/20 rounded-[2.5rem] p-12 text-center relative overflow-hidden shadow-xl transition-colors duration-300">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
          
          <div className="w-24 h-24 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          
          <h2 className="text-4xl font-black text-slate-950 dark:text-white uppercase italic tracking-tighter leading-none">
            BAIXA <span className="text-green-600">EFETUADA</span>
          </h2>
          <p className="text-slate-400 dark:text-slate-500 font-mono font-bold uppercase text-[10px] tracking-[0.4em] mt-4">Protocolo de Registro Sincronizado</p>

          <div className="mt-12 max-w-md mx-auto bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-3xl p-8 text-left space-y-6 shadow-sm">
             <div className="flex justify-between items-end border-b border-slate-200 dark:border-white/[0.05] pb-4">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ativo de Frota</span>
                <span className="text-lg font-mono font-black text-slate-900 dark:text-white uppercase">{formData.plate}</span>
             </div>
             <div className="grid grid-cols-2 gap-8 border-b border-slate-200 dark:border-white/[0.05] pb-6">
                <div>
                   <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Unidade Operacional</span>
                   <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 uppercase">{formData.warehouse}</span>
                </div>
                <div className="text-right">
                   <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Audit ID</span>
                   <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-600 uppercase">#{sessionId}</span>
                </div>
             </div>
             <div className="flex justify-between items-center bg-green-50 dark:bg-green-500/10 p-4 rounded-xl border border-green-100 dark:border-green-500/20">
                <span className="text-[9px] font-black text-green-600/60 dark:text-green-400/60 uppercase tracking-widest">Status de Sincronia</span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-green-600 dark:text-green-400 uppercase">CONFIRMADO</span>
                </div>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
             {fileData && (
                <button 
                 onClick={() => {
                   const link = document.createElement('a');
                   link.href = fileData;
                   link.download = attachedFile?.name || 'laudo.pdf';
                   link.click();
                 }}
                 className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.05] text-slate-600 dark:text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-3 active:scale-95 shadow-sm"
                >
                  <Upload className="w-4 h-4 rotate-180" />
                  Laudo Técnico
                </button>
             )}
             {renovadoraData && (
                <button 
                 onClick={() => {
                   const link = document.createElement('a');
                   link.href = renovadoraData;
                   link.download = renovadoraFile?.name || 'laudo_renovadora.pdf';
                   link.click();
                 }}
                 className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.05] text-slate-600 dark:text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-3 active:scale-95 shadow-sm"
                >
                  <Upload className="w-4 h-4 rotate-180" />
                  Laudo Renovadora
                </button>
             )}
             <button 
              onClick={handleNewRegistration}
              className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.05] text-slate-600 dark:text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-3 active:scale-95 shadow-sm"
             >
               <Archive className="w-4 h-4" />
               Novo Registro
             </button>
             <button 
              onClick={() => onTabChange('analyst')}
              className="px-8 py-4 bg-sky-600 text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl hover:bg-sky-500 transition-all shadow-xl shadow-sky-600/10 flex items-center gap-3 active:scale-95"
             >
               <History className="w-4 h-4" />
               Painel Geral
             </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-12 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 dark:border-white/[0.05] pb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-950 dark:text-white tracking-widest uppercase italic leading-none">
            PAINEL DE <span className="text-sky-600">SUCATEAMENTO</span>
          </h2>
          <div className="text-slate-400 dark:text-slate-500 text-[10px] font-mono font-bold uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-sky-600/40 rounded-full" />
            Protocolo de Registro de Sucateamento Técnico
          </div>
        </div>
        <div className="hidden md:block">
          <div className="flex items-center gap-6 text-right">
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Session ID</p>
              <p className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 mt-1 uppercase">{sessionId}</p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-white/[0.05]" />
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Status</p>
              <p className="text-xs font-mono font-bold text-slate-900 dark:text-slate-300 mt-1 uppercase">Pronto para Login</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] dark:opacity-[0.01] pointer-events-none group-hover:scale-110 transition-transform">
               <Truck className="w-48 h-48" />
            </div>
            
            <form onSubmit={handleSubmit} className="relative z-10 space-y-12">
              {/* identification Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <h3 className="text-[10px] font-black text-slate-950 dark:text-white uppercase tracking-[0.3em] flex items-center gap-3">
                    <div className="p-2 bg-sky-50 dark:bg-sky-500/10 rounded-xl border border-sky-100 dark:border-sky-500/20">
                      <Truck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    Identificação de Ativo
                  </h3>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Placa de Identificação</label>
                        {plateTouched && (
                          <span className={`text-[8px] font-black uppercase tracking-widest ${plateError ? 'text-red-500' : 'text-green-500'}`}>
                            {plateError ? 'Padrão Inválido (AAA-0000)' : 'Padrão Identificado'}
                          </span>
                        )}
                      </div>
                      <input 
                        className={`w-full bg-slate-50 dark:bg-white/[0.02] border ${plateTouched ? (plateError ? 'border-red-500/50' : 'border-green-500/50') : 'border-slate-200 dark:border-white/[0.05]'} focus:border-sky-500/50 rounded-2xl p-4 text-2xl font-mono font-black text-slate-900 dark:text-white uppercase tracking-widest transition-all placeholder:text-slate-200 dark:placeholder:text-slate-800 focus:ring-4 focus:ring-sky-500/5 outline-none`} 
                        placeholder="AAA-0000"
                        required
                        value={formData.plate}
                        onChange={handlePlateChange}
                        onBlur={() => setPlateTouched(true)}
                      />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest px-1">Jurisdição Operacional (CD)</label>
                       <div className="relative group">
                          <Building2 className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${userWarehouse ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-600 group-focus-within:text-sky-600'} transition-colors`} />
                          <select 
                            className={`w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] focus:border-sky-500/50 rounded-2xl pl-12 pr-12 py-4 text-xs font-mono font-bold appearance-none cursor-pointer transition-all outline-none ${userWarehouse ? 'text-sky-600 border-sky-500/30' : 'text-slate-900 dark:text-white'}`}
                            required
                            value={formData.warehouse}
                            onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                            disabled={!!userWarehouse}
                          >
                            <option value="" className="bg-white dark:bg-slate-900">SELECIONE A UNIDADE</option>
                            {WAREHOUSES.map(wh => (
                              <option key={wh} value={wh} className="bg-white dark:bg-slate-900">{wh}</option>
                            ))}
                          </select>
                          {!userWarehouse && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                              <ArrowUpRight className="w-3.5 h-3.5 text-slate-900 dark:text-white rotate-90" />
                            </div>
                          )}
                       </div>
                       {userWarehouse && (
                         <div className="flex items-center gap-2 mt-2 px-1">
                            <ShieldCheck className="w-3 h-3 text-sky-600/60 dark:text-sky-400/60" />
                            <p className="text-[9px] text-sky-600/60 dark:text-sky-400/60 font-black uppercase tracking-widest italic leading-none">Acesso travado por protocolo de segurança</p>
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-[10px] font-black text-slate-950 dark:text-white uppercase tracking-[0.3em] flex items-center gap-3">
                    <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-100 dark:border-purple-500/20">
                      <ClipboardIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    Configuração Técnica
                  </h3>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest px-1">Code DOT</label>
                      <input 
                        className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] focus:border-purple-500/50 rounded-2xl p-4 text-sm font-mono font-bold text-slate-900 dark:text-white uppercase outline-none transition-all" 
                        placeholder="0000"
                        required
                        value={formData.dot}
                        onChange={(e) => setFormData({ ...formData, dot: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest px-1">Nº Vidas</label>
                      <input 
                        className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] focus:border-purple-500/50 rounded-2xl p-4 text-sm font-mono font-bold text-slate-900 dark:text-white outline-none transition-all" 
                        placeholder="0"
                        required
                        value={formData.lifeCycle}
                        onChange={(e) => setFormData({ ...formData, lifeCycle: e.target.value })}
                        type="number"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest px-1">Identificador Fogo (Série)</label>
                    <input 
                      className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] focus:border-purple-500/50 rounded-2xl p-4 text-sm font-mono font-bold text-slate-900 dark:text-white uppercase tracking-widest outline-none transition-all" 
                      placeholder="SÉRIE-00000"
                      required
                      value={formData.tireFogo}
                      onChange={(e) => setFormData({ ...formData, tireFogo: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* operational Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-slate-200 dark:border-white/[0.05]">
                 <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2 flex flex-col">
                        <label className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest px-1 min-h-[24px] flex items-end">Causa Raiz da Reclassificação</label>
                        <input 
                          className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] focus:border-sky-500/50 rounded-2xl p-4 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase outline-none transition-all" 
                          placeholder="MOTIVO TÉCNICO"
                          required
                          value={formData.reason}
                          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 flex flex-col">
                         <label className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest px-1 min-h-[24px] flex items-end">Data de Desinstalação</label>
                         <input 
                          type="date"
                          className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] focus:border-sky-500/50 rounded-2xl p-4 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none transition-all uppercase"
                          required
                          value={formData.removalDate}
                          onChange={(e) => setFormData({ ...formData, removalDate: e.target.value })}
                         />
                      </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest px-1">Identificação Operacional (Técnico)</label>
                       <div className="relative group">
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600 group-focus-within:text-sky-600 transition-all" />
                          <input 
                            className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] pl-12 pr-4 py-4 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-800 outline-none transition-all" 
                            placeholder="NOME COMPLETO"
                            required
                            value={formData.technician}
                            onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                          />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest px-1">Documentação Digital (Laudo PDF)</label>
                        <div 
                          className={`relative flex flex-col items-center justify-center bg-slate-50 dark:bg-white/[0.02] border-2 border-dashed rounded-3xl p-4 min-h-[120px] transition-all duration-500 group ${
                            attachedFile ? 'border-sky-500/50 bg-sky-50 dark:bg-sky-500/10' : 'border-slate-200 dark:border-white/[0.1] hover:border-sky-300 dark:hover:border-sky-500/40'
                          }`}
                        >
                          <input 
                            type="file" 
                            accept=".pdf" 
                            onChange={(e) => handleFileChange(e, 'laudo')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          
                          {!attachedFile ? (
                            <div className="text-center pointer-events-none">
                              <Upload className="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition-colors mx-auto mb-2" />
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">Injetar Laudo Técnico</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 w-full bg-white dark:bg-slate-800 p-3 rounded-xl border border-sky-100 dark:border-sky-500/20 relative z-20">
                              <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                              <p className="text-[10px] font-mono font-bold text-slate-900 dark:text-white truncate uppercase flex-1">{attachedFile.name}</p>
                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); setAttachedFile(null); }}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest px-1">Laudo da Renovadora (Opcional)</label>
                        <div 
                          className={`relative flex flex-col items-center justify-center bg-slate-50 dark:bg-white/[0.02] border-2 border-dashed rounded-3xl p-4 min-h-[120px] transition-all duration-500 group ${
                            renovadoraFile ? 'border-purple-500/50 bg-purple-50 dark:bg-purple-500/10' : 'border-slate-200 dark:border-white/[0.1] hover:border-purple-300 dark:hover:border-purple-500/40'
                          }`}
                        >
                          <input 
                            type="file" 
                            accept=".pdf" 
                            onChange={(e) => handleFileChange(e, 'renovadora')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          
                          {!renovadoraFile ? (
                            <div className="text-center pointer-events-none">
                              <Upload className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors mx-auto mb-2" />
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">Injetar Laudo Renovadora</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 w-full bg-white dark:bg-slate-800 p-3 rounded-xl border border-purple-100 dark:border-purple-500/20 relative z-20">
                              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                              <p className="text-[10px] font-mono font-bold text-slate-900 dark:text-white truncate uppercase flex-1">{renovadoraFile.name}</p>
                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); setRenovadoraFile(null); }}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                    </div>
                 </div>
              </div>

              {/* finalize Container */}
              <div className="pt-12 border-t border-slate-200 dark:border-white/[0.05] flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex items-center gap-6 px-6 py-3 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-200 dark:border-white/[0.05]">
                   <div className="flex flex-col">
                      <span className="text-[8px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest leading-none">Registrar Stamp</span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-bold mt-1.5 opacity-80">
                         {mounted ? `${new Date().toLocaleDateString('pt-BR')} T ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '--/--/---- T --:--'}
                      </span>
                   </div>
                   <div className="w-px h-8 bg-slate-200 dark:bg-white/[0.05]" />
                   <div className="flex flex-col">
                      <span className="text-[8px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest leading-none">Protocol Node</span>
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-mono font-bold mt-1.5 flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                        ENCRYPTED LINK
                      </span>
                   </div>
                </div>

                <button 
                  type="submit"
                  disabled={plateError || isUploading}
                  className={`group relative px-16 py-5 ${plateError || isUploading ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed border-slate-200' : 'bg-slate-950 dark:bg-sky-600 border-slate-800 dark:border-sky-700 hover:bg-slate-900 dark:hover:bg-sky-500 hover:translate-y-[-2px]'} text-white font-black text-xs uppercase tracking-[0.4em] rounded-2xl transition-all shadow-2xl ${!plateError && !isUploading && 'hover:shadow-slate-900/20 dark:hover:shadow-sky-600/20'} active:scale-95 flex items-center gap-4 border-b-4`}
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Transmitindo...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Transmitir Dados
                      {!plateError && <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-8 space-y-8 shadow-sm transition-colors duration-300">
            <h3 className="text-[10px] font-black text-slate-950 dark:text-white uppercase tracking-[0.4em] flex items-center gap-3">
              <div className="p-2.5 bg-sky-50 dark:bg-sky-500/10 rounded-xl border border-sky-100 dark:border-sky-500/20">
                <AlertCircle className="w-5 h-5 text-sky-600" />
              </div>
              Protocolo Operacional
            </h3>
            
            <div className="space-y-6">
              {[
                { t: 'Validação Estrutural', d: 'Conferir se o DOT corresponde fisicamente ao pneu antes da transmissão.', c: 'text-sky-600' },
                { t: 'Evidência Técnica', d: 'O laudo PDF deve conter assinaturas e descrição clara da avaria detectada.', c: 'text-purple-600' },
                { t: 'Integridade de Dados', d: 'A placa deve seguir o padrão oficial para indexação correta no banco geral.', c: 'text-slate-400' }
              ].map((rule, idx) => (
                <div key={idx} className="relative group">
                  <div className="flex gap-5">
                    <div className="flex flex-col items-center">
                       <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] flex items-center justify-center text-xs font-mono font-black text-slate-400 dark:text-slate-500 group-hover:text-sky-600 transition-colors">
                          {idx + 1}
                       </div>
                       {idx !== 2 && <div className="w-px h-full bg-slate-100 dark:bg-white/[0.05] mt-2 group-hover:bg-sky-100 transition-colors" />}
                    </div>
                    <div className="pb-8">
                      <p className="text-[10px] font-black text-slate-950 dark:text-white uppercase tracking-widest">{rule.t}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed mt-2 uppercase font-bold">{rule.d}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-slate-100 dark:border-white/[0.05] space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">SLA de Aprovação</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Aprovação técnica estimada em <span className="text-sky-600 dark:text-sky-400">2h úteis</span> após o registro.</p>
            </div>
          </div>

          <div className="relative h-64 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-white/[0.05] group shadow-sm">
             <Image 
              src="https://picsum.photos/seed/logistic-yard/800/800"
              alt="Fleet Yard"
              fill
              className="object-cover opacity-60 grayscale group-hover:scale-110 transition-transform duration-1000"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
               <div className="flex items-center gap-3 mb-3">
                  <div className="w-1 h-3 bg-sky-500" />
                  <span className="text-[10px] font-black text-slate-950 dark:text-white uppercase tracking-[0.3em]">Fleet Management Insight</span>
               </div>
               <p className="text-slate-600 dark:text-slate-400 font-bold text-[11px] leading-relaxed italic uppercase tracking-wider">
                 &quot;Controle de carcaças é o pilar da economia operacional de frotas pesadas.&quot;
               </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
