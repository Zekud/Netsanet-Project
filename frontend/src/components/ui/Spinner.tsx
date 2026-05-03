// Spinner — loading indicator with optional label text.

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizeStyles = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-3',
};

export default function Spinner({ size = 'md', label, className = '' }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`animate-spin rounded-full border-teal-500 border-t-transparent ${sizeStyles[size]}`}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}
