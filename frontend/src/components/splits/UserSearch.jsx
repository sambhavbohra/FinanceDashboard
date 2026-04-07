import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, X, UserPlus, Check, Clock, UserCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function UserSearch({ onAdd, excludeIds = [], placeholder = 'Search friends...', multi = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]); // Only for multi-mode
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/users/search?q=${encodeURIComponent(query)}`);
        
        const usersWithStatus = await Promise.all(res.data.map(async (u) => {
          const statusRes = await axios.get(`${API_URL}/friends/status/${u._id}`);
          return { ...u, friendship: statusRes.data };
        }));

        setResults(usersWithStatus.filter(u => 
           !excludeIds.includes(u._id) && 
           !selectedUsers.some(s => s._id === u._id)
        ));
      } catch (e) { setResults([]); }
      setLoading(false);
    }, 350);
  }, [query, selectedUsers]);

  const handleSendRequest = async (userId, e) => {
    e.stopPropagation();
    try {
      await axios.post(`${API_URL}/friends/request/${userId}`);
      setResults(prev => prev.map(u => u._id === userId ? { ...u, friendship: { status: 'accepted' } } : u));
    } catch (err) { console.error(err); }
  };

  const handleAdd = (user) => {
    if (user.friendship?.status !== 'accepted') return;
    
    if (multi) {
       const newSelection = [...selectedUsers, user];
       setSelectedUsers(newSelection);
       onAdd(newSelection);
       setQuery('');
       setResults([]);
    } else {
       onAdd(user);
       setQuery('');
       setResults([]);
    }
  };

  const removeUser = (id) => {
     const newSelection = selectedUsers.filter(u => u._id !== id);
     setSelectedUsers(newSelection);
     onAdd(newSelection);
  };

  return (
    <div className="relative">
      <div className="space-y-2">
         {multi && selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 p-2 bg-black/20 rounded-xl border border-white/5">
               {selectedUsers.map(u => (
                  <div key={u._id} className="flex items-center gap-1.5 bg-accent text-primary px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                     {u.name.split(' ')[0]}
                     <button onClick={() => removeUser(u._id)}><X size={10} strokeWidth={4} /></button>
                  </div>
               ))}
            </div>
         )}
         <div className="relative">
           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
           <input
             value={query}
             onChange={e => setQuery(e.target.value)}
             placeholder={selectedUsers.length > 0 ? "Add another friend..." : placeholder}
             className="w-full bg-secondary border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-white text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
           />
           {query && (
             <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white">
               <X size={14} />
             </button>
           )}
         </div>
      </div>

      {(results.length > 0 || loading) && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
          {loading && <div className="px-4 py-3 text-muted text-sm items-center flex gap-2">
            <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" /> Searching...
          </div>}
          {results.map(user => (
            <div
              key={user._id}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 transition-colors ${
                user.friendship?.status === 'accepted' ? 'cursor-pointer hover:bg-white/5' : ''
              }`}
              onClick={() => user.friendship?.status === 'accepted' && handleAdd(user)}
            >
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm flex-shrink-0">
                {user.picture ? <img src={user.picture} alt="" className="w-8 h-8 rounded-full" /> : user.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.name}</p>
              </div>
              {user.friendship?.status === 'accepted' ? (
                <div className="text-accent bg-accent/10 px-2 py-1 rounded-full"><UserCheck size={12} /></div>
              ) : (
                <button onClick={(e) => handleSendRequest(user._id, e)} className="text-accent text-xs font-bold uppercase tracking-widest">+ Add</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
