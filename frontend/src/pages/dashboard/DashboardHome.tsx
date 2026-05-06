// DashboardHome — staff overview with KPI cards and recent cases.
// Route: /dashboard/home

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
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

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-teal-50 text-teal-700',
  under_review: 'bg-amber-50 text-amber-700',
  referred: 'bg-blue-50 text-blue-700',
  active: 'bg-green-50 text-green-700',
  resolved: 'bg-gray-100 text-gray-600',
  closed: 'bg-gray-100 text-gray-400',
};

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
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

  const statusLabels: Record<string, string> = {
    new: t('shared.status.new'),
    under_review: t('shared.status.under_review'),
    referred: t('shared.status.referred'),
    active: t('shared.status.active'),
    resolved: t('shared.status.resolved'),
    closed: t('shared.status.closed'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-dark">
          {greeting}, {user?.display_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5 capitalize">{user?.role?.replace('_', ' ')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '📋', label: t('analytics.kpi.totalCases'), value: overview?.totalCases ?? '—' },
          { icon: '🔓', label: t('analytics.kpi.openCases'), value: overview?.openCases ?? '—', accent: 'border-l-4 border-l-teal-500' },
          { icon: '🚨', label: t('analytics.kpi.criticalCases'), value: overview?.criticalCases ?? '—', accent: 'border-l-4 border-l-red-500' },
          { icon: '⏱️', label: t('analytics.kpi.avgResolution'), value: overview ? `${overview.avgResolutionDays}d` : '—' },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm ${kpi.accent ?? ''}`}>
            <span className="text-xl">{kpi.icon}</span>
            <p className="font-mono text-2xl font-bold text-dark mt-2">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Cases */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-dark">{t('home.recentCases.title')}</h2>
          <Link to="/dashboard/cases" className="text-xs text-teal-600 hover:underline">View all →</Link>
        </div>
        {cases.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">{t('home.recentCases.emptyTitle')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">{t('directory.table.caseNum')}</th>
                <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">{t('directory.table.status')}</th>
                <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">{t('directory.table.submitted')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/dashboard/cases/${c.id}`} className="font-medium text-dark hover:text-teal-700 transition-colors">
                      {c.title}
                    </Link>
                    <p className="text-[10px] font-mono text-gray-400 mt-0.5">{c.case_number}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] ?? STATUS_COLORS.new}`}>
                      {statusLabels[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{relativeDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { to: '/dashboard/cases', icon: '📋', label: t('layout.nav.cases') },
          { to: '/dashboard/referrals', icon: '🔄', label: t('layout.nav.referrals') },
          { to: '/dashboard/analytics', icon: '📈', label: t('layout.nav.analytics') },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium text-dark hover:border-teal-200 hover:text-teal-700 transition-all shadow-sm"
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
