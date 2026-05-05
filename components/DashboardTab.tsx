'use client';

import { motion } from 'motion/react';
import { PackageX, Archive, Clock, Home, ArrowUpRight, ArrowDownRight, TrendingUp, Activity, PieChart as PieChartIcon, Loader2, RefreshCw } from 'lucide-react';
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useRegistrations, Registration } from '@/lib/firestore-service';
import { useAuth } from '@/hooks/useAuth';
import { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#0284c7', '#a855f7', '#d8b4fe'];

export default function DashboardTab() {
  const { warehouse: userWarehouse } = useAuth();
  const { registrations, loading, refresh } = useRegistrations(userWarehouse);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const branches = useMemo(() => {
    const uniqueBranches = Array.from(new Set(registrations.map(r => r.warehouse))).filter(Boolean);
    return ['all', ...uniqueBranches.sort()];
  }, [registrations]);

  const statsData = useMemo(() => {
    const filtered = selectedBranch === 'all' 
      ? registrations 
      : registrations.filter(r => r.warehouse === selectedBranch);

    const total = filtered.length;
    const confirmedCount = filtered.filter(r => r.status === 'confirmed').length;
    const pendingCount = filtered.filter(r => !r.status || r.status === 'pending').length;
    const byReason = filtered.reduce((acc: any, curr) => {
      acc[curr.reason] = (acc[curr.reason] || 0) + 1;
      return acc;
    }, {});

    const byBranch = filtered.reduce((acc: any, curr) => {
      acc[curr.warehouse] = (acc[curr.warehouse] || 0) + 1;
      return acc;
    }, {});

    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const trend = months.map(m => ({ name: m, baixas: 0 }));
    
    filtered.forEach(r => {
      if (r.date) {
        const parts = r.date.split('/');
        if (parts.length === 3) {
          const monthIndex = parseInt(parts[1], 10) - 1;
          if (trend[monthIndex]) trend[monthIndex].baixas++;
        }
      }
    });

    const branchChartData = Object.entries(byBranch).map(([name, value]) => ({ 
      name, 
      value: value as number 
    })).sort((a, b) => b.value - a.value);

    const reasonChartData = Object.entries(byReason).map(([name, value]) => ({ 
      name, 
      value: value as number 
    })).sort((a, b) => b.value - a.value).slice(0, 10);

    const byUser = filtered.reduce((acc: any, curr) => {
      const userKey = curr.userEmail || 'Anônimo';
      acc[userKey] = (acc[userKey] || 0) + 1;
      return acc;
    }, {});

    const userChartData = Object.entries(byUser).map(([name, value]) => ({ 
      name, 
      value: value as number 
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    return { total, confirmedCount, pendingCount, byReason, byBranch, trend, branchChartData, reasonChartData, userChartData, filteredData: filtered };
  }, [registrations, selectedBranch]);

  const handleDownloadReport = async () => {
    if (statsData.total === 0) return;
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString('pt-BR');
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(14, 165, 233); // sky-600
      doc.text('LEDGER ANALÍTICO MENSAL', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${timestamp}`, 14, 30);
      doc.text(`Filtro: ${selectedBranch === 'all' ? 'GLOBAL' : selectedBranch}`, 14, 35);
      
      // Summary Stats
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('RESUMO EXECUTIVO', 14, 50);
      
      doc.setFontSize(10);
      const statsText = [
        `Volume Total de Baixas: ${statsData.total}`,
        `Protocolos Confirmados: ${statsData.confirmedCount}`,
        `Pendências de Auditoria: ${statsData.pendingCount}`,
        `Filiais Ativas: ${Object.keys(statsData.byBranch).length}`
      ];
      
      statsText.forEach((text, i) => {
        doc.text(text, 14, 60 + (i * 7));
      });

      // Data Table
      const tableData = statsData.filteredData.map(r => [
        r.date || '',
        r.removalDate ? r.removalDate.split('-').reverse().join('/') : '-',
        r.plate || '',
        r.warehouse || '',
        r.reason || '',
        r.technician || '',
        r.status === 'confirmed' ? 'CONFIRMADO' : 'PENDENTE'
      ]);

      autoTable(doc, {
        startY: 95,
        head: [['CADASTRO', 'DESINST.', 'PLACA', 'FILIAL', 'MOTIVO', 'TÉCNICO', 'STATUS']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233] },
        styles: { fontSize: 7, font: 'helvetica' }
      });

      doc.save(`Relatorio_Executivo_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Houve um erro ao gerar o relatório.");
    } finally {
      setIsGenerating(false);
    }
  };

  const stats = [
    { 
      label: 'Volume Total Baixas', 
      value: statsData.total, 
      detail: 'LOGISTIX GLOBAL LEDGER', 
      icon: PackageX, 
      color: 'text-sky-500', 
      bg: 'bg-sky-500/5',
      border: 'border-sky-500/20'
    },
    { 
      label: 'Protocolos Confirmados', 
      value: statsData.confirmedCount, 
      detail: 'VERIFIED OPERATIONS', 
      icon: Archive, 
      color: 'text-green-500', 
      bg: 'bg-green-500/5',
      border: 'border-green-500/20'
    },
    { 
      label: 'Pendência de Auditoria', 
      value: statsData.pendingCount, 
      detail: 'AWAITING AUTH', 
      icon: Clock, 
      color: 'text-yellow-500', 
      bg: 'bg-yellow-500/5',
      border: 'border-yellow-500/20'
    },
    { 
      label: 'Terminais Ativos', 
      value: Object.keys(statsData.byBranch).length, 
      detail: 'OPERATIONAL BRANCHES', 
      icon: Home, 
      color: 'text-purple-500', 
      bg: 'bg-purple-500/5',
      border: 'border-purple-500/20'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-10 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 dark:border-white/[0.05] pb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-950 dark:text-white tracking-widest uppercase italic leading-none">
            PAINEL DE <span className="text-sky-600">SUCATEAMENTO</span>
          </h2>
          <div className="text-slate-400 dark:text-slate-500 text-[10px] font-mono font-bold uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-sky-600/40 rounded-full" />
            Interface de Inteligência e Monitoramento de Frota
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex flex-col items-start gap-1">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Filtrar por Filial</label>
            <select 
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 py-3 px-6 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-sky-500/20 uppercase appearance-none cursor-pointer min-w-[240px]"
            >
              {branches.map(b => (
                <option key={b} value={b}>
                  {b === 'all' ? 'TODAS AS FILIAIS (GLOBAL)' : b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] p-3 pl-5 rounded-2xl shadow-sm backdrop-blur-xl">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 rounded-xl transition-all ${isRefreshing ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-sky-600'}`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex flex-col pr-4">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Status da Telemetria</span>
              <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 mt-1.5 uppercase tabular-nums">SINCRONIA MANUAL • {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-8 rounded-[2rem] border ${stat.border.replace('border-sky-500/20', 'border-sky-100 dark:border-sky-500/10').replace('border-green-500/20', 'border-green-100 dark:border-green-500/10').replace('border-yellow-500/20', 'border-yellow-100 dark:border-yellow-500/10').replace('border-purple-500/20', 'border-purple-100 dark:border-purple-500/10')} bg-white dark:bg-slate-900 flex flex-col gap-6 relative overflow-hidden group hover:scale-[1.02] hover:shadow-xl transition-all cursor-default shadow-sm`}
          >
            <div className={`absolute -top-4 -right-4 p-8 opacity-[0.05] group-hover:opacity-10 transition-all group-hover:-rotate-6 ${stat.color}`}>
               <stat.icon className="w-32 h-32" />
            </div>
            
            <div className="flex justify-between items-start relative z-10">
              <div className={`p-3 rounded-2xl ${stat.bg.replace('/5', '/10')} border ${stat.border.replace('/20', '/30')}`}>
                <stat.icon className={`${stat.color.replace('500', '600')} w-5 h-5 shadow-sm`} />
              </div>
              <div className="px-3 py-1 bg-slate-50 dark:bg-white/[0.02] rounded-lg border border-slate-200 dark:border-white/[0.05]">
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono font-bold uppercase tracking-widest leading-none">{stat.detail}</span>
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-5xl font-mono font-black text-slate-900 dark:text-white leading-none tracking-tighter">{stat.value}</p>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em] mt-4 flex items-center gap-2">
                <div className={`w-1 h-1 rounded-full ${stat.color.replace('text-', 'bg-').replace('500', '600')}`} />
                {stat.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Reasons Chart Column */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-red-100 dark:bg-red-500/10 rounded-2xl border border-red-200 dark:border-red-500/20">
              <PackageX className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-[0.2em] leading-none">Principais Motivos de Sucateamento</h3>
              <p className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 italic">Classificação por Volume de Ocorrências Técnicas</p>
            </div>
          </div>

          <div className="h-[400px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={statsData.reasonChartData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontFamily="JetBrains Mono" 
                  tickLine={false} 
                  axisLine={false}
                  width={150}
                />
                <Tooltip 
                  cursor={{ fill: '#94a3b811', radius: 8 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.05] p-3 rounded-xl shadow-2xl">
                          <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                          <p className="text-sm font-mono font-black text-red-600">
                            {payload[0].value} <span className="text-[9px] ml-1 font-bold">CASOS</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#ef4444" 
                  radius={[0, 6, 6, 0]}
                  barSize={24}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Operators Column */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-10 shadow-sm flex flex-col">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-sky-100 dark:bg-sky-500/10 rounded-2xl border border-sky-200 dark:border-sky-500/20">
               <Activity className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-[0.2em] leading-none">Top Operadores</h3>
              <p className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 italic">Volume de Registros por Usuário</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {statsData.userChartData?.map((u: any, i: number) => (
              <div key={u.name} className="flex flex-col p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] rounded-2xl">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{u.name}</span>
                    <span className="text-lg font-mono font-black text-sky-600 leading-none">{u.value}</span>
                 </div>
                 <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(u.value / statsData.total) * 100}%` }}
                      className="h-full bg-sky-500"
                    />
                 </div>
              </div>
            ))}
            {(!statsData.userChartData || statsData.userChartData.length === 0) && (
              <p className="text-center text-[10px] text-slate-400 uppercase font-bold py-10">Fila de Operadores Vazia</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Chart Column */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-sky-100 dark:bg-sky-500/10 rounded-2xl border border-sky-200 dark:border-sky-500/20">
                <TrendingUp className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-[0.2em] leading-none">Matriz de Tendência</h3>
                <p className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 italic">Fluxo Cronológico de Ocorrências Técnicas</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/[0.02] p-1.5 rounded-xl border border-slate-200 dark:border-white/[0.05]">
              {['24H', '7D', '30D', 'ALL'].map(t => (
                <button key={t} className={`px-4 py-1.5 text-[9px] font-mono font-bold rounded-lg transition-all ${t === '30D' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-[380px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBaixas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontFamily="JetBrains Mono" 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontFamily="JetBrains Mono"
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#94a3b811', radius: 8 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const monthMap: Record<string, string> = {
                        'JAN': 'Janeiro', 'FEV': 'Fevereiro', 'MAR': 'Março', 'ABR': 'Abril',
                        'MAI': 'Maio', 'JUN': 'Junho', 'JUL': 'Julho', 'AGO': 'Agosto',
                        'SET': 'Setembro', 'OUT': 'Outubro', 'NOV': 'Novembro', 'DEZ': 'Dezembro'
                      };
                      const fullMonth = monthMap[label as string] || label;
                      
                      return (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.05] p-4 rounded-xl shadow-2xl ring-1 ring-black/5">
                          <p className="text-[10px] font-mono font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Relatório Mensal</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">{fullMonth}</p>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-sky-600 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                            <p className="text-sm font-mono font-black text-sky-600 dark:text-sky-400">
                              {payload[0].value} <span className="text-[9px] text-slate-400 ml-1 font-bold">REGISTROS</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="baixas" 
                  fill="url(#colorBaixas)" 
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Column */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] p-10 shadow-sm flex flex-col">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-purple-100 dark:bg-purple-500/10 rounded-2xl border border-purple-200 dark:border-purple-500/20">
               <PieChartIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-[0.2em] leading-none">Top Jurisdições</h3>
              <p className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 italic">Distribuição de Volume por CD</p>
            </div>
          </div>
          
          <div className="flex-1 min-h-[280px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statsData.branchChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1500}
                  stroke="none"
                >
                  {statsData.branchChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.05))', outline: 'none' }}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip 
                   content={({ active, payload }) => {
                     if (active && payload && payload.length) {
                       return (
                         <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.05] p-3 rounded-xl shadow-2xl">
                           <div className="flex items-center gap-2 mb-1">
                             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: payload[0].payload.fill || payload[0].color }} />
                             <p className="text-[10px] font-mono font-black text-slate-900 dark:text-white uppercase">{payload[0].name}</p>
                           </div>
                           <p className="text-xs font-mono font-black text-sky-600">
                             {payload[0].value} <span className="text-[8px] text-slate-400 dark:text-slate-500 ml-0.5 font-bold">UNIDADES</span>
                           </p>
                         </div>
                       );
                     }
                     return null;
                   }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-10">
            {statsData.branchChartData.map((b, i) => (
              <div key={b.name} className="flex flex-col p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase truncate">{b.name}</span>
                </div>
                <span className="text-lg font-mono font-black text-slate-900 dark:text-white leading-none">{b.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-sky-50 to-white dark:from-sky-500/5 dark:to-slate-900 border border-sky-100 dark:border-sky-500/10 group hover:scale-[1.01] transition-all flex flex-col md:flex-row items-center gap-10 shadow-sm">
          <div className="flex-1">
             <h4 className="text-[10px] font-mono font-black text-sky-600 dark:text-sky-400 uppercase tracking-[0.4em] mb-4">Relatório Executivo</h4>
             <p className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">Geração de Ledger Analítico Mensal</p>
             <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-relaxed mb-6 italic">Consolidado técnico de todas as baixas e laudos confirmados no período.</p>
             <button 
               onClick={handleDownloadReport}
               disabled={isGenerating || statsData.total === 0}
               className="px-8 py-3.5 bg-sky-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-sky-500 transition-all shadow-xl shadow-sky-600/10 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    Download PDF
                    <ArrowUpRight className="w-4 h-4" />
                  </>
                )}
             </button>
          </div>
          <div className="hidden lg:block relative">
            <div className="w-32 h-32 rounded-[2rem] bg-white dark:bg-slate-800 border border-sky-100 dark:border-sky-500/10 flex items-center justify-center rotate-12 group-hover:rotate-6 transition-all shadow-sm">
               <PackageX className="w-12 h-12 text-sky-600 opacity-20 dark:opacity-40" />
            </div>
          </div>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-50 to-white dark:from-purple-500/5 dark:to-slate-900 border border-purple-100 dark:border-purple-500/10 group hover:scale-[1.01] transition-all flex flex-col md:flex-row items-center gap-10 shadow-sm">
          <div className="flex-1">
             <h4 className="text-[10px] font-mono font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.4em] mb-4">Módulo de Auditoria</h4>
             <p className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">Revisão de Protocolos Pendentes</p>
             <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-relaxed mb-6 italic">Existem {statsData.pendingCount} registros aguardando validação técnica de conformidade.</p>
             <button className="px-8 py-3.5 bg-purple-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/10 active:scale-95 flex items-center gap-2">
                Iniciar Revisão
                <Activity className="w-4 h-4" />
             </button>
          </div>
          <div className="hidden lg:block relative">
            <div className="w-32 h-32 rounded-[2rem] bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-500/10 flex items-center justify-center -rotate-12 group-hover:-rotate-6 transition-all shadow-sm">
               <Clock className="w-12 h-12 text-purple-600 opacity-20 dark:opacity-40" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

