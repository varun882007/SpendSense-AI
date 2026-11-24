import { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowLeftRight,
  PieChart as PieChartIcon,
  BarChart3,
  Bot,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '../components/common/StatCard';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { analyticsService, transactionService, budgetService, savingsService, financialProfileService } from '../services/transactionService';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getCssVar, monthLabel } from '../utils/cssVars';

const CATEGORY_COLORS = [
  '#8067F5', '#29C995', '#EF6680', '#F4B860', '#5B8DEF',
  '#E879A8', '#43C6AC', '#F7A072', '#A78BFA', '#6EE7B7',
];

function DashboardCard({ title, children, className = '' }) {
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

function MiniProgressBar({ spent, total }) {
  const pct = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  let barColor = 'var(--color-success)';
  if (pct >= 80) barColor = 'var(--color-danger)';
  else if (pct >= 60) barColor = 'var(--color-warning)';

  return (
    <div className="w-full">
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--bg-input)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: barColor,
            transition: 'width 0.6s ease-out',
          }}
        />
      </div>
    </div>
  );
}

function MiniBarTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-2.5 py-1.5 shadow-lg"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-xs font-semibold" style={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

function MiniPieTooltip({ active, payload, formatter }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div
      className="rounded-lg px-2.5 py-1.5 shadow-lg"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      <p className="text-xs font-semibold" style={{ color: entry.payload?.fill || 'var(--text-primary)' }}>
        {entry.name}: {formatter ? formatter(entry.value) : entry.value}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [profile, setProfile] = useState(null);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, txnRes, budgetRes, trendRes, catRes, profileRes, savingsRes] = await Promise.allSettled([
        analyticsService.getSummary(),
        transactionService.getAll({ limit: 5 }),
        budgetService.getAll(),
        analyticsService.getTrends(),
        analyticsService.getCategories(),
        financialProfileService.getProfile(),
        savingsService.getAll(),
      ]);

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value.data);
      }

      if (txnRes.status === 'fulfilled') {
        const txnData = txnRes.value.data;
        setRecentTxns(txnData.transactions || txnData.items || txnData.data || (Array.isArray(txnData) ? txnData : []));
      }

      if (budgetRes.status === 'fulfilled') {
        const bData = budgetRes.value.data;
        setBudgets(bData.budgets || bData.items || (Array.isArray(bData) ? bData : []));
      }

      if (trendRes.status === 'fulfilled') {
        const tData = trendRes.value.data;
        const rawTrends = tData.trends || tData.data || (Array.isArray(tData) ? tData : []);
        setTrends(rawTrends);
      }

      if (catRes.status === 'fulfilled') {
        const cData = catRes.value.data;
        setCategories(cData.categories || cData.data || (Array.isArray(cData) ? cData : []));
      }

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data);
      }

      if (savingsRes.status === 'fulfilled') {
        const sData = savingsRes.value.data;
        setSavingsGoals(Array.isArray(sData) ? sData : []);
      }
    } catch {
      // non-critical, show zeros
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const monthlyIncome = parseFloat(profile?.monthly_income ?? 0);
  const fixedExpenses = parseFloat(profile?.total_fixed_expenses ?? 0);
  const variableExpenses = parseFloat(summary?.total_expenses ?? 0);
  const totalSavings = savingsGoals.reduce((sum, g) => sum + parseFloat(g.current_amount ?? 0), 0);
  const budgetAllocated = budgets.reduce((sum, b) => sum + parseFloat(b.amount ?? 0), 0);
  const monthlyExpenses = fixedExpenses + variableExpenses;
  const totalBalance = monthlyIncome - monthlyExpenses - totalSavings - budgetAllocated;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  // Prepare chart data
  const barData = trends.slice(-6)
    .filter((t) => parseFloat(t.income ?? 0) > 0 || parseFloat(t.expenses ?? 0) > 0)
    .map((t) => ({
      month: monthLabel(t.month),
      Income: parseFloat(t.income ?? t.total_income ?? 0),
      Expenses: Math.abs(parseFloat(t.expenses ?? t.total_expenses ?? 0)),
    }));

  // Pie chart: budgets + savings goals (clears when both are empty/deleted)
  const budgetSlices = budgets
    .filter((b) => parseFloat(b.amount ?? 0) > 0)
    .map((b, i) => ({
      name: b.category_name || 'Budget',
      value: parseFloat(b.amount),
      fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));
  const savingsSlices = savingsGoals
    .filter((g) => parseFloat(g.current_amount ?? 0) > 0)
    .map((g, i) => ({
      name: g.name,
      value: parseFloat(g.current_amount),
      fill: CATEGORY_COLORS[(budgetSlices.length + i) % CATEGORY_COLORS.length],
    }));
  const pieData = [...budgetSlices, ...savingsSlices];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome section */}
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Welcome back, {firstName}
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Here is your financial overview
        </p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-5 h-32"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <LoadingSpinner size="sm" className="h-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Wallet}
            label="Total Balance"
            value={formatCurrency(totalBalance)}
            color="primary"
          />
          <StatCard
            icon={TrendingUp}
            label="Monthly Income"
            value={formatCurrency(monthlyIncome)}
            color="success"
          />
          <StatCard
            icon={TrendingDown}
            label="Monthly Expenses"
            value={formatCurrency(monthlyExpenses)}
            color="danger"
          />
          <StatCard
            icon={PiggyBank}
            label="Total Savings"
            value={formatCurrency(totalSavings)}
            color="warning"
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardCard title="Income vs Expenses">
          {loading ? (
            <LoadingSpinner size="sm" className="py-8" />
          ) : barData.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No chart data"
              description="Add income and expense transactions to see the comparison chart."
            />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barGap={2}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: getCssVar('--text-secondary') || '#888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: getCssVar('--text-secondary') || '#888' }}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                  tickFormatter={(v) => {
                    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                    return v;
                  }}
                />
                <Tooltip content={<MiniBarTooltip formatter={(v) => formatCurrency(v)} />} />
                <Bar dataKey="Income" fill="#29C995" radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Expenses" fill="#EF6680" radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </DashboardCard>

        <DashboardCard title="Allocations by Category">
          {loading ? (
            <LoadingSpinner size="sm" className="py-8" />
          ) : pieData.length === 0 ? (
            <EmptyState
              icon={PieChartIcon}
              title="No allocations yet"
              description="Add savings goals or budgets to see your allocation breakdown."
            />
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<MiniPieTooltip formatter={(v) => formatCurrency(v)} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 -mt-2">
                {pieData.slice(0, 5).map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span
                      className="block w-2 h-2 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {entry.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <DashboardCard title="Recent Transactions" className="lg:col-span-2">
          {loading ? (
            <LoadingSpinner size="sm" className="py-8" />
          ) : recentTxns.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No transactions"
              description="Your recent transactions will appear here. Start by adding your first transaction."
            />
          ) : (
            <div className="space-y-1">
              {recentTxns.slice(0, 5).map((txn, idx) => {
                const isIncome = (txn.transaction_type || txn.type) === 'income';
                const amount = txn.original_amount ?? txn.amount ?? 0;
                const currency = txn.currency_code || txn.currency;
                const txnDate = txn.transaction_date || txn.date;
                return (
                  <div
                    key={txn.id || idx}
                    className="flex items-center gap-3 p-3 rounded-xl transition-colors duration-150"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isIncome
                          ? 'var(--color-success-light)'
                          : 'var(--color-danger-light)',
                      }}
                    >
                      {isIncome ? (
                        <ArrowDownLeft size={15} style={{ color: 'var(--color-success)' }} />
                      ) : (
                        <ArrowUpRight size={15} style={{ color: 'var(--color-danger)' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {txn.description}
                      </p>
                      <div className="flex items-center gap-1">
                        <Calendar size={10} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(txnDate)}
                        </span>
                      </div>
                    </div>
                    <span
                      className="text-sm font-bold tabular-nums whitespace-nowrap"
                      style={{
                        color: isIncome ? 'var(--color-success)' : 'var(--color-danger)',
                      }}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(amount, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </DashboardCard>

        {/* Budget Progress */}
        <DashboardCard title="Budget Progress">
          {loading ? (
            <LoadingSpinner size="sm" className="py-8" />
          ) : budgets.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No budgets set"
              description="Create budgets to track your spending against targets."
            />
          ) : (
            <div className="space-y-4">
              {budgets.slice(0, 5).map((b) => {
                const spent = parseFloat(b.spent || 0);
                const budgetAmt = parseFloat(b.amount || 0);
                const pct = budgetAmt > 0 ? Math.min((spent / budgetAmt) * 100, 100) : 0;
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {b.category_name || 'Budget'}
                      </span>
                      <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {formatCurrency(spent, b.currency_code)} / {formatCurrency(budgetAmt, b.currency_code)}
                      </span>
                    </div>
                    <MiniProgressBar spent={spent} total={budgetAmt} />
                  </div>
                );
              })}
            </div>
          )}
        </DashboardCard>
      </div>

      {/* AI Insights */}
      <DashboardCard title="AI Insights">
        <EmptyState
          icon={Bot}
          title="No insights yet"
          description="Once you have enough transaction data, our AI will generate personalized financial insights and recommendations."
        />
      </DashboardCard>
    </div>
  );
}
