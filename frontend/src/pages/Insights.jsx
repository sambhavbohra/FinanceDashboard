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

  const fetchInsights = async () => {
    if (!hasData) return;
    try {
      setLoading(true);
      setError('');
      const data = await generateFinancialInsights(transactions, totalIncome, totalExpenses, goals);
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
      case 'warning': return <AlertTriangle className="text-red-400" size={22} />;
      case 'suggestion': return <Lightbulb className="text-accent" size={22} />;
      case 'success': return <CheckCircle2 className="text-green-400" size={22} />;
      default: return <BrainCircuit className="text-blue-400" size={22} />;
    }
  };

  const getStyle = (type) => {
    switch (type) {
      case 'warning': return 'border-red-400/20 bg-red-400/5 hover:bg-red-400/10';
      case 'suggestion': return 'border-accent/20 bg-accent/5 hover:bg-accent/10';
      case 'success': return 'border-green-400/20 bg-green-400/5 hover:bg-green-400/10';
      default: return 'border-blue-400/20 bg-blue-400/5';
    }
  };

  return (
    <div className="space-y-8 pb-20 md:pb-0 max-w-3xl">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/20 text-accent rounded-xl">
            <Bot size={28} />
          </div>
          <div>
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold text-white tracking-tight">
              AI Assistant
            </motion.h1>
            <p className="text-muted text-sm">Powered by Groq · Llama 3.3</p>
          </div>
        </div>
        {hasData && (
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 text-sm"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}
      </header>

      {/* Health Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 border-l-4 border-l-accent flex flex-col sm:flex-row sm:items-center justify-between gap-6"
      >
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Financial Health Score</h2>
          <p className="text-muted text-sm max-w-md">
            {healthScore >= 70
              ? 'Great job! Your savings rate is healthy. Keep it up.'
              : healthScore >= 50
              ? 'Your finances are on track. Try to save a bit more each month.'
              : 'Your expenses are high relative to income. Add income or reduce spending.'}
          </p>
        </div>
        <div className="relative flex-shrink-0 w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none"
              stroke="#E2FE74"
              strokeWidth="3"
              strokeDasharray={`${healthScore} 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{healthScore}</span>
          </div>
        </div>
      </motion.div>

      {/* No data state */}
      {!hasData ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 flex flex-col items-center justify-center text-center border-dashed border-white/10"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Inbox className="text-muted" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No data to analyze yet</h3>
          <p className="text-muted max-w-sm">The AI assistant needs your transaction data to generate smart insights. Add some income and expenses first!</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <BrainCircuit size={18} className="text-accent" />
            {loading ? 'Analyzing your finances…' : `${liveInsights.length} Smart Recommendations`}
          </h3>

          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="flex items-center gap-3 text-accent bg-accent/10 px-6 py-3 rounded-full">
                <RefreshCw className="animate-spin" size={18} />
                <span className="text-sm">Llama 3.3 is analyzing your spending…</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {!loading && liveInsights.map((insight, idx) => (
            <motion.div
              key={insight.id || idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-5 rounded-2xl border transition-all duration-200 flex items-start gap-4 ${getStyle(insight.type)}`}
            >
              <div className="mt-0.5 flex-shrink-0">{getIcon(insight.type)}</div>
              <div>
                <h4 className="text-white font-semibold mb-1 capitalize">
                  {insight.type === 'warning' ? '⚠ Action Required' : insight.type === 'suggestion' ? '💡 Suggestion' : '✅ Good News'}
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">{insight.message}</p>
              </div>
            </motion.div>
          ))}

          {!loading && liveInsights.length === 0 && !error && (
            <div className="text-center py-8 text-muted text-sm">
              Click Refresh to generate your personalized AI insights.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
