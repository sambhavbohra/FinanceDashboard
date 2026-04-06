import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import Modal from '../ui/Modal';
import DatePicker from '../ui/DatePicker';

const suggestions = ['New Laptop', 'Bali Trip', 'Emergency Fund', 'New Phone', 'Books', 'Bike'];

export default function AddGoalModal({ isOpen, onClose }) {
  const { addGoal } = useFinance();
  const [form, setForm] = useState({ name: '', target: '', deadline: null });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.target || !form.deadline) return;
    setLoading(true);
    await addGoal({ ...form, target: parseFloat(form.target), deadline: form.deadline.toISOString() });
    setLoading(false);
    setForm({ name: '', target: '', deadline: null });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Savings Goal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            required
            placeholder="Goal name (e.g. New Laptop)"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-secondary border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            {suggestions.map(s => (
              <button key={s} type="button" onClick={() => setForm(f => ({ ...f, name: s }))}
                className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-full text-muted hover:text-accent hover:border-accent/30 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>

        <input
          required
          type="number"
          min="1"
          placeholder="Target Amount (₹)"
          value={form.target}
          onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
          className="w-full bg-secondary border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
        />

        <DatePicker
          label="Target Deadline"
          selected={form.deadline}
          onChange={date => setForm(f => ({ ...f, deadline: date }))}
          minDate={new Date()}
          placeholderText="Pick a deadline..."
        />

        <button
          type="submit"
          disabled={loading || !form.deadline}
          className="w-full bg-accent text-primary font-bold py-3 rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Create Goal'}
        </button>
      </form>
    </Modal>
  );
}
