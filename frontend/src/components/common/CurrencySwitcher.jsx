import { useCurrency } from '../../context/CurrencyContext';

export default function CurrencySwitcher({ compact = false }) {
  const { currency, toggleCurrency } = useCurrency();

  return (
    <button
      onClick={toggleCurrency}
      className="relative flex items-center rounded-xl font-semibold transition-all duration-200"
      style={{
        backgroundColor: 'var(--bg-input)',
        border: '1px solid var(--border-color)',
        padding: compact ? '6px 10px' : '8px 12px',
        fontSize: compact ? '12px' : '13px',
        color: 'var(--text-primary)',
      }}
      title={`Switch to ${currency === 'INR' ? 'USD' : 'INR'}`}
    >
      <span
        className="inline-flex items-center gap-1.5"
      >
        <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
          {currency === 'INR' ? '₹' : '$'}
        </span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
          {currency}
        </span>
      </span>
    </button>
  );
}
