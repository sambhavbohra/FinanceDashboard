import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';
import AddTransactionModal from '../components/dashboard/AddTransactionModal';
import { ShoppingBag, Coffee, Car, GraduationCap, Link2, DollarSign, Plus, Inbox, Trash2, Edit, Lock, Search, Filter, TrendingUp, TrendingDown, Wallet as WalletIcon, ChevronRight } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Food': return Coffee;
    case 'Shopping': return ShoppingBag;
    case 'Travel': return Car;
    case 'Education': return GraduationCap;
    case 'Subscriptions': return Link2;
    default: return DollarSign;
  }
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(amount);

export default function Wallet() {
  const { transactions, deleteTransaction } = useFinance();
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculations
  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => filter === 'all' || t.type === filter)
      .filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [transactions, filter, searchQuery]);

  // Grouping by date
  const groupedTransactions = useMemo(() => {
     const groups = {};
     filteredTransactions.forEach(t => {
        const date = new Date(t.date).toDateString();
        if (!groups[date]) groups[date] = [];
        groups[date].push(t);
     });
     return Object.entries(groups).sort((a,b) => new Date(b[0]) - new Date(a[0]));
  }, [filteredTransactions]);

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
       title: "Delete Record?",
       message: "Are you sure you want to delete this track record?",
       type: "danger"
    });
    if (isConfirmed) {
      await deleteTransaction(id);
      addToast("Record purged from ledger", "success");
    }
  };

  const handleEdit = (tx) => {
    setEditingTx(tx);
    setShowModal(true);
  };

  return (
    <div className="min-h-[calc(100vh-120px)] pb-32 md:pb-10 max-w-5xl mx-auto space-y-8 px-1">
      {/* Dynamic Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                 <WalletIcon size={16} strokeWidth={3} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent opacity-60">Liquid Reserves</p>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic">Fin<span className="text-accent underline decoration-accent/30 decoration-4 underline-offset-8 font-black underline">Track</span></h1>
        </div>
        
        {/* Quick Add - Hidden on Mobile, shown as FAB */}
        <button
          onClick={() => setShowModal(true)}
          className="hidden md:flex items-center gap-3 bg-accent text-primary px-10 py-5 rounded-3xl font-black hover:bg-accent/90 transition-all shadow-2xl shadow-accent/20 active:scale-95 uppercase text-xs tracking-widest"
        >
          <Plus size={20} strokeWidth={3} /> New Entry
        </button>
      </header>

      {/* Portfolio Pulse - Horizontal on Mobile */}
      <div className="flex overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-3 no-scrollbar snap-x">
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
            className={`flex-shrink-0 w-[85vw] md:w-auto snap-center glass-card p-8 relative overflow-hidden group transition-all duration-500 ${stats.balance < 0 ? 'border-red-500/30 bg-red-500/5 shadow-red-500/5' : 'border-accent/20 bg-gradient-to-br from-accent/10 to-transparent shadow-accent/5'}`}
         >
            <div className={`absolute -right-4 -top-4 w-24 h-24  rounded-full blur-3xl transition-all ${stats.balance < 0 ? 'bg-red-500/10 group-hover:bg-red-500/20' : 'bg-accent/10 group-hover:bg-accent/20'}`} />
            <p className={`text-[10px] font-black uppercase tracking-widest mb-4 opacity-50 flex items-center gap-2 transition-colors ${stats.balance < 0 ? 'text-red-400' : 'text-accent'}`}>
               <div className={`w-1.5 h-1.5 rounded-full animate-pulse transition-colors ${stats.balance < 0 ? 'bg-red-400' : 'bg-accent'}`} />
               Current Liquidity
            </p>
            <p className={`text-4xl font-black tracking-tight transition-colors ${stats.balance < 0 ? 'text-red-400' : 'text-white'}`}>{formatCurrency(stats.balance)}</p>
         </motion.div>

         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex-shrink-0 w-[85vw] md:w-auto snap-center glass-card p-8 border-green-500/20 bg-green-500/5 relative group"
         >
            <TrendingUp className="absolute top-8 right-8 text-green-500/20" size={48} />
            <p className="text-[10px] text-green-400 font-black uppercase tracking-widest mb-4 opacity-50">Total Inflow</p>
            <p className="text-4xl font-black text-white tracking-tight">{formatCurrency(stats.income)}</p>
         </motion.div>

         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex-shrink-0 w-[85vw] md:w-auto snap-center glass-card p-8 border-red-500/20 bg-red-500/5 relative group"
         >
            <TrendingDown className="absolute top-8 right-8 text-red-500/20" size={48} />
            <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-4 opacity-50">Capital Outflow</p>
            <p className="text-4xl font-black text-white tracking-tight">{formatCurrency(stats.expense)}</p>
         </motion.div>
      </div>

      {/* Control Strip */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-card p-4 bg-white/2 border-white/5">
         <div className="relative w-full md:w-72 group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" />
            <input 
               placeholder="Search entries..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-secondary border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:text-muted/50"
            />
         </div>
         
         <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0 underline-offset-4">
            {['all', 'income', 'expense'].map(f => (
               <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                     filter === f ? 'bg-accent text-primary shadow-lg shadow-accent/20' : 'bg-white/5 text-muted hover:text-white border border-white/5'
                  }`}
               >
                  {f}
               </button>
            ))}
         </div>
      </div>

      {/* Entry List */}
      <div className="space-y-10">
         {groupedTransactions.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
               className="glass-card p-20 flex flex-col items-center justify-center text-center border-dashed border-white/10 opacity-60"
            >
               <Inbox className="text-muted mb-6" size={48} strokeWidth={1} />
               <h3 className="text-xl font-black text-white uppercase tracking-widest">No Signals Found</h3>
               <p className="text-muted text-xs font-bold mt-2 font-mono">ADJUST FILTERS OR INITIALIZE NEW TRACKING ENTRY</p>
            </motion.div>
         ) : (
            groupedTransactions.map(([date, entries], gIdx) => (
               <div key={date} className="space-y-4">
                  <div className="flex items-center gap-4 px-4">
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent whitespace-nowrap">
                        {new Date(date).toDateString() === new Date().toDateString() ? 'Live Today' : date}
                     </span>
                     <div className="h-px bg-white/5 w-full" />
                  </div>
                  
                  <div className="grid gap-3">
                     {entries.map((tx, idx) => {
                        const Icon = getCategoryIcon(tx.category);
                        const isIncome = tx.type === 'income';
                        return (
                           <motion.div
                              key={tx._id || tx.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="group glass-card p-4 md:p-6 hover:bg-white/[0.04] border border-white/5 hover:border-white/10 transition-all duration-300 flex items-center justify-between gap-4"
                           >
                              <div className="flex items-center gap-4">
                                 <div className={`p-4 rounded-2xl shrink-0 transition-colors ${isIncome ? 'bg-green-500/10 text-green-400' : 'bg-secondary text-muted group-hover:text-white'}`}>
                                    <Icon size={20} strokeWidth={2.5} />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-white font-black text-sm md:text-base tracking-tight truncate flex items-center gap-2">
                                       {tx.name}
                                       {tx.isSplit && <Lock size={10} className="text-accent opacity-60" />}
                                    </p>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1 opacity-60">
                                       {tx.category} · {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                 </div>
                              </div>
                              
                              <div className="flex items-center gap-3 md:gap-6 shrink-0 ml-auto">
                                 <div className="text-right">
                                    <p className={`font-black text-lg md:text-2xl tracking-tight leading-none ${isIncome ? 'text-green-400' : 'text-white'}`}>
                                       {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </p>
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10 mt-1 inline-block ${isIncome ? 'text-green-400 bg-green-400/5 border-green-400/20' : 'text-muted bg-white/5'}`}>
                                       {tx.type}
                                    </span>
                                 </div>
                                 
                                 <div className="flex items-center">
                                    {tx.isSplit ? (
                                       <button 
                                          onClick={() => navigate('/splits')}
                                          className="p-2.5 bg-accent/10 border border-accent/20 rounded-xl text-accent hover:bg-accent hover:text-primary transition-all active:scale-95 shadow-lg shadow-accent/10"
                                       >
                                          <Lock size={14} strokeWidth={3} />
                                       </button>
                                    ) : (
                                       <div className="flex gap-0.5 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button 
                                             onClick={() => handleEdit(tx)} 
                                             className="p-2 text-muted hover:text-accent hover:bg-accent/10 rounded-xl transition-all"
                                          >
                                             <Edit size={16} strokeWidth={2.5} />
                                          </button>
                                          <button 
                                             onClick={() => handleDelete(tx._id)} 
                                             className="p-2 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                          >
                                             <Trash2 size={16} strokeWidth={2.5} />
                                          </button>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </motion.div>
                        );
                     })}
                  </div>
               </div>
            ))
         )}
      </div>

      {/* Floating Action Button for Mobile */}
      <motion.button
         whileHover={{ scale: 1.05 }}
         whileTap={{ scale: 0.95 }}
         onClick={() => setShowModal(true)}
         className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-accent text-primary rounded-3xl shadow-2xl shadow-accent/40 flex items-center justify-center z-50 border-4 border-[#141414]"
      >
         <Plus size={32} strokeWidth={4} />
      </motion.button>

      <AddTransactionModal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setEditingTx(null); }} 
        initialTransaction={editingTx}
      />
    </div>
  );
}
