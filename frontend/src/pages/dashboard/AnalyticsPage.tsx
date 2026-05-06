// AnalyticsPage — KPI dashboard with charts for institution_admin / system_admin.
// Route: /dashboard/analytics
// Uses Recharts for visualisations. Run: npm install recharts

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────

interface Overview {
  totalCases: number;
  openCases: number;
  criticalCases: number;
  avgResolutionDays: number;
}
interface StatusItem { status: string; count: number; }
interface CategoryItem { category: string; count: number; }
interface TrendItem { date: string; count: number; }

// ─── Colors ───────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  new: '#1A7A6E', under_review: '#D97706', referred: '#3B82F6',
  active: '#059669', resolved: '#6B7280', closed: '#9CA3AF',
};
const CATEGORY_COLORS = ['#1A7A6E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

// ─── KPI Card ─────────────────────────────────────────────────

function KpiCard({ label, value, icon, sub, accent }: {
  label: string; value: number | string; icon: string; sub?: string; accent?: string;
}) {
  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm ${accent ? `border-l-4 ${accent}` : 'border-gray-100'}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {sub && <span className="text-[10px] text-gray-400 bg-gray-50 rounded-md px-2 py-0.5">{sub}</span>}
      </div>
      <p className="font-mono text-3xl font-bold text-dark">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function AnalyticsPage() {
  const { t } = useTranslation('dashboard');
  const [period, setPeriod] = useState('30d');

  // Move constants that depend on translations inside the component
  const STATUS_LABELS: Record<string, string> = {
    new: t('shared.status.new'),
    under_review: t('shared.status.under_review'),
    referred: t('shared.status.referred'),
    active: t('shared.status.active'),
    resolved: t('shared.status.resolved'),
    closed: t('shared.status.closed'),
  };

  const CATEGORY_LABELS: Record<string, string> = {
    legal: t('shared.category.legal'),
    medical: t('shared.category.medical'),
    shelter: t('shared.category.shelter'),
    counseling: t('shared.category.counseling'),
    other: t('shared.category.other'),
  };

  const PERIODS = [
    { value: '7d', label: t('analytics.periods.7d') },
    { value: '30d', label: t('analytics.periods.30d') },
    { value: '90d', label: t('analytics.periods.90d') },
  ];

  const { data: overviewRes } = useQuery<{ data: Overview }>({
    queryKey: ['analytics-overview'],
    queryFn: async () => (await api.get('/analytics/overview')).data,
  });

  const { data: statusRes } = useQuery<{ data: StatusItem[] }>({
    queryKey: ['analytics-by-status'],
    queryFn: async () => (await api.get('/analytics/by-status')).data,
  });

  const { data: categoryRes } = useQuery<{ data: CategoryItem[] }>({
    queryKey: ['analytics-by-category'],
    queryFn: async () => (await api.get('/analytics/by-category')).data,
  });

  const { data: trendRes } = useQuery<{ data: TrendItem[] }>({
    queryKey: ['analytics-trend', period],
    queryFn: async () => (await api.get(`/analytics/trend?period=${period}`)).data,
  });

  const overview = overviewRes?.data;
  const statusData = (statusRes?.data ?? []).map((s) => ({ ...s, label: STATUS_LABELS[s.status] ?? s.status }));
  const categoryData = (categoryRes?.data ?? []).map((c) => ({ ...c, label: CATEGORY_LABELS[c.category] ?? c.category }));
  const trendData = trendRes?.data ?? [];

  // Format date labels for trend chart
  const formattedTrend = trendData.map((t) => ({
    ...t,
    label: new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-dark">{t('analytics.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('analytics.subtitle')}</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="📋" label={t('analytics.kpi.totalCases')} value={overview?.totalCases ?? '—'} />
        <KpiCard icon="🔓" label={t('analytics.kpi.openCases')} value={overview?.openCases ?? '—'} accent="border-l-teal-500" />
        <KpiCard
          icon="🚨" label={t('analytics.kpi.criticalCases')}
          value={overview?.criticalCases ?? '—'}
          accent="border-l-red-500"
          sub={t('analytics.kpi.needsAttention')}
        />
        <KpiCard
          icon="⏱️" label={t('analytics.kpi.avgResolution')}
          value={overview ? `${overview.avgResolutionDays}d` : '—'}
          sub={t('analytics.kpi.resolvedCases')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Donut */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-dark mb-4">{t('analytics.charts.byStatus')}</h2>
          {statusData.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">{t('analytics.charts.noData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                  {statusData.map((entry, i) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [t('analytics.charts.tooltipCases', { value: v })]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Horizontal Bar */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-dark mb-4">{t('analytics.charts.byCategory')}</h2>
          {categoryData.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">{t('analytics.charts.noData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v) => [t('analytics.charts.tooltipCases', { value: v })]} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Trend Chart */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-dark">{t('analytics.charts.overTime')}</h2>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  period === p.value ? 'bg-teal-500 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {formattedTrend.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">{t('analytics.charts.noData')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={formattedTrend} margin={{ left: 0, right: 8 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [t('analytics.charts.tooltipCases', { value: v })]} labelFormatter={(l) => t('analytics.charts.tooltipDate', { label: l })} />
              <Bar dataKey="count" fill="#1A7A6E" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
