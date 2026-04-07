import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, ArrowLeft, FileText, CheckCircle, ChevronRight, Inbox, Copy, Share, User, Settings, X, Info, Trash2, CreditCard, Sparkles } from 'lucide-react';
import axios from 'axios';
import CreateGroupModal from '../components/splits/CreateGroupModal';
import AddExpenseModal from '../components/splits/AddExpenseModal';
import BulkSplitModal from '../components/splits/BulkSplitModal';
import UserSearch from '../components/splits/UserSearch';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Splits() {
  const { user, fetchData: globalFetchData, editGroup } = useFinance();
  const { confirm } = useConfirm();
  const { addToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [balances, setBalances] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showBulkSplit, setShowBulkSplit] = useState(false);
  const [bulkFriends, setBulkFriends] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showManagement, setShowManagement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(null);
  const [copying, setCopying] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupEmoji, setEditGroupEmoji] = useState('');
  const [testFriendName, setTestFriendName] = useState('');
  const [addingTestFriend, setAddingTestFriend] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchBalances();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${API_URL}/groups`);
      setGroups(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchBalances = async () => {
    try {
      const res = await axios.get(`${API_URL}/groups/balances/summary`);
      setBalances(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchGroupExpenses = async (groupId) => {
    try {
      const res = await axios.get(`${API_URL}/groups/${groupId}/expenses`);
      setExpenses(res.data);
    } catch (e) { console.error(e); }
  };

  const openGroup = async (group) => {
    setSelectedGroup(group);
    setEditGroupName(group.name);
    setEditGroupEmoji(group.emoji);
    setShowManagement(false);
    fetchGroupExpenses(group._id);
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    if (!editGroupName) return;
    const updated = await editGroup(selectedGroup._id, { name: editGroupName, emoji: editGroupEmoji });
    if (updated) {
       setSelectedGroup(updated);
       setGroups(prev => prev.map(g => g._id === updated._id ? updated : g));
       setShowManagement(false);
    }
  };

  const handleDeleteGroup = async () => {
    const isConfirmed = await confirm({
      title: "Protocol: Terminate Group?",
      message: "This will permanently dissolve the communal ledger and remove access for all squad members. This action is irreversible. Proceed?",
      type: "danger"
    });

    if (isConfirmed) {
       try {
          await axios.delete(`${API_URL}/groups/${selectedGroup._id}`);
          setGroups(prev => prev.filter(g => g._id !== selectedGroup._id));
          setSelectedGroup(null);
          setShowManagement(false);
          addToast("Communal ledger dissolved successfully", "success");
       } catch (err) { 
          console.error(err); 
          addToast("Failed to dissolve the communal protocol", "error");
       }
    }
  };

  const handleAddTestFriend = async (e) => {
    e.preventDefault();
    if (!testFriendName) return;
    setAddingTestFriend(true);
    try {
       const res = await axios.post(`${API_URL}/groups/${selectedGroup._id}/test-friends`, { name: testFriendName });
       // We need to re-fetch group to reflect new members
       const groupRes = await axios.get(`${API_URL}/groups/${selectedGroup._id}`);
       setSelectedGroup(groupRes.data);
       setGroups(prev => prev.map(g => g._id === groupRes.data._id ? groupRes.data : g));
       setTestFriendName('');
    } catch (err) { console.error(err); }
    setAddingTestFriend(false);
  };

  const handleSettle = async (expenseId, targetUserId) => {
    setSettling(expenseId);
    try {
      await axios.patch(`${API_URL}/groups/${selectedGroup._id}/expenses/${expenseId}/settle`, { userId: targetUserId });
      await globalFetchData();
      fetchGroupExpenses(selectedGroup._id);
      fetchBalances();
      addToast("Split marked as settled", "success");
    } catch (e) {
      console.error(e);
      addToast(e.response?.data?.message || 'Failed to settle', "error");
    }
    setSettling(null);
  };

  const handleDeleteExpense = async (expenseId) => {
    const isConfirmed = await confirm({
      title: "Request Split Removal?",
      message: "Communal modifications require squad-wide consensus. A revision request will be broadcast to all human members for approval. Initiate protocol?",
      type: "danger"
    });

    if (isConfirmed) {
       try {
          const res = await axios.delete(`${API_URL}/groups/${selectedGroup._id}/expenses/${expenseId}`);
          
          if (res.data.consensusRequired) {
             addToast("Removal request broadcast to squad", "success");
          } else {
             addToast("Split record removed from ledger", "success");
          }
          
          await globalFetchData();
          fetchGroupExpenses(selectedGroup._id);
          fetchBalances();
       } catch (e) {
          console.error(e);
          addToast("Failed to initiate removal protocol", "error");
       }
    }
  };

  const removeMember = async (targetUserId) => {
     const isConfirmed = await confirm({
       title: "Squad Dismissal?",
       message: "This will terminate the member's access to the shared ledger and freeze their pending splits. Proceed?",
       type: "danger"
     });
     if (!isConfirmed) return;
     try {
        const res = await axios.delete(`${API_URL}/groups/${selectedGroup._id}/members/${targetUserId}`);
        setSelectedGroup(res.data);
        setGroups(prev => prev.map(g => g._id === res.data._id ? res.data : g));
        addToast("Member dismissed from squad", "success");
     } catch (e) { 
        console.error(e); 
        addToast("Failed to execute dismissal protocol", "error");
     }
  };

  const copyInviteLink = () => {
     if (!selectedGroup) return;
     const link = `${window.location.origin}/join/${selectedGroup.inviteToken}`;
     navigator.clipboard.writeText(link);
     setCopying(true);
     addToast("Invite link copied to clipboard!", "success");
     setTimeout(() => setCopying(false), 2000);
  };

  const isCreatorOfGroup = (g) => {
    if (!g || !user) return false;
    const creatorId = g.createdBy?._id || g.createdBy;
    const myId = user._id || user.id;
    return creatorId?.toString() === myId?.toString();
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
             className="text-3xl lg:text-4xl font-black text-white mb-2 tracking-tighter flex items-center gap-3">
            {selectedGroup ? (
              <div className="flex items-center gap-4 w-full">
                <button onClick={() => { setSelectedGroup(null); setShowManagement(false); }} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-accent/10 transition-all text-white hover:text-accent shrink-0 border border-white/5 active:scale-90">
                   <ArrowLeft size={20} strokeWidth={3} />
                </button>
                <div className="flex items-center gap-3 min-w-0">
                   <span className="text-2xl shrink-0 drop-shadow-lg">{selectedGroup.emoji}</span>
                   <span className="truncate lg:max-w-none">{selectedGroup.name}</span>
                </div>
                {isCreatorOfGroup(selectedGroup) && (
                   <button 
                     onClick={() => setShowManagement(!showManagement)}
                     className={`p-2.5 rounded-xl transition-all border ml-auto active:scale-90 ${showManagement ? 'bg-accent text-primary border-accent shadow-lg shadow-accent/20' : 'bg-white/5 border-white/10 text-white hover:border-accent/40'}`}
                   >
                      <Settings size={16} />
                   </button>
                )}
              </div>
            ) : (
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-primary shadow-lg shadow-accent/30 drop-shadow-lg">
                     <Users size={22} strokeWidth={3} />
                  </div>
                  <span>Squad Ledgers</span>
               </div>
            )}
          </motion.h1>
          <p className="text-muted text-[10px] font-black uppercase tracking-[0.4em] opacity-60">
             {selectedGroup ? `${selectedGroup.members?.length} ACTIVE PROTOCOLS` : 'DISTRIBUTED CAPITAL DEPLOYMENT'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
           <div className="flex-1 lg:w-80">
              <UserSearch 
                 multi={!selectedGroup}
                 onAdd={async (friendOrArray) => {
                    if (Array.isArray(friendOrArray)) {
                       setBulkFriends(friendOrArray);
                       return;
                    }
                    try {
                       const res = await axios.post(`${API_URL}/groups/private/${friendOrArray._id}`);
                       openGroup(res.data);
                    } catch (e) { console.error(e); }
                 }}
                 placeholder={selectedGroup ? "Quick add..." : "Search squad..."}
              />
           </div>
           
           <div className="flex items-center gap-2">
              {bulkFriends.length > 1 && !selectedGroup && (
                 <motion.button
                   initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                   onClick={() => setShowBulkSplit(true)}
                   className="bg-green-500 text-primary px-3 sm:px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black hover:bg-green-400 transition-all shadow-xl shadow-green-500/20 flex items-center gap-2 uppercase text-[9px] sm:text-[10px] tracking-widest h-12 sm:h-14 shrink-0 active:scale-95"
                 >
                    <Sparkles size={14} className="hidden sm:inline" />
                    <span>Fast Disperse</span>
                 </motion.button>
              )}

              <motion.button
                onClick={() => selectedGroup ? setShowAddExpense(true) : setShowCreateGroup(true)}
                className="hidden lg:flex bg-accent text-primary px-6 py-4 rounded-2xl font-black hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 items-center justify-center gap-2 uppercase text-[10px] tracking-widest h-14 shrink-0 active:scale-95"
              >
                <Plus size={20} strokeWidth={4} />
                <span>{selectedGroup ? 'Initiate Split' : 'Register Squad'}</span>
              </motion.button>
           </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {!selectedGroup ? (
          <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            {/* Balance Hub - Scrollable on Mobile */}
            <div className="flex lg:grid lg:grid-cols-2 gap-4 overflow-x-auto no-scrollbar snap-x -mx-5 px-5 lg:mx-0 lg:px-0">
               <div className="flex-shrink-0 w-[85vw] lg:w-auto snap-center glass-card p-6 border-l-4 border-l-green-500 bg-green-500/5 shadow-2xl shadow-green-500/5 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-muted text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Collectable Signals</p>
                  <p className="text-4xl font-black text-green-400 tracking-tight">{formatCurrency((balances || []).filter(b => b.amount > 0).reduce((a, b) => a + b.amount, 0))}</p>
               </div>
               <div className="flex-shrink-0 w-[85vw] lg:w-auto snap-center glass-card p-6 border-l-4 border-l-red-500 bg-red-500/5 shadow-2xl shadow-red-500/5 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-muted text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Pending Obligations</p>
                  <p className="text-4xl font-black text-red-500 tracking-tight">{formatCurrency((balances || []).filter(b => b.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0))}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.length === 0 && !loading && (
                 <div className="col-span-full glass-card p-20 flex flex-col items-center justify-center text-center border-dashed border-white/10 opacity-60">
                    <Inbox className="text-muted mb-6" size={48} strokeWidth={1} />
                    <h3 className="text-xl font-black text-white uppercase tracking-widest">No Active Squads</h3>
                    <p className="text-muted text-[10px] font-bold mt-2 uppercase tracking-[0.2em]">REGISTER A NEW GROUP TO INITIALIZE LEDGER TRACKING</p>
                 </div>
              )}
              {groups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => openGroup(group)}
                  className="glass-card p-8 text-left hover:border-accent/40 bg-white/2 transition-all group relative overflow-hidden active:scale-[0.98]"
                >
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-accent/20 group-hover:bg-accent transition-colors" />
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-16 h-16 rounded-3xl bg-secondary border border-white/5 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform duration-500">{group.emoji}</div>
                     {isCreatorOfGroup(group) && (
                        <div className="bg-accent/10 border border-accent/20 text-accent text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Creator</div>
                     )}
                  </div>
                  <h3 className="text-white font-black text-2xl tracking-tighter mb-2 truncate group-hover:text-accent transition-colors">{group.name}</h3>
                  <div className="flex items-center gap-3">
                     <Users size={12} className="text-muted" />
                     <p className="text-muted text-[10px] font-black uppercase tracking-widest">{group.members?.length} Agents Active</p>
                  </div>
                  
                  <div className="flex justify-between items-end mt-8">
                    <div className="flex -space-x-3">
                      {group.members?.filter(m => m).slice(0, 4).map(m => (
                          <div key={m._id} className="w-9 h-9 rounded-xl bg-secondary border-4 border-[#0c0c0c] flex items-center justify-center text-accent text-[9px] font-black relative overflow-hidden group-hover:border-accent/10 transition-colors">
                             {m.picture ? <img src={m.picture} className="w-full h-full object-cover" alt="" /> : (m.name ? m.name[0] : '?')}
                          </div>
                      ))}
                      {group.members?.length > 4 && (
                         <div className="w-9 h-9 rounded-xl bg-secondary border-4 border-[#0c0c0c] flex items-center justify-center text-muted text-[10px] font-black relative z-10">
                            +{group.members.length - 4}
                         </div>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-accent group-hover:text-primary transition-all active:scale-90">
                       <ChevronRight size={20} strokeWidth={3} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="group" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {showManagement && isCreatorOfGroup(selectedGroup) && (
                <div className="glass-card p-6 border-red-400/30 bg-red-400/5 scale-up-center mb-6">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="text-white font-black text-lg">Manage Group</h3>
                      <button 
                        onClick={async () => {
                           const isConfirmed = await confirm({
                              title: "Purge Group?",
                              message: "PERMANENTLY DELETE THIS GROUP? All data will be lost.",
                              type: "danger"
                           });
                           if (isConfirmed) {
                              await axios.delete(`${API_URL}/groups/${selectedGroup._id}`);
                              setSelectedGroup(null);
                              fetchGroups();
                              addToast("Group purged", "success");
                           }
                        }}
                        className="px-4 py-2 bg-red-400 text-primary font-black uppercase text-[10px] rounded-xl hover:scale-105 transition-all shadow-xl shadow-red-400/20"
                      >
                         Delete Group
                      </button>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedGroup.members?.filter(m => m).map(m => (
                          <div key={m._id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl">
                             <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white/80">{m.name || 'Agent'}</span>
                                {m.isTest && <div className="bg-accent/20 text-accent text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase">Test Friend</div>}
                             </div>
                            {m._id !== user?._id && (
                               <button onClick={() => removeMember(m._id)} className="p-2 text-red-400 hover:bg-red-400/20 rounded-xl transition-all"><Trash2 size={16} /></button>
                            )}
                         </div>
                      ))}
                   </div>
                   <div className="mt-8 pt-8 border-t border-white/5">
                      <div className="flex justify-between items-center mb-4">
                         <p className="text-[10px] text-muted font-black uppercase tracking-widest">Global Invite Portal</p>
                         <button 
                            onClick={copyInviteLink} 
                            className={`text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all ${copying ? 'bg-green-400 text-primary' : 'bg-white/5 text-accent hover:bg-white/10'}`}
                         >
                            {copying ? 'Link Copied!' : 'Copy Invite Link'}
                         </button>
                      </div>
                      <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-4">Add Test Friend (Offline Partner)</p>
                      <form onSubmit={handleAddTestFriend} className="flex gap-2">
                         <input 
                            value={testFriendName} 
                            onChange={e => setTestFriendName(e.target.value)}
                            className="flex-1 bg-secondary border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent"
                            placeholder="Friend's Name (e.g. John Doe)"
                         />
                         <button 
                            type="submit" 
                            disabled={addingTestFriend}
                            className="bg-white/5 text-white px-6 py-3 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
                         >
                            {addingTestFriend ? 'Adding...' : 'Add Friend'}
                         </button>
                      </form>
                   </div>
                </div>
            )}

            {/* Members Strip */}
            <div className="flex items-center gap-4 bg-white/3 p-4 md:p-5 rounded-[32px] md:rounded-[40px] border border-white/5 shadow-inner">
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar flex-1 px-1">
                {selectedGroup.members?.filter(m => m).map(m => (
                  <div key={m._id} className="flex flex-col items-center min-w-[60px] md:min-w-[70px] shrink-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-secondary flex items-center justify-center text-accent font-black text-xs md:text-lg border-2 border-transparent relative group">
                      {m.picture ? <img src={m.picture} className="w-full h-full object-cover rounded-xl md:rounded-2xl" alt="" /> : (m.name ? m.name[0] : '?')}
                      {m.isTest && <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-[#0c0c0c]" />}
                    </div>
                    <span className="text-[8px] md:text-[9px] text-muted font-black uppercase mt-2 tracking-tighter truncate w-full text-center">{m._id === user?._id ? 'You' : (m.name?.split(' ')[0] || '...')}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowAddExpense(true)}
                className="hidden lg:flex w-16 h-16 rounded-3xl bg-accent text-primary items-center justify-center shadow-2xl shadow-accent/20 hover:rotate-90 transition-all duration-500 active:scale-90"
              >
                 <Plus size={32} strokeWidth={4} />
              </button>
            </div>


            {/* Expense List */}
            <div className="space-y-6">
               {expenses.length === 0 && (
                  <div className="glass-card p-16 flex flex-col items-center justify-center text-center border-dashed border-white/10 opacity-60">
                     <FileText className="text-muted mb-4 opacity-40" size={32} />
                     <p className="text-muted text-[10px] font-black uppercase tracking-widest">Digital Ledger Empty</p>
                  </div>
               )}
               {expenses.map((expense) => (
                  <div key={expense._id} className="group/parent glass-card p-5 md:p-7 border border-white/5 bg-white/2 hover:bg-white/[0.04] transition-all duration-300">
                     <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                        <div className="flex gap-4 md:gap-5">
                           <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 flex items-center justify-center text-accent border border-white/5 shrink-0">
                              <FileText size={22} className="md:w-7 md:h-7" />
                           </div>
                           <div className="min-w-0">
                              <h4 className="text-white font-black text-lg md:text-xl tracking-tight leading-tight mb-1 truncate">{expense.description}</h4>
                              <div className="flex items-center gap-2">
                                 <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">
                                    Total ₹{expense.totalAmount}
                                 </p>
                                 <div className="w-1 h-1 rounded-full bg-white/20" />
                                 <p className="text-[10px] text-muted font-black uppercase tracking-widest">
                                    {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                 </p>
                              </div>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-2 justify-between md:justify-end">
                           <div className="flex -space-x-3">
                              {expense.payers?.map(p => (
                                  <div key={p.user._id} className="w-10 h-10 rounded-xl bg-accent text-primary flex items-center justify-center text-[10px] font-black border-4 border-[#0c0c0c] overflow-hidden group/payer relative shadow-lg">
                                      {p.user.picture ? <img src={p.user.picture} className="w-full h-full object-cover" alt="" /> : (p.user.name ? p.user.name[0] : '?')}
                                  </div>
                              ))}
                           </div>
                           <div className="flex items-center gap-1.5 md:hidden">
                              <button onClick={() => { setEditingExpense(expense); setShowAddExpense(true); }} className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-muted active:text-accent active:bg-accent/10 transition-all"><Settings size={14} /></button>
                              <button onClick={() => handleDeleteExpense(expense._id)} className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-muted active:text-red-400 active:bg-red-400/10 transition-all"><Trash2 size={14} /></button>
                           </div>
                           <div className="hidden md:flex gap-1.5 opacity-0 group-hover/parent:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingExpense(expense); setShowAddExpense(true); }} className="px-4 py-2 bg-white/5 hover:bg-accent hover:text-primary rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all">Edit</button>
                              <button onClick={() => handleDeleteExpense(expense._id)} className="px-4 py-2 bg-white/5 hover:bg-red-400 hover:text-primary rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all">Remove</button>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-3">
                        {expense.splits?.filter(s => !expense.payers.some(p => p.user._id === s.user._id && p.amount >= s.amount)).map(split => {
                           const amIPayer = expense.payers.some(p => p.user?._id?.toString() === user?._id);
                           const isOwner = isCreatorOfGroup(selectedGroup);
                           const isTestFriend = selectedGroup.members.find(m => m._id === split.user._id)?.isTest;
                           const canISettle = amIPayer || (isOwner && isTestFriend);
                           const contributor = expense.payers.find(p => (p.user?._id || p.user).toString() === split.user._id.toString());
                           const netOwed = Math.max(0, Math.round(split.amount - (contributor?.amount || 0)));
                           
                           return (
                              <div key={split.user._id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/3 rounded-2xl md:rounded-[24px] px-4 md:px-5 py-4 border border-white/5 gap-4 hover:border-accent/10 transition-colors">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-accent/50 text-[10px] font-black tracking-tighter shrink-0">{(split.user.name ? split.user.name[0] : '?')}</div>
                                    <span className="text-xs font-bold text-white/70 truncate">
                                       {(split.user.name || 'Someone') + ' owes others'}
                                    </span>
                                 </div>
                                 <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                                    <span className={`font-black text-lg md:text-xl tracking-tight leading-none ${split.paid ? 'text-green-400' : 'text-white'}`}>₹{netOwed}</span>
                                    {split.paid ? (
                                       <div className="flex items-center gap-2 text-green-400">
                                          <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Settle Verified</span>
                                          <div className="w-6 h-6 rounded-lg bg-green-400/20 flex items-center justify-center shadow-lg shadow-green-400/10"><CheckCircle size={14} strokeWidth={3} /></div>
                                       </div>
                                    ) : canISettle ? (
                                       <button 
                                          onClick={() => handleSettle(expense._id, split.user._id)} 
                                          className="bg-accent text-primary px-4 py-2 rounded-xl md:rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-accent/20 flex items-center gap-2 active:scale-95"
                                       >
                                          Mark Settled <CreditCard size={12} strokeWidth={3} />
                                       </button>
                                    ) : (
                                       <div className="px-3 py-1.5 rounded-lg bg-white/5 text-[8px] font-black text-muted uppercase tracking-[0.2em] border border-white/5">Unpaid Entry</div>
                                    )}
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB - Mobile Only */}
      <div className="lg:hidden fixed bottom-24 right-6 z-50">
         <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => selectedGroup ? setShowAddExpense(true) : setShowCreateGroup(true)}
            className="w-16 h-16 rounded-[22px] bg-accent text-primary flex items-center justify-center shadow-2xl shadow-accent/40 border-4 border-[#141414] relative group"
         >
            <Plus size={32} strokeWidth={4} />
            <div className="absolute inset-0 rounded-[18px] border border-white/20" />
         </motion.button>
      </div>

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        currentUserId={user?._id}
        onCreated={(group) => {
           setGroups(prev => [group, ...prev]);
           openGroup(group);
        }}
      />
      <AddExpenseModal
        isOpen={showAddExpense}
        onClose={() => { setShowAddExpense(false); setEditingExpense(null); }}
        group={selectedGroup}
        currentUser={user}
        initialExpense={editingExpense}
        onAdded={() => {
           fetchGroupExpenses(selectedGroup._id);
           fetchBalances();
           globalFetchData();
        }}
      />
      {/* BulkSplitModal used line 506 elsewhere */}
      {showBulkSplit && (
         <BulkSplitModal 
            isOpen={showBulkSplit}
            onClose={() => { setShowBulkSplit(false); setBulkFriends([]); }}
            friends={bulkFriends}
            currentUser={user}
            onSuccess={() => {
               addToast("Expense dispersed successfully among squad", "success");
               fetchBalances();
               fetchGroups();
               globalFetchData();
            }}
         />
      )}
    </div>
  );
}
