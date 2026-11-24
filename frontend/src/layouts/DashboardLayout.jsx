import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  BarChart3,
  Target,
  Bot,
  UserCircle,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';
import CurrencySwitcher from '../components/common/CurrencySwitcher';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/financial-profile', label: 'Financial Profile', icon: UserCircle },
  { path: '/budgets', label: 'Budgets', icon: Wallet },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/savings-goals', label: 'Savings Goals', icon: Target },
  { path: '/ai-advisor', label: 'AI Financial Advisor', icon: Bot },


  { path: '/settings', label: 'Settings', icon: Settings },
];

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/financial-profile': 'Financial Profile',
  '/budgets': 'Budgets',
  '/analytics': 'Analytics',
  '/savings-goals': 'Savings Goals',
  '/ai-advisor': 'AI Financial Advisor',


  '/settings': 'Settings',
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const pageTitle = pageTitles[location.pathname] || 'SpendSense AI';

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          flex flex-col
          transition-transform duration-300 ease-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          width: 'var(--sidebar-width)',
          minWidth: 'var(--sidebar-width)',
          backgroundColor: 'var(--bg-card)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-6 h-16 shrink-0"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), #a78bfa)',
            }}
          >
            S
          </div>
          <div>
            <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              SpendSense
            </span>
            <span
              className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
              }}
            >
              AI
            </span>
          </div>
          <button
            className="ml-auto lg:hidden w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ color: 'var(--text-secondary)' }}
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group"
                  style={{
                    backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <Icon size={18} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <ChevronRight size={14} style={{ color: 'var(--color-primary)' }} />
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-xl"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm text-white shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-success))',
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {user?.name || 'User'}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                {user?.email || 'user@example.com'}
              </p>
            </div>
            <button
              onClick={logout}
              className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-danger)';
                e.currentTarget.style.backgroundColor = 'var(--color-danger-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center gap-4 px-6 h-16 shrink-0"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <button
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl"
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
            }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>

          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {pageTitle}
          </h1>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <CurrencySwitcher compact />
            <ThemeToggle />
            {/* Desktop user avatar */}
            <div
              className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center font-semibold text-xs text-white cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-success))',
              }}
              title={user?.name || 'User'}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
