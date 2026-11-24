import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data yet',
  description = 'Data will appear here once you start adding entries.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--color-primary-light)' }}
      >
        <Icon size={28} style={{ color: 'var(--color-primary)' }} />
      </div>
      <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="text-sm max-w-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>
      {action && action}
    </div>
  );
}
