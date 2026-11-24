import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at 20% 50%, var(--color-primary-light) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, var(--color-success-light) 0%, transparent 50%)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-xl mb-4"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), #a78bfa)',
              boxShadow: '0 8px 32px rgba(128, 103, 245, 0.3)',
            }}
          >
            S
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            SpendSense
            <span
              className="ml-2 text-sm font-semibold px-2 py-1 rounded-lg align-middle"
              style={{
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
              }}
            >
              AI
            </span>
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            Smart personal finance management
          </p>
        </div>

        {/* Auth card */}
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
