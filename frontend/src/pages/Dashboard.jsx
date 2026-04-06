import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import OverviewCards from '../components/dashboard/OverviewCards';
import TransactionList from '../components/dashboard/TransactionList';
import { CashflowLineChart } from '../components/dashboard/Charts';
import { motion } from 'framer-motion';
import AddTransactionModal from '../components/dashboard/AddTransactionModal';
import { Plus, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, transactions, goals, healthScore } = useFinance();
  const [showModal, setShowModal] = useState(false);

  const getTimeGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const score = healthScore;
  const hasData = transactions.length > 0;

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-2">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase flex items-center gap-2">
            {getTimeGreeting()}, {user?.name || 'User'}!
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          </h1>
          <p className="text-muted text-[10px] font-black uppercase tracking-[0.4em] opacity-40 ml-1">
            Financial Health Score: {transactions.length > 0 ? `${score}/100` : 'N/A'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 bg-accent text-primary px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-accent/90 transition-all shadow-xl shadow-accent/10 active:scale-95 group shrink-0"
        >
          Post Entry <Plus size={20} strokeWidth={4} />
        </button>
      </header>

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px]">
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Monthly Cashflow</h3>
              <div className="flex space-x-4 text-sm">
                <span className="flex items-center text-muted"><span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 inline-block"></span>Income</span>
                <span className="flex items-center text-muted"><span className="w-2 h-2 rounded-full bg-red-400 mr-2 inline-block"></span>Expenses</span>
              </div>
            </div>
            <div className="h-[300px]">
              <CashflowLineChart />
            </div>
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
