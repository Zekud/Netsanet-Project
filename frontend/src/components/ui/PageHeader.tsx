// PageHeader — standard page title with optional subtitle, breadcrumb, and action.
// Uses semantic tokens + Lucide icons.

import { type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string[];
  action?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumb,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-1 flex items-center gap-1 text-xs text-muted">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                <span className={i === breadcrumb.length - 1 ? 'text-heading font-medium' : ''}>
                  {item}
                </span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="font-heading text-2xl text-heading">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
        )}
      </div>
      {action && <div className="mt-2 sm:mt-0">{action}</div>}
    </div>
  );
}
