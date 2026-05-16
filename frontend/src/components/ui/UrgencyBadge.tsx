// UrgencyBadge — glanceable urgency indicator for cases.
// Uses design tokens for dark/light mode support.

type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

interface UrgencyBadgeProps {
  level: UrgencyLevel;
  className?: string;
}

const urgencyConfig: Record<UrgencyLevel, { label: string; classes: string; pulse?: boolean }> = {
  critical: { label: 'CRITICAL', classes: 'bg-danger-soft text-danger',   pulse: true },
  high:     { label: 'HIGH',     classes: 'bg-warning-soft text-high' },
  medium:   { label: 'MEDIUM',   classes: 'bg-warning-soft text-warning' },
  low:      { label: 'LOW',      classes: 'bg-inset text-muted' },
};

export default function UrgencyBadge({ level, className = '' }: UrgencyBadgeProps) {
  const config = urgencyConfig[level] ?? urgencyConfig.low;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wider ${config.classes} ${className}`}>
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {config.label}
    </span>
  );
}
