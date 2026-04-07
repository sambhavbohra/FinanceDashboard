import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Plus, Trash2 } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import AddGoalModal from '../components/dashboard/AddGoalModal';
import Modal from '../components/ui/Modal';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function Goals() {
  const { goals, totalIncome, totalExpenses, addFundsToGoal, deleteGoal } = useFinance();
  const { confirm } = useConfirm();
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [fundingGoal, setFundingGoal] = useState(null);
  const [fundAmount, setFundAmount] = useState('');
  const [fundingLoading, setFundingLoading] = useState(false);

  const handleAddFunds = async (e) => {
    e.preventDefault();
    if (!fundingGoal || !fundAmount) return;
    setFundingLoading(true);
    const success = await addFundsToGoal(fundingGoal._id || fundingGoal.id, fundAmount);
    if (success) {
      addToast(`Successfully added ₹${fundAmount} to ${fundingGoal.name}`, "success");
      setFundingGoal(null);
      setFundAmount('');
    } else {
      addToast("Failed to add funds. Please try again.", "error");
    }
    setFundingLoading(false);
  };

  const handleDeleteGoal = async (id) => {
    const isConfirmed = await confirm({
      title: "Delete Goal?",
      message: "Permanently delete this savings goal? This cannot be undone.",
      type: "danger"
    });

    if (isConfirmed) {
      await deleteGoal(id);
      addToast("Savings goal deleted successfully", "success");
    }
  };

  const hasGoals = goals.length > 0;

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <header className="flex justify-between items-center">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-white mb-1 tracking-tight"
          >
            Savings Goals
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted"
          >
            Set goals and track your progress toward them.
          </motion.p>
        </div>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-accent text-primary px-5 py-2.5 rounded-xl font-semibold hover:bg-accent/90 transition-all shadow-[0_0_20px_rgba(226,254,116,0.3)] active:scale-95"
        >
          <Plus size={18} />
          New Goal
        </motion.button>
      </header>

      {!hasGoals ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 flex flex-col items-center justify-center text-center border-dashed border-white/10"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Target className="text-muted" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No savings goals yet</h3>
          <p className="text-muted mb-6 max-w-sm">Create a goal to start tracking your savings. Whether it's a new laptop or a dream trip — set it and track it!</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-accent text-primary px-6 py-2.5 rounded-xl font-semibold hover:bg-accent/90 transition-all"
          >
            Create Your First Goal
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal, idx) => {
            const available = Math.max(0, totalIncome - totalExpenses);
            const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
            const isComplete = progress >= 100;

            return (
              <motion.div
                key={goal._id || goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-6 flex flex-col group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-secondary rounded-xl">
                    {isComplete
                      ? <TrendingUp size={22} className="text-green-400" />
                      : <Target size={22} className="text-accent" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-muted border border-white/5">
                      Due {new Date(goal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    <button 
                      onClick={() => handleDeleteGoal(goal._id)}
                      className="p-2 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-white mb-1">{goal.name}</h3>
                <p className="text-muted text-sm mb-5">
                  {formatCurrency(goal.current)} <span className="text-white/20">/</span> {formatCurrency(goal.target)}
                </p>

                {isComplete ? (
                  <div className="mb-3 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs font-medium text-center">
                    🎉 Goal Achieved!
                  </div>
                ) : (
                  <button 
                    onClick={() => setFundingGoal(goal)}
                    className="mb-3 w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-semibold text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Add Funds
                  </button>
                )}

                <div className="mt-auto">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white font-semibold">{progress}%</span>
                    <span className="text-muted">{isComplete ? 'Complete' : `${formatCurrency(goal.target - goal.current)} to go`}</span>
                  </div>
                  <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: 0.4 + idx * 0.1 }}
                      className={`h-full rounded-full ${isComplete ? 'bg-green-400' : 'bg-accent'}`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      <AddGoalModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />

      {/* Fund Goal Modal */}
      <Modal 
        isOpen={!!fundingGoal} 
        onClose={() => { setFundingGoal(null); setFundAmount(''); }}
        title={fundingGoal ? `Fund Goal: ${fundingGoal.name}` : 'Fund Goal'}
      >
        <div className="space-y-6">
          {!fundingGoal ? null : (
            <>
              <div className="flex flex-col items-center justify-center py-4 bg-accent/5 border border-accent/10 rounded-2xl mb-2">
                 <p className="text-[10px] text-muted uppercase tracking-[0.2em] font-black mb-1">Remaining Obligations</p>
                 <p className="text-2xl font-black text-accent">{formatCurrency(fundingGoal.target - fundingGoal.current)}</p>
              </div>

              <form onSubmit={handleAddFunds} className="space-y-6">
                <div>
                  <label className="block text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-3">Capital Injection (₹)</label>
                  <div className="relative group">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent font-black text-lg transition-colors">₹</span>
                     <input
                       type="number"
                       min="1"
                       max={fundingGoal.target - fundingGoal.current}
                       required
                       value={fundAmount}
                       onChange={(e) => setFundAmount(e.target.value)}
                       className="w-full bg-secondary border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all font-black shadow-sm text-xl outline-none"
                       placeholder="0"
                       autoFocus
                     />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setFundingGoal(null); setFundAmount(''); }}
                    className="flex-1 py-4 bg-secondary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all outline-none active:scale-95 border border-white/5"
                    disabled={fundingLoading}
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-accent text-primary rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-accent/90 transition-all outline-none flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-accent/20"
                    disabled={fundingLoading || !fundAmount}
                  >
                    {fundingLoading ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : 'Initialize Funding'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
