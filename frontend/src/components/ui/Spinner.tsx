// Spinner — loading indicator with optional label text.
// Uses semantic primary color token for theme support.

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizeStyles = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

export default function Spinner({ size = 'md', label, className = '' }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`animate-spin rounded-full border-primary border-t-transparent ${sizeStyles[size]}`}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && <p className="text-sm text-muted">{label}</p>}
    </div>
  );
}
