import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, UserPlus, Clock, CheckCircle, ChevronRight, ArrowRight, User, X, Sparkles, MessageSquare, MoreHorizontal, CreditCard, Plus, ArrowUpRight, ArrowDownLeft, Calendar, FileText, Trash2 } from 'lucide-react';
import axios from 'axios';
import UserSearch from '../components/splits/UserSearch';
import AddExpenseModal from '../components/splits/AddExpenseModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.abs(n));

const TrendingDownCustom = ({ size, className, rotate = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ transform: `rotate(${rotate}deg)` }}>
    <path d="M23 18l-9-9-4 4-7-7" />
    <path d="M17 18h6v-6" />
  </svg>
);

function FriendDetailModal({ isOpen, onClose, friend, user, onUpdate, balance = 0 }) {
   const { fetchData: globalFetchData } = useFinance();
   const [group, setGroup] = useState(null);
   const [expenses, setExpenses] = useState([]);
   const [loading, setLoading] = useState(true);
   const [showAddSplit, setShowAddSplit] = useState(false);
   const [editingExpense, setEditingExpense] = useState(null);
   const [settling, setSettling] = useState(false);
   const [settleMsg, setSettleMsg] = useState('');

   useEffect(() => {
      if (isOpen && friend) {
         fetchDetails();
      }
   }, [isOpen, friend]);

   const fetchDetails = async () => {
      setLoading(true);
      try {
         // 1. Get/Create private group
         const gRes = await axios.post(`${API_URL}/groups/private/${friend._id}`);
         setGroup(gRes.data);
         
         // 2. Get expenses for this group
         const eRes = await axios.get(`${API_URL}/groups/${gRes.data._id}/expenses`);
         setExpenses(eRes.data);
      } catch (e) {
         console.error(e);
      }
      setLoading(false);
   };

   const handleSettle = async () => {
      if (settling) return;
      setSettleMsg('');
      setSettling(true);
      try {
         const res = await axios.post(`${API_URL}/groups/settle-with/${friend._id}`);
         const { meOwed = 0, otherOwed = 0, netDelta = 0 } = res.data;
         await globalFetchData(); // Refresh global transactions for dashboard
         await fetchDetails();
         onUpdate();
         if (netDelta === 0 && meOwed === 0 && otherOwed === 0) {
            setSettleMsg('Already settled up! No pending amounts.');
         } else {
            setSettleMsg(`✓ Settled! ${netDelta > 0 ? `Received ₹${Math.abs(netDelta).toLocaleString()}` : `Paid ₹${Math.abs(netDelta).toLocaleString()}`}`);
         }
         setTimeout(() => { setSettleMsg(''); onClose(); }, 1800);
      } catch (e) {
         console.error(e);
         setSettleMsg('Settlement failed. Please try again.');
      }
      setSettling(false);
   };

   const handleDeleteExpense = async (expenseId) => {
      if (window.confirm("Are you sure you want to delete this split?")) {
         try {
            await axios.delete(`${API_URL}/groups/${group._id}/expenses/${expenseId}`);
            await globalFetchData();
            await fetchDetails();
            onUpdate();
         } catch (e) {
            console.error(e);
            setSettleMsg("Failed to delete the split.");
            setTimeout(() => setSettleMsg(''), 4000);
         }
      }
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-primary/95 backdrop-blur-3xl" />
         
         <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-[#0f0f0f] border border-white/5 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
         >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-br from-accent/5 to-transparent">
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[35px] bg-secondary flex items-center justify-center text-accent text-3xl font-black shadow-xl">
                     {friend.picture ? <img src={friend.picture} className="w-full h-full object-cover rounded-[35px]" alt="" /> : friend.name?.[0]}
                  </div>
                   <div>
                      <h2 className="text-white text-3xl font-black tracking-tighter leading-tight mb-1">{friend.name}</h2>
                      <div className="flex items-center gap-2">
                         <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em]">Partner in Capital</p>
                         <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                         <p className={`text-[10px] font-black uppercase tracking-widest ${balance > 0 ? 'text-green-400' : balance < 0 ? 'text-red-400' : 'text-muted'}`}>
                            {balance > 0 ? `They owe ₹${Math.abs(balance).toLocaleString()}` : balance < 0 ? `You owe ₹${Math.abs(balance).toLocaleString()}` : 'Settled up'}
                         </p>
                      </div>
                   </div>
               </div>
               <button onClick={onClose} className="p-4 text-muted hover:text-white bg-white/5 rounded-3xl transition-all"><X size={24} /></button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
               {/* Controls */}
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button 
                       onClick={() => setShowAddSplit(true)}
                       className="flex items-center justify-center gap-2 bg-accent text-primary p-4 sm:p-6 rounded-3xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent/20 h-full"
                    >
                       Add Split <Plus size={16} strokeWidth={4} />
                    </button>
                    <button 
                       onClick={handleSettle}
                       disabled={balance === 0 || settling}
                       className={`flex items-center justify-center gap-2 p-4 sm:p-6 rounded-3xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all border h-full ${
                         balance !== 0 && !settling
                         ? 'bg-white/5 text-white hover:bg-white/10 active:scale-95 border-white/5 shadow-lg' 
                         : 'bg-white/2 text-muted/30 border-white/2 opacity-50 cursor-not-allowed'
                       }`}
                    >
                       {settling ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       ) : (
                          <><CreditCard size={16} /> Settle Up</>
                       )}
                    </button>
                    <button 
                       onClick={async () => {
                          if (window.confirm('Delete all split records with this friend? This cannot be undone.')) {
                             await axios.delete(`${API_URL}/groups/${group._id}`);
                             onUpdate();
                             onClose();
                          }
                       }}
                       className="flex items-center justify-center gap-2 bg-red-400/10 text-red-400 p-4 sm:p-6 rounded-3xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:bg-red-400/20 active:scale-95 transition-all border border-red-400/20 h-full"
                    >
                       Reset <span className="hidden sm:inline">Ledger</span> <Trash2 size={16} />
                    </button>
                 </div>
                {settleMsg && (
                   <div className={`text-center text-[11px] font-black uppercase tracking-widest py-3 px-4 rounded-2xl ${
                      settleMsg.startsWith('✓') ? 'bg-green-400/10 text-green-400' :
                      settleMsg.startsWith('Already') ? 'bg-white/5 text-muted' : 'bg-red-400/10 text-red-400'
                   }`}>
                      {settleMsg}
                   </div>
                )}

               {/* Recent History */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-muted text-[10px] font-black uppercase tracking-[0.3em]">Capital Flow History</h3>
                     <span className="text-accent text-[10px] font-black uppercase tracking-widest bg-accent/10 px-3 py-1 rounded-full">Recent {expenses.length} splits</span>
                  </div>

                  <div className="space-y-3">
                     {loading ? (
                        <div className="p-12 flex items-center justify-center text-muted font-black uppercase tracking-[0.2em] text-[10px]">Processing Vault Data...</div>
                     ) : expenses.length === 0 ? (
                        <div className="p-12 text-center glass-card border-dashed border-white/5">
                           <FileText className="mx-auto text-white/10 mb-4" size={32} />
                           <p className="text-muted text-xs font-bold font-mono tracking-widest">NO ASSET TRANSFERS RECORDED</p>
                        </div>
                     ) : (
                        expenses.map(exp => {
                           const IAmPayer = exp.payers[0]?.user?._id === user?._id;
                           return (
                              <div key={exp._id} className="glass-card p-5 bg-white/[0.02] border border-white/5 group hover:bg-white/5 transition-all flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${IAmPayer ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                                       {IAmPayer ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                    </div>
                                    <div>
                                       <p className="text-white font-black text-sm tracking-tight mb-0.5">{exp.description}</p>
                                       <div className="flex items-center gap-2 text-[9px] text-muted font-black uppercase tracking-widest">
                                          <Calendar size={10} /> {new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                          <span className="w-1 h-1 rounded-full bg-white/10" />
                                          {exp.category}
                                       </div>
                                    </div>
                                 </div>
                                  <div className="flex flex-col items-end gap-2">
                                     <div className="text-right">
                                        <p className="text-white font-black font-mono text-lg italic">₹{exp.totalAmount.toLocaleString()}</p>
                                        <p className={`text-[9px] font-black uppercase tracking-[0.1em] ${IAmPayer ? 'text-green-400' : 'text-red-400'}`}>
                                           {IAmPayer ? 'Lent' : 'Borrowed'}
                                        </p>
                                     </div>
                                     <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingExpense(exp); setShowAddSplit(true); }} className="text-muted hover:text-accent text-[10px] uppercase font-bold px-2 py-1 bg-white/5 rounded-md">Edit</button>
                                        <button onClick={() => handleDeleteExpense(exp._id)} className="text-muted hover:text-red-400 text-[10px] uppercase font-bold px-2 py-1 bg-white/5 rounded-md">Delete</button>
                                     </div>
                                  </div>
                              </div>
                           );
                        })
                     )}
                  </div>
               </div>
            </div>

            <AddExpenseModal
               isOpen={showAddSplit}
               onClose={() => { setShowAddSplit(false); setEditingExpense(null); fetchDetails(); }}
               group={group}
               currentUser={user}
               initialExpense={editingExpense}
               onAdded={() => { fetchDetails(); onUpdate(); }}
            />
         </motion.div>
      </div>
   );
}

export default function Friends() {
  const { user, fetchData: globalFetchData } = useFinance();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending_amounts'); 
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    setLoading(true);
    try {
      const [fRes, rRes, bRes] = await Promise.all([
        axios.get(`${API_URL}/friends`),
        axios.get(`${API_URL}/friends/requests`),
        axios.get(`${API_URL}/groups/balances/summary`)
      ]);
      setFriends(fRes.data);
      setRequests(rRes.data);
      setBalances(bRes.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleOpenDetail = (friend) => {
     setSelectedFriend(friend);
     setShowDetail(true);
  };

  const handleRequest = async (requestId, action) => {
    try {
      if (action === 'accept') {
        await axios.patch(`${API_URL}/friends/accept/${requestId}`);
      } else {
        await axios.delete(`${API_URL}/friends/${requestId}`);
      }
      fetchNetworkData();
    } catch (e) {
      console.error(e);
    }
  };

  const totalOwed = balances.filter(b => b.amount > 0).reduce((a, b) => a + b.amount, 0);
  const totalOwe = balances.filter(b => b.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0);

  return (
    <div className="space-y-6 pb-24 md:pb-0 max-w-4xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
             className="text-4xl font-black text-white tracking-tighter leading-none mb-2">
             Squad Network
           </motion.h1>
           <p className="text-muted text-[10px] font-black uppercase tracking-[0.3em] leading-none">Global connectivity dashboard</p>
        </div>
        <div className="flex bg-white/5 p-1.5 rounded-3xl border border-white/5 backdrop-blur-md overflow-x-auto no-scrollbar">
           {['pending_amounts', 'friends', 'requests', 'search'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-accent text-primary shadow-xl shadow-accent/20' : 'text-muted hover:text-white'}`}
              >
                {tab.replace('_', ' ')}
                {tab === 'requests' && requests.length > 0 && <span className="ml-2 bg-red-400 text-white px-2 py-0.5 rounded-md text-[8px] transform rotate-3 inline-block font-mono">{requests.length}</span>}
              </button>
           ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'pending_amounts' && (
          <motion.div key="balances" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-card p-6 bg-gradient-to-br from-green-400/5 to-transparent border-t-4 border-t-green-400/30">
                   <p className="text-muted text-[10px] font-black uppercase tracking-widest mb-1">Incoming</p>
                   <p className="text-4xl font-black text-green-400 tracking-tighter font-mono">{formatCurrency(totalOwed)}</p>
                   <p className="text-[10px] text-green-400/50 mt-2 font-black uppercase tracking-widest leading-none">Net receivables</p>
                </div>
                <div className="glass-card p-6 bg-gradient-to-br from-red-400/5 to-transparent border-t-4 border-t-red-400/30">
                   <p className="text-muted text-[10px] font-black uppercase tracking-widest mb-1">Outgoing</p>
                   <p className="text-4xl font-black text-red-400 tracking-tighter font-mono">{formatCurrency(totalOwe)}</p>
                   <p className="text-[10px] text-red-400/50 mt-2 font-black uppercase tracking-widest leading-none">Net payables</p>
                </div>
             </div>

             <div className="space-y-4">
                <h3 className="text-xs text-muted font-black uppercase tracking-[0.2em] px-1">Debt Matrix</h3>
                {balances.length === 0 ? (
                   <div className="glass-card p-20 flex flex-col items-center justify-center text-center opacity-60 border-dashed border-white/10">
                      <div className="w-16 h-16 rounded-[40px] bg-accent/5 flex items-center justify-center mb-6">
                         <Sparkles size={32} className="text-accent/30" />
                      </div>
                      <h3 className="text-white font-black text-lg mb-1 tracking-tighter">Zero Balance Sheet</h3>
                      <p className="text-muted text-xs max-w-xs font-bold">You are currently clear of all personal debts within your friend circles.</p>
                   </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                       {balances.filter(b => b.user).map(b => (
                          <div 
                            key={b.user._id} 
                            onClick={() => handleOpenDetail(b.user)}
                            className="glass-card p-6 group hover:border-accent/30 transition-all border border-white/5 flex items-center justify-between bg-white/3 cursor-pointer"
                          >
                            <div className="flex items-center gap-5">
                               <div className="relative">
                                  <div className={`w-16 h-16 rounded-[40px] flex items-center justify-center text-2xl font-black shadow-2xl relative transition-transform group-hover:scale-105 ${b.amount > 0 ? 'bg-green-400/10 text-green-400 border-2 border-green-400/20 shadow-green-400/5' : 'bg-red-400/10 text-red-400 border-2 border-red-400/20 shadow-red-400/5'}`}>
                                     {b.user.picture ? <img src={b.user.picture} className="w-full h-full object-cover rounded-[40px]" alt="" /> : b.user.name?.[0]?.toUpperCase()}
                                  </div>
                                  <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-2xl border-[3px] border-[#141414] flex items-center justify-center text-white ${b.amount > 0 ? 'bg-green-400' : 'bg-red-400'}`}>
                                     {b.amount > 0 ? <TrendingDownCustom size={14} className="rotate-180" strokeWidth={3} /> : <TrendingDownCustom size={14} strokeWidth={3} />}
                                  </div>
                               </div>
                               <div>
                                  <h3 className="text-white font-black text-2xl tracking-tighter leading-none mb-2">{b.user.name}</h3>
                                  <div className="flex items-center gap-2">
                                     <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${b.amount > 0 ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                                        {b.amount > 0 ? 'They owe you' : 'You owe them'}
                                     </div>
                                     <span className="text-white font-black font-mono text-lg">{formatCurrency(b.amount)}</span>
                                  </div>
                               </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <span className="text-[10px] text-muted font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">View Ledger</span>
                               <ChevronRight className="text-muted group-hover:text-accent transition-all" size={24} />
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          </motion.div>
        )}

        {activeTab === 'friends' && (
           <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {friends.filter(f => f).length === 0 ? (
                 <div className="col-span-full glass-card p-20 flex flex-col items-center justify-center text-center opacity-60 border-dashed border-white/10">
                    <div className="w-16 h-16 rounded-[40px] bg-white/5 flex items-center justify-center mb-6">
                       <Users size={32} className="text-white/30" />
                    </div>
                    <h3 className="text-white font-black text-lg mb-1 tracking-tighter">Squad is Empty</h3>
                    <p className="text-muted text-xs max-w-xs font-bold font-mono uppercase tracking-widest">Growth phase pending</p>
                    <button onClick={() => setActiveTab('search')} className="mt-6 text-accent text-xs font-black uppercase tracking-widest hover:underline">Find people to add</button>
                 </div>
              ) : (
                friends.filter(f => f).map(friend => {
                  return (
                    <div 
                      key={friend._id} 
                      onClick={() => handleOpenDetail(friend)}
                      className="glass-card p-6 flex items-center gap-5 bg-white/3 hover:bg-white/5 transition-all group cursor-pointer"
                    >
                        <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center text-accent text-xl font-black group-hover:bg-accent group-hover:text-primary transition-all">
                          {friend.picture ? <img src={friend.picture} className="w-full h-full object-cover rounded-3xl" alt="" /> : friend.name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-black text-xl tracking-tight leading-none mb-1 truncate">{friend.name}</p>
                          <p className="text-muted text-[10px] font-black uppercase tracking-widest">@{friend.username || 'user'}</p>
                        </div>
                        <div className="flex gap-2">
                           <button 
                             className="p-3 text-muted hover:text-red-400 group-hover:bg-red-400/5 rounded-2xl transition-all"
                             onClick={(e) => { e.stopPropagation(); /* Optional: Menu */ }}
                           >
                             <MoreHorizontal size={22} />
                           </button>
                        </div>
                    </div>
                  );
                })
               )}
            </motion.div>
         )}

        {activeTab === 'search' && (
           <motion.div key="search" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass-card p-8 bg-gradient-to-br from-accent/5 to-transparent border-t-4 border-t-accent/30 overflow-visible relative z-[100]">
                 <div className="mb-6 flex items-center justify-between">
                    <div>
                       <h3 className="text-white font-black text-2xl tracking-tighter leading-none mb-1">Global User Search</h3>
                       <p className="text-muted text-[10px] font-black uppercase tracking-widest">Connect with other FinTrack users</p>
                    </div>
                    <div className="w-12 h-12 rounded-[20px] bg-accent/20 flex items-center justify-center text-accent">
                       <Search size={24} strokeWidth={3} />
                    </div>
                 </div>
                 
                 <UserSearch 
                    onAdd={() => fetchNetworkData()} 
                    excludeIds={[user?._id]}
                    placeholder="Enter name or username..."
                 />
              </div>

              <div className="p-8 text-center glass-card border-dashed border-white/10 opacity-60">
                 <p className="text-white font-black text-sm mb-1 tracking-tighter uppercase tracking-widest bg-accent shadow px-2 py-1 inline-block -rotate-1 text-primary">Pro Tip</p>
                 <p className="text-muted text-xs mt-3 leading-relaxed">Search to add friends. Once they accept, you can include them in groups and split expenses instantly.</p>
              </div>
           </motion.div>
        )}

        {activeTab === 'requests' && (
           <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {requests.length === 0 ? (
                 <div className="glass-card p-20 flex flex-col items-center justify-center text-center opacity-60 border-dashed border-white/10">
                    <p className="text-white font-black text-lg mb-1 tracking-tighter">No Pending Requests</p>
                    <p className="text-muted text-xs max-w-xs font-bold">You're all caught up! No one is waiting for your confirmation.</p>
                 </div>
              ) : (
                requests.map(req => (
                  <div key={req._id} className="glass-card p-6 flex items-center justify-between border-2 border-accent/20 bg-accent/5">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[32px] bg-accent text-primary flex items-center justify-center text-2xl font-black shadow-xl shrink-0">
                            {req.requester.name?.[0]}
                        </div>
                        <div>
                            <p className="text-white font-black text-2xl tracking-tighter leading-none mb-1">{req.requester.name}</p>
                            <p className="text-[10px] text-accent/60 font-black uppercase tracking-widest">Wants to join your squad</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleRequest(req._id, 'reject')} className="p-4 bg-red-400/10 text-red-400 rounded-2xl hover:bg-red-400/20 transition-all active:scale-95">
                            <X size={24} strokeWidth={3} />
                        </button>
                        <button onClick={() => handleRequest(req._id, 'accept')} className="flex items-center gap-3 bg-accent text-primary px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-95 shadow-2xl shadow-accent/20">
                            Confirm <CheckCircle size={20} strokeWidth={3} />
                        </button>
                      </div>
                  </div>
                ))
              )}
           </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
         {showDetail && selectedFriend && (
            <FriendDetailModal 
               isOpen={showDetail} 
               onClose={() => setShowDetail(false)} 
               friend={selectedFriend}
               user={user}
               onUpdate={fetchNetworkData}
               balance={balances.find(b => b.user?._id === selectedFriend?._id)?.amount || 0}
            />
         )}
      </AnimatePresence>
    </div>
  );
}
