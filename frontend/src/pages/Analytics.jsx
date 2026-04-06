import React from 'react';
import { motion } from 'framer-motion';
import { SpendingPieChart, CashflowLineChart } from '../components/dashboard/Charts';
import { useFinance } from '../context/FinanceContext';

export default function Analytics() {
  const { transactions } = useFinance();
  
  const expenses = transactions.filter(t => t.type === 'expense');
  const topCategory = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const maxCat = Object.entries(topCategory).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return (
    <div className="space-y-8 pb-20 md:pb-0 h-full flex flex-col">
      <header className="mb-2">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold text-white mb-2 tracking-tight"
        >
          Analytics
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted"
        >
          Deep dive into your financial habits.
        </motion.p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
        {/* Spending Breakdown */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 flex flex-col h-full"
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white">Expenses by Category</h3>
            <p className="text-sm text-muted">Your top spending category is <span className="text-accent font-medium">{maxCat}</span></p>
          </div>
          <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
            <SpendingPieChart />
          </div>
        </motion.div>

        {/* Cashflow Trends */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 flex flex-col h-full"
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white">Cashflow Trends</h3>
            <p className="text-sm text-muted">Compare your income vs expenses over time</p>
          </div>
          <div className="flex-1 min-h-[300px]">
            <CashflowLineChart />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
