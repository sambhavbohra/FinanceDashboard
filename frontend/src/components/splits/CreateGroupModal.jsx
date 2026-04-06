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
        // We can create a "Test User" that is just a placeholder user or we can use a separate logic
        // For simplicity, let's say the backend can handle creating a "Ghost" user or we just create a normal user with a random email
        const res = await axios.post(`${API_URL}/auth/register`, {
           name: testFriendName.trim(),
           email: `test_${Date.now()}@fintrack.test`,
           password: 'testpassword123',
           username: `testfriend_${Math.floor(Math.random()*1000)}`
        });
        
        // Mark them as friend automatically (Backend needs to support auto-friending or we just add them)
        const ghostUser = res.data.user;
        await axios.post(`${API_URL}/friends/request/${ghostUser._id}`);
        // Now hack: backend should automatically accept if it's a test friend but for now just add them
        addMember({ ...ghostUser, friendship: { status: 'accepted' } });
        setTestFriendName('');
        setShowTestFriendForm(false);
     } catch (err) {
        console.error(err);
     }
     setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Group">
      <div className="space-y-6">
        {/* Group Info Section */}
        <div className="space-y-3">
          <label className="text-xs text-muted uppercase tracking-wider font-semibold">Group Info</label>
          <div className="flex gap-4">
             <div className="relative">
                <button
                   onClick={() => setEmoji(GROUP_EMOJIS[(GROUP_EMOJIS.indexOf(emoji) + 1) % GROUP_EMOJIS.length])}
                   className="w-14 h-14 rounded-2xl bg-secondary border border-white/10 flex items-center justify-center text-2xl hover:border-accent/40 active:scale-95 transition-all"
                >
                   {emoji}
                </button>
                <div className="absolute -bottom-1 -right-1 bg-accent text-primary p-0.5 rounded-full shadow-lg">
                   <Sparkles size={12} />
                </div>
             </div>
             <input
               placeholder="Group name (e.g. Hostel Mates, Trip)"
               value={name}
               onChange={e => setName(e.target.value)}
               className="flex-1 bg-secondary border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
             />
          </div>
        </div>

        {/* Members Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
             <label className="text-xs text-muted uppercase tracking-wider font-semibold">Add Members</label>
             <button 
               onClick={() => setShowTestFriendForm(!showTestFriendForm)}
               className="text-xs text-accent font-medium flex items-center gap-1 hover:underline decoration-accent/30"
             >
                <UserPlus size={12} />
                {showTestFriendForm ? 'Search Friends' : 'Make Test Friend'}
             </button>
          </div>
          
          {!showTestFriendForm ? (
            <UserSearch
              onAdd={addMember}
              excludeIds={[currentUserId, ...members.map(m => m._id)]}
              placeholder="Search friends by name or username..."
            />
          ) : (
            <div className="flex gap-2">
               <input
                 placeholder="Enter friend name..."
                 value={testFriendName}
                 onChange={e => setTestFriendName(e.target.value)}
                 className="flex-1 bg-secondary border border-white/10 rounded-xl py-2 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                 onKeyPress={(e) => e.key === 'Enter' && createTestFriend()}
               />
               <button 
                 onClick={createTestFriend}
                 disabled={!testFriendName.trim() || loading}
                 className="bg-accent/10 border border-accent/20 text-accent px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent/20 transition-all"
               >
                 Create
               </button>
               <button 
                 onClick={() => setShowTestFriendForm(false)}
                 className="p-2 text-muted hover:text-white"
               >
                 <X size={18} />
               </button>
            </div>
          )}

          {members.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {members.map(m => (
                <div key={m._id} className="flex items-center gap-2 bg-accent/5 border border-accent/20 rounded-full pl-1.5 pr-2.5 py-1 transition-all hover:bg-accent/10">
                  <div className="w-6 h-6 rounded-full bg-accent text-primary flex items-center justify-center text-[10px] font-bold">
                    {m.picture ? <img src={m.picture} className="w-full h-full rounded-full" alt="" /> : m.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-white font-medium">{m.name}</span>
                  <button onClick={() => setMembers(prev => prev.filter(x => x._id !== m._id))} className="text-muted hover:text-red-400 p-0.5 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleCreateGroup}
          disabled={loading || !name.trim()}
          className="w-full bg-accent text-primary font-bold py-4 rounded-2xl hover:bg-accent/90 transition-all shadow-[0_0_30px_rgba(226,254,116,0.1)] active:scale-[0.98] disabled:opacity-50 mt-4 h-14 flex items-center justify-center"
        >
          {loading ? (
             <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          ) : `Create ${name.trim() || 'Group'}`}
        </button>
      </div>
    </Modal>
  );
}
