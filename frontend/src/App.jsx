import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import Analytics from './pages/Analytics';
import Goals from './pages/Goals';
import Insights from './pages/Insights';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import Splits from './pages/Splits';
import Friends from './pages/Friends';
import Login from './pages/Login';
import CompleteProfile from './pages/CompleteProfile';
import JoinGroup from './pages/JoinGroup';
import Decisions from './pages/Decisions';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useFinance();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full bg-accent/20 animate-pulse flex items-center justify-center">
          <span className="text-accent font-bold text-xl">₹</span>
        </div>
        <p className="text-muted text-sm uppercase tracking-widest font-black">Validating FinTrack Session…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (user.googleId && !user.profileComplete && window.location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  return children;
};

const AppContent = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/join/:token" element={<JoinGroup />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />

      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/transactions" element={<PrivateRoute><Layout><Transactions /></Layout></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><Layout><Analytics /></Layout></PrivateRoute>} />
      <Route path="/goals" element={<PrivateRoute><Layout><Goals /></Layout></PrivateRoute>} />
      <Route path="/insights" element={<PrivateRoute><Layout><Insights /></Layout></PrivateRoute>} />
      <Route path="/splits" element={<PrivateRoute><Layout><Splits /></Layout></PrivateRoute>} />
      <Route path="/friends" element={<PrivateRoute><Layout><Friends /></Layout></PrivateRoute>} />
      <Route path="/decisions" element={<PrivateRoute><Layout><Decisions /></Layout></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Layout><Settings /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <FinanceProvider>
          <AppContent />
        </FinanceProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
