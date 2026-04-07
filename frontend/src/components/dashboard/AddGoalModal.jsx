import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import Modal from '../ui/Modal';
import DatePicker from '../ui/DatePicker';
import { Target, Sparkles } from 'lucide-react';

const suggestions = ['New Laptop', 'Bali Trip', 'Emergency Fund', 'New Phone', 'Books', 'Bike'];

export default function AddGoalModal({ isOpen, onClose }) {
  const { addGoal } = useFinance();
  const [form, setForm] = useState({ name: '', target: '', deadline: null });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.target || !form.deadline) return;
    setLoading(true);
    await addGoal({ 
      ...form, 
      target: parseFloat(form.target), 
      deadline: form.deadline.toISOString() 
    });
    setLoading(false);
    setForm({ name: '', target: '', deadline: null });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Savings Goal">
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        <div className="space-y-3">
          <label className="text-[9px] text-muted uppercase tracking-[0.3em] font-black px-1">Goal Identity</label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors"><Target size={18} /></span>
            <input
              required
              placeholder="e.g. Dream Vacation..."
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-secondary border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-white placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent font-black tracking-tight text-sm outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 mt-2 flex-wrap px-1">
            {suggestions.map(s => (
              <button 
                key={s} type="button" 
                onClick={() => setForm(f => ({ ...f, name: s }))}
                className="text-[9px] px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-muted font-black uppercase tracking-widest hover:text-accent hover:border-accent/40 transition-all hover:bg-accent/5 active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
           <label className="text-[9px] text-muted uppercase tracking-[0.3em] font-black px-1">Fiscal Target</label>
           <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent font-black text-lg transition-colors">₹</span>
              <input
                required
                type="number"
                min="1"
                placeholder="Target Amount..."
                value={form.target}
                onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                className="w-full bg-secondary border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-white placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent font-black tracking-tight text-xl outline-none transition-all shadow-inner"
              />
           </div>
        </div>

        <div className="space-y-3">
           <label className="text-[9px] text-muted uppercase tracking-[0.3em] font-black px-1">Completion Deadline</label>
           <DatePicker
             selected={form.deadline}
             onChange={date => setForm(f => ({ ...f, deadline: date }))}
             minDate={new Date()}
             placeholderText="Pick a date..."
           />
        </div>

        <button
          type="submit"
          disabled={loading || !form.deadline || !form.name || !form.target}
          className="w-full bg-accent text-primary font-black py-4 rounded-2xl hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 h-16 text-base uppercase tracking-[0.2em] disabled:opacity-30 disabled:grayscale active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
        >
          {loading ? (
             <div className="w-5 h-5 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
             <>
               <Sparkles size={18} />
               <span>Initialize Goal</span>
             </>
          )}
        </button>
      </form>
    </Modal>
  );
}
