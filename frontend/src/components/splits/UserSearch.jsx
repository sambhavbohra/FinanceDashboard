import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, X, UserPlus, Check, Clock, UserCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function UserSearch({ onAdd, excludeIds = [], placeholder = 'Search friends by name or username...' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/users/search?q=${encodeURIComponent(query)}`);
        
        // Enhance results with friendship status
        const usersWithStatus = await Promise.all(res.data.map(async (u) => {
          const statusRes = await axios.get(`${API_URL}/friends/status/${u._id}`);
          return { ...u, friendship: statusRes.data };
        }));

        setResults(usersWithStatus.filter(u => !excludeIds.includes(u._id)));
      } catch (e) { setResults([]); }
      setLoading(false);
    }, 350);
  }, [query]);

  const handleSendRequest = async (userId, e) => {
    e.stopPropagation();
    try {
      await axios.post(`${API_URL}/friends/request/${userId}`);
      // Refresh results to show pending status
      setResults(prev => prev.map(u => u._id === userId ? { ...u, friendship: { status: 'pending' } } : u));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = (user) => {
    if (user.friendship?.status !== 'accepted') {
      // If not friend, maybe handle "Test Friend" or just block
      return;
    }
    onAdd(user);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-secondary border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-white text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>

      {(results.length > 0 || loading) && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
          {loading && <div className="px-4 py-3 text-muted text-sm items-center flex gap-2">
            <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" /> 
            Searching...
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
                {user.picture
                  ? <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                  : user.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.name}</p>
                {user.username && <p className="text-muted text-xs truncate">@{user.username}</p>}
              </div>

              {user.friendship?.status === 'accepted' ? (
                <div className="flex items-center gap-1.5 text-accent text-xs font-medium bg-accent/10 px-2 py-1 rounded-full">
                  <UserCheck size={12} />
                  Friend
                </div>
              ) : user.friendship?.status === 'pending' ? (
                <div className="flex items-center gap-1.5 text-muted text-xs font-medium bg-white/5 px-2 py-1 rounded-full">
                  <Clock size={12} />
                  Pending
                </div>
              ) : (
                <button 
                  onClick={(e) => handleSendRequest(user._id, e)}
                  className="flex items-center gap-1.5 text-sm font-medium text-accent hover:bg-accent/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <UserPlus size={14} />
                  Add Friend
                </button>
              )}
            </div>
          ))}
          {!loading && query.length >= 2 && results.length === 0 && (
             <div className="px-4 py-6 text-center">
                <p className="text-muted text-sm">No users found</p>
                <button className="text-accent text-xs mt-2 font-medium hover:underline">
                  Invite them to FinTrack
                </button>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
