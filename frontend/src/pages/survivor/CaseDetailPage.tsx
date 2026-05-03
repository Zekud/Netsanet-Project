// CaseDetailPage — Survivor's view of a single case.
// Route: /safe-space/cases/:id
// Shows: status progress timeline, AI summary, activity log,
//        messaging panel with assigned worker, evidence link.

import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge, UrgencyBadge, Spinner } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import api from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────

interface CaseDetail {
  id: string;
  case_number: string;
  title: string;
  description: string;
  status: string;
  category: string;
  urgency_level: string;
  ai_summary: string;
  incident_date: string | null;
  location_text: string | null;
  assigned_worker_id: string | null;
  created_at: string;
}

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────

const STATUS_STEPS = ['new', 'under_review', 'active', 'resolved'];

const SURVIVOR_FRIENDLY: Record<string, string> = {
  case_created: 'Your report was received and secured.',
  status_change: 'Your case status was updated.',
  assigned: 'A case manager was assigned to your case.',
  referral_sent: 'Your case was referred to a specialist team.',
  referral_accepted: 'A new support team accepted your case.',
  referral_rejected: 'The referral was updated — your original team continues.',
  evidence_added: 'Evidence was added to your case.',
  evidence_removed: 'An evidence file was removed.',
  note: 'A note was added by your case team.',
};

function friendlyActivity(type: string): string {
  return SURVIVOR_FRIENDLY[type] ?? 'Your case was updated.';
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ─── Status Timeline ──────────────────────────────────────────

function StatusTimeline({ status }: { status: string }) {
  const currentIndex = STATUS_STEPS.indexOf(status);
  const effectiveIndex = currentIndex === -1 ? 0 : currentIndex;

  const labels: Record<string, string> = {
    new: 'Received',
    under_review: 'Under Review',
    active: 'In Progress',
    resolved: 'Resolved',
  };

  return (
    <div className="flex items-center w-full">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= effectiveIndex;
        const isCurrent = i === effectiveIndex;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-teal-500 text-white ring-4 ring-teal-100 scale-110'
                    : done
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {done && !isCurrent ? '✓' : i + 1}
              </div>
              <p className={`mt-1.5 text-[10px] text-center w-16 leading-tight ${done ? 'text-teal-700 font-medium' : 'text-gray-400'}`}>
                {labels[step]}
              </p>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 ${i < effectiveIndex ? 'bg-teal-500' : 'bg-gray-100'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Messaging Panel ──────────────────────────────────────────

function MessagingPanel({ caseId, assignedWorkerId }: { caseId: string; assignedWorkerId: string | null }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['case-messages', caseId],
    queryFn: async () => {
      const res = await api.get(`/cases/${caseId}/messages`);
      return res.data.data ?? [];
    },
    enabled: !!assignedWorkerId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!assignedWorkerId) return;
    const channel = supabase
      .channel(`case-messages-survivor-${caseId}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `case_id=eq.${caseId}`,
      }, (payload) => {
        queryClient.setQueryData<Message[]>(['case-messages', caseId], (prev = []) => [
          ...prev,
          payload.new as Message,
        ]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [caseId, assignedWorkerId, queryClient]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      await api.post(`/cases/${caseId}/messages`, { content });
    },
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['case-messages', caseId] });
    },
  });

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  if (!assignedWorkerId) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
        <p className="text-2xl mb-2">👤</p>
        <p className="text-sm font-medium text-dark mb-1">No case manager assigned yet</p>
        <p className="text-xs text-gray-500">
          Once a case manager is assigned to your case, you'll be able to message them directly here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden" style={{ height: '360px' }}>
      <div className="border-b border-gray-100 px-4 py-2.5 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-teal-500" />
        <p className="text-sm font-medium text-dark">Message your case manager</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-4"><Spinner size="sm" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-4">No messages yet. Send a message to your case manager.</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                  isMine
                    ? 'rounded-br-sm bg-teal-500 text-white'
                    : 'rounded-bl-sm bg-gray-100 text-dark'
                }`}>
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-teal-100' : 'text-gray-400'}`}>
                    {relativeTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-3 py-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-dark placeholder:text-gray-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sendMutation.isPending}
          className="shrink-0 rounded-lg bg-teal-500 px-3 py-2 text-xs font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sendMutation.isPending ? '…' : 'Send'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: caseRes, isLoading: caseLoading } = useQuery<{ data: CaseDetail }>({
    queryKey: ['case-detail', id],
    queryFn: async () => {
      const res = await api.get(`/cases/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: activitiesRes } = useQuery<{ data: Activity[] }>({
    queryKey: ['case-activities', id],
    queryFn: async () => {
      const res = await api.get(`/cases/${id}/activities`);
      return res.data;
    },
    enabled: !!id,
  });

  const c = caseRes?.data;
  const activities = activitiesRes?.data ?? [];

  if (caseLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!c) {
    return (
      <div className="py-16 text-center">
        <p className="text-2xl mb-2">🔍</p>
        <p className="font-medium text-dark">Case not found</p>
        <Link to="/safe-space/cases" className="mt-3 inline-block text-sm text-teal-600 hover:underline">
          ← Back to my cases
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/safe-space/cases" className="text-xs text-teal-600 hover:underline mb-1 inline-block">
            ← My cases
          </Link>
          <h1 className="font-serif text-2xl text-teal-900">{c.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="font-mono text-xs text-gray-400">{c.case_number}</span>
            <StatusBadge status={c.status} />
            {c.urgency_level && <UrgencyBadge level={c.urgency_level as 'critical' | 'high' | 'medium' | 'low'} />}
          </div>
        </div>
        <Link
          to={`/safe-space/evidence/${c.id}`}
          className="shrink-0 flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-dark hover:border-teal-300 hover:text-teal-700 transition-colors shadow-sm"
        >
          🔒 Evidence
        </Link>
      </div>

      {/* ─── Status Timeline ─────────────────────────────────── */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium text-gray-500 mb-4 uppercase tracking-wide">Case Progress</p>
        <StatusTimeline status={c.status} />
        {c.status === 'referred' && (
          <p className="mt-4 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            ℹ️ Your case has been referred to a specialist team who can better support your needs.
          </p>
        )}
        {c.status === 'closed' && (
          <p className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            This case is now closed. If you need further help, you can submit a new report.
          </p>
        )}
      </div>

      {/* ─── AI Summary ──────────────────────────────────────── */}
      {c.ai_summary && (
        <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">
          <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">What our system noted</p>
          <p className="text-sm text-teal-900 leading-relaxed">{c.ai_summary}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {c.category && (
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800 capitalize">
                {c.category}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ─── Incident Details ────────────────────────────────── */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">What you reported</p>
        <p className="text-sm text-dark leading-relaxed whitespace-pre-wrap">{c.description}</p>
        {(c.incident_date || c.location_text) && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            {c.incident_date && (
              <span>📅 {new Date(c.incident_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            )}
            {c.location_text && <span>📍 {c.location_text}</span>}
          </div>
        )}
      </div>

      {/* ─── Messaging Panel ─────────────────────────────────── */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Message your case manager</p>
        <MessagingPanel caseId={c.id} assignedWorkerId={c.assigned_worker_id} />
      </div>

      {/* ─── Activity Timeline ───────────────────────────────── */}
      {activities.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-4 uppercase tracking-wide">Case Updates</p>
          <ol className="relative border-l border-gray-100 ml-2 space-y-4">
            {activities.map((a) => (
              <li key={a.id} className="ml-4">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-teal-400" />
                <p className="text-sm text-dark">{friendlyActivity(a.activity_type)}</p>
                <time className="text-xs text-gray-400">{relativeTime(a.created_at)}</time>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ─── Evidence Link ───────────────────────────────────── */}
      <Link
        to={`/safe-space/evidence/${c.id}`}
        className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm hover:border-teal-200 hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="text-sm font-medium text-dark">Evidence Locker</p>
            <p className="text-xs text-gray-400">Upload photos, videos, documents, or audio recordings</p>
          </div>
        </div>
        <span className="text-gray-300">›</span>
      </Link>
    </div>
  );
}
