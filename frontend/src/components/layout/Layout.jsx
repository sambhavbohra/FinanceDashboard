import React from 'react';
import axios from 'axios';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BarChart2, Target, Zap, Settings, Users, ArrowRight, Sparkles, User, Wallet, Menu, X, Gavel, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '../../context/FinanceContext';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Feed', path: '/', mobile: true },
  { icon: Wallet, label: 'Wallet', path: '/transactions', mobile: true },
  { icon: Gavel, label: 'Decisions', path: '/decisions', mobile: true },
  { icon: ArrowRight, label: 'Splits', path: '/splits', mobile: true },
  { icon: Users, label: 'Squad', path: '/friends', mobile: false },
  { icon: BarChart2, label: 'Analytics', path: '/analytics', mobile: false },
  { icon: Target, label: 'Goals', path: '/goals', mobile: false },
  { icon: Zap, label: 'Insights', path: '/insights', mobile: false },
  { icon: Settings, label: 'Settings', path: '/settings', mobile: false },
];

export default function Layout({ children }) {
  const { user } = useFinance();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/requests/pending`, { headers: { Authorization: `Bearer ${token}` } });
      setPendingCount(res.data.length);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const SidebarContent = ({ showClose, onClose }) => (
     <>
        <div className="flex items-center justify-between mb-12 px-2">
           <div className="flex items-center gap-4 relative group/logo cursor-pointer">
              <div className="w-14 h-14 rounded-[24px] bg-accent flex items-center justify-center shadow-2xl shadow-accent/20 group-hover/logo:scale-110 transition-all duration-500 relative overflow-hidden">
                 <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/logo:opacity-100 transition-opacity" />
                 <Wallet size={32} strokeWidth={3} className="text-primary relative z-10" />
              </div>
              <div>
                 <h1 className="text-2xl font-black tracking-tighter leading-none text-white italic">Fin<span className="text-accent underline-offset-4 underline decoration-2">Track</span></h1>
                 <p className="text-[10px] text-muted font-black uppercase tracking-[0.4em] mt-1.5 opacity-60">Smart Capital</p>
              </div>
           </div>
           {showClose && (
              <button 
                 onClick={onClose}
                 className="p-3 rounded-2xl bg-white/5 text-white hover:bg-white/10 transition-all border border-white/5"
               >
                 <X size={20} />
              </button>
           )}
        </div>

        <nav className="flex-1 space-y-2">
           {NAV_ITEMS.map((item) => (
              <NavLink
                 key={item.path}
                 to={item.path}
                 className={({ isActive }) => `
                    flex items-center gap-4 px-5 py-4 rounded-[22px] transition-all relative group/nav
                    ${isActive ? 'bg-accent/15 text-accent border border-accent/20' : 'text-muted hover:text-white hover:bg-white/5 border border-transparent'}
                 `}
              >
                 <item.icon size={22} strokeWidth={location.pathname === item.path ? 3 : 2} className="relative z-10" />
                 <span className="font-bold tracking-tight relative z-10">{item.label}</span>
                 {item.label === 'Decisions' && pendingCount > 0 && (
                    <div className="absolute right-4 w-5 h-5 bg-accent text-primary rounded-lg flex items-center justify-center text-[10px] font-black z-10 shadow-lg shadow-accent/20 animate-bounce">
                       {pendingCount}
                    </div>
                 )}
                 <AnimatePresence>
                    {location.pathname === item.path && (
                       <motion.div
                          layoutId="active-pill"
                          className="absolute inset-0 bg-accent/5 rounded-[22px] -z-0"
                       />
                    )}
                 </AnimatePresence>
              </NavLink>
           ))}
        </nav>

         <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
           <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 transition-all">
              <div className="w-11 h-11 rounded-[18px] bg-secondary flex items-center justify-center font-black text-accent shadow-inner overflow-hidden">
                 {user?.picture ? <img src={user.picture} className="w-full h-full object-cover" alt="" /> : user?.name?.[0]}
              </div>
              <div className="min-w-0 text-left">
                 <p className="font-black text-sm text-white truncate leading-none mb-1">{user?.name?.split(' ')[0] || 'User'}</p>
                 <p className="text-[10px] text-muted font-black tracking-widest uppercase opacity-50">Identity Verified</p>
              </div>
           </div>
         </div>
         <div className="h-8 lg:hidden" />
     </>
  );

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-white selection:bg-accent selection:text-primary">
      <aside className="fixed left-0 top-0 bottom-0 w-80 bg-black/60 backdrop-blur-3xl border-r border-white/5 hidden lg:flex flex-col p-8 z-50 overflow-y-auto no-scrollbar group">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
         {isSidebarOpen && (
            <>
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] lg:hidden"
               />
               <motion.aside 
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-[#0C0C0C] border-r border-white/5 flex flex-col p-8 z-[101] lg:hidden shadow-2xl overflow-y-auto no-scrollbar"
               >
                  <SidebarContent showClose onClose={() => setIsSidebarOpen(false)} />
               </motion.aside>
            </>
         )}
      </AnimatePresence>

      {/* Mobile Top Header (Minimal) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0C0C0C]/80 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between z-40">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-primary shadow-lg shadow-accent/20">
               <Wallet size={16} strokeWidth={3} />
            </div>
            <span className="font-black italic uppercase tracking-tighter text-xs sm:text-sm">FIN<span className="text-accent">TRACK</span></span>
         </div>
         <div className="flex items-center gap-4">
            <button 
               onClick={() => setIsSidebarOpen(true)}
               className="p-2.5 text-white bg-white/5 rounded-xl border border-white/10 active:bg-accent/20 active:text-accent transition-all"
            >
               <Menu size={18} />
            </button>
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 overflow-hidden flex items-center justify-center text-[10px] font-black text-accent">
               {user?.picture ? <img src={user.picture} className="w-full h-full object-cover" alt="" /> : user?.name?.[0]}
            </div>
         </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-80 min-h-screen relative pt-16 lg:pt-0 pb-24 lg:pb-0">
         <div className="max-w-5xl mx-auto px-5 py-6 lg:py-10">
            <AnimatePresence mode="wait">
               <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
               >
                  {children}
               </motion.div>
            </AnimatePresence>
         </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#0C0C0C]/90 backdrop-blur-2xl border-t border-white/5 px-4 flex items-center justify-around z-50 pb-safe">
         {NAV_ITEMS.filter(item => item.mobile).map((item) => {
            const isActive = location.pathname === item.path;
            return (
               <NavLink
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center gap-1.5 px-3 py-2 transition-all relative group"
               >
                  <div className={`
                     w-12 h-8 rounded-2xl flex items-center justify-center transition-all relative
                     ${isActive ? 'bg-accent/10 text-accent shadow-inner' : 'text-muted/60 opacity-60'}
                  `}>
                     <item.icon size={18} strokeWidth={isActive ? 3 : 2} className="relative z-10" />
                     {item.label === 'Decisions' && pendingCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-primary rounded-full flex items-center justify-center text-[8px] font-black z-20 border-2 border-[#0C0C0C]">
                           {pendingCount}
                        </div>
                     )}
                  </div>
                  <span className={`text-[9px] font-black tracking-widest uppercase ${isActive ? 'text-accent opacity-100' : 'text-muted/40 opacity-40'}`}>
                     {item.label}
                  </span>
                  {isActive && (
                     <motion.div
                        layoutId="bottom-indicator"
                        className="absolute -top-1 w-8 h-[2px] bg-accent rounded-full"
                        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                     />
                  )}
               </NavLink>
            );
         })}
      </div>

      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
