// KpiCard — metric card with icon, number, label, and optional trend.

import { type ReactNode } from 'react';

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export default function KpiCard({
  icon,
  label,
  value,
  trend,
  className = '',
}: KpiCardProps) {
  const trendColor =
    trend?.direction === 'up'
      ? 'text-green-600'
      : trend?.direction === 'down'
        ? 'text-critical'
        : 'text-gray-500';

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-lg text-teal-700">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trendColor}`}>
            {trend.direction === 'up' && '↑ '}
            {trend.direction === 'down' && '↓ '}
            {trend.value}
          </span>
        )}
      </div>
      <p className="mt-3 font-mono text-2xl font-medium text-dark">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}
