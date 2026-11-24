import { createContext, useContext, useState, useCallback } from 'react';

const CurrencyContext = createContext();

const EXCHANGE_RATES = {
  USD_TO_INR: 83.5,
  INR_TO_USD: 1 / 83.5,
};

const CURRENCY_CONFIG = {
  INR: { symbol: '₹', code: 'INR', locale: 'en-IN', name: 'Indian Rupee' },
  USD: { symbol: '$', code: 'USD', locale: 'en-US', name: 'US Dollar' },
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('spendsense-currency') || 'INR';
  });

  const [exchangeRates] = useState(EXCHANGE_RATES);

  const updateCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('spendsense-currency', newCurrency);
  };

  const formatCurrency = useCallback(
    (amount, currencyCode) => {
      const code = currencyCode || currency;
      const config = CURRENCY_CONFIG[code];
      if (!config) return `${amount}`;

      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.code,
        minimumFractionDigits: code === 'INR' ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(amount);
    },
    [currency]
  );

  const convertCurrency = useCallback(
    (amount, from, to) => {
      if (from === to) return amount;
      if (from === 'USD' && to === 'INR') return amount * exchangeRates.USD_TO_INR;
      if (from === 'INR' && to === 'USD') return amount * exchangeRates.INR_TO_USD;
      return amount;
    },
    [exchangeRates]
  );

  const toggleCurrency = () => {
    updateCurrency(currency === 'INR' ? 'USD' : 'INR');
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency: updateCurrency,
        formatCurrency,
        convertCurrency,
        toggleCurrency,
        exchangeRates,
        currencyConfig: CURRENCY_CONFIG[currency],
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
