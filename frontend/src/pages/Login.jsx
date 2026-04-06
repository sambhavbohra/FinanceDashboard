import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { Wallet, Mail, Lock, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const { login, emailLogin, emailRegister, user } = useFinance();
  const navigate = useNavigate();
  const [isLoginBlock, setIsLoginBlock] = useState(true);
  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isLoginBlock) {
      const res = await emailLogin(formData.email, formData.password);
      if (res.success) navigate('/', { replace: true });
      else setError(res.message);
    } else {
      if (!formData.name) return setError('Name is required');
      const res = await emailRegister(formData.name, formData.email, formData.password, formData.username);
      if (res.success) navigate('/', { replace: true });
      else setError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0C0C0C] px-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-12 w-full max-w-lg border-2 border-white/5 relative z-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shadow-[0_0_30px_rgba(226,254,116,0.3)]">
            <Wallet className="text-primary w-8 h-8" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white mb-2 tracking-tighter italic">FIN<span className="text-accent underline decoration-2 underline-offset-4 decoration-accent/30">TRACK</span></h1>
          <p className="text-muted text-[10px] font-black uppercase tracking-[0.3em] opacity-60 italic">{isLoginBlock ? 'System Authentication Required' : 'Initialize New Intelligence Profile'}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <AnimatePresence mode="wait">
            {!isLoginBlock && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-muted" />
                  </div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-secondary/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-muted text-sm font-medium">@</span>
                  </div>
                  <input
                    type="text"
                    placeholder="username (used to find you)"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                    className="w-full bg-secondary/50 border border-white/10 rounded-xl py-3 pl-9 pr-4 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-muted" />
            </div>
            <input
              type="email"
              required
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-secondary/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-muted" />
            </div>
            <input
              type="password"
              required
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full bg-secondary/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3 px-4 bg-accent text-primary font-bold rounded-xl hover:bg-accent/90 transition-colors shadow-[0_0_20px_rgba(226,254,116,0.2)] hover:shadow-[0_0_25px_rgba(226,254,116,0.4)]"
          >
            {isLoginBlock ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted">Or continue with</span>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              await login(credentialResponse.credential);
              navigate('/', { replace: true });
            }}
            onError={() => { console.error('Login Failed'); setError('Google Sign-in failed'); }}
            theme="filled_black"
            shape="rectangular"
            size="large"
            text={isLoginBlock ? "signin_with" : "signup_with"}
          />
        </div>
        
        <div className="text-center mt-6">
          <button 
            onClick={() => { setIsLoginBlock(!isLoginBlock); setError(''); }}
            className="text-sm text-accent hover:underline focus:outline-none"
          >
            {isLoginBlock ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <p className="mt-8 text-xs text-white/40 text-center">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
