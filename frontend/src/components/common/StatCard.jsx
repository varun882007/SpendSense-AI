const colorMap = {
  primary: {
    bg: 'var(--color-primary-light)',
    icon: 'var(--color-primary)',
  },
  success: {
    bg: 'var(--color-success-light)',
    icon: 'var(--color-success)',
  },
  warning: {
    bg: 'var(--color-warning-light)',
    icon: 'var(--color-warning)',
  },
  danger: {
    bg: 'var(--color-danger-light)',
    icon: 'var(--color-danger)',
  },
};

export default function StatCard({ icon: Icon, label, value, trend, color = 'primary' }) {
  const palette = colorMap[color] || colorMap.primary;

  return (
    <div
      className="rounded-2xl p-5 cursor-default"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: palette.bg }}
        >
          {Icon && <Icon size={20} style={{ color: palette.icon }} />}
        </div>
        {trend !== undefined && trend !== null && (
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full"
            style={{
              color: trend >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
              backgroundColor:
                trend >= 0 ? 'var(--color-success-light)' : 'var(--color-danger-light)',
            }}
          >
            {trend >= 0 ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
      <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </p>
      <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  );
}
