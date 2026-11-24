import { useState, useEffect, useCallback } from 'react';
import { Plus, Target, Pencil, Trash2, PlusCircle, Calendar } from 'lucide-react';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import { savingsService } from '../services/transactionService';
import { useCurrency } from '../context/CurrencyContext';

function GoalForm({ goal, onSubmit, onCancel, loading }) {
  const { currency: defaultCurrency } = useCurrency();
  const [form, setForm] = useState({
    name: '',
    target_amount: '',
    currency: defaultCurrency,
    deadline: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (goal) {
      setForm({
        name: goal.name || '',
        target_amount: goal.target_amount?.toString() || '',
        currency: goal.currency_code || goal.currency || defaultCurrency,
        deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
      });
    }
  }, [goal, defaultCurrency]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Goal name is required';
    if (!form.target_amount || parseFloat(form.target_amount) <= 0) errs.target_amount = 'Enter a valid amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const data = {
      name: form.name,
      target_amount: parseFloat(form.target_amount),
      currency_code: form.currency,
    };
    if (form.deadline) data.deadline = form.deadline;
    onSubmit(data);
  };

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const currencySymbol = form.currency === 'INR' ? '₹' : '$';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
          Goal Name
        </label>
        <input
          type="text"
          placeholder="e.g., Emergency Fund, Vacation"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            backgroundColor: 'var(--bg-input)',
            border: `1px solid ${errors.name ? 'var(--color-danger)' : 'var(--border-color)'}`,
            color: 'var(--text-primary)',
          }}
        />
        {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{errors.name}</p>}
      </div>

      {/* Target Amount + Currency */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
          Target Amount
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
              {currencySymbol}
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.target_amount}
              onChange={(e) => update('target_amount', e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm text-right outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                border: `1px solid ${errors.target_amount ? 'var(--color-danger)' : 'var(--border-color)'}`,
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
            {['INR', 'USD'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => update('currency', c)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: form.currency === c ? 'var(--color-primary)' : 'transparent',
                  color: form.currency === c ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        {errors.target_amount && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{errors.target_amount}</p>}
      </div>

      {/* Deadline */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
          Deadline <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
        </label>
        <input
          type="date"
          value={form.deadline}
          onChange={(e) => update('deadline', e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving...' : goal ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

function AddMoneyForm({ goal, onSubmit, onCancel, loading, formatCurrency }) {
  const goalCurrency = goal?.currency_code || goal?.currency || 'INR';
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const currencySymbol = goalCurrency === 'INR' ? '₹' : '$';
  const remaining = (goal?.target_amount || 0) - (goal?.current_amount || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    onSubmit(parseFloat(amount));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        className="flex items-center justify-between p-3 rounded-xl"
        style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}
      >
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Remaining to reach goal</span>
        <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
          {formatCurrency(Math.max(remaining, 0), goalCurrency)}
        </span>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Amount to Add ({goalCurrency})
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            {currencySymbol}
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(''); }}
            className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm text-right outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              border: `1px solid ${error ? 'var(--color-danger)' : 'var(--border-color)'}`,
              color: 'var(--text-primary)',
            }}
          />
        </div>
        {error && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{error}</p>}
      </div>
      <div className="flex gap-3 pt-1">
        <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Adding...' : 'Add Money'}
        </Button>
      </div>
    </form>
  );
}

function CircularProgress({ current, target, size = 80 }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  let strokeColor = 'var(--color-primary)';
  if (pct >= 100) strokeColor = 'var(--color-success)';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--bg-input)"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <span
        className="absolute text-xs font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

export default function SavingsGoals() {
  const { formatCurrency } = useCurrency();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [addMoneyGoal, setAddMoneyGoal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await savingsService.getAll();
      setGoals(res.data?.goals || res.data?.items || res.data || []);
    } catch {
      setError('Failed to load savings goals');
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreate = () => {
    setEditingGoal(null);
    setModalOpen(true);
  };

  const handleEdit = (g) => {
    setEditingGoal(g);
    setModalOpen(true);
  };

  const handleSubmit = async (data) => {
    try {
      setSaving(true);
      if (editingGoal) {
        await savingsService.update(editingGoal.id, data);
      } else {
        await savingsService.create(data);
      }
      setModalOpen(false);
      setEditingGoal(null);
      fetchGoals();
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleAddMoney = async (amount) => {
    if (!addMoneyGoal) return;
    try {
      setSaving(true);
      const currentVal = parseFloat(addMoneyGoal.current_amount || 0);
      await savingsService.update(addMoneyGoal.id, {
        current_amount: currentVal + amount,
      });
      setAddMoneyGoal(null);
      fetchGoals();
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await savingsService.delete(id);
      setDeleteConfirm(null);
      fetchGoals();
    } catch {}
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Savings Goals</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Set targets and track your progress</p>
        </div>
        <Button onClick={handleCreate}><Plus size={16} /> New Goal</Button>
      </div>

      {/* Content */}
      {loading ? (
        <div
          className="rounded-2xl py-20"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
        >
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchGoals} className="mt-3">Retry</Button>
        </div>
      ) : goals.length === 0 ? (
        <div
          className="rounded-2xl"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
        >
          <EmptyState
            icon={Target}
            title="No savings goals"
            description="Create goals like 'Emergency Fund' or 'Vacation' and track your progress."
            action={
              <Button size="sm" onClick={handleCreate}><Plus size={14} /> New Goal</Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const current = parseFloat(goal.current_amount || 0);
            const target = parseFloat(goal.target_amount || 0);
            const deadlineStr = formatDate(goal.deadline);
            const isComplete = current >= target && target > 0;

            return (
              <div
                key={goal.id}
                className="rounded-2xl p-5 transition-all duration-200"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: `1px solid ${isComplete ? 'var(--color-success)' : 'var(--border-color)'}`,
                  boxShadow: 'var(--shadow-sm)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.15))')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {goal.name}
                    </p>
                    {deadlineStr && (
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar size={11} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {deadlineStr}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(goal)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-danger-light)';
                        e.currentTarget.style.color = 'var(--color-danger)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Circular progress + amounts */}
                <div className="flex items-center gap-5 mb-4">
                  <CircularProgress current={current} target={target} size={80} />
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Saved</p>
                      <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-success)' }}>
                        {formatCurrency(current, goal.currency_code)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Target</p>
                      <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(target, goal.currency_code)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Add Money button */}
                {!isComplete && (
                  <button
                    onClick={() => setAddMoneyGoal(goal)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                      border: '1px solid transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                  >
                    <PlusCircle size={14} />
                    Add Money
                  </button>
                )}
                {isComplete && (
                  <div
                    className="w-full text-center py-2.5 rounded-xl text-sm font-semibold"
                    style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}
                  >
                    Goal Reached!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New / Edit Goal Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingGoal(null); }}
        title={editingGoal ? 'Edit Goal' : 'New Savings Goal'}
        maxWidth="480px"
      >
        <GoalForm
          goal={editingGoal}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditingGoal(null); }}
          loading={saving}
        />
      </Modal>

      {/* Add Money Modal */}
      <Modal
        isOpen={!!addMoneyGoal}
        onClose={() => setAddMoneyGoal(null)}
        title={`Add Money to "${addMoneyGoal?.name || ''}"`}
        maxWidth="420px"
      >
        <AddMoneyForm
          goal={addMoneyGoal}
          onSubmit={handleAddMoney}
          onCancel={() => setAddMoneyGoal(null)}
          loading={saving}
          formatCurrency={formatCurrency}
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Goal"
        maxWidth="400px"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm?.name}</strong>
            ? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={() => handleDelete(deleteConfirm?.id)} className="flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
