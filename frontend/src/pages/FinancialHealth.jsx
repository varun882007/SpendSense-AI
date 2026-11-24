import { useState, useEffect } from 'react';
import { Heart, TrendingUp, Wallet, BarChart3, Shield, HelpCircle } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { aiService } from '../services/aiService';
import { getCssVar } from '../utils/cssVars';

function getScoreColor(score) {
  if (score >= 80) return '#29C995';
  if (score >= 60) return '#5B8DEF';
  if (score >= 40) return '#F4B860';
  return '#EF6680';
}

function getGradeLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Needs Improvement';
  return 'At Risk';
}

function ScoreCircle({ score, size = 200 }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (normalizedScore / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-5xl font-bold tabular-nums"
          style={{ color }}
        >
          {normalizedScore}
        </span>
        <span
          className="text-sm font-medium mt-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          {getGradeLabel(score)}
        </span>
      </div>
    </div>
  );
}

function BreakdownCard({ icon: Icon, title, score, maxScore, description, value }) {
  const pct = maxScore > 0 ? Math.min((score / maxScore) * 100, 100) : 0;
  const barColor = getScoreColor((score / maxScore) * 100);

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${barColor}20` }}
          >
            <Icon size={18} style={{ color: barColor }} />
          </div>
          <div>
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h4>
            {value && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{value}</p>
            )}
          </div>
        </div>
        <span className="text-lg font-bold tabular-nums" style={{ color: barColor }}>
          {score}/{maxScore}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-2 rounded-full overflow-hidden mb-2"
        style={{ backgroundColor: 'var(--bg-input)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: barColor,
            transition: 'width 1s ease-out',
          }}
        />
      </div>

      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>
    </div>
  );
}

export default function FinancialHealth() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await aiService.getHealthScore();
        setHealthData(res.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Financial Health
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Your overall financial wellness score and recommendations
          </p>
        </div>
        <LoadingSpinner size="lg" className="py-20" />
      </div>
    );
  }

  if (error || !healthData) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Financial Health
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Your overall financial wellness score and recommendations
          </p>
        </div>
        <div
          className="rounded-2xl"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <EmptyState
            icon={Heart}
            title="Financial health score unavailable"
            description="We need more data to calculate your financial health score. Add transactions, set budgets, and create savings goals to get started."
          />
        </div>
      </div>
    );
  }

  const score = healthData.score ?? healthData.total_score ?? healthData.overall_score ?? 0;
  const advice = healthData.advice ?? healthData.recommendation ?? healthData.summary ?? '';

  const breakdown = healthData.breakdown || healthData.components || {};
  const savingsRatio = breakdown.savings_ratio ?? breakdown.savings ?? { score: 0, description: '' };
  const budgetAdherence = breakdown.budget_adherence ?? breakdown.budget ?? { score: 0, description: '' };
  const spendingConsistency = breakdown.spending_consistency ?? breakdown.consistency ?? { score: 0, description: '' };
  const emergencyFund = breakdown.emergency_fund ?? breakdown.emergency ?? { score: 0, description: '' };

  const getScore = (component) => {
    if (typeof component === 'number') return component;
    return component?.score ?? 0;
  };

  const getDesc = (component, fallback) => {
    if (typeof component === 'number') return fallback;
    return component?.description ?? component?.detail ?? fallback;
  };

  const getValue = (component) => {
    if (typeof component === 'number') return '';
    return component?.value ?? component?.detail ?? '';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Financial Health
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Your overall financial wellness score and recommendations
        </p>
      </div>

      {/* Score hero card */}
      <div
        className="rounded-2xl p-8 flex flex-col items-center text-center"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <ScoreCircle score={score} />
        {advice && (
          <p
            className="text-sm mt-6 max-w-lg leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {advice}
          </p>
        )}
      </div>

      {/* Breakdown cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BreakdownCard
          icon={TrendingUp}
          title="Savings Ratio"
          score={getScore(savingsRatio)}
          maxScore={25}
          description={getDesc(savingsRatio, 'Measures what percentage of your income you save each month.')}
          value={getValue(savingsRatio)}
        />
        <BreakdownCard
          icon={Wallet}
          title="Budget Adherence"
          score={getScore(budgetAdherence)}
          maxScore={25}
          description={getDesc(budgetAdherence, 'How well you stay within your budget limits across all categories.')}
          value={getValue(budgetAdherence)}
        />
        <BreakdownCard
          icon={BarChart3}
          title="Spending Consistency"
          score={getScore(spendingConsistency)}
          maxScore={25}
          description={getDesc(spendingConsistency, 'Evaluates how steady your spending is from month to month.')}
          value={getValue(spendingConsistency)}
        />
        <BreakdownCard
          icon={Shield}
          title="Emergency Fund"
          score={getScore(emergencyFund)}
          maxScore={25}
          description={getDesc(emergencyFund, 'Checks if you have enough savings to cover 3-6 months of expenses.')}
          value={getValue(emergencyFund)}
        />
      </div>

      {/* How it works */}
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle size={16} style={{ color: 'var(--text-secondary)' }} />
          <h3
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            How Your Score Is Calculated
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Savings Ratio', desc: 'Up to 25 points based on the percentage of income you save monthly.' },
            { label: 'Budget Adherence', desc: 'Up to 25 points for staying within your set budgets.' },
            { label: 'Spending Consistency', desc: 'Up to 25 points for maintaining steady spending habits.' },
            { label: 'Emergency Fund', desc: 'Up to 25 points for maintaining 3-6 months of expenses in savings.' },
          ].map((item) => (
            <div key={item.label} className="flex gap-2">
              <span className="text-sm font-medium flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                {item.label}:
              </span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {item.desc}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Your total score is the sum of all four components, ranging from 0 to 100.
        </p>
      </div>
    </div>
  );
}
