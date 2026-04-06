import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Sparkles, ArrowRight, Shield } from 'lucide-react';
import axios from 'axios';
import PhoneInputPkg from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const PhoneInput = PhoneInputPkg.default || PhoneInputPkg;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function CompleteProfile() {
  const { user, setUser } = useFinance();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (form.username.length < 3) return setError('Username must be at least 3 characters');
    if (form.phone.length < 10) return setError('Please enter a valid phone number');

    setLoading(true);
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });

      const phoneNumber = `+${form.phone.replace(/\D/g, '')}`;
      const result = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      setConfirmationResult(result);
      setNeedsOtp(true);
    } catch (err) {
      setError(err.message || 'Error sending SMS');
    }
    setLoading(false);
  };

  const handleVerifyAndComplete = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await confirmationResult.confirm(otpValue);
      const idToken = await result.user.getIdToken();

      const res = await axios.post(`${API_URL}/users/complete-profile`, {
        username: form.username,
        phone: form.phone,
        firebaseToken: idToken
      });
      
      setUser(res.data);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass-card p-10 w-full max-w-lg border border-white/5 shadow-2xl relative"
      >
        <div className="absolute top-4 right-4 bg-accent/10 p-2 rounded-xl text-accent">
           <Shield size={20} />
        </div>

        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-[32px] bg-secondary border-2 border-white/5 flex items-center justify-center mb-4 relative overflow-hidden group">
             {user?.picture ? (
                <img src={user.picture} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
             ) : (
                <Sparkles size={32} className="text-accent" />
             )}
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter text-center">Identity Setup</h1>
          <p className="text-muted text-sm font-medium mt-1">Ready to manage your funds, {user?.name?.split(' ')[0]}?</p>
        </div>

        <form onSubmit={needsOtp ? handleVerifyAndComplete : handleRequestOtp} className="space-y-6">
          <div className="space-y-2">
             <label className="text-[10px] text-muted font-black uppercase tracking-[0.2em] ml-1">Username <span className="text-accent">*</span></label>
             <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors">
                   <User size={18} />
                </div>
                <input
                  required
                  placeholder="name_00"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  className="w-full bg-secondary border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                />
             </div>
             <p className="text-[10px] text-white/20 ml-2">Unique handle used to add you to expense groups.</p>
          </div>

          {!needsOtp ? (
              <div className="space-y-2 fintrack-phone-container">
                 <label className="text-[10px] text-muted font-black uppercase tracking-[0.2em] ml-1">Phone Validation</label>
                 <PhoneInput
                   country={'in'}
                   value={form.phone}
                   onChange={phone => setForm(f => ({ ...f, phone }))}
                   containerClass="phone-container"
                   inputClass="phone-input-field"
                   buttonClass="phone-dropdown-btn"
                   placeholder="+91 Phone"
                   disabled={loading}
                 />
              </div>
          ) : (
              <div className="space-y-2 animate-in slide-in-from-bottom-4">
                 <label className="text-[10px] text-accent font-black uppercase tracking-[0.2em] ml-1">Enter Verification Code</label>
                 <div className="relative">
                    <input 
                       value={otpValue} 
                       onChange={e => setOtpValue(e.target.value.replace(/[^0-9]/g, ''))}
                       maxLength={6}
                       className="w-full bg-secondary border-2 border-accent/30 focus:border-accent rounded-2xl px-6 py-5 text-white font-black text-3xl text-center tracking-[0.5em] focus:outline-none transition-all"
                       placeholder="000000"
                       autoFocus
                    />
                    <p className="text-[10px] text-center text-muted font-black uppercase tracking-widest mt-4">Code sent to +{form.phone}</p>
                 </div>
              </div>
          )}

          <button
            type="submit"
            disabled={loading || form.username.length < 3}
            className="w-full h-16 flex items-center justify-center gap-3 bg-accent text-primary font-black text-lg rounded-2xl hover:bg-accent/90 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] mt-6 group"
          >
            {loading ? (
               <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
               <>
                 {needsOtp ? 'Verify & Continue' : 'Verify Phone & Start'}
                 <ArrowRight size={22} strokeWidth={3} className="group-hover:translate-x-1.5 transition-transform" />
               </>
             )}
          </button>
          
          {needsOtp && !loading && (
             <button 
                type="button" 
                onClick={() => { setNeedsOtp(false); setConfirmationResult(null); }}
                className="w-full text-[10px] font-black text-muted uppercase tracking-[0.2em] hover:text-white transition-colors py-2"
             >
                Change Phone Number
             </button>
          )}

          {error && (
             <div className="pt-4 animate-bounce-slow">
                <div className="px-5 py-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black rounded-xl text-center flex items-center justify-center gap-2">
                   <Shield size={14} />
                   {error}
                </div>
             </div>
          )}
        </form>
      </motion.div>

      <div id="recaptcha-container"></div>

      <style>{`
         .fintrack-phone-container .phone-container { width: 100% !important; }
         .fintrack-phone-container .phone-input-field {
            width: 100% !important;
            height: 64px !important;
            background: #1c1c1e !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
            border-radius: 16px !important;
            color: white !important;
            font-size: 16px !important;
            font-weight: 700 !important;
            padding-left: 60px !important;
         }
         .fintrack-phone-container .phone-dropdown-btn { background: transparent !important; border: none !important; }
      `}</style>
    </div>
  );
}
