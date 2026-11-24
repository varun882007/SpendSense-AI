import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { Sun, Moon, User, Mail, Shield, Palette, DollarSign } from 'lucide-react';

function SettingsSection({ icon: SectionIcon, title, children }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        {SectionIcon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            <SectionIcon size={15} style={{ color: 'var(--color-primary)' }} />
          </div>
        )}
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
      </div>
      <div className="px-6">{children}</div>
    </div>
  );
}

function SettingsRow({ icon: Icon, label, description, children, noBorder }) {
  return (
    <div
      className="flex items-center justify-between py-4"
      style={{ borderBottom: noBorder ? 'none' : '1px solid var(--border-color)' }}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            <Icon size={16} style={{ color: 'var(--color-primary)' }} />
          </div>
        )}
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {label}
          </p>
          {description && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>
          )}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage your account preferences
        </p>
      </div>

      {/* Profile */}
      <SettingsSection icon={User} title="Profile">
        <SettingsRow icon={User} label="Name" description="Your display name">
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {user?.name || 'Not set'}
          </span>
        </SettingsRow>
        <SettingsRow icon={Mail} label="Email" description="Your account email" noBorder>
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {user?.email || 'Not set'}
          </span>
        </SettingsRow>
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection icon={Palette} title="Appearance">
        <SettingsRow
          icon={theme === 'dark' ? Moon : Sun}
          label="Theme"
          description={`Currently using ${theme} mode`}
          noBorder
        >
          <button
            onClick={toggleTheme}
            className="relative w-12 h-7 rounded-full transition-colors duration-200"
            style={{
              backgroundColor:
                theme === 'dark' ? 'var(--color-primary)' : 'var(--border-color)',
            }}
          >
            <div
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
              style={{
                transform: theme === 'dark' ? 'translateX(22px)' : 'translateX(3px)',
              }}
            />
          </button>
        </SettingsRow>
      </SettingsSection>

      {/* Currency */}
      <SettingsSection icon={DollarSign} title="Currency">
        <SettingsRow
          icon={Shield}
          label="Preferred Currency"
          description="Used for displaying amounts"
          noBorder
        >
          <div className="flex gap-2">
            {['INR', 'USD'].map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  backgroundColor:
                    currency === c ? 'var(--color-primary-light)' : 'var(--bg-input)',
                  border: `1px solid ${
                    currency === c ? 'var(--color-primary)' : 'var(--border-color)'
                  }`,
                  color: currency === c ? 'var(--color-primary)' : 'var(--text-secondary)',
                }}
              >
                {c === 'INR' ? '₹ INR' : '$ USD'}
              </button>
            ))}
          </div>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
