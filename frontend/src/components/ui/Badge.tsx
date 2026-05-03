// Badge — small colored pill for status labels and categories.

import { type ReactNode } from 'react';

type BadgeVariant = 'default' | 'teal' | 'red' | 'orange' | 'amber' | 'gray';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  teal: 'bg-teal-50 text-teal-700',
  red: 'bg-red-50 text-critical',
  orange: 'bg-orange-50 text-high',
  amber: 'bg-amber-50 text-medium',
  gray: 'bg-gray-200 text-gray-700',
};

export default function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
