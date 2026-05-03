// UrgencyBadge — maps urgency_level to visually unmistakable colored badges.
// These styles are fixed per the design spec — urgency must be readable at a glance.

type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

interface UrgencyBadgeProps {
  level: UrgencyLevel;
  className?: string;
}

const urgencyConfig: Record<UrgencyLevel, { label: string; classes: string; dot?: boolean }> = {
  critical: {
    label: 'Critical',
    classes: 'bg-red-600 text-white',
    dot: true,
  },
  high: {
    label: 'High',
    classes: 'bg-orange-500 text-white',
  },
  medium: {
    label: 'Medium',
    classes: 'bg-amber-400 text-gray-900',
  },
  low: {
    label: 'Low',
    classes: 'bg-gray-200 text-gray-700',
  },
};

export default function UrgencyBadge({ level, className = '' }: UrgencyBadgeProps) {
  const config = urgencyConfig[level] || urgencyConfig.low;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${config.classes} ${className}`}
    >
      {config.dot && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
      )}
      {config.label}
    </span>
  );
}
