// StatusBadge — styled badge showing case status with semantic colors.
// Uses design tokens for dark/light mode support.

type CaseStatus = 'new' | 'under_review' | 'referred' | 'active' | 'resolved' | 'closed';

interface StatusBadgeProps {
  status: CaseStatus;
  className?: string;
}

const statusConfig: Record<CaseStatus, { label: string; classes: string }> = {
  new:          { label: 'New',          classes: 'bg-primary-soft text-primary' },
  under_review: { label: 'Under Review', classes: 'bg-warning-soft text-warning' },
  referred:     { label: 'Referred',     classes: 'bg-secondary-soft text-secondary' },
  active:       { label: 'Active',       classes: 'bg-success-soft text-success' },
  resolved:     { label: 'Resolved',     classes: 'bg-inset text-muted' },
  closed:       { label: 'Closed',       classes: 'bg-inset text-placeholder' },
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.new;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${config.classes} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {config.label}
    </span>
  );
}
