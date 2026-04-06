import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import Modal from '../ui/Modal';
import DatePicker from '../ui/DatePicker';
import axios from 'axios';
import { TrendingDown, TrendingUp, Tag, Wallet, Sparkles, Users, Search, CheckCircle, ChevronDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const CATEGORIES_EXPENSE = ['Food', 'Travel', 'Subscriptions', 'Shopping', 'Education', 'Entertainment', 'Borrow', 'Other'];
const CATEGORIES_INCOME = ['Allowance', 'Freelance', 'Part-time', 'Gift', 'Income', 'Other'];

export default function AddTransactionModal({ isOpen, onClose, initialTransaction }) {
  const { addTransaction, editTransaction, user } = useFinance();
  const [form, setForm] = useState({
    type: 'expense',
    name: '',
    amount: '',
    category: 'Food',
    customCategory: '',
    date: new Date(),
  });
  
  const [isSplitting, setIsSplitting] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialTransaction) {
        setForm({
          type: initialTransaction.type || 'expense',
          name: initialTransaction.name || '',
          amount: initialTransaction.amount || '',
          category: (CATEGORIES_EXPENSE.includes(initialTransaction.category) || CATEGORIES_INCOME.includes(initialTransaction.category)) ? initialTransaction.category : 'Other',
          customCategory: (CATEGORIES_EXPENSE.includes(initialTransaction.category) || CATEGORIES_INCOME.includes(initialTransaction.category)) ? '' : initialTransaction.category,
          date: new Date(initialTransaction.date || Date.now()),
        });
        setIsSplitting(false);
      } else {
        setForm({ type: 'expense', name: '', amount: '', category: 'Food', customCategory: '', date: new Date() });
        setIsSplitting(false);
      }
    }
  }, [isOpen, initialTransaction]);

  useEffect(() => {
    if (isOpen && isSplitting && groups.length === 0) {
      fetchGroups();
    }
  }, [isOpen, isSplitting]);

  const fetchGroups = async () => {
    setGroupsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/groups`);
      setGroups(res.data);
      if (res.data.length > 0) setSelectedGroupId(res.data[0]._id);
    } catch (e) {
      console.error(e);
    }
    setGroupsLoading(false);
  };

  const handleTypeChange = (type) => {
    setForm(f => ({ ...f, type, category: type === 'expense' ? 'Food' : 'Allowance', customCategory: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    setLoading(true);
    
    const finalCategory = form.category === 'Other' ? form.customCategory || 'Other' : form.category;
    const amountVal = parseFloat(form.amount);

    try {
       if (isSplitting && selectedGroupId) {
          const group = groups.find(g => g._id === selectedGroupId);
          if (!group) throw new Error('Group not found');

          // SYNC LOGIC: Add to Group and it will auto-add to Personal Expense via Backend sync
          // Actually, I already added sync in Backend routes/groups.js
          await axios.post(`${API_URL}/groups/${selectedGroupId}/expenses`, {
             description: form.name,
             totalAmount: amountVal,
             payers: [{ user: user._id, amount: amountVal }],
             splits: group.members.map(m => ({
                user: m._id,
                amount: amountVal / group.members.length,
                paid: false
             })),
             category: 'Borrow', // Enforce Borrow category for splits as requested
             date: form.date.toISOString(),
          });
       } else {
          // Normal Transaction
          if (initialTransaction) {
             await editTransaction(initialTransaction._id, {
                ...form,
                category: finalCategory,
                amount: amountVal,
                date: form.date.toISOString()
             });
          } else {
             await addTransaction({
               ...form,
               category: finalCategory,
               amount: amountVal,
               date: form.date.toISOString()
             });
          }
       }
       setForm({ type: 'expense', name: '', amount: '', category: 'Food', customCategory: '', date: new Date() });
       setIsSplitting(false);
       onClose();
    } catch (err) {
       console.error(err);
    }
    setLoading(false);
  };

  const categories = form.type === 'expense' ? CATEGORIES_EXPENSE : CATEGORIES_INCOME;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialTransaction ? 'Edit Entry' : 'Add Entry'}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="flex bg-secondary/80 backdrop-blur-md rounded-2xl p-1 gap-1 border border-white/5 shadow-inner">
          {['expense', 'income'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all capitalize border ${
                form.type === type
                  ? type === 'expense' 
                    ? 'bg-red-500/15 border-red-500/20 text-red-500 shadow-sm' 
                    : 'bg-green-500/15 border-green-500/20 text-green-500 shadow-sm'
                  : 'text-muted border-transparent hover:text-white'
              }`}
            >
              {type === 'expense' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              {type}
            </button>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          <div className="relative group">
            <input
              required
              placeholder="Title (e.g. Dinner, Paycheck)"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-secondary border border-white/10 rounded-xl py-4 px-4 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all pl-12 shadow-sm font-bold"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors">
               <Wallet size={18} />
            </div>
          </div>

          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors font-bold text-lg">₹</span>
            <input
              required
              type="number" step="0.01"
              placeholder="Amount"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full bg-secondary border border-white/10 rounded-xl py-4 px-4 pl-10 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all font-black text-2xl shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="relative group">
               <select
                 value={form.category}
                 onChange={e => setForm(f => ({ ...f, category: e.target.value, customCategory: '' }))}
                 className="w-full bg-secondary border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all pl-11 shadow-sm appearance-none text-sm font-bold"
               >
                 {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
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

          {form.category === 'Other' && (
             <div className="relative group animate-in slide-in-from-top-2 duration-300">
               <input
                 required
                 placeholder="Specific detail..."
                 value={form.customCategory}
                 onChange={e => setForm(f => ({ ...f, customCategory: e.target.value }))}
                 className="w-full bg-secondary/60 border border-accent/20 rounded-xl py-2.5 px-4 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all pl-11 shadow-inner text-sm italic font-medium"
               />
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/60 group-focus-within:text-accent transition-colors">
                  <Sparkles size={14} />
               </div>
             </div>
          )}

          {/* Split with Friends Section */}
          {form.type === 'expense' && (
             <div className={`mt-2 rounded-2xl border transition-all overflow-hidden ${isSplitting ? 'bg-accent/5 border-accent/30' : 'bg-white/5 border-white/5'}`}>
               <button
                 type="button"
                 onClick={() => setIsSplitting(!isSplitting)}
                 className="w-full flex items-center justify-between px-4 py-4"
               >
                  <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isSplitting ? 'bg-accent text-primary' : 'bg-secondary text-muted'}`}>
                        <Users size={16} />
                     </div>
                     <div className="text-left">
                        <p className={`text-sm font-black tracking-tight ${isSplitting ? 'text-accent' : 'text-white'}`}>Split with Friends</p>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest leading-none mt-0.5">Post to a shared group</p>
                     </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSplitting ? 'bg-accent border-accent' : 'border-white/20'}`}>
                     {isSplitting && <div className="w-2 h-2 bg-primary rounded-full" />}
                  </div>
               </button>

               {isSplitting && (
                  <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                     {groupsLoading ? (
                        <div className="text-[10px] text-muted text-center py-2 animate-pulse">Fetching Squads...</div>
                     ) : groups.length === 0 ? (
                        <p className="text-[10px] text-red-300 text-center py-2 bg-red-400/10 rounded-lg">No groups found. Go to Splits to create one.</p>
                     ) : (
                        <div className="space-y-3">
                           <label className="text-[10px] text-muted font-black uppercase tracking-widest">Select Group</label>
                           <div className="grid grid-cols-2 gap-2">
                              {groups.slice(0, 4).map(g => (
                                 <button
                                   key={g._id} type="button"
                                   onClick={() => setSelectedGroupId(g._id)}
                                   className={`flex items-center gap-2 p-2 rounded-xl border text-[10px] font-black uppercase transition-all truncate ${selectedGroupId === g._id ? 'bg-accent/20 border-accent text-accent' : 'bg-[#1c1c1e] border-white/5 text-muted hover:text-white'}`}
                                 >
                                    <span className="text-sm">{g.emoji}</span>
                                    <span className="truncate">{g.name}</span>
                                 </button>
                              ))}
                           </div>
                           {groups.length > 4 && (
                              <select 
                                value={selectedGroupId} 
                                onChange={e => setSelectedGroupId(e.target.value)}
                                className="w-full bg-[#1c1c1e] border border-white/5 rounded-xl py-2 px-3 text-[10px] font-bold text-muted outline-none focus:border-accent"
                              >
                                 {groups.map(g => <option key={g._id} value={g._id}>{g.emoji} {g.name}</option>)}
                              </select>
                           )}
                        </div>
                     )}
                  </div>
               )}
             </div>
          )}
        </div>

        <button
          type="submit"
          className={`w-full font-black text-lg py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center h-16 ${isSplitting ? 'bg-accent text-primary' : 'bg-white text-primary'}`}
        >
          {loading ? (
             <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          ) : isSplitting ? 'Post Split (Auto-Sync)' : 'Save Personal Entry'}
        </button>
      </form>
    </Modal>
  );
}
