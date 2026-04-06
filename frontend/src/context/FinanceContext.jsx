import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const FinanceContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const initialData = {
  transactions: [],
  goals: [],
  insights: []
};

// Axios interceptor for JWT
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const FinanceProvider = ({ children }) => {
  const [data, setData] = useState(initialData);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setData(initialData);
    setLoading(false);
  };

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`);
      setUser(res.data);
      fetchData();
    } catch (error) {
      console.error(error);
      logout();
    }
  };

  const login = async (googleToken) => {
    try {
      const res = await axios.post(`${API_URL}/auth/google`, { token: googleToken });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      fetchData();
    } catch (error) {
      console.error("Google Login failed", error);
    }
  };

  const emailLogin = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      fetchData();
      return { success: true };
    } catch (error) {
      console.error("Login failed", error);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const emailRegister = async (name, email, password, username) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { name, email, password, username });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      fetchData();
      return { success: true };
    } catch (error) {
      console.error("Registration failed", error);
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  };

  const fetchData = async () => {
    try {
      const [txRes, goalsRes] = await Promise.all([
        axios.get(`${API_URL}/data/transactions`),
        axios.get(`${API_URL}/data/goals`)
      ]);
      setData({
        ...data,
        transactions: txRes.data,
        goals: goalsRes.data
      });
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction) => {
    try {
      const res = await axios.post(`${API_URL}/data/transactions`, transaction);
      setData(prev => ({
        ...prev,
        transactions: [res.data, ...prev.transactions]
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const addGoal = async (goal) => {
    try {
      const res = await axios.post(`${API_URL}/data/goals`, goal);
      setData(prev => ({
        ...prev,
        goals: [res.data, ...prev.goals]
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const addFundsToGoal = async (goalId, amount) => {
    try {
      const res = await axios.patch(`${API_URL}/data/goals/${goalId}/add-funds`, { amount });
      const { goal, transaction } = res.data;
      
      setData(prev => ({
        ...prev,
        goals: prev.goals.map(g => g._id === goalId ? goal : g),
        transactions: [transaction, ...prev.transactions]
      }));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const deleteGoal = async (id) => {
    try {
      await axios.delete(`${API_URL}/data/goals/${id}`);
      setData(prev => ({
        ...prev,
        goals: prev.goals.filter(g => g._id !== id)
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const editGoal = async (id, updates) => {
    try {
      const res = await axios.patch(`${API_URL}/data/goals/${id}`, updates);
      setData(prev => ({
        ...prev,
        goals: prev.goals.map(g => g._id === id ? res.data : g)
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const editGroup = async (id, updates) => {
    try {
      const res = await axios.patch(`${API_URL}/groups/${id}`, updates);
      // Data context doesn't track groups array directly, but let's sync if needed.
      // Usually fetchGroups is used in the page.
      return res.data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await axios.delete(`${API_URL}/data/transactions/${id}`);
      setData(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t._id !== id)
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const editTransaction = async (id, updates) => {
    try {
      const res = await axios.patch(`${API_URL}/data/transactions/${id}`, updates);
      setData(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => t._id === id ? res.data : t)
      }));
      return res.data;
    } catch (error) {
      console.error(error);
    }
  };

  // Derived state
  const totalIncome = data.transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenses = data.transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpenses;
  
  // Health Score Calculation
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  const healthScore = Math.min(100, Math.max(0, Math.round(50 + (savingsRate * 1.5))));

  return (
    <FinanceContext.Provider value={{
      ...data,
      user,
      setUser,
      loading,
      login,
      emailLogin,
      emailRegister,
      logout,
      totalIncome,
      totalExpenses,
      balance,
      healthScore,
      addTransaction,
      editTransaction,
      deleteTransaction,
      fetchData,
      setData,
      addGoal,
      addFundsToGoal,
      deleteGoal,
      editGoal,
      editGroup
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
