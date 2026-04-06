import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ShoppingBag, Coffee, Car, GraduationCap, Link2, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function TransactionList({ limit }) {
  const { transactions } = useFinance();
  const navigate = useNavigate();
  
  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
        <button 
          onClick={() => navigate('/transactions')} 
          className="text-sm font-bold text-accent hover:underline hover:scale-105 transition-transform"
        >
          View All
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {displayTransactions.map((tx, idx) => {
          const Icon = getCategoryIcon(tx.category);
          const isIncome = tx.type === 'income';
          
          return (
            <motion.div
              key={tx._id || tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-default border border-transparent hover:border-white/5"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-secondary rounded-xl group-hover:bg-primary transition-colors">
                  <Icon size={20} className={isIncome ? 'text-green-400' : 'text-white'} />
                </div>
                <div>
                  <h4 className="text-white font-medium">{tx.name}</h4>
                  <p className="text-xs text-muted mt-1">{tx.category} • {new Date(tx.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className={`font-semibold ${isIncome ? 'text-green-400' : 'text-white'}`}>
                {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
