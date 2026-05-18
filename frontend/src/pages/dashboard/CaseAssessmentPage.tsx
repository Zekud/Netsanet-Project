// CaseAssessmentPage — staff case detail with floating chat widget.
// Tabbed layout: Details | Evidence | Activity. Right column: actions.
// Uses semantic tokens + Lucide icons + stagger animations.

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Sparkles, Lock, Calendar, MapPin, MessageSquare, X } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader, UrgencyBadge, StatusBadge, Button, Skeleton } from '../../components/ui';
import ReferModal from '../../components/cases/ReferModal';
import ChatPanel from '../../components/cases/ChatPanel';
import CaseTabs from '../../components/cases/assessment/CaseTabs';
import CaseActionPanel from '../../components/cases/assessment/CaseActionPanel';

export interface CaseDetail {
  id: string;
  case_number: string;
  title: string;
  description: string;
  status: 'new' | 'under_review' | 'referred' | 'active' | 'resolved' | 'closed';
  category: 'legal' | 'medical' | 'shelter' | 'counseling' | 'other';
  urgency_level: 'critical' | 'high' | 'medium' | 'low';
  ai_summary: string | null;
  ai_raw_output: { reasoning?: string } | null;
  incident_date: string | null;
  location_text: string | null;
  is_anonymous: boolean;
  survivor_id: string;
  assigned_worker_id: string | null;
  holding_institution_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function CaseAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation('dashboard');

  const [referModalOpen, setReferModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const categoryLabels: Record<string, string> = {
    legal: t('shared.category.legal'), medical: t('shared.category.medical'),
    shelter: t('shared.category.shelter'), counseling: t('shared.category.counseling'),
    other: t('shared.category.other'),
  };

  const { data: caseData, isLoading: caseLoading, isError: caseError } = useQuery<CaseDetail>({
    queryKey: ['case', id],
    queryFn: async () => (await api.get(`/cases/${id}`)).data.data,
    enabled: !!id,
  });

  if (caseLoading) {
    return (
      <div className="relative space-y-6 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }
  if (caseError || !caseData) {
    return (
      <div className="py-20 text-center">
        <h2 className="font-heading text-2xl text-heading mb-2">{t('assessment.notFound.title')}</h2>
        <p className="text-muted mb-4">{t('assessment.notFound.desc')}</p>
        <Button onClick={() => navigate('/dashboard/cases')}>{t('assessment.notFound.back')}</Button>
      </div>
    );
  }

  const isAdmin = user?.role === 'institution_admin' || user?.role === 'system_admin';

  return (
    <div className="relative">
      {/* Background mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="mesh-blob-1 -top-20 -right-40" />
        <div className="mesh-blob-2 top-60 -left-32" />
      </div>

      <div className="relative z-10">
        <PageHeader
          title={caseData.case_number}
          breadcrumb={[t('assessment.breadcrumb'), caseData.case_number]}
          action={
            <Button variant="secondary" onClick={() => navigate('/dashboard/cases')}>
              {t('assessment.back')}
            </Button>
          }
        />

        {/* ─── HEADER CARD (merged quick info) ─── */}
        <div className="animate-stagger-1 mb-6">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm hover-lift">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <StatusBadge status={caseData.status} />
              <UrgencyBadge level={caseData.urgency_level} />
              <span className="rounded-lg bg-inset px-2 py-0.5 text-xs text-muted">
                {categoryLabels[caseData.category] || caseData.category}
              </span>
              {caseData.is_anonymous && (
                <span className="flex items-center gap-1 rounded-lg bg-primary-soft px-2 py-0.5 text-xs text-primary">
                  <Lock className="h-3 w-3" /> {t('assessment.anonymous.title')}
                </span>
              )}
            </div>
            <h2 className="font-heading text-xl text-heading mb-2">{caseData.title}</h2>

            {/* Quick info row */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
              <span>ID: <span className="font-mono text-heading">{caseData.id.slice(0, 8)}…</span></span>
              <span>{t('assessment.quickInfo.created')}: <span className="text-heading">{new Date(caseData.created_at).toLocaleDateString()}</span></span>
              <span>{t('assessment.quickInfo.updated')}: <span className="text-heading">{new Date(caseData.updated_at).toLocaleDateString()}</span></span>
              {caseData.incident_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(caseData.incident_date).toLocaleDateString()}
                </span>
              )}
              {caseData.location_text && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {caseData.location_text}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ─── AI Triage Summary ─── */}
        {caseData.ai_summary && (
          <div className="animate-stagger-2 mb-6">
            <div className="gradient-border p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary animate-glow">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-heading">{t('assessment.aiSummary.title')}</h3>
              </div>
              <p className="text-sm text-body leading-relaxed mb-3">{caseData.ai_summary}</p>
              {caseData.ai_raw_output?.reasoning && (
                <div className="rounded-xl bg-primary-soft border border-primary-muted px-3 py-2">
                  <p className="text-xs font-medium text-primary mb-0.5">{t('assessment.aiSummary.reasoning')}</p>
                  <p className="text-xs text-heading leading-relaxed">{caseData.ai_raw_output.reasoning}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TWO-COLUMN: Tabs + Actions ─── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* LEFT: Tabbed content */}
          <CaseTabs caseId={id!} caseData={caseData} />

          {/* RIGHT: Action panel */}
          <CaseActionPanel caseId={id!} caseData={caseData} isAdmin={isAdmin} setReferModalOpen={setReferModalOpen} />
        </div>
      </div>

      {/* ─── FLOATING CHAT FAB ─── */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
          chatOpen
            ? 'bg-danger text-danger-fg rotate-90 hover:bg-danger/90'
            : 'bg-primary text-primary-fg hover:bg-primary-hover animate-glow'
        }`}
        aria-label={chatOpen ? 'Close chat' : 'Open chat'}
      >
        {chatOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>

      {/* ─── FLOATING CHAT DRAWER ─── */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[360px] max-h-[520px] rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden animate-chat-in">
          {/* Chat header */}
          <div className="flex items-center justify-between border-b border-border-muted bg-inset px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-heading">{t('assessment.messages')}</p>
                <p className="text-[10px] text-muted">{caseData.case_number}</p>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-heading transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Chat body */}
          <div className="h-[440px]">
            <ChatPanel
              caseId={caseData.id}
              currentUserId={user!.id}
              currentUserRole={user!.role}
            />
          </div>
        </div>
      )}

      {/* Refer Modal */}
      {id && caseData && (
        <ReferModal
          caseId={id}
          caseNumber={caseData.case_number}
          isOpen={referModalOpen}
          onClose={() => setReferModalOpen(false)}
        />
      )}
    </div>
  );
}
