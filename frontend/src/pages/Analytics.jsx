import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatCard from '../components/common/StatCard';
import { useCurrency } from '../context/CurrencyContext';
import { analyticsService, financialProfileService, savingsService, budgetService } from '../services/transactionService';
import { getCssVar, monthLabel } from '../utils/cssVars';

const CATEGORY_COLORS = [
  '#8067F5', '#29C995', '#EF6680', '#F4B860', '#5B8DEF',
  '#E879A8', '#43C6AC', '#F7A072', '#A78BFA', '#6EE7B7',
  '#FCA5A5', '#93C5FD',
];

function AnalyticsCard({ title, children, className = '' }) {
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

function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 shadow-lg"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload, formatter }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div
      className="rounded-xl px-3 py-2 shadow-lg"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      <p className="text-sm font-semibold" style={{ color: entry.payload?.fill || 'var(--text-primary)' }}>
        {entry.name}: {formatter ? formatter(entry.value) : entry.value}
      </p>
    </div>
  );
}

export default function Analytics() {
  const { formatCurrency } = useCurrency();
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [profile, setProfile] = useState(null);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [summaryRes, trendRes, profileRes, savingsRes, budgetRes] = await Promise.allSettled([
          analyticsService.getSummary(),
          analyticsService.getTrends(),
          financialProfileService.getProfile(),
          savingsService.getAll(),
          budgetService.getAll(),
        ]);

        if (summaryRes.status === 'fulfilled') {
          setSummary(summaryRes.value.data);
        }
        if (trendRes.status === 'fulfilled') {
          const trendData = trendRes.value.data;
          setTrends(trendData.trends || trendData.data || (Array.isArray(trendData) ? trendData : []));
        }
        if (profileRes.status === 'fulfilled') {
          setProfile(profileRes.value.data);
        }
        if (savingsRes.status === 'fulfilled') {
          const sData = savingsRes.value.data;
          setSavingsGoals(Array.isArray(sData) ? sData : []);
        }
        if (budgetRes.status === 'fulfilled') {
          const bData = budgetRes.value.data;
          setBudgets(bData.budgets || bData.items || (Array.isArray(bData) ? bData : []));
        }
      } catch {
        // graceful fallback
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalIncome = parseFloat(profile?.monthly_income ?? 0);
  const fixedExpenses = parseFloat(profile?.total_fixed_expenses ?? 0);
  const variableExpenses = parseFloat(summary?.total_expenses ?? 0);
  const totalSavedAmount = savingsGoals.reduce((sum, g) => sum + parseFloat(g.current_amount ?? 0), 0);
  const budgetAllocated = budgets.reduce((sum, b) => sum + parseFloat(b.amount ?? 0), 0);
  const totalExpenses = fixedExpenses + variableExpenses;
  const balance = totalIncome - totalExpenses - totalSavedAmount - budgetAllocated;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  // Prepare bar chart data from trends
  const barData = useMemo(() => {
    if (!trends.length) return [];
    return trends.slice(-6).map((t) => ({
      month: monthLabel(t.month),
      Income: parseFloat(t.income ?? t.total_income ?? 0),
      Expenses: Math.abs(parseFloat(t.expenses ?? t.total_expenses ?? 0)),
    }));
  }, [trends]);

  // Category pie: driven by budgets + savings goals; empties when both are cleared
  const pieData = useMemo(() => {
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
    return [...budgetSlices, ...savingsSlices];
  }, [budgets, savingsGoals]);

  const totalCategorySpending = pieData.reduce((sum, d) => sum + d.value, 0);

  // Trend line data
  const lineData = useMemo(() => {
    if (!trends.length) return [];
    return trends.map((t) => ({
      month: monthLabel(t.month),
      spending: Math.abs(parseFloat(t.expenses ?? t.total_expenses ?? 0)),
    }));
  }, [trends]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Insights into your financial data</p>
        </div>
        <LoadingSpinner size="lg" className="py-20" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Insights into your financial data</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ArrowDownLeft} label="Total Income" value={formatCurrency(totalIncome)} color="success" />
        <StatCard icon={ArrowUpRight} label="Total Expenses" value={formatCurrency(totalExpenses)} color="danger" />
        <StatCard icon={DollarSign} label="Net Balance" value={formatCurrency(balance)} color="primary" />
        <StatCard icon={PiggyBank} label="Total Savings" value={formatCurrency(totalSavedAmount)} color="warning" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Income vs Expenses Bar Chart */}
        <AnalyticsCard title="Monthly Income vs Expenses">
          {barData.filter(d => d.Income > 0 || d.Expenses > 0).length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No data yet"
              description="Add transactions to see your monthly comparison."
            />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: getCssVar('--text-secondary') || '#888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: getCssVar('--text-secondary') || '#888' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => {
                    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                    return v;
                  }}
                />
                <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px', color: getCssVar('--text-secondary') || '#888' }}
                />
                <Bar dataKey="Income" fill="#29C995" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Expenses" fill="#EF6680" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </AnalyticsCard>

        {/* Category Pie Chart */}
        <AnalyticsCard title="Category Breakdown">
          {pieData.length === 0 ? (
            <EmptyState
              icon={PieChartIcon}
              title="No allocations yet"
              description="Add savings goals or budgets — they will appear here as your allocation breakdown."
            />
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip formatter={(v) => formatCurrency(v)} />} />
                  {/* Center label */}
                  <text
                    x="50%"
                    y="47%"
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ fontSize: '22px', fontWeight: 700, fill: getCssVar('--text-primary') || '#333' }}
                  >
                    {formatCurrency(totalCategorySpending)}
                  </text>
                  <text
                    x="50%"
                    y="58%"
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ fontSize: '12px', fill: getCssVar('--text-secondary') || '#888' }}
                  >
                    Total Allocated
                  </text>
                </PieChart>
              </ResponsiveContainer>
              {/* Legend below */}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {pieData.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span
                      className="block w-2.5 h-2.5 rounded-full"
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
        </AnalyticsCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-4">
        {/* Spending Trend Area Chart */}
        <AnalyticsCard title="Spending Trends">
          {lineData.length < 2 ? (
            <EmptyState
              icon={TrendingUp}
              title="Insufficient data"
              description="We need at least two months of data to show trends."
            />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={lineData}>
                <defs>
                  <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8067F5" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8067F5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: getCssVar('--text-secondary') || '#888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: getCssVar('--text-secondary') || '#888' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => {
                    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                    return v;
                  }}
                />
                <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} />} />
                <Area
                  type="monotone"
                  dataKey="spending"
                  name="Spending"
                  stroke="#8067F5"
                  strokeWidth={2.5}
                  fill="url(#spendingGradient)"
                  dot={{ r: 4, fill: '#8067F5', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#8067F5', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </AnalyticsCard>
      </div>
    </div>
  );
}
