import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertCircle, Edit3, Trash2, ArrowRight, Calendar, Info, CornerDownRight, Clock } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { useFinance } from '../../context/FinanceContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function RequestCard({ request, onAction }) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { user } = useFinance();

  const handleRespond = async (status) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/requests/${request._id}/respond`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast(`Request ${status === 'approved' ? 'accepted' : 'rejected'}`, status === 'approved' ? 'success' : 'info');
      if (onAction) onAction();
    } catch (err) {
      addToast("Failed to process request. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const isDelete = request.type === 'delete';
  const myId = user?._id || user?.id;

  // Comparison Logic
  const oldData = request.expense || {};
  const newData = request.pendingData || {};
  
  const myShareOld = oldData.splits?.find(s => (s.user?._id || s.user) === myId)?.amount;
  const myShareNew = newData.splits?.find(s => (s.user?._id || s.user) === myId)?.amount;
  const shareChanged = myShareOld !== myShareNew;

  const myPayOld = oldData.payers?.find(p => (p.user?._id || p.user) === myId)?.amount;
  const myPayNew = newData.payers?.find(p => (p.user?._id || p.user) === myId)?.amount;
  const payChanged = myPayOld !== myPayNew;

  const oldDateStr = oldData.date ? new Date(oldData.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A';
  const newDateStr = newData.date ? new Date(newData.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A';
  const dateChanged = oldData.date && newData.date && new Date(oldData.date).toDateString() !== new Date(newData.date).toDateString();

  const descChanged = oldData.description !== newData.description;
  const totalChanged = oldData.totalAmount !== newData.totalAmount;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`p-6 glass-card border-2 relative overflow-hidden ${isDelete ? 'border-red-500/20 bg-red-500/[0.02]' : 'border-accent/30 bg-accent/[0.04]'}`}
    >

      <div className="flex items-start gap-5 relative z-10">
         <div className={`p-4 rounded-[22px] border ${isDelete ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-accent/10 text-accent border-accent/20'}`}>
            {isDelete ? <AlertCircle size={24} /> : <Edit3 size={24} />}
         </div>
         
         <div className="flex-1 min-w-0">
            <h4 className="text-xl font-black text-white tracking-tighter mb-1 uppercase italic leading-none">
               {isDelete ? 'Delete Approval' : 'Revision Approval'}
            </h4>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted mb-5">Pending Consensus</p>
            
            <div className="space-y-5 mb-8">
               <p className="text-sm text-white/80 font-medium leading-relaxed">
                  <span className="text-accent font-black">{request.requester?.name?.split(' ')[0]}</span> wants to {isDelete ? 'permanently delete' : 'revise'} the expense <span className="font-bold underline decoration-accent/40 italic">"{oldData.description || 'Untitled'}"</span>.
               </p>
               
               {!isDelete && (
                  <div className="space-y-2">
                     {/* PRIMARY CHANGE: TOTAL OR PERSONAL SHARE */}
                     <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden group">
                        <div className="absolute inset-y-0 left-0 w-1 bg-accent/40" />
                        <div className="text-center flex-1">
                           <p className="text-[8px] font-black uppercase text-muted mb-0.5">Original</p>
                           <p className="text-lg font-black text-white/40 line-through opacity-40">₹{totalChanged ? oldData.totalAmount : (shareChanged ? myShareOld : oldData.totalAmount)}</p>
                        </div>
                        <ArrowRight size={16} className="text-accent/60" />
                        <div className="text-center flex-1">
                           <p className="text-[8px] font-black uppercase text-accent mb-0.5">{totalChanged ? 'Proposed Total' : (shareChanged ? 'Your New Split' : 'Proposed')}</p>
                           <p className="text-2xl font-black text-accent drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]">
                              ₹{totalChanged ? newData.totalAmount : (shareChanged ? myShareNew : newData.totalAmount)}
                           </p>
                        </div>
                     </div>

                     {/* SECONDARY DELTAS */}
                     {(dateChanged || descChanged || (totalChanged && shareChanged)) && (
                        <div className="grid grid-cols-1 gap-2 pl-4 border-l border-white/10">
                           {dateChanged && (
                              <div className="flex items-center gap-2 text-[10px] text-muted font-bold">
                                 <Clock size={12} className="text-accent/60" />
                                 <span>Date: {oldDateStr}</span>
                                 <ArrowRight size={10} />
                                 <span className="text-white">{newDateStr}</span>
                              </div>
                           )}
                           {descChanged && (
                              <div className="flex items-center gap-2 text-[10px] text-muted font-bold">
                                 <Info size={12} className="text-accent/60" />
                                 <span className="truncate max-w-[150px]">Desc: {newData.description}</span>
                              </div>
                           )}
                           {totalChanged && shareChanged && (
                              <div className="flex items-center gap-2 text-[10px] text-muted font-bold">
                                 <CornerDownRight size={12} className="text-accent/60" />
                                 <span>Your Share: ₹{myShareOld} → ₹{myShareNew}</span>
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               )}
            </div>

            <div className="flex gap-3">
               <button
                  disabled={loading}
                  onClick={() => handleRespond('approved')}
                  className="flex-1 py-4 bg-accent text-primary rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-2"
               >
                  <Check size={14} strokeWidth={4} /> Accept & Apply
               </button>
               <button
                  disabled={loading}
                  onClick={() => handleRespond('rejected')}
                  className="px-6 py-4 bg-white/5 text-muted hover:text-red-400 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-400/10 active:scale-95 transition-all"
               >
                  <X size={14} strokeWidth={4} /> Reject
               </button>
            </div>
         </div>
      </div>
   </motion.div>
  );
}
