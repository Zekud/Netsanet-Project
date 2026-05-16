// CaseDetailPage — Survivor's view of a single case.
// Route: /safe-space/cases/:id — Fully localized via caseDetail namespace.
// Uses semantic tokens + Lucide icons.

import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Lock, Calendar, MapPin, Sparkles, Send, UserX, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge, UrgencyBadge, Spinner } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import api from '../../lib/api';

type CaseStatus = 'new' | 'under_review' | 'referred' | 'active' | 'resolved' | 'closed';

interface CaseDetail {
  id: string; case_number: string; title: string; description: string;
  status: string; category: string; urgency_level: string; ai_summary: string;
  incident_date: string | null; location_text: string | null;
  assigned_worker_id: string | null; created_at: string;
}
interface Activity { id: string; activity_type: string; description: string; created_at: string; }
interface Message { id: string; sender_id: string; content: string; created_at: string; }

const STATUS_STEPS = ['new', 'under_review', 'active', 'resolved'];

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function StatusTimeline({ status, stepLabels }: { status: string; stepLabels: Record<string, string> }) {
  const idx = STATUS_STEPS.indexOf(status);
  const effective = idx === -1 ? 0 : idx;
  return (
    <div className="flex items-center w-full">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= effective; const isCurrent = i === effective;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isCurrent ? 'bg-primary text-primary-fg ring-4 ring-primary-soft scale-110' : done ? 'bg-primary text-primary-fg' : 'bg-inset text-placeholder'}`}>
                {done && !isCurrent ? '✓' : i + 1}
              </div>
              <p className={`mt-1.5 text-[10px] text-center w-16 leading-tight ${done ? 'text-primary font-medium' : 'text-placeholder'}`}>{stepLabels[step]}</p>
            </div>
            {i < STATUS_STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 mb-5 rounded-full ${i < effective ? 'bg-primary' : 'bg-inset'}`} />}
          </div>
        );
      })}
    </div>
  );
}

function MessagingPanel({ caseId, assignedWorkerId, t }: {
  caseId: string; assignedWorkerId: string | null; t: (k: string) => string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['case-messages', caseId],
    queryFn: async () => { const r = await api.get(`/cases/${caseId}/messages`); return r.data.data ?? []; },
    enabled: !!assignedWorkerId,
  });

  useEffect(() => {
    if (!assignedWorkerId) return;
    const ch = supabase.channel(`case-msg-${caseId}-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `case_id=eq.${caseId}` },
        (p) => queryClient.setQueryData<Message[]>(['case-messages', caseId], (prev = []) => [...prev, p.new as Message]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [caseId, assignedWorkerId, queryClient]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => api.post(`/cases/${caseId}/messages`, { content }),
    onSuccess: () => { setDraft(''); queryClient.invalidateQueries({ queryKey: ['case-messages', caseId] }); },
  });

  if (!assignedWorkerId) return (
    <div className="rounded-2xl border border-border bg-inset p-6 text-center">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-muted">
        <UserX className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-heading mb-1">{t('messaging.noWorker.title')}</p>
      <p className="text-xs text-muted">{t('messaging.noWorker.body')}</p>
    </div>
  );

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface shadow-sm overflow-hidden" style={{ height: '360px' }}>
      <div className="border-b border-border-muted px-4 py-2.5 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-success" />
        <p className="text-sm font-medium text-heading">{t('messaging.panelTitle')}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading ? <div className="flex justify-center py-4"><Spinner size="sm" /></div>
          : messages.length === 0 ? <p className="text-center text-xs text-placeholder py-4">{t('messaging.empty')}</p>
          : messages.map((msg) => {
              const mine = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${mine ? 'rounded-br-sm bg-chat-mine text-chat-mine-fg' : 'rounded-bl-sm bg-chat-theirs text-chat-theirs-fg'}`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${mine ? 'text-chat-mine-fg/60' : 'text-muted'}`}>{relativeTime(msg.created_at)}</p>
                  </div>
                </div>
              );
            })}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-border-muted px-3 py-2 flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (draft.trim()) sendMutation.mutate(draft.trim()); } }}
          placeholder={t('messaging.placeholder')}
          className="flex-1 rounded-xl border border-border bg-inset px-3 py-2 text-sm text-heading placeholder:text-placeholder focus:border-ring focus:bg-surface focus:outline-none focus:ring-1 focus:ring-ring/20" />
        <button onClick={() => { if (draft.trim()) sendMutation.mutate(draft.trim()); }}
          disabled={!draft.trim() || sendMutation.isPending}
          className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-fg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('caseDetail');

  const stepLabels = {
    new: t('timeline.steps.new'), under_review: t('timeline.steps.under_review'),
    active: t('timeline.steps.active'), resolved: t('timeline.steps.resolved'),
  };

  const { data: caseRes, isLoading } = useQuery<{ data: CaseDetail }>({
    queryKey: ['case-detail', id],
    queryFn: async () => { const r = await api.get(`/cases/${id}`); return r.data; },
    enabled: !!id,
  });
  const { data: activitiesRes } = useQuery<{ data: Activity[] }>({
    queryKey: ['case-activities', id],
    queryFn: async () => { const r = await api.get(`/cases/${id}/activities`); return r.data; },
    enabled: !!id,
  });

  const c = caseRes?.data;
  const activities = activitiesRes?.data ?? [];

  if (isLoading) return <div className="flex items-center justify-center py-24"><Spinner /></div>;

  if (!c) return (
    <div className="py-16 text-center animate-fade-in">
      <p className="font-medium text-heading">{t('notFound.message')}</p>
      <Link to="/safe-space/cases" className="mt-3 inline-block text-sm text-primary hover:text-primary-hover transition-colors">{t('notFound.back')}</Link>
    </div>
  );

  return (
    <div className="relative space-y-6">
      {/* Background mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="mesh-blob-1 -top-10 right-0" />
        <div className="mesh-blob-2 top-60 -left-20" />
      </div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/safe-space/cases" className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors mb-1">
            <ArrowLeft className="h-3 w-3" /> {t('backLink')}
          </Link>
          <h1 className="font-heading text-2xl text-heading">{c.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="font-mono text-xs text-placeholder">{c.case_number}</span>
            <StatusBadge status={c.status as CaseStatus} />
            {c.urgency_level && <UrgencyBadge level={c.urgency_level as 'critical' | 'high' | 'medium' | 'low'} />}
          </div>
        </div>
        <Link to={`/safe-space/evidence/${c.id}`}
          className="shrink-0 flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-heading hover:border-primary/30 hover:text-primary transition-all shadow-sm">
          <Lock className="h-3.5 w-3.5" /> {t('evidence.title')}
        </Link>
      </div>

      {/* Status Timeline */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <p className="text-xs font-medium text-muted mb-4 uppercase tracking-wide">{t('timeline.heading')}</p>
        <StatusTimeline status={c.status} stepLabels={stepLabels} />
        {c.status === 'referred' && <p className="mt-4 text-xs text-warning bg-warning-soft rounded-xl px-3 py-2">{t('timeline.referred')}</p>}
        {c.status === 'closed' && <p className="mt-4 text-xs text-muted bg-inset rounded-xl px-3 py-2">{t('timeline.closed')}</p>}
      </div>

      {/* AI Summary */}
      {c.ai_summary && (
        <div className="rounded-2xl border border-primary-muted bg-primary-soft p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">{t('aiSummary.heading')}</p>
          </div>
          <p className="text-sm text-heading leading-relaxed">{c.ai_summary}</p>
          {c.category && <div className="flex gap-2 mt-3"><span className="rounded-lg bg-primary-muted px-2.5 py-0.5 text-xs font-medium text-primary capitalize">{c.category}</span></div>}
        </div>
      )}

      {/* Incident Details */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <p className="text-xs font-medium text-muted mb-3 uppercase tracking-wide">{t('incidents.heading')}</p>
        <p className="text-sm text-body leading-relaxed whitespace-pre-wrap">{c.description}</p>
        {(c.incident_date || c.location_text) && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
            {c.incident_date && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(c.incident_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
            {c.location_text && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.location_text}</span>}
          </div>
        )}
      </div>

      {/* Messaging */}
      <div>
        <p className="text-xs font-medium text-muted mb-3 uppercase tracking-wide">{t('messaging.heading')}</p>
        <MessagingPanel caseId={c.id} assignedWorkerId={c.assigned_worker_id} t={t} />
      </div>

      {/* Activity Timeline */}
      {activities.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-medium text-muted mb-4 uppercase tracking-wide">{t('activities.heading')}</p>
          <ol className="relative border-l border-border ml-2 space-y-4">
            {activities.map((a) => (
              <li key={a.id} className="ml-4">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-surface bg-accent" />
                <p className="text-sm text-body">{(t as (k: string) => string)(`activities.${a.activity_type}`) || t('activities.default')}</p>
                <time className="text-xs text-placeholder">{relativeTime(a.created_at)}</time>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Evidence Link */}
      <Link to={`/safe-space/evidence/${c.id}`}
        className="group flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-heading">{t('evidence.title')}</p>
            <p className="text-xs text-muted">{t('evidence.body')}</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-placeholder group-hover:text-primary transition-colors" />
      </Link>
    </div>
  );
}
