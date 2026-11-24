import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import TransactionForm from '../components/transactions/TransactionForm';
import { transactionService, categoryService } from '../services/transactionService';
import { useCurrency } from '../context/CurrencyContext';
import { getCategoryIcon } from '../utils/categoryIcons';

const PAGE_SIZE = 10;

export default function Transactions() {
  const { formatCurrency } = useCurrency();

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      };
      if (filterType !== 'all') params.transaction_type = filterType;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await transactionService.getAll(params);
      const data = Array.isArray(res.data) ? res.data : [];
      setTransactions(data);
      setTotalPages(data.length < PAGE_SIZE ? page : page + 1);
    } catch (err) {
      setError('Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterType, searchQuery]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryService.getAll();
      setCategories(res.data?.categories || res.data || []);
    } catch {
      // categories fetch is non-critical
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterType, searchQuery]);

  const handleCreate = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const handleEdit = (txn) => {
    setEditingTransaction(txn);
    setModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      if (editingTransaction) {
        await transactionService.update(editingTransaction.id, formData);
      } else {
        await transactionService.create(formData);
      }
      setModalOpen(false);
      setEditingTransaction(null);
      fetchTransactions();
    } catch (err) {
      // error handled by form or toast
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await transactionService.delete(id);
      setDeleteConfirm(null);
      fetchTransactions();
    } catch {
      // error
    }
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || 'Uncategorized';
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Transactions
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Track your day-to-day variable expenses
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus size={16} /> Add Expense
        </Button>
      </div>

      {/* Filters */}
      <div
        className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'expense'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all"
              style={{
                backgroundColor:
                  filterType === type ? 'var(--color-primary-light)' : 'var(--bg-input)',
                color: filterType === type ? 'var(--color-primary)' : 'var(--text-secondary)',
                border: `1px solid ${
                  filterType === type ? 'var(--color-primary)' : 'var(--border-color)'
                }`,
              }}
            >
              {type === 'all' ? 'All' : 'Expenses'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div
          className="rounded-2xl py-20"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
          <Button variant="secondary" size="sm" onClick={fetchTransactions} className="mt-3">
            Retry
          </Button>
        </div>
      ) : transactions.length === 0 ? (
        <div
          className="rounded-2xl"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <EmptyState
            icon={ArrowUpRight}
            title="No expenses yet"
            description='Click "Add Expense" to record a variable day-to-day expense.'
            action={
              <Button size="sm" onClick={handleCreate}>
                <Plus size={14} /> Add Expense
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* Transaction List */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Table header - desktop */}
            <div
              className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wider"
              style={{
                color: 'var(--text-muted)',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
              }}
            >
              <div className="col-span-1">Type</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {transactions.map((txn, idx) => {
              const isIncome = (txn.transaction_type || txn.type) === 'income';
              const catName = txn.category_name || getCategoryName(txn.category_id);
              const CatIcon = getCategoryIcon(catName);
              const amount = txn.original_amount ?? txn.amount;
              const currency = txn.currency_code || txn.currency;
              const txnDate = txn.transaction_date || txn.date;

              return (
                <div
                  key={txn.id || idx}
                  className="group grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 items-center transition-colors duration-150"
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
                >
                  {/* Type indicator */}
                  <div className="col-span-1 hidden md:flex">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: isIncome
                          ? 'var(--color-success-light)'
                          : 'var(--color-danger-light)',
                      }}
                    >
                      {isIncome ? (
                        <ArrowDownLeft size={14} style={{ color: 'var(--color-success)' }} />
                      ) : (
                        <ArrowUpRight size={14} style={{ color: 'var(--color-danger)' }} />
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="col-span-2 hidden md:flex items-center gap-1.5">
                    <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(txnDate)}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="col-span-3">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {txn.description}
                    </p>
                    {txn.notes && (
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {txn.notes}
                      </p>
                    )}
                    {/* Mobile: show date + category inline */}
                    <div className="flex items-center gap-2 mt-1 md:hidden">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(txnDate)}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>&#183;</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {catName}
                      </span>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="col-span-2 hidden md:flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--color-primary-light)' }}
                    >
                      <CatIcon size={12} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                      {catName}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-right">
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{
                        color: isIncome ? 'var(--color-success)' : 'var(--color-danger)',
                      }}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(amount, currency)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end gap-1">
                    <button
                      onClick={() => handleEdit(txn)}
                      className="p-2 rounded-lg transition-colors duration-150"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }}
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(txn)}
                      className="p-2 rounded-lg transition-colors duration-150"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-danger-light)';
                        e.currentTarget.style.color = 'var(--color-danger)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl transition-colors disabled:opacity-30"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm px-3 font-medium" style={{ color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl transition-colors disabled:opacity-30"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTransaction(null);
        }}
        title={editingTransaction ? 'Edit Expense' : 'Add Expense'}
        maxWidth="520px"
      >
        <TransactionForm
          transaction={editingTransaction}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false);
            setEditingTransaction(null);
          }}
          loading={saving}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Transaction"
        maxWidth="400px"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {deleteConfirm?.description}
            </strong>
            ? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={() => handleDelete(deleteConfirm?.id)} className="flex-1">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
