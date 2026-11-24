const variants = {
  primary: {
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
    hoverBg: 'var(--color-primary-hover)',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    hoverBg: 'var(--bg-card-hover)',
  },
  danger: {
    backgroundColor: 'var(--color-danger)',
    color: '#ffffff',
    hoverBg: '#d9546d',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    hoverBg: 'var(--color-primary-light)',
  },
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  ...props
}) {
  const style = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold rounded-xl
        transition-all duration-200 ease-out
        hover:translate-y-[-1px] hover:shadow-lg
        active:translate-y-0
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={{
        backgroundColor: style.backgroundColor,
        color: style.color,
        border: style.border || 'none',
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.target.style.backgroundColor = style.hoverBg;
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.target.style.backgroundColor = style.backgroundColor;
      }}
      {...props}
    >
      {children}
    </button>
  );
}
