import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import DatePicker from '../ui/DatePicker';
import axios from 'axios';
import { Tag, Info, Sparkles, ChevronDown, Plus, Minus, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Entertainment', 'Subscriptions', 'Other'];

export default function AddExpenseModal({ isOpen, onClose, group, currentUser, onAdded, initialExpense }) {
  const [form, setForm] = useState({
    description: '',
    totalAmount: '',
    category: 'Food',
    customCategory: '',
    date: new Date(),
    splitType: 'equal', // equal | custom
  });
  
  const [payers, setPayers] = useState([]);
  const [customSplits, setCustomSplits] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { fetchData } = useFinance();

  useEffect(() => {
    if (isOpen && group && currentUser) {
      if (initialExpense) {
        setForm({
          description: initialExpense.description || '',
          totalAmount: initialExpense.totalAmount || '',
          category: CATEGORIES.includes(initialExpense.category) ? initialExpense.category : 'Other',
          customCategory: CATEGORIES.includes(initialExpense.category) ? '' : initialExpense.category,
          date: new Date(initialExpense.date || Date.now()),
          splitType: 'custom', 
        });
        
        const mappedPayers = initialExpense.payers.map(p => ({
          user: p.user?._id || p.user,
          amount: parseFloat(p.amount)
        }));
        setPayers(mappedPayers);
        
        const initialSplits = {};
        initialExpense.splits.forEach(s => {
          initialSplits[s.user?._id || s.user] = parseFloat(s.amount);
        });
        setCustomSplits(initialSplits);
      } else {
        setForm({
           description: '',
           totalAmount: '',
           category: 'Food',
           customCategory: '',
           date: new Date(),
           splitType: 'equal',
        });
        const uId = currentUser._id || currentUser.id;
        setPayers([{ user: uId, amount: 0 }]);
        setCustomSplits({});
      }
    }
  }, [isOpen, group, currentUser, initialExpense]);

  const updatePayerAmount = (userId, amount) => {
    setPayers(prev => prev.map(p => p.user === userId ? { ...p, amount: parseFloat(amount) || 0 } : p));
  };

  const togglePayer = (userId) => {
    setPayers(prev => {
      const exists = prev.find(p => p.user === userId);
      if (exists) {
        if (prev.length === 1) return prev;
        return prev.filter(p => p.user !== userId);
      }
      return [...prev, { user: userId, amount: 0 }];
    });
  };

  const totalPaid = payers.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const amountToSplit = parseFloat(form.totalAmount) || 0;
  const isPaidMatched = Math.abs(totalPaid - amountToSplit) < 0.01;

  const totalCustomSplit = Object.values(customSplits).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
  const isSplitMatched = form.splitType === 'equal' || Math.abs(totalCustomSplit - amountToSplit) < 0.01;

  const updateCustomSplit = (userId, amount) => {
    setCustomSplits(prev => ({ ...prev, [userId]: parseFloat(amount) || 0 }));
  };

  if (!group) return null;
  const members = (group.members || []).filter(m => m);

  const buildSplits = () => {
    if (form.splitType === 'equal') {
      const share = amountToSplit / members.length;
      return members.map(m => ({ user: m._id, amount: parseFloat(share.toFixed(2)), paid: false }));
    }
    return members.map(m => ({ user: m._id, amount: parseFloat(customSplits[m._id] || 0), paid: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.description || !amountToSplit) return;
    if (!isPaidMatched) return setError(`Paid amount (₹${totalPaid.toFixed(2)}) doesn't match total`);
    if (!isSplitMatched) return setError(`Split amounts (₹${totalCustomSplit.toFixed(2)}) don't match total`);

    setLoading(true);
    try {
      const finalCategory = form.category === 'Other' ? form.customCategory || 'Other' : form.category;
      
      const payload = {
        description: form.description,
        totalAmount: amountToSplit,
        payers: payers.filter(p => p.amount > 0),
        splits: buildSplits(),
        category: finalCategory,
        date: form.date.toISOString(),
      };

      let res;
      if (initialExpense) {
         res = await axios.put(`${API_URL}/groups/${group._id}/expenses/${initialExpense._id}`, payload);
      } else {
         res = await axios.post(`${API_URL}/groups/${group._id}/expenses`, payload);
      }
      
      onAdded(res.data);
      await fetchData();
      onClose();
    } catch (e) { 
       setError(e.response?.data?.message || 'Failed to save expense');
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${initialExpense ? 'Edit Split' : 'Add Split'} — ${group.emoji} ${group.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="space-y-4">
          <div className="relative group">
            <input
              required
              placeholder="What was this for?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-secondary border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all pl-11 shadow-sm font-bold"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors">
               <Info size={16} />
            </div>
          </div>

          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors font-bold text-sm">₹</span>
            <input
              required
              type="number" min="0.01" step="0.01"
              placeholder="Total Amount"
              value={form.totalAmount}
              onChange={e => {
                 setForm(f => ({ ...f, totalAmount: e.target.value }));
                 if (payers.length === 1) setPayers([{ user: payers[0].user, amount: parseFloat(e.target.value) || 0 }]);
              }}
              className="w-full bg-secondary border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all font-semibold shadow-sm text-lg"
            />
          </div>

          <div className="space-y-3 bg-white/3 rounded-2xl p-4 border border-white/5">
             <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Paid by</label>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPaidMatched ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                   Total Paid: ₹{totalPaid.toFixed(2)}
                </div>
             </div>
             
             <div className="flex flex-wrap gap-2 mb-4">
                {members.map(m => {
                   const isSelected = payers.some(p => p.user === m._id);
                   return (
                      <button
                        key={m._id} type="button"
                        onClick={() => togglePayer(m._id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold ${
                           isSelected ? 'bg-accent/15 border-accent/30 text-accent' : 'bg-white/3 border-white/5 text-muted hover:text-white'
                        }`}
                      >
                         {m.name?.split(' ')[0]}
                         {isSelected ? <CheckCircle size={10} /> : <Plus size={10} />}
                      </button>
                   );
                })}
             </div>

             <div className="space-y-3 mt-4">
                {payers.map(p => {
                   const member = members.find(m => m._id === p.user);
                   return (
                      <div key={p.user} className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-accent text-[10px] font-black shrink-0 relative overflow-hidden">
                            {member?.picture ? <img src={member.picture} className="w-full h-full object-cover rounded-lg" alt="" /> : member?.name?.[0]}
                         </div>
                         <div className="flex-1 text-xs text-white/70 font-medium truncate">{member?.name}</div>
                         <div className="relative w-28">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[10px]">₹</span>
                            <input
                              type="number" step="0.01"
                              value={p.amount || ''}
                              onChange={e => updatePayerAmount(p.user, e.target.value)}
                              className="w-full bg-[#1c1c1e] border border-white/5 rounded-lg py-1.5 pl-7 pr-2 text-white text-xs focus:ring-1 focus:ring-accent/50 outline-none"
                              placeholder="0"
                            />
                         </div>
                      </div>
                   );
                })}
             </div>
          </div>

          {/* SPLIT TYPE SELECTOR */}
          <div className="space-y-3 bg-white/3 rounded-2xl p-4 border border-white/5 overflow-hidden">
             <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Split Strategy</label>
                <div className="flex bg-secondary p-1 rounded-xl gap-1">
                   <button 
                     type="button" 
                     onClick={() => setForm(f => ({ ...f, splitType: 'equal' }))}
                     className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${form.splitType === 'equal' ? 'bg-accent text-primary' : 'text-muted'}`}
                   >
                     Equal
                   </button>
                   <button 
                     type="button" 
                     onClick={() => setForm(f => ({ ...f, splitType: 'custom' }))}
                     className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${form.splitType === 'custom' ? 'bg-accent text-primary' : 'text-muted'}`}
                   >
                     Unequal
                   </button>
                </div>
             </div>

             {form.splitType === 'custom' ? (
                <div className="space-y-3 animate-in slide-in-from-bottom-2">
                   <div className="flex justify-between items-center mb-2 px-1">
                      <p className="text-[9px] text-accent/60 font-black uppercase italic">Custom Distribution</p>
                      <span className={`text-[10px] font-black ${isSplitMatched ? 'text-green-400' : 'text-red-400 animate-pulse'}`}>
                         Total: ₹{totalCustomSplit.toFixed(2)}
                      </span>
                   </div>
                   {members.map(m => (
                      <div key={m._id} className="flex items-center gap-3 animate-in slide-in-from-left-2 transition-all">
                         <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 text-[10px] font-black shrink-0 relative overflow-hidden">
                            {m.picture ? <img src={m.picture} className="w-full h-full object-cover rounded-lg opacity-40" alt="" /> : m.name?.[0]}
                         </div>
                         <div className="flex-1 text-xs text-white/70 font-medium truncate">{m.name}</div>
                         <div className="relative w-28">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[10px]">₹</span>
                            <input
                              type="number" step="0.01"
                              value={customSplits[m._id] || ''}
                              onChange={e => updateCustomSplit(m._id, e.target.value)}
                              className="w-full bg-[#1c1c1e] border border-white/5 rounded-lg py-1.5 pl-7 pr-2 text-white text-xs focus:ring-1 focus:ring-accent/50 outline-none"
                              placeholder="0"
                            />
                         </div>
                      </div>
                   ))}
                </div>
             ) : (
                <p className="text-[10px] text-muted font-medium italic text-center py-2">
                   Amount will be split exactly as ₹{(amountToSplit / (members.length || 1)).toFixed(2)} each.
                </p>
             )}
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="relative group">
               <select
                 value={form.category}
                 onChange={e => setForm(f => ({ ...f, category: e.target.value, customCategory: '' }))}
                 className="w-full bg-secondary border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all pl-11 shadow-sm appearance-none text-[12px] font-bold"
               >
                 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors">
                  <Tag size={16} />
               </div>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none group-focus-within:text-accent transition-colors">
                  <ChevronDown size={14} />
               </div>
             </div>

             <DatePicker
               selected={form.date}
               onChange={date => setForm(f => ({ ...f, date }))}
               maxDate={new Date()}
             />
          </div>

          {(form.category === 'Other' || !CATEGORIES.includes(form.category)) && (
             <div className="relative group animate-in slide-in-from-top-2 duration-300">
                <input
                  required
                  placeholder="Detail (e.g. Laundry)"
                  value={form.customCategory}
                  onChange={e => setForm(f => ({ ...f, customCategory: e.target.value }))}
                  className="w-full bg-secondary/60 border border-accent/20 rounded-xl py-2.5 px-4 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all pl-11 shadow-inner text-sm italic"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/60 group-focus-within:text-accent transition-colors">
                   <Sparkles size={14} />
                </div>
             </div>
          )}
        </div>

        {error && (
           <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold">
              <AlertCircle size={14} />
              {error}
           </div>
        )}

        <button type="submit" disabled={loading || !form.description || !form.totalAmount || !isPaidMatched || !isSplitMatched}
          className="w-full bg-accent text-primary font-black py-4 rounded-2xl hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 active:scale-[0.98] mt-4 flex items-center justify-center h-16 text-lg uppercase tracking-widest disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed">
          {loading ? (
             <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          ) : 'Save Split'}
        </button>
      </form>
    </Modal>
  );
}
