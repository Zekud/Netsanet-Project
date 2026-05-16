// KpiCard — metric card for dashboards with icon, value, label, and optional accent.
// Uses semantic tokens for dark/light mode support.

import { type ReactNode } from 'react';

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'primary' | 'danger' | 'warning' | 'success';
  className?: string;
}

const accentBorders: Record<string, string> = {
  primary: 'border-l-primary',
  danger: 'border-l-danger',
  warning: 'border-l-warning',
  success: 'border-l-success',
};

export default function KpiCard({
  icon,
  label,
  value,
  sub,
  accent,
  className = '',
}: KpiCardProps) {
  return (
    <div className={`rounded-2xl border bg-surface p-5 shadow-sm transition-all duration-200 hover:shadow-md ${
      accent ? `border-l-4 ${accentBorders[accent]} border-border` : 'border-border'
    } ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary text-lg">
          {icon}
        </div>
        {sub && (
          <span className="text-[10px] text-muted bg-inset rounded-lg px-2 py-0.5">
            {sub}
          </span>
        )}
      </div>
      <p className="font-mono text-3xl font-bold text-heading">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}
