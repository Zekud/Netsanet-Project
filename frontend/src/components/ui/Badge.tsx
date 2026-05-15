// Badge — small colored pill for status labels and categories.
// Updated with semantic tokens for dark/light support.

import { type ReactNode } from 'react';

type BadgeVariant = 'default' | 'teal' | 'red' | 'orange' | 'amber' | 'gray';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-inset text-body',
  teal: 'bg-primary-soft text-primary',
  red: 'bg-danger-soft text-danger',
  orange: 'bg-warning-soft text-high',
  amber: 'bg-warning-soft text-warning',
  gray: 'bg-inset text-muted',
};

export default function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
