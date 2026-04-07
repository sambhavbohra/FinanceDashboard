import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Trash2, X, ChevronRight, HelpCircle } from 'lucide-react';

const ConfirmContext = createContext();

export const ConfirmProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfig(typeof options === 'string' ? { message: options } : options);
    });
  }, []);

  const handleAction = (status) => {
    resolveRef.current?.(status);
    setConfig(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {config && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleAction(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm shadow-inner"
            />
            
            {/* Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              className="relative w-full max-w-[400px] glass-card overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
            >
              {/* Header logic stripe */}
              <div className={`h-1.5 w-full ${config.type === 'danger' ? 'bg-red-400' : 'bg-accent'}`} />
              
              <div className="p-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                  config.type === 'danger' ? 'bg-red-400/20 text-red-400' : 'bg-accent/20 text-accent'
                }`}>
                  {config.type === 'danger' ? <Trash2 size={28} strokeWidth={2.5} /> : <HelpCircle size={28} strokeWidth={2.5} />}
                </div>

                <h3 className="text-white text-2xl font-black tracking-tighter mb-2 leading-tight uppercase">
                  {config.title || (config.type === 'danger' ? 'Critical Action' : 'Are you sure?')}
                </h3>
                <p className="text-muted text-sm font-medium leading-relaxed opacity-80">
                  {config.message}
                </p>

                <div className="mt-10 flex flex-col gap-3">
                  <button
                    onClick={() => handleAction(true)}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                      config.type === 'danger' 
                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-500/20' 
                        : 'bg-accent text-primary hover:bg-accent/90 shadow-xl shadow-accent/20'
                    }`}
                  >
                    Confirm Action <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => handleAction(false)}
                    className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all border border-white/5 hover:border-white/10"
                  >
                    Cancel Action
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context;
};
