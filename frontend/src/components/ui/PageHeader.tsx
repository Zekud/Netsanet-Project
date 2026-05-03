// PageHeader — page title with optional breadcrumb and action button.

import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string[];
  action?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumb,
  action,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-gray-200">/</span>}
              <span className={i === breadcrumb.length - 1 ? 'text-dark' : ''}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      )}

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-dark sm:text-3xl">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
