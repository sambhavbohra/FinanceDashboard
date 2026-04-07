import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertCircle, Edit3, Trash2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function RequestCard({ request, onAction }) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="p-6 glass-card border-2 border-accent/20 bg-accent/[0.03] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
         {isDelete ? <Trash2 size={48} /> : <Edit3 size={48} />}
      </div>

      <div className="flex items-start gap-5 relative z-10">
         <div className={`p-4 rounded-[20px] ${isDelete ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-accent/10 text-accent border-accent/20'}`}>
            {isDelete ? <AlertCircle size={24} /> : <Edit3 size={24} />}
         </div>
         
         <div className="flex-1">
            <h4 className="text-xl font-black text-white tracking-tighter mb-1 uppercase italic leading-none">
               {isDelete ? 'Delete Approval' : 'Revision Approval'}
            </h4>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted mb-4">Pending Consensus</p>
            
            <div className="space-y-4 mb-6">
               <p className="text-sm text-white/80 font-medium leading-relaxed">
                  <span className="text-accent font-black">{request.requester?.name?.split(' ')[0]}</span> wants to {isDelete ? 'permanently delete' : 'revise'} the expense <span className="font-bold underline decoration-accent/40 italic">"{request.expense?.description || 'Untitled'}"</span> inside your shared group <span className="text-white font-black">{request.group?.name}</span>.
               </p>
               
               {!isDelete && request.pendingData && (
                  <div className="flex items-center gap-4 p-3 bg-black/40 rounded-xl border border-white/5">
                     <div className="text-center flex-1">
                        <p className="text-[8px] font-black uppercase text-muted mb-0.5">Original</p>
                        <p className="text-lg font-black text-white/40 strike-through opacity-40">₹{request.expense?.totalAmount}</p>
                     </div>
                     <ArrowRight size={14} className="text-accent/40" />
                     <div className="text-center flex-1">
                        <p className="text-[8px] font-black uppercase text-accent mb-0.5">Proposed</p>
                        <p className="text-lg font-black text-accent">₹{request.pendingData.totalAmount}</p>
                     </div>
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
