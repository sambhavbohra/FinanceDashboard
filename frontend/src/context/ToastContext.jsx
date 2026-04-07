import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X, Bell } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    if (duration !== Infinity) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none min-w-[320px] max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 20, scale: 0.95, filter: 'blur(10px)' }}
            className={`pointer-events-auto relative overflow-hidden glass-card p-4 flex items-center gap-4 shadow-2xl border border-white/10 group ${
              toast.type === 'error' ? 'bg-red-500/10' : 
              toast.type === 'success' ? 'bg-green-500/10' : 
              'bg-accent/10'
            }`}
          >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-none" />
            
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              toast.type === 'error' ? 'bg-red-400 text-primary' : 
              toast.type === 'success' ? 'bg-green-400 text-primary' : 
              'bg-accent text-primary'
            }`}>
              {toast.type === 'error' && <AlertCircle size={20} strokeWidth={3} />}
              {toast.type === 'success' && <CheckCircle size={20} strokeWidth={3} />}
              {(toast.type === 'info' || !toast.type) && <Bell size={20} strokeWidth={3} />}
            </div>

            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-0.5">
                {toast.type || 'System Notification'}
              </p>
              <p className="text-white text-sm font-bold leading-tight">{toast.message}</p>
            </div>

            <button 
              onClick={() => removeToast(toast.id)}
              className="p-2 hover:bg-white/5 rounded-lg text-muted hover:text-white transition-all"
            >
              <X size={16} />
            </button>

            {/* Progress line */}
            {toast.duration !== Infinity && (
               <motion.div 
                 initial={{ width: '100%' }}
                 animate={{ width: '0%' }}
                 transition={{ duration: toast.duration / 1000, ease: 'linear' }}
                 className={`absolute bottom-0 left-0 h-0.5 ${
                   toast.type === 'error' ? 'bg-red-400' : 
                   toast.type === 'success' ? 'bg-green-400' : 
                   'bg-accent'
                 }`}
               />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
