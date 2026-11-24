import { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  DollarSign,
} from 'lucide-react';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import { financialProfileService } from '../services/transactionService';
import { useCurrency } from '../context/CurrencyContext';

const EXPENSE_CATEGORIES = [
  'Rent', 'EMI / Loan', 'Subscriptions', 'Insurance', 'Utilities',
  'Transport', 'Education', 'Healthcare', 'Other',
];

function ProfileCard({ title, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <h3
        className="text-sm font-semibold mb-4 uppercase tracking-wider"
        style={{ color: 'var(--text-secondary)' }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function FixedExpenseForm({ expense, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: '',
    amount: '',
    category: 'Other',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (expense) {
      setForm({
        name: expense.name || '',
        amount: expense.amount?.toString() || '',
        category: expense.category || 'Other',
      });
    }
  }, [expense]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = 'Enter a valid amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ name: form.name.trim(), amount: parseFloat(form.amount), category: form.category });
  };

  const update = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Expense Name
        </label>
        <input
          type="text"
          placeholder="e.g., Rent, Netflix, EMI"
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

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Monthly Amount
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={form.amount}
          onChange={(e) => update('amount', e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            backgroundColor: 'var(--bg-input)',
            border: `1px solid ${errors.amount ? 'var(--color-danger)' : 'var(--border-color)'}`,
            color: 'var(--text-primary)',
          }}
        />
        {errors.amount && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{errors.amount}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Category
        </label>
        <select
          value={form.category}
          onChange={(e) => update('category', e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-1">
        <Button variant="secondary" onClick={onCancel} className="flex-1" type="button">Cancel</Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving...' : expense ? 'Update' : 'Add Expense'}
        </Button>
      </div>
    </form>
  );
}

export default function FinancialProfile() {
  const { formatCurrency } = useCurrency();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const [incomeError, setIncomeError] = useState('');

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await financialProfileService.getProfile();
      setProfile(res.data);
    } catch {
      setProfile({ monthly_income: 0, total_fixed_expenses: 0, fixed_expenses: [], currency_code: 'INR' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const monthlyIncome = parseFloat(profile?.monthly_income ?? 0);
  const totalFixed = parseFloat(profile?.total_fixed_expenses ?? 0);
  const netAvailable = monthlyIncome - totalFixed;

  const handleSaveIncome = async () => {
    const val = parseFloat(incomeInput);
    if (!incomeInput || isNaN(val) || val < 0) {
      setIncomeError('Enter a valid income amount');
      return;
    }
    try {
      setSaving(true);
      const res = await financialProfileService.updateProfile({ monthly_income: val });
      setProfile(res.data);
      setEditingIncome(false);
      setIncomeError('');
    } catch {
      setIncomeError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddExpense = async (data) => {
    try {
      setSaving(true);
      if (editingExpense) {
        await financialProfileService.updateFixedExpense(editingExpense.id, data);
      } else {
        await financialProfileService.addFixedExpense(data);
      }
      setExpenseModalOpen(false);
      setEditingExpense(null);
      fetchProfile();
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await financialProfileService.deleteFixedExpense(id);
      setDeleteConfirm(null);
      fetchProfile();
    } catch {}
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Financial Profile</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Set your income and fixed monthly expenses</p>
        </div>
        <LoadingSpinner size="lg" className="py-20" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Financial Profile</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Set your monthly income and recurring fixed expenses to track your true available balance.
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Monthly Income */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-success-light)' }}>
              <TrendingUp size={15} style={{ color: 'var(--color-success)' }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Monthly Income</span>
          </div>
          <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-success)' }}>
            {formatCurrency(monthlyIncome)}
          </p>
        </div>

        {/* Total Fixed Expenses */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-danger-light)' }}>
              <TrendingDown size={15} style={{ color: 'var(--color-danger)' }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Fixed Expenses</span>
          </div>
          <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-danger)' }}>
            {formatCurrency(totalFixed)}
          </p>
        </div>

        {/* Net Available */}
        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: `1px solid ${netAvailable >= 0 ? 'var(--color-primary)' : 'var(--color-danger)'}`,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-light)' }}>
              <Wallet size={15} style={{ color: 'var(--color-primary)' }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Net Available</span>
          </div>
          <p
            className="text-2xl font-bold tabular-nums"
            style={{ color: netAvailable >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}
          >
            {formatCurrency(netAvailable)}
          </p>
        </div>
      </div>

      {/* Income section */}
      <ProfileCard title="Monthly Income">
        {editingIncome ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Monthly Income Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={incomeInput}
                onChange={(e) => { setIncomeInput(e.target.value); setIncomeError(''); }}
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: `1px solid ${incomeError ? 'var(--color-danger)' : 'var(--color-primary)'}`,
                  color: 'var(--text-primary)',
                }}
              />
              {incomeError && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{incomeError}</p>}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => { setEditingIncome(false); setIncomeError(''); }} className="flex-1">
                <X size={14} /> Cancel
              </Button>
              <Button onClick={handleSaveIncome} disabled={saving} className="flex-1">
                <Save size={14} /> {saving ? 'Saving...' : 'Save Income'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(monthlyIncome)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {monthlyIncome > 0 ? 'per month' : 'Not set yet — click Edit to add your income'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setIncomeInput(monthlyIncome.toString()); setEditingIncome(true); }}
            >
              <Pencil size={14} /> Edit
            </Button>
          </div>
        )}
      </ProfileCard>

      {/* Fixed Expenses section */}
      <ProfileCard title="Fixed Monthly Expenses">
        <div className="flex items-center justify-between mb-4 -mt-1">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Recurring expenses that happen every month (rent, EMIs, subscriptions...)
          </p>
          <Button
            size="sm"
            onClick={() => { setEditingExpense(null); setExpenseModalOpen(true); }}
          >
            <Plus size={14} /> Add
          </Button>
        </div>

        {(profile?.fixed_expenses || []).length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No fixed expenses"
            description="Add your recurring monthly expenses like rent, EMIs, and subscriptions."
            action={
              <Button size="sm" onClick={() => { setEditingExpense(null); setExpenseModalOpen(true); }}>
                <Plus size={14} /> Add Expense
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {(profile.fixed_expenses || []).map((expense) => (
              <div
                key={expense.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {expense.name}
                  </p>
                  {expense.category && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{expense.category}</p>
                  )}
                </div>
                <span className="text-sm font-bold tabular-nums whitespace-nowrap" style={{ color: 'var(--color-danger)' }}>
                  {formatCurrency(parseFloat(expense.amount))}
                </span>
                <div className="flex gap-1 ml-1">
                  <button
                    onClick={() => { setEditingExpense(expense); setExpenseModalOpen(true); }}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary-light)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(expense)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-danger-light)'; e.currentTarget.style.color = 'var(--color-danger)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {/* Total row */}
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl mt-3"
              style={{ backgroundColor: 'var(--color-danger-light)', border: '1px solid var(--color-danger)' }}
            >
              <span className="text-sm font-bold" style={{ color: 'var(--color-danger)' }}>Total Fixed Expenses</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-danger)' }}>
                {formatCurrency(totalFixed)}
              </span>
            </div>
          </div>
        )}
      </ProfileCard>

      {/* Add/Edit Expense Modal */}
      <Modal
        isOpen={expenseModalOpen}
        onClose={() => { setExpenseModalOpen(false); setEditingExpense(null); }}
        title={editingExpense ? 'Edit Fixed Expense' : 'Add Fixed Expense'}
        maxWidth="460px"
      >
        <FixedExpenseForm
          expense={editingExpense}
          onSubmit={handleAddExpense}
          onCancel={() => { setExpenseModalOpen(false); setEditingExpense(null); }}
          loading={saving}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Expense"
        maxWidth="380px"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm?.name}</strong>?
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={() => handleDeleteExpense(deleteConfirm?.id)} className="flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
