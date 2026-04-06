import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Shield, LogOut, ChevronRight, Phone, CheckCircle, Edit, X, ArrowLeft, Wallet, Camera, Trash2 } from 'lucide-react';
import axios from 'axios';
import PhoneInputPkg from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const PhoneInput = PhoneInputPkg.default || PhoneInputPkg;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Settings() {
  const { user, setUser, logout } = useFinance();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(null); 
  const [tempValue, setTempValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const startEdit = (field, current) => {
     setEditing(field);
     setTempValue(String(current || ''));
     setError('');
     setNeedsOtp(false);
  };

  const saveEdit = async () => {
      if (loading) return;
      
      // Basic Validation
      if (editing === 'phone' && tempValue.length < 10) {
         setError('Phone number is too short to be verified');
         return;
      }

      if (editing === 'username' && tempValue.length < 3) {
         setError('Username must be at least 3 characters');
         return;
      }

      setLoading(true);
      setError('');
      try {
         if (editing === 'phone' && !needsOtp) {
            try {
               // Firebase Setup Recaptcha with Reset
               if (window.recaptchaVerifier) {
                  window.recaptchaVerifier.clear();
                  window.recaptchaVerifier = null;
               }
               
               window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                  'size': 'invisible'
               });

               // Ensure phone starts with + exactly once
               const cleanPhone = `+${tempValue.replace(/\D/g, '')}`;
               const result = await signInWithPhoneNumber(auth, cleanPhone, window.recaptchaVerifier);
               setConfirmationResult(result);
               setNeedsOtp(true);
               setOtpValue('');
               return; 
            } catch (err) {
               console.error('Firebase SMS Error:', err);
               setError(err.message);
               throw err;
            }
         }

         if (editing === 'phone' && needsOtp) {
            try {
               // Verify Firebase OTP
               const result = await confirmationResult.confirm(otpValue);
               const idToken = await result.user.getIdToken();
               
               // Sync with backend
               const res = await axios.post(`${API_URL}/users/verify-firebase-phone`, { 
                  phone: tempValue,
                  token: idToken 
               });

               setUser(res.data);
               setEditing(null);
               setNeedsOtp(false);
               setConfirmationResult(null);
               return;
            } catch (err) {
               console.error('OTP Verification Error:', err);
               setError(err.message);
               throw err;
            }
         }

         const payload = editing === 'username' 
            ? { username: tempValue.toLowerCase().replace(/[^a-z0-9_]/g, '') } 
            : { phone: tempValue };
         
         const endpoint = editing === 'username' ? '/users/username' : '/users/complete-profile';
         const method = editing === 'username' ? 'patch' : 'post';
         
         const res = await axios({
            method: method,
            url: `${API_URL}${endpoint}`,
            data: editing === 'username' ? payload : { username: user.username, phone: tempValue }
         });

         setUser(res.data);
         setEditing(null);
      } catch (err) {
         setError(err.response?.data?.message || 'Update failed');
      } finally {
         setLoading(false);
      }
   };

  return (
    <div className="space-y-10 pb-24 md:pb-0 max-w-4xl mx-auto fintrack-settings overflow-visible">
      <header className="flex items-center gap-6">
        <button 
          onClick={() => navigate(-1)} 
          className="w-14 h-14 bg-white/5 border border-white/10 rounded-[20px] flex items-center justify-center hover:bg-accent hover:text-primary transition-all text-muted active:scale-95 shrink-0 shadow-lg"
        >
           <ArrowLeft size={24} strokeWidth={3} />
        </button>
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black text-white tracking-tighter leading-none mb-1">
            IDENTITY <span className="text-accent underline decoration-4 decoration-accent/30 underline-offset-4">& PRIVACY</span>
          </motion.h1>
          <p className="text-muted text-[10px] uppercase font-black tracking-[0.4em] flex items-center gap-2 opacity-60">
             <Shield size={12} className="text-accent" /> Security Layer Active
          </p>
        </div>
      </header>

      {/* Profile Spotlight Overhaul */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-12 border-2 border-white/5 relative group overflow-hidden bg-gradient-to-br from-accent/5 via-transparent to-transparent shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="relative group/avatar cursor-pointer">
             <div className="w-32 h-32 rounded-[48px] bg-secondary border-4 border-white/10 flex items-center justify-center text-accent text-4xl font-black shadow-2xl relative overflow-hidden transition-all duration-500 group-hover/avatar:rotate-6 group-hover/avatar:scale-105 group-hover/avatar:border-accent">
                {user?.picture ? <img src={user.picture} className="w-full h-full object-cover" alt="" /> : user?.name?.[0]}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                   <Camera size={24} className="text-white" />
                </div>
             </div>
             <div className="absolute -bottom-3 -right-3 bg-accent p-3 rounded-[20px] shadow-2xl border-4 border-[#0C0C0C] animate-bounce-slow">
                <Shield size={22} className="text-primary" strokeWidth={3} />
             </div>
          </div>
          
          <div className="text-center md:text-left flex-1 min-w-0">
            <h3 className="text-white font-black text-5xl tracking-tighter leading-none mb-4 truncate">{user?.name}</h3>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
               <div className="flex items-center gap-3 bg-accent text-primary px-5 py-3 rounded-[24px] text-xs font-black uppercase tracking-widest shadow-xl shadow-accent/20">
                  <User size={16} strokeWidth={3} />
                  {user?.username || 'GUEST_HUB'}
               </div>
               <div className="flex items-center gap-3 text-white font-bold px-5 py-3 bg-white/5 rounded-[24px] text-xs border border-white/10 backdrop-blur-md">
                  <Mail size={16} className="text-accent" />
                  {user?.email}
               </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-[-50%] left-[-10%] w-80 h-80 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-20">
         {/* Username Control */}
         <div className="glass-card p-0 overflow-visible group border-2 border-white/5 hover:border-accent/30 transition-all bg-white/2 bg-gradient-to-tr from-white/2 to-transparent">
            <div className="flex flex-col p-8 gap-6 h-full">
               <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-[20px] bg-secondary flex items-center justify-center text-muted group-hover:bg-accent group-hover:shadow-lg group-hover:shadow-accent/20 group-hover:text-primary transition-all duration-300 transform group-hover:-rotate-3">
                     <User size={28} strokeWidth={3} />
                  </div>
                  {!editing && (
                     <button onClick={() => startEdit('username', user?.username)} className="p-4 bg-white/5 hover:bg-accent hover:text-primary rounded-2xl transition-all shadow-md active:scale-90">
                        <Edit size={22} strokeWidth={3} />
                     </button>
                  )}
               </div>
               
               <div className="space-y-4">
                  <p className="text-[10px] text-accent/60 font-black uppercase tracking-[0.3em]">Namespace Handle</p>
                  {editing === 'username' ? (
                     <div className="space-y-4 animate-in slide-in-from-bottom-4">
                        <div className="relative">
                           <input 
                              value={tempValue} 
                              onChange={e => setTempValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                              className="w-full bg-white/5 border-2 border-accent/50 focus:border-accent rounded-3xl px-6 py-5 text-white font-black text-2xl focus:outline-none shadow-2xl transition-all"
                              placeholder="unique_id"
                              autoFocus
                           />
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-accent/10 rounded-xl">
                              <span className="text-[10px] font-black text-accent uppercase">Social ID</span>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={saveEdit} disabled={loading} className="flex-1 py-5 bg-accent text-primary rounded-3xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-2">
                              {loading ? 'Saving...' : <><CheckCircle size={18} strokeWidth={3} /> Confirm Change</>}
                           </button>
                           <button onClick={() => setEditing(null)} className="w-16 h-16 bg-red-400 text-white rounded-3xl flex items-center justify-center hover:bg-red-500 transition-all active:scale-90">
                              <X size={24} strokeWidth={3} />
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="flex items-end justify-between">
                        <p className="text-white font-black text-4xl tracking-tighter leading-none">@{user?.username || 'not_claimed'}</p>
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Phone Control */}
         <div className="glass-card p-0 overflow-visible group border-2 border-white/5 hover:border-accent/30 transition-all bg-white/2 bg-gradient-to-tr from-white/2 to-transparent fintrack-phone-container">
            <div className="flex flex-col p-8 gap-6 h-full">
               <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-[20px] bg-secondary flex items-center justify-center text-muted group-hover:bg-accent group-hover:shadow-lg group-hover:shadow-accent/20 group-hover:text-primary transition-all duration-300 transform group-hover:rotate-3">
                     <Phone size={28} strokeWidth={3} />
                  </div>
                  {!editing && (
                     <button onClick={() => startEdit('phone', user?.phone)} className="p-4 bg-white/5 hover:bg-accent hover:text-primary rounded-2xl transition-all shadow-md active:scale-90">
                        <Edit size={22} strokeWidth={3} />
                     </button>
                  )}
               </div>

               <div className="space-y-4">
                  <p className="text-[10px] text-accent/60 font-black uppercase tracking-[0.3em]">Verified Comm Link</p>
                  {editing === 'phone' ? (
                     <div className="space-y-4 animate-in slide-in-from-bottom-4">
                        {!needsOtp ? (
                           <div className="relative z-[1001]">
                              <PhoneInput
                                 country={'in'}
                                 value={tempValue}
                                 onChange={phone => setTempValue(String(phone))}
                                 containerClass="phone-container"
                                 inputClass="phone-input-field"
                                 buttonClass="phone-dropdown-btn"
                                 placeholder="+91 Phone"
                                 disabled={loading}
                                 priority={{'ca': 0, 'us': 1, 'in': 2}}
                              />
                           </div>
                        ) : (
                           <div className="relative">
                              <input 
                                 value={otpValue} 
                                 onChange={e => setOtpValue(e.target.value.replace(/[^0-9]/g, ''))}
                                 maxLength={6}
                                 className="w-full bg-white/5 border-2 border-accent/50 focus:border-accent rounded-3xl px-6 py-5 text-white font-black text-3xl text-center tracking-[0.5em] focus:outline-none shadow-2xl transition-all"
                                 placeholder="000000"
                                 autoFocus
                              />
                              <p className="text-[9px] text-center text-muted font-black uppercase tracking-widest mt-3">6-Digit Code Requested</p>
                           </div>
                        )}
                        <div className="flex gap-3 relative z-[1000]">
                           <button onClick={saveEdit} disabled={loading} className="flex-1 py-5 bg-accent text-primary rounded-3xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-2">
                              {loading ? 'Validating...' : (needsOtp ? <><Shield size={18} strokeWidth={3} /> Verify Code</> : <><CheckCircle size={18} strokeWidth={3} /> Request OTP</>)}
                           </button>
                           <button onClick={() => { setEditing(null); setNeedsOtp(false); }} className="w-16 h-16 bg-red-400 text-white rounded-3xl flex items-center justify-center hover:bg-red-500 transition-all active:scale-90">
                              <X size={24} strokeWidth={3} />
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="flex flex-col gap-2">
                        <div className="flex items-end justify-between">
                           <p className="text-white font-black text-4xl tracking-tighter leading-none">{user?.phone ? `+${user.phone}` : 'AUTH_NULL'}</p>
                           <div className={`w-2 h-2 rounded-full ${user?.phoneVerified ? 'bg-accent animate-pulse' : 'bg-red-400'}`} />
                        </div>
                        {user?.phone && !user?.phoneVerified && (
                           <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Unverified Number</p>
                        )}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>

      {error && (
         <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-red-500/10 border-2 border-red-500/20 text-red-400 rounded-3xl text-sm font-black text-center flex items-center justify-center gap-3">
            <X size={20} className="bg-red-500/20 rounded-full p-0.5" /> {error}
         </motion.div>
      )}

      {/* Simple Logout */}
      <div className="flex justify-center pt-10">
         <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-8 py-4 bg-white/5 text-muted hover:text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all border border-white/10 hover:border-red-400/30 hover:bg-red-400/5 active:scale-95 group"
         >
            Logout Account
            <LogOut size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
         </button>
      </div>

      <div id="recaptcha-container"></div>

      <style>{`
         .fintrack-phone-container .phone-container { width: 100% !important; z-index: 10000; }
         .fintrack-phone-container .phone-input-field {
            width: 100% !important;
            height: 72px !important;
            background: rgba(255,255,255,0.05) !important;
            border: 2px solid rgba(226,254,116,0.3) !important;
            border-radius: 24px !important;
            color: white !important;
            font-size: 24px !important;
            font-weight: 900 !important;
            padding-left: 70px !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 10px 40px -10px rgba(0,0,0,0.4) inset;
         }
         .fintrack-phone-container .phone-input-field:focus {
            border-color: #E2FE74 !important;
            background: rgba(255,255,255,0.08) !important;
            box-shadow: 0 0 20px rgba(226,254,116,0.2) !important;
            outline: none !important;
         }
         .fintrack-phone-container .phone-dropdown-btn { 
            background: transparent !important; 
            border: none !important; 
            padding-left: 12px !important;
         }
         .fintrack-phone-container .country-list {
            background: #141414 !important;
            border: 2px solid rgba(255,255,255,0.1) !important;
            border-radius: 20px !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.8) !important;
            overflow: hidden !important;
            margin-top: 10px !important;
            padding: 8px !important;
         }
         .fintrack-phone-container .country-list .country {
            border-radius: 12px !important;
            padding: 10px 12px !important;
            transition: all 0.2s;
         }
         .fintrack-phone-container .country-list .country:hover {
            background: rgba(255,255,255,0.05) !important;
         }
         .fintrack-phone-container .country-list .country.highlight {
            background: #E2FE74 !important;
         }
         .fintrack-phone-container .country-list .country.highlight .country-name,
         .fintrack-phone-container .country-list .country.highlight .dial-code {
            color: #0C0C0C !important;
         }
         .fintrack-phone-container .country-list .country .country-name { color: #888 !important; font-weight: 700; }
         .fintrack-phone-container .country-list .country .dial-code { color: #555 !important; }
         
         .no-scrollbar::-webkit-scrollbar { display: none; }
         .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
         
         @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
         }
         .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
