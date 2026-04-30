'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, X, Download, Image as ImageIcon, Save } from 'lucide-react';
import Papa from 'papaparse';
import { useRegistrations, useSettings } from '@/lib/firestore-service';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

export default function ImportTab() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; error: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { addRegistration } = useRegistrations();
  const { settings, updateLogo } = useSettings();
  const [newLogo, setNewLogo] = useState<string | null>(null);
  const [savingLogo, setSavingLogo] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setErrorMsg('Por favor, selecione um arquivo CSV válido.');
        return;
      }
      setFile(selectedFile);
      setErrorMsg(null);
      parseFile(selectedFile);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setErrorMsg('Por favor, selecione um arquivo de imagem válido.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewLogo(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSaveLogo = async () => {
    if (!newLogo) return;
    setSavingLogo(true);
    try {
      await updateLogo(newLogo);
      setNewLogo(null);
      setErrorMsg(null);
    } catch (error) {
      setErrorMsg('Erro ao salvar o logotipo.');
    } finally {
      setSavingLogo(false);
    }
  };

  const parseFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data.slice(0, 5));
        if (results.data.length === 0) {
          setErrorMsg('O arquivo está vazio.');
        }
      },
      error: (error) => {
        setErrorMsg('Erro ao ler o arquivo: ' + error.message);
      }
    });
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let successCount = 0;
        let errorCount = 0;

        for (const row of results.data as any[]) {
          try {
            // Mapping expected fields (translate if necessary or assume specific headers)
            // Expected headers: plate, warehouse, reason, technician, dot, tireFogo, lifeCycle, date, time
            const data = {
              plate: row.plate || row.Placa || '',
              warehouse: row.warehouse || row.Filial || '',
              reason: row.reason || row.Motivo || '',
              technician: row.technician || row.Tecnico || '',
              dot: row.dot || row.DOT || '',
              tireFogo: row.tireFogo || row.TireFogo || '',
              lifeCycle: row.lifeCycle || row.Vida || '',
              date: row.date || row.Data || new Date().toISOString().split('T')[0],
              time: row.time || row.Hora || new Date().toTimeString().split(' ')[0].slice(0, 5),
            };

            if (data.plate && data.warehouse) {
              await addRegistration(data);
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            console.error('Import error row:', error);
            errorCount++;
          }
        }

        setResults({ success: successCount, error: errorCount });
        setImporting(false);
        setFile(null);
        setPreview([]);
      }
    });
  };

  const downloadTemplate = () => {
    const headers = ['plate', 'warehouse', 'reason', 'technician', 'dot', 'tireFogo', 'lifeCycle', 'date', 'time'];
    const csvContent = headers.join(',') + '\nABC-1234,SÃO LUÍS,DESGASTE,JOÃO SILVA,1223,8899,1,2024-04-30,12:00';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_importacao_sucateamento.csv');
    link.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-2">
            Importação <span className="text-sky-600">Massiva</span>
          </h2>
          <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">Processamento de dados via CSV para escala industrial</p>
        </div>

        <button 
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-400 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all border border-slate-200 dark:border-white/[0.05]"
        >
          <Download className="w-3.5 h-3.5" />
          Baixar Modelo CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12">
          {!file && !results && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group relative border-2 border-dashed border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-20 flex flex-col items-center justify-center cursor-pointer hover:border-sky-500/50 hover:bg-sky-50/20 dark:hover:bg-sky-500/[0.02] transition-all overflow-hidden"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".csv"
              />
              <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/[0.05] mb-6 group-hover:scale-110 transition-transform group-hover:rotate-3">
                <Upload className="w-12 h-12 text-slate-400 dark:text-slate-600 group-hover:text-sky-500 transition-colors" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">Arraste ou Selecione</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">Apenas arquivos .CSV são permitidos</p>
              
              <div className="flex gap-4">
                <span className="px-4 py-1.5 bg-slate-100 dark:bg-white/[0.05] text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-full">Automated Parsing</span>
                <span className="px-4 py-1.5 bg-slate-100 dark:bg-white/[0.05] text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-full">Error Detection</span>
              </div>
            </div>
          )}

          {file && !importing && !results && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-10 relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-sky-100 dark:bg-sky-500/10 rounded-2xl border border-sky-200 dark:border-sky-500/20">
                    <FileSpreadsheet className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-[0.2em]">{file.name}</h3>
                    <p className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Preparado para importação em lote</p>
                  </div>
                </div>
                <button 
                  onClick={() => {setFile(null); setPreview([]);}}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {preview.length > 0 && (
                <div className="mb-10 overflow-hidden border border-slate-100 dark:border-white/[0.02] rounded-2xl">
                  <table className="w-full text-left font-mono text-[10px]">
                    <thead className="bg-slate-50 dark:bg-white/[0.02]">
                      <tr>
                        {Object.keys(preview[0]).map((key) => (
                          <th key={key} className="p-3 text-slate-400 uppercase font-bold tracking-widest border-b border-slate-100 dark:border-white/[0.05]">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b border-slate-50 dark:border-white/[0.02]">
                          {Object.values(row).map((val: any, j) => (
                            <td key={j} className="p-3 text-slate-600 dark:text-slate-400 font-bold truncate max-w-[150px]">{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={handleImport}
                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-[0.3em] py-5 rounded-2xl transition-all shadow-xl shadow-sky-600/20 active:scale-[0.98]"
                >
                  Confirmar e Injetar Dados
                </button>
              </div>
            </div>
          )}

          {importing && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-20 flex flex-col items-center justify-center">
              <Loader2 className="w-16 h-16 text-sky-600 animate-spin mb-8" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">Processando Lote</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">Aguarde a validação e injeção no banco de dados</p>
            </div>
          )}

          {results && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-12 text-center"
            >
              <div className="w-20 h-20 bg-green-100 dark:bg-green-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 italic">Importação Concluída</h3>
              
              <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto mb-10">
                <div className="bg-slate-50 dark:bg-white/[0.02] p-6 rounded-2xl border border-slate-100 dark:border-white/[0.05]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sucesso</p>
                  <p className="text-3xl font-black text-green-500">{results.success}</p>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.02] p-6 rounded-2xl border border-slate-100 dark:border-white/[0.05]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Falhas</p>
                  <p className="text-3xl font-black text-red-500">{results.error}</p>
                </div>
              </div>

              <button 
                onClick={() => setResults(null)}
                className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-xl"
              >
                Nova Importação
              </button>
            </motion.div>
          )}

          <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6 flex items-center gap-3 p-4 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest">{errorMsg}</p>
                <button onClick={() => setErrorMsg(null)} className="ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 pt-12 border-t border-slate-200 dark:border-white/[0.05]">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-500/10 rounded-2xl border border-indigo-200 dark:border-indigo-500/20">
                <ImageIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-[0.2em]">Identidade Visual</h3>
                <p className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Personalize o logotipo do painel superior</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[2rem] p-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Logotipo Atual</p>
                <div className="w-full h-32 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/[0.05] flex items-center justify-center p-4">
                  {settings?.logo ? (
                    <div className="relative w-full h-full">
                      <Image 
                        src={settings.logo} 
                        alt="Logo do Painel" 
                        fill 
                        className="object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                      <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Nenhum logo definido</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-8 flex flex-col">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Carregar Novo Logo</p>
                <input 
                  type="file" 
                  ref={logoInputRef} 
                  onChange={handleLogoChange} 
                  className="hidden" 
                  accept="image/*"
                />
                {!newLogo ? (
                  <button 
                    onClick={() => logoInputRef.current?.click()}
                    className="flex-1 border-2 border-dashed border-slate-200 dark:border-white/[0.05] rounded-2xl flex flex-col items-center justify-center hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-500/[0.02] transition-all py-8"
                  >
                    <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selecionar Imagem</span>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="relative w-full h-24 bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-4 flex items-center justify-center border border-indigo-500/30">
                      <Image 
                        src={newLogo} 
                        alt="Logo em prévia" 
                        fill 
                        className="object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        onClick={() => setNewLogo(null)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <button 
                      onClick={handleSaveLogo}
                      disabled={savingLogo}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      {savingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Salvar Alterações
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
