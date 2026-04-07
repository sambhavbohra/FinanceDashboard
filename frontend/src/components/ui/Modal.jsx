import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed inset-0 flex items-center justify-center z-[1000] px-4 pointer-events-none pb-20 md:pb-0"
          >
            <div className="bg-card border border-white/10 rounded-[32px] sm:rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden flex flex-col max-h-[80vh] md:max-h-[90vh]">
              <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 shrink-0 bg-secondary/30">
                <h2 className="text-sm sm:text-lg font-black text-white uppercase tracking-tighter">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all active:scale-90"
                >
                  <X size={20} strokeWidth={3} />
                </button>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
