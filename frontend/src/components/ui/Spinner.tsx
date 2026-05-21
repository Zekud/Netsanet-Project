// Spinner — loading indicator with optional label text.
// Uses semantic primary color token for theme support.
// Pass className="border-white border-t-transparent!" to override color inside colored buttons.

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  /** Override the spinner color. Defaults to 'primary'. Use 'white' inside colored buttons. */
  color?: 'primary' | 'white' | 'muted';
}

const sizeStyles = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

const colorStyles = {
  primary: 'border-primary border-t-transparent',
  white:   'border-white border-t-transparent',
  muted:   'border-muted border-t-transparent',
};

export default function Spinner({ size = 'md', label, className = '', color = 'primary' }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`animate-spin rounded-full ${sizeStyles[size]} ${colorStyles[color]}`}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && <p className="text-sm text-muted">{label}</p>}
    </div>
  );
}
