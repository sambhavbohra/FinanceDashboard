import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import OverviewCards from '../components/dashboard/OverviewCards';
import TransactionList from '../components/dashboard/TransactionList';
import { CashflowLineChart } from '../components/dashboard/Charts';
import { motion, AnimatePresence } from 'framer-motion';
import AddTransactionModal from '../components/dashboard/AddTransactionModal';
import { Plus, Inbox, Gavel, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, transactions, goals, healthScore } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/requests/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingCount(res.data.length);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 15000);
    return () => clearInterval(interval);
  }, []);

  const getTimeGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const score = healthScore;
  const hasData = transactions.length > 0;
  const [selectedMonth, setSelectedMonth] = useState(null);

  const getMonthlyBreakdown = (monthInfo) => {
    if (!monthInfo) return null;
    const monthTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === monthInfo.month && d.getFullYear() === monthInfo.year;
    });

    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const dateObj = new Date(monthInfo.year, monthInfo.month);
    
    return {
      monthName: dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      income,
      expense,
      net: income - expense,
      count: monthTx.length
    };
  };

  const breakdown = getMonthlyBreakdown(selectedMonth);

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
            {getTimeGreeting()}, {user?.name?.split(' ')[0] || 'User'}!
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          </h1>
          <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] ml-1 ${score < 60 && transactions.length > 0 ? 'text-red-400 opacity-80' : 'text-muted opacity-40'}`}>
            Capital Health Score: {transactions.length > 0 ? `${score}/100` : 'N/A'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 bg-accent text-primary px-7 py-3.5 sm:px-10 sm:py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-accent/90 transition-all shadow-xl shadow-accent/10 active:scale-95 group shrink-0"
        >
          Post Entry <Plus size={18} strokeWidth={4} />
        </button>
      </header>

      {/* Democracy Alert */}
      <AnimatePresence>
        {pendingCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="group relative"
          >
            <Link to="/decisions" className="flex items-center justify-between p-6 glass-card bg-accent/5 border-l-4 border-l-accent hover:bg-accent/10 transition-all overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-all rotate-12">
                <Gavel size={120} weight="fill" />
              </div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 rounded-[24px] bg-accent text-primary flex items-center justify-center shadow-xl shadow-accent/20">
                  <Gavel size={28} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-white font-black text-xl tracking-tighter uppercase leading-none mb-1">Consensus Signal Required</h3>
                  <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em]">There are {pendingCount} shared adjustments waiting for your digital signature</p>
                </div>
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-accent opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">Enter Council Hub</span>
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-primary transition-all">
                  <ArrowRight size={20} strokeWidth={3} />
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <OverviewCards />

      {!hasData ? (
        <motion.div
  initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-24 flex flex-col items-center justify-center text-center border-dashed border-white/10 opacity-60 bg-white/2"
        >
          <div className="w-24 h-24 rounded-[40px] bg-white/5 flex items-center justify-center mb-8 relative">
            <Inbox className="text-white/20" size={48} strokeWidth={1.5} />
            <div className="absolute top-0 right-0 w-3 h-3 bg-accent rounded-full animate-ping" />
          </div>
          <h3 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase tracking-widest">Vault Empty</h3>
          <p className="text-muted mb-8 max-w-sm font-bold text-sm leading-relaxed">Your financial stream is currently silent. Synchronize your first trade or income to initialize analytics.</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-accent text-primary px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-accent/90 transition-all shadow-2xl shadow-accent/20 active:scale-95"
          >
            Post Initial Entry
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">Monthly Cashflow</h3>
                  <p className="text-[9px] text-muted font-black uppercase tracking-widest mt-1">interactive visual analytics</p>
                </div>
                <div className="flex space-x-4 text-[10px] font-black uppercase tracking-widest">
                  <span className="flex items-center text-muted"><span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 inline-block"></span>Inflow</span>
                  <span className="flex items-center text-muted"><span className="w-2 h-2 rounded-full bg-red-400 mr-2 inline-block"></span>Outflow</span>
                </div>
              </div>
              <div className="h-[300px]">
                <CashflowLineChart onClick={(month) => setSelectedMonth(month)} />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {breakdown ? (
                <motion.div
                  key={breakdown.monthName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-card p-6 bg-accent/[0.02] border-accent/10 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="text-accent" size={40} />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h4 className="text-white font-black text-xl tracking-tighter uppercase">{breakdown.monthName} Analysis</h4>
                      <p className="text-[9px] text-muted font-black uppercase tracking-widest mt-1">Aggregated Capital Movements ({breakdown.count} entries)</p>
                    </div>
                    <button onClick={() => setSelectedMonth(null)} className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-white transition-colors">Close Insight</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
                      <p className="text-[9px] text-muted font-black uppercase tracking-widest mb-1">Total Inflow</p>
                      <p className="text-xl font-black text-emerald-400 tracking-tight">₹{breakdown.income.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
                      <p className="text-[9px] text-muted font-black uppercase tracking-widest mb-1">Total Outflow</p>
                      <p className="text-xl font-black text-red-400 tracking-tight">₹{breakdown.expense.toLocaleString()}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border shadow-inner ${breakdown.net >= 0 ? 'bg-emerald-400/10 border-emerald-400/20' : 'bg-red-400/10 border-red-400/20'}`}>
                      <p className="text-[9px] text-muted font-black uppercase tracking-widest mb-1">Net Reserve Delta</p>
                      <p className={`text-xl font-black tracking-tight ${breakdown.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {breakdown.net >= 0 ? '+' : ''}₹{breakdown.net.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="glass-card p-10 flex flex-col items-center justify-center text-center opacity-40 border-dashed border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Select a data node on the graph to unlock monthly reserves breakdown</p>
                </div>
              )}
            </AnimatePresence>
          </div>
          <div className="min-h-[400px]">
            <TransactionList limit={6} onAdd={() => setShowModal(true)} />
          </div>
        </div>
      )}

      <AddTransactionModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
