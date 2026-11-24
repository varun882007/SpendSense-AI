import { useState, useRef, useCallback } from 'react';
import { ScanLine, Upload, X, FileImage, Check, Loader2, Camera } from 'lucide-react';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useCurrency } from '../context/CurrencyContext';
import api from '../services/api';
import { categoryService } from '../services/transactionService';

const ACCEPT = 'image/*,.pdf';

export default function ReceiptScanner() {
  const { formatCurrency } = useCurrency();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setExtractedData(null);
    setError(null);
    setSuccess(false);
  };

  const handleFile = useCallback((f) => {
    if (!f) return;
    setFile(f);
    setExtractedData(null);
    setError(null);
    setSuccess(false);

    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);
      const f = e.dataTransfer?.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleScan = async () => {
    if (!file) return;
    setScanning(true);
    setError(null);

    try {
      // Fetch categories for the dropdown
      const catRes = await categoryService.getAll().catch(() => ({ data: [] }));
      const catData = catRes.data;
      setCategories(catData.categories || catData.data || (Array.isArray(catData) ? catData : []));

      const formData = new FormData();
      formData.append('receipt', file);

      const res = await api.post('/receipts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data?.data || res.data;
      setExtractedData({
        merchant: data.merchant || data.merchant_name || data.store || '',
        date: data.date || new Date().toISOString().split('T')[0],
        amount: data.total || data.amount || data.total_amount || 0,
        category: data.category || data.category_name || '',
        items: data.items || data.line_items || [],
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to scan receipt. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!extractedData) return;
    setSaving(true);
    setError(null);

    try {
      await api.post('/transactions', {
        description: extractedData.merchant || 'Receipt purchase',
        amount: parseFloat(extractedData.amount) || 0,
        type: 'expense',
        category: extractedData.category,
        date: extractedData.date,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save transaction.');
    } finally {
      setSaving(false);
    }
  };

  const updateExtracted = (field, value) => {
    setExtractedData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Receipt Scanner
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Scan receipts to automatically log transactions
          </p>
        </div>
        {file && (
          <Button variant="secondary" onClick={reset}>
            <X size={16} />
            Clear
          </Button>
        )}
      </div>

      {/* Success state */}
      {success && (
        <div
          className="rounded-2xl p-6 flex flex-col items-center text-center"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--color-success-light)' }}
          >
            <Check size={28} style={{ color: 'var(--color-success)' }} />
          </div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Transaction Saved
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            The receipt has been processed and saved as a transaction.
          </p>
          <Button onClick={reset}>Scan Another Receipt</Button>
        </div>
      )}

      {/* Upload area */}
      {!success && !extractedData && (
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Drop zone */}
          <div
            className="rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200"
            style={{
              border: `2px dashed ${dragActive ? 'var(--color-primary)' : 'var(--border-color)'}`,
              backgroundColor: dragActive ? 'var(--color-primary-light)' : 'transparent',
              minHeight: '240px',
            }}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {file && preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="max-h-60 rounded-lg object-contain mx-auto"
                  style={{ boxShadow: 'var(--shadow-sm)' }}
                />
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {file.name}
                </p>
              </div>
            ) : file ? (
              <div className="space-y-3">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ backgroundColor: 'var(--color-primary-light)' }}
                >
                  <FileImage size={28} style={{ color: 'var(--color-primary)' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {file.name}
                </p>
              </div>
            ) : (
              <>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--color-primary-light)' }}
                >
                  <Camera size={28} style={{ color: 'var(--color-primary)' }} />
                </div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Drop your receipt here
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  or click to browse. Supports images and PDFs.
                </p>
                <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  <Upload size={14} />
                  Choose File
                </Button>
              </>
            )}
          </div>

          {/* Scan button */}
          {file && (
            <div className="mt-4 flex justify-center">
              <Button onClick={handleScan} disabled={scanning}>
                {scanning ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <ScanLine size={16} />
                    Scan Receipt
                  </>
                )}
              </Button>
            </div>
          )}

          {error && (
            <p className="text-sm text-center mt-3" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
          )}
        </div>
      )}

      {/* Extracted data form */}
      {!success && extractedData && (
        <div
          className="rounded-2xl p-6"
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
            Extracted Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Merchant */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Merchant
              </label>
              <input
                type="text"
                value={extractedData.merchant}
                onChange={(e) => updateExtracted('merchant', e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Date
              </label>
              <input
                type="date"
                value={extractedData.date}
                onChange={(e) => updateExtracted('date', e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Total Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={extractedData.amount}
                onChange={(e) => updateExtracted('amount', e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Category
              </label>
              <select
                value={extractedData.category}
                onChange={(e) => updateExtracted('category', e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id || cat.name} value={cat.name || cat.category_name}>
                    {cat.name || cat.category_name}
                  </option>
                ))}
                {categories.length === 0 && (
                  <>
                    <option value="Food">Food</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Bills">Bills</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Other">Other</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Items list */}
          {extractedData.items?.length > 0 && (
            <div className="mt-4">
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Items
              </label>
              <div className="space-y-1">
                {extractedData.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-input)' }}
                  >
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {item.name || item.description || item}
                    </span>
                    {(item.price || item.amount) && (
                      <span className="text-sm font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                        {formatCurrency(item.price || item.amount)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm mt-3" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <Button onClick={handleSaveTransaction} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Save as Transaction
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={reset}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
