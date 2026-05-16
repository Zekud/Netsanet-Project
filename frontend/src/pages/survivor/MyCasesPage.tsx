// MyCasesPage — full list of the survivor's submitted cases.
// Route: /safe-space/cases
// Fully localized: en + am via myCases namespace.
// Uses semantic tokens + Lucide icons.

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Plus, FolderOpen, ChevronRight } from 'lucide-react';
import { StatusBadge, UrgencyBadge } from '../../components/ui';
import api from '../../lib/api';

type CaseStatus = 'new' | 'under_review' | 'referred' | 'active' | 'resolved' | 'closed';

interface Case {
  id: string; case_number: string; title: string;
  status: string; urgency_level: string; category: string; created_at: string;
}

function relativeDate(dateStr: string, t: TFunction): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return t('dates.today');
  if (days === 1) return t('dates.yesterday');
  if (days < 7) return t('dates.daysAgo', { count: days });
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyCasesPage() {
  const { t } = useTranslation('myCases');

  const { data, isLoading, isError } = useQuery<{ data: Case[] }>({
    queryKey: ['my-cases'],
    queryFn: async () => {
      const res = await api.get('/cases?sort_by=created_at&sort_dir=desc');
      return res.data;
    },
  });

  const cases = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Background mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="mesh-blob-1 -top-10 right-0" />
        <div className="mesh-blob-2 top-60 -left-20" />
      </div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-heading">{t('heading')}</h1>
        <Link to="/safe-space/report"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:bg-primary-hover active:scale-[0.98] transition-all shadow-xs">
          <Plus className="h-4 w-4" />
          {t('newReport')}
        </Link>
      </div>

      {isError && (
        <div className="rounded-xl bg-danger-soft border border-danger/20 px-4 py-3 text-sm text-danger">{t('error')}</div>
      )}

      {cases.length === 0 && !isError ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <FolderOpen className="h-6 w-6" />
          </div>
          <p className="font-medium text-heading mb-1">{t('empty.title')}</p>
          <p className="text-sm text-muted mb-4">{t('empty.body')}</p>
          <Link to="/safe-space/report"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-fg hover:bg-primary-hover active:scale-[0.98] transition-all">
            <Plus className="h-4 w-4" />
            {t('empty.cta')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <Link key={c.id} to={`/safe-space/cases/${c.id}`}
              className="group flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-heading truncate">{c.title}</p>
                  {c.urgency_level === 'critical' && <UrgencyBadge level="critical" />}
                </div>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] text-placeholder">{c.case_number}</span>
                  {c.category && (
                    <span className="rounded-lg bg-inset px-2 py-0.5 text-[10px] text-muted capitalize">{c.category}</span>
                  )}
                  <span className="text-[10px] text-placeholder">{relativeDate(c.created_at, t)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <StatusBadge status={c.status as CaseStatus} />
                <ChevronRight className="h-4 w-4 text-placeholder group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
