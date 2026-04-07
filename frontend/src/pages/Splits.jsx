import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, ArrowLeft, FileText, CheckCircle, ChevronRight, Inbox, Copy, Share, User, Settings, X, Info, Trash2, CreditCard } from 'lucide-react';
import axios from 'axios';
import CreateGroupModal from '../components/splits/CreateGroupModal';
import AddExpenseModal from '../components/splits/AddExpenseModal';
import BulkSplitModal from '../components/splits/BulkSplitModal';
import UserSearch from '../components/splits/UserSearch';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.abs(n));

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
    <div className="space-y-6 pb-24 md:pb-0">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
             className="text-3xl sm:text-4xl font-black text-white mb-1 tracking-tighter flex items-center gap-4">
            {selectedGroup ? (
              <div className="flex items-center gap-3 w-full">
                <button onClick={() => { setSelectedGroup(null); setShowManagement(false); }} className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-accent/10 transition-all text-white hover:text-accent shrink-0">
                   <ArrowLeft size={20} className="sm:w-6 sm:h-6" strokeWidth={3} />
                </button>
                <div className="flex items-center gap-2 min-w-0">
                   <span className="text-2xl sm:text-3xl shrink-0">{selectedGroup.emoji}</span>
                   <span className="truncate max-w-[150px] sm:max-w-none">{selectedGroup.name}</span>
                </div>
                {isCreatorOfGroup(selectedGroup) && (
                  <button 
                    onClick={() => setShowManagement(!showManagement)}
                    className={`p-2.5 sm:p-3 rounded-xl transition-all border ml-auto sm:ml-2 ${showManagement ? 'bg-accent text-primary border-accent' : 'bg-white/5 border-white/10 text-white hover:border-white/20'}`}
                  >
                     <Settings size={14} className="sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            ) : 'Group Splits'}
          </motion.h1>
          <p className="text-muted text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">{selectedGroup ? `${selectedGroup.members?.length} active participants` : 'Smart shared finances'}</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
           <div className="flex-1 sm:w-80">
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
                 placeholder="Search or quick split..."
              />
           </div>
           
           {bulkFriends.length > 1 && !selectedGroup && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                onClick={() => setShowBulkSplit(true)}
                className="bg-green-400 text-primary px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl font-black hover:bg-green-300 transition-all shadow-xl shadow-green-400/20 flex items-center gap-2 uppercase text-[9px] sm:text-[10px] tracking-widest h-12 sm:h-14 shrink-0"
              >
                 Fast Disperse
              </motion.button>
           )}

           <motion.button
             onClick={() => selectedGroup ? setShowAddExpense(true) : setShowCreateGroup(true)}
             className="bg-accent text-primary px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl font-black hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 flex items-center gap-2 uppercase text-[10px] sm:text-xs tracking-widest h-12 sm:h-14 shrink-0"
           >
             <Plus size={20} className="sm:w-[22px]" strokeWidth={4} />
             <span className="hidden sm:inline">{selectedGroup ? 'Add Split' : 'New Group'}</span>
           </motion.button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {!selectedGroup ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="glass-card p-5 sm:p-6 border-l-4 border-l-green-400 shadow-lg shadow-green-400/5">
                  <p className="text-muted text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1">Owed to you</p>
                  <p className="text-3xl sm:text-4xl font-black text-green-400 font-mono tracking-tighter truncate">{formatCurrency((balances || []).filter(b => b.amount > 0).reduce((a, b) => a + b.amount, 0))}</p>
               </div>
               <div className="glass-card p-5 sm:p-6 border-l-4 border-l-red-400 shadow-lg shadow-red-400/5">
                  <p className="text-muted text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1">You owe friends</p>
                  <p className="text-3xl sm:text-4xl font-black text-red-400 font-mono tracking-tighter truncate">{formatCurrency((balances || []).filter(b => b.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0))}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {groups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => openGroup(group)}
                  className="glass-card p-8 text-left hover:border-accent/30 bg-white/3 transition-all group relative overflow-hidden"
                >
                  <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center text-4xl mb-6 shadow-inner group-hover:scale-110 transition-transform">{group.emoji}</div>
                  <h3 className="text-white font-black text-2xl tracking-tighter mb-1 truncate">{group.name}</h3>
                  <p className="text-muted text-[10px] font-black uppercase tracking-widest">{group.members?.length} Members</p>
                  <div className="flex justify-between items-end mt-6">
                    <div className="flex -space-x-2">
                      {group.members?.filter(m => m).slice(0, 5).map(m => (
                         <div key={m._id} className="w-8 h-8 rounded-xl bg-secondary border-2 border-[#141414] flex items-center justify-center text-accent text-[9px] font-black relative overflow-hidden">
                            {m.picture ? <img src={m.picture} className="w-full h-full object-cover" alt="" /> : m.name?.[0]}
                         </div>
                      ))}
                    </div>
                    {isCreatorOfGroup(group) && (
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          const isConfirmed = await confirm({
                             title: "Delete Group?",
                             message: "Are you sure you want to delete this group and all its records?",
                             type: "danger"
                          });
                          if (isConfirmed) {
                            axios.delete(`${API_URL}/groups/${group._id}`).then(() => {
                               fetchGroups();
                               addToast("Group deleted", "success");
                            });
                          }
                        }}
                        className="p-3 bg-red-400/10 text-red-400 rounded-xl hover:bg-red-400 transition-all group-hover:scale-110 active:scale-95"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
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
                               <span className="font-bold text-sm text-white/80">{m.name}</span>
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
            <div className="flex items-center gap-4 bg-white/3 p-5 rounded-[40px] border border-white/5">
              <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar flex-1">
                {selectedGroup.members?.filter(m => m).map(m => (
                  <div key={m._id} className="flex flex-col items-center min-w-[70px] shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-accent font-black text-lg border-2 border-transparent">
                      {m.picture ? <img src={m.picture} className="w-full h-full object-cover rounded-2xl" alt="" /> : m.name?.[0]}
                    </div>
                    <span className="text-[9px] text-muted font-black uppercase mt-2 tracking-tighter truncate w-full text-center">{m._id === user?._id ? 'You' : m.name?.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowAddExpense(true)} className="w-16 h-16 rounded-3xl bg-accent text-primary flex items-center justify-center shadow-2xl shadow-accent/20 hover:rotate-90 transition-all duration-500">
                 <Plus size={32} strokeWidth={4} />
              </button>
            </div>


            {/* Expense List */}
            <div className="space-y-4">
               {expenses.map((expense) => (
                  <div key={expense._id} className="glass-card p-6 border border-white/5 bg-white/3 group/parent">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-5">
                           <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-accent border border-white/5">
                              <FileText size={26} />
                           </div>
                           <div>
                              <h4 className="text-white font-black text-xl tracking-tight leading-tight mb-1">{expense.description}</h4>
                              <p className="text-[10px] text-muted font-black uppercase tracking-widest">
                                 Total ₹{expense.totalAmount} · {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           {expense.payers?.map(p => (
                              <div key={p.user._id} className="flex flex-col items-center gap-1 group relative">
                                 <div className="w-9 h-9 rounded-xl bg-accent text-primary flex items-center justify-center text-[10px] font-black border-2 border-[#141414] overflow-hidden">
                                     {p.user.picture ? <img src={p.user.picture} className="w-full h-full object-cover" alt="" /> : p.user.name?.[0]}
                                 </div>
                                 <span className="text-[8px] font-black text-accent uppercase">Paid ₹{p.amount}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                     <div className="flex gap-2 mb-6 hidden group-hover/parent:flex">
                         <button onClick={() => { setEditingExpense(expense); setShowAddExpense(true); }} className="text-muted hover:text-accent text-[10px] uppercase font-bold px-3 py-1 bg-white/5 rounded-md">Edit Split</button>
                         <button onClick={() => handleDeleteExpense(expense._id)} className="text-muted hover:text-red-400 text-[10px] uppercase font-bold px-3 py-1 bg-white/5 rounded-md">Delete Split</button>
                     </div>

                     <div className="space-y-2.5">
                        {expense.splits?.filter(s => !expense.payers.some(p => p.user._id === s.user._id && p.amount >= s.amount)).map(split => {
                           const amIPayer = expense.payers.some(p => p.user?._id?.toString() === user?._id);
                           const isOwner = isCreatorOfGroup(selectedGroup);
                           const isTestFriend = selectedGroup.members.find(m => m._id === split.user._id)?.isTest;
                           
                           const canISettle = amIPayer || (isOwner && isTestFriend);
                           
                           return (
                              <div key={split.user._id} className="flex items-center justify-between bg-white/3 rounded-3xl px-5 py-4 border border-white/5 relative overflow-hidden group">
                                 <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-accent/50 text-[11px] font-black">{split.user.name?.[0]}</div>
                                    <span className="text-xs font-bold text-white/70">
                                       {split.user.name + ' owes others'}
                                    </span>
                                 </div>
                                 <div className="flex items-center gap-5">
                                    <span className={`font-mono font-black text-lg ${split.paid ? 'text-green-400' : 'text-white'}`}>₹{split.amount}</span>
                                    {split.paid ? (
                                       <div className="w-6 h-6 rounded-full bg-green-400/20 flex items-center justify-center text-green-400"><CheckCircle size={14} /></div>
                                    ) : canISettle ? (
                                       <button 
                                          onClick={() => handleSettle(expense._id, split.user._id)} 
                                          className="bg-accent text-primary px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-accent/10 flex items-center gap-2"
                                       >
                                          Mark Settled <CreditCard size={12} />
                                       </button>
                                    ) : (
                                       <div className="px-3 py-1.5 rounded-lg bg-white/5 text-[9px] font-black text-muted uppercase tracking-widest">Unpaid</div>
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

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        currentUserId={user?._id}
        onCreated={(group) => setGroups(prev => [group, ...prev])}
      />
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
