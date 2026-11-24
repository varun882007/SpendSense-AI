import { useState, useEffect, useCallback } from 'react';
import { Plus, Wallet, Pencil, Trash2, PlusCircle } from 'lucide-react';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import { budgetService, categoryService, transactionService } from '../services/transactionService';
import { useCurrency } from '../context/CurrencyContext';
import { getCategoryIcon } from '../utils/categoryIcons';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function BudgetForm({ budget, categories, onSubmit, onCancel, loading }) {
  const { currency: defaultCurrency } = useCurrency();
  const now = new Date();
  const [form, setForm] = useState({
    category_id: '',
    amount: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    currency: defaultCurrency,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (budget) {
      setForm({
        category_id: budget.category_id?.toString() || '',
        amount: budget.amount?.toString() || '',
        month: budget.month || now.getMonth() + 1,
        year: budget.year || now.getFullYear(),
        currency: budget.currency_code || budget.currency || defaultCurrency,
      });
    }
  }, [budget, defaultCurrency]);

  const validate = () => {
    const errs = {};
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = 'Enter a valid amount';
    if (!form.category_id) errs.category_id = 'Select a category';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      amount: parseFloat(form.amount),
      currency_code: form.currency,
      category_id: parseInt(form.category_id, 10),
      month: parseInt(form.month, 10),
      year: parseInt(form.year, 10),
    });
  };

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const INCOME_CATS = ['Salary', 'Freelance'];
  const expenseCategories = (categories || []).filter((c) => !INCOME_CATS.includes(c.name));
  const currencySymbol = form.currency === 'INR' ? '₹' : '$';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Category */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
          Category
        </label>
        <select
          value={form.category_id}
          onChange={(e) => update('category_id', e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-input)',
            border: `1px solid ${errors.category_id ? 'var(--color-danger)' : 'var(--border-color)'}`,
            color: form.category_id ? 'var(--text-primary)' : 'var(--text-muted)',
          }}
        >
          <option value="">Select a category</option>
          {expenseCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {errors.category_id && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{errors.category_id}</p>}
      </div>

      {/* Amount + Currency */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
          Budget Amount
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
              value={form.amount}
              onChange={(e) => update('amount', e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm text-right outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                border: `1px solid ${errors.amount ? 'var(--color-danger)' : 'var(--border-color)'}`,
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
        {errors.amount && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{errors.amount}</p>}
      </div>

      {/* Month / Year */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
            Month
          </label>
          <select
            value={form.month}
            onChange={(e) => update('month', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
            Year
          </label>
          <select
            value={form.year}
            onChange={(e) => update('year', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving...' : budget ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

function ProgressBar({ spent, total }) {
  const pct = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  let barColor = 'var(--color-success)';
  if (pct >= 80) barColor = 'var(--color-danger)';
  else if (pct >= 60) barColor = 'var(--color-warning)';

  return (
    <div className="w-full">
      <div
        className="w-full h-2.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--bg-input)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: barColor,
            transition: 'width 0.6s ease-out, background-color 0.3s ease',
          }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs font-medium" style={{ color: barColor }}>
          {pct.toFixed(0)}% used
        </span>
      </div>
    </div>
  );
}

function AddExpenseForm({ budget, onSubmit, onCancel, loading, formatCurrency }) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const curr = budget?.currency_code || 'INR';
  const symbol = curr === 'INR' ? '₹' : '$';
  const remaining = Math.max(parseFloat(budget?.amount || 0) - parseFloat(budget?.spent || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return; }
    onSubmit(parseFloat(amount), notes);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-xl"
        style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Budget remaining</span>
        <span className="text-sm font-bold" style={{ color: 'var(--color-success)' }}>
          {formatCurrency(remaining, curr)}
        </span>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Expense Amount ({curr})
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>{symbol}</span>
          <input type="number" step="0.01" min="0" placeholder="0.00" value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(''); }}
            className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm text-right outline-none"
            style={{ backgroundColor: 'var(--bg-input)', border: `1px solid ${error ? 'var(--color-danger)' : 'var(--border-color)'}`, color: 'var(--text-primary)' }} />
        </div>
        {error && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{error}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Notes <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
        </label>
        <input type="text" placeholder="What was this for?" value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
      </div>
      <div className="flex gap-3 pt-1">
        <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving...' : 'Add Expense'}
        </Button>
      </div>
    </form>
  );
}

export default function Budgets() {
  const { formatCurrency } = useCurrency();

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [addExpenseBudget, setAddExpenseBudget] = useState(null);

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await budgetService.getAll();
      setBudgets(res.data?.budgets || res.data?.items || res.data || []);
    } catch {
      setError('Failed to load budgets');
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryService.getAll();
      setCategories(res.data?.categories || res.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, [fetchBudgets, fetchCategories]);

  const handleCreate = () => {
    setEditingBudget(null);
    setModalOpen(true);
  };

  const handleEdit = (b) => {
    setEditingBudget(b);
    setModalOpen(true);
  };

  const handleSubmit = async (data) => {
    try {
      setSaving(true);
      if (editingBudget) {
        await budgetService.update(editingBudget.id, data);
      } else {
        await budgetService.create(data);
      }
      setModalOpen(false);
      setEditingBudget(null);
      fetchBudgets();
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await budgetService.delete(id);
      setDeleteConfirm(null);
      fetchBudgets();
    } catch {}
  };

  const handleAddExpense = async (amount, notes) => {
    if (!addExpenseBudget) return;
    try {
      setSaving(true);
      const catName = addExpenseBudget.category_name || getCategoryName(addExpenseBudget.category_id);
      await transactionService.create({
        transaction_type: 'expense',
        original_amount: amount,
        currency_code: addExpenseBudget.currency_code || 'INR',
        category_id: addExpenseBudget.category_id,
        description: notes || `${catName} expense`,
        transaction_date: new Date().toISOString().split('T')[0],
      });
      setAddExpenseBudget(null);
      fetchBudgets();
    } catch {} finally {
      setSaving(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || 'Uncategorized';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Budgets</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Set and track your spending limits</p>
        </div>
        <Button onClick={handleCreate}><Plus size={16} /> Create Budget</Button>
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
          <Button variant="secondary" size="sm" onClick={fetchBudgets} className="mt-3">Retry</Button>
        </div>
      ) : budgets.length === 0 ? (
        <div
          className="rounded-2xl"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
        >
          <EmptyState
            icon={Wallet}
            title="No budgets set"
            description="Create monthly or category-wise budgets to keep your spending on track."
            action={
              <Button size="sm" onClick={handleCreate}><Plus size={14} /> Create Budget</Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const catName = budget.category_name || getCategoryName(budget.category_id);
            const CatIcon = getCategoryIcon(catName);
            const spent = parseFloat(budget.spent || 0);
            const budgetAmt = parseFloat(budget.amount || 0);
            const remaining = Math.max(budgetAmt - spent, 0);
            const pct = budgetAmt > 0 ? (spent / budgetAmt) * 100 : 0;

            return (
              <div
                key={budget.id}
                className="rounded-2xl p-5 transition-all duration-200"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.15))')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-primary-light)' }}
                    >
                      <CatIcon size={18} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {catName}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {MONTHS[(budget.month || 1) - 1]} {budget.year}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(budget)}
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
                      onClick={() => setDeleteConfirm(budget)}
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

                {/* Amounts */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Budget</p>
                    <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(budgetAmt, budget.currency_code)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Spent</p>
                    <p className="text-sm font-bold tabular-nums" style={{ color: pct >= 80 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                      {formatCurrency(spent, budget.currency_code)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Remaining</p>
                    <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-success)' }}>
                      {formatCurrency(remaining, budget.currency_code)}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <ProgressBar spent={spent} total={budgetAmt} />

                {/* Add Expense button */}
                <button
                  onClick={() => setAddExpenseBudget(budget)}
                  className="w-full flex items-center justify-center gap-2 py-2 mt-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                >
                  <PlusCircle size={14} />
                  Add Expense
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingBudget(null); }}
        title={editingBudget ? 'Edit Budget' : 'Create Budget'}
        maxWidth="480px"
      >
        <BudgetForm
          budget={editingBudget}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditingBudget(null); }}
          loading={saving}
        />
      </Modal>

      {/* Add Expense Modal */}
      <Modal
        isOpen={!!addExpenseBudget}
        onClose={() => setAddExpenseBudget(null)}
        title={`Add Expense — ${addExpenseBudget?.category_name || getCategoryName(addExpenseBudget?.category_id) || 'Budget'}`}
        maxWidth="420px"
      >
        <AddExpenseForm
          budget={addExpenseBudget}
          onSubmit={handleAddExpense}
          onCancel={() => setAddExpenseBudget(null)}
          loading={saving}
          formatCurrency={formatCurrency}
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Budget"
        maxWidth="400px"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete the budget for{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {getCategoryName(deleteConfirm?.category_id)}
            </strong>
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
