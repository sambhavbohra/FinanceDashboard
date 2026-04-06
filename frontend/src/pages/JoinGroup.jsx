import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Users, CheckCircle, ArrowRight, Sparkles, UserPlus, Info } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function JoinGroup() {
  const { token } = useParams();
  const { user } = useFinance();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | preview | joining | joined | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchGroup();
  }, [token]);

  const fetchGroup = async () => {
    try {
      const res = await axios.get(`${API_URL}/groups/invite/${token}`);
      setGroup(res.data);
      setStatus('preview');
    } catch {
      setStatus('error');
      setErrorMsg('This invite link is invalid or has expired.');
    }
  };

  const handleJoin = async () => {
    if (!user) {
       // Save token and prompt login
       sessionStorage.setItem('joinToken', token);
       navigate('/login', { state: { from: `/join/${token}` } });
       return;
    }
    
    setStatus('joining');
    try {
      await axios.post(`${API_URL}/groups/join/${token}`);
      setStatus('joined');
      setTimeout(() => navigate('/splits', { replace: true }), 1500);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.message || 'Could not join group.');
    }
  };

  const alreadyMember = group?.members?.some(m => m._id === user?._id);

  return (
    <div className="min-h-screen bg-[#0C0C0C] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card p-10 w-full max-w-md text-center relative z-10 border border-white/5 shadow-2xl backdrop-blur-3xl"
      >
        {status === 'loading' && (
          <div className="py-12 flex flex-col items-center gap-4">
             <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
             <p className="text-muted font-bold text-sm uppercase tracking-widest">Validating Invite...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
               <Info size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Invite Invalid</h2>
            <p className="text-muted text-sm mb-8 px-4">{errorMsg}</p>
            <button onClick={() => navigate('/splits')} className="w-full bg-white/5 border border-white/10 text-white font-bold py-3 rounded-2xl hover:bg-white/10 transition-all">
               Go to Dashboard
            </button>
          </div>
        )}

        {(status === 'preview' || status === 'joining') && group && (
          <>
            <div className="relative inline-block mb-6">
               <div className="w-24 h-24 rounded-[36px] bg-secondary border-4 border-white/5 flex items-center justify-center text-5xl shadow-inner relative z-10">
                 {group.emoji}
               </div>
               <div className="absolute -bottom-2 -right-2 bg-accent p-2 rounded-2xl shadow-xl z-20 border-4 border-[#141414]">
                  <UserPlus size={20} className="text-primary" />
               </div>
            </div>

            <h1 className="text-3xl font-black text-white mb-2 tracking-tighter leading-tight">{group.name}</h1>
            <p className="text-muted text-xs font-black uppercase tracking-[0.2em] mb-8">
               Created by <span className="text-accent underline decoration-accent/30 underline-offset-4">{group.createdBy?.name || 'A FinTracker'}</span>
            </p>

            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 mb-8 relative group overflow-hidden">
               <p className="text-muted text-[10px] font-black uppercase tracking-widest mb-4">Current Squad — {group.members?.length} Members</p>
               <div className="flex justify-center -space-x-3 mb-1">
                 {group.members?.slice(0, 6).map((m, idx) => (
                   <div key={m._id} className="w-12 h-12 rounded-2xl bg-secondary border-[3px] border-[#1C1C1E] flex items-center justify-center text-accent text-sm font-black shadow-lg overflow-hidden transition-transform group-hover:translate-x-1" style={{ zIndex: 10 - idx }}>
                     {m.picture ? <img src={m.picture} className="w-full h-full object-cover" alt="" /> : m.name?.[0]?.toUpperCase()}
                   </div>
                 ))}
                 {group.members?.length > 6 && (
                    <div className="w-12 h-12 rounded-2xl bg-[#2C2C2E] border-[3px] border-[#1C1C1E] flex items-center justify-center text-muted text-xs font-black z-0 shadow-lg">
                       +{group.members.length - 6}
                    </div>
                 )}
               </div>
               <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-accent/5 rounded-full blur-xl group-hover:scale-150 transition-all" />
            </div>

            <AnimatePresence mode="wait">
               {alreadyMember ? (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                   <div className="flex items-center justify-center gap-2 text-green-400 text-xs font-bold uppercase tracking-widest bg-green-400/10 py-2 rounded-xl border border-green-400/10">
                     <CheckCircle size={14} /> You're already a member
                   </div>
                   <button onClick={() => navigate('/splits')} className="w-full bg-accent text-primary font-black py-4 rounded-2xl hover:bg-accent/90 transition-all shadow-[0_4px_25px_rgba(226,254,116,0.3)] hover:scale-[1.02] active:scale-[0.98]">
                     Go to My Splits
                   </button>
                 </motion.div>
               ) : (
                 <button
                   onClick={handleJoin}
                   disabled={status === 'joining'}
                   className="w-full h-16 flex items-center justify-center gap-3 bg-accent text-primary text-lg font-black rounded-2xl hover:bg-accent/90 transition-all shadow-[0_8px_30px_rgba(226,254,116,0.25)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 group"
                 >
                   {status === 'joining' ? (
                      <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                   ) : (
                      <>
                        Accept & Join Group 
                        <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1.5 transition-transform" />
                      </>
                   )}
                 </button>
               )}
            </AnimatePresence>
            {!user && (
               <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-6 bg-white/5 py-2 px-4 rounded-full inline-block mx-auto border border-white/5">
                  Secure login required to join
               </p>
            )}
          </>
        )}

        {status === 'joined' && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-10">
            <div className="w-20 h-20 bg-green-400/20 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-400/20 border border-green-400/10">
               <CheckCircle size={40} className="text-green-400 shrink-0" strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">You're in!</h2>
            <p className="text-muted font-bold text-sm mb-6">Setting up your shared workspace...</p>
            <div className="w-full max-w-[100px] h-1.5 bg-white/10 rounded-full mx-auto overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }} 
                 animate={{ width: '100%' }} 
                 transition={{ duration: 1.5 }}
                 className="h-full bg-accent"
               />
            </div>
          </motion.div>
        )}
      </motion.div>
      
      {/* Footer Branding */}
      <div className="mt-8 relative z-10 flex flex-col items-center">
         <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-xs">₹</div>
            <span className="text-white font-bold tracking-tight">FinTrack</span>
         </div>
         <p className="text-muted text-[10px] font-black uppercase tracking-[0.4em]">Split Expenses Smartly</p>
      </div>
    </div>
  );
}
