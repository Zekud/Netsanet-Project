// CaseDetailPage — Survivor's view of a single case.
// Route: /safe-space/cases/:id — Fully localized via caseDetail namespace.

import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isCurrent ? 'bg-teal-500 text-white ring-4 ring-teal-100 scale-110' : done ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {done && !isCurrent ? '✓' : i + 1}
              </div>
              <p className={`mt-1.5 text-[10px] text-center w-16 leading-tight ${done ? 'text-teal-700 font-medium' : 'text-gray-400'}`}>{stepLabels[step]}</p>
            </div>
            {i < STATUS_STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 mb-5 ${i < effective ? 'bg-teal-500' : 'bg-gray-100'}`} />}
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
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
      <p className="text-2xl mb-2">👤</p>
      <p className="text-sm font-medium text-dark mb-1">{t('messaging.noWorker.title')}</p>
      <p className="text-xs text-gray-500">{t('messaging.noWorker.body')}</p>
    </div>
  );

  return (
    <div className="flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden" style={{ height: '360px' }}>
      <div className="border-b border-gray-100 px-4 py-2.5 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-teal-500" />
        <p className="text-sm font-medium text-dark">{t('messaging.panelTitle')}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading ? <div className="flex justify-center py-4"><Spinner size="sm" /></div>
          : messages.length === 0 ? <p className="text-center text-xs text-gray-400 py-4">{t('messaging.empty')}</p>
          : messages.map((msg) => {
              const mine = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${mine ? 'rounded-br-sm bg-teal-500 text-white' : 'rounded-bl-sm bg-gray-100 text-dark'}`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${mine ? 'text-teal-100' : 'text-gray-400'}`}>{relativeTime(msg.created_at)}</p>
                  </div>
                </div>
              );
            })}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-gray-100 px-3 py-2 flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (draft.trim()) sendMutation.mutate(draft.trim()); } }}
          placeholder={t('messaging.placeholder')}
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-dark placeholder:text-gray-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500" />
        <button onClick={() => { if (draft.trim()) sendMutation.mutate(draft.trim()); }}
          disabled={!draft.trim() || sendMutation.isPending}
          className="shrink-0 rounded-lg bg-teal-500 px-3 py-2 text-xs font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {sendMutation.isPending ? '…' : t('messaging.send')}
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
    <div className="py-16 text-center">
      <p className="text-2xl mb-2">🔍</p>
      <p className="font-medium text-dark">{t('notFound.message')}</p>
      <Link to="/safe-space/cases" className="mt-3 inline-block text-sm text-teal-600 hover:underline">{t('notFound.back')}</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/safe-space/cases" className="text-xs text-teal-600 hover:underline mb-1 inline-block">{t('backLink')}</Link>
          <h1 className="font-serif text-2xl text-teal-900">{c.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="font-mono text-xs text-gray-400">{c.case_number}</span>
            <StatusBadge status={c.status as CaseStatus} />
            {c.urgency_level && <UrgencyBadge level={c.urgency_level as 'critical' | 'high' | 'medium' | 'low'} />}
          </div>
        </div>
        <Link to={`/safe-space/evidence/${c.id}`}
          className="shrink-0 flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-dark hover:border-teal-300 hover:text-teal-700 transition-colors shadow-sm">
          🔒 {t('evidence.title')}
        </Link>
      </div>

      {/* Status Timeline */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium text-gray-500 mb-4 uppercase tracking-wide">{t('timeline.heading')}</p>
        <StatusTimeline status={c.status} stepLabels={stepLabels} />
        {c.status === 'referred' && <p className="mt-4 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{t('timeline.referred')}</p>}
        {c.status === 'closed' && <p className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{t('timeline.closed')}</p>}
      </div>

      {/* AI Summary */}
      {c.ai_summary && (
        <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">
          <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">{t('aiSummary.heading')}</p>
          <p className="text-sm text-teal-900 leading-relaxed">{c.ai_summary}</p>
          {c.category && <div className="flex gap-2 mt-3"><span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800 capitalize">{c.category}</span></div>}
        </div>
      )}

      {/* Incident Details */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">{t('incidents.heading')}</p>
        <p className="text-sm text-dark leading-relaxed whitespace-pre-wrap">{c.description}</p>
        {(c.incident_date || c.location_text) && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            {c.incident_date && <span>📅 {new Date(c.incident_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
            {c.location_text && <span>📍 {c.location_text}</span>}
          </div>
        )}
      </div>

      {/* Messaging */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">{t('messaging.heading')}</p>
        <MessagingPanel caseId={c.id} assignedWorkerId={c.assigned_worker_id} t={t} />
      </div>

      {/* Activity Timeline */}
      {activities.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-4 uppercase tracking-wide">{t('activities.heading')}</p>
          <ol className="relative border-l border-gray-100 ml-2 space-y-4">
            {activities.map((a) => (
              <li key={a.id} className="ml-4">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-teal-400" />
                <p className="text-sm text-dark">{(t as (k: string) => string)(`activities.${a.activity_type}`) || t('activities.default')}</p>
                <time className="text-xs text-gray-400">{relativeTime(a.created_at)}</time>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Evidence Link */}
      <Link to={`/safe-space/evidence/${c.id}`}
        className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm hover:border-teal-200 hover:shadow-md transition-all">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="text-sm font-medium text-dark">{t('evidence.title')}</p>
            <p className="text-xs text-gray-400">{t('evidence.body')}</p>
          </div>
        </div>
        <span className="text-gray-300">›</span>
      </Link>
    </div>
  );
}
