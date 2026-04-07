import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Inbox, Sparkles, AlertCircle } from 'lucide-react';
import axios from 'axios';
import RequestCard from '../components/splits/RequestCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Decisions() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/requests/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingRequests(res.data);
    } catch (e) {
      console.error('Fetch decisions error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-10 pb-20 md:pb-0 max-w-4xl mx-auto">
      <header className="flex flex-col gap-4">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                 <Gavel size={20} strokeWidth={3} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Consensus Hub</p>
           </div>
           <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase leading-none">
             Democratic <span className="text-accent underline decoration-4 underline-offset-8">Decisions</span>
           </h1>
           <p className="text-muted text-xs font-bold mt-6 max-w-xl leading-relaxed">
             Review and approve changes to tracked splits. Every modification—whether an edit or deletion—requires unanimous consensus from all impacted members of your squad.
           </p>
        </div>
      </header>

      <div className="pt-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
               <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-6" />
               <p className="text-[10px] font-black uppercase tracking-widest text-muted">Scanning for consensus signals...</p>
            </motion.div>
          ) : pendingRequests.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} 
               animate={{ opacity: 1, scale: 1 }}
               className="glass-card p-24 text-center border-dashed border-white/10 opacity-60 bg-white/2"
            >
               <div className="w-24 h-24 rounded-[40px] bg-white/5 flex items-center justify-center mb-8 mx-auto relative">
                  <Inbox className="text-white/20" size={48} strokeWidth={1.5} />
                  <div className="absolute top-0 right-0 w-3 h-3 bg-secondary rounded-full border-2 border-[#141414]" />
               </div>
               <h3 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase tracking-widest">Consensus Achieved</h3>
               <p className="text-muted text-sm font-bold max-w-xs mx-auto font-mono">ALL SHARED LEDGERS ARE CURRENTLY IN PERFECT HARMONY</p>
            </motion.div>
          ) : (
            <div className="space-y-8">
               <div className="flex items-center gap-3 px-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_#E2FE74]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white opacity-40">Active Voting Rounds ({pendingRequests.length})</p>
               </div>
               <div className="grid grid-cols-1 gap-6">
                 {pendingRequests.map(req => (
                   <RequestCard key={req._id} request={req} onAction={fetchRequests} />
                 ))}
               </div>

               <div className="glass-card p-8 border-accent/10 bg-accent/5 flex items-start gap-5">
                  <div className="p-3 rounded-xl bg-accent/10 text-accent">
                     <AlertCircle size={20} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1 italic">Protocol Warning</p>
                     <p className="text-xs text-white/60 font-medium leading-relaxed">
                        Once you approve an action, it cannot be reversed unless another request is initiated. All changes instantly reflect in everyone's private transaction ledger.
                     </p>
                  </div>
               </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 40px;
        }
      `}</style>
    </div>
  );
}
