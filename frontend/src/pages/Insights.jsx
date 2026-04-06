import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { motion } from 'framer-motion';
import { BrainCircuit, AlertTriangle, Lightbulb, CheckCircle2, Bot, RefreshCw, Inbox } from 'lucide-react';
import { generateFinancialInsights } from '../services/ai';

export default function Insights() {
  const { transactions, totalIncome, totalExpenses, goals, healthScore } = useFinance();
  const [liveInsights, setLiveInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasData = transactions.length > 0;

  const [expandedInsight, setExpandedInsight] = useState(null);

  const fetchInsights = async () => {
    if (!hasData) return;
    try {
      setLoading(true);
      setError('');
      // In a real app, we'd fetch friendBalances and pastInsights from context/backend
      const data = await generateFinancialInsights(transactions, totalIncome, totalExpenses, goals, [], [], user?.aiPersona || 'coach');
      setLiveInsights(data);
    } catch (err) {
      console.error(err);
      setError('Could not generate insights. Please check your API key in the .env file.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasData && import.meta.env.VITE_OPENAI_API_KEY) {
      fetchInsights();
    }
  }, [hasData]);

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="text-red-400" size={20} />;
      case 'milestone': return <CheckCircle2 className="text-emerald-400" size={20} />;
      case 'recovery': return <RefreshCw className="text-blue-400" size={20} />;
      case 'strategy': return <BrainCircuit className="text-accent" size={20} />;
      default: return <Lightbulb className="text-accent" size={20} />;
    }
  };

  const getTheme = (type) => {
    switch (type) {
      case 'warning': return 'bg-red-400/5 border-red-400/20 text-red-400';
      case 'milestone': return 'bg-emerald-400/5 border-emerald-400/20 text-emerald-400';
      case 'recovery': return 'bg-blue-400/5 border-blue-400/20 text-blue-400';
      case 'strategy': return 'bg-accent/5 border-accent/20 text-accent';
      default: return 'bg-white/5 border-white/10 text-white';
    }
  };

  return (
    <div className="space-y-10 pb-24 md:pb-0 max-w-4xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-accent rounded-3xl flex items-center justify-center shadow-2xl shadow-accent/20 rotate-3">
              <Bot size={32} className="text-primary" strokeWidth={3} />
           </div>
           <div>
              <h1 className="text-4xl font-black text-white tracking-tighter italic">Fin<span className="text-accent underline">Insights</span></h1>
              <p className="text-muted text-[10px] uppercase font-black tracking-[0.4em] opacity-60">Neural Financial Co-Pilot Active</p>
           </div>
        </div>
        
        {hasData && (
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="group flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-accent hover:text-primary transition-all active:scale-95 disabled:opacity-50 font-bold uppercase tracking-widest text-[10px]"
          >
            <RefreshCw size={14} strokeWidth={3} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
            Recalculate Stream
          </button>
        )}
      </header>

      {/* Health Score Pulse */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-10 border-2 border-white/5 bg-gradient-to-br from-accent/5 via-transparent to-transparent flex flex-col md:flex-row items-center gap-12"
      >
        <div className="relative w-32 h-32 flex-shrink-0">
           <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl animate-pulse" />
           <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 36 36">
             <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
             <motion.circle cx="18" cy="18" r="15.9" fill="none"
               stroke="#E2FE74"
               strokeWidth="3.5"
               strokeDasharray={`${healthScore} 100`}
               strokeLinecap="round"
               initial={{ strokeDasharray: "0 100" }}
               animate={{ strokeDasharray: `${healthScore} 100` }}
               transition={{ duration: 1.5, ease: "easeOut" }}
             />
           </svg>
           <div className="absolute inset-0 flex flex-col items-center justify-center relative z-20">
             <span className="text-4xl font-black text-white italic leading-none">{healthScore}</span>
             <span className="text-[8px] font-black text-accent uppercase tracking-tighter">Stability</span>
           </div>
        </div>
        <div className="text-center md:text-left">
           <p className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-2">Stability Verdict</p>
           <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-3 leading-tight ">
             {healthScore >= 70 ? 'Operational Efficiency: High' : healthScore >= 50 ? 'Steady: Optimization Required' : 'CRITICAL: Resource Depletion Warning'}
           </h2>
           <p className="text-muted text-sm font-medium leading-relaxed max-w-lg">
             {healthScore >= 70 ? 'Capital flow is optimized. Continue current expenditure pattern for maximum goal efficiency.' : 'Resource allocation is balanced but velocity is slowing down. Minor adjustments recommended.'}
           </p>
        </div>
      </motion.div>

      {/* Insight Stream */}
      <div className="space-y-6">
        {!hasData ? (
          <div className="glass-card p-20 text-center border-dashed opacity-40">
             <Inbox className="mx-auto mb-4 text-muted" size={48} />
             <p className="font-black uppercase tracking-widest text-xs">No Data Signal Detected</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-2 px-2">
               <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white opacity-40">Live Analysis Stream</p>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center gap-6">
                 <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                      <motion.div key={i} animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                        className="w-3 h-3 bg-accent rounded-full shadow-[0_0_15px_#E2FE74]" />
                    ))}
                 </div>
                 <p className="text-xs font-black uppercase tracking-[0.3em] text-accent animate-pulse">Llama Core Reasoning...</p>
              </div>
            ) : (
              liveInsights.map((insight, idx) => (
                <motion.div key={insight.id || idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                  className={`group glass-card p-0 overflow-hidden border-2 transition-all duration-300 ${expandedInsight === idx ? 'border-accent shadow-[0_30px_60px_-15px_rgba(226,254,116,0.1)]' : 'border-white/5 hover:border-white/10'}`}
                >
                  <div className="p-8 flex items-start gap-6">
                    <div className={`mt-1 p-3 rounded-2xl shrink-0 ${getTheme(insight.type).split(' ').slice(0,2).join(' ')}`}>
                       {getIcon(insight.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-2">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${getTheme(insight.type).split(' ').pop()}`}>{insight.type}</p>
                          <span className="text-[10px] text-white/20 font-black">AI_REF: {insight.id?.split('-')[1] || idx}</span>
                       </div>
                       <h4 className="text-xl font-black text-white tracking-tighter mb-4 leading-tight">
                         {insight.message}
                       </h4>
                       
                       <div className="flex flex-wrap items-center gap-4">
                          {insight.actionLabel && (
                             <button className="px-6 py-3 bg-white/5 hover:bg-accent hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5">
                                {insight.actionLabel}
                             </button>
                          )}
                          <button onClick={() => setExpandedInsight(expandedInsight === idx ? null : idx)}
                            className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-accent transition-colors">
                             {expandedInsight === idx ? 'Close Reasoning [-]' : 'View Logic [+]'}
                          </button>
                       </div>
                    </div>
                  </div>
                  
                  {expandedInsight === idx && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="px-8 pb-8 border-t border-white/5 bg-white/1">
                       <div className="pt-6 space-y-4">
                          <div className="flex items-center gap-3">
                             <Bot size={14} className="text-accent" />
                             <p className="text-[9px] font-black uppercase tracking-widest text-accent">Internal AI Model Chain</p>
                          </div>
                          <p className="text-xs text-muted leading-relaxed font-medium italic">
                             "Based on the transaction density of the last 72 hours, I've identified a {insight.type === 'warning' ? 'negative velocity trend' : 'positive resource consolidation'}. This recommendation aims to {insight.type === 'warning' ? 'prevent a budget breach' : 'maximize the interest-free capital window'} while maintaining a 20% safety margin."
                          </p>
                          <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                             <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Conversational Follow-up</p>
                             <div className="flex gap-2">
                                <input placeholder="Tell me more..." className="flex-1 bg-transparent text-xs text-white outline-none" />
                                <button className="text-accent hover:scale-110 transition-transform"><RefreshCw size={14} /></button>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  )}
                </motion.div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
