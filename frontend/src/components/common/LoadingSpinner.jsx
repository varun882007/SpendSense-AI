const sizeMap = { sm: 24, md: 40, lg: 56 };

export default function LoadingSpinner({ size = 40, className = '' }) {
  const px = typeof size === 'string' ? (sizeMap[size] || 40) : size;
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 40 40"
        fill="none"
        style={{ animation: 'spin 0.8s linear infinite' }}
      >
        <circle
          cx="20"
          cy="20"
          r="17"
          stroke="var(--border-color)"
          strokeWidth="3"
          fill="none"
        />
        <circle
          cx="20"
          cy="20"
          r="17"
          stroke="var(--color-primary)"
          strokeWidth="3"
          fill="none"
          strokeDasharray="80"
          strokeDashoffset="60"
          strokeLinecap="round"
        />
      </svg>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
