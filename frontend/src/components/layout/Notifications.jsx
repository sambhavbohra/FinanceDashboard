import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Trash2, CheckCircle2, AlertTriangle, Info, Inbox } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
     fetchNotifications();
     const interval = setInterval(fetchNotifications, 30000);
     return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) { console.error(err); }
  };

  const clearAll = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      addToast("Notifications cleared", "success");
    } catch (err) { console.error(err); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="text-red-400" size={16} />;
      case 'request': return <CheckCircle2 className="text-accent" size={16} />;
      default: return <Info className="text-blue-400" size={16} />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-4 rounded-[18px] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group overflow-hidden"
      >
        <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Bell size={20} strokeWidth={2.5} className={`relative z-10 ${unreadCount > 0 ? 'text-accent' : 'text-muted group-hover:text-white'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_12px_rgba(226,254,116,0.6)] z-20" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 md:w-96 bg-[#121212]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl z-[70] overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                   <h3 className="text-lg font-black tracking-tight text-white italic">Intelligence <span className="text-accent">Hub</span></h3>
                   <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted opacity-60">System Activity Logs</p>
                </div>
                <div className="flex gap-2">
                   {notifications.length > 0 && (
                      <button onClick={clearAll} className="p-2 text-muted hover:text-red-400 transition-colors">
                        <Trash2 size={16} />
                      </button>
                   )}
                   <button onClick={() => setIsOpen(false)} className="p-2 text-muted hover:text-white transition-colors">
                     <X size={16} />
                   </button>
                </div>
              </div>

              <div className="max-h-[70vh] overflow-y-auto no-scrollbar py-2">
                {notifications.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
                    <Inbox size={32} className="mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Active Signals</p>
                  </div>
                ) : (
                  notifications.map((n, idx) => (
                    <motion.div
                      key={n._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => !n.read && markAsRead(n._id)}
                      className={`px-6 py-5 hover:bg-white/5 transition-all cursor-pointer border-b border-white/5 last:border-0 relative group ${!n.read ? 'bg-accent/[0.02]' : 'opacity-60'}`}
                    >
                      {!n.read && (
                         <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
                      )}
                      <div className="flex gap-4">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${!n.read ? 'bg-accent/10 border-accent/20' : 'bg-white/5'}`}>
                           {getIcon(n.type)}
                        </div>
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${!n.read ? 'text-accent' : 'text-muted'}`}>
                             {n.title}
                          </p>
                          <p className="text-xs text-white leading-relaxed font-medium">
                            {n.message}
                          </p>
                          <p className="text-[8px] font-black text-muted uppercase tracking-tighter mt-2 opacity-50">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(n.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                 <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted opacity-40 italic">End of Neural Stream</p>
                 </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
