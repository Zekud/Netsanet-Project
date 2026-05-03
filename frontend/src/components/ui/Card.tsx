// Card — wrapper component with optional header section.

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
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${
        isClickable
          ? 'cursor-pointer transition-shadow duration-150 hover:shadow-md'
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
        <div className="border-b border-gray-200 px-4 py-3 sm:px-5">
          {header}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
    </div>
  );
}
