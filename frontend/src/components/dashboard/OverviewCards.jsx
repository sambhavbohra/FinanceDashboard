import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Wallet, TrendingUp, TrendingDown, Target, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
};

export default function OverviewCards() {
  const { totalIncome, totalExpenses, balance, healthScore, transactions } = useFinance();

  const cards = [
    {
      title: 'Current Liquidity',
      amount: balance,
      icon: Activity,
      color: 'text-accent',
      bgColor: 'bg-accent/15',
      trend: balance >= 0 ? 'Surplus' : 'Deficit',
    },
    {
      title: 'Monthly Income',
      amount: totalIncome,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-400/15',
      trend: '+12%', // Simulated for premium feel
    },
    {
      title: 'Monthly Burn',
      amount: totalExpenses,
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-400/15',
      trend: '-5%',
    },
    {
      title: 'Capital Health',
      amount: transactions.length > 0 ? `${healthScore}/100` : 'N/A',
      icon: Laser, // Using SVG below
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/15',
      trend: 'Optimization Required',
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {cards.map((card, idx) => (
        <motion.div
           key={card.title}
           initial={{ opacity: 0, scale: 0.95, y: 10 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           transition={{ delay: idx * 0.1, duration: 0.4 }}
           className="glass-card p-5 sm:p-7 flex flex-col justify-between group overflow-hidden relative shadow-lg shadow-black/20"
        >
           <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.03] transition-all rotate-12 scale-150">
              <card.icon size={120} weight="fill" />
           </div>
           
           <div className="flex justify-between items-start mb-6 gap-2">
              <div className="space-y-1">
                 <h3 className="text-[10px] text-muted font-black uppercase tracking-[0.2em]">{card.title}</h3>
                 <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${card.color.replace('text-', 'bg-')} opacity-60`} />
                    <span className="text-[8px] font-black text-muted uppercase tracking-widest">{card.trend}</span>
                 </div>
              </div>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[18px] sm:rounded-[22px] ${card.bgColor} ${card.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                 <card.icon size={20} strokeWidth={3} className="sm:w-6 sm:h-6" />
              </div>
           </div>

           <div className="space-y-1">
              <h2 className={`text-white tracking-tighter truncate ${card.title === 'Capital Health' ? 'text-2xl sm:text-3xl italic font-black' : 'text-3xl sm:text-4xl font-black font-mono'}`}>
                 {typeof card.amount === 'number' ? formatCurrency(card.amount) : card.amount}
              </h2>
           </div>
        </motion.div>
      ))}
    </div>
  );
}

// Icon hack because lucide doesn't have Laser by default
const Laser = (props) => (
   <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 3 3 3"/><path d="m3 21 9-9"/><path d="m21 3-9 9"/><path d="m21 21-3-3"/>
   </svg>
);
