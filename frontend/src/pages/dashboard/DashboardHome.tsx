// DashboardHome — staff overview with KPI cards and recent cases.
// Route: /dashboard/home
// Uses semantic tokens + Lucide icons.

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClipboardList, FolderOpen, AlertTriangle, Clock, ArrowUpRight, ChevronRight, BarChart3 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge } from '../../components/ui';
import api from '../../lib/api';

interface Overview {
  totalCases: number;
  openCases: number;
  criticalCases: number;
  avgResolutionDays: number;
}

interface Case {
  id: string;
  case_number: string;
  title: string;
  status: string;
  urgency_level: string;
  created_at: string;
}

type CaseStatus = 'new' | 'under_review' | 'referred' | 'active' | 'resolved' | 'closed';

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function KpiCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: string | number; accent?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-surface p-4 shadow-sm hover-lift ${accent ? `border-l-4 ${accent}` : 'border-border'}`}>
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${accent ? 'bg-primary-soft text-primary' : 'bg-inset text-muted'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-mono text-2xl font-bold text-heading">{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  const { t } = useTranslation('dashboard');

  const { data: overviewRes } = useQuery<{ data: Overview }>({
    queryKey: ['analytics-overview'],
    queryFn: async () => (await api.get('/analytics/overview')).data,
  });

  const { data: casesRes } = useQuery<{ data: Case[] }>({
    queryKey: ['recent-cases'],
    queryFn: async () => (await api.get('/cases?limit=5&sort_by=created_at&sort_dir=desc')).data,
  });

  const overview = overviewRes?.data;
  const cases = casesRes?.data ?? [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('home.greeting.morning') : hour < 17 ? t('home.greeting.afternoon') : t('home.greeting.evening');

  return (
    <div className="relative space-y-6">
      {/* Background mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="mesh-blob-1 -top-10 -right-20" />
        <div className="mesh-blob-2 top-40 -left-20" />
      </div>

      {/* Header */}
      <div className="relative z-10 animate-fade-in-up">
        <h1 className="font-heading text-2xl text-heading">
          {greeting}, {user?.display_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-sm text-muted mt-0.5 capitalize">{user?.role?.replace('_', ' ')}</p>
      </div>

      {/* KPI Cards */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-stagger-1"><KpiCard icon={ClipboardList} label={t('analytics.kpi.totalCases')} value={overview?.totalCases ?? '—'} /></div>
        <div className="animate-stagger-2"><KpiCard icon={FolderOpen} label={t('analytics.kpi.openCases')} value={overview?.openCases ?? '—'} accent="border-l-primary" /></div>
        <div className="animate-stagger-3"><KpiCard icon={AlertTriangle} label={t('analytics.kpi.criticalCases')} value={overview?.criticalCases ?? '—'} accent="border-l-danger" /></div>
        <div className="animate-stagger-4"><KpiCard icon={Clock} label={t('analytics.kpi.avgResolution')} value={overview ? `${overview.avgResolutionDays}d` : '—'} /></div>
      </div>

      {/* Recent Cases */}
      <div className="relative z-10 rounded-2xl border border-border bg-surface shadow-sm overflow-hidden animate-stagger-5">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-muted">
          <h2 className="text-sm font-semibold text-heading">{t('home.recentCases.title')}</h2>
          <Link to="/dashboard/cases" className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors font-medium">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        {cases.length === 0 ? (
          <div className="py-10 text-center text-sm text-placeholder">{t('home.recentCases.emptyTitle')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-inset text-left">
                <th className="px-4 py-2 text-xs font-semibold text-muted uppercase">{t('directory.table.caseNum')}</th>
                <th className="px-4 py-2 text-xs font-semibold text-muted uppercase">{t('directory.table.status')}</th>
                <th className="px-4 py-2 text-xs font-semibold text-muted uppercase hidden sm:table-cell">{t('directory.table.submitted')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-inset transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/dashboard/cases/${c.id}`} className="font-medium text-heading hover:text-primary transition-colors">
                      {c.title}
                    </Link>
                    <p className="text-[10px] font-mono text-placeholder mt-0.5">{c.case_number}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status as CaseStatus} />
                  </td>
                  <td className="px-4 py-3 text-xs text-placeholder hidden sm:table-cell">{relativeDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Links */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { to: '/dashboard/cases', icon: ClipboardList, label: t('layout.nav.cases') },
          { to: '/dashboard/referrals', icon: ArrowUpRight, label: t('layout.nav.referrals') },
          { to: '/dashboard/analytics', icon: BarChart3, label: t('layout.nav.analytics') },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="group flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-heading hover:border-primary/30 hover:text-primary transition-all shadow-sm hover-lift animate-stagger-6"
          >
            <link.icon className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
            {link.label}
            <ChevronRight className="h-3.5 w-3.5 ml-auto text-placeholder group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
