import { useState, useEffect } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import Button from '../common/Button';

const EXPENSE_CATEGORIES = ['Salary', 'Freelance'];

export default function TransactionForm({ transaction, categories, onSubmit, onCancel, loading }) {
  const { currency: defaultCurrency } = useCurrency();
  const [form, setForm] = useState({
    amount: '',
    currency: defaultCurrency,
    category_id: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (transaction) {
      setForm({
        amount: (transaction.original_amount ?? transaction.amount ?? '').toString(),
        currency: transaction.currency_code || transaction.currency || defaultCurrency,
        category_id: (transaction.category_id ?? '').toString(),
        notes: transaction.notes || transaction.description || '',
      });
    } else {
      setForm({
        amount: '',
        currency: defaultCurrency,
        category_id: '',
        notes: '',
      });
    }
  }, [transaction, defaultCurrency]);

  const validate = () => {
    const errs = {};
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = 'Enter a valid amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const getCategoryName = (id) => {
    const cat = (categories || []).find((c) => c.id === parseInt(id, 10));
    return cat?.name || '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const catName = getCategoryName(form.category_id);
    const description = form.notes?.trim() || catName || 'Expense';
    onSubmit({
      transaction_type: 'expense',
      original_amount: parseFloat(form.amount),
      currency_code: form.currency,
      category_id: form.category_id ? parseInt(form.category_id, 10) : null,
      description,
      notes: form.notes || null,
      transaction_date: new Date().toISOString().split('T')[0],
    });
  };

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const currencySymbol = form.currency === 'INR' ? '₹' : '$';

  const filteredCategories = (categories || []).filter(
    (cat) => !EXPENSE_CATEGORIES.includes(cat.name)
  );

  const inputStyle = {
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount + Currency */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Amount
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
              className="w-full pl-8 pr-4 py-2 rounded-xl text-sm text-right outline-none"
              style={{ ...inputStyle, borderColor: errors.amount ? 'var(--color-danger)' : 'var(--border-color)' }}
            />
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
            {['INR', 'USD'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => update('currency', c)}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
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

      {/* Category */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Category
        </label>
        <select
          value={form.category_id}
          onChange={(e) => update('category_id', e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none appearance-none cursor-pointer"
          style={{ ...inputStyle, color: form.category_id ? 'var(--text-primary)' : 'var(--text-muted)' }}
        >
          <option value="">Select category</option>
          {filteredCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Notes <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g., Grocery shopping"
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={inputStyle}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving...' : transaction ? 'Update' : 'Add Expense'}
        </Button>
      </div>
    </form>
  );
}
