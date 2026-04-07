import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import DatePicker from '../ui/DatePicker';
import axios from 'axios';
import { Tag, Info, Sparkles, ChevronDown, Plus, Minus, CheckCircle, AlertCircle, Wallet, Zap, Clock, UserCheck } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Entertainment', 'Subscriptions', 'Other'];

export default function BulkSplitModal({ isOpen, onClose, friends, currentUser, onSuccess }) {
  const [form, setForm] = useState({
    description: '',
    totalAmount: '',
    category: 'Food',
    customCategory: '',
    date: new Date(),
    splitType: 'equal', // equal | custom
  });
  
  const [payerSelections, setPayerSelections] = useState([]); // List of userIds who paid
  const [payerAmounts, setPayerAmounts] = useState({}); // { userId: amount }
  const [customSplits, setCustomSplits] = useState({}); 
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const { fetchData } = useFinance();
  const allInvolved = [currentUser, ...friends].filter(Boolean);
  const myId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    if (isOpen && currentUser) {
      setPayerSelections([myId]);
      setPayerAmounts({ [myId]: 0 });
      setCustomSplits({});
    }
  }, [isOpen, currentUser]);

  const amountToDisperse = parseFloat(form.totalAmount) || 0;
  const equalShare = amountToDisperse / allInvolved.length;

  const togglePayer = (userId) => {
     setPayerSelections(prev => {
        const isSelected = prev.includes(userId);
        let newList;
        if (isSelected) {
           if (prev.length === 1) return prev; // Must have at least one payer
           newList = prev.filter(id => id !== userId);
        } else {
           newList = [...prev, userId];
        }
        
        // Auto-allocation if exactly one payer
        if (newList.length === 1 && amountToDisperse > 0) {
           setPayerAmounts({ [newList[0]]: amountToDisperse });
        }
        return newList;
     });
  };

  const totalPaidValue = Object.values(payerAmounts).reduce((a, b) => a + (parseFloat(b) || 0), 0);
  const isPaidMatched = Math.abs(totalPaidValue - amountToDisperse) < 0.01;

  const totalSplitValue = form.splitType === 'equal' 
    ? amountToDisperse 
    : (Object.values(customSplits).reduce((a, b) => a + (parseFloat(b) || 0), 0));
  
  const isSplitMatched = form.splitType === 'equal' || Math.abs(totalSplitValue - amountToDisperse) < 0.01;

  const handleDisperse = async (e) => {
    e.preventDefault();
    if (!form.description || !amountToDisperse || friends.length === 0) return;
    if (!isPaidMatched || !isSplitMatched) return;

    setLoading(true);
    try {
      const finalCategory = form.category === 'Other' ? form.customCategory || 'Other' : form.category;

      for (let i = 0; i < friends.length; i++) {
        const friend = friends[i];
        const groupRes = await axios.post(`${API_URL}/groups/private/${friend._id}`);
        const group = groupRes.data;

        const friendShare = form.splitType === 'equal' ? equalShare : (parseFloat(customSplits[friend._id]) || 0);
        const myShareByRatio = form.splitType === 'equal' ? equalShare : (parseFloat(customSplits[myId]) || 0) / friends.length;

        const expensePayers = [];
        const myPaid = parseFloat(payerAmounts[myId] || 0);
        const friendPaid = parseFloat(payerAmounts[friend._id] || 0);

        if (myPaid > 0) {
           const shareOfPayment = (myPaid / amountToDisperse) * (friendShare + myShareByRatio);
           expensePayers.push({ user: myId, amount: shareOfPayment });
        }
        if (friendPaid > 0) {
           const shareOfPayment = (friendPaid / amountToDisperse) * (friendShare + myShareByRatio);
           expensePayers.push({ user: friend._id, amount: shareOfPayment });
        }

        const payload = {
          description: form.description,
          totalAmount: friendShare + myShareByRatio,
          payers: expensePayers,
          splits: [
            { user: myId, amount: myShareByRatio, paid: false },
            { user: friend._id, amount: friendShare, paid: false }
          ],
          category: finalCategory,
          date: form.date.toISOString()
        };

        await axios.post(`${API_URL}/groups/${group._id}/expenses`, payload);
        setProgress(((i + 1) / friends.length) * 100);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError('Disperse failed. Check squad selection.');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Squad Disperse — Multi-Split Engine">
      <form onSubmit={handleDisperse} className="pt-2 flex flex-col max-h-[85vh]">
        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar pb-6" style={{ maxHeight: 'calc(85vh - 120px)' }}>
           
           <div className="flex items-center gap-4 p-4 bg-accent/10 border border-accent/20 rounded-2xl">
              <Zap className="text-accent" size={24} />
              <p className="text-[11px] text-white/80 font-medium leading-relaxed">
                Fragmenting a single bill into <span className="text-accent font-black italic">separate 1-on-1 ledgers</span>. No group bloat.
              </p>
           </div>

           <div className="space-y-4">
             <div className="relative group">
               <input
                 required placeholder="What was this for?"
                 value={form.description}
                 onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                 className="w-full bg-secondary border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent font-bold pl-11 shadow-sm"
               />
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent"><Info size={16} /></div>
             </div>

             <div className="relative group">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent font-black text-sm">₹</span>
               <input
                 required type="number" min="0.01" step="0.01"
                 placeholder="Total Amount"
                 value={form.totalAmount}
                 onChange={e => {
                    const val = e.target.value;
                    setForm(f => ({ ...f, totalAmount: val }));
                    if (payerSelections.length === 1) {
                       setPayerAmounts({ [payerSelections[0]]: parseFloat(val) || 0 });
                    }
                 }}
                 className="w-full bg-secondary border border-white/10 rounded-xl py-4 pl-10 pr-4 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent font-black shadow-sm text-2xl"
               />
             </div>

             {/* PAID BY (Toggled selector) */}
             <div className="space-y-4 bg-white/3 rounded-3xl p-5 border border-white/5 shadow-inner">
                <div className="flex justify-between items-center mb-1 px-1">
                   <label className="text-[10px] text-muted uppercase tracking-widest font-black">Paid by</label>
                   <div className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isPaidMatched ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400 animate-pulse'}`}>
                      {isPaidMatched ? 'Matched' : `₹${(totalPaidValue - amountToDisperse).toFixed(0)} diff`}
                   </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                   {allInvolved.map(m => {
                      const isSelected = payerSelections.includes(m._id);
                      return (
                         <button
                           key={m._id} type="button"
                           onClick={() => togglePayer(m._id)}
                           className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-[10px] font-black uppercase ${
                              isSelected ? 'bg-accent/15 border-accent/40 text-accent' : 'bg-white/3 border-white/5 text-muted hover:text-white'
                           }`}
                         >
                            {m.name.split(' ')[0]}
                            {isSelected ? <CheckCircle size={10} /> : <Plus size={10} />}
                         </button>
                      );
                   })}
                </div>

                <div className="space-y-3">
                   {allInvolved.filter(m => payerSelections.includes(m._id)).map(m => (
                      <div key={m._id} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                         <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-accent text-[10px] font-black shrink-0 relative overflow-hidden">
                            {m.picture ? <img src={m.picture} className="w-full h-full object-cover" alt="" /> : m.name?.[0]}
                         </div>
                         <div className="flex-1 text-[11px] text-white font-black uppercase truncate">{m.name} {m._id === myId && '(You)'}</div>
                         <div className="relative w-28">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[10px]">₹</span>
                            <input
                              type="number" step="0.01"
                              value={payerAmounts[m._id] || ''}
                              onChange={e => setPayerAmounts(prev => ({ ...prev, [m._id]: parseFloat(e.target.value) || 0 }))}
                              className="w-full bg-[#1c1c1e] border border-white/5 rounded-lg py-1.5 pl-7 pr-2 text-white text-xs outline-none font-bold"
                              placeholder="0"
                            />
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* SPLIT STRATEGY */}
             <div className="space-y-3 bg-white/3 rounded-3xl p-5 border border-white/5 overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                   <label className="text-[10px] text-muted uppercase tracking-widest font-black">Split Strategy</label>
                   <div className="flex bg-secondary p-1 rounded-xl gap-1">
                      {['equal', 'custom'].map(t => (
                         <button 
                           key={t} type="button" 
                           onClick={() => setForm(f => ({ ...f, splitType: t }))}
                           className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${form.splitType === t ? 'bg-accent text-primary shadow-lg shadow-accent/20' : 'text-muted hover:text-white'}`}
                         >
                           {t}
                         </button>
                      ))}
                   </div>
                </div>

                {form.splitType === 'custom' ? (
                   <div className="space-y-3">
                      <div className="flex justify-between items-center mb-2 px-1">
                         <p className="text-[9px] text-accent/60 font-black uppercase italic">Squad Breakdown</p>
                         <span className={`text-[10px] font-black ${isSplitMatched ? 'text-green-400' : 'text-red-400 animate-pulse'}`}>Matched</span>
                      </div>
                      {allInvolved.map(m => (
                         <div key={m._id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 text-[10px] font-black shrink-0 overflow-hidden">
                               {m.picture ? <img src={m.picture} className="w-full h-full object-cover" alt="" /> : m.name?.[0]}
                            </div>
                            <div className="flex-1 text-[11px] text-white/70 font-bold truncate">{m.name}</div>
                            <div className="relative w-28">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[10px]">₹</span>
                               <input
                                 type="number" step="0.01"
                                 value={customSplits[m._id] || ''}
                                 onChange={e => setCustomSplits(prev => ({ ...prev, [m._id]: parseFloat(e.target.value) || 0 }))}
                                 className="w-full bg-[#1c1c1e] border border-white/5 rounded-lg py-1.5 pl-7 pr-2 text-white text-xs outline-none font-bold placeholder:text-muted/30"
                                 placeholder="0"
                               />
                            </div>
                         </div>
                      ))}
                   </div>
                ) : (
                   <div className="text-center py-3 bg-white/3 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-muted font-bold tracking-tight">
                        Equally dispersed: <span className="text-accent font-black">₹{equalShare.toFixed(2)}</span> each member.
                      </p>
                   </div>
                )}
             </div>

             <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                   <select
                     value={form.category}
                     onChange={e => setForm(f => ({ ...f, category: e.target.value, customCategory: '' }))}
                     className="w-full bg-secondary border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none pl-11 appearance-none text-[12px] font-bold"
                   >
                     {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent"><Tag size={16} /></div>
                </div>
                <DatePicker selected={form.date} onChange={date => setForm(f => ({ ...f, date }))} maxDate={new Date()} />
             </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/5 space-y-3 bg-card shrink-0">
           {error && <div className="p-2.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-xl border border-red-500/20">{error}</div>}
           
           {loading && (
              <div className="space-y-2 mb-2">
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-accent" />
                 </div>
                 <p className="text-[9px] text-muted font-black text-center tracking-widest uppercase italic animate-pulse">Fragmenting squad record...</p>
              </div>
           )}

           <button type="submit" disabled={loading || !form.description || !amountToDisperse || !isPaidMatched || !isSplitMatched}
             className="w-full bg-accent text-primary font-black py-4 rounded-2xl hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 h-16 text-lg uppercase tracking-widest disabled:opacity-30 disabled:grayscale">
             {loading ? 'Dispersing...' : 'Initiate Disperse'}
           </button>
        </div>
      </form>
    </Modal>
  );
}
