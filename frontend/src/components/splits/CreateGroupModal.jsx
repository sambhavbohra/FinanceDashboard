import React, { useState } from 'react';
import Modal from '../ui/Modal';
import UserSearch from './UserSearch';
import { X, UserPlus, Sparkles, UserSearch as UserSearchIcon } from 'lucide-react';
import axios from 'axios';

const GROUP_EMOJIS = ['🏠', '✈️', '🍕', '🎓', '🎮', '💼', '🏋️', '🎉', '👥', '🚗'];
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function CreateGroupModal({ isOpen, onClose, onCreated, currentUserId }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('👥');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testFriendName, setTestFriendName] = useState('');
  const [showTestFriendForm, setShowTestFriendForm] = useState(false);

  const handleCreateGroup = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/groups`, {
        name: name.trim(),
        emoji,
        memberIds: members.map(m => m._id)
      });
      onCreated(res.data);
      setName(''); setEmoji('👥'); setMembers([]);
      onClose();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const addMember = (user) => {
    if (!members.find(m => m._id === user._id)) setMembers(prev => [...prev, user]);
  };

  const createTestFriend = async () => {
     if (!testFriendName.trim()) return;
     setLoading(true);
     try {
        const res = await axios.post(`${API_URL}/auth/register`, {
           name: testFriendName.trim(),
           email: `test_${Date.now()}@fintrack.test`,
           password: 'testpassword123',
           username: `testfriend_${Math.floor(Math.random()*1000)}`
        });
        
        const ghostUser = res.data.user;
        await axios.post(`${API_URL}/friends/request/${ghostUser._id}`);
        addMember({ ...ghostUser, friendship: { status: 'accepted' } });
        setTestFriendName('');
        setShowTestFriendForm(false);
     } catch (err) {
        console.error(err);
     }
     setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Group Protocol">
      <div className="pt-2 flex flex-col max-h-[85vh]">
        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar pb-6" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          
          {/* Group Info Section */}
          <div className="space-y-4">
             <label className="text-[10px] text-muted uppercase tracking-widest font-black">Group Configuration</label>
             <div className="flex gap-4">
                <div className="relative">
                   <button
                      type="button"
                      onClick={() => setEmoji(GROUP_EMOJIS[(GROUP_EMOJIS.indexOf(emoji) + 1) % GROUP_EMOJIS.length])}
                      className="w-16 h-16 rounded-3xl bg-secondary border border-white/10 flex items-center justify-center text-3xl hover:border-accent/40 active:scale-95 transition-all shadow-inner"
                   >
                      {emoji}
                   </button>
                   <div className="absolute -bottom-1 -right-1 bg-accent text-primary p-1 rounded-full shadow-lg">
                      <Sparkles size={14} />
                   </div>
                </div>
                <input
                  required
                  placeholder="Group naming protocol..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="flex-1 bg-secondary border border-white/10 rounded-2xl px-5 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent font-black tracking-tight"
                />
             </div>
          </div>

          {/* Members Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <label className="text-[10px] text-muted uppercase tracking-widest font-black">Squad Selection</label>
               <button 
                 type="button"
                 onClick={() => setShowTestFriendForm(!showTestFriendForm)}
                 className="text-[10px] text-accent font-black uppercase tracking-wider flex items-center gap-2 hover:bg-accent/10 px-3 py-1.5 rounded-xl transition-all"
               >
                  <UserPlus size={14} />
                  {showTestFriendForm ? 'Normal Friends' : 'Offline Partner'}
               </button>
            </div>
            
            <div className="bg-white/3 p-5 rounded-3xl border border-white/5 space-y-4">
               {!showTestFriendForm ? (
                 <UserSearch
                   onAdd={addMember}
                   excludeIds={[currentUserId, ...members.map(m => m._id)]}
                   placeholder="Search friends for squad..."
                 />
               ) : (
                 <div className="flex gap-2">
                    <input
                      placeholder="Ghost partner name..."
                      value={testFriendName}
                      onChange={e => setTestFriendName(e.target.value)}
                      className="flex-1 bg-secondary border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 font-bold"
                      onKeyPress={(e) => e.key === 'Enter' && createTestFriend()}
                    />
                    <button 
                      type="button"
                      onClick={createTestFriend}
                      disabled={!testFriendName.trim() || loading}
                      className="bg-accent/10 border border-accent/20 text-accent px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent/20 transition-all disabled:opacity-30"
                    >
                      Init
                    </button>
                 </div>
               )}

               {members.length > 0 && (
                 <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in duration-500">
                   {members.map(m => (
                     <div key={m._id} className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-2xl pl-2 pr-3 py-1.5 transition-all hover:bg-accent/20">
                       <div className="w-7 h-7 rounded-xl bg-accent text-primary flex items-center justify-center text-[10px] font-black uppercase">
                         {m.picture ? <img src={m.picture} className="w-full h-full rounded-xl object-cover" alt="" /> : m.name?.[0]}
                       </div>
                       <span className="text-[11px] text-white font-black uppercase truncate max-w-[100px]">{m.name.split(' ')[0]}</span>
                       <button onClick={() => setMembers(prev => prev.filter(x => x._id !== m._id))} className="text-muted hover:text-red-400 p-0.5 transition-colors">
                         <X size={14} strokeWidth={3} />
                       </button>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-white/5 bg-card shrink-0">
           <button
             onClick={handleCreateGroup}
             disabled={loading || !name.trim()}
             className="w-full bg-accent text-primary font-black py-5 rounded-3xl hover:bg-accent/90 transition-all shadow-2xl shadow-accent/20 active:scale-[0.98] disabled:opacity-30 disabled:grayscale h-16 flex items-center justify-center text-lg uppercase tracking-[0.2em]"
           >
             {loading ? (
                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
             ) : `Initialize Protocol`}
           </button>
        </div>
      </div>
    </Modal>
  );
}
