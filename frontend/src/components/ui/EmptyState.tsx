// EmptyState — placeholder UI for zero-data views.
// Uses semantic tokens for dark/light mode support.

import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-border-muted bg-surface px-6 py-12 text-center shadow-sm ${className}`}>
      {icon && <div className="mb-4 text-4xl">{icon}</div>}
      <h3 className="font-heading text-base font-medium text-heading mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
