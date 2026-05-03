// StatusBadge — maps case_status enum values to colored badges with human-readable labels.

type CaseStatus = 'new' | 'under_review' | 'referred' | 'active' | 'resolved' | 'closed';

interface StatusBadgeProps {
  status: CaseStatus;
  className?: string;
}

const statusConfig: Record<CaseStatus, { label: string; classes: string }> = {
  new: {
    label: 'New',
    classes: 'bg-teal-50 text-teal-700',
  },
  under_review: {
    label: 'Under Review',
    classes: 'bg-amber-50 text-amber-700',
  },
  referred: {
    label: 'Referred',
    classes: 'bg-blue-50 text-blue-700',
  },
  active: {
    label: 'Active',
    classes: 'bg-green-50 text-green-700',
  },
  resolved: {
    label: 'Resolved',
    classes: 'bg-gray-100 text-gray-700',
  },
  closed: {
    label: 'Closed',
    classes: 'bg-gray-200 text-gray-500',
  },
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.new;

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${config.classes} ${className}`}
    >
      {config.label}
    </span>
  );
}
