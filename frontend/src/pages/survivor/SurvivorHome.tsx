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
      className={`group flex flex-col rounded-2xl p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover-lift ${
        primary
          ? 'bg-primary text-primary-fg shadow-md'
          : 'border border-border bg-surface shadow-sm hover:border-primary/30'
      }`}
    >
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${primary ? 'bg-primary-fg/20' : 'bg-primary-soft text-primary'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className={`font-heading text-lg mb-1 ${primary ? 'text-primary-fg' : 'text-heading'}`}>
        {title}
      </h3>
      <p className={`text-sm leading-relaxed ${primary ? 'text-primary-fg/70' : 'text-muted'}`}>
        {description}
      </p>
      <span className={`mt-4 inline-flex items-center gap-1 text-sm font-medium ${primary ? 'text-primary-fg/80' : 'text-primary'} group-hover:gap-2 transition-all`}>
        {cta} <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

function ResourceCard({ icon: Icon, title, body, href, to }: {
  icon: React.ElementType; title: string; body: string; href?: string; to?: string;
}) {
  const inner = (
    <div className="flex gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-primary/30 hover-lift">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-heading mb-0.5">{title}</p>
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
      {/* Background mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="mesh-blob-1 -top-10 right-0" />
        <div className="mesh-blob-2 top-80 -left-20" />
      </div>

      {/* Greeting */}
      <section className="relative z-10 animate-fade-in-up">
        <h1 className="font-heading text-3xl text-heading mb-1">
          {firstName ? t('greeting.withName', { name: firstName }) : t('greeting.noName')}
        </h1>
        <p className="text-muted text-sm">{t('greeting.subtitle')}</p>
      </section>

      {/* Primary Actions */}
      <section className="relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="animate-stagger-1">
            <ActionCard to="/safe-space/report" icon={FileText}
              title={t('actions.report.title')} description={t('actions.report.description')} cta={t('actions.report.cta')} primary />
          </div>
          <div className="animate-stagger-2">
            <ActionCard to="/safe-space/chat" icon={Scale}
              title={t('actions.chat.title')} description={t('actions.chat.description')} cta={t('actions.chat.cta')} />
          </div>
        </div>
      </section>

      {/* Active Cases */}
      <section className="relative z-10 animate-stagger-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-xl text-heading">{t('cases.heading')}</h2>
          <Link to="/safe-space/cases" className="text-sm text-primary hover:text-primary-hover transition-colors font-medium">
            {t('cases.seeAll')}
          </Link>
        </div>

        {casesLoading ? (
          <div className="flex items-center gap-3 rounded-xl bg-surface border border-border p-4 shadow-sm">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted">{t('cases.loading')}</span>
          </div>
        ) : recentCases.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted mb-3">{t('cases.empty.message')}</p>
            <Link to="/safe-space/report" className="inline-block text-sm font-medium text-primary hover:text-primary-hover transition-colors">
              {t('cases.empty.cta')}
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentCases.map((c) => (
              <Link key={c.id} to={`/safe-space/cases/${c.id}`}
                className="group flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 shadow-sm hover:border-primary/30 transition-all duration-200 hover-lift">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-heading truncate">{c.title}</p>
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

      {/* Resources */}
      <section className="relative z-10 animate-stagger-5">
        <h2 className="font-heading text-xl text-heading mb-3">{t('resources.heading')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ResourceCard to="/safe-space/chat" icon={BookOpen} title={t('resources.legalRights.title')} body={t('resources.legalRights.body')} />
          <ResourceCard icon={Phone} title={t('resources.emergency.title')} body={t('resources.emergency.body')} href="tel:8335" />
          <ResourceCard icon={Building2} title={t('resources.localSupport.title')} body={t('resources.localSupport.body')} href="tel:+251111550077" />
          <ResourceCard icon={Handshake} title={t('resources.ewla.title')} body={t('resources.ewla.body')} href="tel:+251115517790" />
        </div>
      </section>
    </div>
  );
}
