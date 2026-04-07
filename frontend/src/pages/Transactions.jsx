import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { motion } from 'framer-motion';
import AddTransactionModal from '../components/dashboard/AddTransactionModal';
import { ShoppingBag, Coffee, Car, GraduationCap, Link2, DollarSign, Plus, Inbox, Trash2, Edit, Lock } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

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
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function Transactions() {
  const { transactions, deleteTransaction } = useFinance();
  const { confirm } = useConfirm();
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
       title: "Delete Record?",
       message: "Are you sure you want to delete this track record?",
       type: "danger"
    });

    if (isConfirmed) {
      await deleteTransaction(id);
      addToast("Transaction deleted successfully", "success");
    }
  };

  const handleEdit = (tx) => {
    setEditingTx(tx);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <header className="flex justify-between items-center">
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-white mb-1 tracking-tight">
            Transactions
          </motion.h1>
          <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="text-muted text-xs font-black uppercase tracking-widest opacity-60">
            {transactions.length} System Records
          </motion.p>
        </div>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-accent text-primary px-8 py-4 rounded-2xl font-black hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 active:scale-95 uppercase text-xs tracking-widest"
        >
          <Plus size={18} strokeWidth={3} /> Add Entry
        </motion.button>
      </header>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 border-accent/20 bg-accent/5">
            <p className="text-[10px] text-accent font-black uppercase tracking-widest mb-1 opacity-60">Current Reserves</p>
            <p className="text-3xl font-black text-white font-mono tracking-tighter">{formatCurrency(totalBalance)}</p>
         </motion.div>
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 border-green-500/10">
            <p className="text-[10px] text-green-400 font-black uppercase tracking-widest mb-1 opacity-60">Total Inflow</p>
            <p className="text-3xl font-black text-white font-mono tracking-tighter">{formatCurrency(totalIncome)}</p>
         </motion.div>
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 border-red-500/10">
            <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-1 opacity-60">Capital Outflow</p>
            <p className="text-3xl font-black text-white font-mono tracking-tighter">{formatCurrency(totalExpense)}</p>
         </motion.div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'income', 'expense'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-accent text-primary' : 'bg-white/5 text-muted hover:text-white border border-white/10'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 flex flex-col items-center justify-center text-center border-dashed border-white/10"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Inbox className="text-muted" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {filter === 'all' ? 'No transactions yet' : `No ${filter} transactions`}
          </h3>
          <p className="text-muted mb-6">Add your first transaction to start tracking your money.</p>
          <button onClick={() => setShowModal(true)} className="bg-accent text-primary px-6 py-2.5 rounded-xl font-semibold hover:bg-accent/90 transition-all">
            Add Transaction
          </button>
        </motion.div>
      ) : (
        <div className="glass-card divide-y divide-white/5">
          {filtered.map((tx, idx) => {
            const Icon = getCategoryIcon(tx.category);
            const isIncome = tx.type === 'income';
            return (
              <motion.div
                key={tx._id || tx.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-secondary rounded-xl">
                    <Icon size={18} className={isIncome ? 'text-green-400' : 'text-muted'} />
                  </div>
                  <div>
                    <p className="text-white font-medium">{tx.name}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {tx.category} · {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right flex flex-col items-end">
                    <span className={`font-mono font-black text-lg ${isIncome ? 'text-green-400' : 'text-white'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${isIncome ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-white/10 text-muted bg-white/5'}`}>
                      {tx.type}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {tx.isSplit ? (
                       <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-xl text-accent text-[8px] font-black uppercase tracking-[0.2em]">
                          <Lock size={12} /> Managed by Split
                       </div>
                    ) : (
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(tx)}
                          className="p-3 text-muted hover:text-accent hover:bg-accent/10 rounded-xl transition-all active:scale-90"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(tx._id)}
                          className="p-3 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all active:scale-90"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AddTransactionModal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setEditingTx(null); }} 
        initialTransaction={editingTx}
      />
    </div>
  );
}
