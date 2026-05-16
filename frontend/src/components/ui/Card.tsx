// Card — wrapper component with optional header section.
// Uses semantic tokens for automatic dark/light mode support.

import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  header?: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

export default function Card({
  children,
  header,
  className = '',
  padding = 'md',
  onClick,
}: CardProps) {
  const isClickable = !!onClick;

  return (
    <div
      className={`rounded-2xl border border-border bg-surface shadow-sm ${
        isClickable
          ? 'cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30'
          : ''
      } ${className}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick?.();
            }
          : undefined
      }
    >
      {header && (
        <div className="border-b border-border-muted px-4 py-3 sm:px-5">
          {header}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
    </div>
  );
}
