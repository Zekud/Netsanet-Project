// AnalyticsPage — KPI dashboard with charts for institution_admin / system_admin.
// Route: /dashboard/analytics
// Uses Recharts for visualisations + semantic tokens + Lucide icons.

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ClipboardList, FolderOpen, AlertTriangle, Clock } from 'lucide-react';
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

// ─── Colors — using the violet palette ────────────────────────

const STATUS_COLORS: Record<string, string> = {
  new: '#7C3AED', under_review: '#D97706', referred: '#6366F1',
  active: '#059669', resolved: '#6B7280', closed: '#9CA3AF',
};
const CATEGORY_COLORS = ['#7C3AED', '#6366F1', '#F59E0B', '#EF4444', '#A78BFA'];

// ─── Custom Tooltip ───────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataLabel = label || payload[0].payload.label || payload[0].name;
    return (
      <div className="rounded-xl border border-border bg-surface/90 backdrop-blur-md p-3 shadow-xl animate-scale-in">
        <p className="text-xs font-semibold text-muted mb-1 uppercase tracking-wider">{dataLabel}</p>
        <p className="text-sm font-bold text-heading flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill || payload[0].color }} />
          {payload[0].value} <span className="font-medium text-muted">cases</span>
        </p>
      </div>
    );
  }
  return null;
};

// ─── KPI Card ─────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; accent?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-surface p-5 shadow-sm hover-lift ${accent ? `border-l-4 ${accent}` : 'border-border'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent ? 'bg-primary-soft text-primary' : 'bg-inset text-muted'}`}>
          <Icon className="h-4 w-4" />
        </div>
        {sub && <span className="text-[10px] text-placeholder bg-inset rounded-lg px-2 py-0.5">{sub}</span>}
      </div>
      <p className="font-mono text-3xl font-bold text-heading">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function AnalyticsPage() {
  const { t } = useTranslation('dashboard');
  const [period, setPeriod] = useState('30d');

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

  const formattedTrend = trendData.map((item) => ({
    ...item,
    label: new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
  }));

  return (
    <div className="relative space-y-6">
      {/* Background mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="mesh-blob-1 -top-10 -right-20" />
        <div className="mesh-blob-2 top-60 -left-20" />
      </div>

      {/* Header */}
      <div className="relative z-10 animate-fade-in-up">
        <h1 className="font-heading text-2xl text-heading">{t('analytics.title')}</h1>
        <p className="text-sm text-muted mt-0.5">{t('analytics.subtitle')}</p>
      </div>

      {/* KPI Row */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-stagger-1"><KpiCard icon={ClipboardList} label={t('analytics.kpi.totalCases')} value={overview?.totalCases ?? '—'} /></div>
        <div className="animate-stagger-2"><KpiCard icon={FolderOpen} label={t('analytics.kpi.openCases')} value={overview?.openCases ?? '—'} accent="border-l-primary" /></div>
        <div className="animate-stagger-3"><KpiCard icon={AlertTriangle} label={t('analytics.kpi.criticalCases')} value={overview?.criticalCases ?? '—'} accent="border-l-danger" sub={t('analytics.kpi.needsAttention')} /></div>
        <div className="animate-stagger-4"><KpiCard icon={Clock} label={t('analytics.kpi.avgResolution')} value={overview ? `${overview.avgResolutionDays}d` : '—'} sub={t('analytics.kpi.resolvedCases')} /></div>
      </div>

      {/* Charts Row */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-4 animate-stagger-5">
        {/* Status Donut */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-heading mb-4">{t('analytics.charts.byStatus')}</h2>
          {statusData.length === 0 ? (
            <p className="text-center text-sm text-placeholder py-10">{t('analytics.charts.noData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                  {statusData.map((entry, i) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Horizontal Bar */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-heading mb-4">{t('analytics.charts.byCategory')}</h2>
          {categoryData.length === 0 ? (
            <p className="text-center text-sm text-placeholder py-10">{t('analytics.charts.noData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
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
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-heading">{t('analytics.charts.overTime')}</h2>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-xl px-3 py-1 text-xs font-medium transition-colors ${
                  period === p.value ? 'bg-primary text-primary-fg' : 'text-muted hover:bg-inset'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {formattedTrend.length === 0 ? (
          <p className="text-center text-sm text-placeholder py-10">{t('analytics.charts.noData')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={formattedTrend} margin={{ left: 0, right: 8 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" axisLine={false} tickLine={false} dy={10} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-inset)' }} />
              <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
