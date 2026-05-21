// SurvivorHome — the first page a survivor sees after login.
// Route: /safe-space/home
// Calm, reassuring, action-oriented. All text is localized.
// Uses semantic tokens + Lucide icons for dark/light support.

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FileText, Scale, BookOpen, Phone, Building2, Handshake, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge } from '../../components/ui';
import api from '../../lib/api';

type CaseStatus = 'new' | 'under_review' | 'referred' | 'active' | 'resolved' | 'closed';

interface Case {
  id: string; case_number: string; title: string;
  status: string; urgency_level: string; created_at: string;
}

function ActionCard({ to, icon: Icon, title, description, cta, primary }: {
  to: string; icon: React.ElementType; title: string; description: string; cta: string; primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`group flex flex-col rounded-3xl p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover-lift border liquid-glass ${
        primary
          ? 'border-primary/45 bg-primary-soft/15 dark:bg-primary-soft/5 shadow-md shadow-primary-soft/5'
          : 'border-border/60 shadow-sm hover:border-primary/30'
      }`}
    >
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 ${primary ? 'bg-primary text-primary-fg shadow-sm scale-110' : 'bg-primary-soft text-primary'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-serif italic text-2xl mb-1 text-heading">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted mb-4">
        {description}
      </p>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-primary group-hover:gap-2 transition-all">
        {cta} <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

function ResourceCard({ icon: Icon, title, body, href, to }: {
  icon: React.ElementType; title: string; body: string; href?: string; to?: string;
}) {
  const inner = (
    <div className="flex gap-4 rounded-2xl border border-border/50 bg-bg/40 backdrop-blur-md p-5 shadow-sm transition-all hover:border-primary/30 hover:scale-[1.01] hover-lift">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-bold text-heading mb-0.5">{title}</p>
        <p className="text-xs text-muted leading-relaxed">{body}</p>
      </div>
    </div>
  );
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>;
  if (to) return <Link to={to}>{inner}</Link>;
  return inner;
}

export default function SurvivorHome() {
  const { user } = useAuth();
  const { t } = useTranslation('survivorHome');

  const { data: casesData, isLoading: casesLoading } = useQuery<{ data: Case[] }>({
    queryKey: ['my-cases-home'],
    queryFn: async () => {
      const res = await api.get('/cases?limit=3&sort_by=created_at&sort_dir=desc');
      return res.data;
    },
  });

  const recentCases = casesData?.data ?? [];
  const firstName = user?.display_name?.split(' ')[0] || null;

  return (
    <div className="relative space-y-10">
      
      {/* Greeting Header */}
      <section className="relative z-10 animate-fade-in-up">
        <h1 className="font-serif italic text-4.5xl text-heading mb-1.5 leading-tight">
          {firstName ? t('greeting.withName', { name: firstName }) : t('greeting.noName')}
        </h1>
        <p className="text-muted text-sm font-semibold tracking-wide">{t('greeting.subtitle')}</p>
      </section>

      {/* Primary Actions (Liquid Glass Cards) */}
      <section className="relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="animate-stagger-1 flex">
            <ActionCard to="/safe-space/report" icon={FileText}
              title={t('actions.report.title')} description={t('actions.report.description')} cta={t('actions.report.cta')} primary />
          </div>
          <div className="animate-stagger-2 flex">
            <ActionCard to="/safe-space/chat" icon={Scale}
              title={t('actions.chat.title')} description={t('actions.chat.description')} cta={t('actions.chat.cta')} />
          </div>
        </div>
      </section>

      {/* Active Cases List */}
      <section className="relative z-10 animate-stagger-3">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="font-serif italic text-2xl text-heading">{t('cases.heading')}</h2>
          <Link to="/safe-space/cases" className="text-sm text-primary hover:text-primary-hover transition-colors font-bold">
            {t('cases.seeAll')}
          </Link>
        </div>

        {casesLoading ? (
          <div className="flex items-center gap-3 rounded-2xl bg-bg/40 backdrop-blur-md border border-border/50 p-5 shadow-sm">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted font-semibold">{t('cases.loading')}</span>
          </div>
        ) : recentCases.length === 0 ? (
          <div className="rounded-3xl border border-border/50 bg-bg/40 backdrop-blur-md p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted mb-4 font-medium">{t('cases.empty.message')}</p>
            <Link to="/safe-space/report" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-hover transition-colors">
              {t('cases.empty.cta')} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentCases.map((c) => (
              <Link key={c.id} to={`/safe-space/cases/${c.id}`}
                className="group flex items-center justify-between rounded-2xl border border-border/50 bg-bg/30 backdrop-blur-md px-5 py-4 shadow-sm hover:border-primary/30 transition-all duration-200 hover:scale-[1.01] hover-lift">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-heading truncate">{c.title}</p>
                  <p className="text-xs text-placeholder mt-0.5 font-mono">{c.case_number}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <StatusBadge status={c.status as CaseStatus} />
                  <ChevronRight className="h-4 w-4 text-placeholder group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Emergency Resources */}
      <section className="relative z-10 animate-stagger-5">
        <h2 className="font-serif italic text-2xl text-heading mb-3.5">{t('resources.heading')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ResourceCard to="/safe-space/chat" icon={BookOpen} title={t('resources.legalRights.title')} body={t('resources.legalRights.body')} />
          <ResourceCard icon={Phone} title={t('resources.emergency.title')} body={t('resources.emergency.body')} href="tel:8335" />
          <ResourceCard icon={Building2} title={t('resources.localSupport.title')} body={t('resources.localSupport.body')} href="tel:+251111550077" />
          <ResourceCard icon={Handshake} title={t('resources.ewla.title')} body={t('resources.ewla.body')} href="tel:+251115517790" />
        </div>
      </section>
    </div>
  );
}
