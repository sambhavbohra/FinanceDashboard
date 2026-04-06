import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Wallet, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function OverviewCards() {
  const { totalIncome, totalExpenses, balance, healthScore } = useFinance();

  const cards = [
    {
      title: 'Total Balance',
      amount: balance,
      icon: Wallet,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Monthly Income',
      amount: totalIncome,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      title: 'Total Expenses',
      amount: totalExpenses,
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
    },
    {
      title: 'Health Score',
      amount: healthScore !== null ? `${healthScore}/100` : 'N/A',
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="glass-card p-6 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-muted font-medium text-sm">{card.title}</h3>
            <div className={`p-2 rounded-xl ${card.bgColor} ${card.color}`}>
              <card.icon size={20} />
            </div>
          </div>
          <h2 className={`text-white tracking-tight ${card.title === 'Health Score' && healthScore === 0 ? 'text-lg font-black italic opacity-50' : 'text-2xl font-bold'}`}>
            {typeof card.amount === 'number' ? formatCurrency(card.amount) : card.amount}
          </h2>
        </motion.div>
      ))}
    </div>
  );
}
